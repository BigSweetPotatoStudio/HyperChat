

import type { HyperChatCompletionTool, MyMessage, HyperToolCall, CommonContentItem, AIProvider, AIExtension, ResponseFormat, CustomFetch, JSONSchemaObject } from "@dadigua/hyperchat-shared";

import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import type { CoreMessage, LanguageModel, StreamTextResult, ToolChoice, CoreTool, ToolSet, TextPart, FilePart, ToolCallPart, ImagePart, TextStreamPart } from 'ai';
import { generateObject, streamObject, jsonSchema, smoothStream, streamText } from 'ai';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { jsonSchemaToZod } from "json-schema-to-zod";
import { z, ZodSchema } from "zod";
// 兼容旧版本的 zod
if (typeof globalThis !== 'undefined') {
  (globalThis as any).z = z;
}


import { v4 } from "uuid";
import nodeFetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpProxyAgent } from "http-proxy-agent";

import { AISettings, AppSettings } from "@dadigua/hyperchat-shared";
import { BaseAIConfig } from "@dadigua/hyperchat-shared";
import { getMessageService } from "../message_service.mjs";
import { Command } from "../command.mjs";
import { Logger } from "../log.mjs";
import { SSEWriter } from "../sse/SSEWriter.mjs";
import { MemoryCompressor, TokenCalculator, createDefaultMemorySummaryGenerator } from "./memory-compressor.mjs";
import { workspaceManager } from "../workspace/index.mjs";




export class AiChannel {
  get lastMessage(): MyMessage {
    return this.messages[this.messages.length - 1]!;
  }
  private abortController: AbortController | null = null;
  private mcpAbortController: AbortController | null = null;
  private sseWriter?: SSEWriter;

  constructor(
    public options?: {

    },
    public messages: MyMessage[] = []
  ) {
  }
  addMessage(
    message: MyMessage,
    resourceResList: Array<CommonContentItem> = [],
    promptResList: Array<MCPTypes.GetPromptResult> = [],
  ) {
    // 如果消息没有 messageId，生成一个基于数组索引和时间的ID
    if (!message.messageId) {
      const timestamp = Math.floor(Date.now() / 1000); // 精确到秒
      message.messageId = `user_${this.messages.length}_${timestamp}`;
    }
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
          Logger.warn("resource only supports text + images.");
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
  }

