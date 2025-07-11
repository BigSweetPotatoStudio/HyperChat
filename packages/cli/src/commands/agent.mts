/**
 * Agent 命令实现
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../../core/dist/command.mjs';

export async function listAgents() {
  const logger = new Logger();
  
  try {
    logger.info('🤖 获取代理列表...');
    
    // 获取全局工作区
    const globalWorkspace = await Command.getGlobalWorkspace();
    const workspacePath = globalWorkspace.path;
    
    // 获取代理列表
    const agents = await Command.getWorkspaceAgentsSummary({ workspacePath });
    
    console.log('\n🤖 代理列表:');
    
    if (agents.length === 0) {
      console.log('  暂无代理');
      console.log('\n💡 使用 hyperchat agent create <name> 创建新代理');
      return;
    }
    
    for (const agent of agents) {
      console.log(`  📋 ${agent.name} (${agent.key})`);
      if (agent.description) {
        console.log(`      描述: ${agent.description}`);
      }
      if (agent.modelKey) {
        console.log(`      模型: ${agent.modelKey}`);
      }
      if ((agent as any).tags && (agent as any).tags.length > 0) {
        console.log(`      标签: ${(agent as any).tags.join(', ')}`);
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
    
    // 获取全局工作区
    const globalWorkspace = await Command.getGlobalWorkspace();
    const workspacePath = globalWorkspace.path;
    
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