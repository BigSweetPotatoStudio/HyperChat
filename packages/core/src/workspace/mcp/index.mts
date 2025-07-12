// /**
//  * 工作区 MCP 模块主入口
//  * 提供统一的 MCP 管理接口
//  */

// export { WorkspaceMCPManager } from "./manager.mjs";
// export { WorkspaceMCPClientImpl } from "./client.mjs";
// export { 
//   initWorkspaceMCP, 
//   isWorkspaceMCPInitialized, 
//   restartWorkspaceMCP, 
//   cleanupWorkspaceMCP 
// } from "./init.mjs";
// export type {
//   WorkspaceMCPConfig,
//   WorkspaceMCPClient,
//   MCPType,
//   MCPManagerOptions,
//   MCPManagerEvents,
// } from "./types.mjs";

// import { WorkspaceMCPManager } from "./manager.mjs";
// import { Logger } from "../../log.mjs";

// // 单个工作区 MCP 管理器实例
// let currentMCPManager: WorkspaceMCPManager | null = null;
// let currentWorkspacePath: string | null = null;

// /**
//  * 获取当前工作区的 MCP 管理器实例
//  */
// export function getMCPManager(workspacePath: string): WorkspaceMCPManager {
//   // 如果工作区路径变化或管理器不存在，创建新的管理器
//   if (!currentMCPManager || currentWorkspacePath !== workspacePath) {
//     // 清理旧的管理器
//     if (currentMCPManager) {
//       currentMCPManager.destroy().catch(err => {
//         Logger.error("销毁旧MCP管理器失败:", err);
//       });
//     }
    
//     // 创建新的管理器
//     currentMCPManager = new WorkspaceMCPManager(
//       workspacePath,
//       {
//         autoReconnect: true,
//         reconnectInterval: 5000,
//         maxReconnectAttempts: 5,
//         enableLogging: true,
//       },
//       {
//         onClientStatusChange: (client) => {
//           Logger.info(`MCP客户端状态变化: ${client.serverName} -> ${client.status}`);
//         },
//         onConfigUpdate: (config) => {
//           Logger.info(`MCP配置更新: ${config.workspacePath} workspacePath`);
//         },
//         onError: (error, context) => {
//           Logger.error("MCP管理器错误:", error, context);
//         },
//       }
//     );
//     currentWorkspacePath = workspacePath;
//   }
  
//   return currentMCPManager;
// }

// /**
//  * 初始化工作区 MCP 管理器
//  */
// export async function initMCPManager(workspacePath: string): Promise<WorkspaceMCPManager> {
//   const manager = getMCPManager(workspacePath);
//   return manager;
// }

// /**
//  * 销毁当前 MCP 管理器
//  */
// export async function destroyMCPManager(): Promise<void> {
//   if (currentMCPManager) {
//     await currentMCPManager.destroy();
//     currentMCPManager = null;
//     currentWorkspacePath = null;
//   }
// }

// /**
//  * 获取当前工作区路径
//  */
// export function getCurrentWorkspacePath(): string | null {
//   return currentWorkspacePath;
// }

// /**
//  * 启动当前工作区 MCP 服务
//  */
// export async function startWorkspaceMCP(workspacePath: string): Promise<void> {
//   try {
//     const manager = getMCPManager(workspacePath);
//     await manager.startClients();
//     Logger.info(`工作区 MCP 服务已启动: ${workspacePath}`);
//   } catch (error) {
//     Logger.error(`启动工作区 MCP 服务失败: ${workspacePath}`, error);
//     throw error;
//   }
// }

// /**
//  * 停止当前工作区 MCP 服务
//  */
// export async function stopWorkspaceMCP(workspacePath: string): Promise<void> {
//   try {
//     // 如果不是当前工作区，直接返回
//     if (currentWorkspacePath !== workspacePath) {
//       Logger.warn(`尝试停止非当前工作区的MCP服务: ${workspacePath}, 当前: ${currentWorkspacePath}`);
//       return;
//     }
    
//     if (currentMCPManager) {
//       await currentMCPManager.stopClients();
//       Logger.info(`工作区 MCP 服务已停止: ${workspacePath}`);
//     }
//   } catch (error) {
//     Logger.error(`停止工作区 MCP 服务失败: ${workspacePath}`, error);
//     throw error;
//   }
// }

// /**
//  * 获取当前工作区的 MCP 客户端
//  */
// export function getWorkspaceMCPClients(workspacePath: string) {
//   // 如果不是当前工作区，返回空数组
//   if (currentWorkspacePath !== workspacePath || !currentMCPManager) {
//     Logger.warn(`尝试获取非当前工作区的MCP客户端: ${workspacePath}, 当前: ${currentWorkspacePath}`);
//     return [];
//   }
  
//   return currentMCPManager.getClientsByWorkspace();
// }