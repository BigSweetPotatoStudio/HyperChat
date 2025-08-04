import * as path from "path";
import * as fs from "fs";
import { CONSTANTS } from "../agent/constants.mjs";
import {
  WorkspaceConfig,
  WorkspaceFileNode,
  AgentConfig
} from "./types.mjs";
import type { ChatHistoryItem, IMCPClient } from "@dadigua/hyperchat-shared/types";
import { AgentManager } from "./agentManager.mjs";
import { AgentInstance } from "../agent/agentInstance.mjs";
import { Logger } from "../log.mjs";
import { MCPManager } from "../agent/mcp/manager.mjs";

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
  private mcpManager?: MCPManager;
  private fileTree?: WorkspaceFileNode;
  private lastSync?: number;
  private readonly HYPERCHAT_DIR = CONSTANTS.HYPERCHAT_DIR;
  private name = "";
  // 工作区状态管理
  private state: WorkspaceState = WorkspaceState.UNINITIALIZED;

  constructor(public workspacePath: string) {
    const hyperChatPath = path.join(this.workspacePath, this.HYPERCHAT_DIR);
    this.name = path.basename(this.workspacePath);
    this.config = {
      name: path.basename(workspacePath),
      created: Date.now(),
      settings: {},
    };

    // 简化：每个工作区只管理自己的Agent目录
    const agentPath = path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS);
    this.agentManager = new AgentManager([agentPath]);
  }

  // ========== 基础属性和状态管理 ==========

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
   * 检查是否是全局工作区
   */
  isGlobal(): boolean {
    return this.workspacePath === CONSTANTS.GLOBAL_PATH;
  }

  /**
   * 检查工作区是否存在（有 .hyperchat 目录）
   */
  exists(): boolean {
    const hyperChatPath = path.join(this.workspacePath, this.HYPERCHAT_DIR);
    return fs.existsSync(hyperChatPath) && fs.statSync(hyperChatPath).isDirectory();
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

  // ========== 生命周期管理 ==========

  /**
   * 🚀 第一阶段：快速初始化（仅加载配置和基础组件）
   */
  async initialize(): Promise<void> {
    if (this.state !== WorkspaceState.UNINITIALIZED) {
      Logger.warn(`工作区已初始化，当前状态: ${this.state}`);
      return;
    }

    try {
      Logger.info('🚀 开始工作区初始化（第一阶段）...', { workspacePath: this.workspacePath });

      // 确保工作区目录结构存在
      await this.ensureDirectories();

      // 加载工作区配置
      await this.loadConfig();

      // 初始化 Agent 管理器（不启动MCP）
      await this.agentManager.init();

      this.state = WorkspaceState.INITIALIZED;
      Logger.info('✅ 工作区初始化完成（第一阶段）', {
        workspacePath: this.workspacePath,
        isGlobal: this.isGlobal()
      });

    } catch (error) {
      this.state = WorkspaceState.UNINITIALIZED;
      Logger.error('❌ 工作区初始化失败:', error);
      throw error;
    }
  }

  /**
   * 🔥 第二阶段：启动重量级服务（MCP、任务调度等）
   */
  async start(): Promise<void> {
    if (this.state === WorkspaceState.STARTED) {
      Logger.warn('工作区服务已启动');
      return;
    }

    if (this.state !== WorkspaceState.INITIALIZED) {
      throw new Error('工作区必须先初始化后才能启动服务');
    }

    try {
      Logger.info('🔥 开始启动工作区服务（第二阶段）...');

      // 只启动工作区级别的MCP，忽略Agent内部的MCP
      await this.initializeMcpManager();

      this.state = WorkspaceState.STARTED;
      Logger.info('✅ 工作区服务启动完成', {
        workspacePath: this.workspacePath
      });

    } catch (error) {
      Logger.error('❌ 工作区服务启动失败:', error);
      throw error;
    }
  }

  /**
   * 完整初始化（向后兼容）
   * @deprecated 建议使用 initialize() + start() 两阶段方式
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

      // 停止工作区级别的MCP客户端
      if (this.mcpManager) {
        await this.mcpManager.stopClients();
      }

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

  // ========== 配置管理 ==========

  /**
   * 加载工作区配置（简化版）
   */
  private async loadConfig(): Promise<void> {
    // 简化配置加载，使用默认配置
    this.config.settings = {
      defaultAgent: undefined,
    };
  }

  /**
   * 确保工作区目录结构存在
   */
  private async ensureDirectories(): Promise<void> {
    const hyperChatPath = this.getHyperChatPath();
    
    // 确保 .hyperchat 目录存在
    if (!fs.existsSync(hyperChatPath)) {
      fs.mkdirSync(hyperChatPath, { recursive: true });
    }

    // 确保 agents 目录存在
    const agentsPath = path.join(hyperChatPath, CONSTANTS.DIRECTORIES.AGENTS);
    if (!fs.existsSync(agentsPath)) {
      fs.mkdirSync(agentsPath, { recursive: true });
    }

    // 确保其他必要目录存在
    const tasksPath = path.join(hyperChatPath, 'tasks');
    if (!fs.existsSync(tasksPath)) {
      fs.mkdirSync(tasksPath, { recursive: true });
    }
  }

  /**
   * 保存工作区配置（简化版，不再使用settings.jsonc）
   */
  async saveConfig(): Promise<void> {
    // 由于移除了工作区设置系统，这里保持空实现
    // 工作区配置现在主要通过envManage来管理
    Logger.info("工作区配置保存已简化，使用envManage进行环境变量管理");
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
   * 获取所有 agents
   */
  async getAllAgents(): Promise<(AgentConfig & { scope?: "global" | "workspace" })[]> {
    return await this.agentManager.getAllAgents();
  }

  /**
   * 获取所有 agents 摘要信息
   */
  async getAllAgentsSummary(): Promise<Array<{
    config: AgentConfig & { scope?: "global" | "workspace" };
    chatLogsCount: number;
    lastChatTime?: number;
  }>> {
    return await this.agentManager.getAllAgentsSummary();
  }

  /**
   * 创建新的 agent（在指定的基础路径下创建，默认使用第一个路径）
   */
  async createAgent(config: Partial<AgentConfig>, targetBasePath?: string): Promise<AgentInstance | null> {
    return await this.agentManager.createAgent(config, targetBasePath);
  }

  /**
   * 获取单个 agent 实例（通过名称或路径）
   */
  getAgentInstance(nameOrPath: string): AgentInstance | null {
    return this.agentManager.getAgent(nameOrPath);
  }

  /**
   * 获取单个 agent 配置（通过名称或路径）
   */
  async getAgent(nameOrPath: string): Promise<AgentConfig | null> {
    const instance = this.agentManager.getAgent(nameOrPath);
    return instance ? instance.getConfig() : null;
  }

  /**
   * 更新 agent 配置（支持名称变更）
   */
  async updateAgent(agentName: string, updates: Partial<AgentConfig>): Promise<boolean> {
    const agentInstance = this.agentManager.getAgent(agentName);
    if (!agentInstance) {
      throw new Error(`Agent 不存在: ${agentName}`);
    }

    // 获取当前名称用于映射更新
    const oldName = agentInstance.getConfig().name;
    const newName = updates.name;

    // 更新 agent 实例配置
    const result = await agentInstance.updateConfig(updates);

    // 如果名称发生变更且更新成功，更新 AgentManager 映射
    if (result && newName && newName !== oldName) {
      await this.agentManager.updateAgentMapping(oldName, newName);
    }

    return result;
  }

  /**
   * 创建或更新 agent
   */
  async setAgent(agent: Partial<AgentConfig>): Promise<boolean> {
    if (agent.name && this.agentManager.getAgent(agent.name)) {
      // 更新现有 agent
      return await this.updateAgent(agent.name, agent);
    }
    
    // 创建新 agent
    const newAgent = await this.agentManager.createAgent(agent);
    return newAgent !== null;
  }

  /**
   * 删除 agent（通过名称或路径）
   */
  async deleteAgent(nameOrPath: string): Promise<boolean> {
    return await this.agentManager.deleteAgent(nameOrPath);
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
  async getAgentChatLogs(nameOrPath: string): Promise<ChatHistoryItem[]> {
    const instance = this.agentManager.getAgent(nameOrPath);
    return instance ? await instance.getChatLogs() : [];
  }

  /**
   * 分页获取 Agent 的聊天记录
   */
  async getAgentChatLogsPage(nameOrPath: string, page: number = 0, pageSize: number = 10): Promise<{ chatLogs: ChatHistoryItem[]; total: number; hasMore: boolean }> {
    const instance = this.agentManager.getAgent(nameOrPath);
    if (!instance) {
      return { chatLogs: [], total: 0, hasMore: false };
    }
    return await instance.getChatLogsPage(page * pageSize, pageSize);
  }

  /**
   * 添加 Agent 聊天记录
   */
  async addAgentChatLog(nameOrPath: string, chatLog: ChatHistoryItem): Promise<boolean> {
    const instance = this.agentManager.getAgent(nameOrPath);
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

  /**
   * 获取 Agent 记忆文件内容和路径
   */
  async getAgentMemory(agentName: string): Promise<{ content: string; filePath: string }> {
    const agentPath = this.agentManager.getAgentPath(agentName);
    if (!agentPath) {
      return { content: '', filePath: '' }; // Agent不存在
    }

    const memoryFilePath = path.join(agentPath, 'memory.md');

    // 检查文件是否存在
    if (!fs.existsSync(memoryFilePath)) {
      return { content: '', filePath: memoryFilePath };
    }

    // 读取文件内容
    const content = fs.readFileSync(memoryFilePath, 'utf8');
    return { content, filePath: memoryFilePath };
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

  // ========== MCP 管理 ==========

  /**
   * 初始化工作区级别的MCP管理器
   */
  private async initializeMcpManager(): Promise<void> {
    try {
      const hyperChatPath = this.getHyperChatPath();
      
      // 创建MCP管理器
      this.mcpManager = new MCPManager(hyperChatPath);
      
      // 启动工作区级别的MCP客户端
      await this.mcpManager.startClients();
      
      Logger.info(`✅ 工作区MCP管理器初始化完成`);
    } catch (error) {
      Logger.error("❌ 初始化工作区MCP管理器失败:", error);
      // 不抛出错误，让工作区初始化继续
    }
  }

  /**
   * 获取工作区级别的MCP客户端
   */
  getMcpClients(): IMCPClient[] {
    if (!this.mcpManager) {
      return [];
    }
    return this.mcpManager.getAllClients().map(client => client.toJSON());
  }

  /**
   * 获取工作区的MCP管理器
   */
  getMcpManager(): MCPManager {
    if (!this.mcpManager) {
      throw new Error("MCP管理器尚未初始化");
    }
    return this.mcpManager;
  }


  // ========== 工具方法 ==========

  /**
   * 删除整个工作区
   */
  async delete(): Promise<boolean> {
    try {
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
   * 获取工作区信息摘要
   */
  async getSummary(): Promise<{
    agentsCount: number;
    lastSync?: number;
  }> {
    return {
      agentsCount: await this.getAgentsCount(),
      lastSync: this.lastSync,
    };
  }
}