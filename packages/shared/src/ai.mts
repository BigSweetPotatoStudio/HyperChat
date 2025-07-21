
// /**
//  * @deprecated 此文件已废弃，请使用 packages/core/src/ai/ai.mts
//  * This file is deprecated, please use packages/core/src/ai/ai.mts instead
//  */

// import type { HyperChatCompletionTool, MyMessage, HyperToolCall, CommonContentItem, AIProvider, AIExtension, ResponseFormat, CustomFetch, JSONSchemaObject } from "./types.mjs";

// import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
// import type { CoreMessage, LanguageModel, StreamTextResult, ToolChoice, CoreTool, ToolSet, TextPart, FilePart, ToolCallPart, ImagePart } from 'ai';
// import { generateObject, streamObject, jsonSchema, smoothStream, streamText } from 'ai';
// import { createOpenAI, openai } from '@ai-sdk/openai';
// import { createAnthropic } from '@ai-sdk/anthropic';
// import { createGoogleGenerativeAI } from '@ai-sdk/google';
// import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
// import { jsonSchemaToZod } from "json-schema-to-zod";
// import { z, ZodSchema } from "zod";
// // 兼容旧版本的 zod
// if (typeof globalThis !== 'undefined') {
//   (globalThis as any).z = z;
// }


// import { v4 } from "uuid";

// import { extractTool } from "./prompt";
// import { AISettings, AppSettings } from "./zodSchemas/appSettingsSchema.mjs";
// import { BaseAIConfig } from "./zodSchemas/agentConfigSchema.mjs";




// const deviceId = v4();
// class AiChannel {
//   get lastMessage(): MyMessage {
//     if (!this.messages || this.messages.length === 0) {
//       throw new Error("No messages found");
//     } else {
//       return this.messages[this.messages.length - 1]!;
//     }
//   }
//   private abortController: AbortController | null = null;
//   private mcpAbortController: AbortController | null = null;

//   constructor(
//     public options?: {

//     },
//     public messages: MyMessage[] = [],
//   ) {
//   }
//   addMessage(
//     message: MyMessage,
//     resourceResList: Array<CommonContentItem> = [],
//     promptResList: Array<MCPTypes.GetPromptResult> = [],
//   ) {
//     if (resourceResList.length > 0) {
//       if (message.content == "" || message.content == null) {
//         message.content = [];
//       } else {
//         message.content = [
//           {
//             type: "text",
//             text: message.content.toString() as string,
//           },
//         ];
//       }
//       for (let content of resourceResList) {

//         if (content.type == "text") {
//           message.content.push({
//             type: "text",
//             text: content.text.toString() as string,
//           });
//         } else if (content.type == "image_url") {
//           message.content.push({
//             type: "image_url",
//             image_url: { url: content.image_url.url },
//           });
//         } else {
//           this.ext.antdmessage.warning("resource only supports text + images.");
//         }

//       }
//     }
//     this.messages.push(message);

