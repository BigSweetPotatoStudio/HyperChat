/**
 * 运行时会话管理器
 * 管理一个CLI进程或Web会话的完整生命周期
 * 替代复杂的工作区切换逻辑，实现 全局+工作区 的简单合并模式
 */

import { existsSync } from 'fs';
import { join } from 'path';
import type { MergedRuntimeConfig, ConfigMergeOptions } from '../../shared/src/types/merged-config.mjs';
import { ConfigMerger } from '../config/config-merger.mjs';
import { Command } from '../command.mjs';
import { Logger } from '../utils/logger.mjs';

/**
 * 运行时会话状态
 */
export interface RuntimeSessionState {
  /** 会话是否已初始化 */
  initialized: boolean;
  
  /** 合并后的运行时配置 */
  config?: MergedRuntimeConfig;
  
  /** 当前工作目录 */
  currentDirectory: string;
  
  /** 检测到的工作区路径 */
  detectedWorkspacePath?: string;
  
  /** 是否是项目工作区 */
  isProjectWorkspace: boolean;
  
  /** 启动的MCP客户端列表 */
  activeMcpClients: string[];
  
  /** 会话创建时间 */
  createdAt: Date;
  
  /** 最后活动时间 */
  lastActivityAt: Date;
}

/**
 * 会话初始化选项
 */
export interface SessionInitOptions {
  /** 强制指定工作区路径（覆盖自动检测） */
  forceWorkspacePath?: string;
  
  /** 当前工作目录（CLI使用，Web端可以不指定） */
  currentDirectory?: string;
  
  /** 配置合并选项 */
  configOptions?: ConfigMergeOptions;
  
  /** 是否启动MCP客户端 */
  startMcpClients?: boolean;
  
  /** 日志器 */
  logger?: Logger;
}

/**
 * 运行时会话管理器
 * 每个CLI进程或Web会话对应一个实例
 */
export class RuntimeSession {
  private state: RuntimeSessionState;
  private configMerger: ConfigMerger;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger();
    this.configMerger = ConfigMerger.getInstance();
    
