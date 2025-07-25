/**
 * Web Agent管理器
 * 
 * 支持Web环境下的多Agent并发管理
 * 简单版本：添加、卸载、列表功能
 */

import { AgentInstance } from '../agent/agentInstance.mjs';
import { findAgent } from './utils/agentDiscovery.mjs';

/**
 * Web环境下的多Agent管理器
 */
export class WebAgentManager {
  private agents: Map<string, AgentInstance> = new Map();

  /**
   * 启动Agent（根据路径）
   * @param agentPath Agent路径（作为唯一标识）
   * @param options 启动选项
   */
  async startAgent(agentPath: string, options?: {
    enableMCP?: boolean;
    enableTaskScheduler?: boolean;
  }): Promise<AgentInstance> {
    // 如果已存在且已启动，直接返回
    if (this.agents.has(agentPath)) {
      return this.agents.get(agentPath)!;
    }

    console.log(`🚀 启动Agent: ${agentPath}`);

    // 直接使用路径创建Agent实例
    const agent = new AgentInstance(agentPath);

    // 初始化Agent
    await agent.init();

    // 根据选项启动服务
    const enableMCP = options?.enableMCP !== false; // 默认启用
    if (enableMCP) {
      console.log(`  🔌 启动MCP客户端...`);
      await agent.startMCPClients();
    }

    const enableTaskScheduler = options?.enableTaskScheduler !== false; // 默认启用
    if (enableTaskScheduler) {
      console.log(`  ⏰ 启动任务调度器...`);
      await agent.startTaskScheduler();
    }

    // 添加到管理器
    this.agents.set(agentPath, agent);
    
    console.log(`✅ Agent启动完成: ${agent.getConfig().name}`);
    return agent;
  }

  /**
   * 获取或创建Agent实例
   * @param agentPath Agent路径（作为唯一标识）
   * @param options 初始化选项
   */
  async getOrCreateAgent(agentPath: string, options?: {
    agentName?: string;
    workspace?: string;
    enableMCP?: boolean;
    enableTaskScheduler?: boolean;
  }): Promise<AgentInstance> {
    // 如果已存在，直接返回
    if (this.agents.has(agentPath)) {
      return this.agents.get(agentPath)!;
    }

    let agent: AgentInstance;

    if (options?.agentName) {
      // 通过Agent发现机制查找
      const foundAgent = await findAgent(options.agentName, {
        workspace: options.workspace
      });

      if (!foundAgent) {
        throw new Error(`Agent not found: ${options.agentName}`);
      }

      agent = new AgentInstance(foundAgent.path);
    } else {
      // 直接使用路径创建
      agent = new AgentInstance(agentPath);
    }

    // 初始化Agent
    await agent.init();

    // 根据选项启动服务
    const enableMCP = options?.enableMCP !== false; // 默认启用
    if (enableMCP) {
      await agent.startMCPClients();
    }

    const enableTaskScheduler = options?.enableTaskScheduler !== false; // 默认启用
    if (enableTaskScheduler) {
      await agent.startTaskScheduler();
    }

    // 添加到管理器
    this.agents.set(agentPath, agent);
    
    return agent;
  }

  /**
   * 获取Agent实例（如果存在）
   * @param agentPath Agent路径
   */
  getAgent(agentPath: string): AgentInstance | null {
    return this.agents.get(agentPath) || null;
  }

  /**
   * 卸载Agent
   * @param agentPath Agent路径
   */
  async removeAgent(agentPath: string): Promise<boolean> {
    const agent = this.agents.get(agentPath);
    if (!agent) {
      return false;
    }

    try {
      // 停止Agent服务
      await agent.stopTaskScheduler();
      await agent.stopMCPClients();

      // 从管理器中移除
      this.agents.delete(agentPath);
      
      console.log(`✅ Agent已卸载: ${agentPath}`);
      return true;
    } catch (error) {
      console.error(`❌ Agent卸载失败: ${agentPath}`, error);
      // 即使清理失败，也要从管理器中移除避免泄漏
      this.agents.delete(agentPath);
      return false;
    }
  }

  /**
   * 获取所有Agent实例
   */
  getAllAgents(): AgentInstance[] {
    return Array.from(this.agents.values());
  }

  /**
   * 获取所有Agent路径
   */
  getAgentPaths(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * 检查Agent是否存在
   * @param agentPath Agent路径
   */
  hasAgent(agentPath: string): boolean {
    return this.agents.has(agentPath);
  }

  /**
   * 获取Agent数量
   */
  size(): number {
    return this.agents.size;
  }

  /**
   * 获取Agent摘要信息
   */
  async getAgentSummaries(): Promise<Array<{
    path: string;
    config: any;
    chatLogsCount: number;
    hasMCPConfig: boolean;
    tasksCount: number;
  }>> {
    const summaries = [];
    
    for (const [path, agent] of this.agents) {
      try {
        const summary = await agent.getSummary();
        summaries.push({
          path,
          config: summary.config,
          chatLogsCount: summary.chatLogsCount,
          hasMCPConfig: summary.hasMCPConfig,
          tasksCount: summary.tasksCount,
        });
      } catch (error) {
        console.warn(`获取Agent摘要失败: ${path}`, error);
      }
    }
    
    return summaries;
  }

  /**
   * 卸载所有Agent
   */
  async removeAllAgents(): Promise<void> {
    const paths = Array.from(this.agents.keys());
    const removePromises = paths.map(path => this.removeAgent(path));
    
    await Promise.allSettled(removePromises);
    console.log(`🔥 已卸载所有Agent (${paths.length}个)`);
  }

  /**
   * 销毁管理器（清理所有资源）
   */
  async destroy(): Promise<void> {
    await this.removeAllAgents();
    console.log('🔥 WebAgentManager已销毁');
  }
}

/**
 * 全局WebAgentManager实例
 */
let globalWebAgentManager: WebAgentManager | null = null;

/**
 * 获取全局WebAgentManager实例
 */
export function getWebAgentManager(): WebAgentManager {
  if (!globalWebAgentManager) {
    globalWebAgentManager = new WebAgentManager();
  }
  return globalWebAgentManager;
}

/**
 * 重置全局WebAgentManager实例（用于测试）
 */
export async function resetWebAgentManager(): Promise<void> {
  if (globalWebAgentManager) {
    await globalWebAgentManager.destroy();
    globalWebAgentManager = null;
  }
}