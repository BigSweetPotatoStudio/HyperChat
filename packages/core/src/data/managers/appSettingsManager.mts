import * as fs from "fs";
import * as path from "path";
import jsonc from "jsonc-parser";
import { zodToJsonSchema } from "zod-to-json-schema";
import { v4 } from "uuid";
import {
  AppSettingsSchema,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type AppearanceSettings,
  type SystemSettings,
  type AISettings,
} from "@hyperchat/shared/jsonSchemas/appSettingsSchema";
import { CONST } from "../../const.mjs";

/**
 * 全局应用设置管理器类（仅限 Node.js 环境）
 */
export class AppSettingsManager {
  private settings: AppSettings;
  private settingsPath: string;
  private schemaPath: string;

  constructor(private appDataDir: string) {
    this.settingsPath = path.join(appDataDir, "app-settings.jsonc");
    this.schemaPath = path.join(appDataDir, "app-settings.schema.json");
    
    // 创建完整的默认设置，包含 UUID 和版本号
    this.settings = {
      ...DEFAULT_APP_SETTINGS,
      uuid: v4(),
      version: CONST.getVersion,
      appDataDir: CONST.appDataDir,
      platform: process.platform,
      PATH: process.env.PATH || "",
      ai: {
        models: DEFAULT_APP_SETTINGS.ai?.models || [],
        customProviders: DEFAULT_APP_SETTINGS.ai?.customProviders || [],
        builtinApiKeys: DEFAULT_APP_SETTINGS.ai?.builtinApiKeys || {},
        defaultModel: DEFAULT_APP_SETTINGS.ai?.defaultModel,
      },
    };
  }

  /**
   * 初始化设置
   */
  async init(): Promise<void> {
    // 确保目录存在
    if (!fs.existsSync(this.appDataDir)) {
      await fs.promises.mkdir(this.appDataDir, { recursive: true });
    }

    // 生成并保存 JSON Schema
    await this.generateSchema();
    
    // 加载设置
    await this.load();
  }

  /**
   * 生成并保存 JSON Schema
   */
  private async generateSchema(): Promise<void> {
    const jsonSchema = zodToJsonSchema(AppSettingsSchema, {
      name: "HyperChatAppSettings",
      $refStrategy: "none",
    });

    // 添加 $schema 属性引用
    const schemaWithReference = {
      $schema: "http://json-schema.org/draft-07/schema#",
      ...jsonSchema,
    };

    await fs.promises.writeFile(
      this.schemaPath,
      JSON.stringify(schemaWithReference, null, 2),
      "utf-8"
    );
  }

