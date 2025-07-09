import { AppSettingsManager } from "./managers/appSettingsManager.mjs";

// 全局应用设置管理器
let globalAppSettingsManager: AppSettingsManager | null = null;
let isInitialized = false;

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
 * 标记应用设置管理器已完成初始化
 */
export function markAppSettingsManagerAsInitialized(): void {
  isInitialized = true;
}

/**
 * 获取全局应用设置管理器
 */
export function getAppSettingsManager(): AppSettingsManager {
  if (!globalAppSettingsManager || !isInitialized) {
    throw new Error("应用设置管理器未初始化，请先调用 initAppSettingsManager 并完成初始化");
  }
  return globalAppSettingsManager;
}

/**
 * 检查是否已初始化应用设置管理器
 */
export function isAppSettingsManagerInitialized(): boolean {
  return globalAppSettingsManager !== null && isInitialized;
}