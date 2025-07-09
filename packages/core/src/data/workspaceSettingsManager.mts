import * as fs from "fs";
import * as path from "path";
import * as jsonc from "jsonc-parser";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  WorkspaceSettingsSchema,
  WorkspaceSettings,
  WorkspaceAppearanceSettings,
  WorkspaceEditorSettings,
  WorkspaceAISettings,
  WorkspaceAdvancedSettings,
  DEFAULT_WORKSPACE_SETTINGS,
} from "../shared/jsonSchemas/workspaceSettingsSchema.mjs";

// 重新导出 schema 和类型，保持向后兼容
export {
  WorkspaceSettingsSchema,
  DEFAULT_WORKSPACE_SETTINGS,
} from "../shared/jsonSchemas/workspaceSettingsSchema.mjs";

/**
 * 工作区设置管理器类
 */
export class WorkspaceSettingsManager {
  private settings: WorkspaceSettings;
  private settingsPath: string;
  private schemaPath: string;

  constructor(private workspacePath: string) {
    this.settingsPath = path.join(workspacePath, "settings.jsonc");
    this.schemaPath = path.join(workspacePath, "settings.schema.json");
    this.settings = DEFAULT_WORKSPACE_SETTINGS;
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
    const jsonSchema = zodToJsonSchema(WorkspaceSettingsSchema, {
      name: "HyperChatWorkspaceSettings",
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
        const result = WorkspaceSettingsSchema.safeParse(parsed);
        
        if (result.success) {
          this.settings = result.data;
        } else {
          console.warn("工作区设置文件验证失败，使用默认设置:", result.error);
          // 保存默认设置
          await this.save();
        }
      } else {
        // 文件不存在，创建默认设置
        await this.save();
      }
    } catch (error) {
      console.error("加载工作区设置文件失败:", error);
      // 使用默认设置
      this.settings = DEFAULT_WORKSPACE_SETTINGS;
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
      console.error("保存工作区设置文件失败:", error);
      throw error;
    }
  }

  /**
   * 获取所有设置
   */
  getSettings(): WorkspaceSettings {
    return { ...this.settings };
  }

  /**
   * 更新设置
   */
  async updateSettings(updates: Partial<WorkspaceSettings>): Promise<void> {
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
    const result = WorkspaceSettingsSchema.safeParse(this.settings);
    if (!result.success) {
      throw new Error(`工作区设置验证失败: ${result.error.message}`);
    }

    await this.save();
  }

  /**
   * 获取外观设置
   */
  getAppearance(): WorkspaceAppearanceSettings {
    return { ...this.settings.appearance };
  }

  /**
   * 更新外观设置
   */
  async updateAppearance(updates: Partial<WorkspaceAppearanceSettings>): Promise<void> {
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
  getEditor(): WorkspaceEditorSettings {
    return { ...this.settings.editor };
  }

  /**
   * 更新编辑器设置
   */
  async updateEditor(updates: Partial<WorkspaceEditorSettings>): Promise<void> {
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
  getAI(): WorkspaceAISettings {
    return { ...this.settings.ai };
  }

  /**
   * 更新 AI 设置
   */
  async updateAI(updates: Partial<WorkspaceAISettings>): Promise<void> {
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
  getAdvanced(): WorkspaceAdvancedSettings {
    return { ...this.settings.advanced };
  }

  /**
   * 更新高级设置
   */
  async updateAdvanced(updates: Partial<WorkspaceAdvancedSettings>): Promise<void> {
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
    this.settings = DEFAULT_WORKSPACE_SETTINGS;
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
      const result = WorkspaceSettingsSchema.safeParse(parsed);
      
      if (result.success) {
        this.settings = result.data;
        await this.save();
      } else {
        throw new Error(`工作区设置验证失败: ${result.error.message}`);
      }
    } catch (error) {
      console.error("导入工作区设置失败:", error);
      throw error;
    }
  }

  /**
   * 获取工作区路径
   */
  getWorkspacePath(): string {
    return this.workspacePath;
  }

  /**
   * 获取设置文件路径
   */
  getSettingsPath(): string {
    return this.settingsPath;
  }

  /**
   * 获取 Schema 文件路径
   */
  getSchemaPath(): string {
    return this.schemaPath;
  }
}