/**
 * 合并配置类型定义
 * 全局配置 + 工作区配置合并后的最终运行时配置
 */

import type { AIModelConfigItem, MCPServerConfig, AgentConfig } from '../types.mjs';

/**
 * 合并后的运行时配置
 * 这是一个CLI进程或Web会话的最终配置
 */
export interface MergedRuntimeConfig {
  /** AI模型配置（工作区优先，回退全局） */
  aiModels: AIModelConfigItem[];
  
  /** MCP工具配置（工作区 + 全局，去重） */
  mcpClients: Array<MCPServerConfig & { serverName: string }>;
  
  /** Agent配置（工作区 + 全局） */
  agents: AgentConfig[];
  
  /** 系统设置（工作区覆盖全局） */
  settings: MergedSettings;
  
  /** 配置来源信息 */
  sources: ConfigSources;
}

/**
 * 合并后的系统设置
 */
export interface MergedSettings {
  /** 默认AI模型 */
  defaultModel?: string;
  
  /** 默认Agent */
  defaultAgent?: string;
  
  /** 是否启用MCP工具 */
  enableMCP: boolean;
  
  /** 日志级别 */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  /** 项目特定设置 */
  project?: {
    name: string;
    description?: string;
    tags?: string[];
  };
}

/**
 * 配置来源追踪
 */
export interface ConfigSources {
  /** 全局配置路径 */
  globalPath: string;
  
  /** 工作区配置路径（如果有） */
  workspacePath?: string;
  
  /** 是否是项目工作区 */
  isProjectWorkspace: boolean;
  
  /** 配置加载时间 */
  loadedAt: Date;
  
  /** 各部分配置来源 */
  sources: {
    aiModels: 'global' | 'workspace' | 'merged';
    mcpClients: 'global' | 'workspace' | 'merged';
    agents: 'global' | 'workspace' | 'merged';
    settings: 'global' | 'workspace' | 'merged';
  };
}

/**
 * 配置合并选项
 */
export interface ConfigMergeOptions {
  /** 是否覆盖全局AI模型（如果工作区有配置） */
  overrideGlobalModels?: boolean;
  
  /** 是否合并MCP客户端（否则只用工作区的） */
  mergeMcpClients?: boolean;
  
  /** 是否合并Agents（否则只用工作区的） */
  mergeAgents?: boolean;
  
  /** 是否启用配置验证 */
  validateConfig?: boolean;
}

/**
 * 配置合并结果
 */
export interface ConfigMergeResult {
  /** 合并成功 */
  success: boolean;
  
  /** 合并后的配置 */
  config?: MergedRuntimeConfig;
  
  /** 错误信息 */
  errors?: string[];
  
  /** 警告信息 */
  warnings?: string[];
  
  /** 合并统计 */
  stats: {
    globalItemsLoaded: number;
    workspaceItemsLoaded: number;
    finalItemsCount: number;
    mergeTimeMs: number;
  };
}