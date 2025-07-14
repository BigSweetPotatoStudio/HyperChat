import { appDataDir } from "../const.mjs";
import { Logger } from "../log.mjs";
import { AIModelConfigItem } from "@dadigua/hyperchat-shared";
import { AppSettingsManager } from "./managers/appSettingsManager.mjs";
import { AISettings } from "@dadigua/hyperchat-shared";

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

class AiModelData {
  data: Array<AIModelConfigItem> = []
  constructor() {

  }

  async init() {
    // 确保应用设置管理器已初始化，但不重复调用init()
    if (!isAppSettingsManagerInitialized()) {
      const appSettingsManager = initAppSettingsManager(appDataDir);
      await appSettingsManager.init();
      markAppSettingsManagerAsInitialized();
    }
    
    let appSettings = getAppSettingsManager()
    if (!appSettings) {
      throw new Error('AppSettings manager not initialized');
    }
    const aiSettings = appSettings.getAI();
    if (!aiSettings) {
      throw new Error('AI settings not found');
    }
    return (aiSettings.models || []).map((model) => {
      const providerKey = model.provider as string;
      return {
        ...model,
        baseURL: aiSettings.builtinApiKeys?.[providerKey]?.baseURL || model.baseURL,
        apiKey: aiSettings.builtinApiKeys?.[providerKey]?.apiKey || model.apiKey,
      };
    });
  }
}

export const AI_MODELS = new AiModelData();

try {

  // 初始化应用设置管理器
  const appSettingsManager = initAppSettingsManager(appDataDir);
  await appSettingsManager.init();

  // 标记为已完成初始化
  markAppSettingsManagerAsInitialized();

  Logger.info("App settings manager initialized successfully");
} catch (error) {
  Logger.error("Failed to initialize app settings manager:", error);
  throw error;
}