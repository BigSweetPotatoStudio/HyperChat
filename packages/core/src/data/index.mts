// 导出核心模块（仅限 Node.js 环境）

// 导出基础数据类

// 导出应用设置管理器
export { AppSettingsManager } from "./managers/appSettingsManager.mjs";

// 导出应用设置服务
export { 
  getAppSettingsManager, 
  initAppSettingsManager, 
  isAppSettingsManagerInitialized,
  markAppSettingsManagerAsInitialized 
} from "./appSettingsService.mjs";
