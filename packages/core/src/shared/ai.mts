
import type { HyperChatCompletionTool, MyMessage, Tool_Call, AIModelConfigItem, CommonContentItem } from "./types.mjs";

import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import type { CoreMessage, LanguageModel, StreamTextResult, ToolChoice, CoreTool, ToolSet, TextPart, FilePart, ToolCallPart, ImagePart } from 'ai';
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
import { AI_MODELS } from "./data.mjs";
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
    resourceResList: Array<CommonContentItem> = [],
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
      for (let content of resourceResList) {

        if (content.type == "text") {
          message.content.push({
            type: "text",
            text: content.text.toString() as string,
          });
        } else if (content.type == "image_url") {
          message.content.push({
            type: "image_url",
            image_url: { url: content.image_url.url },
          });
        } else {
          this.ext.antdmessage.warning("resource only supports text + images.");
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
      content: "",
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
    this.messages.push(newMessage);
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
        modelConfig.baseURL = this.ext.getURL_PRE() + "/ai";
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
            tool.function.args = {};
          }
        } catch {
          tool.function.args = {};
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
              this.messages.push(message);
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
        this.messages.push(message);
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
        let call_res: MCPTypes.CallToolResult = await globalThis.ext.call(
          "mcpCallToolWithWorkspace",
          {
            name: localTool?.clientName || "",
            functionName: localTool.origin_name,
            args: tool.function.args || {},
            workspacePath: localTool.workspacePath,
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
              this.lastMessage.content.push({
                type: "image_url",
                image_url: { url: `data:${c.mimeType};base64,${c.data}` },
              })
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
  } = {
    antdmessage: {
      warning: (msg) => {
        console.warn(msg);
      },
    },
    mcpTools: [],
    platform: "nodejs",
    getURL_PRE: () => {
      return "";
    },
  };
  register(ext: this["ext"]) {
    this.ext = ext;
  }

  async completionParse(response_format): Promise<any> {
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
  async messages2core(messages: MyMessage[]): Promise<CoreMessage[]> {
    let results: CoreMessage[] = [];

    for (let m of messages) {
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
          content: m.content,
        });
      } else if (m.role === 'user') {
        let content: Array<TextPart | ImagePart> = []
        if (typeof m.content === 'string') {
          content.push({ type: 'text', text: m.content });
        } else if (Array.isArray(m.content)) {
          for (let c of m.content) {
            if (c.type === 'text') {
              content.push({ type: 'text', text: c.text });
            } else if (c.type === 'image_url') {
              content.push({
                type: 'image',
                image: c.image_url.url,
              });
            } else {
              console.error(new Error(`Unsupported content type: ${c}`));
            }
          }
        } else {
          throw new Error(`Unsupported content type: ${typeof m.content}`);
        }

        results.push({
          role: m.role as "user",
          content: content,
        });
      } else if (m.role === 'assistant') {
        let content: Array<TextPart | ToolCallPart> = []
        if (typeof m.content === 'string') {
          content.push({ type: 'text', text: m.content });
        } else if (Array.isArray(m.content)) {
          for (let c of m.content) {
            if (c.type === 'text') {
              content.push({ type: 'text', text: c.text });
            } else {
              console.error(new Error(`Unsupported content type: ${c}`));
            }
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
            });
          }
        }
        results.push({
          role: m.role as "assistant",
          content: content
        });
      }
    }
    return results;
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

