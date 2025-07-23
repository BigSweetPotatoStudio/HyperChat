/**
 * 环境变量类型和 Schema 定义
 * 注意：实际的环境变量解析逻辑在 core 包中的 envManager
 */

export { 
  EnvSchema,
  EnvTypeSchema, 
  LogLevelSchema,
  validateEnvConfig,
  DEFAULT_ENV_CONFIG
} from './zodSchemas/envSchema.mjs';

export type {
  EnvConfig,
  EnvType,
  LogLevel
} from './zodSchemas/envSchema.mjs';