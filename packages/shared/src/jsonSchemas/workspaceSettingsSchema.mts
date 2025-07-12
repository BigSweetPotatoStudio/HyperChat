import { z } from "zod";

// 外观设置 Schema
export const WorkspaceAppearanceSchema = z.object({
  isDarkMode: z.boolean().default(false).describe("是否启用夜间模式"),
  theme: z.enum(["light", "dark", "auto"]).default("auto").describe("主题模式"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium").describe("字体大小"),
  language: z.enum(["zh-CN", "en-US"]).default("zh-CN").describe("界面语言"),
});

// 编辑器设置 Schema
export const WorkspaceEditorSchema = z.object({
  autoSave: z.boolean().default(true).describe("是否自动保存"),
  autoSaveDelay: z.number().min(1000).max(60000).default(5000).describe("自动保存延迟（毫秒）"),
  wordWrap: z.boolean().default(true).describe("是否自动换行"),
  tabSize: z.number().min(2).max(8).default(2).describe("Tab 大小"),
});

// AI 设置 Schema
export const WorkspaceAISchema = z.object({
  defaultModel: z.string().optional().describe("默认 AI 模型"),
  defaultAgent: z.string().optional().describe("默认 Agent"),
  temperature: z.number().min(0).max(2).default(0.7).describe("温度参数"),
  maxTokens: z.number().min(100).max(32000).default(4000).describe("最大 Token 数"),
  streamResponse: z.boolean().default(true).describe("是否流式响应"),
});

// 高级设置 Schema
export const WorkspaceAdvancedSchema = z.object({
  enableTelemetry: z.boolean().default(false).describe("是否启用遥测"),
  debugMode: z.boolean().default(false).describe("是否启用调试模式"),
  experimentalFeatures: z.boolean().default(false).describe("是否启用实验性功能"),
});

// 工作区元数据 Schema
export const WorkspaceMetadataSchema = z.object({
  name: z.string().describe("工作区名称"),
  description: z.string().optional().describe("工作区描述"),
  created: z.number().describe("创建时间戳"),
  lastAccessed: z.number().describe("最后访问时间戳"),
});

// 完整的工作区设置 Schema
export const WorkspaceSettingsSchema = z.object({
  workspace: WorkspaceMetadataSchema.optional().describe("工作区元数据"),
  appearance: WorkspaceAppearanceSchema.default({}),
  editor: WorkspaceEditorSchema.default({}),
  ai: WorkspaceAISchema.default({}),
  advanced: WorkspaceAdvancedSchema.default({}),
});

// 导出类型
export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;
export type WorkspaceMetadata = z.infer<typeof WorkspaceMetadataSchema>;
export type WorkspaceAppearanceSettings = z.infer<typeof WorkspaceAppearanceSchema>;
export type WorkspaceEditorSettings = z.infer<typeof WorkspaceEditorSchema>;
export type WorkspaceAISettings = z.infer<typeof WorkspaceAISchema>;
export type WorkspaceAdvancedSettings = z.infer<typeof WorkspaceAdvancedSchema>;

// 默认设置
export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
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

export function validateWorkspaceAISettings(data: any): data is WorkspaceAISettings {
  return WorkspaceAISchema.safeParse(data).success;
}

export function validateWorkspaceAdvancedSettings(data: any): data is WorkspaceAdvancedSettings {
  return WorkspaceAdvancedSchema.safeParse(data).success;
}