//     return this;
//   }
//   // 取消当前请求
//   cancel() {
//     if (this.abortController) {
//       this.abortController.abort();
//       this.abortController = null;
//     }
//     if (this.mcpAbortController) {
//       this.mcpAbortController.abort();
//       this.mcpAbortController = null;
//     }
//     this.status = "stop";
//   }
//   index = 0;
//   status: "runing" | "stop" = "stop";
//   // async completion(
//   //   params: {
//   //     modelKey: string;
//   //     allowMCPs: string[],
//   //     onUpdate?: (r?: any) => void;
//   //     call_tool?: boolean;
//   //     isConfirmCallTool?: boolean;  // 默认当成false
//   //     confirm_call_tool_cb?: (tool: HyperToolCall) => Promise<boolean>;
//   //   },
//   //   options: Omit<Parameters<typeof streamText>[0], 'model' | 'prompt'> = {},
//   // ): Promise<string> {
//   //   this.status = "runing";
//   //   this.index++;
//   //   let newParams = {
//   //     ...params,
//   //     context: { index: this.index },
//   //     step: 0,
//   //   }
//   //   let res = await this._completion(newParams, options).catch((e) => {
//   //     this.status = "stop";
//   //     throw e;
//   //   });
//   //   this.status = "stop";
//   //   return res;
//   // }
//   async getAI(modelKey: string): Promise<LanguageModel> {
//     let modelConfig = this.ext.aiSettings.models.find((x) => x.key === modelKey);
//     if (!modelConfig) {
//       throw new Error(`Model not found: ${modelKey}`);
//     }
//     if (modelConfig.provider !== "unknown") {
//       modelConfig = {
//         ...modelConfig,
//         baseURL: this.ext.aiSettings.builtinApiKeys[modelConfig.provider]?.baseURL || modelConfig.baseURL,
//         apiKey: this.ext.aiSettings.builtinApiKeys[modelConfig.provider]?.apiKey || modelConfig.apiKey,
//       }
//       // modelConfig.baseURL = this.ext.aiSettings.builtinApiKeys[modelConfig.provider]?.baseURL || modelConfig.baseURL;
//       // modelConfig.apiKey = this.ext.aiSettings.builtinApiKeys[modelConfig.provider]?.apiKey || modelConfig.apiKey;
//     }
//     let aiProvider: any = null;
//     let ai: LanguageModel | null = null;
//     let fetch: CustomFetch | undefined = undefined;
//     if (this.ext.platform === "web") {
//       let baseURL = modelConfig.baseURL;
//       modelConfig = { ...modelConfig, baseURL: this.ext.getURL_PRE() + "/ai" };
//       fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
//         // If in a browser environment and server proxy is enabled, modify headers for proxying.
//         init = {
//           ...init,
//           headers: {
//             ...(init?.headers || {}),
//             baseURL: encodeURIComponent(baseURL), // Encode base URL for proxy
//           },
//         };

//         return globalThis.fetch(url, init);
//       };
//     }
//     if (modelConfig.provider === 'anthropic') {
//       aiProvider = createAnthropic({
//         baseURL: modelConfig.baseURL,
//         apiKey: modelConfig.apiKey,
//         fetch
//       });
//       ai = aiProvider(modelConfig.model);
//     } else if (modelConfig.provider === 'gemini') {
//       aiProvider = createGoogleGenerativeAI({
//         baseURL: modelConfig.baseURL,
//         apiKey: modelConfig.apiKey,
//         fetch
//       });
//       ai = aiProvider(modelConfig.model);
//     } else if (modelConfig.provider === 'openrouter') {
//       // 默认使用 OpenAI 兼容格式
//       aiProvider = createOpenRouter({
//         baseURL: modelConfig.baseURL,
//         apiKey: modelConfig.apiKey,
//         fetch
//       });
//       ai = aiProvider(modelConfig.model);
//     } else if (modelConfig.provider === 'openai') {
//       aiProvider = createOpenAI({
//         baseURL: modelConfig.baseURL,
//         apiKey: modelConfig.apiKey,
//         fetch
//       });
//       ai = aiProvider(modelConfig.model);
//     } else {
//       aiProvider = createOpenAICompatible({
//         name: modelConfig.provider,
//         baseURL: modelConfig.baseURL,
//         apiKey: modelConfig.apiKey,
//         fetch
//       });
//       ai = aiProvider(modelConfig.model);
//     }
//     return ai as LanguageModel;
//   }
//   async completion(
//     params: {
//       modelKey: string;
//       onUpdate?: (r?: any) => void;
//       confirm_call_tool_cb?: (tool: HyperToolCall) => Promise<boolean>;
//     } & BaseAIConfig,
//     options: Omit<Parameters<typeof streamText>[0], 'model' | 'prompt'> = {},
//     context: { step: number } = { step: 0 },
//   ): Promise<string> {

//     // 在开始请求前检查是否需要压缩记忆
//     if (this.shouldCompressMemory(params)) { // 只在第一步时压缩
//       await this.compressMemory(params.modelKey, params.onUpdate);
//       params.onUpdate && params.onUpdate();
//     }

