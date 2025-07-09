import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import jsonc from "jsonc-parser";
import { zodToJsonSchema } from "zod-to-json-schema";

// 外观设置 Schema
const AppearanceSchema = z.object({
  isDarkMode: z.boolean().default(false).describe("是否启用夜间模式"),
  theme: z.enum(["light", "dark", "auto"]).default("auto").describe("主题模式"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium").describe("字体大小"),
  language: z.enum(["zh-CN", "en-US"]).default("zh-CN").describe("界面语言"),
});

// 编辑器设置 Schema
const EditorSchema = z.object({
  autoSave: z.boolean().default(true).describe("是否自动保存"),
  autoSaveDelay: z.number().min(1000).max(60000).default(5000).describe("自动保存延迟（毫秒）"),
  wordWrap: z.boolean().default(true).describe("是否自动换行"),
  tabSize: z.number().min(2).max(8).default(2).describe("Tab 大小"),
});

// AI 设置 Schema
const AISchema = z.object({
  defaultModel: z.string().optional().describe("默认 AI 模型"),
  defaultAgent: z.string().optional().describe("默认 Agent"),
  temperature: z.number().min(0).max(2).default(0.7).describe("温度参数"),
  maxTokens: z.number().min(100).max(32000).default(4000).describe("最大 Token 数"),
  streamResponse: z.boolean().default(true).describe("是否流式响应"),
});

// 高级设置 Schema
const AdvancedSchema = z.object({
  enableTelemetry: z.boolean().default(false).describe("是否启用遥测"),
  debugMode: z.boolean().default(false).describe("是否启用调试模式"),
  experimentalFeatures: z.boolean().default(false).describe("是否启用实验性功能"),
});

// 完整的设置 Schema
export const SettingsSchema = z.object({
  appearance: AppearanceSchema.default({}),
  editor: EditorSchema.default({}),
  ai: AISchema.default({}),
  advanced: AdvancedSchema.default({}),
});

// 导出类型
export type Settings = z.infer<typeof SettingsSchema>;
export type AppearanceSettings = z.infer<typeof AppearanceSchema>;
export type EditorSettings = z.infer<typeof EditorSchema>;
export type AISettings = z.infer<typeof AISchema>;
export type AdvancedSettings = z.infer<typeof AdvancedSchema>;

// 默认设置
export const DEFAULT_SETTINGS: Settings = {
  appearance: {
    isDarkMode: false,
    theme: "auto",
    fontSize: "medium",
    language: "zh-CN",
  },
  editor: {
    autoSave: true,
    autoSaveDelay: 5000,
    wordWrap: true,
    tabSize: 2,
  },
  ai: {
    temperature: 0.7,
    maxTokens: 4000,
    streamResponse: true,
  },
  advanced: {
    enableTelemetry: false,
    debugMode: false,
    experimentalFeatures: false,
  },
};

/**
 * 设置管理器类
 */
export class SettingsManager {
  private settings: Settings;
  private settingsPath: string;
  private schemaPath: string;

  constructor(private workspacePath: string) {
    this.settingsPath = path.join(workspacePath, "settings.jsonc");
    this.schemaPath = path.join(workspacePath, "settings.schema.json");
    this.settings = DEFAULT_SETTINGS;
  }

  /**
   * 初始化设置
   */
  async init(): Promise<void> {
    // 生成并保存 JSON Schema
    await this.generateSchema();
    
    // 加载设置
    await this.load();
  }

  /**
   * 生成并保存 JSON Schema
   */
  private async generateSchema(): Promise<void> {
    const jsonSchema = zodToJsonSchema(SettingsSchema, {
      name: "HyperChatSettings",
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
        const result = SettingsSchema.safeParse(parsed);
        
        if (result.success) {
          this.settings = result.data;
        } else {
          console.warn("设置文件验证失败，使用默认设置:", result.error);
          // 保存默认设置
          await this.save();
        }
      } else {
        // 文件不存在，创建默认设置
        await this.save();
      }
    } catch (error) {
      console.error("加载设置文件失败:", error);
      // 使用默认设置
      this.settings = DEFAULT_SETTINGS;
    }
  }

  /**
   * 保存设置
   */
  async save(): Promise<void> {
    try {
      // 创建包含 $schema 引用的设置对象
      const settingsWithSchema = {
        $schema: "./settings.schema.json",
        ...this.settings,
      };

      const content = JSON.stringify(settingsWithSchema, null, 2);
      await fs.promises.writeFile(this.settingsPath, content, "utf-8");
    } catch (error) {
      console.error("保存设置文件失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有设置
   */
  getSettings(): Settings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  async updateSettings(updates: Partial<Settings>): Promise<void> {
    // 深度合并设置
    this.settings = {
      ...this.settings,
      ...updates,
      appearance: {
        ...this.settings.appearance,
        ...(updates.appearance || {}),
      },
      editor: {
        ...this.settings.editor,
        ...(updates.editor || {}),
      },
      ai: {
        ...this.settings.ai,
        ...(updates.ai || {}),
      },
      advanced: {
        ...this.settings.advanced,
        ...(updates.advanced || {}),
      },
    };

    // 验证更新后的设置
    const result = SettingsSchema.safeParse(this.settings);
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
   * 获取编辑器设置
   */
  getEditor(): EditorSettings {
    return { ...this.settings.editor };
  }

  /**
   * 更新编辑器设置
   */
  async updateEditor(updates: Partial<EditorSettings>): Promise<void> {
    await this.updateSettings({
      editor: {
        ...this.settings.editor,
        ...updates,
      },
    });
  }

  /**
   * 获取 AI 设置
   */
  getAI(): AISettings {
    return { ...this.settings.ai };
  }

  /**
   * 更新 AI 设置
   */
  async updateAI(updates: Partial<AISettings>): Promise<void> {
    await this.updateSettings({
      ai: {
        ...this.settings.ai,
        ...updates,
      },
    });
  }

  /**
   * 获取高级设置
   */
  getAdvanced(): AdvancedSettings {
    return { ...this.settings.advanced };
  }

  /**
   * 更新高级设置
   */
  async updateAdvanced(updates: Partial<AdvancedSettings>): Promise<void> {
    await this.updateSettings({
      advanced: {
        ...this.settings.advanced,
        ...updates,
      },
    });
  }

  /**
   * 重置设置为默认值
   */
  async reset(): Promise<void> {
    this.settings = DEFAULT_SETTINGS;
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
      const result = SettingsSchema.safeParse(parsed);
      
      if (result.success) {
        this.settings = result.data;
        await this.save();
      } else {
        throw new Error(`设置验证失败: ${result.error.message}`);
      }
    } catch (error) {
      console.error("导入设置失败:", error);
      throw error;
    }
  }
}