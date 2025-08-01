/**
 * 聊天命令模块
 * 处理 AI 聊天的流式响应和相关功能
 */

import { AiChannel } from "../ai/ai.mjs";
import { MyMessage, HyperToolCall } from "@dadigua/hyperchat-shared/types";
import { BaseAIConfig } from "@dadigua/hyperchat-shared";
import { getBuiltinPrompts } from "../ai/hyperchat-builtin-prompts.mjs";
import { getAppSettingsManager } from "../data/appSettingsService.mjs";
import { Logger } from "../log.mjs";
import { getWorkspaceManager } from "../workspace/index.mjs";
import { AgentInstance } from "../agent/agentInstance.mjs";
import { getWebAgentManager } from "../cli/webAgentManager.mjs";
import { SSEWriter } from "../sse/SSEWriter.mjs";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from 'uuid';
import { z, ZodSchema } from "zod";
import { buildEffectiveConfig } from "../utils/aiConfigHelper.mjs";
import { TaskQueue } from "../utils/taskQueue.mjs";
import { AgentMCPManager } from "../agent/agentMCPManager.mjs";

// 全局工具确认事件发射器
const toolConfirmEmitter = new EventEmitter();
const queue = new TaskQueue({ concurrency: 1 });
/**
 * 聊天完成请求参数
 */
interface ChatCompletionRequest {
  /** 会话 ID (SSE 连接标识) */
  sessionId: string;
  /** 聊天记录 Key (保存聊天历史的标识) */
  chatKey: string;
  agentName: string;
  /** Agent 作用域 */
  agentScope: "global" | "workspace";
  /** 聊天历史消息 */
  messages: MyMessage[];
  /** 用户输入内容 */
  userMessage?: MyMessage;
  /** 配置覆盖 */
  configOverrides?: Partial<BaseAIConfig>;
  /** SSE 写入器 */
  sseWriter?: SSEWriter;
}


/**
 * 流式聊天完成
 */