//     this.abortController = new AbortController();
//     let newMessage: MyMessage = {
//       role: "assistant",
//       content: "",
//       reasoning_content: "",
//       content_tool_calls: [],
//       content_status: "loading",
//       content_attachment: [],
//       content_usage: {
//         prompt_tokens: 0,
//         completion_tokens: 0,
//         total_tokens: 0,
//       },
//       content_date: Date.now(),
//     };

//     let messages = this.messages.filter(
//       (m) => m.content_attached == null || m.content_attached == true,
//     );
//     this.messages.push(newMessage);
//     params.onUpdate && params.onUpdate();

//     let format_message = await this.messages2core(messages);
//     options.messages = [{ role: "system", content: params.prompt }, ...format_message];

//     let tools: HyperChatCompletionTool[] = this.ext.mcpTools || [];
//     const aiTools = this.tools_format_ai(tools || []);
//     options.tools = {
//       ...options.tools,
//       ...aiTools,
//     }
//     try {
//       let ai = await this.getAI(params.modelKey);
//       if (!ai) throw new Error('AI model not initialized');
//       let newOptions: Parameters<typeof streamText>[0] = {
//         ...options,
//         model: ai,
//       }
//       const result = await streamText({
//         ...newOptions,
//         experimental_transform: smoothStream({
//           delayInMs: 20, // optional: defaults to 10ms
//           chunking: 'line', // optional: defaults to 'word'
//         }),
//         abortSignal: this.abortController.signal,
//       });

//       this.lastMessage.content_status = "success";
//       this.lastMessage.content_status = "dataLoading";
//       params.onUpdate && params.onUpdate();
//       let toolIndex = 0;
//       for await (const delta of result.fullStream) {
//         // console.log("delta", delta);
//         if (delta.type == "error") {
//           throw delta.error;
//         }
//         if (delta.type == "text-delta") {
//           newMessage.content += (delta.textDelta || "");
//           newMessage.content_date = Date.now();
//         }
//         if (delta.type == "reasoning") {
//           newMessage.reasoning_content += (delta.textDelta || "");
//           newMessage.content_date = Date.now();
//         }
//         if (delta.type == "tool-call") {
//           newMessage.content_tool_calls = newMessage.content_tool_calls || [];
//           let localTool = this.ext.mcpTools.find(
//             (t) => t.name === delta.toolName
//           );
//           if (!localTool) {
//             this.ext.antdmessage.warning(
//               `Tool ${delta.toolName} not found in MCP tools.`,
//             );
//             continue;
//           }

//           newMessage.content_tool_calls.push({
//             index: toolIndex++,
//             id: delta.toolCallId,
//             type: "function",
//             function: {
//               name: delta.toolName,
//               args: delta.args || {},
//             },
//             originalName: localTool.originalName,
//             displayName: localTool.displayName,
//           });
//         }
//         if (delta.type == "step-finish") {
//           if (delta.usage) {
//             newMessage.content_usage = {
//               prompt_tokens: delta.usage.promptTokens || 0,
//               completion_tokens: delta.usage.completionTokens || 0,
//               total_tokens: delta.usage.totalTokens || 0,
//             }
//           }
//         }
//         params.onUpdate && params.onUpdate();
//       }

//       params.onUpdate && params.onUpdate();

//     } catch (e) {
//       this.lastMessage.content_status = "error";
//       params.onUpdate && params.onUpdate();
//       throw e;
//     }
//     this.lastMessage.content_status = "dataLoadComplete";
//     this.lastMessage.content_date = Date.now();

//     params.onUpdate && params.onUpdate();

//     // if (this.options.toolMode == "compatible" && (this.lastMessage.content.toString()).includes("<tool_use>")) {
//     //   let res = extractTool(this.lastMessage.content.toString());
//     //   if (res) {
//     //     tool_calls.push({
//     //       index: 0,
//     //       id: "call_compatible" + "_" + v4().slice(0, 8),
//     //       type: "function",
//     //       function: {
//     //         name: res.name,
//     //         arguments: JSON.stringify(res.params),
//     //         argumentsOBJ: res.params,
//     //       }
//     //     });
//     //     // this.lastMessage.content = "";
//     //   }
//     // }

