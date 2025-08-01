/**
 * AI 配置辅助工具
 * 提供统一的 AI 环境初始化和配置管理
 */

import { Logger } from '../log.mjs';
import { Command } from '../command.mjs';
import { AgentInstance, Workspace, workspaceManager, getDefaultAgent } from '../workspace/index.mjs';
import { AiChannel } from '../ai/ai.mjs';
import { getBuiltinPrompts } from '../ai/hyperchat-builtin-prompts.mjs';
import { EnvManager } from '../data/managers/envManager.mjs';
import type {
  MyMessage,
  AISettings,
  BaseAIConfig,
  IMCPClient
} from '@dadigua/hyperchat-shared';

/**
 * AI 环境配置 - Agent-centered版本
 * 现在以Agent为中心，workspace仅作为可选的上下文信息
 */
export interface AIEnvironment {
  agent: AgentInstance; // Agent是核心，包含所有必要的配置和功能
  mcpClients: IMCPClient[]; // 从Agent获取的MCP客户端
  effectiveConfig: BaseAIConfig & { modelKey: string };
  workspace?: Workspace; // 可选的workspace上下文，主要用于向后兼容
}

/**
 * 构建有效配置（配置继承逻辑）
 * 优先级：overrides > agentConfig > workspaceConfig > aiSettings
 */
export function buildEffectiveConfig(
  overrides: Partial<BaseAIConfig> = {},
  agentConfig?: Partial<BaseAIConfig>,
  workspaceAIConfig?: any,
  aiSettings?: AISettings
): BaseAIConfig & { modelKey: string } {
  // 获取环境变量配置
  const envManager = EnvManager.getInstance();
  const envModel = envManager.get('HyperChat_AI_Model');
  
  // 获取可用模型列表
  const availableModels = aiSettings?.models || [];
  const isModelAvailable = (modelKey: string) =>
    availableModels.some((model: any) => model.key === modelKey);

  const firstAvailableModel = availableModels[0]?.key || '';

  // 按优先级查找有效的模型（修正优先级顺序）
  const findValidModelKey = () => {
    const candidates = [
      overrides.modelKey,           // 最高优先级：运行时覆盖
      agentConfig?.modelKey,        // Agent配置
      workspaceAIConfig?.modelKey,  // 工作区配置
      firstAvailableModel,          // 默认第一个可用模型
      envModel                      // 环境变量（最低优先级，配置找不到时才使用）
    ].filter(Boolean);

    for (const modelKey of candidates) {
      if (modelKey && isModelAvailable(modelKey)) {
        return modelKey;
      }
    }

    // 如果没有找到可用模型，按优先级返回fallback
    if (firstAvailableModel) {
      return firstAvailableModel;
    }
    
    if (envModel) {
      return envModel;
    }

    return 'default-model';
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
    // 使用Agent发现机制获取指定的agent
    const { findAgent } = await import('../cli/utils/agentDiscovery.mjs');
    const foundAgent = await findAgent(options.agentName, {
      workspace: workspace?.workspacePath
    });
    if (!foundAgent) {
      throw new Error(`未找到Agent: ${options.agentName}`);
    }
    // 直接从Agent路径创建实例
    agent = new AgentInstance(foundAgent.path);
    await agent.init();
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

  // 工作区设置已移除，现在使用envManage进行环境变量管理
  const agentConfig = agent.getConfig();

  // 构建有效配置（移除工作区AI配置）
  const effectiveConfig = buildEffectiveConfig(options.configOverrides || {}, agentConfig, undefined, aiSettings);


  // 获取 MCP 工具（如果需要的话） - Agent-centered版本
  let mcpClients: IMCPClient[] = [];

  // 从对应的Agent获取MCP客户端，而不是从workspace
  if (agent) {
    const agentMcpClients = agent.getMCPClients();
    mcpClients = agentMcpClients.map(client => client.toJSON() as IMCPClient);
  }
  

  return {
    agent,
    mcpClients,
    effectiveConfig,
    workspace // 保留workspace作为可选的上下文信息
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
  // 构建系统提示词（现在记忆获取逻辑在 getBuiltinPrompts 内部）
  const workspacePath = env.workspace?.workspacePath || '';
  const systemPrompt = getBuiltinPrompts(
    env.effectiveConfig.prompt,
    workspacePath,
    env.agent.getAgentPath()
  ).prompt;

  await aiChannel.completion({
    ...env.effectiveConfig,
    prompt: systemPrompt,
    onUpdate: options?.onUpdate,
    agentInstance: env.agent // 直接传递AgentInstance对象
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
  } else {
    logger.info(`📋 使用默认AI模型: ${env.effectiveConfig.modelKey}`);
  }

  logger.info(`🤖 使用模型: ${env.effectiveConfig.modelKey}`);
  logger.info(`🤖 使用Agent: ${agentConfig.name}`);

  const mcpToolCount = env.mcpClients.flatMap((client: any) => client.tools || []).length;
  logger.info(`🔧 可用MCP工具数量: ${mcpToolCount}`);
}