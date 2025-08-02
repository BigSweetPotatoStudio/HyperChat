/**
 * CLI Agent管理器
 * 
 * 在Agent-centered架构下，管理当前CLI会话的活动Agent实例
 * 提供单例模式的Agent管理，确保资源正确初始化和清理
 */

import { AgentInstance } from '../workspace/index.mjs';
import { findAgent, DEFAULT_AGENT_NAME } from './utils/agentDiscovery.mjs';

/**
 * 全局Agent管理器类
 * 单例模式，管理当前CLI会话中的活动Agent
 */
export class CliAgentManager {
  private static instance: CliAgentManager | null = null;
  private currentAgent: AgentInstance | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): CliAgentManager {
    if (!CliAgentManager.instance) {
      CliAgentManager.instance = new CliAgentManager();
    }
    return CliAgentManager.instance;
  }

  /**
   * 初始化Agent（如果尚未初始化）
   */
  async ensureAgent(options: {
    agentName?: string;
    agentPath?: string;
    workspace?: string;
  } = {}): Promise<AgentInstance> {

    // 如果已经有Agent实例，直接返回
    if (this.currentAgent && this.isInitialized) {
      return this.currentAgent;
    }

    // 使用Agent发现机制获取Agent
    let agentName = options.agentName || DEFAULT_AGENT_NAME;
    
    const foundAgent = await findAgent(agentName, {
      agentPath: options.agentPath,
      workspace: options.workspace
    });

    if (!foundAgent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // 创建新的Agent实例
    this.currentAgent = new AgentInstance(foundAgent.path);
    await this.currentAgent.init();
    
    // 启动MCP客户端（chat和run命令都需要）
    await this.currentAgent.startMCPClients();
    
    
    this.isInitialized = true;

    return this.currentAgent;
  }

  /**
   * 获取当前Agent实例
   */
  getAgent(): AgentInstance | null {
    return this.currentAgent;
  }

  /**
   * 检查是否已初始化Agent
   */
  isAgentInitialized(): boolean {
    return this.isInitialized && this.currentAgent !== null;
  }

  /**
   * 清理当前Agent资源
   */
  async cleanup(): Promise<void> {
    if (this.currentAgent) {
      try {
        // 停止Agent的MCP客户端
        await this.currentAgent.stopMCPClients();
        
        // 清理Agent资源
        // AgentInstance没有显式的cleanup方法，but已停止相关服务
        
      } catch (error) {
        console.warn(`Agent cleanup error:`, error);
      }
      
      this.currentAgent = null;
      this.isInitialized = false;
    }
  }

  /**
   * 重置管理器（用于测试或重新初始化）
   */
  static reset(): void {
    if (CliAgentManager.instance) {
      CliAgentManager.instance.cleanup();
      CliAgentManager.instance = null;
    }
  }
}

/**
 * 导出全局实例
 */
export const cliAgentManager = CliAgentManager.getInstance();

/**
 * 便捷的导出函数
 */
export async function getAgent(options?: {
  agentName?: string;
  agentPath?: string;
  workspace?: string;
}): Promise<AgentInstance> {
  return await cliAgentManager.ensureAgent(options);
}

/**
 * 获取当前Agent（如果已初始化）
 */
export function getCurrentAgent(): AgentInstance | null {
  return cliAgentManager.getAgent();
}

/**
 * 清理Agent资源
 */
export async function cleanupAgent(): Promise<void> {
  return await cliAgentManager.cleanup();
}