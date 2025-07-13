import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import { CONSTANTS } from "./constants.mjs";
import {
  WorkspaceConfig,
  WorkspaceSettings,
  WorkspaceFileNode,
  AgentConfig,
  validateWorkspaceConfig
} from "./types.mjs";
import type { ChatHistoryItem } from "@dadigua/hyperchat-shared/types";
import type { MCPServerConfig } from "@dadigua/hyperchat-shared/types";
import { AgentManager } from "./agentManager.mjs";
import { WorkspaceMCPManager } from "./mcp/manager.mjs";
import type { WorkspaceMCPClientImpl } from "./mcp/client.mjs";
import { WorkspaceSettingsManager } from "../data/managers/workspaceSettingsManager.mjs";
import { TaskManager } from "../data/managers/taskManager.mjs";
import { Logger } from "../log.mjs";

/**
 * 工作区类 - 封装单个工作区的所有操作
 */
export class Workspace {
  private config: WorkspaceConfig;
  private agentManager: AgentManager;
  private mcpManager: WorkspaceMCPManager;
  private settingsManager: WorkspaceSettingsManager;
  private taskManager: TaskManager;
  private fileTree?: WorkspaceFileNode;
  private lastSync?: number;
  private readonly HYPERCHAT_DIR = CONSTANTS.HYPERCHAT_DIR;
  private isGlobal: boolean;

  constructor(public workspacePath: string, config?: WorkspaceConfig) {
    // 检查是否为全局工作区
    this.isGlobal = workspacePath === CONSTANTS.GLOBAL_PATH;

    // 检查当前目录是否是工作区
    const isCurrentDirWorkspace = this.isWorkspaceDirectory(workspacePath);

    // 如果不是工作区且不是全局工作区，则使用全局工作区路径
    const effectiveWorkspacePath = isCurrentDirWorkspace || this.isGlobal
      ? workspacePath
      : CONSTANTS.GLOBAL_PATH;

    const hyperChatPath = path.join(effectiveWorkspacePath, this.HYPERCHAT_DIR);

    this.config = config || {
      name: this.isGlobal ? 'Global Workspace' : path.basename(workspacePath),
      created: Date.now(),
      settings: {
      },
    };

    this.agentManager = new AgentManager(path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS));

    // 创建MCP管理器
    this.mcpManager = new WorkspaceMCPManager(
      effectiveWorkspacePath,
      {
        autoReconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        enableLogging: true,
      },
      {
        onClientStatusChange: (client) => {
          Logger.info(`MCP客户端状态变化: ${client.serverName} -> ${client.status}`);
        },
        onConfigUpdate: (config) => {
          Logger.info(`MCP配置更新: ${config.workspacePath}`);
        },
        onError: (error, context) => {
          Logger.error("MCP管理器错误:", error, context);
        },
      }
    );

    // 初始化设置管理器
    this.settingsManager = new WorkspaceSettingsManager(hyperChatPath);

