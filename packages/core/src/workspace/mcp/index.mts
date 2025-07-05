/**
 * 工作区 MCP 模块主入口
 * 提供统一的 MCP 管理接口
 */

export { WorkspaceMCPManager } from "./manager.mjs";
export { WorkspaceMCPClientImpl } from "./client.mjs";
export { 
  initWorkspaceMCP, 
  isWorkspaceMCPInitialized, 
  restartWorkspaceMCP, 
  cleanupWorkspaceMCP 
} from "./init.mjs";
export type {
  WorkspaceMCPConfig,
  WorkspaceMCPClient,
  MCPType,
  MCPManagerOptions,
  MCPManagerEvents,
} from "./types.mjs";

import { WorkspaceMCPManager } from "./manager.mjs";
import { Logger } from "../../log.mjs";

// 全局 MCP 管理器实例
let globalMCPManager: WorkspaceMCPManager | null = null;

/**
 * 获取全局 MCP 管理器实例
 */
export function getMCPManager(): WorkspaceMCPManager {
  if (!globalMCPManager) {
    globalMCPManager = new WorkspaceMCPManager(
      {
        autoReconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        enableLogging: true,
      },
      {
        onClientStatusChange: (client) => {
          Logger.info(`MCP客户端状态变化: ${client.name} -> ${client.status}`);
        },
        onConfigUpdate: (config) => {
          Logger.info(`MCP配置更新: ${config.scope} 范围`);
        },
        onError: (error, context) => {
          Logger.error("MCP管理器错误:", error, context);
        },
      }
    );
  }
  return globalMCPManager;
}

/**
 * 初始化全局 MCP 管理器
 */
export async function initMCPManager(): Promise<WorkspaceMCPManager> {
  const manager = getMCPManager();
  return manager;
}

/**
 * 销毁全局 MCP 管理器
 */
export async function destroyMCPManager(): Promise<void> {
  if (globalMCPManager) {
    await globalMCPManager.destroy();
    globalMCPManager = null;
  }
}

/**
 * 启动工作区 MCP 服务
 */
export async function startWorkspaceMCP(workspacePath: string): Promise<void> {
  const manager = getMCPManager();
  
  try {
    // 启动工作区客户端
    await manager.startClients(workspacePath);
    
    Logger.info(`工作区 MCP 服务已启动: ${workspacePath}`);
  } catch (error) {
    Logger.error(`启动工作区 MCP 服务失败: ${workspacePath}`, error);
    throw error;
  }
}

/**
 * 停止工作区 MCP 服务
 */
export async function stopWorkspaceMCP(workspacePath: string): Promise<void> {
  const manager = getMCPManager();
  
  try {
    await manager.stopClients(workspacePath);
    Logger.info(`工作区 MCP 服务已停止: ${workspacePath}`);
  } catch (error) {
    Logger.error(`停止工作区 MCP 服务失败: ${workspacePath}`, error);
    throw error;
  }
}

/**
 * 获取指定工作区的 MCP 客户端
 */
export function getWorkspaceMCPClients(workspacePath: string) {
  const manager = getMCPManager();
  return manager.getClientsByWorkspace(workspacePath);
}