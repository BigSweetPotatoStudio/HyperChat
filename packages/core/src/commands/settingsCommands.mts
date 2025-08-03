import { getWorkspaceManager } from "../workspace/index.mjs";
import { getAppSettingsManager, isAppSettingsManagerInitialized, AppSettingsManager } from "../data/index.mjs";
import { EVENT } from "../common/event.mjs";
import { Logger } from "../log.mjs";
import { ProxyUtils } from "../ai/utils/ProxyUtils.mjs";

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
  },

  /**
   * 获取提供商的远程模型列表
   * 支持代理环境变量和统一错误处理
   * @param providerKey 提供商标识
   * @param apiKey API Key
   * @param baseURL Base URL
   * @returns 模型列表数组
   */
  async fetchProviderModels({ 
    providerKey, 
    apiKey, 
    baseURL 
  }: { 
    providerKey: string;
    apiKey: string;
    baseURL: string;
  }) {
    try {
      // 检查提供商是否支持模型列表接口
      const unsupportedProviders = ['gemini', 'anthropic'];
      if (unsupportedProviders.includes(providerKey)) {
        return {
          success: false,
          error: `Provider ${providerKey} does not support model list API`,
          models: []
        };
      }

      if (!apiKey || !baseURL) {
        return {
          success: false,
          error: 'API Key or Base URL not provided',
          models: []
        };
      }

      // 构建模型列表接口 URL
      const modelsEndpoint = baseURL.endsWith('/') ? `${baseURL}models` : `${baseURL}/models`;
      
      Logger.info(`Fetching models from ${providerKey}: ${modelsEndpoint}`);

      // 发送请求（支持代理环境变量）
      let response: Response;
      
      if (ProxyUtils.isProxyConfigured()) {
        Logger.info(`Using proxy: ${ProxyUtils.getProxyUrl()}`);
        const proxyFetch = ProxyUtils.createProxyFetch();
        response = await proxyFetch(modelsEndpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        // 没有代理配置，使用标准 fetch
        response = await fetch(modelsEndpoint, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        Logger.info(`Successfully fetched ${data.data.length} models from ${providerKey}`);
        return {
          success: true,
          models: data.data.map((model: any) => ({
            id: model.id,
            object: model.object || 'model',
            created: model.created,
            owned_by: model.owned_by
          }))
        };
      } else {
        throw new Error('Invalid response format from models API');
      }

    } catch (error) {
      Logger.error(`Failed to fetch models for provider ${providerKey}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        models: []
      };
    }
  }

};