  /**
   * 加载设置
   */
  async load(): Promise<void> {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const content = await fs.promises.readFile(this.settingsPath, "utf-8");
        const parsed = jsonc.parse(content);
        
        // 使用 Zod 验证和解析
        const result = AppSettingsSchema.safeParse(parsed);
        
        if (result.success) {
          this.settings = {
            ...result.data,
            // 确保系统信息始终是最新的
            version: CONST.getVersion,
            appDataDir: CONST.appDataDir,
            platform: process.platform,
            PATH: process.env.PATH || "",
            // 确保ai配置有默认值
            ai: {
              models: result.data.ai?.models || [],
              customProviders: result.data.ai?.customProviders || [],
              builtinApiKeys: result.data.ai?.builtinApiKeys || {},
              defaultModel: result.data.ai?.defaultModel,
            },
          };
        } else {
          console.warn("应用设置文件验证失败，使用默认设置:", result.error);
          // 保存默认设置
          await this.save();
        }
      } else {
        // 文件不存在，创建默认设置
        await this.save();
      }
    } catch (error) {
      console.error("加载应用设置文件失败:", error);
      // 使用默认设置
      this.settings = {
        ...DEFAULT_APP_SETTINGS,
        uuid: v4(),
      };
    }
  }

  /**
   * 保存设置
   */
  async save(): Promise<void> {
    try {
      // 创建包含 $schema 引用的设置对象
      const settingsWithSchema = {
        $schema: "./app-settings.schema.json",
        ...this.settings,
      };

      const content = JSON.stringify(settingsWithSchema, null, 2);
      await fs.promises.writeFile(this.settingsPath, content, "utf-8");
    } catch (error) {
      console.error("保存应用设置文件失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有设置
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    // 深度合并设置
    this.settings = {
      ...this.settings,
      ...updates,
      appearance: {
        ...this.settings.appearance,
        ...(updates.appearance || {}),
      },
      system: {
        ...this.settings.system,
        ...(updates.system || {}),
      },
      desktop: {
        ...this.settings.desktop,
        ...(updates.desktop || {}),
      },
      ai: {
        ...this.settings.ai,
        ...(updates.ai || {}),
        models: updates.ai?.models || this.settings.ai.models,
        customProviders: updates.ai?.customProviders || this.settings.ai.customProviders,
        builtinApiKeys: {
          ...this.settings.ai.builtinApiKeys,
          ...(updates.ai?.builtinApiKeys || {}),
        },
      },
    };

    // 验证更新后的设置
    const result = AppSettingsSchema.safeParse(this.settings);
    if (!result.success) {
      throw new Error(`设置验证失败: ${result.error.message}`);
    }

    await this.save();
  }

  /**
   * 获取外观设置
   */
  getAppearance(): AppearanceSettings {
    return { ...this.settings.appearance };
  }

  /**
   * 更新外观设置
   */
  async updateAppearance(updates: Partial<AppearanceSettings>): Promise<void> {
    await this.updateSettings({
      appearance: {
        ...this.settings.appearance,
        ...updates,
      },
    });
  }



  /**
   * 获取系统设置
   */
  getSystem(): SystemSettings {
    return { ...this.settings.system };
  }

  /**
   * 更新系统设置
   */
  async updateSystem(updates: Partial<SystemSettings>): Promise<void> {
    await this.updateSettings({
      system: {
        ...this.settings.system,
        ...updates,
      },
    });
  }

  /**
   * 获取AI设置
   */
  getAI(): AISettings {
    return { ...this.settings.ai };
  }

  /**
   * 更新AI设置
   */
  async updateAI(updates: Partial<AISettings>): Promise<void> {
    await this.updateSettings({
      ai: {
        ...this.settings.ai,
        ...updates,
        models: updates.models || this.settings.ai.models,
        customProviders: updates.customProviders || this.settings.ai.customProviders,
        builtinApiKeys: {
          ...this.settings.ai.builtinApiKeys,
          ...(updates.builtinApiKeys || {}),
        },
      },
    });
  }

  /**
   * 重置设置为默认值
   */
  async reset(): Promise<void> {
    // 保留系统信息，但使用最新值
    const systemInfo = {
      version: CONST.getVersion,
      appDataDir: CONST.appDataDir,
      logFilePath: this.settings.logFilePath,
      PATH: process.env.PATH || "",
      platform: process.platform,
      uuid: this.settings.uuid,
    };

    this.settings = {
      ...DEFAULT_APP_SETTINGS,
      ...systemInfo,
    };
    await this.save();
  }

  /**
   * 导出设置
   */
  async export(): Promise<string> {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * 导入设置
   */
  async import(settingsJson: string): Promise<void> {
    try {
      const parsed = JSON.parse(settingsJson);
      const result = AppSettingsSchema.safeParse(parsed);
      
      if (result.success) {
        // 保留系统信息，但使用最新值
        const systemInfo = {
          version: CONST.getVersion,
          appDataDir: CONST.appDataDir,
          logFilePath: this.settings.logFilePath,
          PATH: process.env.PATH || "",
          platform: process.platform,
          uuid: this.settings.uuid,
        };

        this.settings = {
          ...result.data,
          ...systemInfo,
        };
        await this.save();
      } else {
        throw new Error(`设置验证失败: ${result.error.message}`);
      }
    } catch (error) {
      console.error("导入应用设置失败:", error);
      throw error;
    }
  }

}