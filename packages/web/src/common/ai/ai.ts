/**
 * AI 通道核心实现模块
 * 
 * 负责：
 * - 统一管理多种 AI 模型提供商（OpenAI、Anthropic、兼容 OpenAI 的模型）
 * - 处理流式和非流式文本生成
 * - 集成 MCP 工具调用功能
 * - 消息格式化和转换
 * - 工具确认和执行流程管理
 */

import { GPT_MODELS_TYPE, HyperChatCompletionTool, MyMessage, Tool_Call } from "../../../../common/data.mjs";
import { createOpenAI } from '@ai-sdk/openai';
import { CoreMessage, generateText, streamText, tool, convertToCoreMessages } from 'ai';
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";
import { jsonSchemaToZod } from "json-schema-to-zod";
import { v4 } from "uuid";
import { createAnthropic } from '@ai-sdk/anthropic';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';


// 跨环境兼容性处理（Node.js vs Browser）
let antdmessage: { warning: (msg: string) => void };
let callModule = {
    getURL_PRE: () => "",
    getWebSocket: () => null,
};

if (process.env.runtime === "node") {
    // Node.js 环境：使用 console.warn
    antdmessage = { warning: console.warn };
} else {
    // 浏览器环境：使用 Ant Design 的 message 组件
    const { message } = await import("antd");
    antdmessage = { warning: message.warning };
    let call = await import("../call");
    callModule.getURL_PRE = call.getURL_PRE;
    callModule.getWebSocket = call.getWebSocket;
}

/**
 * AI 通道类
 * 
 * 封装了与各种 AI 模型提供商的交互逻辑
 * 支持流式生成、工具调用、消息格式化等功能
 */
export class AIChannel {
    aiprovider: any = undefined; // AI SDK 提供商实例
    
    constructor(
        public options: {
            baseURL: string;          // API 基础 URL
            apiKey: string;           // API 密钥
            model?: string;           // 模型名称

            requestType?: "complete" | "stream";     // 请求类型
            allowMCPs?: string[];                    // 允许的 MCP 服务器列表
            temperature?: number;                    // 温度参数
            confirm_call_tool?: boolean;             // 是否需要确认工具调用
            confirm_call_tool_cb?: (tool: Tool_Call) => void;  // 工具调用确认回调
            messages_format_callback?: (messages: MyMessage) => Promise<void>;  // 消息格式化回调
        } & Partial<GPT_MODELS_TYPE>,
        public messages: MyMessage[] = [],   // 消息历史
    ) {

    }
    
    /**
     * 获取最后一条消息
     */
    get lastMessage(): MyMessage {
        return this.messages[this.messages.length - 1];
    }
    
