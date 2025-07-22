/**
 * Agent 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import { t } from '../../i18n.mjs';
import { getBuiltinPrompts } from '../../ai/hyperchat-builtin-prompts.mjs';
import { agentCommands } from '../../commands/agentCommands.mjs';
import type { AgentConfig } from '@dadigua/hyperchat-shared';
/**
 * 获取当前工作区路径（使用新的会话管理器，只读模式）
 */
async function getCurrentWorkspacePath(): Promise<string> {
  // Agent 查询只需要配置，不需要启动服务
  const currentWorkingDirectory = process.cwd();
  await workspaceManager.initialize(currentWorkingDirectory);
  return workspaceManager.getCurrentWorkspacePath();
}

/**
 * 显示Agent记忆内容
 */
export async function showAgentMemory(agentName: string) {
  const logger = new Logger();

  try {
    logger.info(`🧠 ${t`Getting memory for agent:`} ${agentName}`);

    // 智能获取当前工作区
    const currentWorkingDirectory = process.cwd();
    await workspaceManager.initialize(currentWorkingDirectory);
    const workspace = workspaceManager.getCurrentWorkspace();
    
    if (!workspace) {
      logger.error('当前没有可用的工作区');
      process.exit(1);
    }

    // 获取Agent记忆内容 (智能查找)
    const memoryResult = await agentCommands.getAgentMemory({ 
      agentName
    });

    // 如果没有找到Agent，显示错误
    if (!memoryResult.filePath) {
      logger.error(`❌ ${t`Agent not found:`} ${agentName}`);
      process.exit(1);
    }

    // 获取Agent的实际scope用于显示
    const agentScope = workspace.getAgentScope(agentName);

    if (!memoryResult.content.trim()) {
      console.log(`📝 ${t`No memory found for agent:`} ${agentName}`);
      console.log(`💡 ${t`The agent will start with a fresh memory`}`);
      console.log(`📁 ${t`Memory file path:`} ${memoryResult.filePath}`);
      return;
    }

    console.log(`\n🧠 ${t`Memory for agent:`} ${agentName} (${agentScope === 'global' ? '🌍' : '📁'})`);
    console.log('─'.repeat(50));
    console.log(memoryResult.content);
    console.log('─'.repeat(50));
    console.log(`📁 ${t`Memory file:`} ${memoryResult.filePath}`);

  } catch (error) {
    logger.error(`${t`Failed to get memory for agent:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function listAgents() {
  const logger = new Logger();

  try {
    logger.info(`🤖 ${t`Getting agent list...`}`);

    // 智能获取当前工作区
    const currentWorkingDirectory = process.cwd();
    const workspacePath = await getCurrentWorkspacePath();

    logger.info(`📍 ${t`Working directory:`} ${currentWorkingDirectory}`);
    
    if (currentWorkingDirectory !== workspacePath) {
      logger.info(`💡 ${t`Configuration loaded from workspace above`}`);
    }

    // 获取代理列表
    const agents = await Command.getWorkspaceAgentsSummary();

    console.log(`\n🤖 ${t`Agent list:`}`);

    if (agents.length === 0) {
      console.log(`  ${t`No agents available`}`);
      console.log(`\n💡 ${t`Create a new agent with: hyperchat agent create <name>`}`);
      return;
    }

    for (const agentSummary of agents) {
      // agent数据结构是 { config: AgentConfig, chatLogsCount: number, lastChatTime?: number }
      const config = agentSummary.config as AgentConfig;
      const chatLogsCount = (agentSummary.chatLogsCount as number) || 0;

      console.log(`  📋 ${config.name}`);
      if (config.description) {
        console.log(`      ${t`Description:`} ${config.description}`);
      }
      if (config.modelKey) {
        console.log(`      ${t`Model:`} ${config.modelKey}`);
      }
      if (config.tags && config.tags.length > 0) {
        console.log(`      ${t`Tags:`} ${config.tags.join(', ')}`);
      }
      if (chatLogsCount > 0) {
        console.log(`      ${t`Chat logs:`} ${chatLogsCount} ${t`entries`}`);
      }
      
      // 检查是否有记忆文件
      try {
        // 确定Agent的实际scope
        const workspace = workspaceManager.getCurrentWorkspace();
        const agentScope = workspace ? workspace.getAgentScope(config.name) : null;
        
        if (agentScope) {
          const memoryResult = await agentCommands.getAgentMemory({ 
            agentName: config.name, 
            scope: agentScope
          });
          if (memoryResult.content.trim()) {
            console.log(`      🧠 ${t`Has memory data`}`);
          }
        }
      } catch (error) {
        // 忽略记忆文件读取错误
      }
    }

    console.log(`\n💡 ${t`Total:`} ${agents.length} ${t`agents`}`);
    console.log(`💡 ${t`Use 'hyperchat agent memory <name>' to view agent memory`}`);

  } catch (error) {
    logger.error(`${t`Failed to get agent list:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function createAgent(name: string) {
  const logger = new Logger();

  try {
    logger.info(`🤖 ${t`Creating agent:`} ${name}`);

    // 智能获取当前工作区
    const currentWorkingDirectory = process.cwd();
    const workspacePath = await getCurrentWorkspacePath();

    logger.info(`📍 ${t`Working directory:`} ${currentWorkingDirectory}`);
    
    if (currentWorkingDirectory !== workspacePath) {
      logger.info(`💡 ${t`Configuration loaded from workspace above`}`);
    }

    // 记忆获取逻辑现在在 getBuiltinPrompts 内部处理

    // 使用getBuiltinPrompts生成增强的系统提示词
    const basePrompt = `你是一个名为 ${name} 的AI助手。请根据用户的需求提供帮助。`;
    const enhancedPrompt = getBuiltinPrompts(workspacePath, basePrompt, name, "workspace");

    // 创建代理配置
    const agentConfig = {
      name: name,
      prompt: enhancedPrompt.prompt,
      description: `${name} 助手`,
      allowMCPs: [] as string[],
      isConfirmCallTool: false,
      tags: ['cli-created']
    };

    const agent = await Command.createAgent({
      config: agentConfig
    });

    logger.success(`✅ ${t`Agent created successfully`}`);
    console.log(`${t`Name:`} ${agent.name}`);
    console.log(`${t`Description:`} ${agent.description}`);
    console.log(`${t`Enhanced with builtin prompts and memory support`}`);

    console.log(`\n💡 ${t`Use hyperchat`} ${agent.name} ${t`"hello" to chat with this agent`}`);

  } catch (error) {
    logger.error(`${t`Failed to create agent:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * 检查指定的agent是否存在
 */
export async function checkAgentExists(agentName: string): Promise<{ exists: boolean; config?: AgentConfig }> {
  try {
    // Agent 检查只需要配置，不需要启动服务
    const currentWorkingDirectory = process.cwd();
    await workspaceManager.initialize(currentWorkingDirectory);

    const agents = await Command.getWorkspaceAgentsSummary();
    const agentSummary = agents.find(agent => {
      const config = agent.config as AgentConfig;
      return config.name === agentName;
    });

    if (agentSummary) {
      return { exists: true, config: agentSummary.config as AgentConfig };
    }

    return { exists: false };
  } catch (error) {
    return { exists: false };
  }
}

/**
 * 获取Agent的增强提示词（包含记忆和内置提示词）
 */
export async function getEnhancedAgentPrompt(agentName: string, userPrompt: string): Promise<string> {
  try {
    // 获取当前工作区路径
    const workspacePath = await getCurrentWorkspacePath();

    // 记忆获取逻辑现在在 getBuiltinPrompts 内部处理
    // 智能获取当前工作区
    const currentWorkingDirectory = process.cwd();
    await workspaceManager.initialize(currentWorkingDirectory);

    // 使用getBuiltinPrompts生成增强的系统提示词
    const enhancedPrompt = getBuiltinPrompts(workspacePath, userPrompt, agentName, "workspace");
    
    return enhancedPrompt.prompt;
  } catch (error) {
    console.error(`Failed to get enhanced prompt for agent ${agentName}:`, error);
    // 如果出错，返回原始提示词
    return userPrompt;
  }
}