// 导出核心模块（仅限 Node.js 环境）

export { AppSettingsManager } from "./appSettingsManager.mjs";
export { 
  initAppSettingsManager,
  getAppSettingsManager,
  isAppSettingsManagerInitialized 
} from "./appSettingsService.mjs";