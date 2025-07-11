import { z } from "zod";

// 已知提供商类型
export const KnownProviderSchema = z.enum([
  "openai",
  "anthropic", 
  "openrouter",
  "gemini",
  "qwen",
  "deepseek",
  "doubao",
  "xai",
  "glm",
  "ollama",
  "unknown", // 用于未知或不支持的提供商，需要自己填baseURL和apiKey
]).describe("支持的AI模型提供商");

// 提供商配置 Schema
export const ProviderConfigSchema = z.object({
  key: KnownProviderSchema.describe("提供商唯一标识"),
  label: z.string().describe("显示名称"),
  baseURL: z.string().url().describe("API 基础地址"),
  icon: z.string().optional().describe("图标"),
  description: z.string().optional().describe("描述"),
  hasApiKey: z.boolean().default(true).describe("是否需要API Key"),
  apiKey: z.string().optional().describe("API Key"),
  isBuiltIn: z.boolean().default(false).describe("是否内置提供商"),
}).describe("AI模型提供商配置");

// AI模型配置项 Schema
export const AIModelConfigItemSchema = z.object({
  key: z.string().describe("模型唯一标识"),
  name: z.string().describe("模型名称"),
  model: z.string().describe("模型标识符"),
  provider: KnownProviderSchema.describe("提供商"),
  supportImage: z.boolean().default(true).describe("是否支持图像"),
  supportTool: z.boolean().default(true).describe("是否支持工具调用"),
  call_tool_step: z.number().optional().describe("工具调用步数"),
  type: z.enum(["llm", "embedding"]).default("llm").describe("模型类型"),
  toolMode: z.enum(["standard", "compatible"]).default("standard").describe("工具模式"),
  // 保留兼容性
  apiKey: z.string().default("").describe("API Key (废弃，从提供商获取)"),
  baseURL: z.string().default("").describe("基础URL (废弃，从提供商获取)"),
  fullName: z.string().optional().describe("完整名称 (提供商:模型名称)"),
}).describe("AI模型配置项");

// AI配置 Schema
export const AIConfigSchema = z.object({
  models: z.array(AIModelConfigItemSchema).default([]).describe("AI模型列表"),
  customProviders: z.array(ProviderConfigSchema).default([]).describe("自定义提供商列表"),
  builtinApiKeys: z.record(z.object({
    apiKey: z.string().describe("API Key"),
    baseURL: z.string().describe("基础URL"),
  })).default({}).describe("内置提供商的API Key配置"),
  defaultModel: z.string().optional().describe("默认模型"),
}).describe("AI相关配置");

// 外观设置 Schema
export const AppearanceSchema = z.object({
  darkTheme: z.boolean().default(false).describe("是否启用夜间模式"),
  language: z.enum(["zhCN", "enUS"]).default("zhCN").describe("界面语言"),
});

// 桌面应用设置 Schema
export const DesktopSchema = z.object({
  closeAction: z.enum(["minimize", "exit"]).default("exit").describe("关闭窗口行为"),
  windowSize: z.object({
    width: z.number().min(800).max(4000).default(1440).describe("窗口宽度"),
    height: z.number().min(600).max(3000).default(900).describe("窗口高度"),
  }).default({}),
});


// MCP Gateway 配置 Schema
export const MCPGatewaySchema = z.object({
  name: z.string().describe("网关名称"),
  description: z.string().optional().describe("网关描述"),
  allowMCPs: z.array(z.string()).default([]).describe("允许的MCP列表"),
}).describe("MCP网关配置");

// 系统设置 Schema
export const SystemSchema = z.object({
  password: z.string().default("123456").describe("应用密码"),
  isDeveloper: z.boolean().default(false).describe("是否为开发者模式"),
});


// 完整的应用设置 Schema
export const AppSettingsSchema = z.object({
  // 系统信息（只读）
  version: z.string().default("").describe("应用版本"),
  appDataDir: z.string().default("").describe("应用数据目录"),
  logFilePath: z.string().default("").describe("日志文件路径"),
  PATH: z.string().default("").describe("系统 PATH"),
  platform: z.string().default("").describe("操作系统平台"),
  uuid: z.string().default("").describe("应用唯一标识"),

  // 用户可配置设置
  appearance: AppearanceSchema.default({}),
  system: SystemSchema.default({}),
  desktop: DesktopSchema.default({}),
  ai: AIConfigSchema.default({}),
  mcpGateWays: z.array(MCPGatewaySchema).default([]).describe("MCP网关配置列表"),

});

// 导出类型
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type AppearanceSettings = z.infer<typeof AppearanceSchema>;
export type SystemSettings = z.infer<typeof SystemSchema>;
export type DesktopSettings = z.infer<typeof DesktopSchema>;
export type AISettings = z.infer<typeof AIConfigSchema>;
export type AIModelConfigItem = z.infer<typeof AIModelConfigItemSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type KnownProvider = z.infer<typeof KnownProviderSchema>;
export type MCPGateway = z.infer<typeof MCPGatewaySchema>;

// 默认设置（不包含 UUID 生成，因为前端不能使用 uuid 库）
export const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'uuid'> = (() => {
  const result = AppSettingsSchema.safeParse({});
  if (result.success) {
    const { uuid, ...rest } = result.data;
    return rest;
  }
  // 如果解析失败，返回基础默认值
  throw new Error("Failed to generate default app settings from schema");
})();

// 验证函数
export function validateAppSettings(data: any): data is AppSettings {
  return AppSettingsSchema.safeParse(data).success;
}

export function validateAppearanceSettings(data: any): data is AppearanceSettings {
  return AppearanceSchema.safeParse(data).success;
}


export function validateSystemSettings(data: any): data is SystemSettings {
  return SystemSchema.safeParse(data).success;
}

export function validateDesktopSettings(data: any): data is DesktopSettings {
  return DesktopSchema.safeParse(data).success;
}

export function validateAISettings(data: any): data is AISettings {
  return AIConfigSchema.safeParse(data).success;
}

export function validateAIModelConfigItem(data: any): data is AIModelConfigItem {
  return AIModelConfigItemSchema.safeParse(data).success;
}

export function validateProviderConfig(data: any): data is ProviderConfig {
  return ProviderConfigSchema.safeParse(data).success;
}

export function validateMCPGateway(data: any): data is MCPGateway {
  return MCPGatewaySchema.safeParse(data).success;
}

