

import type { HyperChatCompletionTool, MyMessage, HyperToolCall, CommonContentItem, AIProvider, AIExtension, ResponseFormat, CustomFetch, JSONSchemaObject } from "@dadigua/hyperchat-shared";

import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import type { CoreMessage, LanguageModel, StreamTextResult, ToolChoice, CoreTool, ToolSet, TextPart, FilePart, ToolCallPart, ImagePart, TextStreamPart } from 'ai';
import { generateObject, streamObject, jsonSchema, smoothStream, streamText } from 'ai';
import { z, ZodSchema } from "zod";
// 兼容旧版本的 zod
if (typeof globalThis !== 'undefined') {
  (globalThis as any).z = z;
}

import { v4 } from "uuid";

import { BaseAIConfig } from "@dadigua/hyperchat-shared";
import { getMessageService } from "../message_service.mjs";
import { Command } from "../command.mjs";
import { Logger } from "../log.mjs";
import { SSEWriter } from "../sse/SSEWriter.mjs";
import { MemoryCompressor, TokenCalculator, createDefaultMemorySummaryGenerator } from "./memory-compressor.mjs";
import { workspaceManager } from "../workspace/index.mjs";
import { AiProviderFactory, type ModelConfig } from "./providers/AiProviderFactory.mjs";
import { ProxyUtils } from "./utils/ProxyUtils.mjs";
import { MessageConverter } from "./utils/MessageConverter.mjs";
import { ToolFormatter } from "./utils/ToolFormatter.mjs";
import { EnvManager } from "../data/managers/envManager.mjs";
import { buildEffectiveConfig } from "../utils/aiConfigHelper.mjs";




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
    // if (resourceResList.length > 0) {
    //   if (message.content == "" || message.content == null) {
    //     message.content = [];
    //   } else {
    //     message.content = [
    //       {
    //         type: "text",
    //         text: message.content.toString() as string,
    //       },
    //     ];
    //   }
    //   for (let content of resourceResList) {

    //     if (content.type == "text") {
    //       message.content.push({
    //         type: "text",
    //         text: content.text.toString() as string,
    //       });
    //     } else if (content.type == "image_url") {
    //       message.content.push({
    //         type: "image_url",
    //         image_url: { url: content.image_url.url },
    //       });
    //     } else {
    //       Logger.warn("resource only supports text + images.");
    //     }

    //   }
    // }
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

  async getAIOptions(modelKey?: string): Promise<{
    model: LanguageModel;
    modelConfig: ModelConfig;
  }> {
    // 获取环境变量管理器
    const envManager = EnvManager.getInstance();
    
    // 从环境变量获取配置
    const envApiKey = envManager.get('HyperChat_API_KEY');
    const envApiUrl = envManager.get('HyperChat_API_URL');
    const envProvider = envManager.get('HyperChat_AI_Provider');
    
    // 尝试从应用设置获取配置
    let appSettings, aiSettings;
    try {
      appSettings = await Command.getAppSettings();
      aiSettings = appSettings.ai;
    } catch (error) {
      Logger.debug(`Failed to load app settings: ${error}`);
    }

    // 使用 buildEffectiveConfig 获取有效配置（包括modelKey选择）
    const effectiveConfig = buildEffectiveConfig(
      { modelKey }, // 传入的 modelKey 作为覆盖参数
      undefined,   // 没有 agent 配置
      undefined,   // 没有工作区配置
      aiSettings   // 应用设置
    );

    const finalModelKey = effectiveConfig.modelKey;
    let modelConfig: any = null;
    
    // 从应用设置中查找模型配置
    if (aiSettings && aiSettings.models && aiSettings.models.length > 0) {
      modelConfig = aiSettings.models.find((x) => x.key === finalModelKey);
      
      if (modelConfig) {
        Logger.debug(`Found model config from app settings: ${finalModelKey}`);
        
        // 合并内置API配置
        if (modelConfig.provider !== "unknown") {
          modelConfig = {
            ...modelConfig,
            baseURL: aiSettings.builtinApiKeys[modelConfig.provider]?.baseURL || modelConfig.baseURL,
            apiKey: aiSettings.builtinApiKeys[modelConfig.provider]?.apiKey || modelConfig.apiKey,
          }
        }
      }
    }
    
    // 如果应用设置中没有找到配置，尝试从环境变量创建基础配置
    if (!modelConfig) {
      // 检查是否有足够的环境变量来创建基础配置
      if (!envApiKey || !envApiUrl) {
        throw new Error(`Model not found: ${finalModelKey}. Please configure it in app settings or provide HyperChat_API_KEY and HyperChat_API_URL environment variables.`);
      }
      
      Logger.info(`Creating model config from environment variables for: ${finalModelKey}`);
      
      // 从环境变量创建基础模型配置
      modelConfig = {
        key: finalModelKey,
        name: finalModelKey,
        model: finalModelKey,
        provider: envProvider || "unknown",
        baseURL: envApiUrl,
        apiKey: envApiKey,
        supportImage: true,
        supportTool: true,
        type: "llm",
        toolMode: "standard"
      };
    }
    
    // 应用环境变量覆盖（无论配置来源如何，环境变量都有最高优先级）
    if (envApiKey) {
      modelConfig.apiKey = envApiKey;
      Logger.debug('Using API key from environment variable');
    }
    
    if (envApiUrl) {
      modelConfig.baseURL = envApiUrl;
      Logger.debug('Using API URL from environment variable');
    }
    
    if (envProvider) {
      if (modelConfig.provider === "unknown" || !modelConfig.provider) {
        modelConfig.provider = envProvider;
        Logger.debug(`Using provider from environment variable: ${envProvider}`);
      } else {
        Logger.debug(`Provider from environment variable (${envProvider}) ignored because model has explicit provider: ${modelConfig.provider}`);
      }
    }

    // 验证最终配置
    if (!modelConfig.apiKey) {
      throw new Error(`API key not found for model: ${finalModelKey}. Please configure it in app settings or set HyperChat_API_KEY environment variable.`);
    }
    
    if (!modelConfig.baseURL) {
      throw new Error(`Base URL not found for model: ${finalModelKey}. Please configure it in app settings or set HyperChat_API_URL environment variable.`);
    }

    // 创建自定义fetch（如果需要代理）
    const customFetch = ProxyUtils.createFetch();

    // 使用工厂创建模型
    const model = await AiProviderFactory.createModel(modelConfig as ModelConfig, customFetch);
    
    // 构建完整的AI选项
    const aiOptions = {
      model,
      modelConfig: modelConfig as ModelConfig,
      temperature: modelConfig.temperature,
      maxTokens: modelConfig.maxTokens,
      maxRetries: 3, // 默认重试3次
    };
    
    return aiOptions;
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
    if (this.lastMessage) { // 只在第一步时压缩
      if (this.lastMessage.role === "assistant" && this.shouldCompressMemory(params)) {
        await this.compressMemory(params.modelKey, params.onUpdate, params.sseWriter);
        params.onUpdate && params.onUpdate();
      }
      // if (this.lastMessage.role === "user") {
      //   params.userMessage = this.lastMessage;
      //   this.messages.pop(); // 移除最后一条用户消息
      // }
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
    const messageId = MessageConverter.generateMessageId("assistant", this.messages.length);

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

    let format_message = MessageConverter.convertToCoreMessages(this.messages);
    options.messages = [{ role: "system", content: params.prompt }, ...format_message];

    let tools: HyperChatCompletionTool[] = this.getMcpTools(params.allowMCPs);
    const aiTools = ToolFormatter.formatTools(tools || []);
    options.tools = {
      ...options.tools,
      ...aiTools,
    }
    try {
      let aiOptions = await this.getAIOptions(params.modelKey);
      if (!aiOptions || !aiOptions.model) throw new Error('AI model not initialized');
      let newOptions: Parameters<typeof streamText>[0] = {
        ...options,
        model: aiOptions.model,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      }
      const result = await streamText({
        ...newOptions,
        experimental_transform: smoothStream({
          delayInMs: 50, // 增加延迟，使流式显示更明显
          chunking: 'word', // 按单词分块，更细致的流式效果
        }),
        abortSignal: this.abortController.signal,
      });
      this.messages.push(newMessage);
      newMessage.content_status = "dataLoading";
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
        // console.log("delta", delta);
        if (delta.type == "error") {
          if (params.sseWriter) {
            params.sseWriter.write({
              type: "chat_message_update",
              data: {
                messageId: messageId,
                delta: delta,
              },
            });
          }
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
          let hypertool = {
            index: toolIndex++,
            id: delta.toolCallId,
            type: "function" as const,
            function: {
              name: delta.toolName,
              args: delta.args || {},
            },
            originalName: localTool.originalName,
            displayName: localTool.displayName,
          };
          (delta as typeof delta & { hypertool: typeof hypertool }).hypertool = hypertool;
          newMessage.content_tool_calls.push(hypertool);
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
            const confirmedArgs = await params.confirm_call_tool_cb(tool);
            tool.function.args = typeof confirmedArgs === 'boolean' ? {} : confirmedArgs as Record<string, unknown>;
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
        const toolMessageId = MessageConverter.generateToolMessageId(this.messages.length);

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
              functionName: localTool.originalName,
              args: tool.function.args || {},
              workspacePath: localTool.workspacePath,
            }

          )
          .then((res: MCPTypes.CallToolResult & { isError?: boolean }) => {
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
          .catch((e: Error) => {
            this.lastMessage.content_status = "error";
            params.onUpdate && params.onUpdate();
            return {
              content: [{ type: "text", text: `Error: ${e.message}` }],
            } as MCPTypes.CallToolResult;
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
      let { userMessage, ...newParams } = params;
      return await this.completion(
        newParams, options, context
      );
    } else {
      // console.log("this.messages", this.messages);
      return newMessage.content as string;
    }
  }
  ext!: {
    memoryCompressor?: MemoryCompressor;
  };

  // 获取 MCP 工具
  private getMcpTools(allowMCPs?: string[]): HyperChatCompletionTool[] {
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      return [];
    }

    const mcpClients = workspace.getMcpClients();


    let tools = mcpClients.flatMap((client) => client.tools || []);

    // 如果指定了允许的 MCP 工具，进行过滤
    if (allowMCPs != null) {
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
  async compressMemory(modelKey: string, onUpdate?: (r?: any) => void, sseWriter?: SSEWriter): Promise<MyMessage> {
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
    let aiOptions = await this.getAIOptions(modelKey);
    if (!aiOptions || !aiOptions.model) throw new Error('AI model not initialized');

    try {
      const res = await streamObject({
        model: aiOptions.model,
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
        model: aiOptions.model,
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

}

