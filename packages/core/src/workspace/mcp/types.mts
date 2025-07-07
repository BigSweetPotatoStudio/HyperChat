/**
 * 工作区 MCP 类型定义
 */

import type { MCPServerConfig, IMCPClient } from "../../shared/data.mjs";

export type MCPType = "builtin" | "custom";

export interface WorkspaceMCPConfig {
  /**
   * MCP 服务器配置
   */
  mcpServers: Record<string, MCPServerConfig>;
  
  /**
   * 工作区路径
   */
  workspacePath: string;
  
  /**
   * 配置范围（固定为 workspace）
   */
  scope: "workspace";
  
  /**
   * 是否自动启动
   */
  autoStart?: boolean;
  
  /**
   * 配置创建时间
   */
  created?: number;
  
  /**
   * 最后修改时间
   */
  lastModified?: number;
}

export interface WorkspaceMCPClient extends IMCPClient {
  /**
   * 配置范围（固定为 workspace）
   */
  scope: "workspace";
  
  /**
   * MCP 类型
   */
  mcpType: MCPType;
}

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