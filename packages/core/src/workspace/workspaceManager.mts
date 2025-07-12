import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import { CONSTANTS } from "./constants.mjs";
import type {
  WorkspaceConfig,
  AgentConfig
} from "./types.mjs";
import { Workspace } from "./workspace.mjs";

/**
 * 工作区管理器类 - 新架构：单个当前工作区 + 兼容老API
 * 核心理念：进程/会话 = 当前工作区（内部自动处理全局配置合并）
 */
export class WorkspaceManager {
  private readonly GLOBAL_HYPERCHAT_DIR = path.join(CONSTANTS.GLOBAL_PATH, CONSTANTS.HYPERCHAT_DIR);
  private currentWorkspace!: Workspace;
  private isInitialized = false;

  constructor() {
  }

  /**
   * 初始化工作区管理器
   * @param workingDirectory 当前工作目录
   */
  async initialize(workingDirectory?: string): Promise<void> {

    if (this.isInitialized) {
      return;
    }

    try {
      if (workingDirectory == CONSTANTS.GLOBAL_PATH || workingDirectory == null) {
        this.currentWorkspace = new Workspace(CONSTANTS.GLOBAL_PATH);
      } else {
        // 默认工作区是当前目录或全局工作区
        const initialPath = workingDirectory || process.cwd();
        const workspacePath = this.findWorkspaceInPath(initialPath) || CONSTANTS.GLOBAL_PATH;
        this.currentWorkspace = new Workspace(workspacePath);
      }
      // 初始化当前工作区
      await this.currentWorkspace.init();

      this.isInitialized = true;
    } catch (error) {
      console.warn('初始化工作区管理器失败:', error);
      throw error;
    }
  }

