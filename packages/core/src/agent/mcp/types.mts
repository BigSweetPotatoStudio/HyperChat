/**
 * 工作区 MCP 类型定义
 */

import type { MCPServerConfig, IMCPClient } from "@dadigua/hyperchat-shared";

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

}

export type WorkspaceMCPClient = IMCPClient;

export interface MCPManagerOptions {
  /**
   * 是否启用日志记录
   */
  enableLogging?: boolean;

  /**
   * 允许启动的MCP服务器名称列表
   * 如果为空或未设置，则启动所有配置的服务器
   * Agent专属：只启动Agent允许的MCP服务器
   */
  allowMCPs?: string[];
  initiationType?: "agent"
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