export async function streamChatCompletion(params: ChatCompletionRequest): Promise<void> {
  const {
    sessionId,
    chatKey,
    agentName,
    agentScope = "workspace",
    messages,
    userMessage,
    configOverrides = {},
    sseWriter,
  } = params;

  try {
    let workspaceManager = getWorkspaceManager();
    // 获取工作区管理器
    let workspace = workspaceManager.getCurrentWorkspace();


    if (!workspace) {
      throw new Error("No workspace available");
    }

    // 获取 AI 设置
    const aiSettings = getAppSettingsManager().getAI();
    if (!aiSettings || !aiSettings.models || aiSettings.models.length === 0) {
      throw new Error("No AI models configured");
    }

    // 使用WebAgentManager获取或创建Agent实例
    // const webAgentManager = getWebAgentManager();
    // const agent = await webAgentManager.getOrCreateAgent(`${workspace?.workspacePath}/.hyperchat/agents/${agentName}`, {
    //   agentName,
    //   workspace: workspace?.workspacePath,
    //   enableMCP: true,
    //   enableTaskScheduler: false, // Web环境下默认不启用任务调度器
    // });

    let agent = await workspace.getAgentInstance(agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    let WorkspaceMCPManager = workspace.getMcpManager();
    if (WorkspaceMCPManager !== undefined) {
      agent.getAgentMcpManager().mcpManager = WorkspaceMCPManager;
    }

    // console.log("Using Agent:", agentName, "agent:", agent);
    // 合并配置（移除工作区AI配置）
    const effectiveConfig = buildEffectiveConfig(configOverrides, agent?.getConfig(), undefined, aiSettings);
    // console.log("Effective AI Config:", effectiveConfig);
    // 创建 AI 通道
    const aiChannel = new AiChannel({}, [...messages]);



    // 注册扩展（现在不需要传入任何参数）
    aiChannel.register();

    // 构建系统提示词（现在记忆获取逻辑在 getBuiltinPrompts 内部）
    const systemPrompt = getBuiltinPrompts(
      workspace.workspacePath,
      effectiveConfig.prompt,
      agentName || "",
      agentScope
    ).prompt;

    // 调用工具确认回调
    const confirmCallToolCb = configOverrides.isConfirmCallTool ? createConfirmCallToolCallback(sseWriter, sessionId) : undefined;

    // 执行流式完成（不等待，异步处理）
    aiChannel.completion(
      {
        ...effectiveConfig,
        prompt: systemPrompt,
        modelKey: effectiveConfig.modelKey || "",
        sseWriter: sseWriter, // 传递 SSE 写入器
        confirm_call_tool_cb: confirmCallToolCb,
        userMessage: userMessage, // 传递用户消息
        agentInstance: agent, // 直接传递AgentInstance对象
        onUpdate: async (_updateData?: any) => {
          queue.add(async () => {
            await agent.setChatLog({
              key: chatKey,
              label: getLabelByFirstUserContent(aiChannel.messages),
              messages: aiChannel.messages,
              agentName,
              dateTime: Date.now(),
              chatType: "user",
              configOverrides: effectiveConfig,
            });
          })

        },
      },
      {
        // 其他 AI 参数
        ...(effectiveConfig.temperature !== undefined ? { temperature: effectiveConfig.temperature } : {}),
        ...(effectiveConfig.maxTokens !== undefined ? { max_tokens: effectiveConfig.maxTokens } : {}),
      }
    ).then(async () => {
      // 完成后保存聊天记录
    }).catch(async (error) => {
      Logger.error("Chat completion error:", error);
    });
  } catch (error) {
    Logger.error("Stream chat completion error:", error);

    // 发送初始化错误事件
    if (sseWriter) {
      sseWriter.write({
        type: "chat_message_error",
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    throw error;
  }
}

/**
 * 取消聊天完成
 */
export async function cancelChatCompletion(): Promise<void> {
  // 这里需要实现取消逻辑
  // 可以通过存储 AiChannel 实例来实现取消
  // 取消逻辑现在通过 SSE 连接处理
}

/**
 * AI 结构化解析接口
 */
interface AICompletionParseRequest {
  modelKey: string;
  schema: any; // JSON Schema
  prompt: string;
}

/**
 * AI 结构化解析
 */
export async function aiCompletionParse(params: AICompletionParseRequest): Promise<any> {
  const { modelKey, schema, prompt } = params;

  try {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getCurrentWorkspace();

    if (!workspace) {
      throw new Error("No workspace available");
    }

    // 获取 AI 设置
    const aiSettings = getAppSettingsManager().getAI();
    if (!aiSettings || !aiSettings.models || aiSettings.models.length === 0) {
      throw new Error("No AI models configured");
    }

    // 检查模型是否可用
    const availableModels = aiSettings.models;
    const modelExists = availableModels.some((m: any) => m.key === modelKey);
    if (!modelExists) {
      throw new Error(`Model not found: ${modelKey}`);
    }

    // 创建 AI 通道
    const aiChannel = new AiChannel({}, []);

    // 注册扩展
    aiChannel.register();

    // 将 JSON Schema 转换为 Zod Schema
    const zodSchema = createZodSchemaFromJsonSchema(schema);

    // 调用结构化解析
    const result = await aiChannel.completionParse(
      { modelKey },
      zodSchema,
      prompt
    );

    return result;
  } catch (error) {
    Logger.error("AI completion parse error:", error);
    throw error;
  }
}

/**
 * 将 JSON Schema 转换为简单的 Zod Schema
 */
function createZodSchemaFromJsonSchema(jsonSchema: any): ZodSchema {
  if (jsonSchema.type === "object" && jsonSchema.properties) {
    const shape: Record<string, any> = {};

    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      const propSchema = prop as any;

      if (propSchema.type === "string") {
        shape[key] = z.string();
      } else if (propSchema.type === "number") {
        shape[key] = z.number();
      } else if (propSchema.type === "boolean") {
        shape[key] = z.boolean();
      } else if (propSchema.type === "array") {
        shape[key] = z.array(z.string()); // 简化处理，默认字符串数组
      } else {
        shape[key] = z.any();
      }
    }

    return z.object(shape);
  }

  // 默认返回 any schema
  return z.any();
}



/**
 * 创建工具确认回调
 */
function createConfirmCallToolCallback(sseWriter?: SSEWriter, sessionId?: string) {
  return (tool: HyperToolCall): Promise<any> => {
    return new Promise((resolve, reject) => {
      // 生成唯一确认 ID
      const confirmId = uuidv4();

      Logger.debug(`Tool confirmation requested for ${tool.function.name}, confirmId: ${confirmId}`);

      // 通过 SSE 发送工具确认请求
      if (sseWriter && !sseWriter.isClosed()) {
        sseWriter.write({
          type: "tool_confirm_request",
          data: {
            confirmId,
            sessionId,
            tool,
          },
        });
      } else {
        // 如果没有 SSE 连接，直接返回工具参数（跳过确认）
        Logger.warn(`No SSE connection available for tool confirmation, auto-confirming tool: ${tool.function.name}`);
        resolve(tool.function.args);
        return;
      }

      // 设置超时
      const timeout = setTimeout(() => {
        toolConfirmEmitter.off(`confirm_${confirmId}`, handleConfirmResponse);
        reject(new Error("Tool confirmation timeout"));
      }, 60000); // 60秒超时

      // 监听确认响应
      const handleConfirmResponse = (data: any) => {
        clearTimeout(timeout);

        if (data.confirmed) {
          Logger.debug(`Tool confirmed: ${tool.function.name}`);
          resolve(data.args || tool.function.args);
        } else {
          Logger.debug(`Tool cancelled: ${tool.function.name}`);
          reject(new Error("User cancelled tool call"));
        }
      };

      // 监听确认事件
      toolConfirmEmitter.once(`confirm_${confirmId}`, handleConfirmResponse);
    });
  };
}

/**
 * 处理工具确认响应
 */
export function handleToolConfirmResponse(confirmId: string, confirmed: boolean, args?: any) {
  Logger.debug(`Tool confirmation response received: ${confirmId}, confirmed: ${confirmed}`);

  // 触发确认事件
  toolConfirmEmitter.emit(`confirm_${confirmId}`, {
    confirmed,
    args,
  });
}

/**
 * 启动指定路径的Agent
 */
export async function startAgent(agentPath: string, options?: {
  enableMCP?: boolean;
  enableTaskScheduler?: boolean;
}): Promise<{ success: boolean; message: string; agentName?: string }> {
  try {
    const webAgentManager = getWebAgentManager();
    const agent = await webAgentManager.startAgent(agentPath, options);

    return {
      success: true,
      message: `Agent启动成功: ${agentPath}`,
      agentName: agent.getConfig().name
    };
  } catch (error) {
    return {
      success: false,
      message: `启动Agent失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 获取所有已加载的Agent列表
 */
export async function getLoadedAgents(): Promise<Array<{
  path: string;
  config: any;
  chatLogsCount: number;
  hasMCPConfig: boolean;
  tasksCount: number;
}>> {
  const webAgentManager = getWebAgentManager();
  return await webAgentManager.getAgentSummaries();
}

/**
 * 卸载指定Agent
 */
export async function unloadAgent(agentPath: string): Promise<{ success: boolean; message: string }> {
  try {
    const webAgentManager = getWebAgentManager();
    const success = await webAgentManager.removeAgent(agentPath);

    return {
      success,
      message: success ? `Agent已卸载: ${agentPath}` : `Agent不存在: ${agentPath}`
    };
  } catch (error) {
    return {
      success: false,
      message: `卸载Agent失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * 卸载所有Agent
 */
export async function unloadAllAgents(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const webAgentManager = getWebAgentManager();
    const count = webAgentManager.size();
    await webAgentManager.removeAllAgents();

    return {
      success: true,
      message: `已卸载所有Agent`,
      count
    };
  } catch (error) {
    return {
      success: false,
      message: `卸载所有Agent失败: ${error instanceof Error ? error.message : String(error)}`,
      count: 0
    };
  }
}

/**
 * 发现指定路径下的可用Agent
 */
export async function discoverAgents(searchPath?: string, options?: {
  includeGlobal?: boolean;
}): Promise<Array<{
  name: string;
  path: string;
  source: 'global' | 'local' | 'specified';
  workspacePath?: string;
}>> {
  try {
    const webAgentManager = getWebAgentManager();
    return await webAgentManager.discoverAgents(searchPath, options);
  } catch (error) {
    console.error('发现Agent失败:', error);
    return [];
  }
}

/**
 * 发现并启动指定路径下的所有Agent
 */
export async function discoverAndStartAgents(searchPath?: string, options?: {
  includeGlobal?: boolean;
  enableMCP?: boolean;
  enableTaskScheduler?: boolean;
  maxAgents?: number;
}): Promise<{
  success: boolean;
  message: string;
  startedCount: number;
  discoveredCount: number;
  agents: Array<{ name: string; path: string }>;
}> {
  try {
    const webAgentManager = getWebAgentManager();
    const startedAgents = await webAgentManager.discoverAndStartAgents(searchPath, options);

    return {
      success: true,
      message: `成功启动${startedAgents.length}个Agent`,
      startedCount: startedAgents.length,
      discoveredCount: startedAgents.length, // 简化统计
      agents: startedAgents.map(agent => ({
        name: agent.getConfig().name,
        path: agent.getAgentPath()
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: `批量启动Agent失败: ${error instanceof Error ? error.message : String(error)}`,
      startedCount: 0,
      discoveredCount: 0,
      agents: []
    };
  }
}

/**
 * 获取Agent管理器状态
 */
export async function getAgentManagerStats(): Promise<{
  totalAgents: number;
  agentPaths: string[];
}> {
  const webAgentManager = getWebAgentManager();
  return {
    totalAgents: webAgentManager.size(),
    agentPaths: webAgentManager.getAgentPaths(),
  };
}

/**
 * 聊天命令集合
 */
export const chatCommands = {
  // 开始流式聊天完成
  streamChatCompletion,

  // 取消聊天完成  
  cancelChatCompletion,

  // AI 结构化解析
  aiCompletionParse,

  // Agent管理功能
  startAgent,
  getLoadedAgents,
  unloadAgent,
  unloadAllAgents,
  discoverAgents,
  discoverAndStartAgents,
  getAgentManagerStats,
};

export default chatCommands;


function getLabelByFirstUserContent(messages: Array<MyMessage>): string {
  let label = "";
  let firstUser = messages.find(
    (x) => x.role == "user",
  );
  let firstUserContent = (firstUser as any)?.content;
  if (typeof firstUserContent == "string") {
    label = firstUserContent;
  } else if (Array.isArray(firstUserContent)) {
    label = firstUserContent.find((x) => x.type == "text")?.text || "";
  }
  return label;
}