//     params.onUpdate && params.onUpdate();
//     // console.log("tool_calls", tool_calls, call_tool);
//     if (newMessage.content_tool_calls && newMessage.content_tool_calls.length > 0) {
//       for (let tool of newMessage.content_tool_calls) {
//         try {
//           if (typeof tool.function.args != "object") {
//             tool.function.args = {};
//           }
//         } catch {
//           tool.function.args = {};
//         }
//         if (
//           params.isConfirmCallTool &&
//           params.confirm_call_tool_cb
//         ) {
//           try {
//             tool.function.args = (await params.confirm_call_tool_cb(tool)) as any;
//           } catch (e) {

//             let message: MyMessage = {
//               role: "tool" as const,
//               tool_call_id: tool.id,
//               content: "this tool call canceled by user.",
//               content_status: "error",
//               content_attachment: [],
//               content_date: Date.now(),
//             };
//             this.messages.push(message);
//             params.onUpdate && params.onUpdate();
//             continue;
//           }
//         }


//         // console.log("tool_calls", tool_calls);
//         // let localtool = tools.find(
//         //   (t) => t.name === tool.function.name,
//         // );
//         // let clientName = localtool?.clientName;
//         // let clientName = "";
//         // if (!clientName) {
//         //   console.error("client not found", tool);
//         //   throw new Error("client not found");
//         // }

//         let message: MyMessage = {
//           role: "tool" as const,
//           tool_call_id: tool.id,
//           tool_call_name: tool.function.name,
//           content: [],
//           content_status: "loading",
//           content_attachment: [],
//           content_date: Date.now(),
//         };
//         this.messages.push(message);
//         params.onUpdate && params.onUpdate();

//         let localTool = this.ext.mcpTools.find(
//           (t) => t.name === tool.function.name
//         );
//         if (!localTool) {
//           this.ext.antdmessage.warning(
//             `Tool ${tool.function.name} not found in MCP tools.`,
//           );
//           continue;
//         }
//         this.mcpAbortController = new AbortController();
//         let call_res: MCPTypes.CallToolResult = await (globalThis as any).ext.call(
//           "mcpCallToolWithWorkspace",
//           {
//             name: localTool?.clientName || "",
//             functionName: localTool.originalName,
//             args: tool.function.args || {},
//             workspacePath: localTool.workspacePath,
//           },
//           {
//             signal: this.mcpAbortController?.signal,
//           },
//         )
//           .then((res: any) => {
//             if (res["isError"]) {
//               this.lastMessage.content_status = "error";
//               params.onUpdate && params.onUpdate();
//               return res;
//             } else {
//               this.lastMessage.content_status = "success";
//               params.onUpdate && params.onUpdate();
//               return res;
//             }
//           })
//           .catch((e: any) => {
//             this.lastMessage.content_status = "error";
//             params.onUpdate && params.onUpdate();
//             return {
//               content: { error: e.message },
//             };
//           });
//         // console.log("call_response: ", call_res);

//         if (call_res.content == null) {
//           this.lastMessage.content = JSON.stringify(call_res);
//         } else if (typeof call_res.content == "string") {
//           this.lastMessage.content = call_res.content;
//         } else if (Array.isArray(call_res.content)) {
//           this.lastMessage.content = [];
//           for (let c of call_res.content) {
//             if (c.type == "text") {
//               this.lastMessage.content.push({
//                 type: "text",
//                 text: c.text,
//               })
//             } else if (c.type == "image") {
//               this.lastMessage.content.push({
//                 type: "image_url",
//                 image_url: { url: `data:${c.mimeType};base64,${c.data}` },
//               })
//             } else {
//               this.ext.antdmessage.warning("tool 返回类型只支持 text image");
//             }
//           }
//         } else {
//           this.lastMessage.content = "error: tool call return type not supported";
//         }