  /**
   * 清理工作区管理器，释放资源
   */
  async uninitialize(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // 清理当前工作区
      if (this.currentWorkspace) {
        await this.currentWorkspace.uninit();
      }

      this.isInitialized = false;
    } catch (error) {
      console.warn('清理工作区管理器失败:', error);
      throw error;
    }
  }

  /**
   * 切换工作区
   * @param workspacePath 工作区路径
   */
  async switchWorkspace(workspacePath: string): Promise<void> {
    // 查找工作区或使用全局工作区
    const targetPath = this.findWorkspaceInPath(workspacePath) || CONSTANTS.GLOBAL_PATH;

    // 如果目标路径与当前工作区相同，无需切换
    if (this.currentWorkspace && this.currentWorkspace.workspacePath === targetPath) {
      return;
    }

    // 先清理当前工作区的资源
    if (this.currentWorkspace) {
      try {
        await this.currentWorkspace.uninit();
      } catch (error) {
        console.warn('清理当前工作区失败:', error);
      }
    }

    this.initialize(targetPath);
  }

  /**
   * 从指定路径向上查找工作区
   */
  private findWorkspaceInPath(startPath: string): string | null {
    let currentPath = path.resolve(startPath);
    const rootPath = path.parse(currentPath).root;

    while (currentPath !== rootPath) {
      if (this.isWorkspaceDirectory(currentPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }

    return null;
  }

  /**
   * 获取当前工作区
   */
  getCurrentWorkspace(): Workspace {
    if(!this.isInitialized) {
      throw new Error("工作区管理器尚未初始化，请先调用 initialize() 方法。");
    }
    // 始终返回当前工作区（默认是全局工作区，workspace.mts中自动处理配置合并）
    return this.currentWorkspace;
  }



  /**
   * 创建新工作区
   */
  async createWorkspace(workspacePath: string, name: string, description?: string): Promise<Workspace> {
    // 检查目录是否存在
    if (!fs.existsSync(workspacePath)) {
      throw new Error(`工作区路径不存在: ${workspacePath}`);
    }

    // 检查工作区是否已存在
    if (this.isWorkspaceDirectory(workspacePath)) {
      throw new Error(`工作区已存在: ${workspacePath}`);
    }

    // 创建工作区配置
    const config: WorkspaceConfig = {
      name,
      description,
      created: Date.now(),
      lastAccessed: Date.now(),
      settings: {
        enableKnowledgeBase: true,
      },
    };

    // 创建工作区实例
    const workspace = new Workspace(workspacePath, config);
    await workspace.init();

    return workspace;
  }

  /**
   * 获取全局工作区（兼容老API）
   */
  getGlobalWorkspace(): Workspace {
    return this.currentWorkspace;
  }

  /**
   * 获取所有工作区列表（兼容老API）
   */
  getWorkspaceList(): (WorkspaceConfig & { path: string })[] {
    const list: (WorkspaceConfig & { path: string })[] = [];

    // 添加当前工作区
    list.push({
      ...this.currentWorkspace.getConfig(),
      path: this.currentWorkspace.workspacePath
    });


    return list;
  }

  /**
   * 删除工作区（兼容老API）
   */
  async deleteWorkspace(workspacePath: string): Promise<boolean> {
    // 不能删除全局工作区
    if (this.isGlobalWorkspace(workspacePath)) {
      return false;
    }

    // 如果是当前工作区，先切换到全局工作区
    if (this.currentWorkspace.workspacePath === workspacePath) {
      await this.switchWorkspace(CONSTANTS.GLOBAL_PATH);
    }

    // 删除工作区文件
    try {
      const workspace = new Workspace(workspacePath);
      return await workspace.delete();
    } catch (error) {
      console.warn(`删除工作区失败 ${workspacePath}:`, error);
      return false;
    }
  }

  /**
   * 更新工作区文件树（兼容老API）
   */
  async updateWorkspaceFileTree(workspacePath?: string): Promise<boolean> {
    const workspace = this.getCurrentWorkspace();
    if (!workspace) {
      return false;
    }

    return await workspace.updateFileTree({
      includeHidden: false,
      maxDepth: 5,
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '.hyperchat'],
    });
  }

  /**
   * 生成新的 agent key
   */
  generateAgentKey(): string {
    return `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;
  }

  /**
   * 生成新的工作区 key
   */
  generateWorkspaceKey(): string {
    return `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`;
  }

  /**
   * 获取指定工作区或当前工作区
   */
  private getWorkspaceInstance(workspacePath?: string): Workspace | null {
    if (!workspacePath) {
      return this.getCurrentWorkspace();
    }

    if (this.currentWorkspace.workspacePath === workspacePath) {
      return this.currentWorkspace;
    }

    return null;
  }

  /**
   * 添加或更新单个 agent（兼容老API）
   */
  async addOrUpdateAgent(workspacePath: string | Partial<AgentConfig>, agent?: Partial<AgentConfig>): Promise<boolean> {
    // 兼容两种调用方式：
    // 1. addOrUpdateAgent(workspacePath, agent) - 老API
    // 2. addOrUpdateAgent(agent) - 新API，直接操作当前工作区
    let targetAgent: Partial<AgentConfig>;
    let workspace: Workspace | null;

    if (typeof workspacePath === 'string' && agent) {
      // 老API调用方式
      workspace = this.getWorkspaceInstance(workspacePath);
      targetAgent = agent;
    } else {
      // 新API调用方式
      workspace = this.getCurrentWorkspace();
      targetAgent = workspacePath as Partial<AgentConfig>;
    }

    if (!workspace) {
      return false;
    }
    return await workspace.setAgent(targetAgent);
  }

  /**
   * 删除单个 agent（兼容老API）
   */
  async deleteAgent(workspacePath: string | string, agentKey?: string): Promise<boolean> {
    // 兼容两种调用方式：
    // 1. deleteAgent(workspacePath, agentKey) - 老API
    // 2. deleteAgent(agentKey) - 新API，直接操作当前工作区
    let targetAgentKey: string;
    let workspace: Workspace | null;

    if (typeof workspacePath === 'string' && agentKey) {
      // 老API调用方式
      workspace = this.getWorkspaceInstance(workspacePath);
      targetAgentKey = agentKey;
    } else {
      // 新API调用方式
      workspace = this.getCurrentWorkspace();
      targetAgentKey = workspacePath;
    }

    if (!workspace) {
      return false;
    }
    return await workspace.deleteAgent(targetAgentKey);
  }

  /**
   * 获取指定工作区的所有 agents（兼容老API）
   */
  async getWorkspaceAgents(workspacePath?: string): Promise<AgentConfig[]> {
    const workspace = this.getWorkspaceInstance(workspacePath);
    if (!workspace) {
      return [];
    }
    return await workspace.getAgents();
  }

  /**
   * 获取指定工作区的单个 agent（兼容老API）
   */
  async getWorkspaceAgent(workspacePath: string | string, agentKey?: string): Promise<AgentConfig | null> {
    // 兼容两种调用方式：
    // 1. getWorkspaceAgent(workspacePath, agentKey) - 老API
    // 2. getWorkspaceAgent(agentKey) - 新API，直接操作当前工作区
    let targetAgentKey: string;
    let workspace: Workspace | null;

    if (typeof workspacePath === 'string' && agentKey) {
      // 老API调用方式
      workspace = this.getWorkspaceInstance(workspacePath);
      targetAgentKey = agentKey;
    } else {
      // 新API调用方式
      workspace = this.getCurrentWorkspace();
      targetAgentKey = workspacePath;
    }

    if (!workspace) {
      return null;
    }
    return await workspace.getAgent(targetAgentKey);
  }

  /**
   * 加载现有工作区（兼容老API）
   */
  async loadExistingWorkspace(workspacePath: string): Promise<Workspace | null> {
    const workspace = new Workspace(workspacePath);

    // 检查工作区是否存在
    if (!workspace.exists()) {
      return null;
    }

    try {
      // 加载工作区数据
      await workspace.load();
      return workspace;
    } catch (error) {
      console.warn(`加载工作区失败 ${workspacePath}:`, error);
      return null;
    }
  }

  /**
   * 检查指定路径是否为工作区（是否包含 .hyperchat 文件夹）
   */
  isWorkspaceDirectory(directoryPath: string): boolean {
    const hyperChatPath = path.join(directoryPath, CONSTANTS.HYPERCHAT_DIR);
    return fs.existsSync(hyperChatPath) && fs.statSync(hyperChatPath).isDirectory();
  }

  /**
   * 从当前目录获取工作区（兼容老API）
   */
  async getWorkspaceFromDirectory(directoryPath: string): Promise<Workspace | null> {
    if (!this.isWorkspaceDirectory(directoryPath)) {
      return null;
    }

    return await this.loadExistingWorkspace(directoryPath);
  }


  /**
   * 获取全局配置目录路径
   */
  getGlobalConfigPath(): string {
    return this.GLOBAL_HYPERCHAT_DIR;
  }

  /**
   * 从全局配置加载 agents（兼容老API）
   */
  async loadGlobalAgents(): Promise<AgentConfig[]> {
    const globalWorkspace = new Workspace(CONSTANTS.GLOBAL_PATH);
    await globalWorkspace.init();
    return await globalWorkspace.getAgents();
  }

  /**
   * 保存 agent 到全局配置（兼容老API）
   */
  async saveGlobalAgent(agent: Partial<AgentConfig>): Promise<boolean> {
    const globalWorkspace = new Workspace(CONSTANTS.GLOBAL_PATH);
    await globalWorkspace.init();
    return await globalWorkspace.setAgent(agent);
  }

  /**
   * 删除全局 agent（兼容老API）
   */
  async deleteGlobalAgent(agentKey: string): Promise<boolean> {
    const globalWorkspace = new Workspace(CONSTANTS.GLOBAL_PATH);
    await globalWorkspace.init();
    return await globalWorkspace.deleteAgent(agentKey);
  }

  /**
   * 获取合并的 agents（全局 + 当前工作区）
   */
  async getMergedAgents(_workspacePath?: string): Promise<AgentConfig[]> {
    // 直接返回当前工作区的agents（在workspace.mts中已实现配置合并逻辑）
    return await this.getCurrentWorkspace().getAgents();
  }

  /**
   * 检查是否为全局工作区
   */
  isGlobalWorkspace(workspacePath: string): boolean {
    // 规范化路径以防止路径分隔符问题
    const normalizedWorkspacePath = path.resolve(workspacePath);
    const normalizedGlobalPath = path.resolve(CONSTANTS.GLOBAL_PATH);
    return normalizedWorkspacePath === normalizedGlobalPath;
  }

  /**
   * 获取全局工作区路径
   */
  getGlobalWorkspacePath(): string {
    return CONSTANTS.GLOBAL_PATH;
  }

  // ========== 兼容老API的运行时工作区管理 ==========

  /**
   * 检查工作区是否在运行（兼容老API）
   */
  isWorkspaceRunning(workspacePath: string): boolean {
    // 全局工作区总是运行的
    if (this.isGlobalWorkspace(workspacePath)) {
      return true;
    }
    // 当前工作区如果是指定路径，则认为是运行的
    return this.currentWorkspace.workspacePath === workspacePath;
  }

  /**
   * 获取所有运行中的工作区路径（兼容老API）
   */
  getRunningWorkspaces(): string[] {
    const runningPaths: string[] = [];

    // 添加全局工作区
    runningPaths.push(this.getGlobalWorkspacePath());

    // 添加当前工作区（如果不是全局工作区）
    if (!this.isGlobalWorkspace(this.currentWorkspace.workspacePath)) {
      runningPaths.push(this.currentWorkspace.workspacePath);
    }

    return runningPaths;
  }

  /**
   * 获取运行中工作区的详细信息（兼容老API）
   */
  async getRunningWorkspacesDetails(): Promise<Array<{ path: string, name: string, isGlobal: boolean }>> {
    const details: Array<{ path: string, name: string, isGlobal: boolean }> = [];

    // 添加全局工作区
    details.push({
      path: this.getGlobalWorkspacePath(),
      name: 'Global Workspace',
      isGlobal: true
    });

    // 添加当前工作区（如果不是全局工作区）
    if (!this.isGlobalWorkspace(this.currentWorkspace.workspacePath)) {
      const config = this.currentWorkspace.getConfig();
      details.push({
        path: this.currentWorkspace.workspacePath,
        name: config.name || path.basename(this.currentWorkspace.workspacePath),
        isGlobal: false
      });
    }

    return details;
  }

  /**
   * 从内存中移除工作区（兼容老API）
   */
  removeWorkspaceFromMemory(workspacePath: string): boolean {
    if (this.isGlobalWorkspace(workspacePath)) {
      return false; // 不能移除全局工作区
    }

    // 如果是当前工作区，切换到全局工作区
    if (this.currentWorkspace.workspacePath === workspacePath) {
      this.currentWorkspace = new Workspace(CONSTANTS.GLOBAL_PATH);
      return true;
    }

    return false;
  }

  /**
   * 获取当前工作区路径
   */
  getCurrentWorkspacePath(): string {
    return this.currentWorkspace.workspacePath;
  }

  /**
   * 检查是否有当前工作区（非全局工作区）
   */
  hasCurrentWorkspace(): boolean {
    return !this.isGlobalWorkspace(this.currentWorkspace.workspacePath);
  }

}