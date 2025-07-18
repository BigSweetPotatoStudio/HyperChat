/**
 * 聊天命令模块
 * 处理 AI 聊天的流式响应和相关功能
 */

import { AiChannel } from "../ai/ai.mjs";
import { MyMessage, HyperToolCall } from "@dadigua/hyperchat-shared/types";
import { BaseAIConfig } from "@dadigua/hyperchat-shared";
import { getBuiltinPrompts } from "@dadigua/hyperchat-shared";
import { getAppSettingsManager } from "../data/appSettingsService.mjs";
import { getMessageService } from "../message_service.mjs";
import { Logger } from "../log.mjs";
import { getWorkspaceManager } from "../workspace/index.mjs";
/**
 * 聊天完成请求参数
 */
interface ChatCompletionRequest {
  agentName: string;
  /** Agent 作用域 */
  agentScope: "global" | "workspace";
  /** 聊天历史消息 */
  messages: MyMessage[];
  /** 用户输入内容 */
  userMessage?: MyMessage;
  /** 配置覆盖 */
  configOverrides?: Partial<BaseAIConfig>;
  /** 聊天记录 Key */
  chatKey: string;
}


/**
 * 流式聊天完成
 */
export async function streamChatCompletion(params: ChatCompletionRequest): Promise<{ chatKey: string }> {
  const {
    agentName,
    agentScope = "workspace",
    messages,
    userMessage,
    configOverrides = {},
    chatKey,
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

    // 获取 Agent 配置
    let agent = null;
    if (agentName) {
      const agents = await workspace.getAllAgents();
      agent = agents.find((a) => a.name === agentName && a.scope === agentScope);
      if (!agent) {
        throw new Error(`Agent not found: ${agentName}`);
      }
    }
    console.log("Using Agent:", agentName, "agent:", agent);
    // 合并配置
    const effectiveConfig = getEffectiveConfig(configOverrides, agent!, workspace.getSettings().aiConfig, aiSettings);
    console.log("Effective AI Config:", effectiveConfig);
    // 创建 AI 通道
    const aiChannel = new AiChannel({}, [...messages]);



    // 获取 MCP 工具
    const mcpClients = workspace.getMcpClients();
    const mcpTools = getMCPTools(mcpClients, effectiveConfig.allowMCPs);
    // 注册扩展
    aiChannel.register({
      antdmessage: {
        warning: (msg: string) => Logger.warn(msg),
      },
      mcpTools,
      platform: "nodejs",
      getURL_PRE: () => "",
      aiSettings,
      compressionConfig: {
        enabled: (effectiveConfig.maxAttachedDialogs || 0) > 0,
      },
    });

    // 获取 Agent 记忆
    let agentMemory = { content: "", filePath: "" };
    // if (agentName) {
    //   agentMemory = await workspace.getAgentMemory(agentName, agentScope);
    // }

    // 构建系统提示词
    const systemPrompt = getBuiltinPrompts(
      workspace.workspacePath,
      effectiveConfig.prompt,
      agentName || "",
      agentMemory.content,
      agentMemory.filePath
    ).prompt;

    // 创建工具确认回调
    const confirmCallToolCb = configOverrides.isConfirmCallTool ? createConfirmCallToolCallback(chatKey) : undefined;

    // 开始流式完成
    const messageService = getMessageService();
    // 添加用户消息
    if (userMessage) {
      aiChannel.addMessage(userMessage);

      // 发送用户消息创建事件
      messageService.sendMessage({
        type: "chat_message_create",
        data: {
          chatKey,
          messageId: userMessage.messageId,
          message: userMessage,
        },
      });
    }

    // 执行流式完成（不等待，异步处理）
    aiChannel.completion(
      {
        ...effectiveConfig,
        prompt: systemPrompt,
        modelKey: effectiveConfig.modelKey || "",
        sendMessage: (eventData) => {
          // 发送消息到前端
          messageService.sendMessage({
            type: eventData.type,
            data: {
              chatKey,
              ...eventData.data,
            },
          });
        },
        confirm_call_tool_cb: confirmCallToolCb,
        onUpdate: (_updateData?: any) => {
          // 发送更新事件
          // messageService.sendMessage({
          //   type: "chat_stream_update",
          //   data: {
          //     chatKey,
          //     messages: aiChannel.messages,
          //     update: updateData,
          //   },
          // });
        },
      },
      {
        // 其他 AI 参数
        ...(effectiveConfig.temperature !== undefined ? { temperature: effectiveConfig.temperature } : {}),
        ...(effectiveConfig.maxTokens !== undefined ? { max_tokens: effectiveConfig.maxTokens } : {}),
      }
    ).then(async () => {
      // 完成后保存聊天记录
      if (agentName && agent) {
        const agentInstance = workspace.getAgentInstance(agentName, agentScope);
        if (!agentInstance) {
          throw new Error(`Agent 不存在: ${agentName}`);
        }

        // // 设置 agentName 确保关联正确
        // chatLog.agentName = agentName;
        // chatLog.dateTime = Date.now();

        // return await agentInstance.setChatLog(chatLog);

        await agentInstance.setChatLog({
          key: chatKey,
          label: "New Chat",
          messages: aiChannel.messages,
          agentName,
          dateTime: Date.now(),
          chatType: "user",
          configOverrides,
        });
      }

      // 新的消息事件架构中，完成事件已经在 AiChannel 中处理
    }).catch((error) => {
      Logger.error("Chat completion error:", error);

      // 新的消息事件架构中，错误事件已经在 AiChannel 中处理
    });

    return { chatKey };
  } catch (error) {
    Logger.error("Stream chat completion error:", error);

    // 发送初始化错误事件
    const messageService = getMessageService();
    messageService.sendMessage({
      type: "chat_message_error",
      data: {
        chatKey,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    throw error;
  }
}

/**
 * 取消聊天完成
 */
export async function cancelChatCompletion(params: { chatKey: string }): Promise<void> {
  // 这里需要实现取消逻辑
  // 可以通过存储 AiChannel 实例来实现取消
  const messageService = getMessageService();
  messageService.sendMessage({
    type: "chat_message_error",
    data: {
      chatKey: params.chatKey,
      error: "Chat cancelled by user",
    },
  });
}

/**
 * 获取有效配置
 */
function getEffectiveConfig(
  overrides: Partial<BaseAIConfig>,
  agentConfig?: Partial<BaseAIConfig>,
  workspaceConfig?: Partial<BaseAIConfig>,
  aiSettings?: any
): BaseAIConfig {
  const availableModels = aiSettings?.models || [];
  const isModelAvailable = (modelKey: string) =>
    availableModels.some((model: any) => model.key === modelKey);

  const firstAvailableModel = availableModels[0]?.key || "";

  // 按优先级查找有效的模型
  const findValidModelKey = () => {
    const candidates = [
      overrides.modelKey,
      agentConfig?.modelKey,
      workspaceConfig?.modelKey,
      firstAvailableModel
    ].filter(Boolean);

    for (const modelKey of candidates) {
      if (modelKey && isModelAvailable(modelKey)) {
        return modelKey;
      }
    }

    return firstAvailableModel;
  };

  return {
    modelKey: findValidModelKey(),
    allowMCPs: overrides.allowMCPs || agentConfig?.allowMCPs || [],
    isConfirmCallTool: overrides.isConfirmCallTool ?? agentConfig?.isConfirmCallTool ?? false,
    temperature: overrides.temperature ?? agentConfig?.temperature ?? workspaceConfig?.temperature,
    maxAttachedDialogs: overrides.maxAttachedDialogs ?? agentConfig?.maxAttachedDialogs ?? workspaceConfig?.maxAttachedDialogs ?? 5,
    maxTokens: overrides.maxTokens ?? agentConfig?.maxTokens ?? workspaceConfig?.maxTokens ?? 4000,
    prompt: overrides.prompt || agentConfig?.prompt || workspaceConfig?.prompt || ""
  };
}

/**
 * 获取 MCP 工具
 */
function getMCPTools(mcpClients: any[], allowMCPs?: string[]): any[] {
  let tools: any[] = [];

  mcpClients.forEach((client) => {
    tools = tools.concat(
      client.tools.filter((tool: any) => {
        if (!allowMCPs) return true;
        return allowMCPs.includes(tool.clientName) || allowMCPs.includes(tool.restore_name);
      })
    );
  });

  return tools;
}


/**
 * 创建工具确认回调
 */
function createConfirmCallToolCallback(chatKey: string) {
  return (tool: HyperToolCall): Promise<any> => {
    return new Promise((resolve, _reject) => {
      const messageService = getMessageService();

      // 发送工具确认请求
      messageService.sendMessage({
        type: "tool_confirm_request",
        data: {
          chatKey,
          tool,
        },
      });

      // 监听确认响应
      // const handleConfirmResponse = (data: any) => {
      //   if (data.chatKey === chatKey) {
      //     if (data.confirmed) {
      //       resolve(data.args || tool.function.args);
      //     } else {
      //       reject(new Error("User cancelled tool call"));
      //     }
      //   }
      // };

      // 设置超时
      // const timeout = setTimeout(() => {
      //   reject(new Error("Tool confirmation timeout"));
      // }, 60000); // 60秒超时

      // 这里需要实现消息监听逻辑
      // 可以使用 EventEmitter 或类似机制

      // 暂时直接返回工具参数
      resolve(tool.function.args);
    });
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
};

export default chatCommands;