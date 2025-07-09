import { AppSettingsManager } from "./appSettingsManager.mjs";

// 全局应用设置管理器
let globalAppSettingsManager: AppSettingsManager | null = null;

/**
 * 初始化全局应用设置管理器
 */
export function initAppSettingsManager(appDataDir: string): AppSettingsManager {
  if (!globalAppSettingsManager) {
    globalAppSettingsManager = new AppSettingsManager(appDataDir);
  }
  return globalAppSettingsManager;
}

/**
 * 获取全局应用设置管理器
 */
export function getAppSettingsManager(): AppSettingsManager {
  if (!globalAppSettingsManager) {
    throw new Error("应用设置管理器未初始化，请先调用 initAppSettingsManager");
  }
  return globalAppSettingsManager;
}

/**
 * 检查是否已初始化应用设置管理器
 */
export function isAppSettingsManagerInitialized(): boolean {
  return globalAppSettingsManager !== null;
}