//         params.onUpdate && params.onUpdate();
//       }
//       context.step++;
//       return await this.completion(
//         params, options, context
//       );
//     } else {
//       // console.log("this.messages", this.messages);
//       return newMessage.content as string;
//     }
//   }
//   ext!: {
//     antdmessage: { warning: (string: string) => void };
//     mcpTools: HyperChatCompletionTool[];
//     platform: "nodejs" | "web";
//     getURL_PRE: () => string;
//     aiSettings: AISettings;
//     compressionConfig?: {
//       enabled: boolean;
//     };
//   };
//   register(ext: this["ext"]) {
//     this.ext = ext;
//   }

//   // 估算消息token数量
//   private estimateTokenCount(message: MyMessage): number {
//     let content = '';
//     if (typeof message.content === 'string') {
//       content = message.content;
//     } else if (Array.isArray(message.content)) {
//       content = message.content.map(c => {
//         if (c.type === 'text') return c.text;
//         if (c.type === 'image_url') return '[image]';
//         return '';
//       }).join('');
//     }
    
//     // 如果消息有实际的token使用统计，优先使用
//     if (message.content_usage?.total_tokens) {
//       return message.content_usage.total_tokens;
//     }
    
//     // 简单估算：1 token ≈ 4 字符（对英文），1 token ≈ 1.5 字符（对中文）
//     // 取平均值：1 token ≈ 2.5 字符
//     return Math.ceil(content.length / 2.5);
//   }

//   // 计算从指定索引到最后的消息token总数
//   private calculateMessagesTokenCount(fromIndex: number = 0): number {
//     let totalTokens = 0;
//     for (let i = fromIndex; i < this.messages.length; i++) {
//       const message = this.messages[i]!;
//       totalTokens += this.estimateTokenCount(message);
//     }
//     return totalTokens;
//   }

//   // 估算prompt的token数量
//   private estimatePromptTokenCount(prompt: string): number {
//     return Math.ceil(prompt.length / 2.5);
//   }

//   // 检查是否需要压缩记忆
//   private shouldCompressMemory(params: BaseAIConfig): boolean {
//     if (!this.ext.compressionConfig?.enabled) return false;
    
//     const strategy = params.compressionStrategy || "auto";
//     const lastMemoryIndex = this.messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");
//     const startIndex = lastMemoryIndex === -1 ? 0 : lastMemoryIndex + 1;
    
//     // 基于token数量的压缩策略
//     if (strategy === "tokens") {
//       // 如果没有配置maxContextTokens，使用默认值36000
//       const maxTokens = params.maxContextTokens || 36000;
//       const promptTokens = this.estimatePromptTokenCount(params.prompt);
//       const messageTokens = this.calculateMessagesTokenCount(startIndex);
//       const totalTokens = promptTokens + messageTokens;
      
//       console.log(`Token usage: prompt=${promptTokens}, messages=${messageTokens}, total=${totalTokens}, limit=${maxTokens}`);
//       return totalTokens >= maxTokens;
//     }
    
//     // auto策略：优先使用token压缩，没有配置时使用默认值
//     if (strategy === "auto") {
//       // 如果没有配置maxContextTokens，使用默认值36000
//       const maxTokens = params.maxContextTokens || 36000;
//       const promptTokens = this.estimatePromptTokenCount(params.prompt);
//       const messageTokens = this.calculateMessagesTokenCount(startIndex);
//       const totalTokens = promptTokens + messageTokens;
      
//       console.log(`Auto strategy - Token usage: prompt=${promptTokens}, messages=${messageTokens}, total=${totalTokens}, limit=${maxTokens}`);
//       return totalTokens >= maxTokens;
//     }
    
//     // 基于对话轮数的压缩策略（原有逻辑）
//     return this.shouldCompressMemoryByDialogs(params, startIndex);
//   }

//   // 基于对话轮数的压缩逻辑（拆分出来保持向后兼容）
//   private shouldCompressMemoryByDialogs(params: BaseAIConfig, startIndex: number = 0): boolean {
//     let userMessageCount = 0;
//     for (let i = startIndex; i < this.messages.length; i++) {
//       if (this.messages[i]!.role === "user") {
//         userMessageCount++;
//       }
//     }
//     return userMessageCount >= (params.maxAttachedDialogs || 5);
//   }

