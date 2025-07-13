import { z } from "zod";
import { BaseAIConfigSchema } from "./agentConfigSchema.mjs";

// 外观设置 Schema
export const WorkspaceAppearanceSchema = z.object({
  isDarkMode: z.boolean().default(false).describe("Enable dark mode"),
  theme: z.enum(["light", "dark", "auto"]).default("auto").describe("Theme mode"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium").describe("Font size"),
  language: z.enum(["zh-CN", "en-US"]).default("zh-CN").describe("Interface language"),
});

// 编辑器设置 Schema
export const WorkspaceEditorSchema = z.object({
  autoSave: z.boolean().default(true).describe("Enable auto save"),
  autoSaveDelay: z.number().min(1000).max(60000).default(5000).describe("Auto save delay (milliseconds)"),
  wordWrap: z.boolean().default(true).describe("Enable word wrap"),
  tabSize: z.number().min(2).max(8).default(2).describe("Tab size"),
});

// 工作区默认 AI 设置 Schema - 与 BaseAIConfigSchema 平级
export const WorkspaceDefaultAISchema = z.object({
  defaultAgent: z.string().optional().describe("Default Agent"),
  streamResponse: z.boolean().default(true).describe("Enable streaming response"),
});

// 高级设置 Schema
export const WorkspaceAdvancedSchema = z.object({
  enableTelemetry: z.boolean().default(false).describe("Enable telemetry"),
  debugMode: z.boolean().default(false).describe("Enable debug mode"),
  experimentalFeatures: z.boolean().default(false).describe("Enable experimental features"),
});

// 工作区元数据 Schema
export const WorkspaceMetadataSchema = z.object({
  name: z.string().describe("Workspace name"),
  description: z.string().optional().describe("Workspace description"),
  created: z.number().describe("Creation timestamp"),
});

// 完整的工作区设置 Schema
export const WorkspaceSettingsSchema = z.object({
  workspace: WorkspaceMetadataSchema.optional().describe("Workspace metadata"),
  appearance: WorkspaceAppearanceSchema.default({}),
  editor: WorkspaceEditorSchema.default({}),
  aiConfig: BaseAIConfigSchema.partial().optional().describe("Base AI configuration"),
  defaultAI: WorkspaceDefaultAISchema.default({}),
  advanced: WorkspaceAdvancedSchema.default({}),
});

// 导出类型
export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;
export type WorkspaceMetadata = z.infer<typeof WorkspaceMetadataSchema>;
export type WorkspaceAppearanceSettings = z.infer<typeof WorkspaceAppearanceSchema>;
export type WorkspaceEditorSettings = z.infer<typeof WorkspaceEditorSchema>;
export type WorkspaceDefaultAISettings = z.infer<typeof WorkspaceDefaultAISchema>;
export type WorkspaceAdvancedSettings = z.infer<typeof WorkspaceAdvancedSchema>;

// 默认设置
export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = (() => {
  const result = WorkspaceSettingsSchema.safeParse({});
  if (result.success) {
    return result.data;
  }
  // 如果解析失败，返回基础默认值
  throw new Error("Failed to generate default app settings from schema");
})(); 

// 验证函数
export function validateWorkspaceSettings(data: any): data is WorkspaceSettings {
  return WorkspaceSettingsSchema.safeParse(data).success;
}

export function validateWorkspaceAppearanceSettings(data: any): data is WorkspaceAppearanceSettings {
  return WorkspaceAppearanceSchema.safeParse(data).success;
}

export function validateWorkspaceEditorSettings(data: any): data is WorkspaceEditorSettings {
  return WorkspaceEditorSchema.safeParse(data).success;
}

export function validateWorkspaceDefaultAISettings(data: any): data is WorkspaceDefaultAISettings {
  return WorkspaceDefaultAISchema.safeParse(data).success;
}

export function validateWorkspaceAdvancedSettings(data: any): data is WorkspaceAdvancedSettings {
  return WorkspaceAdvancedSchema.safeParse(data).success;
}