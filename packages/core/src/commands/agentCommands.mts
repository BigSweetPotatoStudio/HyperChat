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
   * @returns Agent 摘要信息列表
   */
  async getWorkspaceAgentsSummary(): Promise<Array<{
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

      return await workspace.getAllAgentsSummary();
    } catch (error) {
      console.error('Failed to get agent summaries:', error);
      throw error;
    }
  },

  /**
   * 获取指定 Agent 的配置
   * @param agentName Agent 名称
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

      const agentInstance = workspace.getAgentInstance(agentName);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentName}`);
      }

      return await agentInstance.updateConfig(updates);
    } catch (error) {
      console.error(`Failed to update agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 删除 Agent
   * @param agentName Agent 名称
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
   * 获取 Agent 的聊天记录（支持全局 Agent）
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
   * 删除 Agent 的聊天记录（不允许删除全局 Agent 的记录）
   * @param agentName Agent 名称
   * @param chatKey 聊天记录键名
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
   * 清空 Agent 的所有聊天记录（不允许清空全局 Agent 的记录）
   * @param agentName Agent 名称
   * @returns 清空结果
   */
  async clearAgentChatLogs({
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
   * @returns 保存结果
   */
  async saveAgentChatLog({
    agentName,
    chatLog
  }: {
    agentName: string;
    chatLog: ChatHistoryItem;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentInstance = workspace.getAgentInstance(agentName);
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
   * @returns 聊天记录详情
   */
  async getAgentChatLog({
    agentName,
    chatLogKey
  }: {
    agentName: string;
    chatLogKey: string;
  }): Promise<ChatHistoryItem | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }
      const agentInstance = workspace.getAgentInstance(agentName);
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
   * 获取 Agent 记忆文件内容（支持全局 Agent）
   * @param agentName Agent 名称
   * @returns 记忆文件内容，如果文件不存在则返回空字符串
   */
  async getAgentMemory({
    agentName
  }: {
    agentName: string;
  }): Promise<string> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 先检查Agent是否存在，并获取其实际路径
      const agentInstance = workspace.getAgentInstance(agentName);
      if (!agentInstance) {
        return ''; // Agent不存在，返回空字符串
      }

      // 获取Agent的实际路径，支持全局和工作区Agent
      const agentScope = workspace.getAgentScope(agentName);
      
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
        return '';
      }

      // 读取文件内容
      const content = fs.readFileSync(memoryFilePath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Failed to get memory for agent ${agentName}:`, error);
      throw error;
    }
  }

};