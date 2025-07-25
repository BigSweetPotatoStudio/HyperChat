import { AgentConfig, ChatHistoryItem } from "@dadigua/hyperchat-shared";
import { getWorkspaceManager, AgentInstance } from "../workspace/index.mjs";

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
    config
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
  }): Promise<AgentConfig> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentInstance = await workspace.createAgent(config);

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
  async getWorkspaceAgents(): Promise<Record<string, unknown>[]> {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      return [];
    }
    
    return await workspace.getAgents();
  },

  /**
   * 获取工作区中的所有 Agent
   * @param scope 过滤范围（可选）
   * @returns Agent 配置列表
   */
  async getWorkspaceAgentList(): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.getAllAgents();
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
  async getWorkspaceAgentsSummary(): Promise<Array<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.getAllAgentsSummary();
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
    agentName
  }: {
    agentName: string;
  }): Promise<Record<string, unknown> | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentConfig = await workspace.getAgent(agentName);
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
    updates
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
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.updateAgent(agentName, updates);
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
    agentName
  }: {
    agentName: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.deleteAgent(agentName);
    } catch (error) {
      console.error(`Failed to delete agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 获取 Agent 的聊天记录
   * @param agentName Agent 名称
   * @returns 聊天记录列表
   */
  async getAgentChatLogs({
    agentName
  }: {
    agentName: string;
  }): Promise<{ chatLogs: ChatHistoryItem[] }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const chatLogs = await workspace.getAgentChatLogs(agentName);
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
    agentNames
  }: {
    agentNames: string[];
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
            const chatLogs = await workspace.getAgentChatLogs(agentName);
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
    chatKey
  }: {
    agentName: string;
    chatKey: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.deleteAgentChatLog(agentName, chatKey);
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

      return await workspace.clearAgentChatLogs(agentName);
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
      // 使用Agent发现机制获取Agent
      const { findAgent } = await import('../cli/utils/agentDiscovery.mjs');
      const foundAgent = await findAgent(agentName);
      
      if (!foundAgent) {
        throw new Error(`Agent 不存在: ${agentName}`);
      }
      
      // 直接从Agent路径创建实例
      const agentInstance = new AgentInstance(foundAgent.path);
      await agentInstance.init();

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
      // 使用Agent发现机制获取Agent
      const { findAgent } = await import('../cli/utils/agentDiscovery.mjs');
      const foundAgent = await findAgent(agentName);
      
      if (!foundAgent) {
        throw new Error(`Agent 不存在: ${agentName}`);
      }
      
      // 直接从Agent路径创建实例
      const agentInstance = new AgentInstance(foundAgent.path);
      await agentInstance.init();

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
            // 使用Agent发现机制获取Agent
            const { findAgent } = await import('../cli/utils/agentDiscovery.mjs');
            const foundAgent = await findAgent(request.agentName);
            
            if (!foundAgent) {
              throw new Error(`Agent 不存在: ${request.agentName}`);
            }
            
            // 直接从Agent路径创建实例
            const agentInstance = new AgentInstance(foundAgent.path);
            await agentInstance.init();

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
   * 获取 Agent 记忆文件内容和路径
   * @param agentName Agent 名称
   * @returns 记忆文件内容和文件路径，如果文件不存在则返回空字符串和路径
   */
  async getAgentMemory({
    agentName
  }: {
    agentName: string;
  }): Promise<{ content: string; filePath: string }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.getAgentMemory(agentName);
    } catch (error) {
      console.error(`Failed to get memory for agent ${agentName}:`, error);
      throw error;
    }
  }

};