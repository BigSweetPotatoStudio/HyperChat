import { getWorkspaceManager } from "../workspace/index.mjs";
import { getAppSettingsManager, isAppSettingsManagerInitialized, AppSettingsManager } from "../data/index.mjs";
import { EVENT } from "../common/event.mjs";
import { Logger } from "../log.mjs";

/**
 * 应用设置相关命令
 * 包含工作区设置和应用设置的管理
 */
export const settingsCommands = {

  /**
   * 获取工作区设置
   * @param workspacePath 工作区路径
   * @returns 工作区设置
   */
  async getWorkspaceSettings({
    workspacePath
  }: {
    workspacePath: string;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      return workspace.getSettings();
    } catch (error) {
      console.error(`Failed to get settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 更新工作区设置
   * @param workspacePath 工作区路径
   * @param updates 要更新的设置
   * @returns 更新后的设置
   */
  async updateWorkspaceSettings({
    workspacePath,
    updates
  }: {
    workspacePath: string;
    updates: Parameters<import('../data/managers/workspaceSettingsManager.mjs').WorkspaceSettingsManager['updateSettings']>[0];
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      await workspace.updateSettings(updates);
      return workspace.getSettings();
    } catch (error) {
      console.error(`Failed to update settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 重置工作区设置
   * @param workspacePath 工作区路径
   * @returns 重置后的设置
   */
  async resetWorkspaceSettings({
    workspacePath
  }: {
    workspacePath: string;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const settingsManager = workspace.getSettingsManager();
      await settingsManager.reset();
      return settingsManager.getSettings();
    } catch (error) {
      console.error(`Failed to reset settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 导出工作区设置
   * @param workspacePath 工作区路径
   * @returns 设置的JSON字符串
   */
  async exportWorkspaceSettings({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<string> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const settingsManager = workspace.getSettingsManager();
      return await settingsManager.export();
    } catch (error) {
      console.error(`Failed to export settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 导入工作区设置
   * @param workspacePath 工作区路径
   * @param settingsJson 设置的JSON字符串
   * @returns 导入后的设置
   */
  async importWorkspaceSettings({
    workspacePath,
    settingsJson
  }: {
    workspacePath: string;
    settingsJson: string;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const settingsManager = workspace.getSettingsManager();
      await settingsManager.import(settingsJson);
      return settingsManager.getSettings();
    } catch (error) {
      console.error(`Failed to import settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  },

  /**
   * 获取应用设置
   * @returns 应用设置
   */
  async getAppSettings() {
    try {
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

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
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

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
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

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
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

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
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

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