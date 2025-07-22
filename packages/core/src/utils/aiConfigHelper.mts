/**
 * AI 配置辅助工具
 * 提供统一的 AI 环境初始化和配置管理
 */

import { Logger } from '../log.mjs';
import { Command } from '../command.mjs';
import { AgentInstance, Workspace, workspaceManager, getDefaultAgent } from '../workspace/index.mjs';
import { AiChannel } from '../ai/ai.mjs';
import { getBuiltinPrompts } from '../ai/hyperchat-builtin-prompts.mjs';
import type {
  MyMessage,
  AISettings,
  BaseAIConfig,
  IMCPClient
} from '@dadigua/hyperchat-shared';

/**
 * AI 环境配置
 */
export interface AIEnvironment {
  workspace: Workspace;
  agent: AgentInstance; // 现在总是有默认 agent，不需要 optional
  mcpClients: IMCPClient[];
  effectiveConfig: BaseAIConfig & { modelKey: string };
}

/**
 * 构建有效配置（配置继承逻辑）
 * 优先级：overrides > agentConfig > workspaceConfig > aiSettings
 */
function buildEffectiveConfig(
  overrides: Partial<BaseAIConfig> = {},
  agentConfig?: Partial<BaseAIConfig>,
  workspaceAIConfig?: any,
  aiSettings?: AISettings
): BaseAIConfig & { modelKey: string } {
  // 获取可用模型列表
  const availableModels = aiSettings?.models || [];
  const isModelAvailable = (modelKey: string) =>
    availableModels.some((model: any) => model.key === modelKey);

  const firstAvailableModel = availableModels[0]?.key || '';

  // 按优先级查找有效的模型
  const findValidModelKey = () => {
    const candidates = [
      overrides.modelKey,
      agentConfig?.modelKey,
      workspaceAIConfig?.modelKey,
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
    isConfirmCallTool: overrides.isConfirmCallTool ?? agentConfig?.isConfirmCallTool ?? workspaceAIConfig?.isConfirmCallTool ?? false,
    temperature: overrides.temperature ?? agentConfig?.temperature ?? workspaceAIConfig?.temperature,
    maxAttachedDialogs: overrides.maxAttachedDialogs ?? agentConfig?.maxAttachedDialogs ?? workspaceAIConfig?.maxAttachedDialogs ?? 5,
    maxTokens: overrides.maxTokens ?? agentConfig?.maxTokens ?? workspaceAIConfig?.maxTokens ?? 4000,
    prompt: overrides.prompt || agentConfig?.prompt || workspaceAIConfig?.prompt || '',
    maxContextTokens: overrides.maxContextTokens ?? agentConfig?.maxContextTokens ?? workspaceAIConfig?.maxContextTokens,
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
  configOverrides?: Partial<BaseAIConfig>;  // 配置覆盖
}): Promise<AIEnvironment> {
  // 获取工作区
  const workspace = workspaceManager.getCurrentWorkspace();
  if (!workspace) {
    throw new Error('工作区未初始化');
  }

  // 获取 Agent（如果指定，否则使用默认）
  let agent: AgentInstance;

  if (options.agentName) {
    // 使用指定的 agent
    const foundAgent = workspace.getAgentInstance(options.agentName);
    if (!foundAgent) {
      throw new Error(`未找到Agent: ${options.agentName}`);
    }
    agent = foundAgent;
  } else {
    // 没有指定 agent 时，使用全局 getDefaultAgent 函数
    const defaultAgentInfo = await getDefaultAgent();
    if (!defaultAgentInfo) {
      throw new Error('未找到默认Agent');
    }
    agent = defaultAgentInfo.agentInstance;
  }

  // 从 workspace 和 agent 获取配置信息
  const appSettings = await Command.getAppSettings();
  const aiSettings = appSettings.ai;
  if (!aiSettings || !aiSettings.models || aiSettings.models.length === 0) {
    throw new Error('未找到可用的AI模型配置，请先配置AI模型');
  }

  const workspaceSettings = workspace.getSettings();
  const workspaceAIConfig = workspaceSettings?.aiConfig;
  const agentConfig = agent.getConfig();

  // 构建有效配置
  const effectiveConfig = buildEffectiveConfig(options.configOverrides || {}, agentConfig, workspaceAIConfig, aiSettings);

  // 验证模型可用性
  if (!effectiveConfig.modelKey) {
    throw new Error('未找到可用的AI模型');
  }

  // 获取 MCP 工具（如果需要的话）
  let mcpClients: IMCPClient[] = [];
  if (options.needMCP !== false) {
    mcpClients = workspace.getMcpClients();
  }

  return {
    workspace,
    agent,
    mcpClients,
    effectiveConfig
  };
}

/**
 * 创建并配置 AI 通道
 */
export function createAIChannel(): AiChannel {
  const aiChannel = new AiChannel();

  // 注册 AI 设置（现在不需要传入任何参数）
  aiChannel.register();

  return aiChannel;
}



/**
 * 执行单次 AI 对话（非流式）
 */
export async function executeAICompletion(
  aiChannel: AiChannel,
  env: AIEnvironment,
  options?: {
    onUpdate?: () => void;
    agentName?: string;
    agentScope?: "global" | "workspace";
  }
): Promise<MyMessage> {
  const agentName = options?.agentName || env.agent.getConfig().name || "";
  const agentScope = options?.agentScope || "workspace";
  
  // 构建系统提示词（现在记忆获取逻辑在 getBuiltinPrompts 内部）
  const systemPrompt = getBuiltinPrompts(
    env.workspace.workspacePath,
    env.effectiveConfig.prompt,
    agentName,
    agentScope
  ).prompt;

  await aiChannel.completion({
    ...env.effectiveConfig,
    prompt: systemPrompt,
    onUpdate: options?.onUpdate
  });

  return aiChannel.lastMessage;
}

/**
 * 日志辅助函数
 */
export function logAIConfig(logger: typeof Logger, env: AIEnvironment): void {
  const agentConfig = env.agent.getConfig();
  
  if (agentConfig && env.effectiveConfig.modelKey === agentConfig.modelKey) {
    logger.info(`📋 使用Agent配置的AI模型: ${env.effectiveConfig.modelKey}`);
  } else if (env.workspace.getSettings()?.aiConfig?.modelKey === env.effectiveConfig.modelKey) {
    logger.info(`📋 使用工作区配置的AI模型: ${env.effectiveConfig.modelKey}`);
  } else {
    logger.info(`📋 使用默认AI模型: ${env.effectiveConfig.modelKey}`);
  }

  logger.info(`🤖 使用模型: ${env.effectiveConfig.modelKey}`);
  logger.info(`🤖 使用Agent: ${agentConfig.name}`);

  const mcpToolCount = env.mcpClients.flatMap((client: any) => client.tools || []).length;
  logger.info(`🔧 可用MCP工具数量: ${mcpToolCount}`);
}