//   // 生成记忆摘要
//   private async generateMemorySummary(messages: MyMessage[], modelKey: string): Promise<{
//     title: string;
//     summary: string;
//     key_points: string[];
//     important_context: string;
//   }> {
//     const conversationText = messages.map(m => {
//       if (m.role === "user") return `用户: ${m.content}`;
//       if (m.role === "assistant") return `助手: ${m.content}`;
//       if (m.role === "system") return `系统: ${m.content}`;
//       if (m.role === "tool") return `工具结果: ${m.content}`;
//       return "";
//     }).filter(Boolean).join("\n");

//     const memoryPrompt = `请总结以下对话的关键信息，保留重要的上下文和决策点：

// ${conversationText}

// 请用JSON格式返回：
// - title: 对话的简短标题，3-10个字
// - summary: 对话的简洁摘要
// - key_points: 重要观点和决策的数组
// - important_context: 需要保留的重要上下文信息`;


//     return await this.completionParse(
//       { modelKey },
//       z.object({
//         title: z.string(),
//         summary: z.string(),
//         key_points: z.array(z.string()),
//         important_context: z.string()
//       }),
//       memoryPrompt
//     );

//   }

//   // 压缩记忆
//   async compressMemory(modelKey?: string, onUpdate?: (r?: any) => void): Promise<void> {
//     let lastMemoryMessageIndex = this.messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");
//     lastMemoryMessageIndex = lastMemoryMessageIndex === -1 ? 1 : lastMemoryMessageIndex; // 如果没有记忆消息，则从头开始
//     let lastUserMessageIndex = this.messages.findLastIndex(m => m.role === "user");

//     let compressMessagesCount = lastUserMessageIndex - lastMemoryMessageIndex - 1;
//     const memoryMessage: MyMessage = {
//       role: "hyper_memory",
//       content: "compressing...",
//       memory_key_points: [],
//       memory_original_count: compressMessagesCount,
//       content_date: Date.now(),
//       content_status: "loading",
//     };
//     onUpdate && onUpdate();
//     // 在最后一次user消息之前插入记忆消息
//     if (this.messages[lastUserMessageIndex - 1]!.role === "hyper_memory") {
//       this.messages[lastUserMessageIndex - 1] = memoryMessage; // 替换最后一次用户消息
//     } else {
//       this.messages.splice(lastUserMessageIndex, 0, memoryMessage);
//     }

//     try {
//       // 使用第一个可用的模型Key，或者从配置中获取默认模型
//       const useModelKey = modelKey || this.ext.aiSettings.models[0]?.key || "default";
//       const summary = await this.generateMemorySummary(this.messages.slice(lastMemoryMessageIndex, lastUserMessageIndex), useModelKey);

//       memoryMessage.content = summary.summary;
//       memoryMessage.memory_key_points = summary.key_points;
//       memoryMessage.memory_original_count = compressMessagesCount;
//       memoryMessage.content_date = Date.now();
//       memoryMessage.content_status = "success";
//       onUpdate && onUpdate({ type: "compress", data: summary });
//       console.log(`Memory compressed: ${compressMessagesCount} messages → 1 memory message`);
//     } catch (error) {
//       memoryMessage.content_status = "error";
//       memoryMessage.content = "记忆压缩失败，继续使用完整对话历史";
//       memoryMessage.content_date = Date.now();
//       onUpdate && onUpdate({ type: "compress_error", error });
//       console.error("Memory compression failed:", error);
//       this.ext.antdmessage.warning("记忆压缩失败，继续使用完整对话历史");
//     }
//   }

//   async completionParse({ modelKey }: { modelKey: string }, schema: ZodSchema, prompt: string): Promise<any> {
//     let ai = await this.getAI(modelKey);
//     if (!ai) throw new Error('AI model not initialized');

//     try {
//       const res = await streamObject({
//         model: ai,
//         schema: schema,
//         prompt: prompt,
//         providerOptions: {
//           // 这里可以添加提供者选项
//           "qwen": {
//             enable_thinking: false,
//           }
//         }
//       });

