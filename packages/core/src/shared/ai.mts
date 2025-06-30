
import type { HyperChatCompletionTool } from "./data.mjs";
// import { call, getURL_PRE, getWebSocket } from "./call";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import type { CoreMessage, LanguageModel, StreamTextResult, ToolChoice, CoreTool, ToolSet } from 'ai';
import { jsonSchema, streamText } from 'ai';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { jsonSchemaToZod } from "json-schema-to-zod";
import { z } from "zod";
globalThis["z"] = z; // 兼容旧版本的 zod


import { v4 } from "uuid";
import dayjs from "dayjs";
// import { isOnBrowser } from "./const";
import { AI_MODELS, type AIModelConfigItem, type MyMessage, type Tool_Call } from "./data.mjs";
import { extractTool } from "./prompt";




const deviceId = v4();
export class AiChannel {
  get lastMessage(): MyMessage {
    if (!this.messages || this.messages.length === 0) {
      throw new Error("No messages found");
    } else {
      return this.messages[this.messages.length - 1]!;
    }
  }
  private abortController: AbortController | null = null;
  private mcpAbortController: AbortController | null = null;

  constructor(
    public options?: {

    },
    public messages: MyMessage[] = [],
  ) {
  }
  addMessage(
    message: MyMessage,
    resourceResList: Array<MCPTypes.ReadResourceResult> = [],
    promptResList: Array<MCPTypes.GetPromptResult> = [],
  ) {
    if (resourceResList.length > 0) {
      if (message.content == "" || message.content == null) {
        message.content = [];
      } else {
        message.content = [
          {
            type: "text",
            text: message.content.toString() as string,
          },
        ];
      }
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
            this.ext.antdmessage.warning("resource only supports text + images.");
          }
        }
      }
    }
    this.messages.push(message);

    return this;
  }
  // 取消当前请求
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.mcpAbortController) {
      this.mcpAbortController.abort();
      this.mcpAbortController = null;
    }
    this.status = "stop";
  }
  index = 0;
  status: "runing" | "stop" = "stop";
  async completion(
    params: {
      modelKey: string;
      allowMCPs: string[],
      onUpdate?: () => void;
      call_tool?: boolean;
      confirm_call_tool?: boolean;  // 默认当成false
      confirm_call_tool_cb?: (tool: Tool_Call) => Promise<boolean>;
    },
    options: Omit<Parameters<typeof streamText>[0], 'model' | 'prompt'> = {},
  ): Promise<string> {
    this.status = "runing";
    this.index++;
    let newParams = {
      ...params,
      context: { index: this.index },
      step: 0,
    }
    let res = await this._completion(newParams, options).catch((e) => {
      this.status = "stop";
      throw e;
    });
    this.status = "stop";
    return res;
  }
  async _completion(
    params: {
      modelKey: string;
      allowMCPs: string[],
      onUpdate?: () => void;
      call_tool?: boolean;
      step: number;
      context: {},
      confirm_call_tool?: boolean;  // 默认当成false
      confirm_call_tool_cb?: (tool: Tool_Call) => Promise<boolean>;
    },
    options: Omit<Parameters<typeof streamText>[0], 'model' | 'prompt'> = {},
  ): Promise<string> {

    if (this.status == "stop") {
      throw new Error("User Cancel Requesting");
    }
    await AI_MODELS.init();
    let modelConfig = AI_MODELS.get().data.find((x) => x.key === params.modelKey);
    if (!modelConfig) {
      throw new Error(`Model not found: ${params.modelKey}`);
    }

    this.abortController = new AbortController();
    let newMessage: MyMessage = {
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

    let messages = this.messages.filter(
      (m) => m.content_attached == null || m.content_attached == true,
    );
    this.messages.push(newMessage as any);
    params.onUpdate && params.onUpdate();

    let format_message = await this.messages2core(messages);
    options.messages = format_message;

    let tools: HyperChatCompletionTool[] = this.ext.mcpTools || [];
    const aiTools = this.tools_format_ai(tools || []);
    options.tools = {
      ...options.tools,
      ...aiTools,
    }
    try {


      let ai: any = null;
      let fetch: any = undefined;
      if (this.ext.platform === "web") {
        let baseURL = modelConfig.baseURL;
        modelConfig.baseURL = this.ext.getURL_PRE() + "api/ai";
        fetch = async (url: RequestInfo, init?: RequestInit): Promise<Response> => {
          // If in a browser environment and server proxy is enabled, modify headers for proxying.
          init = {
            ...init,
            headers: {
              ...(init?.headers || {}),
              baseURL: encodeURIComponent(baseURL), // Encode base URL for proxy
            },
          };

          return globalThis.fetch(url, init);
        };
      }
      if (modelConfig.provider === 'anthropic') {
        ai = createAnthropic({
          baseURL: modelConfig.baseURL,
          apiKey: modelConfig.apiKey,
          fetch
        });
      } else if (modelConfig.provider === 'gemini') {
        ai = createGoogleGenerativeAI({
          baseURL: modelConfig.baseURL,
          apiKey: modelConfig.apiKey,
          fetch
        });
      } else if (modelConfig.provider === 'openrouter') {
        // 默认使用 OpenAI 兼容格式
        ai = createOpenRouter({
          baseURL: modelConfig.baseURL,
          apiKey: modelConfig.apiKey,
          fetch
        });
      } else if (modelConfig.provider === 'openai') {
        ai = createOpenAI({
          baseURL: modelConfig.baseURL,
          apiKey: modelConfig.apiKey,
          fetch
        });
      } else {
        ai = createOpenAICompatible({
          name: modelConfig.model,
          baseURL: modelConfig.baseURL,
          apiKey: modelConfig.apiKey,
          fetch
        });
      }
      // options.model = ai(modelConfig.model);
      let newOptions: Parameters<typeof streamText>[0] = {
        ...options,
        model: ai(modelConfig.model),
      }
      const result = await streamText({
        ...newOptions,
        abortSignal: this.abortController.signal,
      });

      this.lastMessage.content_status = "success";
      this.lastMessage.content_status = "dataLoading";
      params.onUpdate && params.onUpdate();
      let toolIndex = 0;
      for await (const delta of result.fullStream) {
        console.log("delta", delta);
        if (delta.type == "error") {
          throw delta.error;
        }
        if (delta.type == "text-delta") {
          newMessage.content += (delta.textDelta || "");
          newMessage.content_date = Date.now();
        }
        if (delta.type == "reasoning") {
          newMessage.reasoning_content += (delta.textDelta || "");
          newMessage.content_date = Date.now();
        }
        if (delta.type == "tool-call") {
          newMessage.content_tool_calls = newMessage.content_tool_calls || [];
          let localTool = this.ext.mcpTools.find(
            (t) => t.name === delta.toolName
          );
          if (!localTool) {
            this.ext.antdmessage.warning(
              `Tool ${delta.toolName} not found in MCP tools.`,
            );
            continue;
          }

          newMessage.content_tool_calls.push({
            index: toolIndex++,
            id: delta.toolCallId,
            type: "function",
            function: {
              name: delta.toolName,
              args: delta.args || {},
            },
            origin_name: localTool.origin_name,
            restore_name: localTool.restore_name,
          });
        }
        if (delta.type == "step-finish") {
          if (delta.usage) {
            newMessage.content_usage = {
              prompt_tokens: delta.usage.promptTokens || 0,
              completion_tokens: delta.usage.completionTokens || 0,
              total_tokens: delta.usage.totalTokens || 0,
            }
          }
        }
        params.onUpdate && params.onUpdate();
      }

      params.onUpdate && params.onUpdate();

    } catch (e) {
      this.lastMessage.content_status = "error";
      params.onUpdate && params.onUpdate();
      throw e;
    }
    this.lastMessage.content_status = "dataLoadComplete";
    this.lastMessage.content_date = Date.now();

    params.onUpdate && params.onUpdate();

    // if (this.options.toolMode == "compatible" && (this.lastMessage.content.toString()).includes("<tool_use>")) {
    //   let res = extractTool(this.lastMessage.content.toString());
    //   if (res) {
    //     tool_calls.push({
    //       index: 0,
    //       id: "call_compatible" + "_" + v4().slice(0, 8),
    //       type: "function",
    //       function: {
    //         name: res.name,
    //         arguments: JSON.stringify(res.params),
    //         argumentsOBJ: res.params,
    //       }
    //     });
    //     // this.lastMessage.content = "";
    //   }
    // }

    params.onUpdate && params.onUpdate();
    // console.log("tool_calls", tool_calls, call_tool);
    if (newMessage.content_tool_calls && newMessage.content_tool_calls.length > 0) {
      for (let tool of newMessage.content_tool_calls) {
        try {
          if (typeof tool.function.args != "object") {
            tool.function.args = {} as any;
          }
        } catch {
          tool.function.args = {} as any;
        }
        if (process.env.runtime !== "node") {
          if (
            params.confirm_call_tool &&
            params.confirm_call_tool_cb
          ) {
            try {
              tool.function.args = await params.confirm_call_tool_cb(tool);
            } catch (e) {

              let message: MyMessage = {
                role: "tool" as const,
                tool_call_id: tool.id,
                content: "this tool call canceled by user.",
                content_status: "error",
                content_attachment: [],
                content_date: Date.now(),
              };
              this.messages.push(message as any);
              params.onUpdate && params.onUpdate();
              continue;
            }

          }
        }


        // console.log("tool_calls", tool_calls);
        // let localtool = tools.find(
        //   (t) => t.name === tool.function.name,
        // );
        // let clientName = localtool?.clientName;
        // let clientName = "";
        // if (!clientName) {
        //   console.error("client not found", tool);
        //   throw new Error("client not found");
        // }

        let message: MyMessage = {
          role: "tool" as const,
          tool_call_id: tool.id,
          tool_call_name: tool.function.name,
          content: [],
          content_status: "loading",
          content_attachment: [],
          content_date: Date.now(),
        };
        this.messages.push(message as any);
        params.onUpdate && params.onUpdate();
        // if (process.env.runtime !== "node") {
        //   try {
        //     if (
        //       clientName === "hyper_agent" &&
        //       localtool.origin_name == "call_agent"
        //     ) {
        //       (await callModule.getWebSocket()).emit("active", deviceId);
        //     }
        //   } catch (e) {
        //     console.error(e);
        //   }
        // }
        let localTool = this.ext.mcpTools.find(
          (t) => t.name === tool.function.name
        );
        if (!localTool) {
          this.ext.antdmessage.warning(
            `Tool ${tool.function.name} not found in MCP tools.`,
          );
          continue;
        }
        this.mcpAbortController = new AbortController();
        let call_res = await globalThis.ext2.call(
          "mcpCallTool",
          {
            name: localTool?.clientName || "",
            functionName: localTool.origin_name,
            args: tool.function.args || {},
          },
          {
            signal: this.mcpAbortController?.signal,
          },
        )
          .then((res) => {
            if (res["isError"]) {
              this.lastMessage.content_status = "error";
              params.onUpdate && params.onUpdate();
              return res;
            } else {
              this.lastMessage.content_status = "success";
              params.onUpdate && params.onUpdate();
              return res;
            }
          })
          .catch((e) => {
            this.lastMessage.content_status = "error";
            params.onUpdate && params.onUpdate();
            return {
              content: { error: e.message },
            };
          });
        // console.log("call_response: ", call_res);

        if (call_res.content == null) {
          this.lastMessage.content = JSON.stringify(call_res);
        } else if (typeof call_res.content == "string") {
          this.lastMessage.content = call_res.content;
        } else if (Array.isArray(call_res.content)) {
          this.lastMessage.content = [];
          for (let c of call_res.content) {
            if (c.type == "text") {
              this.lastMessage.content.push({
                type: "text",
                text: c.text,
              })
            } else if (c.type == "image") {
              // this.lastMessage.content_attachment.push(c);
              this.lastMessage.content.push({
                type: "image",
                image_url: { url: c.blob },
              } as any)
            } else {
              this.ext.antdmessage.warning("tool 返回类型只支持 text image");
            }
          }
        } else {
          this.lastMessage.content = "error: tool call return type not supported";
        }

        params.onUpdate && params.onUpdate();
      }
      params.step++;
      return await this._completion(

        params, options,
      );
    } else {
      // console.log("this.messages", this.messages);
      return newMessage.content as string;
    }
  }
  ext: {
    antdmessage: { warning: (string) => void };
    mcpTools: HyperChatCompletionTool[];
    platform: "nodejs" | "web";
    getURL_PRE: () => string;
  } = {} as any;
  register(ext: this["ext"]) {
    this.ext = ext;
  }
  // getRelay(index: number) {
  //   let assistantContent = [];
  //   if (this.messages[index].role == "user") {
  //     index++;
  //   }
  //   while (this.messages.length > index) {
  //     let m = this.messages[index];
  //     if (m.role == "user") {
  //       break;
  //     } else if (m.role == "assistant") {
  //       if (typeof m.content == "string") {
  //         assistantContent.push(m.content);
  //       } else if (Array.isArray(m.content)) {
  //         for (let c of m.content) {
  //           if (c.type == "text") {
  //             assistantContent.push(c.text);
  //           } else if (c.type == "refusal") {
  //             assistantContent.push(c.refusal);
  //           } else {
  //             console.warn("tool 返回类型只支持 text");
  //           }
  //         }
  //       }
  //     }
  //     index++;
  //   }
  //   return assistantContent.join("\n").split("\n").filter((x) => x).join("\n");
  // }

  async completionParse(response_format: any): Promise<any> {
    // 使用工具调用来实现结构化输出
    // const tool: CoreTool = {
    //   description: 'Parse response according to schema',
    //   parameters: response_format.json_schema?.schema || response_format,
    // };

    // const result = await this.aiProvider.streamText({
    //   model: this.aiProvider.model,
    //   messages: await this.messages_format_ai(this.messages),
    //   tools: { parse_response: tool },
    //   toolChoice: { type: 'tool', toolName: 'parse_response' },
    //   temperature: this.options.temperature,
    // });

    // const toolCalls = await result.toolCalls;
    // if (toolCalls && toolCalls.length > 0) {
    //   return toolCalls[0].args;
    // }

    // throw new Error('No structured output received');
  }
  // clear() {
  //   this.messages = this.messages.filter((m) => m.role === "system");
  //   this.totalTokens = 0;
  // }
  async testBase() {
    // let messages: CoreMessage[] = [{ role: "user", content: "你是谁?" }];
    // const result = await streamText({
    //   model: this.aiProvider.model,
    //   messages: messages,
    // });
    // const text = await result.text;
    // console.log(text);
  }
  async testImage() {
    // let messages: CoreMessage[] = [
    //   {
    //     role: "user",
    //     content: [
    //       {
    //         type: "image",
    //         image: imageBase64,
    //       },
    //       {
    //         type: "text",
    //         text: "这是什么图片",
    //       },
    //     ],
    //   },
    // ];
    // const result = await this.aiProvider.streamText({
    //   model: this.aiProvider.model,
    //   messages: messages,
    // });
    // const text = await result.text;
    // console.log(text);
  }
  async testTool() {
    // const tools = {
    //   current_time: {
    //     description: "Get the current local time as a string.",
    //     parameters: {
    //       type: "object",
    //       properties: {},
    //     },
    //   } as CoreTool,
    // };

    // let messages: CoreMessage[] = [
    //   {
    //     role: "user",
    //     content: "hello, What's the time?",
    //   },
    // ];

    // const result = await this.aiProvider.streamText({
    //   model: this.aiProvider.model,
    //   messages: messages,
    //   tools,
    // });

    // const toolCalls = await result.toolCalls;
    // if (toolCalls && toolCalls.length > 0) {
    //   const toolCall = toolCalls[0];
    //   console.log(toolCall.toolName, toolCall.args);

    //   const timeResult = dayjs().format("YYYY-MM-DD HH:mm:ss");

    //   messages.push({
    //     role: "assistant",
    //     content: await result.text,
    //   });

    //   messages.push({
    //     role: "tool",
    //     content: [
    //       {
    //         type: "tool-result",
    //         toolCallId: toolCall.toolCallId,
    //         toolName: toolCall.toolName,
    //         result: timeResult,
    //       },
    //     ],
    //   });

    //   const finalResult = await this.aiProvider.streamText({
    //     model: this.aiProvider.model,
    //     messages: messages,
    //     tools,
    //   });

    //   console.log(await finalResult.text);
    // }
  }
  async messages2core(messages: MyMessage[]): Promise<CoreMessage[]> {
    let results: CoreMessage[] = [];

    for (let m of messages) {
      // results.push(m as CoreMessage);

      //   let content = m.content;

      //   // 处理数组形式的 content (多模态)
      //   if (Array.isArray(content)) {
      //     const parts = content.map(part => {
      //       if (part.type === 'text') {
      //         return { type: 'text' as const, text: part.text };
      //       } else if (part.type === 'image_url') {
      //         return { type: 'image' as const, image: part.image_url.url };
      //       }
      //       return part;
      //     });
      //     content = parts;
      //   }




      if (m.role === 'tool') {
        results.push({
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: m.tool_call_id || "",
              toolName: m.tool_call_name || "", // 需要从工具调用历史中获取
              result: m.content as string,
            },
          ],
        });
      } else if (m.role === 'system') {
        results.push({
          role: 'system',
          content: m.content as string,
        });
      } else if (m.role === 'user' || m.role === 'assistant') {
        let content: any[] = []
        if (typeof m.content === 'string') {
          content.push({ type: 'text', text: m.content });
        } else if (Array.isArray(m.content)) {
          for (let c of m.content) {
            content.push(c)
          }
        } else {
          throw new Error(`Unsupported content type: ${typeof m.content}`);
        }
        if (m.content_tool_calls && m.content_tool_calls.length > 0) {
          for (let toolCall of m.content_tool_calls) {
            let toolCallId = toolCall.id || v4();
            content.push({
              args: toolCall.function.args || {},
              toolCallId: toolCallId,
              toolName: toolCall.function.name,
              type: "tool-call",
            } as any);
          }
        }
        results.push({
          role: m.role as "user" | "assistant",
          content: content as any,
        });
      }
    }
    return results;
  }

  // 保持原有格式化方法用于兼容性
  async messages_format(messages: MyMessage[]): Promise<any[]> {
    return [];
    // let results = []
    // for (let m of messages) {
    //   // this.options.messages_format_callback && await this.options.messages_format_callback(m);
    //   let {
    //     content_attachment,
    //     content_attached,
    //     content_context,
    //     content_from,
    //     content_status,
    //     content_usage,
    //     reasoning_content,
    //     content_error,
    //     content_date,
    //     content_sended,
    //     content_template,
    //     content_tool_calls,
    //     ...rest
    //   } = m;
    //   if (rest.role == "assistant") {
    //     rest.tool_calls = content_tool_calls?.map((x: Tool_Call) => {
    //       let { origin_name, restore_name, ...rest } = x;
    //       let { argumentsOBJ, ...functionRest } = rest.function;
    //       rest.function = functionRest as any;
    //       return rest;
    //     }) as any;
    //     if (rest.tool_calls?.length == 0) {
    //       delete rest.tool_calls;
    //     }
    //   }
    //   if (rest.content == "") {
    //     delete rest.content;
    //   }
    //   results.push(rest);
    // }
    // return results;
  }
  tools_format_ai(tools: HyperChatCompletionTool[]): ToolSet {
    const result: ToolSet = {};

    for (const tool of tools) {
      result[tool.name] = {
        description: tool.description || '',
        parameters: tool.inputSchema == null ? undefined : eval(jsonSchemaToZod(tool.inputSchema as any)),
      };
    }

    return result;
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
