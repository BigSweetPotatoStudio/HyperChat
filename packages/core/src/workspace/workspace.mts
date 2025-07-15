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
import * as cron from "node-cron";
import {
  initializeAIEnvironment,
  createAIChannel,
  addSystemMessage,
  executeAICompletion
} from "../utils/aiConfigHelper.mjs";

/**
 * 工作区状态枚举
 */
export enum WorkspaceState {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 配置已加载，但服务未启动 */
  INITIALIZED = 'initialized',
  /** 所有服务已启动，完全可用 */
  STARTED = 'started',
  /** 正在关闭中 */
  STOPPING = 'stopping',
  /** 已关闭 */
  STOPPED = 'stopped'
}

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
  private effectiveConfigPath: string;

  // 工作区状态管理
  private state: WorkspaceState = WorkspaceState.UNINITIALIZED;

  // 任务调度相关
  private taskJobs: Map<string, cron.ScheduledTask> = new Map();
  private isTaskSchedulerRunning: boolean = false;

  constructor(public workspacePath: string) {
    // 检查当前目录是否是工作区（包含 .hyperchat 目录）
    const hasHyperChatDir = this.isWorkspaceDirectory(workspacePath);

    // 确定有效的配置路径
    // 如果有 .hyperchat 目录，使用当前路径
    // 否则使用全局路径
    this.effectiveConfigPath = hasHyperChatDir ? workspacePath : CONSTANTS.GLOBAL_PATH;

    const hyperChatPath = path.join(this.effectiveConfigPath, this.HYPERCHAT_DIR);

    this.config = {
      name: path.basename(workspacePath),
      created: Date.now(),
      settings: {},
    };

    this.agentManager = new AgentManager(path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS));

    // 创建MCP管理器
    this.mcpManager = new WorkspaceMCPManager(
      this.effectiveConfigPath,
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
    // 如果是本地工作区，传入本地和全局路径数组，实现配置叠加
    // 如果是全局工作区或没有.hyperchat的目录，只传入全局路径
    const settingsPaths = this.isLocalWorkspace()
      ? [
        path.join(this.workspacePath, this.HYPERCHAT_DIR),
        path.join(CONSTANTS.GLOBAL_PATH, this.HYPERCHAT_DIR)
      ] : [
        path.join(this.workspacePath, this.HYPERCHAT_DIR)
      ];
    this.settingsManager = new WorkspaceSettingsManager(settingsPaths);

    // 初始化任务管理器
    this.taskManager = new TaskManager(hyperChatPath);
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
    return path.join(this.effectiveConfigPath, this.HYPERCHAT_DIR);
  }

  /**
   * 获取有效的配置路径
   */
  getEffectiveConfigPath(): string {
    return this.effectiveConfigPath;
  }

  /**
   * 检查是否是全局工作区
   */
  isGlobal(): boolean {
    return this.workspacePath === CONSTANTS.GLOBAL_PATH;
  }

  /**
   * 检查是否为本地工作区（有 .hyperchat 目录）
   */
  isLocalWorkspace(): boolean {
    return this.isWorkspaceDirectory(this.workspacePath) && this.workspacePath !== CONSTANTS.GLOBAL_PATH;
  }

  /**
   * 🚀 第一阶段：快速初始化配置和基本结构
   * 
   * 这个阶段只做轻量级操作：
   * - 创建目录结构
   * - 加载基本配置  
   * - 初始化管理器（包括 Agent 管理器，扫描文件较快）
   * 
   * @param currentWorkingDirectory 当前工作目录，如果不传则默认为工作区路径
   */
  async initialize(): Promise<void> {
    if (this.state !== WorkspaceState.UNINITIALIZED) {
      Logger.warn(`工作区已初始化，当前状态: ${this.state}`);
      return;
    }

    try {
      Logger.info('🚀 开始工作区快速初始化...');



      // 创建目录结构
      await this.createDirectories();

      // 初始化设置管理器
      await this.settingsManager.init();

      // 初始化任务管理器（仅初始化，不启动调度）
      await this.taskManager.init();

      // 加载工作区基本配置（不启动服务）
      await this.loadMergedConfig();

      // 初始化 Agent 管理器（扫描加载 Agent 配置，速度较快）
      await this.agentManager.init();

      // 保存配置
      await this.saveConfig();

      this.state = WorkspaceState.INITIALIZED;
      Logger.info('✅ 工作区配置初始化完成', {
        workspacePath: this.workspacePath,
        effectiveConfigPath: this.effectiveConfigPath,
        isGlobal: this.isGlobal(),
        isLocal: this.isLocalWorkspace()
      });

    } catch (error) {
      this.state = WorkspaceState.UNINITIALIZED;
      Logger.error('❌ 工作区初始化失败:', error);
      throw error;
    }
  }

  /**
   * 🔥 第二阶段：启动所有服务
   * 
   * 这个阶段做重量级操作：
   * - 启动 MCP 客户端（网络连接，耗时）
   * - 启动任务调度器
   */
  async start(): Promise<void> {
    if (this.state === WorkspaceState.STARTED) {
      Logger.warn('工作区服务已启动');
      return;
    }

    if (this.state !== WorkspaceState.INITIALIZED) {
      throw new Error(`工作区状态错误: ${this.state}，请先调用 initialize()`);
    }

    try {
      Logger.info('🔥 开始启动工作区服务...');

      // 启动 MCP 客户端（网络连接，真正的重量级操作）
      await this.mcpManager.startClients();

      // 启动任务调度器
      await this.startTaskScheduler();

      this.state = WorkspaceState.STARTED;
      Logger.info('✅ 工作区服务启动完成');

    } catch (error) {
      Logger.error('❌ 工作区服务启动失败:', error);
      throw error;
    }
  }

  /**
   * 🔧 完整初始化（向后兼容）
   * 
   * @deprecated 建议使用 initialize() + start() 的两阶段方式
   */
  async init(): Promise<void> {
    await this.initialize();
    await this.start();
  }

  /**
   * 清理工作区，释放资源
   */
  async uninit(): Promise<void> {
    if (this.state === WorkspaceState.UNINITIALIZED || this.state === WorkspaceState.STOPPED) {
      Logger.warn('工作区已停止或未初始化');
      return;
    }

    try {
      this.state = WorkspaceState.STOPPING;
      Logger.info('🛑 开始停止工作区服务...');

      // 停止任务调度器
      await this.stopTaskScheduler();

      // 停止 MCP 客户端
      await this.stopMcpClients();

      // 保存当前状态
      await this.save();

      this.state = WorkspaceState.STOPPED;
      Logger.info('✅ 工作区已安全停止');

    } catch (error) {
      Logger.error('❌ 停止工作区失败:', error);
      this.state = WorkspaceState.STOPPED; // 即使失败也标记为停止
      throw error;
    }
  }

  /**
   * 获取工作区当前状态
   */
  getState(): WorkspaceState {
    return this.state;
  }

  /**
   * 检查工作区是否已初始化（配置已加载）
   */
  isInitialized(): boolean {
    return this.state !== WorkspaceState.UNINITIALIZED;
  }

  /**
   * 检查工作区是否已启动（服务已运行）
   */
  isStarted(): boolean {
    return this.state === WorkspaceState.STARTED;
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

      // 从DefaultAI设置映射到WorkspaceSettings
      const aiSettings = this.settingsManager.getDefaultAI();
      this.config.settings = {
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
      if (this.config.settings?.defaultAgent) {
        const aiUpdates: any = {};
        if (this.config.settings.defaultAgent) {
          aiUpdates.defaultAgent = this.config.settings.defaultAgent;
        }
        await this.settingsManager.updateDefaultAI(aiUpdates);
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
    // 如果是本地工作区，需要合并全局 agents
    if (this.isLocalWorkspace()) {
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
      mergedAgentsMap.set(agent.name, agent);
    });

    // 再添加工作区 agents，会覆盖同名的全局 agents
    workspaceAgents.forEach(agent => {
      mergedAgentsMap.set(agent.name, agent);
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
    if (agent.name) {
      // 更新现有 agent
      const instance = this.agentManager.getAgent(agent.name);
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
  async getAgentChatLogs(agentName: string): Promise<ChatHistoryItem[]> {
    const instance = this.agentManager.getAgent(agentName);
    return instance ? await instance.getChatLogs() : [];
  }

  /**
   * 添加 Agent 聊天记录
   */
  async addAgentChatLog(agentName: string, chatLog: ChatHistoryItem): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentName);
    return instance ? await instance.setChatLog(chatLog) : false;
  }

  /**
   * 删除 Agent 聊天记录
   */
  async deleteAgentChatLog(agentName: string, chatKey: string): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentName);
    return instance ? await instance.deleteChatLog(chatKey) : false;
  }

  /**
   * 清空 Agent 所有聊天记录
   */
  async clearAgentChatLogs(agentName: string): Promise<boolean> {
    const instance = this.agentManager.getAgent(agentName);
    return instance ? await instance.clearChatLogs() : false;
  }

  /**
   * 获取 Agent 聊天记录数量
   */
  async getAgentChatLogsCount(agentName: string): Promise<number> {
    const instance = this.agentManager.getAgent(agentName);
    return instance ? await instance.getChatLogsCount() : 0;
  }

  /**
   * 获取 Agent 摘要信息
   */
  async getAgentSummary(agentName: string): Promise<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  } | null> {
    const instance = this.agentManager.getAgent(agentName);
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
    targetPath?: string;
  } = {}): Promise<boolean> {
    try {
      // 使用提供的目标路径或工作区路径
      const scanPath = options.targetPath || this.workspacePath;
      this.fileTree = await this.scanFiles(scanPath, options);
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
  private async scanFiles(targetPath: string, options: {
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

    return await scanDirectory(targetPath);
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
   * 获取单个任务（直接委托）
   */
  async getTask(taskName: string) {
    return await this.taskManager.getTask(taskName);
  }

  /**
   * 获取所有任务（直接委托）
   */
  async getAllTasks() {
    return await this.taskManager.getAllTasks();
  }

  /**
   * 获取已启用的任务（直接委托）
   */
  async getEnabledTasks() {
    return await this.taskManager.getEnabledTasks();
  }

  /**
   * 获取已禁用的任务（直接委托）
   */
  async getDisabledTasks() {
    return await this.taskManager.getDisabledTasks();
  }

  /**
   * 根据 agent 获取任务（直接委托）
   */
  async getTasksByAgent(agentName: string) {
    return await this.taskManager.getTasksByAgent(agentName);
  }

  /**
   * 复制任务（直接委托）
   */
  async cloneTask(taskName: string, newTaskName: string) {
    return await this.taskManager.cloneTask(taskName, newTaskName);
  }

  /**
   * 获取任务统计信息（直接委托）
   */
  async getTaskStats() {
    return await this.taskManager.getTaskStats();
  }

  // ========== 任务调度管理 ==========

  /**
   * 启动任务调度器
   */
  async startTaskScheduler(): Promise<void> {
    if (this.isTaskSchedulerRunning) {
      Logger.info('任务调度器已在运行中');
      return;
    }

    try {
      Logger.info('启动任务调度器...');

      // 获取所有已启用的任务
      const enabledTasks = await this.taskManager.getEnabledTasks();

      // 为每个任务创建 cron 作业
      for (const task of enabledTasks) {
        await this.scheduleTask(task.name, task.cron);
      }

      this.isTaskSchedulerRunning = true;
      Logger.info(`任务调度器已启动，共加载 ${enabledTasks.length} 个任务`);

    } catch (error) {
      Logger.error('启动任务调度器失败:', error);
      throw error;
    }
  }

  /**
   * 停止任务调度器
   */
  async stopTaskScheduler(): Promise<void> {
    if (!this.isTaskSchedulerRunning) {
      return;
    }

    try {
      Logger.info('停止任务调度器...');

      // 停止所有 cron 作业
      for (const [taskName, job] of this.taskJobs) {
        job.stop();
        Logger.debug(`停止任务调度: ${taskName}`);
      }

      this.taskJobs.clear();
      this.isTaskSchedulerRunning = false;

      Logger.info('任务调度器已停止');

    } catch (error) {
      Logger.error('停止任务调度器失败:', error);
      throw error;
    }
  }

  /**
   * 重新启动任务调度器
   */
  async restartTaskScheduler(): Promise<void> {
    await this.stopTaskScheduler();
    await this.startTaskScheduler();
  }

  /**
   * 调度单个任务
   */
  async scheduleTask(taskName: string, cronExpression: string): Promise<void> {
    try {
      // 如果任务已经被调度，先停止它
      if (this.taskJobs.has(taskName)) {
        const existingJob = this.taskJobs.get(taskName)!;
        existingJob.stop();
        this.taskJobs.delete(taskName);
      }

      // 验证 cron 表达式
      if (!cron.validate(cronExpression)) {
        throw new Error(`无效的 cron 表达式: ${cronExpression}`);
      }

      // 创建新的 cron 作业
      const job = cron.schedule(cronExpression, async () => {
        await this.executeTask(taskName);
      }, {
        scheduled: false, // 先不启动，等设置完成后再启动
        timezone: 'Asia/Shanghai' // 使用中国时区，可以根据需要调整
      });

      // 启动作业
      job.start();
      this.taskJobs.set(taskName, job);

      Logger.info(`任务 '${taskName}' 已调度，执行时间: ${cronExpression}`);

    } catch (error) {
      Logger.error(`调度任务 '${taskName}' 失败:`, error);
      throw error;
    }
  }

  /**
   * 取消调度单个任务
   */
  async unscheduleTask(taskName: string): Promise<void> {
    const job = this.taskJobs.get(taskName);
    if (job) {
      job.stop();
      this.taskJobs.delete(taskName);
      Logger.info(`取消调度任务: ${taskName}`);
    }
  }

  /**
   * 执行单个任务
   */
  async executeTask(taskName: string): Promise<void> {
    try {
      Logger.info(`开始执行任务: ${taskName}`);

      // 获取任务配置
      const task = await this.taskManager.getTask(taskName);
      if (!task) {
        throw new Error(`任务 '${taskName}' 不存在`);
      }

      if (task.disabled) {
        Logger.warn(`任务 '${taskName}' 已被禁用，跳过执行`);
        return;
      }

      // 获取对应的 Agent
      const agentInstance = this.agentManager.getAgent(task.agentName);
      if (!agentInstance) {
        throw new Error(`Agent '${task.agentName}' 不存在`);
      }

      // 构造任务执行的消息
      const taskMessage = `${task.description}`;

      // 执行任务 - 通过 Agent 处理
      Logger.info(`使用 Agent '${task.agentName}' 执行任务 '${taskName}'`);

      // 创建任务执行的聊天记录
      const chatLog: ChatHistoryItem = {
        key: v4(),
        agentName: task.agentName,
        label: `定时任务: ${task.name}`,
        dateTime: Date.now(),
        chatType: 'task',
        configOverrides: {
          modelKey: agentInstance.getConfig().modelKey || 'default',
          allowMCPs: agentInstance.getConfig().allowMCPs,
          isConfirmCallTool: agentInstance.getConfig().isConfirmCallTool,
          temperature: agentInstance.getConfig().temperature,
          maxAttachedDialogs: agentInstance.getConfig().maxAttachedDialogs,
          prompt: agentInstance.getConfig().prompt
        },
        messages: [
          {
            role: 'user',
            content: taskMessage
          }
        ]
      };

      // 执行 AI 对话
      try {
        // 使用共享的 AI 环境初始化工具
        const env = await initializeAIEnvironment({
          agentName: task.agentName,
          workspacePath: this.workspacePath,
          needMCP: true
        });

        // 创建 AI 通道
        const aiChannel = createAIChannel(env);

        // 复制已有的消息到 AI 通道
        for (const msg of chatLog.messages) {
          aiChannel.addMessage({
            ...msg,
            content_date: msg.content_date || Date.now()
          } as any);
        }

        // 执行 AI 对话
        Logger.info(`正在生成 AI 响应...`);
        const assistantMessage = await executeAICompletion(aiChannel, env.effectiveConfig, {
          onUpdate: () => {
            // 可以在这里添加进度日志
          }
        });

        // 更新聊天记录
        chatLog.messages.push({
          role: 'assistant',
          content: assistantMessage.content as string,
          content_date: Date.now()
        } as any);

        // 保存更新后的聊天记录
        await agentInstance.setChatLog(chatLog);

        Logger.info(`任务 '${taskName}' 执行完成，AI 响应: ${(assistantMessage.content as string).substring(0, 100)}...`);

      } catch (aiError) {
        Logger.error(`执行任务 AI 对话失败:`, aiError);
        // 即使 AI 执行失败，也保存聊天记录
        await agentInstance.setChatLog(chatLog);
        throw aiError;
      }

    } catch (error) {
      Logger.error(`执行任务 '${taskName}' 失败:`, error);
      // 不抛出错误，避免影响其他任务的调度
    }
  }

  /**
   * 手动触发任务执行
   */
  async triggerTask(taskName: string): Promise<void> {
    Logger.info(`手动触发任务: ${taskName}`);
    await this.executeTask(taskName);
  }

  /**
   * 获取当前调度的任务列表
   */
  getScheduledTasks(): string[] {
    return Array.from(this.taskJobs.keys());
  }

  /**
   * 检查任务是否正在调度中
   */
  isTaskScheduled(taskName: string): boolean {
    return this.taskJobs.has(taskName);
  }

  /**
   * 重写任务相关方法，添加调度器同步
   */

  /**
   * 创建任务（重写以添加调度）
   */
  async createTask(taskData: Parameters<TaskManager['createTask']>[0]) {
    const task = await this.taskManager.createTask(taskData);

    // 如果任务已启用且调度器正在运行，立即调度这个任务
    if (!task.disabled && this.isTaskSchedulerRunning) {
      await this.scheduleTask(task.name, task.cron);
    }

    return task;
  }

  /**
   * 更新任务（重写以更新调度）
   */
  async updateTask(taskName: string, updates: Parameters<TaskManager['updateTask']>[1]) {
    const oldTask = await this.taskManager.getTask(taskName);
    const updatedTask = await this.taskManager.updateTask(taskName, updates);

    if (updatedTask && this.isTaskSchedulerRunning) {
      // 如果任务名称改变了，需要处理调度
      if (oldTask && oldTask.name !== updatedTask.name) {
        await this.unscheduleTask(oldTask.name);
      }

      // 重新调度任务
      if (!updatedTask.disabled) {
        await this.scheduleTask(updatedTask.name, updatedTask.cron);
      } else {
        await this.unscheduleTask(updatedTask.name);
      }
    }

    return updatedTask;
  }

  /**
   * 删除任务（重写以取消调度）
   */
  async deleteTask(taskName: string) {
    const success = await this.taskManager.deleteTask(taskName);

    if (success && this.isTaskSchedulerRunning) {
      await this.unscheduleTask(taskName);
    }

    return success;
  }

  /**
   * 启用任务（重写以添加调度）
   */
  async enableTask(taskName: string) {
    const task = await this.taskManager.enableTask(taskName);

    if (task && this.isTaskSchedulerRunning) {
      await this.scheduleTask(task.name, task.cron);
    }

    return task;
  }

  /**
   * 禁用任务（重写以取消调度）
   */
  async disableTask(taskName: string) {
    const task = await this.taskManager.disableTask(taskName);

    if (task && this.isTaskSchedulerRunning) {
      await this.unscheduleTask(task.name);
    }

    return task;
  }

}