  async getAI(modelKey: string): Promise<LanguageModel> {
    // 直接读取AI配置
    const appSettings = await Command.getAppSettings();
    const aiSettings = appSettings.ai;

    if (!aiSettings) {
      throw new Error('AI配置未找到');
    }

    let modelConfig = aiSettings.models.find((x) => x.key === modelKey);
    if (!modelConfig) {
      throw new Error(`Model not found: ${modelKey}`);
    }
    if (modelConfig.provider !== "unknown") {
      modelConfig = {
        ...modelConfig,
        baseURL: aiSettings.builtinApiKeys[modelConfig.provider]?.baseURL || modelConfig.baseURL,
        apiKey: aiSettings.builtinApiKeys[modelConfig.provider]?.apiKey || modelConfig.apiKey,
      }
    }
    let aiProvider: any = null;
    let ai: LanguageModel | null = null;
    let fetch: CustomFetch | undefined = undefined;

    // Node.js environment - support HTTP proxy
    const proxyUrl = process.env.HTTP_PROXY || process.env.http_proxy ||
      process.env.HTTPS_PROXY || process.env.https_proxy;

    if (proxyUrl) {
      // 强制禁用 SSL 验证（仅用于抓包调试）
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

      // Logger.debug(`🔗 HTTP代理已配置: ${proxyUrl}`);


      fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const targetUrl = typeof url === 'string' ? url : url.toString();
        const isHttps = targetUrl.startsWith('https:');

        // 创建代理 agent，配置为支持抓包工具
        const httpsOptions = {
          rejectUnauthorized: false,  // 允许自签名证书
          checkServerIdentity: () => undefined, // 跳过服务器身份验证
          secureProtocol: 'TLSv1_2_method', // 强制使用 TLS 1.2
        };

        const agent = isHttps
          ? new HttpsProxyAgent(proxyUrl, httpsOptions)
          : new HttpProxyAgent(proxyUrl);

        // 使用 node-fetch，它对代理支持更好
        const response = await nodeFetch(targetUrl, {
          ...init,
          agent: agent,
          // 额外的 TLS 选项，确保忽略证书错误
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined,
        } as any);

        // 将 node-fetch 的 Response 转换为标准 Response
        const body = await (response as any).buffer();
        return new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as any,
        }) as Response;
      };
    }

    if (modelConfig.provider === 'anthropic') {
      aiProvider = createAnthropic({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch
      });
      ai = aiProvider(modelConfig.model);
    } else if (modelConfig.provider === 'gemini') {
      aiProvider = createGoogleGenerativeAI({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch
      });
      ai = aiProvider(modelConfig.model);
    } else if (modelConfig.provider === 'openrouter') {
      // 默认使用 OpenAI 兼容格式
      aiProvider = createOpenRouter({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch
      });
      ai = aiProvider(modelConfig.model);
    } else if (modelConfig.provider === 'openai') {
      aiProvider = createOpenAI({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch
      });
      ai = aiProvider(modelConfig.model);
    } else {
      aiProvider = createOpenAICompatible({
        name: modelConfig.provider,
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch
      });
      ai = aiProvider(modelConfig.model);
    }
    return ai as LanguageModel;
  }
  async completion(
    params: {
      modelKey: string;
      onUpdate?: (r?: any) => void;
      confirm_call_tool_cb?: (tool: HyperToolCall) => Promise<boolean>;
      sseWriter?: SSEWriter; // SSE 写入器
      chatKey?: string; // 聊天 Key
      userMessage?: MyMessage; // 用户消息
    } & BaseAIConfig,
    options: Omit<Parameters<typeof streamText>[0], 'model' | 'prompt'> = {},
    context: { step: number } = { step: 0 },
  ): Promise<string> {

    // 在开始请求前检查是否需要压缩记忆
    if (this.lastMessage && this.lastMessage.role === "assistant" && this.shouldCompressMemory(params)) { // 只在第一步时压缩
      await this.compressMemory(params.modelKey, params.onUpdate, params.sseWriter);
      params.onUpdate && params.onUpdate();
    }

    // 处理用户消息
    if (params.userMessage) {
      this.addMessage(params.userMessage);

      // 发送用户消息创建事件
      if (params.sseWriter) {
        this.handleSSEMessage(
          "chat_message_create",
          {
            messageId: params.userMessage.messageId!,
            message: params.userMessage,
          },
          params.userMessage.messageId,
          params.sseWriter
        );
      }
    }

    this.abortController = new AbortController();

    // 生成基于时间和数组索引的消息ID
    const timestamp = Math.floor(Date.now() / 1000); // 精确到秒
    const messageId = `assistant_${this.messages.length}_${timestamp}`;

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
      messageId: messageId,
    };

    // this.messages = this.messages.filter(
    //   (m) => m.content_attached == null || m.content_attached == true,
    // );


    let format_message = await this.messages2core();
    options.messages = [{ role: "system", content: params.prompt }, ...format_message];

    let tools: HyperChatCompletionTool[] = this.getMcpTools(params.allowMCPs);
    const aiTools = this.tools_format_ai(tools || []);
    options.tools = {
      ...options.tools,
      ...aiTools,
    }
    try {
      let ai = await this.getAI(params.modelKey);
      if (!ai) throw new Error('AI model not initialized');
      let newOptions: Parameters<typeof streamText>[0] = {
        ...options,
        model: ai,
      }
      const result = await streamText({
        ...newOptions,
        experimental_transform: smoothStream({
          delayInMs: 50, // 增加延迟，使流式显示更明显
          chunking: 'word', // 按单词分块，更细致的流式效果
        }),
        abortSignal: this.abortController.signal,
      });
      this.lastMessage.content_status = "dataLoading";
      this.messages.push(newMessage);

      // 发送消息创建事件
      if (params.sseWriter) {
        Logger.debug(`Sending chat_message_create via SSE for messageId: ${messageId}`);
        params.sseWriter.write({
          type: "chat_message_create",
          data: {
            messageId: messageId,
            message: newMessage,
          },
        });
      }

      params.onUpdate && params.onUpdate();

      let toolIndex = 0;
      for await (const delta of result.fullStream) {
        // 发送 delta 更新
        if (params.sseWriter) {
          params.sseWriter.write({
            type: "chat_message_update",
            data: {
              messageId: messageId,
              delta: delta,
            },
          });
        }
        // console.log("delta", delta);
        if (delta.type == "error") {
          throw delta.error;
        }
        if (delta.type == "text-delta") {
          newMessage.content += (delta.textDelta || "");
          newMessage.content_date = Date.now();
        }
        if (delta.type == "reasoning") {
          // Logger.debug("reasoning", delta);
          newMessage.reasoning_content += (delta.textDelta || "");
          newMessage.content_date = Date.now();
        }
        if (delta.type == "tool-call") {
          newMessage.content_tool_calls = newMessage.content_tool_calls || [];
          let localTool = this.getMcpTools().find(
            (t) => t.name === delta.toolName
          );
          if (!localTool) {
            Logger.warn(`Tool ${delta.toolName} not found in MCP tools.`);
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

      // 发送聊天错误事件
      if (params.sseWriter) {
        params.sseWriter.write({
          type: "chat_message_error",
          data: {
            error: e instanceof Error ? e.message : String(e),
          },
        });
      }

      params.onUpdate && params.onUpdate();
      throw e;
    }
    this.lastMessage.content_status = "dataLoadComplete";
    this.lastMessage.content_date = Date.now();

    // 发送聊天完成事件
    if (params.sseWriter) {
      params.sseWriter.write({
        type: "chat_message_complete",
        data: {
          result: this.lastMessage.content,
        },
      });
    }

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
        if (
          params.isConfirmCallTool &&
          params.confirm_call_tool_cb
        ) {
          try {
            tool.function.args = (await params.confirm_call_tool_cb(tool)) as any;
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

        // 生成工具消息的 messageId
        const toolTimestamp = Math.floor(Date.now() / 1000);
        const toolMessageId = `tool_${this.messages.length}_${toolTimestamp}`;

        let message: MyMessage = {
          role: "tool" as const,
          tool_call_id: tool.id,
          tool_call_name: tool.function.name,
          content: [],
          content_status: "loading",
          content_attachment: [],
          content_date: Date.now(),
          messageId: toolMessageId,
        };
        this.messages.push(message);

        // 发送工具消息创建事件
        if (params.sseWriter) {
          params.sseWriter.write({
            type: "chat_message_create",
            data: {
              messageId: toolMessageId,
              message: message,
            },
          });
        }

        params.onUpdate && params.onUpdate();

        let localTool = this.getMcpTools().find(
          (t) => t.name === tool.function.name
        );
        if (!localTool) {
          Logger.warn(`Tool ${tool.function.name} not found in MCP tools.`);
          continue;
        }
        this.mcpAbortController = new AbortController();
        let call_res: MCPTypes.CallToolResult = await Command.mcpCallToolWithWorkspace
          (
            {
              name: localTool?.clientName || "",
              functionName: localTool.origin_name,
              args: tool.function.args || {},
              workspacePath: localTool.workspacePath,
            }

          )
          .then((res: any) => {
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
          .catch((e: any) => {
            this.lastMessage.content_status = "error";
            params.onUpdate && params.onUpdate();
            return {
              content: { error: e.message },
            };
          });
        // console.log("call_response: ", call_res);

        // 更新工具消息内容
        if (call_res.content == null) {
          message.content = JSON.stringify(call_res);
        } else if (typeof call_res.content == "string") {
          message.content = call_res.content;
        } else if (Array.isArray(call_res.content)) {
          message.content = [];
          for (let c of call_res.content) {
            if (c.type == "text") {
              message.content.push({
                type: "text",
                text: c.text,
              })
            } else if (c.type == "image") {
              message.content.push({
                type: "image_url",
                image_url: { url: `data:${c.mimeType};base64,${c.data}` },
              })
            } else {
              Logger.warn("tool 返回类型只支持 text image");
            }
          }
        } else {
          message.content = "error: tool call return type not supported";
        }

        // 设置工具消息状态为成功
        message.content_status = call_res["isError"] ? "error" : "success";
        message.content_date = Date.now();

        // 发送工具消息替换事件
        if (params.sseWriter) {
          params.sseWriter.write({
            type: "chat_message_replace",
            data: {
              messageId: toolMessageId,
              message: message,
            },
          });
        }

        params.onUpdate && params.onUpdate();
      }
      context.step++;
      return await this.completion(
        params, options, context
      );
    } else {
      // console.log("this.messages", this.messages);
      return newMessage.content as string;
    }
  }
  ext!: {
    memoryCompressor?: MemoryCompressor;
  };

  // 添加工具方法
  private generateMessageId(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `${this.messages.length}_${timestamp}`;
  }

  // 获取 MCP 工具
  private getMcpTools(allowMCPs?: string[]): HyperChatCompletionTool[] {
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      return [];
    }

    const mcpClients = workspace.getMcpClients();


    let tools = mcpClients.flatMap((client) => client.tools || []);

    // 如果指定了允许的 MCP 工具，进行过滤
    if (allowMCPs && allowMCPs.length > 0) {
      tools = tools.filter((tool: HyperChatCompletionTool) =>
        allowMCPs.includes(tool.name) || allowMCPs.includes(tool.clientName)
      );
    }

    return tools;
  }

  private handleSSEMessage(type: string, data: any, messageId?: string, sseWriter?: SSEWriter) {
    const writer = sseWriter || this.sseWriter;
    if (writer && !writer.isClosed()) {
      writer.write({ type, data: { ...data, messageId } });
    }
  }
  register(ext?: Partial<this["ext"]>) {
    this.ext = { ...this.ext, ...ext };

    // 初始化记忆压缩器
    if (!this.ext.memoryCompressor) {
      const summaryGenerator = createDefaultMemorySummaryGenerator(
        this.completionParse.bind(this)
      );
      this.ext.memoryCompressor = new MemoryCompressor(summaryGenerator);
    }
  }

  // 检查是否需要压缩记忆
  private shouldCompressMemory(params: BaseAIConfig): boolean {
    if (!this.ext.memoryCompressor) return false;
    return this.ext.memoryCompressor.shouldCompressMemory(this.messages, params);
  }

  // 压缩记忆
  async compressMemory(modelKey?: string, onUpdate?: (r?: any) => void, sseWriter?: SSEWriter): Promise<MyMessage> {
    if (!this.ext.memoryCompressor) {
      throw new Error('Memory compressor not initialized');
    }

    // 使用第一个可用的模型Key，或者从配置中获取默认模型
    const useModelKey = modelKey;

    return await this.ext.memoryCompressor.compressMemory(
      this.messages,
      useModelKey,
      onUpdate,
      sseWriter
    );
  }

  async completionParse({ modelKey }: { modelKey: string }, schema: ZodSchema, prompt: string): Promise<any> {
    let ai = await this.getAI(modelKey);
    if (!ai) throw new Error('AI model not initialized');

    try {
      const res = await streamObject({
        model: ai,
        schema: schema,
        prompt: prompt,
        providerOptions: {
          // 这里可以添加提供者选项
          "qwen": {
            enable_thinking: false,
          }
        }
      });

      // 可选：处理流式更新
      for await (const d of res.fullStream) {
        // 这里可以添加实时更新逻辑，如果需要的话
        // console.log('Partial object:', partialObject);
        if (d.type === 'error') {
          throw d.error;
        }
      }

      return res.object;
    } catch (error) {

      const res = await generateObject({
        model: ai,
        schema: schema,
        prompt: prompt,
        providerOptions: {
          // 这里可以添加提供者选项
          "qwen": {
            enable_thinking: false,
          }
        }
      });


      return res.object;
    }

  }
  async messages2core(): Promise<CoreMessage[]> {
    let results: CoreMessage[] = [];
    let lastMemoryMessage = this.messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");

    for (let i = 0; i < this.messages.length; i++) {
      if (i < lastMemoryMessage) {
        continue;
      }
      let m = this.messages[i]!;
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
      } else if (m.role === 'hyper_memory') {
        // 将记忆消息转换为用户消息
        results.push({
          role: 'user',
          content: `[Memory Summary]: ${m.content}${m.memory_key_points ? '\n[Key Points]: ' + m.memory_key_points.join(', ') : ''}`,
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

