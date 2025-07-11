// 暂时简化的 providers 文件，避免循环引用
import type { ProviderConfig, KnownProvider } from './types.mts';

// 导出基本的提供商类型
export type { ProviderConfig, KnownProvider };

// 基本的提供商配置类型
export interface BaseProviderConfig {
  provider: KnownProvider;
  baseURL?: string;
  apiKey?: string;
  models?: string[];
}

// 导出一些常用的提供商名称
export const KNOWN_PROVIDERS = [
  'openai',
  'anthropic', 
  'google',
  'qwen',
  'deepseek',
  'unknown'
] as const;

// 基本的模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: KnownProvider;
  contextLength?: number;
}

// 具体的提供商实现将在 data.mts 中定义，避免循环引用