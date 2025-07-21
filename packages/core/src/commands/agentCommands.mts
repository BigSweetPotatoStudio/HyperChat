import { AgentConfig, ChatHistoryItem } from "@dadigua/hyperchat-shared";
import { getWorkspaceManager } from "../workspace/index.mjs";
import fs from 'fs';
import path from 'path';

/**
 * Agent 管理相关命令
 * 包含 Agent 的增删改查、聊天记录管理等功能
 */
export const agentCommands = {

  /**
   * 创建新的 Agent
   * @param config Agent 配置
   * @param scope 创建范围（全局或工作区）
   * @returns 创建的 Agent 配置
   */
  async createAgent({
    config,
    scope
  }: {
    config: Partial<{
      key: string;
      name: string;
      prompt: string;
      description?: string;
      allowMCPs: string[];
      isConfirmCallTool: boolean;
      modelKey?: string;
      temperature?: number;
      tags?: string[];
    }>;
    scope?: "global" | "workspace";
  }): Promise<AgentConfig> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentInstance = await workspace.createAgent(config, scope);

      if (!agentInstance) {
        throw new Error('创建 Agent 失败');
      }

      return agentInstance.getConfig();
    } catch (error) {
      console.error('Failed to create agent:', error);
      throw error;
    }
  },

  /**
   * 获取工作区代理列表
   * @param scope 过滤范围（可选）
   */
  async getWorkspaceAgents({
    scope
  }: {
    scope?: "global" | "workspace";
  } = {}): Promise<Record<string, unknown>[]> {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      return [];
    }
    
    const allAgents = await workspace.getAgents();
    
    // 如果指定了scope，则过滤结果
    if (scope) {
      return allAgents.filter((agent: any) => agent.scope === scope);
    }
    
    return allAgents;
  },

  /**
   * 获取工作区中的所有 Agent
   * @param scope 过滤范围（可选）
   * @returns Agent 配置列表
   */
  async getWorkspaceAgentList({
    scope
  }: {
    scope?: "global" | "workspace";
  } = {}): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const allAgents = await workspace.getAllAgents();
      
      // 如果指定了scope，则过滤结果
      if (scope) {
        return allAgents.filter((agent: any) => agent.scope === scope);
      }
      
      return allAgents;
    } catch (error) {
      console.error('Failed to get agents:', error);
      throw error;
    }
  },

  /**
   * 获取工作区中所有 Agent 的摘要信息
   * @param scope 过滤范围（可选）
   * @returns Agent 摘要信息列表
   */
  async getWorkspaceAgentsSummary({
    scope
  }: {
    scope?: "global" | "workspace";
  } = {}): Promise<Array<{
    config: AgentConfig & { scope?: "global" | "workspace" };
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const allAgentsSummary = await workspace.getAllAgentsSummary();
      
      // 如果指定了scope，则过滤结果
      if (scope) {
        return allAgentsSummary.filter(agentSummary => agentSummary.config.scope === scope);
      }
      
      return allAgentsSummary;
    } catch (error) {
      console.error('Failed to get agent summaries:', error);
      throw error;
    }
  },

  /**
   * 获取指定 Agent 的配置
   * @param agentName Agent 名称
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns Agent 配置
   */
  async getAgent({
    agentName,
    scope
  }: {
    agentName: string;
    scope?: "global" | "workspace";
  }): Promise<Record<string, unknown> | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentConfig = await workspace.getAgent(agentName, scope);
      return agentConfig;
    } catch (error) {
      console.error(`Failed to get agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 更新 Agent 配置
   * @param agentName Agent 名称
   * @param updates 更新的配置
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 更新结果
   */
  async updateAgent({
    agentName,
    updates,
    scope
  }: {
    agentName: string;
    updates: Partial<{
      name: string;
      prompt: string;
      description?: string;
      allowMCPs: string[];
      isConfirmCallTool: boolean;
      modelKey?: string;
      temperature?: number;
      tags?: string[];
    }>;
    scope?: "global" | "workspace";
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.updateAgent(agentName, updates, scope);
    } catch (error) {
      console.error(`Failed to update agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 删除 Agent
   * @param agentName Agent 名称
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 删除结果
   */
  async deleteAgent({
    agentName,
    scope
  }: {
    agentName: string;
    scope?: "global" | "workspace";
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.deleteAgent(agentName, scope);
    } catch (error) {
      console.error(`Failed to delete agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 获取 Agent 的聊天记录（支持全局 Agent）
   * @param agentName Agent 名称
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 聊天记录列表
   */
  async getAgentChatLogs({
    agentName,
    scope
  }: {
    agentName: string;
    scope?: "global" | "workspace";
  }): Promise<{ chatLogs: ChatHistoryItem[] }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const chatLogs = await workspace.getAgentChatLogs(agentName, scope);
      return { chatLogs };
    } catch (error) {
      console.error(`Failed to get chat logs for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 批量获取多个 Agent 的聊天记录
   * @param agentNames Agent 名称数组
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 包含每个 Agent 聊天记录的数组
   */
  async getMultipleAgentChatLogs({
    agentNames,
    scope
  }: {
    agentNames: string[];
    scope?: "global" | "workspace";
  }): Promise<{ results: Array<{ agentName: string; chatLogs: ChatHistoryItem[]; error?: string }> }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const results = await Promise.allSettled(
        agentNames.map(async (agentName) => {
          try {
            const chatLogs = await workspace.getAgentChatLogs(agentName, scope);
            return { agentName, chatLogs };
          } catch (error) {
            console.error(`Failed to get chat logs for agent ${agentName}:`, error);
            return { 
              agentName, 
              chatLogs: [], 
              error: error instanceof Error ? error.message : String(error) 
            };
          }
        })
      );

      return {
        results: results.map(result => 
          result.status === 'fulfilled' 
            ? result.value 
            : { agentName: '', chatLogs: [], error: result.reason }
        )
      };
    } catch (error) {
      console.error('Failed to get multiple agent chat logs:', error);
      throw error;
    }
  },

  /**
   * 删除 Agent 的聊天记录（支持全局 Agent）
   * @param agentName Agent 名称
   * @param chatKey 聊天记录键名
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 删除结果
   */
  async deleteAgentChatLog({
    agentName,
    chatKey,
    scope
  }: {
    agentName: string;
    chatKey: string;
    scope?: "global" | "workspace";
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.deleteAgentChatLog(agentName, chatKey, scope);
    } catch (error) {
      console.error(`Failed to delete chat log ${chatKey} for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 清空 Agent 的所有聊天记录（支持全局 Agent）
   * @param agentName Agent 名称
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 清空结果
   */
  async clearAgentChatLogs({
    agentName,
    scope
  }: {
    agentName: string;
    scope?: "global" | "workspace";
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.clearAgentChatLogs(agentName, scope);
    } catch (error) {
      console.error(`Failed to clear chat logs for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 保存 Agent 聊天记录
   * @param agentName Agent 名称
   * @param chatLog 聊天记录
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 保存结果
   */
  async saveAgentChatLog({
    agentName,
    chatLog,
    scope
  }: {
    agentName: string;
    chatLog: ChatHistoryItem;
    scope?: "global" | "workspace";
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentInstance = workspace.getAgentInstance(agentName, scope);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentName}`);
      }

      // 设置 agentName 确保关联正确
      chatLog.agentName = agentName;
      chatLog.dateTime = Date.now();

      return await agentInstance.setChatLog(chatLog);
    } catch (error) {
      console.error(`Failed to save chat log for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 获取单个 Agent 聊天记录（支持全局 Agent）
   * @param agentName Agent 名称
   * @param chatLogKey 聊天记录键名
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 聊天记录详情
   */
  async getAgentChatLog({
    agentName,
    chatLogKey,
    scope
  }: {
    agentName: string;
    chatLogKey: string;
    scope?: "global" | "workspace";
  }): Promise<ChatHistoryItem | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }
      const agentInstance = workspace.getAgentInstance(agentName, scope);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentName}`);
      }

      // 获取所有聊天记录，然后找到指定的一个
      const chatLogs = await agentInstance.getChatLogs();
      const chatLog = chatLogs.find(log => log.key === chatLogKey);

      return chatLog || null;
    } catch (error) {
      console.error(`Failed to get chat log ${chatLogKey} for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 批量获取多个特定的聊天记录
   * @param requests 包含 agentName, chatLogKey, scope 的请求数组
   * @returns 包含每个聊天记录的数组
   */
  async getBatchChatLogs({
    requests
  }: {
    requests: Array<{
      agentName: string;
      chatLogKey: string;
      scope?: "global" | "workspace";
    }>;
  }): Promise<{ results: Array<{ agentName: string; chatLogKey: string; chatLog: ChatHistoryItem | null; error?: string }> }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const results = await Promise.allSettled(
        requests.map(async (request) => {
          try {
            const agentInstance = workspace.getAgentInstance(request.agentName, request.scope);
            if (!agentInstance) {
              throw new Error(`Agent 不存在: ${request.agentName}`);
            }

            // 获取所有聊天记录，然后找到指定的一个
            const chatLogs = await agentInstance.getChatLogs();
            const chatLog = chatLogs.find(log => log.key === request.chatLogKey);

            return {
              agentName: request.agentName,
              chatLogKey: request.chatLogKey,
              chatLog: chatLog || null
            };
          } catch (error) {
            console.error(`Failed to get chat log ${request.chatLogKey} for agent ${request.agentName}:`, error);
            return {
              agentName: request.agentName,
              chatLogKey: request.chatLogKey,
              chatLog: null,
              error: error instanceof Error ? error.message : String(error)
            };
          }
        })
      );

      return {
        results: results.map(result => 
          result.status === 'fulfilled' 
            ? result.value 
            : { agentName: '', chatLogKey: '', chatLog: null, error: result.reason }
        )
      };
    } catch (error) {
      console.error('Failed to get multiple agent chat logs:', error);
      throw error;
    }
  },

  /**
   * 获取 Agent 记忆文件内容和路径（支持全局 Agent）
   * @param agentName Agent 名称
   * @param scope 查找范围（全局或工作区，默认智能查找）
   * @returns 记忆文件内容和文件路径，如果文件不存在则返回空字符串和路径
   */
  async getAgentMemory({
    agentName,
    scope
  }: {
    agentName: string;
    scope?: "global" | "workspace";
  }): Promise<{ content: string; filePath: string }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 智能查找Agent：如果没有指定scope，则自动查找
      const agentInstance = workspace.getAgentInstance(agentName, scope);
      if (!agentInstance) {
        return { content: '', filePath: '' }; // Agent不存在，返回空字符串
      }

      // 获取Agent的实际scope
      const agentScope = scope || workspace.getAgentScope(agentName);
      if (!agentScope) {
        return { content: '', filePath: '' }; // Agent不存在
      }
      
      let memoryFilePath: string;
      if (agentScope === 'global') {
        // 全局Agent的路径 - 使用 CONSTANTS.GLOBAL_PATH
        const { CONSTANTS } = await import('../workspace/constants.mjs');
        const globalAgentsPath = path.join(CONSTANTS.GLOBAL_PATH, '.hyperchat', 'agents');
        memoryFilePath = path.join(globalAgentsPath, agentName, 'memory.md');
      } else {
        // 工作区Agent的路径
        memoryFilePath = path.join(workspace.workspacePath, '.hyperchat', 'agents', agentName, 'memory.md');
      }

      // 检查文件是否存在
      if (!fs.existsSync(memoryFilePath)) {
        return { content: '', filePath: memoryFilePath };
      }

      // 读取文件内容
      const content = fs.readFileSync(memoryFilePath, 'utf8');
      return { content, filePath: memoryFilePath };
    } catch (error) {
      console.error(`Failed to get memory for agent ${agentName}:`, error);
      throw error;
    }
  }

};