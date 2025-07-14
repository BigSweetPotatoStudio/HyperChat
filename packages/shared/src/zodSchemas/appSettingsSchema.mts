import { z } from "zod";

// 已知提供商类型
export const KnownProviderSchema = z.enum([
  "openai",
  "anthropic",
  "gemini",
  "302",
  "openrouter",
  "qwen",
  "deepseek",
  "doubao",
  "xai",
  "glm",
  "ollama",
  "unknown", // 用于未知或不支持的提供商，需要自己填baseURL和apiKey
]).describe("Supported AI model providers");

// 提供商配置 Schema
export const ProviderConfigSchema = z.object({
  key: KnownProviderSchema.describe("Provider unique identifier"),
  label: z.string().describe("Display name"),
  baseURL: z.string().url().describe("API base URL"),
  icon: z.string().optional().describe("Icon"),
  description: z.string().optional().describe("Description"),
  hasApiKey: z.boolean().default(true).describe("Requires API Key"),
  apiKey: z.string().optional().describe("API Key"),
  isBuiltIn: z.boolean().default(false).describe("Built-in provider"),
}).describe("AI model provider configuration");

// AI模型配置项 Schema
export const AIModelConfigItemSchema = z.object({
  key: z.string().describe("Model unique identifier"),
  name: z.string().describe("Model name"),
  model: z.string().describe("Model identifier"),
  provider: KnownProviderSchema.describe("Provider"),
  supportImage: z.boolean().default(true).describe("Supports image"),
  supportTool: z.boolean().default(true).describe("Supports tool calling"),
  call_tool_step: z.number().optional().describe("Tool calling steps"),
  type: z.enum(["llm", "embedding"]).default("llm").describe("Model type"),
  toolMode: z.enum(["standard", "compatible"]).default("standard").describe("Tool mode"),
  // 保留兼容性
  apiKey: z.string().default("").describe("API Key (deprecated, get from provider)"),
  baseURL: z.string().default("").describe("Base URL (deprecated, get from provider)"),
  fullName: z.string().optional().describe("Full name (provider:model name)"),
}).describe("AI model configuration item");

// AI配置 Schema
export const AIConfigSchema = z.object({
  models: z.array(AIModelConfigItemSchema).default([]).describe("AI model list"),
  customProviders: z.array(ProviderConfigSchema).default([]).describe("Custom provider list"),
  builtinApiKeys: z.record(z.object({
    apiKey: z.string().describe("API Key"),
    baseURL: z.string().describe("Base URL"),
  })).default({}).describe("Built-in provider API Key configuration"),
  defaultModel: z.string().optional().describe("Default model"),
}).describe("AI related configuration");

// 外观设置 Schema
export const AppearanceSchema = z.object({
  darkTheme: z.boolean().default(false).describe("Enable dark mode"),
  language: z.enum(["zh", "en", "ja", "ko", "fr", "de"]).default("en").describe("Interface language"),
});

// 桌面应用设置 Schema
export const DesktopSchema = z.object({
  closeAction: z.enum(["minimize", "exit"]).default("exit").describe("Window close action"),
  windowSize: z.object({
    width: z.number().min(800).max(4000).default(1440).describe("Window width"),
    height: z.number().min(600).max(3000).default(900).describe("Window height"),
  }).default({}),
});


// MCP Gateway 配置 Schema
export const MCPGatewaySchema = z.object({
  name: z.string().describe("Gateway name"),
  description: z.string().optional().describe("Gateway description"),
  allowMCPs: z.array(z.string()).default([]).describe("Allowed MCP list"),
}).describe("MCP gateway configuration");

// 系统设置 Schema
export const SystemSchema = z.object({
  password: z.string().default("123456").describe("Application password"),
  isDeveloper: z.boolean().default(false).describe("Developer mode"),
});


// 完整的应用设置 Schema
export const AppSettingsSchema = z.object({
  // 系统信息（只读）
  version: z.string().default("").describe("Application version"),
  appDataDir: z.string().default("").describe("Application data directory"),
  logFilePath: z.string().default("").describe("Log file path"),
  PATH: z.string().default("").describe("System PATH"),
  platform: z.string().default("").describe("Operating system platform"),
  uuid: z.string().default("").describe("Application unique identifier"),

  // 用户可配置设置
  appearance: AppearanceSchema.default({}),
  system: SystemSchema.default({}),
  desktop: DesktopSchema.default({}),
  ai: AIConfigSchema.default({}),
  mcpGateWays: z.array(MCPGatewaySchema).default([]).describe("MCP gateway configuration list"),

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

