/**
 * 应用配置常量定义
 * 
 * 核心功能：
 * - 定义 HyperChat 应用的网络端口配置
 * - 提供 HTTP 服务器和 MCP 服务器的默认端口
 * 
 * 端口说明：
 * - HTTPPORT (16100): 主 HTTP 服务器端口，用于 Web 前端访问
 * - MCPServerPORT (16110): MCP (Model Context Protocol) 服务器端口
 * 
 * 使用场景：
 * - HTTP 服务器启动时的默认端口配置
 * - MCP 服务器实例化时的端口分配
 * - 前端连接时的端口引用
 */

/** HTTP 服务器默认端口 */
const HTTPPORT = 16100;

/** MCP 服务器默认端口 */
const MCPServerPORT = 16110;

/**
 * 应用配置对象
 * 
 * 包含应用运行时需要的核心配置参数
 * 主要用于服务器启动和网络连接配置
 */
export const Config = {
  /** HTTP 服务器端口 */
  port: HTTPPORT,
  /** MCP 服务器端口 */
  mcp_server_port: MCPServerPORT,
};