    status: "runing" | "stop" = "stop";  // 运行状态
    /**
     * 文本生成完成方法
     * 
     * @param onUpdate - 更新回调函数
     * @param call_tool - 是否启用工具调用
     * @param step - 递归步数（用于工具调用链）
     * @returns 生成的文本内容
     */
    async completion(
        onUpdate?: () => void,
        call_tool: boolean = true,
        step = 0,
    ): Promise<string> {

        // 根据提供商类型初始化 AI 客户端
        if (this.options.provider == "openai") {
            this.aiprovider = createOpenAI({
                compatibility: 'strict', // 严格模式，启用 OpenAI API 兼容性
                baseURL: this.options.baseURL,
                apiKey: this.options.apiKey,
            });

        } else if (this.options.provider == "anthropic") {
            this.aiprovider = createAnthropic({
                // baseURL: this.options.baseURL,  // Anthropic 不支持自定义 baseURL
                apiKey: this.options.apiKey,
            });
        } else {
            // 兼容 OpenAI 的其他提供商
            this.aiprovider = createOpenAICompatible({
                name: this.options.model,
                baseURL: this.options.baseURL,
                apiKey: this.options.apiKey,
            });
        }
        
        // 格式化消息历史
        let messages = (await this.messages_format(this.messages)).slice();
        console.log("messages", messages);
        
        // 获取可用的工具列表
        let tools: HyperChatCompletionTool[];
        if (!call_tool || this.options.supportTool === false) {
            tools = undefined;
        } else {
            try {
                // 从全局获取可用工具（基于允许的 MCP 服务器）
                tools = globalThis.getTools(this.options.allowMCPs);
            } catch (e) {
                tools = []
            }

            if (tools.length == 0) {
                tools = undefined;
            }
        }

        // 转换工具格式为 AI SDK 兼容格式
        let aiTools = tools && this.tools_format(tools);
        
        // 开始流式文本生成
        const { response, fullStream, usage, finishReason } = await streamText({
            model: this.aiprovider(this.options.model),
            maxSteps: this.options.call_tool_step || 10,
            temperature: this.options.temperature == null ? 1 : this.options.temperature,
            messages: messages,
            tools: aiTools,
            onError: (error) => {
                console.error(error);
            }
        });
        let res: MyMessage = {
            role: "assistant",
            content: "" as any,
            reasoning_content: "",
            content_tool_calls: [],
            content_status: "loading",
            content_attachment: [],
            content_usage: {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
            },
            content_date: Date.now(),
        };




        onUpdate && onUpdate();
        let index = 0;
        let first = false;
        for await (let full of fullStream) {
            console.log(full);
            if (full.type == 'step-start') {
                res = {
                    role: "assistant",
                    content: "" as any,
                    reasoning_content: "",
                    content_tool_calls: [],
                    content_status: "loading",
                    content_attachment: [],
                    content_usage: {
                        prompt_tokens: 0,
                        completion_tokens: 0,
                        total_tokens: 0,
                    },
                    content_date: Date.now(),
                };
                this.messages.push(res);
                res.content_status = "success";
                res.content_status = "dataLoading";
                onUpdate && onUpdate();
            }
            if (full.type == 'text-delta') {
                res.content += full.textDelta;
                onUpdate && onUpdate();
            }
            if ((full as any).type == "tool-call") {
                let tool = tools.find((x) => x.function.name === (full as any).toolName);
                res.content_tool_calls.push({
                    index: index++,
                    id: (full as any).toolCallId,
                    type: "function",
                    origin_name: tool.origin_name,
                    restore_name: tool.restore_name,
                    function: {
                        name: tool.function.name,
                        arguments: JSON.stringify((full as any).args),
                        argumentsOBJ: (full as any).args,
                    }
                });
                onUpdate && onUpdate();
            }
            if ((full as any).type == "tool-result") {
                let res = (full as any).result;
                res = {
                    role: "tool" as const,
                    tool_call_id: (full as any).toolCallId,
                    content: res.content,
                    content_status: res.isError ? "error" : "success",
                    content_attachment: [],
                    content_date: Date.now(),
                };
                this.messages.push(res);
                onUpdate && onUpdate();
            }

        }

        res.content_status = "dataLoadComplete";
        const usageData = await usage;
        res.content_usage = {
            prompt_tokens: usageData.promptTokens || 0,
            completion_tokens: usageData.completionTokens || 0,
            total_tokens: usageData.totalTokens || 0
        };
        let msgs = (await response).messages;
        console.log("messages", msgs);
        onUpdate && onUpdate();
        return res.content.toString();
    }
    cancel() {
        // if (this.abortController) {
        //     this.abortController.abort();
        //     this.abortController = null;
        // }
        // if (this.mcpAbortController) {
        //     this.mcpAbortController.abort();
        //     this.mcpAbortController = null;
        // }
        this.status = "stop";
    }
    addMessage(
        message: MyMessage,
        resourceResList: Array<MCPTypes.ReadResourceResult> = [],
        promptResList: Array<MCPTypes.GetPromptResult> = [],
    ) {
        if (resourceResList.length > 0) {
            message.content = [
                {
                    type: "text",
                    text: message.content.toString() as string,
                },
            ];

            for (let r of resourceResList) {
                for (let content of r.contents) {
                    if (content.text) {
                        message.content.push({
                            type: "text",
                            text: content.text.toString() as string,
                        });
                    } else if (content.type == "image") {
                        message.content.push({
                            type: "image_url",
                            image_url: { url: content.blob },
                        } as any);
                    } else {
                        antdmessage.warning("resource only supports text + images.");
                    }
                }
            }
        }
        this.messages.push(message);
        if (promptResList.length > 0) {
            for (let p of promptResList) {
                for (let m of p.messages) {
                    if (m.content.type == "text") {
                        this.messages.push({
                            role: m.role,
                            content: m.content.text as string,
                            content_from: p.call_name as string,
                            content_attachment: [],
                            content_date: Date.now(),
                        });
                    } else if (m.content.type == "resource") {
                        if (m.content.resource.text) {
                            this.messages.push({
                                role: m.role,
                                content: m.content.resource.text as string,
                                content_from: p.call_name as string,
                                content_attachment: [],
                                content_date: Date.now(),
                            });
                        } else if (
                            m.content.resource.blob &&
                            m.content.resource?.mimeType.startsWith("image")
                        ) {
                            if (m.role == "user") {
                                this.messages.push({
                                    role: m.role as "user",
                                    content: [
                                        {
                                            type: "image_url",
                                            image_url: { url: m.content.resource.blob } as any,
                                        },
                                    ],
                                    content_from: p.call_name as string,
                                    content_attachment: [],
                                    content_date: Date.now(),
                                });
                            } else {
                                antdmessage.warning(
                                    "openai only user role support submit image.",
                                );
                            }
                        } else {
                            antdmessage.warning("resource only supports text + images.");
                        }
                    } else {
                        antdmessage.warning("prompt only supports text + resource.");
                    }
                }
            }
        }

        return this;
    }
    async messages_format(messages: MyMessage[]): Promise<CoreMessage[]> {
        let obj = {};
        let core_messages: CoreMessage[] = [];
        for (let m of messages) {
            let core = {
                role: m.role,
                content: [],
            }
            this.options.messages_format_callback && await this.options.messages_format_callback(m);
            let {
                content_attachment,
                content_attached,
                content_context,
                content_from,
                content_status,
                content_usage,
                reasoning_content,
                content_error,
                content_date,
                content_sended,
                content_template,
                content_tool_calls,
                ...rest
            } = m;
            if (rest.role === "user" || rest.role == "system") {
                core.content = m.content as any;
                core_messages.push(core as any)
            } else if (rest.role == "assistant") {
                if (rest.content.toString() != "") {
                    core.content.push({
                        type: 'text', text: rest.content.toString() as string,
                    });
                }
                content_tool_calls?.map((x: Tool_Call) => {
                    let { origin_name, restore_name, ...rest } = x;
                    let { argumentsOBJ, ...functionRest } = rest.function;
                    rest.function = functionRest as any;
                    obj[x.id] = rest.function.name;
                    core.content.push({
                        type: "tool-call",
                        toolCallId: x.id,
                        args: argumentsOBJ,
                        toolName: rest.function.name,
                    });
                });
                core_messages.push(core as any)
            } else if (rest.role == "tool") {
                core.content.push({
                    "type": "tool-result",
                    "toolCallId": m.tool_call_id,
                    "toolName": obj[m.tool_call_id],
                    "result": JSON.stringify(m.content)
                })
                core_messages.push(core as any)
            }
        }

        return core_messages;
    }
    tools_format(tools: HyperChatCompletionTool[]) {
        let toolsObj = {

        };
        tools?.forEach((x) => {
            let { origin_name, restore_name, key, client, clientName, ...rest } = x;
            if (this.options.isStrict) {
                rest.function.strict = true;
                rest.function.parameters = formatProperties(rest.function.parameters, false);
            } else {
                delete rest.function.strict;
                rest.function.parameters = formatProperties(rest.function.parameters, true);
            }
            let zod = jsonSchemaToZod(rest.function.parameters);
            toolsObj[rest.function.name] = tool({
                description: rest.function.description,
                parameters: eval(zod),
                experimental_toToolResultContent(res: any) {
                    // return typeof result === 'string'
                    //     ? [{ type: 'text', text: result }]
                    //     : [{ type: 'image', data: result.data, mimeType: 'image/png' }];
                    if (res.isError) {
                        return res;
                    }
                    return (res as any).content;
                },
                execute: async (parameters, options) => {
                    let res = {
                        isError: false,
                        content: undefined as any,
                    }
                    if (process.env.runtime !== "node") {
                        if (
                            this.options.confirm_call_tool &&
                            this.options.confirm_call_tool_cb
                        ) {
                            try {
                                parameters = await this.options.confirm_call_tool_cb({
                                    index: 0,
                                    id: options.toolCallId,
                                    type: "function",
                                    origin_name: origin_name,
                                    restore_name: restore_name,
                                    function: {
                                        name: rest.function.name,
                                        arguments: JSON.stringify(parameters),
                                        argumentsOBJ: parameters,
                                    }
                                });
                            } catch (e) {
                                res.isError = true;
                                res.content = "this tool call canceled by user.";
                                return res;
                            }

                        }
                    }

                    let call_res = await globalThis.ext2.call(
                        "mcpCallTool",
                        [clientName, origin_name, parameters],

                    ).then((res) => {

                        if (res["isError"]) {
                            return {
                                isError: true,
                                result: res
                            }
                        } else {
                            return {
                                isError: false,
                                result: res
                            }
                        }
                    }).catch((e) => {
                        return {
                            isError: true,
                            result: e.toString()
                        }
                    });
                    if (res.isError) {
                        return res;
                    }
                    if (Array.isArray(call_res.result.content)) {
                        let contents = []
                        for (let c of call_res.result.content) {
                            if (c.type == "text") {
                                contents.push({ type: "text", text: c.text });
                            } else if (c.type == "image") {
                                contents.push(c);
                            } else {
                                antdmessage.warning("tool 返回类型只支持 text image");
                            }
                        }
                        res.content = contents;
                        return res;
                    } else {
                        res.content = [{ type: "text", text: JSON.stringify(call_res.result) }];
                        return res;
                    }

                },
            })
        });

        return toolsObj;
    }
}


