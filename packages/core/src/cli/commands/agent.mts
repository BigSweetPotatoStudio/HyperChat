/**
 * Agent 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import type { AgentConfig } from '@hyperchat/shared/types';
/**
 * 获取当前工作区路径（使用新的会话管理器，只读模式）
 */
async function getCurrentWorkspacePath(): Promise<string> {

  // workspaceManager is already imported
  await workspaceManager.initialize();
  return workspaceManager.getCurrentWorkspacePath();
}

export async function listAgents() {
  const logger = new Logger();

  try {
    logger.info('🤖 获取代理列表...');

    // 智能获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 使用工作区: ${workspacePath}`);

    // 获取代理列表
    const agents = await Command.getWorkspaceAgentsSummary();

    console.log('\n🤖 代理列表:');

    if (agents.length === 0) {
      console.log('  暂无代理');
      console.log('\n💡 使用 hyperchat agent create <name> 创建新代理');
      return;
    }

    for (const agentSummary of agents) {
      // agent数据结构是 { config: AgentConfig, chatLogsCount: number, lastChatTime?: number }
      const config = agentSummary.config as AgentConfig;
      const chatLogsCount = (agentSummary.chatLogsCount as number) || 0;

      console.log(`  📋 ${config.name} (${config.key})`);
      if (config.description) {
        console.log(`      描述: ${config.description}`);
      }
      if (config.modelKey) {
        console.log(`      模型: ${config.modelKey}`);
      }
      if (config.tags && config.tags.length > 0) {
        console.log(`      标签: ${config.tags.join(', ')}`);
      }
      if (chatLogsCount > 0) {
        console.log(`      聊天记录: ${chatLogsCount} 条`);
      }
    }

    console.log(`\n💡 总计: ${agents.length} 个代理`);

  } catch (error) {
    logger.error('获取代理列表失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function createAgent(name: string) {
  const logger = new Logger();

  try {
    logger.info(`🤖 创建代理: ${name}`);

    // 智能获取当前工作区
    const workspacePath = await getCurrentWorkspacePath();
    logger.info(`🎯 使用工作区: ${workspacePath}`);

    // 创建代理配置
    const agentConfig = {
      name: name,
      prompt: `你是一个名为 ${name} 的AI助手。请根据用户的需求提供帮助。`,
      description: `${name} 助手`,
      allowMCPs: [] as string[],
      confirm_call_tool: false,
      tags: ['cli-created']
    };

    const agent = await Command.createAgent({
      workspacePath,
      config: agentConfig
    });

    logger.success(`✅ 代理创建成功`);
    console.log(`名称: ${agent.name}`);
    console.log(`键名: ${agent.key}`);
    console.log(`描述: ${agent.description}`);

    console.log('\n💡 使用 hyperchat chat --agent ' + agent.key + ' 与该代理对话');

  } catch (error) {
    logger.error('创建代理失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}