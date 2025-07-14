/**
 * Agent 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import { t } from '../../i18n.mjs';
import type { AgentConfig } from '@dadigua/hyperchat-shared';
/**
 * 获取当前工作区路径（使用新的会话管理器，只读模式）
 */
async function getCurrentWorkspacePath(): Promise<string> {
  // Agent 查询只需要配置，不需要启动服务
  await workspaceManager.initialize();
  return workspaceManager.getCurrentWorkspacePath();
}

export async function listAgents() {
  const logger = new Logger();

  try {
    logger.info(`🤖 ${t`Getting agent list...`}`);

    // 智能获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 ${t`Using workspace: ${workspacePath}`}`);

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
        console.log(`      ${t`Description: ${config.description}`}`);
      }
      if (config.modelKey) {
        console.log(`      ${t`Model: ${config.modelKey}`}`);
      }
      if (config.tags && config.tags.length > 0) {
        console.log(`      ${t`Tags: ${config.tags.join(', ')}`}`);
      }
      if (chatLogsCount > 0) {
        console.log(`      ${t`Chat logs: ${chatLogsCount} entries`}`);
      }
    }

    console.log(`\n💡 ${t`Total: ${agents.length} agents`}`);

  } catch (error) {
    logger.error(t`Failed to get agent list: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

export async function createAgent(name: string) {
  const logger = new Logger();

  try {
    logger.info(`🤖 ${t`Creating agent: ${name}`}`);

    // 智能获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 ${t`Using workspace: ${workspacePath}`}`);

    // 创建代理配置
    const agentConfig = {
      name: name,
      prompt: `你是一个名为 ${name} 的AI助手。请根据用户的需求提供帮助。`,
      description: `${name} 助手`,
      allowMCPs: [] as string[],
      isConfirmCallTool: false,
      tags: ['cli-created']
    };

    const agent = await Command.createAgent({
      workspacePath,
      config: agentConfig
    });

    logger.success(`✅ ${t`Agent created successfully`}`);
    console.log(`${t`Name: ${agent.name}`}`);
    console.log(`${t`Description: ${agent.description}`}`);

    console.log('\n💡 使用 hyperchat ' + agent.name + ' "你好" 与该代理对话');

  } catch (error) {
    logger.error(t`Failed to create agent: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * 检查指定的agent是否存在
 */
export async function checkAgentExists(agentName: string): Promise<{ exists: boolean; config?: AgentConfig }> {
  try {
    // Agent 检查只需要配置，不需要启动服务
    await workspaceManager.initialize();
    
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