    this.state = {
      initialized: false,
      currentDirectory: process.cwd(),
      isProjectWorkspace: false,
      activeMcpClients: [],
      createdAt: new Date(),
      lastActivityAt: new Date()
    };
  }

  /**
   * 初始化会话
   * 1. 检测工作区
   * 2. 合并配置  
   * 3. 启动服务
   */
  async initialize(options: SessionInitOptions = {}): Promise<RuntimeSessionState> {
    this.logger.info('🚀 初始化运行时会话...');
    
    try {
      // 1. 确定工作目录
      const currentDir = options.currentDirectory || process.cwd();
      this.state.currentDirectory = currentDir;
      
      // 2. 检测工作区路径
      const workspacePath = await this.detectWorkspace(currentDir, options.forceWorkspacePath);
      this.state.detectedWorkspacePath = workspacePath;
      this.state.isProjectWorkspace = workspacePath !== undefined && 
        workspacePath !== (await Command.getGlobalWorkspace()).path;
      
      // 3. 获取全局工作区路径
      const globalWorkspace = await Command.getGlobalWorkspace();
      const globalPath = globalWorkspace.path;
      
      // 4. 合并配置
      this.logger.info(`🔧 合并配置: 全局(${globalPath}) + 工作区(${workspacePath || '无'})`);
      const mergeResult = await this.configMerger.mergeConfigs(
        globalPath,
        workspacePath,
        options.configOptions
      );
      
      if (!mergeResult.success || !mergeResult.config) {
        throw new Error(`配置合并失败: ${mergeResult.errors?.join(', ')}`);
      }
      
      this.state.config = mergeResult.config;
      
      // 5. 启动MCP客户端（如果需要）
      if (options.startMcpClients !== false && this.state.config.mcpClients.length > 0) {
        await this.startMcpClients();
      }
      
      this.state.initialized = true;
      this.updateActivity();
      
      this.logger.info('✅ 运行时会话初始化完成');
      this.logSessionInfo();
      
      return this.state;
      
    } catch (error) {
      this.logger.error('❌ 会话初始化失败:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * 检测工作区路径
   * 优先级：强制指定 > 当前目录 > 全局工作区
   */
  private async detectWorkspace(currentDir: string, forcePath?: string): Promise<string | undefined> {
    // 1. 强制指定的路径
    if (forcePath) {
      this.logger.info(`🎯 使用强制指定的工作区: ${forcePath}`);
      return forcePath;
    }
    
    // 2. 检查当前目录是否有 .hyperchat
    if (existsSync(join(currentDir, '.hyperchat'))) {
      this.logger.info(`📁 检测到项目工作区: ${currentDir}`);
      return currentDir;
    }
    
    // 3. 回退到全局工作区
    const globalWorkspace = await Command.getGlobalWorkspace();
    this.logger.info(`🌐 使用全局工作区: ${globalWorkspace.path}`);
    return globalWorkspace.path;
  }

  /**
   * 启动MCP客户端
   */
  private async startMcpClients(): Promise<void> {
    if (!this.state.config) return;
    
    this.logger.info(`🔧 启动 ${this.state.config.mcpClients.length} 个MCP客户端...`);
    
    try {
      // 使用配置的源路径启动MCP客户端
      const sourcePath = this.state.config.sources.isProjectWorkspace && this.state.detectedWorkspacePath
        ? this.state.detectedWorkspacePath
        : this.state.config.sources.globalPath;
        
      const mcpClients = await Command.startWorkspaceMcpClients({ 
        workspacePath: sourcePath 
      });
      
      this.state.activeMcpClients = mcpClients.map((client: any) => client.serverName);
      this.logger.info(`✅ 成功启动 ${this.state.activeMcpClients.length} 个MCP客户端`);
      
    } catch (error) {
      this.logger.warn('⚠️ 启动MCP客户端时出现问题:', error instanceof Error ? error.message : String(error));
      // 不抛出错误，允许会话在没有MCP的情况下继续
    }
  }

  /**
   * 停止MCP客户端
   */
  private async stopMcpClients(): Promise<void> {
    if (this.state.activeMcpClients.length === 0) return;
    
    this.logger.info('🛑 停止MCP客户端...');
    
    try {
      const sourcePath = this.state.config?.sources.isProjectWorkspace && this.state.detectedWorkspacePath
        ? this.state.detectedWorkspacePath
        : this.state.config?.sources.globalPath;
        
      if (sourcePath) {
        await Command.stopWorkspaceMcpClients({ workspacePath: sourcePath });
      }
      
      this.state.activeMcpClients = [];
      this.logger.info('✅ MCP客户端已停止');
      
    } catch (error) {
      this.logger.warn('⚠️ 停止MCP客户端时出现问题:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 获取当前会话状态
   */
  getState(): RuntimeSessionState {
    return { ...this.state };
  }

  /**
   * 获取合并后的配置
   */
  getConfig(): MergedRuntimeConfig | undefined {
    return this.state.config;
  }

  /**
   * 检查会话是否已初始化
   */
  isInitialized(): boolean {
    return this.state.initialized;
  }

  /**
   * 更新活动时间
   */
  updateActivity(): void {
    this.state.lastActivityAt = new Date();
  }

  /**
   * 清理会话资源
   */
  async cleanup(): Promise<void> {
    this.logger.info('🧹 清理运行时会话...');
    
    try {
      await this.stopMcpClients();
      this.state.initialized = false;
      this.logger.info('✅ 运行时会话清理完成');
    } catch (error) {
      this.logger.error('❌ 清理会话时出现错误:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(options?: ConfigMergeOptions): Promise<void> {
    if (!this.state.config) {
      throw new Error('会话未初始化，无法重新加载配置');
    }
    
    this.logger.info('🔄 重新加载配置...');
    
    // 停止现有MCP客户端
    await this.stopMcpClients();
    
    // 重新合并配置
    const mergeResult = await this.configMerger.mergeConfigs(
      this.state.config.sources.globalPath,
      this.state.config.sources.workspacePath,
      options
    );
    
    if (!mergeResult.success || !mergeResult.config) {
      throw new Error(`配置重新加载失败: ${mergeResult.errors?.join(', ')}`);
    }
    
    this.state.config = mergeResult.config;
    
    // 重新启动MCP客户端
    if (this.state.config.mcpClients.length > 0) {
      await this.startMcpClients();
    }
    
    this.updateActivity();
    this.logger.info('✅ 配置重新加载完成');
  }

  /**
   * 打印会话信息
   */
  private logSessionInfo(): void {
    if (!this.state.config) return;
    
    const config = this.state.config;
    console.log('\\n📊 运行时会话信息:');
    console.log(`  工作目录: ${this.state.currentDirectory}`);
    console.log(`  工作区类型: ${this.state.isProjectWorkspace ? '📁 项目工作区' : '🌐 全局工作区'}`);
    console.log(`  AI模型: ${config.aiModels.length} 个 (来源: ${config.sources.sources.aiModels})`);
    console.log(`  MCP工具: ${config.mcpClients.length} 个 (来源: ${config.sources.sources.mcpClients})`);
    console.log(`  Agents: ${config.agents.length} 个 (来源: ${config.sources.sources.agents})`);
    console.log(`  活跃MCP: ${this.state.activeMcpClients.length} 个`);
  }
}