//       // 可选：处理流式更新
//       for await (const d of res.fullStream) {
//         // 这里可以添加实时更新逻辑，如果需要的话
//         // console.log('Partial object:', partialObject);
//         if (d.type === 'error') {
//           throw d.error;
//         }
//       }

//       return res.object;
//     } catch (error) {

//       const res = await generateObject({
//         model: ai,
//         schema: schema,
//         prompt: prompt,
//         providerOptions: {
//           // 这里可以添加提供者选项
//           "qwen": {
//             enable_thinking: false,
//           }
//         }
//       });


//       return res.object;
//     }

//   }
//   async messages2core(messages: MyMessage[]): Promise<CoreMessage[]> {
//     let results: CoreMessage[] = [];
//     let lastMemoryMessage = this.messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");

//     for (let i = 0; i < messages.length; i++) {
//       if (i > 0 && i < lastMemoryMessage) {
//         // 如果是第一个记忆消息之前的用息，跳过，但是保留系统消息
//         continue;
//       }
//       let m = messages[i]!;
//       if (m.role === 'tool') {
//         results.push({
//           role: 'tool',
//           content: [
//             {
//               type: 'tool-result',
//               toolCallId: m.tool_call_id || "",
//               toolName: m.tool_call_name || "", // 需要从工具调用历史中获取
//               result: m.content as string,
//             },
//           ],
//         });
//       } else if (m.role === 'hyper_memory') {
//         // 将记忆消息转换为用户消息
//         results.push({
//           role: 'user',
//           content: `[Memory Summary]: ${m.content}${m.memory_key_points ? '\n[Key Points]: ' + m.memory_key_points.join(', ') : ''}`,
//         });
//       } else if (m.role === 'system') {
//         results.push({
//           role: 'system',
//           content: m.content,
//         });
//       } else if (m.role === 'user') {
//         let content: Array<TextPart | ImagePart> = []
//         if (typeof m.content === 'string') {
//           content.push({ type: 'text', text: m.content });
//         } else if (Array.isArray(m.content)) {
//           for (let c of m.content) {
//             if (c.type === 'text') {
//               content.push({ type: 'text', text: c.text });
//             } else if (c.type === 'image_url') {
//               content.push({
//                 type: 'image',
//                 image: c.image_url.url,
//               });
//             } else {
//               console.error(new Error(`Unsupported content type: ${c}`));
//             }
//           }
//         } else {
//           throw new Error(`Unsupported content type: ${typeof m.content}`);
//         }

//         results.push({
//           role: m.role as "user",
//           content: content,
//         });
//       } else if (m.role === 'assistant') {
//         let content: Array<TextPart | ToolCallPart> = []
//         if (typeof m.content === 'string') {
//           content.push({ type: 'text', text: m.content });
//         } else if (Array.isArray(m.content)) {
//           for (let c of m.content) {
//             if (c.type === 'text') {
//               content.push({ type: 'text', text: c.text });
//             } else {
//               console.error(new Error(`Unsupported content type: ${c}`));
//             }
//           }
//         } else {
//           throw new Error(`Unsupported content type: ${typeof m.content}`);
//         }
//         if (m.content_tool_calls && m.content_tool_calls.length > 0) {
//           for (let toolCall of m.content_tool_calls) {
//             let toolCallId = toolCall.id || v4();
//             content.push({
//               args: toolCall.function.args || {},
//               toolCallId: toolCallId,
//               toolName: toolCall.function.name,
//               type: "tool-call",
//             });
//           }
//         }
//         results.push({
//           role: m.role as "assistant",
//           content: content
//         });
//       }
//     }
//     return results;
//   }

//   tools_format_ai(tools: HyperChatCompletionTool[]): ToolSet {
//     const result: ToolSet = {};

//     for (const tool of tools) {
//       result[tool.name] = {
//         description: tool.description || '',
//         parameters: tool.inputSchema == null ? undefined : eval(jsonSchemaToZod(tool.inputSchema as any)),
//       };
//     }

//     return result;
//   }

// }

