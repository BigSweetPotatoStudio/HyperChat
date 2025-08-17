import { AgentConfig, ChatHistoryItem } from "@dadigua/hyperchat-shared";
import { getWorkspaceManager, AgentInstance } from "../workspace/index.mjs";
import { TaskQueue } from "../utils/taskQueue.mjs";

// 创建聊天日志保存队列，确保按顺序写入，避免YAML文件并发问题
const chatLogQueue = new TaskQueue({ concurrency: 1 });

/**
 * Agent 管理相关命令
 * 包含 Agent 的增删改查、聊天记录管理等功能
 */
export const agentCommands = {

  /**
   * 创建新的 Agent
   * @param config Agent 配置
   * @param workspacePath 工作区路径（可选）
   * @returns 创建的 Agent 配置
   */
  async createAgent({
    config,
    workspacePath
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
    workspacePath?: string;
  }): Promise<AgentConfig> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
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
   * @param workspacePath 工作区路径（可选）
   * @returns 更新结果
   */
  async updateAgent({
    agentName,
    updates,
    workspacePath
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
    workspacePath?: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
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
   * @param workspacePath 工作区路径（可选）
   * @returns 删除结果
   */
  async deleteAgent({
    agentName,
    workspacePath
  }: {
    agentName: string;
    workspacePath?: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
      }

      return await workspace.deleteAgent(agentName);
    } catch (error) {
      console.error(`Failed to delete agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 获取 Agent 的聊天记录（支持分页）
   * @param agentName Agent 名称
   * @param page 页码（从0开始）
   * @param pageSize 每页数量，默认10条
   * @returns 分页的聊天记录列表
   */
  async getAgentChatLogs({
    agentName,
    page = 0,
    pageSize = 10,
    workspacePath
  }: {
    agentName: string;
    page?: number;
    pageSize?: number;
    workspacePath?: string;
  }): Promise<{ 
    chatLogs: ChatHistoryItem[];
    total: number;
    hasMore: boolean;
    page: number;
    pageSize: number;
  }> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
      }

      const result = await workspace.getAgentChatLogsPage(agentName, page, pageSize);
      return {
        chatLogs: result.chatLogs,
        total: result.total,
        hasMore: result.hasMore,
        page,
        pageSize
      };
    } catch (error) {
      console.error(`Failed to get chat logs for agent ${agentName}:`, error);
      throw error;
    }
  },

  /**
   * 删除 Agent 的聊天记录
   * @param agentName Agent 名称
   * @param chatKey 聊天记录键名
   * @param workspacePath 工作区路径（可选）
   * @returns 删除结果
   */
  async deleteAgentChatLog({
    agentName,
    chatKey,
    workspacePath
  }: {
    agentName: string;
    chatKey: string;
    workspacePath?: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
      }

      return await workspace.deleteAgentChatLog(agentName, chatKey);
    } catch (error) {
      console.error(`Failed to delete chat log ${chatKey} for agent ${agentName}:`, error);
      throw error;
    }
  },


  /**
   * 获取单个 Agent 聊天记录
   * @param agentName Agent 名称
   * @param chatLogKey 聊天记录键名
   * @param workspacePath 工作区路径（可选）
   * @returns 聊天记录详情
   */
  async getAgentChatLog({
    agentName,
    chatLogKey,
    workspacePath
  }: {
    agentName: string;
    chatLogKey: string;
    workspacePath?: string;
  }): Promise<ChatHistoryItem | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
      }

      // 通过工作区获取Agent实例
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
   * 获取 Agent 记忆文件内容和路径
   * @param agentName Agent 名称
   * @param workspacePath 工作区路径（可选）
   * @returns 记忆文件内容和文件路径，如果文件不存在则返回空字符串和路径
   */
  async getAgentMemory({
    agentName,
    workspacePath
  }: {
    agentName: string;
    workspacePath?: string;
  }): Promise<{ content: string; filePath: string }> {
    try {
      const workspaceManager = getWorkspaceManager();
      let workspace;
      
      if (workspacePath) {
        workspace = await workspaceManager.get(workspacePath, true);
        if (!workspace) {
          throw new Error(`工作区不存在: ${workspacePath}`);
        }
        if (!workspace.isInitialized()) {
          await workspace.initialize();
        }
      } else {
        workspace = workspaceManager.getCurrentWorkspace();
        if (!workspace) {
          throw new Error('当前没有可用的工作区');
        }
      }

      return await workspace.getAgentMemory(agentName);
    } catch (error) {
      console.error(`Failed to get memory for agent ${agentName}:`, error);
      throw error;
    }
  }

};