/**
 * CLI会话管理器
 * 使用新的运行时会话管理器，简化CLI的工作区管理
 * 不再支持运行时切换，每个CLI进程对应一个会话
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { RuntimeSession, type RuntimeSessionState, type SessionInitOptions } from '../../../core/src/session/runtime-session.mjs';
import type { MergedRuntimeConfig } from '@hyperchat/shared/types/merged-config';

/**
 * CLI会话状态（简化版）
 */
export interface CLISessionInfo {
  /** 会话是否已初始化 */
  isInitialized: boolean;
  
  /** 当前工作目录 */
  currentDirectory: string;
  
  /** 工作区路径 */
  workspacePath?: string;
  
  /** 工作区名称 */
  workspaceName: string;
  
  /** 是否是项目工作区 */
  isProjectWorkspace: boolean;
  
  /** 合并后的配置 */
  config?: MergedRuntimeConfig;
  
  /** 活跃的MCP客户端数量 */
  activeMcpCount: number;
}

/**
 * CLI会话管理器
 * 替代原来复杂的CLIWorkspaceManager
 */
export class CLISessionManager {
  private runtimeSession: RuntimeSession;
  private logger: Logger;

  constructor(verbose = false, quiet = false) {
    this.logger = new Logger(verbose, quiet);
    this.runtimeSession = new RuntimeSession(this.logger);
  }

  /**
   * 初始化CLI会话
   * @param readOnly 是否为只读模式（不启动MCP服务）
   * @param forceWorkspacePath 强制指定工作区路径
   */
  async initialize(readOnly = false, forceWorkspacePath?: string): Promise<CLISessionInfo> {
    const initOptions: SessionInitOptions = {
      currentDirectory: process.cwd(),
      forceWorkspacePath,
      startMcpClients: !readOnly,
      logger: this.logger
    };

    if (readOnly) {
      this.logger.info('📖 只读模式：不启动MCP服务');
    }

    const sessionState = await this.runtimeSession.initialize(initOptions);
    return this.convertToCliInfo(sessionState);
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.runtimeSession.isInitialized();
  }

  /**
   * 获取当前会话信息
   */
  getCurrentSession(): CLISessionInfo | undefined {
    if (!this.runtimeSession.isInitialized()) {
      return undefined;
    }

    const sessionState = this.runtimeSession.getState();
    return this.convertToCliInfo(sessionState);
  }

  /**
   * 获取合并后的配置
   */
  getConfig(): MergedRuntimeConfig | undefined {
    return this.runtimeSession.getConfig();
  }

  /**
   * 清理会话资源
   */
  async cleanup(): Promise<void> {
    await this.runtimeSession.cleanup();
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(): Promise<void> {
    await this.runtimeSession.reloadConfig();
  }

  /**
   * 更新活动时间
   */
  updateActivity(): void {
    this.runtimeSession.updateActivity();
  }

  /**
   * 将运行时会话状态转换为CLI会话信息
   */
  private convertToCliInfo(sessionState: RuntimeSessionState): CLISessionInfo {
    const config = sessionState.config;
    
    // 确定工作区名称
    let workspaceName: string;
    if (sessionState.isProjectWorkspace && sessionState.detectedWorkspacePath) {
      const { basename } = require('path');
      workspaceName = config?.settings.project?.name || basename(sessionState.detectedWorkspacePath);
    } else {
      workspaceName = 'Global';
    }

    return {
      isInitialized: sessionState.initialized,
      currentDirectory: sessionState.currentDirectory,
      workspacePath: sessionState.detectedWorkspacePath,
      workspaceName,
      isProjectWorkspace: sessionState.isProjectWorkspace,
      config,
      activeMcpCount: sessionState.activeMcpClients.length
    };
  }
}

// 全局CLI会话管理器实例
let cliSessionManager: CLISessionManager | undefined;

/**
 * 获取全局CLI会话管理器实例
 */
export function getCLISessionManager(verbose = false, quiet = false): CLISessionManager {
  if (!cliSessionManager) {
    cliSessionManager = new CLISessionManager(verbose, quiet);
  }
  return cliSessionManager;
}

/**
 * 确保CLI会话已初始化
 * @param readOnly 是否为只读模式（不启动MCP服务）
 * @param forceWorkspacePath 强制指定工作区路径
 */
export async function ensureCLISessionInitialized(
  verbose = false, 
  quiet = false, 
  readOnly = false,
  forceWorkspacePath?: string
): Promise<CLISessionInfo> {
  const manager = getCLISessionManager(verbose, quiet);
  
  if (!manager.isInitialized()) {
    return await manager.initialize(readOnly, forceWorkspacePath);
  }
  
  return manager.getCurrentSession()!;
}

/**
 * 获取当前工作区路径（只读模式）
 * 轻量级函数，不启动任何服务，仅用于获取工作区信息
 */
export async function getCurrentWorkspacePathReadOnly(): Promise<{ 
  workspacePath: string; 
  workspaceName: string; 
  isProjectWorkspace: boolean; 
}> {
  const { existsSync } = await import('fs');
  const { join, basename } = await import('path');
  const { Command } = await import('../../../core/src/command.mjs');
  
  const currentDir = process.cwd();
  
  // 检查当前目录是否有 .hyperchat
  if (existsSync(join(currentDir, '.hyperchat'))) {
    return {
      workspacePath: currentDir,
      workspaceName: basename(currentDir),
      isProjectWorkspace: true
    };
  }
  
  // 回退到全局工作区
  const globalWorkspace = await Command.getGlobalWorkspace();
  return {
    workspacePath: globalWorkspace.path,
    workspaceName: 'Global',
    isProjectWorkspace: false
  };
}