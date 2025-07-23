import * as fs from "fs";
import * as path from "path";
import jsonc from "jsonc-parser";
import { zodToJsonSchema } from "zod-to-json-schema";
import { v4 } from "uuid";
import { z } from "zod";
import {
  AppSettingsSchema,
  DEFAULT_APP_SETTINGS,
  type AppSettings,
  type AppearanceSettings,
  type SystemSettings,
  type AISettings,
  type DesktopSettings,
  AppearanceSchema,
  SystemSchema,
  DesktopSchema,
  AIConfigSchema,
  AIModelConfigItemSchema,
  ProviderConfigSchema,
  MCPGatewaySchema,
} from "@dadigua/hyperchat-shared";
import { CONST, getAppDataDir } from "../../const.mjs";

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
    
    // 初始化为空，在 load() 时才设置默认值
    // 创建完整的默认设置，包含 UUID 和版本号
    this.settings = {
      ...DEFAULT_APP_SETTINGS,
      uuid: v4(),
      version: CONST.getVersion,
      appDataDir: getAppDataDir(),
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
          // 只更新系统相关的字段，保留用户设置
          this.settings = {
            ...result.data,
            // 只更新动态系统信息
            version: CONST.getVersion,
            appDataDir: getAppDataDir(),
            platform: process.platform,
            PATH: process.env.PATH || "",
          };
        } else {
          console.warn("应用设置文件验证失败，尝试部分修复:", result.error);
          // 智能修复：保留有效部分，只重置有问题的字段
          await this.smartRepair(parsed, result.error);
        }
      } else {
        // 文件不存在，创建默认设置
        this.createDefaultSettings();
        await this.save();
      }
    } catch (error) {
      console.error("加载应用设置文件失败:", error);
      // 使用默认设置
      this.createDefaultSettings();
    }
  }

  /**
   * 智能修复配置：只重置有问题的字段，保留有效的用户配置
   */
  private async smartRepair(parsed: any, error: any): Promise<void> {
    console.log("开始智能修复配置...");
    
    // 先创建默认配置作为基础
    this.createDefaultSettings();
    
    // 逐个字段尝试保留
    const repairResults: string[] = [];
    
    // 保留基础系统信息
    if (parsed.uuid && typeof parsed.uuid === 'string') {
      this.settings.uuid = parsed.uuid;
      repairResults.push("✓ 保留 UUID");
    }
    
    // 保留外观设置（修复无效值）
    if (parsed.appearance && typeof parsed.appearance === 'object') {
      try {
        const appearanceResult = AppearanceSchema.safeParse(parsed.appearance);
        if (appearanceResult.success) {
          this.settings.appearance = appearanceResult.data;
          repairResults.push("✓ 保留外观设置");
        } else {
          // 部分修复外观设置
          const appearance = { ...this.settings.appearance };
          if (typeof parsed.appearance.darkTheme === 'boolean') {
            appearance.darkTheme = parsed.appearance.darkTheme;
            repairResults.push("✓ 保留深色主题设置");
          }
          // 语言设置已移动到环境变量系统，这里不再处理
          if ('language' in parsed.appearance) {
            repairResults.push("ℹ️ 语言设置已迁移到环境变量系统 (HyperChat_Language)");
          }
          this.settings.appearance = appearance;
        }
      } catch (e) {
        repairResults.push("✗ 外观设置损坏，使用默认值");
      }
    }
    
    // 保留系统设置
    if (parsed.system && typeof parsed.system === 'object') {
      try {
        const systemResult = SystemSchema.safeParse(parsed.system);
        if (systemResult.success) {
          this.settings.system = systemResult.data;
          repairResults.push("✓ 保留系统设置");
        } else {
          // 部分保留系统设置
          const system = { ...this.settings.system };
          // 密码设置已移动到环境变量系统，这里不再处理
          if ('password' in parsed.system) {
            repairResults.push("ℹ️ 密码设置已迁移到环境变量系统 (HyperChat_Web_Password)");
          }
          if (typeof parsed.system.isDeveloper === 'boolean') {
            system.isDeveloper = parsed.system.isDeveloper;
            repairResults.push("✓ 保留开发者模式设置");
          }
          this.settings.system = system;
        }
      } catch (e) {
        repairResults.push("✗ 系统设置损坏，使用默认值");
      }
    }
    
    // 保留桌面设置
    if (parsed.desktop && typeof parsed.desktop === 'object') {
      try {
        const desktopResult = DesktopSchema.safeParse(parsed.desktop);
        if (desktopResult.success) {
          this.settings.desktop = desktopResult.data;
          repairResults.push("✓ 保留桌面设置");
        }
      } catch (e) {
        repairResults.push("✗ 桌面设置损坏，使用默认值");
      }
    }
    
    // 保留 AI 设置（最重要的部分）
    if (parsed.ai && typeof parsed.ai === 'object') {
      try {
        const aiResult = AIConfigSchema.safeParse(parsed.ai);
        if (aiResult.success) {
          this.settings.ai = aiResult.data;
          repairResults.push("✓ 保留完整 AI 配置");
        } else {
          // 逐项保留 AI 配置
          const ai = { ...this.settings.ai };
          
          // 保留模型列表
          if (Array.isArray(parsed.ai.models)) {
            const validModels: any[] = [];
            parsed.ai.models.forEach((model: any, index: number) => {
              try {
                const modelResult = AIModelConfigItemSchema.safeParse(model);
                if (modelResult.success) {
                  validModels.push(modelResult.data);
                } else {
                  repairResults.push(`✗ 模型 ${index} 配置无效，已跳过`);
                }
              } catch (e) {
                repairResults.push(`✗ 模型 ${index} 解析失败，已跳过`);
              }
            });
            if (validModels.length > 0) {
              ai.models = validModels;
              repairResults.push(`✓ 保留 ${validModels.length} 个有效的 AI 模型配置`);
            } else {
              repairResults.push("✗ 所有 AI 模型配置无效，使用默认值");
            }
          }
          
          // 保留自定义提供商
          if (Array.isArray(parsed.ai.customProviders)) {
            try {
              const providersResult = z.array(ProviderConfigSchema).safeParse(parsed.ai.customProviders);
              if (providersResult.success) {
                ai.customProviders = providersResult.data;
                repairResults.push("✓ 保留自定义提供商配置");
              }
            } catch (e) {
              repairResults.push("✗ 自定义提供商配置无效，使用默认值");
            }
          }
          
          // 保留内置 API Keys
          if (parsed.ai.builtinApiKeys && typeof parsed.ai.builtinApiKeys === 'object') {
            try {
              const validKeys: Record<string, any> = {};
              Object.entries(parsed.ai.builtinApiKeys).forEach(([key, value]: [string, any]) => {
                if (value && typeof value === 'object' && 
                    typeof value.apiKey === 'string' && 
                    typeof value.baseURL === 'string') {
                  validKeys[key] = value;
                }
              });
              if (Object.keys(validKeys).length > 0) {
                ai.builtinApiKeys = validKeys;
                repairResults.push(`✓ 保留 ${Object.keys(validKeys).length} 个内置 API Key 配置`);
              }
            } catch (e) {
              repairResults.push("✗ 内置 API Keys 配置无效，使用默认值");
            }
          }
          
          // 保留默认模型
          if (typeof parsed.ai.defaultModel === 'string') {
            ai.defaultModel = parsed.ai.defaultModel;
            repairResults.push("✓ 保留默认模型设置");
          }
          
          this.settings.ai = ai;
        }
      } catch (e) {
        repairResults.push("✗ AI 配置严重损坏，使用默认值");
      }
    }
    
    // 保留 MCP 网关配置
    if (Array.isArray(parsed.mcpGateWays)) {
      try {
        const mcpResult = z.array(MCPGatewaySchema).safeParse(parsed.mcpGateWays);
        if (mcpResult.success) {
          this.settings.mcpGateWays = mcpResult.data;
          repairResults.push("✓ 保留 MCP 网关配置");
        }
      } catch (e) {
        repairResults.push("✗ MCP 网关配置无效，使用默认值");
      }
    }
    
    // 输出修复结果
    console.log("智能修复完成:");
    repairResults.forEach(result => console.log(`  ${result}`));
    
    // 保存修复后的配置
    await this.save();
    console.log("已保存修复后的配置文件");
  }

  /**
   * 创建默认设置
   */
  private createDefaultSettings(): void {
    this.settings = {
      ...DEFAULT_APP_SETTINGS,
      uuid: v4(),
      version: CONST.getVersion,
      appDataDir: getAppDataDir(),
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
        models: updates.ai?.models || this.settings.ai?.models || [],
        customProviders: updates.ai?.customProviders || this.settings.ai?.customProviders || [],
        builtinApiKeys: {
          ...(this.settings.ai?.builtinApiKeys || {}),
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
        models: updates.models || this.settings.ai?.models || [],
        customProviders: updates.customProviders || this.settings.ai?.customProviders || [],
        builtinApiKeys: {
          ...(this.settings.ai?.builtinApiKeys || {}),
          ...(updates.builtinApiKeys || {}),
        },
      },
    });
  }

  /**
   * 获取桌面应用设置
   */
  getDesktop(): DesktopSettings {
    return { ...this.settings.desktop };
  }

  /**
   * 更新桌面应用设置
   */
  async updateDesktop(updates: Partial<DesktopSettings>): Promise<void> {
    await this.updateSettings({
      desktop: {
        ...this.settings.desktop,
        ...updates,
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
      appDataDir: getAppDataDir(),
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
          appDataDir: getAppDataDir(),
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