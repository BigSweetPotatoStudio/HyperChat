import { z } from "zod";

export const NAME = "hyper_system";

// 公共的 reason 字段定义，所有工具必须使用
export const reasonField = z.string()
  .min(10, "Reason must be at least 10 characters")
  .max(200, "Reason must not exceed 200 characters")
  .describe('REQUIRED: Explain why you need to use this tool and what you plan to accomplish. This is for transparency and audit purposes.');

// 配置 Schema
export const configSchema = z.object({
  // 文件操作配置
  maxFileSize: z.number().default(10 * 1024 * 1024), // 10MB
  maxOutputLines: z.number().default(10000), // 最大输出行数
  maxBatchFiles: z.number().default(50), // 批量操作最大文件数
  
  // 安全配置
  allowedExtensions: z.array(z.string()).default([]), // 允许的文件扩展名，空数组表示不限制
  blockedExtensions: z.array(z.string()).default(['.exe', '.bat', '.sh', '.ps1']), // 禁止的文件扩展名
  allowedCommands: z.array(z.string()).default([]), // 允许的命令列表，空数组表示不限制
  blockedCommands: z.array(z.string()).default(['rm', 'del', 'format', 'shutdown']), // 禁止的命令列表
  
  // 超时配置
  commandTimeout: z.number().default(30000), // 命令执行超时时间 (ms)
  fileOperationTimeout: z.number().default(10000), // 文件操作超时时间 (ms)
});

export type HyperSystemConfig = z.infer<typeof configSchema>;

// 默认配置
export const defaultConfig: HyperSystemConfig = {
  maxFileSize: 10 * 1024 * 1024,
  maxOutputLines: 10000,
  maxBatchFiles: 50,
  allowedExtensions: [],
  blockedExtensions: ['.exe', '.bat', '.sh', '.ps1'],
  allowedCommands: [],
  blockedCommands: ['rm', 'del', 'format', 'shutdown'],
  commandTimeout: 30000,
  fileOperationTimeout: 10000,
};

// 获取配置的函数
export function getConfig(): HyperSystemConfig {
  // TODO: 从工作区配置中读取，现在先返回默认配置
  return defaultConfig;
}

// 工具错误类型
export class HyperSystemToolError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FileToolError';
  }
}

// 常见错误代码
export const ERROR_CODES = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_PATH: 'INVALID_PATH',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
  COMMAND_BLOCKED: 'COMMAND_BLOCKED',
  EXTENSION_BLOCKED: 'EXTENSION_BLOCKED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  FILE_READ_ERROR: 'FILE_READ_ERROR',
} as const;

// 公共的 schema 构建函数
export function createToolSchema<T extends z.ZodRawShape>(additionalFields: T) {
  return z.object({
    reason: reasonField,
    ...additionalFields,
  });
}