export function formatProperties(obj: any, delAdditionalProperties: boolean) {

    if (obj == null) {
        return {
            compatible: {
                type: "string",
                description: "ignore, no enter", // compatible gemini-openai
            },
        };
    }

    try {
        // 处理对象类型
        if (obj.type === "object") {
            // 递归处理所有属性
            if (obj.properties) {
                for (const key in obj.properties) {
                    const item = obj.properties[key];
                    if (!item) continue;

                    if (item.type === "object") {
                        obj.properties[key] = formatProperties(item, delAdditionalProperties);
                    } else if (item.type === "array" && item.items) {
                        obj.properties[key].items = formatProperties(item.items, delAdditionalProperties);
                    }
                }
            }

            // 删除不需要的属性
            if (delAdditionalProperties && obj.additionalProperties !== undefined) {
                delete obj.additionalProperties;
            }

            // 对象类型不应该有items属性，删除它
            delete obj.items;
        }
        // 处理数组类型
        else if (obj.type === "array") {
            // 递归处理数组项
            if (obj.items) {
                obj.items = formatProperties(obj.items, delAdditionalProperties);

                // 删除数组项中的additionalProperties
                if (delAdditionalProperties && obj.items.additionalProperties !== undefined) {
                    delete obj.items.additionalProperties;
                }
            }

            // 数组类型不应该有properties属性，删除它
            delete obj.properties;
        }
    } catch (e) {
        console.error(e);
    }
    // console.log(obj);
    return obj;
}
