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

// 工作区 MCP 管理器实例映射
const mcpManagers: Map<string, WorkspaceMCPManager> = new Map();

/**
 * 获取指定工作区的 MCP 管理器实例
 */
export function getMCPManager(workspacePath: string): WorkspaceMCPManager {
  if (!mcpManagers.has(workspacePath)) {
    const manager = new WorkspaceMCPManager(
      workspacePath,
      {
        autoReconnect: true,
        reconnectInterval: 5000,
        maxReconnectAttempts: 5,
        enableLogging: true,
      },
      {
        onClientStatusChange: (client) => {
          Logger.info(`MCP客户端状态变化: ${client.serverName} -> ${client.status}`);
        },
        onConfigUpdate: (config) => {
          Logger.info(`MCP配置更新: ${config.workspacePath} workspacePath`);
        },
        onError: (error, context) => {
          Logger.error("MCP管理器错误:", error, context);
        },
      }
    );
    mcpManagers.set(workspacePath, manager);
  }
  return mcpManagers.get(workspacePath)!;
}

/**
 * 初始化工作区 MCP 管理器
 */
export async function initMCPManager(workspacePath: string): Promise<WorkspaceMCPManager> {
  const manager = getMCPManager(workspacePath);
  return manager;
}

/**
 * 销毁指定工作区的 MCP 管理器
 */
export async function destroyMCPManager(workspacePath: string): Promise<void> {
  const manager = mcpManagers.get(workspacePath);
  if (manager) {
    await manager.destroy();
    mcpManagers.delete(workspacePath);
  }
}

/**
 * 销毁所有 MCP 管理器
 */
export async function destroyAllMCPManagers(): Promise<void> {
  const tasks = Array.from(mcpManagers.values()).map(manager => manager.destroy());
  await Promise.allSettled(tasks);
  mcpManagers.clear();
}

/**
 * 启动工作区 MCP 服务
 */
export async function startWorkspaceMCP(workspacePath: string): Promise<void> {
  const manager = getMCPManager(workspacePath);
  
  try {
    // 启动工作区客户端
    await manager.startClients();
    
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
  const manager = getMCPManager(workspacePath);
  
  try {
    await manager.stopClients();
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
  const manager = getMCPManager(workspacePath);
  return manager.getClientsByWorkspace();
}