import { getWorkspaceManager } from "../workspace/index.mjs";
import { getAppSettingsManager, isAppSettingsManagerInitialized, AppSettingsManager } from "../data/index.mjs";
import { EVENT } from "../common/event.mjs";
import { Logger } from "../log.mjs";

/**
 * 应用设置相关命令
 * 移除了工作区设置管理，现在使用envManage进行环境变量管理
 */
export const settingsCommands = {

  /**
   * 获取应用设置
   * @returns 应用设置
   */
  async getAppSettings() {
    try {
      const appSettingsManager = getAppSettingsManager();
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to get app settings:", error);
      throw error;
    }
  },

  /**
   * 更新应用设置
   * @param updates 要更新的设置
   * @returns 更新后的设置
   */
  async updateAppSettings({ updates }: { updates: Parameters<AppSettingsManager['updateSettings']>[0] }) {
    try {
      const appSettingsManager = getAppSettingsManager();
      await appSettingsManager.updateSettings(updates);
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to update app settings:", error);
      throw error;
    }
  },

  /**
   * 重置应用设置
   * @returns 重置后的设置
   */
  async resetAppSettings() {
    try {
      const appSettingsManager = getAppSettingsManager();
      await appSettingsManager.reset();
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to reset app settings:", error);
      throw error;
    }
  },

  /**
   * 导出应用设置
   * @returns 设置的JSON字符串
   */
  async exportAppSettings(): Promise<string> {
    try {
      const appSettingsManager = getAppSettingsManager();
      return await appSettingsManager.export();
    } catch (error) {
      console.error("Failed to export app settings:", error);
      throw error;
    }
  },

  /**
   * 导入应用设置
   * @param settingsJson 设置的JSON字符串
   * @returns 导入后的设置
   */
  async importAppSettings({ settingsJson }: { settingsJson: string }) {
    try {
      const appSettingsManager = getAppSettingsManager();
      await appSettingsManager.import(settingsJson);
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to import app settings:", error);
      throw error;
    }
  },

  /**
   * 刷新 MCP 网关路由
   * 通知 HTTP 服务器重新加载 MCP 网关配置
   */
  async refreshMcpRoutes(): Promise<void> {
    try {
      EVENT.fire('refreshMCPRoutes');
      // 或者通过事件机制通知 HTTP 服务器
      // 由于前端通过 call 调用，这个方法会被自动代理到前端
      Logger.info('MCP routes refresh requested');
    } catch (error) {
      Logger.error('Failed to refresh MCP routes:', error);
      throw error;
    }
  }

};