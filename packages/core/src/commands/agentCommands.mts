import { AgentConfig, ChatHistoryItem } from "@dadigua/hyperchat-shared/types";
import { getWorkspaceManager } from "../workspace/index.mjs";

/**
 * Agent 管理相关命令
 * 包含 Agent 的增删改查、聊天记录管理等功能
 */
export const agentCommands = {

  /**
   * 创建新的 Agent
   * @param workspacePath 工作区路径
   * @param config Agent 配置
   * @returns 创建的 Agent 配置
   */
  async createAgent({
    workspacePath,
    config
  }: {
    workspacePath: string;
    config: Partial<{
      key: string;
      name: string;
      prompt: string;
      description?: string;
      allowMCPs: string[];
      confirm_call_tool: boolean;
      modelKey?: string;
      temperature?: number;
      tags?: string[];
    }>;
  }): Promise<AgentConfig> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = await workspace.createAgent(config);

      if (!agentInstance) {
        throw new Error('创建 Agent 失败');
      }

      return agentInstance.getConfig();
    } catch (error) {
      console.error(`Failed to create agent for ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 获取工作区代理列表
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
   * @param workspacePath 工作区路径
   * @returns Agent 配置列表
   */
  async getWorkspaceAgentList({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      return await workspace.getAllAgents();
    } catch (error) {
      console.error(`Failed to get agents for ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 获取工作区中所有 Agent 的摘要信息
   * @returns Agent 摘要信息列表
   */
  async getWorkspaceAgentsSummary(): Promise<Record<string, unknown>[]> {
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
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns Agent 配置
   */
  async getAgent({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<Record<string, unknown> | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentConfig = await workspace.getAgent(agentKey);
      return agentConfig;
    } catch (error) {
      console.error(`Failed to get agent ${agentKey} for ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 更新 Agent 配置
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @param updates 更新的配置
   * @returns 更新结果
   */
  async updateAgent({
    workspacePath,
    agentKey,
    updates
  }: {
    workspacePath: string;
    agentKey: string;
    updates: Partial<{
      name: string;
      prompt: string;
      description?: string;
      allowMCPs: string[];
      confirm_call_tool: boolean;
      modelKey?: string;
      temperature?: number;
      tags?: string[];
    }>;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      return await agentInstance.updateConfig(updates);
    } catch (error) {
      console.error(`Failed to update agent ${agentKey} for ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 删除 Agent
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns 删除结果
   */
  async deleteAgent({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      return await workspace.deleteAgent(agentKey);
    } catch (error) {
      console.error(`Failed to delete agent ${agentKey} for ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 获取 Agent 的聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns 聊天记录列表
   */
  async getAgentChatLogs({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<{ chatLogs: ChatHistoryItem[] }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      const chatLogs = await agentInstance.getChatLogs();
      return { chatLogs };
    } catch (error) {
      console.error(`Failed to get chat logs for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 删除 Agent 的聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @param chatKey 聊天记录键名
   * @returns 删除结果
   */
  async deleteAgentChatLog({
    workspacePath,
    agentKey,
    chatKey
  }: {
    workspacePath: string;
    agentKey: string;
    chatKey: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      return await agentInstance.deleteChatLog(chatKey);
    } catch (error) {
      console.error(`Failed to delete chat log ${chatKey} for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 清空 Agent 的所有聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns 清空结果
   */
  async clearAgentChatLogs({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      return await agentInstance.clearChatLogs();
    } catch (error) {
      console.error(`Failed to clear chat logs for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 保存 Agent 聊天记录
   * @param agentKey Agent 键名
   * @param chatLog 聊天记录
   * @returns 保存结果
   */
  async saveAgentChatLog({
    agentKey,
    chatLog
  }: {
    agentKey: string;
    chatLog: ChatHistoryItem;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      // 设置 agentKey 确保关联正确
      chatLog.agentKey = agentKey;
      chatLog.dateTime = Date.now();

      return await agentInstance.setChatLog(chatLog);
    } catch (error) {
      console.error(`Failed to save chat log for agent ${agentKey}:`, error);
      throw error;
    }
  },

  /**
   * 获取单个 Agent 聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @param chatLogKey 聊天记录键名
   * @returns 聊天记录详情
   */
  async getAgentChatLog({
    workspacePath,
    agentKey,
    chatLogKey
  }: {
    workspacePath: string;
    agentKey: string;
    chatLogKey: string;
  }): Promise<ChatHistoryItem | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }
      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      // 获取所有聊天记录，然后找到指定的一个
      const chatLogs = await agentInstance.getChatLogs();
      const chatLog = chatLogs.find(log => log.key === chatLogKey);

      return chatLog || null;
    } catch (error) {
      console.error(`Failed to get chat log ${chatLogKey} for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  }

};