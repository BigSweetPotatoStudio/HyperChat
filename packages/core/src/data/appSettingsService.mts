import { getAppDataDir } from "../const.mjs";
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
 * 获取全局应用设置管理器（支持自动同步初始化）
 */
export function getAppSettingsManager(): AppSettingsManager {
  if (!globalAppSettingsManager || !isInitialized) {
    // 自动同步初始化
    const appSettingsManager = initAppSettingsManager(getAppDataDir());
    // 同步初始化，如果配置文件不存在会创建默认配置
    appSettingsManager.initSync();
    markAppSettingsManagerAsInitialized();
  }
  return globalAppSettingsManager!;
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
      const appSettingsManager = initAppSettingsManager(getAppDataDir());
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

// 懒加载的AI_MODELS实例
let aiModelsInstance: AiModelData | null = null;

/**
 * 获取AI_MODELS实例，支持懒加载
 */
export function getAiModels(): AiModelData {
  if (!aiModelsInstance) {
    aiModelsInstance = new AiModelData();
  }
  return aiModelsInstance;
}

// 向后兼容的导出
export const AI_MODELS = {
  get init() { return getAiModels().init.bind(getAiModels()); }
};