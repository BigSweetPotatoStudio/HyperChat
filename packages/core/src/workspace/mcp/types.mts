/**
 * 工作区 MCP 类型定义
 */

import type { MCPServerConfig, IMCPClient } from "@dadigua/hyperchat-shared/types";

export type MCPType = "builtin" | "custom";

/**
 * 带作用域信息的 MCP 服务器配置
 * 用于标识配置来源（全局或本地）
 */
export interface MCPServerConfigWithScope extends MCPServerConfig {
  /**
   * 配置来源作用域
   * - "global": 来自全局配置
   * - "workspace": 来自本地工作区配置
   */
  scope?: "global" | "workspace";
}

export interface WorkspaceMCPConfig {
  /**
   * MCP 服务器配置
   */
  mcpServers: Record<string, MCPServerConfigWithScope>;

  /**
   * 工作区路径
   */
  workspacePath: string;

  /**
   * 配置创建时间
   */
  created?: number;

  /**
   * 最后修改时间
   */
  lastModified?: number;
}

export type WorkspaceMCPClient = IMCPClient;

export interface MCPManagerOptions {
  /**
   * 是否启用自动重连
   */
  autoReconnect?: boolean;

  /**
   * 重连间隔（毫秒）
   */
  reconnectInterval?: number;

  /**
   * 最大重连次数
   */
  maxReconnectAttempts?: number;

  /**
   * 是否启用日志记录
   */
  enableLogging?: boolean;
}

export interface MCPManagerEvents {
  /**
   * 客户端状态变化事件
   */
  onClientStatusChange?: (client: WorkspaceMCPClient) => void;

  /**
   * 配置更新事件
   */
  onConfigUpdate?: (config: WorkspaceMCPConfig) => void;

  /**
   * 错误事件
   */
  onError?: (error: Error, context?: any) => void;
}