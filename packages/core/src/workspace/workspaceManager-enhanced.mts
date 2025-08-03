import * as path from "path";
import * as fs from "fs";
import { CONSTANTS } from "../agent/constants.mjs";
import { Workspace } from "./workspace.mjs";

interface WorkspaceManagerOptions {
  maxWorkspaces?: number;  // 最大缓存工作区数量，默认 10
}

/**
 * 工作区管理器 - 职责明确的简洁设计
 * 
 * 职责：
 * - 创建和缓存 Workspace 实例
 * - 管理工作区生命周期
 * - 提供工作区查找和统计
 * 
 * 不负责：
 * - 工作区内部状态管理（由 Workspace 自己负责）
 * - 工作区初始化和启动（调用方自行控制）
 */
export class WorkspaceManager {
  private workspaces: Map<string, Workspace> = new Map();
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
  getAll(): Array<{path: string, workspace: Workspace}> {
    return Array.from(this.workspaces.entries()).map(([path, workspace]) => ({
      path,
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
   * 获取管理器统计信息
   */
  getStats(): {
    total: number;
    maxCapacity: number;
    workspaces: Array<{
      path: string;
      isInitialized: boolean;
      isStarted: boolean;
    }>;
  } {
    const workspaceList = Array.from(this.workspaces.entries()).map(([path, workspace]) => ({
      path,
      isInitialized: workspace.isInitialized(),
      isStarted: workspace.isStarted()
    }));
    
    return {
      total: this.workspaces.size,
      maxCapacity: this.options.maxWorkspaces,
      workspaces: workspaceList
    };
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


}

// 导出单例实例（可选）
export const workspaceManager = new WorkspaceManager();