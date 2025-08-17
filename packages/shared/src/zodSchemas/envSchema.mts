import { z } from "zod";

// 环境类型枚举
export const EnvTypeSchema = z.enum([
  "development",
  "production",
]).describe("Application environment type");

// 日志级别枚举
export const LogLevelSchema = z.enum([
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal"
]).describe("Log level");

// 运行环境类型枚举
export const RuntimeEnvSchema = z.enum([
  "nodejs",
  "electron"
]).describe("Application runtime environment");

// 语言类型枚举
export const InterfaceLanguageSchema = z.enum([
  "zh",
  "en", 
  "ja",
  "ko",
  "fr",
  "de"
]).describe("Interface language");

// 环境变量 Schema
export const EnvSchema = z.object({
  // 基础环境配置
  NODE_ENV: EnvTypeSchema.default("production"),
  HyperChat_MY_ENV: z.string().default("prod").describe("Custom environment flag"),

  // 路径配置
  HyperChat_AppDataDir: z.string().optional().describe("Global application data directory path"),

  // 服务配置
  HyperChat_HTTP_PORT: z.coerce.number().min(1000).max(65535).default(16100).describe("HTTP server port"),
  HyperChat_Web_Password: z.string().default("123456").describe("Web interface access password"),
  
  // 界面配置
  HyperChat_Language: InterfaceLanguageSchema.optional().describe("Interface language"),

  // API Keys (可选，通过工作区配置管理)
  HyperChat_API_KEY: z.string().optional().describe("HyperChat API key"),
  HyperChat_API_URL: z.string().optional().describe("HyperChat API URL"),
  HyperChat_AI_Provider: z.string().optional().describe("HyperChat AI Provider"),
  HyperChat_AI_Model: z.string().optional().describe("HyperChat AI Model"),

  // 开发配置
  LOG_LEVEL: LogLevelSchema.default("info").describe("Application log level"),

}).describe("Environment variables configuration");

// 导出类型
export type EnvConfig = z.infer<typeof EnvSchema>;
export type EnvType = z.infer<typeof EnvTypeSchema>;
export type LogLevel = z.infer<typeof LogLevelSchema>;
export type RuntimeEnv = z.infer<typeof RuntimeEnvSchema>;
export type InterfaceLanguage = z.infer<typeof InterfaceLanguageSchema>;

// 验证函数
export function validateEnvConfig(data: unknown): data is EnvConfig {
  return EnvSchema.safeParse(data).success;
}

// 获取默认环境配置
export const DEFAULT_ENV_CONFIG: EnvConfig = (() => {
  const result = EnvSchema.safeParse({});
  if (result.success) {
    return result.data;
  }
  throw new Error("Failed to generate default env config from schema");
})();