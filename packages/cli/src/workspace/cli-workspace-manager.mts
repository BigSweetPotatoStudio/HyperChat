/**
 * CLI 工作区管理器
 * 负责 CLI 应用级的工作区启动、切换、状态管理
 * 不同于 Core 的 WorkspaceManager，这个管理器专注于 CLI 的应用逻辑
 */

import process from 'process';
import { existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../../core/src/command.mjs';

export interface CLIWorkspaceState {
  workspacePath: string;
  workspaceName: string;
  isGlobal: boolean;
  isLoaded: boolean;
  mcpClientsStarted: boolean;
  isReadOnly: boolean;  // 是否为只读模式（不启动服务）
}

export class CLIWorkspaceManager {
  private currentWorkspace?: CLIWorkspaceState;
  private logger: Logger;
  private isInitialized = false;
  private readOnlyMode = false;  // 只读模式标识

  constructor(verbose = false, quiet = false) {
    this.logger = new Logger(verbose, quiet);
  }

  /**
   * CLI 应用启动时的工作区初始化
   * 实现智能工作区选择逻辑
   * @param readOnly 是否以只读模式启动（不启动MCP等服务）
   */
  async initialize(readOnly = false): Promise<CLIWorkspaceState> {
    this.readOnlyMode = readOnly;
    if (this.isInitialized && this.currentWorkspace) {
      return this.currentWorkspace;
    }

    this.logger.info('🔍 初始化 CLI 工作区...');

    try {
      // 1. 智能选择工作区
      const workspacePath = await this.detectWorkspace();
      
      // 2. 加载选中的工作区
      const workspaceState = await this.loadWorkspace(workspacePath);
      
      // 3. 启动工作区服务（除非是只读模式）
      if (!this.readOnlyMode) {
        await this.startWorkspaceServices(workspaceState);
      } else {
        this.logger.info('📖 只读模式，跳过服务启动');
        workspaceState.isReadOnly = true;
      }
      
      this.currentWorkspace = workspaceState;
      this.isInitialized = true;
      
      this.logger.info(`✅ 工作区初始化完成: ${workspaceState.workspaceName}`);
      this.logger.info(`📁 路径: ${workspaceState.workspacePath}`);
      
      return workspaceState;
    } catch (error) {
      this.logger.error('❌ 工作区初始化失败:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * 智能检测应该使用的工作区
   * 优先级：当前目录 > 全局工作区
   */
  private async detectWorkspace(): Promise<string> {
    const currentDir = process.cwd();
    
    // 检查当前目录是否有 .hyperchat 文件夹
    if (existsSync(join(currentDir, '.hyperchat'))) {
      this.logger.info(`🎯 发现当前目录工作区: ${currentDir}`);
      return currentDir;
    }
    
    // 回退到全局工作区
    const globalWorkspace = await Command.getGlobalWorkspace();
    this.logger.info(`🌐 使用全局工作区: ${globalWorkspace.path}`);
    return globalWorkspace.path;
  }

  /**
   * 加载指定的工作区
   */
  private async loadWorkspace(workspacePath: string): Promise<CLIWorkspaceState> {
    this.logger.debug(`📂 加载工作区: ${workspacePath}`);

    // 检查是否为全局工作区
    const globalWorkspace = await Command.getGlobalWorkspace();
    const isGlobal = workspacePath === globalWorkspace.path;

    let workspaceConfig;
    if (isGlobal) {
      // 全局工作区直接获取配置
      workspaceConfig = globalWorkspace;
    } else {
      // 检查是否已经是工作区
      const isWorkspace = await Command.isWorkspaceDirectory({ directoryPath: workspacePath });
      if (!isWorkspace) {
        throw new Error(`目录不是有效的工作区: ${workspacePath}`);
      }

      // 加载现有工作区
      workspaceConfig = await Command.loadWorkspace({ workspacePath });
      if (!workspaceConfig) {
        throw new Error(`无法加载工作区配置: ${workspacePath}`);
      }
    }

    return {
      workspacePath,
      workspaceName: workspaceConfig.name || (isGlobal ? 'Global' : 'Project'),
      isGlobal,
      isLoaded: true,
      mcpClientsStarted: false,
      isReadOnly: this.readOnlyMode
    };
  }

  /**
   * 启动工作区的所有服务
   */
  private async startWorkspaceServices(workspace: CLIWorkspaceState): Promise<void> {
    this.logger.debug(`🚀 启动工作区服务: ${workspace.workspaceName}`);

    try {
      // 启动 MCP 客户端
      const mcpClients = await Command.startWorkspaceMcpClients({ 
        workspacePath: workspace.workspacePath 
      });
      
      workspace.mcpClientsStarted = true;
      this.logger.info(`🔧 启动了 ${mcpClients.length} 个 MCP 客户端`);
      
      // 其他服务启动可以在这里添加
      // 例如：终端管理器、文件监听器等
      
    } catch (error) {
      this.logger.warn('⚠️ 启动 MCP 客户端时出现问题:', error instanceof Error ? error.message : String(error));
      // 不抛出错误，允许工作区在没有 MCP 的情况下运行
    }
  }


  /**
   * 停止当前工作区的服务
   */
  private async stopCurrentWorkspaceServices(): Promise<void> {
    if (!this.currentWorkspace) return;

    this.logger.debug(`🛑 停止工作区服务: ${this.currentWorkspace.workspaceName}`);

    try {
      // 停止 MCP 客户端
      if (this.currentWorkspace.mcpClientsStarted) {
        await Command.stopWorkspaceMcpClients({ 
          workspacePath: this.currentWorkspace.workspacePath 
        });
        this.currentWorkspace.mcpClientsStarted = false;
        this.logger.debug('🔧 MCP 客户端已停止');
      }

      // 其他清理工作可以在这里添加
      
    } catch (error) {
      this.logger.warn('⚠️ 停止工作区服务时出现问题:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * CLI 应用退出时的清理
   */
  async cleanup(): Promise<void> {
    this.logger.info('🧹 清理 CLI 工作区...');

    try {
      await this.stopCurrentWorkspaceServices();
      this.currentWorkspace = undefined;
      this.isInitialized = false;
      this.logger.info('✅ CLI 工作区清理完成');
    } catch (error) {
      this.logger.error('❌ 清理工作区时出现错误:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 获取当前工作区状态
   */
  getCurrentWorkspace(): CLIWorkspaceState | undefined {
    return this.currentWorkspace;
  }

  /**
   * 检查是否已初始化
   */
  isWorkspaceInitialized(): boolean {
    return this.isInitialized && !!this.currentWorkspace;
  }

  /**
   * 强制重新加载当前工作区的 MCP 配置
   */
  async reloadMcpClients(): Promise<void> {
    if (!this.currentWorkspace) {
      throw new Error('当前没有激活的工作区');
    }

    this.logger.info('🔄 重新加载 MCP 客户端...');

    try {
      const mcpClients = await Command.forceReloadWorkspaceMcpClients({ 
        workspacePath: this.currentWorkspace.workspacePath 
      });
      
      this.logger.info(`🔧 重新加载了 ${mcpClients.length} 个 MCP 客户端`);
    } catch (error) {
      this.logger.error('❌ 重新加载 MCP 客户端失败:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

}

// 全局 CLI 工作区管理器实例
let cliWorkspaceManager: CLIWorkspaceManager | undefined;

/**
 * 获取全局 CLI 工作区管理器实例
 */
export function getCLIWorkspaceManager(verbose = false, quiet = false): CLIWorkspaceManager {
  if (!cliWorkspaceManager) {
    cliWorkspaceManager = new CLIWorkspaceManager(verbose, quiet);
  }
  return cliWorkspaceManager;
}

/**
 * 确保工作区已初始化
 * @param readOnly 是否以只读模式初始化（不启动MCP等服务）
 */
export async function ensureWorkspaceInitialized(verbose = false, quiet = false, readOnly = false): Promise<CLIWorkspaceState> {
  const manager = getCLIWorkspaceManager(verbose, quiet);
  
  if (!manager.isWorkspaceInitialized()) {
    return await manager.initialize(readOnly);
  }
  
  return manager.getCurrentWorkspace()!;
}

/**
 * 获取当前工作区路径信息（只读模式）
 * 不启动任何服务，仅获取基本信息
 */
export async function getWorkspaceInfoReadOnly(verbose = false, quiet = false): Promise<{ workspacePath: string; workspaceName: string; isGlobal: boolean }> {
  // 检测工作区路径（不启动服务）
  const currentDir = process.cwd();
  const { existsSync } = await import('fs');
  const { join } = await import('path');
  
  let workspacePath: string;
  let isGlobal: boolean;
  
  if (existsSync(join(currentDir, '.hyperchat'))) {
    workspacePath = currentDir;
    isGlobal = false;
  } else {
    const { Command } = await import('../../../core/src/command.mjs');
    const globalWorkspace = await Command.getGlobalWorkspace();
    workspacePath = globalWorkspace.path;
    isGlobal = true;
  }
  
  // 获取工作区名称（不加载完整配置）
  let workspaceName: string;
  if (isGlobal) {
    workspaceName = 'Global';
  } else {
    const { basename } = await import('path');
    workspaceName = basename(workspacePath);
  }
  
  return {
    workspacePath,
    workspaceName,
    isGlobal
  };
}