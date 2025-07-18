/**
 * AI 配置辅助工具
 * 提供统一的 AI 环境初始化和配置管理
 */

import { Logger } from '../log.mjs';
import { Command } from '../command.mjs';
import { AgentInstance, Workspace, workspaceManager } from '../workspace/index.mjs';
import { AiChannel } from '../ai/ai.mjs';
import type {
  MyMessage,
  AgentConfig,
  AISettings,
  HyperChatCompletionTool,
  BaseAIConfig,
  AppSettings
} from '@dadigua/hyperchat-shared';

/**
 * AI 环境配置
 */
export interface AIEnvironment {
  workspace: Workspace;
  appSettings: AppSettings;
  aiSettings: AISettings;
  agent?: AgentInstance | undefined;
  agentConfig?: AgentConfig;
  mcpClients: any[];
  effectiveConfig: BaseAIConfig & { modelKey: string };
}

/**
 * 构建有效配置（配置继承逻辑）
 */
function buildEffectiveConfig(
  agentConfig?: AgentConfig,
  workspaceAIConfig?: any,
  aiSettings?: AISettings
): BaseAIConfig & { modelKey: string } {
  // 获取可用模型列表
  const availableModels = aiSettings?.models || [];
  const isModelAvailable = (modelKey: string) =>
    availableModels.some(model => model.key === modelKey);

  // 按优先级查找有效的模型
  const findValidModelKey = () => {
    const candidates = [
      agentConfig?.modelKey,
      workspaceAIConfig?.modelKey,
      availableModels[0]?.key
    ].filter(Boolean);

    for (const modelKey of candidates) {
      if (modelKey && isModelAvailable(modelKey)) {
        return modelKey;
      }
    }

    return availableModels[0]?.key || '';
  };

  return {
    modelKey: findValidModelKey(),
    prompt: agentConfig?.prompt || workspaceAIConfig?.prompt || '',
    allowMCPs: agentConfig?.allowMCPs || [],
    isConfirmCallTool: agentConfig?.isConfirmCallTool ?? workspaceAIConfig?.isConfirmCallTool ?? false,
    temperature: agentConfig?.temperature ?? workspaceAIConfig?.temperature,
    maxAttachedDialogs: agentConfig?.maxAttachedDialogs ?? workspaceAIConfig?.maxAttachedDialogs ?? 5,
    maxTokens: agentConfig?.maxTokens ?? workspaceAIConfig?.maxTokens ?? 4000,
  };
}

/**
 * 初始化 AI 环境
 * 获取所有必要的配置和工具
 */
export async function initializeAIEnvironment(options: {
  agentName?: string;
  workspacePath?: string;
  needMCP?: boolean;  // 是否需要 MCP 工具
}): Promise<AIEnvironment> {
  // 获取工作区
  const workspace = workspaceManager.getCurrentWorkspace();
  if (!workspace) {
    throw new Error('工作区未初始化');
  }

  // 获取应用设置
  const appSettings = await Command.getAppSettings();
  const aiSettings = appSettings.ai;

  if (!aiSettings || !aiSettings.models || aiSettings.models.length === 0) {
    throw new Error('未找到可用的AI模型配置，请先配置AI模型');
  }

  // 获取工作区设置
  const workspaceSettings = workspace.getSettings();
  const workspaceAIConfig = workspaceSettings?.aiConfig;

  // 获取 Agent（如果指定）
  let agent: AgentInstance | undefined = undefined;
  let agentConfig: AgentConfig | undefined;

  if (options.agentName) {
    const agents = await workspace.getAllAgentsSummary();
    const agentSummary = agents.find(a =>
      a.config.name === options.agentName
    );

    if (!agentSummary) {
      throw new Error(`未找到Agent: ${options.agentName}`);
    }

    agent = workspace.getAgentInstance(options.agentName) as undefined | AgentInstance;
    agentConfig = agentSummary.config as AgentConfig;
  }

  // 获取 MCP 工具
  let mcpClients: any[] = [];

  if (options.needMCP !== false) {
    mcpClients = await workspace.getMcpClients();
  }

  // 构建有效配置
  const effectiveConfig = buildEffectiveConfig(agentConfig, workspaceAIConfig, aiSettings);

  // 验证模型可用性
  if (!effectiveConfig.modelKey) {
    throw new Error('未找到可用的AI模型');
  }

  return {
    workspace,
    appSettings,
    aiSettings,
    agent,
    agentConfig,
    mcpClients,
    effectiveConfig
  };
}

/**
 * 创建并配置 AI 通道
 */
export function createAIChannel(env: AIEnvironment): AiChannel {
  const aiChannel = new AiChannel();

  // 创建全局扩展对象（用于 MCP 工具调用）
  if (!(globalThis as any).ext) {
    (globalThis as any).ext = {
      call: async (functionName: string, args: any, _options?: any) => {
        if (functionName === 'mcpCallToolWithWorkspace') {
          return await Command.mcpCallToolWithWorkspace(args);
        }
        throw new Error(`未知的命令: ${functionName}`);
      }
    };
  }

  // 注册 AI 设置（现在不需要传入任何参数）
  aiChannel.register();

  return aiChannel;
}

/**
 * 添加系统消息到 AI 通道
 */
export function addSystemMessage(
  aiChannel: AiChannel,
  env: AIEnvironment,
  customPrompt?: string
): void {
  const workspacePath = env.workspace.workspacePath;
  const mcpToolCount = env.mcpClients.flatMap((client: any) => client.tools || []).length;

  let systemContent = customPrompt ||
    `你是HyperChat AI助手。当前工作区: ${workspacePath}。可用工具: ${mcpToolCount}个MCP工具。请用中文回复。`;

  // 如果使用了agent，添加agent的prompt
  if (env.agentConfig?.prompt) {
    systemContent = `${env.agentConfig.prompt}\n\n当前工作区: ${workspacePath}。可用工具: ${mcpToolCount}个MCP工具。`;
  }

  const systemMessage: MyMessage = {
    role: 'system',
    content: systemContent,
    content_date: Date.now()
  };

  aiChannel.addMessage(systemMessage);
}

/**
 * 执行单次 AI 对话（非流式）
 */
export async function executeAICompletion(
  aiChannel: AiChannel,
  config: BaseAIConfig & { modelKey: string },
  options?: {
    onUpdate?: () => void;
  }
): Promise<MyMessage> {
  await aiChannel.completion({
    ...config,
    onUpdate: options?.onUpdate
  });

  return aiChannel.lastMessage;
}

/**
 * 日志辅助函数
 */
export function logAIConfig(logger: typeof Logger, env: AIEnvironment, source: string): void {
  if (env.agentConfig && env.effectiveConfig.modelKey === env.agentConfig.modelKey) {
    logger.info(`📋 使用Agent配置的AI模型: ${env.effectiveConfig.modelKey}`);
  } else if (env.workspace.getSettings()?.aiConfig?.modelKey === env.effectiveConfig.modelKey) {
    logger.info(`📋 使用工作区配置的AI模型: ${env.effectiveConfig.modelKey}`);
  } else {
    logger.info(`📋 使用默认AI模型: ${env.effectiveConfig.modelKey}`);
  }

  logger.info(`🤖 使用模型: ${env.effectiveConfig.modelKey}`);

  if (env.agent) {
    logger.info(`🤖 使用Agent: ${env.agentConfig!.name}`);
  }

  const mcpToolCount = env.mcpClients.flatMap((client: any) => client.tools || []).length;
  logger.info(`🔧 可用MCP工具数量: ${mcpToolCount}`);
}