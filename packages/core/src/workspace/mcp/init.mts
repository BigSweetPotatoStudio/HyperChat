/**
 * 工作区 MCP 系统初始化脚本
 * 用于启动全局和内置 MCP 服务
 */

import { initMCPManager, getMCPManager } from "./index.mjs";
import { Logger } from "../../log.mjs";

let initialized = false;

/**
 * 初始化工作区 MCP 系统
 */
export async function initWorkspaceMCP(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    Logger.info("正在初始化工作区 MCP 系统...");

    // 初始化 MCP 管理器
    const manager = await initMCPManager();

    // 启动全局服务器（包括内置服务器）
    await manager.startClients("global");
    Logger.info("全局 MCP 服务器已启动（包括内置服务器）");

    initialized = true;
    Logger.info("工作区 MCP 系统初始化完成");

  } catch (error) {
    Logger.error("初始化工作区 MCP 系统失败:", error);
    throw error;
  }
}

/**
 * 检查是否已初始化
 */
export function isWorkspaceMCPInitialized(): boolean {
  return initialized;
}

/**
 * 重启 MCP 系统（用于配置更新后）
 */
export async function restartWorkspaceMCP(): Promise<void> {
  try {
    Logger.info("正在重启工作区 MCP 系统...");

    const manager = getMCPManager();

    // 停止所有客户端
    await manager.stopClients("global");

    // 重新启动
    await manager.startClients("global");

    Logger.info("工作区 MCP 系统重启完成");

  } catch (error) {
    Logger.error("重启工作区 MCP 系统失败:", error);
    throw error;
  }
}

/**
 * 清理 MCP 系统
 */
export async function cleanupWorkspaceMCP(): Promise<void> {
  if (!initialized) {
    return;
  }

  try {
    Logger.info("正在清理工作区 MCP 系统...");

    const manager = getMCPManager();
    await manager.destroy();

    initialized = false;
    Logger.info("工作区 MCP 系统清理完成");

  } catch (error) {
    Logger.error("清理工作区 MCP 系统失败:", error);
  }
}