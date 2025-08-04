import * as path from "path";
import * as fs from "fs";
import { CONSTANTS } from "../agent/constants.mjs";
import { Workspace } from "./workspace.mjs";

interface WorkspaceManagerOptions {
  maxWorkspaces?: number;  // 最大缓存工作区数量，默认 10
}

/**
 * 工作区管理器 - 多工作区管理 + 单工作区模式兼容
 * 
 * 职责：
 * - 创建和缓存 Workspace 实例
 * - 管理工作区生命周期
 * - 提供工作区查找和统计
 * - 支持单工作区模式的兼容API（initialize、getCurrentWorkspace等）
 * 
 * 不负责：
 * - 工作区内部状态管理（由 Workspace 自己负责）
 * - 工作区初始化和启动（调用方自行控制）
 */
export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map();
  private primaryWorkspacePath: string | null = null; // 当前活跃的工作区路径
  private options: Required<WorkspaceManagerOptions>;

  constructor(options: WorkspaceManagerOptions = {}) {
    this.options = {
      maxWorkspaces: options.maxWorkspaces ?? 3,
    };
  }

  /**
   * 创建新工作区
   * @param workspacePath 工作区路径
   * @param forceCreate 如果不是工作区目录，是否强制创建 .hyperchat 文件夹
   */
  async create(workspacePath: string, forceCreate = false): Promise<Workspace> {
    const normalizedPath = path.resolve(workspacePath);

    // 检查路径是否存在
    if (!fs.existsSync(normalizedPath)) {
      throw new Error(`路径不存在: ${workspacePath}`);
    }

    // 如果已存在，直接返回
    if (this.workspaces.has(normalizedPath)) {
      return this.workspaces.get(normalizedPath)!;
    }

    // 检查是否需要创建工作区目录
    if (!this.isWorkspaceDirectory(normalizedPath)) {
      if (!forceCreate) {
        throw new Error(`不是有效的工作区目录: ${workspacePath}，缺少 .hyperchat 文件夹`);
      }
      // 创建 .hyperchat 目录
      const hyperChatPath = path.join(normalizedPath, CONSTANTS.HYPERCHAT_DIR);
      fs.mkdirSync(hyperChatPath, { recursive: true });
    }

    // 创建工作区实例
    const workspace = new Workspace(normalizedPath);

    // 添加到缓存
    return this.add(workspace);
  }

  /**
   * 获取工作区实例
   * @param workspacePath 工作区路径
   * @param autoCreate 如果不存在是否自动创建
   */
  async get(workspacePath: string, autoCreate = false): Promise<Workspace | null> {
    const normalizedPath = path.resolve(workspacePath);

    // 从缓存获取
    if (this.workspaces.has(normalizedPath)) {
      return this.workspaces.get(normalizedPath)!;
    }

    // 自动创建
    if (autoCreate && this.isWorkspaceDirectory(normalizedPath)) {
      return await this.create(normalizedPath);
    }

    return null;
  }

  /**
   * 添加工作区实例到管理器
   * @param workspace 工作区实例
   */
  add(workspace: Workspace): Workspace {
    const normalizedPath = path.resolve(workspace.workspacePath);

    // 检查是否需要清理最旧的工作区
    if (this.workspaces.size >= this.options.maxWorkspaces) {
      throw new Error(`工作区数量已达上限: ${this.options.maxWorkspaces}`);
    }

    // 添加到缓存
    this.workspaces.set(normalizedPath, workspace);

    return workspace;
  }

  /**
   * 移除工作区（释放资源）
   * @param workspacePath 工作区路径
   */
  async remove(workspacePath: string): Promise<boolean> {
    const normalizedPath = path.resolve(workspacePath);

    const workspace = this.workspaces.get(normalizedPath);
    if (!workspace) {
      return false;
    }

    // 清理工作区资源
    try {
      await workspace.uninit();
    } catch (error) {
      console.warn(`清理工作区失败: ${workspacePath}`, error);
    }

    // 从缓存移除
    this.workspaces.delete(normalizedPath);

    return true;
  }

  /**
   * 检查工作区是否存在于管理器中
   */
  has(workspacePath: string): boolean {
    const normalizedPath = path.resolve(workspacePath);
    return this.workspaces.has(normalizedPath);
  }

  /**
   * 获取所有已管理的工作区
   */
  getAll(): Array<{ path: string, workspace: Workspace }> {
    return Array.from(this.workspaces.entries()).map(([path, workspace]) => ({
      path,
      isPrimary: this.primaryWorkspacePath === path,
      workspace
    }));
  }

  /**
   * 获取工作区数量
   */
  size(): number {
    return this.workspaces.size;
  }

  /**
   * 清空所有工作区
   */
  async clear(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const workspace of this.workspaces.values()) {
      promises.push(workspace.uninit().catch(e => console.warn('清理工作区失败:', e)));
    }

    await Promise.all(promises);

    this.workspaces.clear();
  }

  /**
   * 批量预加载工作区
   * @param paths 工作区路径列表
   * @param initializeAll 是否初始化所有工作区
   */
  async preload(paths: string[], initializeAll = false): Promise<Workspace[]> {
    const results: Workspace[] = [];

    for (const path of paths) {
      try {
        if (this.isWorkspaceDirectory(path)) {
          const workspace = await this.create(path);

          if (initializeAll && !workspace.isInitialized()) {
            await workspace.initialize();
          }

          results.push(workspace);
        }
      } catch (error) {
        console.warn(`预加载工作区失败: ${path}`, error);
      }
    }

    return results;
  }

  /**
   * 检查是否为工作区目录
   */
  isWorkspaceDirectory(directoryPath: string): boolean {
    const hyperChatPath = path.join(directoryPath, CONSTANTS.HYPERCHAT_DIR);
    return fs.existsSync(hyperChatPath) && fs.statSync(hyperChatPath).isDirectory();
  }

  /**
   * 检查是否为全局工作区
   */
  isGlobalWorkspace(workspacePath: string): boolean {
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

  // === 单工作区模式兼容API ===

  /**
   * 初始化工作区管理器（单工作区模式兼容 - 相当于添加第一个工作区）
   * @param workspacePath 工作区路径
   * @param autoStart 是否自动启动工作区，默认false（仅初始化）
   */
  async initialize(workspacePath: string): Promise<Workspace> {
    const normalizedPath = path.resolve(workspacePath);

    // 设为当前工作区
    this.primaryWorkspacePath = normalizedPath;
    let workspace = await this.create(workspacePath, true);
    await workspace.initialize();
    return workspace;
  }


  /**
   * 获取当前工作区（单工作区模式兼容 - 返回当前活跃的工作区）
   */
  getCurrentWorkspace(): Workspace {
    if (!this.primaryWorkspacePath) {
      throw new Error("工作区管理器尚未初始化，请先调用 initialize() 方法。");
    }

    const workspace = this.workspaces.get(this.primaryWorkspacePath);
    if (!workspace) {
      throw new Error("当前工作区不存在");
    }

    return workspace;
  }

  /**
   * 检查工作区管理器是否已初始化
   */
  isWorkspaceInitialized(): boolean {
    return this.primaryWorkspacePath !== null && this.workspaces.has(this.primaryWorkspacePath);
  }

  /**
   * 获取当前工作区路径
   */
  getCurrentWorkspacePath(): string {
    if (!this.primaryWorkspacePath) {
      throw new Error("工作区管理器尚未初始化");
    }
    return this.primaryWorkspacePath;
  }

  /**
   * 切换到新工作区（单工作区模式兼容 - 实际上是重新初始化）
   * @param workspacePath 工作区路径
   * @param force 是否强制创建工作区
   * @param autoStart 是否自动启动新工作区
   */
  async switchWorkspace(workspacePath: string, force: boolean = false): Promise<void> {
    const normalizedPath = path.resolve(workspacePath);

    // 检查目标工作区是否存在
    if (!force && !this.isWorkspaceDirectory(workspacePath)) {
      throw new Error(`工作区不存在: ${workspacePath}`);
    }

    // 如果目标路径与当前工作区相同，无需重新初始化
    if (this.primaryWorkspacePath === normalizedPath) {
      // 如果需要启动但未启动，则启动
      return;
    }

    // 切换到新工作区（不清理旧工作区，保持在缓存中）
    await this.initialize(workspacePath);
  }


  /**
   * 清理工作区管理器，释放资源
   */
  async uninitialize(): Promise<void> {
    // 清理所有工作区
    await this.clear();
    this.primaryWorkspacePath = null;
  }

  /**
   * 创建新工作区（单工作区模式兼容）
   */
  async createWorkspace(workspacePath: string): Promise<Workspace> {
    return await this.create(workspacePath, true);
  }


}

// 导出单例实例（可选）
export const workspaceManager = new WorkspaceManager();