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
  MCPScope,
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
  await manager.init();
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
  
  // 确保管理器已初始化
  if (!manager['initialized']) {
    await manager.init();
  }
  
  try {
    // 加载工作区配置
    await manager.loadWorkspaceConfig(workspacePath);
    
    // 启动工作区客户端
    await manager.startClients("workspace", workspacePath);
    
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
    await manager.stopClients("workspace", workspacePath);
    Logger.info(`工作区 MCP 服务已停止: ${workspacePath}`);
  } catch (error) {
    Logger.error(`停止工作区 MCP 服务失败: ${workspacePath}`, error);
    throw error;
  }
}

/**
 * 获取所有 MCP 客户端（包括全局、工作区和内置）
 */
export function getAllMCPClients() {
  const manager = getMCPManager();
  return manager.getAllClients();
}

/**
 * 获取指定工作区的 MCP 客户端
 */
export function getWorkspaceMCPClients(workspacePath: string) {
  const manager = getMCPManager();
  return manager.getClientsByScope("workspace", workspacePath);
}

/**
 * 获取全局 MCP 客户端
 */
export function getGlobalMCPClients() {
  const manager = getMCPManager();
  return manager.getClientsByScope("global");
}

/**
 * 获取内置 MCP 客户端
 */
export function getBuiltinMCPClients() {
  const manager = getMCPManager();
  return manager.getAllClients().filter(client => client.mcpType === "builtin");
}