    // 初始化任务管理器
    this.taskManager = new TaskManager(effectiveWorkspacePath);
  }

  /**
   * 检查指定路径是否为工作区（是否包含 .hyperchat 文件夹）
   */
  private isWorkspaceDirectory(directoryPath: string): boolean {
    const hyperChatPath = path.join(directoryPath, this.HYPERCHAT_DIR);
    return fs.existsSync(hyperChatPath) && fs.statSync(hyperChatPath).isDirectory();
  }

  /**
   * 获取工作区配置
   */
  getConfig(): WorkspaceConfig {
    return this.config;
  }


  /**
   * 获取 .hyperchat 目录路径
   */
  getHyperChatPath(): string {
    return path.join(this.workspacePath, this.HYPERCHAT_DIR);
  }

  /**
   * 初始化工作区
   */
  async init(): Promise<void> {
    // 创建目录结构
    await this.createDirectories();

    // MCP 管理器不需要显式初始化

    // 初始化设置管理器
    await this.settingsManager.init();

    // 初始化任务管理器
    await this.taskManager.init();

    // 加载数据
    await this.load();

    // 保存配置
    await this.saveConfig();
  }

  /**
   * 清理工作区，释放资源
   */
  async uninit(): Promise<void> {
    try {
      // 停止 MCP 客户端
      await this.stopMcpClients();


      // 保存当前状态
      await this.save();
    } catch (error) {
      console.warn('清理工作区失败:', error);
      throw error;
    }
  }

  /**
   * 创建工作区目录结构
   */
  private async createDirectories(): Promise<void> {
    const hyperChatPath = this.getHyperChatPath();
    const directories = [
      hyperChatPath,
      path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS),
      path.join(hyperChatPath, CONSTANTS.DIRECTORIES.KNOWLEDGE),
      path.join(hyperChatPath, CONSTANTS.DIRECTORIES.TEMP),
      path.join(hyperChatPath, "tasks"),
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }
    }
    // 创建默认配置文件
    const defaultFiles = [
      { name: CONSTANTS.CONFIG_FILES.MCP, content: JSON.stringify({ mcpServers: {} }, null, 2) },
    ];

    for (const file of defaultFiles) {
      const filePath = path.join(hyperChatPath, file.name);
      if (!fs.existsSync(filePath)) {
        await fs.promises.writeFile(filePath, file.content, "utf-8");
      }
    }
  }

  /**
   * 加载工作区数据
   */
  async load(): Promise<void> {
    const hyperChatPath = this.getHyperChatPath();

    // 加载配置文件（支持全局+工作区合并）
    await this.loadMergedConfig();

    // 加载 agents
    await this.agentManager.init();

    // 启动MCP客户端
    await this.mcpManager.startClients();
  }

  /**
   * 从settings.jsonc加载工作区元数据
   */
  private async loadMergedConfig(): Promise<void> {
    await this.loadWorkspaceMetaFromSettings();
  }

  /**
   * 从settingsManager加载工作区元数据
   */
  private async loadWorkspaceMetaFromSettings(): Promise<void> {
    try {
      // 确保工作区元数据已初始化
      await this.settingsManager.initializeWorkspaceMetadata(
        this.config.name, 
        this.config.description
      );

      // 从settingsManager获取工作区元数据
      const metadata = this.settingsManager.getWorkspaceMetadata();
      if (metadata) {
        this.config.name = metadata.name || this.config.name;
        this.config.description = metadata.description;
        this.config.created = metadata.created || 0;
      }

      // 从AI设置映射到WorkspaceSettings
      const aiSettings = this.settingsManager.getAI();
      this.config.settings = {
        defaultModel: aiSettings.defaultModel,
        defaultAgent: aiSettings.defaultAgent,
      };
    } catch (error) {
      console.warn('从settings加载工作区元数据失败:', error);
    }
  }


  /**
   * 保存工作区配置到settings.jsonc
   */
  async saveConfig(): Promise<void> {
    try {
      // 更新工作区元数据
      await this.settingsManager.updateWorkspaceMetadata({
        name: this.config.name,
        description: this.config.description,
        created: this.config.created,
      });

      // 同步AI设置
      if (this.config.settings?.defaultModel || this.config.settings?.defaultAgent) {
        const aiUpdates: any = {};
        if (this.config.settings.defaultModel) {
          aiUpdates.defaultModel = this.config.settings.defaultModel;
        }
        if (this.config.settings.defaultAgent) {
          aiUpdates.defaultAgent = this.config.settings.defaultAgent;
        }
        await this.settingsManager.updateAI(aiUpdates);
      }
    } catch (error) {
      console.warn(`保存工作区配置失败:`, error);
    }
  }


  /**
   * 保存所有数据
   */
  async save(): Promise<void> {
    await this.saveConfig();
    this.lastSync = Date.now();
  }

  // ========== Agent 管理 ==========

  /**
   * 获取所有 agents（支持全局+工作区合并）
   */
  async getAgents(): Promise<AgentConfig[]> {
    // 检查当前目录是否是工作区
    const isCurrentDirWorkspace = this.isWorkspaceDirectory(this.workspacePath);

    if (isCurrentDirWorkspace && !this.isGlobal) {
      // 如果是工作区且不是全局工作区，获取合并的Agents
      return await this.getMergedAgents();
    } else {
      // 如果不是工作区或者是全局工作区，直接返回当前AgentManager的Agents
      return await this.agentManager.getAllAgents();
    }
  }

  /**
   * 获取合并的 agents（全局 + 当前工作区）
   */
  async getMergedAgents(): Promise<AgentConfig[]> {
    // 获取全局Agents
    const globalAgentManager = new (await import('./agentManager.mjs')).AgentManager(
      path.join(CONSTANTS.GLOBAL_PATH, this.HYPERCHAT_DIR, CONSTANTS.DIRECTORIES.AGENTS)
    );
    await globalAgentManager.init();
    const globalAgents = await globalAgentManager.getAllAgents();

    // 获取当前工作区Agents
    const workspaceAgents = await this.agentManager.getAllAgents();

    // 创建一个 Map 来去重，工作区的配置覆盖全局配置
    const mergedAgentsMap = new Map<string, AgentConfig>();

    // 先添加全局 agents
    globalAgents.forEach(agent => {
      mergedAgentsMap.set(agent.key, { ...agent, type: 'builtin' });
    });

    // 再添加工作区 agents，会覆盖同名的全局 agents
    workspaceAgents.forEach(agent => {
      mergedAgentsMap.set(agent.key, { ...agent, type: 'custom' });
    });

    return Array.from(mergedAgentsMap.values());
  }

  /**
   * 获取所有 agents (别名，为了兼容性)
   */
  async getAllAgents(): Promise<AgentConfig[]> {
    return await this.agentManager.getAllAgents();
  }

  /**
   * 获取所有 agents 摘要信息
   */
  async getAllAgentsSummary(): Promise<Array<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    return await this.agentManager.getAllAgentsSummary();
  }

  /**
   * 创建新的 agent
   */
  async createAgent(config: Partial<AgentConfig>): Promise<import("./agentManager.mjs").AgentInstance | null> {
    return await this.agentManager.createAgent(config);
  }

  /**
   * 获取单个 agent 实例
   */
  getAgentInstance(key: string): import("./agentManager.mjs").AgentInstance | null {
    return this.agentManager.getAgent(key);
  }

  /**
   * 获取单个 agent 配置
   */
  async getAgent(key: string): Promise<AgentConfig | null> {
    const instance = this.agentManager.getAgent(key);
    return instance ? instance.getConfig() : null;
  }

  /**
   * 创建或更新 agent
   */
  async setAgent(agent: Partial<AgentConfig>): Promise<boolean> {
    if (agent.key) {
      // 更新现有 agent
      const instance = this.agentManager.getAgent(agent.key);
      if (instance) {
        return await instance.updateConfig(agent);
      }
    }

    // 创建新 agent
    const newAgent = await this.agentManager.createAgent(agent);
    return newAgent !== null;
  }

  /**
   * 删除 agent
   */
  async deleteAgent(key: string): Promise<boolean> {
    return await this.agentManager.deleteAgent(key);
  }

  /**
   * 获取所有 agents 数量
   */
  async getAgentsCount(): Promise<number> {
    return this.agentManager.getAgentsCount();
  }

  /**
   * 获取 Agent 的聊天记录
   */
  async getAgentChatLogs(agentKey: string): Promise<ChatHistoryItem[]> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.getChatLogs() : [];
  }

  /**
   * 添加 Agent 聊天记录
   */
  async addAgentChatLog(agentKey: string, chatLog: ChatHistoryItem): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.setChatLog(chatLog) : false;
  }

  /**
   * 删除 Agent 聊天记录
   */
  async deleteAgentChatLog(agentKey: string, chatKey: string): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.deleteChatLog(chatKey) : false;
  }

  /**
   * 清空 Agent 所有聊天记录
   */
  async clearAgentChatLogs(agentKey: string): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.clearChatLogs() : false;
  }

  /**
   * 获取 Agent 聊天记录数量
   */
  async getAgentChatLogsCount(agentKey: string): Promise<number> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.getChatLogsCount() : 0;
  }

  /**
   * 获取 Agent 摘要信息
   */
  async getAgentSummary(agentKey: string): Promise<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  } | null> {
    const instance = this.agentManager.getAgent(agentKey);
    return instance ? await instance.getSummary() : null;
  }

  // ========== MCP 管理 ==========

  /**
   * 获取 MCP 客户端
   */
  getMcpClients(): WorkspaceMCPClientImpl[] {
    return this.mcpManager.getClientsByWorkspace();
  }

  /**
   * 获取所有 MCP 客户端（包含全局的）
   */
  getAllMcpClients(): WorkspaceMCPClientImpl[] {
    return this.mcpManager.getAllClients();
  }

  /**
   * 启动工作区 MCP 服务
   */
  async startMcpClients(): Promise<WorkspaceMCPClientImpl[]> {
    try {
      const clients = await this.mcpManager.startClients();
      Logger.info(`工作区 MCP 服务已启动: ${this.workspacePath}`);
      return clients;
    } catch (error) {
      Logger.error(`启动工作区 MCP 服务失败: ${this.workspacePath}`, error);
      throw error;
    }
  }

  /**
   * 停止工作区 MCP 服务
   */
  async stopMcpClients(): Promise<void> {
    try {
      await this.mcpManager.stopClients();
      Logger.info(`工作区 MCP 服务已停止: ${this.workspacePath}`);
    } catch (error) {
      Logger.error(`停止工作区 MCP 服务失败: ${this.workspacePath}`, error);
      throw error;
    }
  }

  /**
   * 重新加载工作区 MCP 配置
   */
  async reloadMcpClients(): Promise<WorkspaceMCPClientImpl[]> {
    try {
      await this.stopMcpClients();
      return await this.startMcpClients();
    } catch (error) {
      Logger.error(`重新加载工作区 MCP 配置失败: ${this.workspacePath}`, error);
      throw error;
    }
  }

  /**
   * 管理单个 MCP 客户端
   */
  async manageMcpClient(clientName: string, action: 'restart' | 'disable' | 'delete'): Promise<void> {
    try {
      switch (action) {
        case 'delete':
          await this.mcpManager.deleteServerConfig(clientName);
          break;
        case 'disable':
          await this.mcpManager.stopClient(clientName);
          break;
        case 'restart':
        default:
          await this.mcpManager.restartClient(clientName);
          break;
      }
      Logger.info(`MCP客户端 ${clientName} ${action} 操作完成`);
    } catch (error) {
      Logger.error(`MCP客户端 ${clientName} ${action} 操作失败:`, error);
      throw error;
    }
  }


  /**
   * 销毁工作区时清理 MCP 管理器
   */
  async destroy(): Promise<void> {
    try {
      await this.mcpManager.destroy();
      Logger.info(`工作区已销毁: ${this.workspacePath}`);
    } catch (error) {
      Logger.error(`销毁工作区失败: ${this.workspacePath}`, error);
      throw error;
    }
  }

  /**
   * 添加或更新单个 MCP 服务器配置
   */
  async setMcpServer(name: string, config: MCPServerConfig): Promise<void> {
    try {
      await this.mcpManager.setServerConfig(name, config);
      Logger.info(`MCP服务器配置已设置: ${name}`);
    } catch (error) {
      Logger.error(`设置MCP服务器配置失败: ${name}`, error);
      throw error;
    }
  }

  /**
   * 删除 MCP 服务器配置
   */
  async deleteMcpServer(name: string): Promise<void> {
    try {
      await this.mcpManager.deleteServerConfig(name);
      Logger.info(`MCP服务器配置已删除: ${name}`);
    } catch (error) {
      Logger.error(`删除MCP服务器配置失败: ${name}`, error);
      throw error;
    }
  }


  // ========== 文件树管理 ==========

  /**
   * 扫描并更新文件树
   */
  async updateFileTree(options: {
    includeHidden?: boolean;
    maxDepth?: number;
    excludePatterns?: string[];
  } = {}): Promise<boolean> {
    try {
      this.fileTree = await this.scanFiles(this.workspacePath, options);
      return true;
    } catch (error) {
      console.error('更新文件树失败:', error);
      return false;
    }
  }

  /**
   * 获取文件树
   */
  getFileTree(): WorkspaceFileNode | undefined {
    return this.fileTree;
  }

  /**
   * 扫描文件
   */
  private async scanFiles(workspacePath: string, options: {
    includeHidden?: boolean;
    maxDepth?: number;
    excludePatterns?: string[];
  } = {}): Promise<WorkspaceFileNode> {
    const { includeHidden = false, maxDepth = 10, excludePatterns = [] } = options;

    const scanDirectory = async (dirPath: string, depth: number = 0): Promise<WorkspaceFileNode> => {
      const stats = await fs.promises.stat(dirPath);
      const name = path.basename(dirPath);

      const node: WorkspaceFileNode = {
        name,
        path: dirPath,
        type: "directory",
        modified: stats.mtime.getTime(),
        children: [],
      };

      if (depth >= maxDepth) {
        return node;
      }

      try {
        const entries = await fs.promises.readdir(dirPath);

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry);
          const entryStats = await fs.promises.stat(fullPath);

          // 跳过隐藏文件
          if (!includeHidden && entry.startsWith('.')) {
            continue;
          }

          // 跳过排除模式
          if (excludePatterns.some(pattern => entry.includes(pattern))) {
            continue;
          }

          if (entryStats.isDirectory()) {
            const childNode = await scanDirectory(fullPath, depth + 1);
            node.children!.push(childNode);
          } else {
            const fileNode: WorkspaceFileNode = {
              name: entry,
              path: fullPath,
              type: "file",
              size: entryStats.size,
              modified: entryStats.mtime.getTime(),
              extension: path.extname(entry).toLowerCase(),
            };
            node.children!.push(fileNode);
          }
        }
      } catch (error) {
        console.warn(`无法读取目录 ${dirPath}:`, error);
      }

      return node;
    };

    return await scanDirectory(workspacePath);
  }

  // ========== 工具方法 ==========

  /**
   * 删除整个工作区
   */
  async delete(): Promise<boolean> {
    try {
      // 停止 MCP 客户端
      await this.stopMcpClients();

      // 销毁 MCP 管理器
      await this.mcpManager.destroy();

      const hyperChatPath = this.getHyperChatPath();
      if (fs.existsSync(hyperChatPath)) {
        await fs.promises.rm(hyperChatPath, { recursive: true, force: true });
      }
      return true;
    } catch (error) {
      console.warn(`删除工作区失败:`, error);
      return false;
    }
  }

  /**
   * 检查工作区是否存在
   */
  exists(): boolean {
    return fs.existsSync(this.getHyperChatPath());
  }

  /**
   * 获取设置管理器
   */
  getSettingsManager(): WorkspaceSettingsManager {
    return this.settingsManager;
  }

  /**
   * 获取设置
   */
  getSettings() {
    return this.settingsManager.getSettings();
  }

  /**
   * 更新设置
   */
  async updateSettings(updates: Parameters<WorkspaceSettingsManager['updateSettings']>[0]) {
    return this.settingsManager.updateSettings(updates);
  }

  /**
   * 获取工作区信息摘要
   */
  async getSummary(): Promise<{
    agentsCount: number;
    mcpServersCount: number;
    tasksCount: number;
    lastSync?: number;
  }> {
    const taskStats = await this.taskManager.getTaskStats();
    return {
      agentsCount: await this.getAgentsCount(),
      mcpServersCount: this.getMcpClients().length,
      tasksCount: taskStats.total,
      lastSync: this.lastSync,
    };
  }

  // ========== 任务管理 ==========

  /**
   * 获取任务管理器
   */
  getTaskManager(): TaskManager {
    return this.taskManager;
  }

  /**
   * 创建任务
   */
  async createTask(taskData: Parameters<TaskManager['createTask']>[0]) {
    return await this.taskManager.createTask(taskData);
  }

  /**
   * 获取单个任务
   */
  async getTask(taskName: string) {
    return await this.taskManager.getTask(taskName);
  }

  /**
   * 获取所有任务
   */
  async getAllTasks() {
    return await this.taskManager.getAllTasks();
  }

  /**
   * 更新任务
   */
  async updateTask(taskName: string, updates: Parameters<TaskManager['updateTask']>[1]) {
    return await this.taskManager.updateTask(taskName, updates);
  }

  /**
   * 删除任务
   */
  async deleteTask(taskName: string) {
    return await this.taskManager.deleteTask(taskName);
  }

  /**
   * 启用任务
   */
  async enableTask(taskName: string) {
    return await this.taskManager.enableTask(taskName);
  }

  /**
   * 禁用任务
   */
  async disableTask(taskName: string) {
    return await this.taskManager.disableTask(taskName);
  }

  /**
   * 获取已启用的任务
   */
  async getEnabledTasks() {
    return await this.taskManager.getEnabledTasks();
  }

  /**
   * 获取已禁用的任务
   */
  async getDisabledTasks() {
    return await this.taskManager.getDisabledTasks();
  }

  /**
   * 根据 agent 获取任务
   */
  async getTasksByAgent(agentKey: string) {
    return await this.taskManager.getTasksByAgent(agentKey);
  }

  /**
   * 复制任务
   */
  async cloneTask(taskName: string, newTaskName: string) {
    return await this.taskManager.cloneTask(taskName, newTaskName);
  }


  /**
   * 获取任务统计信息
   */
  async getTaskStats() {
    return await this.taskManager.getTaskStats();
  }

}