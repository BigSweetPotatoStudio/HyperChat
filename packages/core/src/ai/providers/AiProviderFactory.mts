import type { LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { CustomFetch, AIProvider } from "@dadigua/hyperchat-shared";
import type { BaseAIConfig } from "@dadigua/hyperchat-shared";

export interface ModelConfig {
  key: string;
  provider: string;
  model: string;
  baseURL?: string;
  apiKey?: string;
}

/**
 * AI 提供商工厂类
 * 负责创建和管理不同AI提供商的实例
 */
export class AiProviderFactory {
  /**
   * 创建AI模型实例
   */
  static async createModel(modelConfig: ModelConfig, customFetch?: CustomFetch): Promise<LanguageModel> {
    const providerCreators: Record<string, () => any> = {
      anthropic: () => createAnthropic({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch: customFetch
      }),
      gemini: () => createGoogleGenerativeAI({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch: customFetch
      }),
      openrouter: () => createOpenRouter({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        fetch: customFetch
      }),
      openai: () => createOpenAI({
        baseURL: modelConfig.baseURL,
        apiKey: modelConfig.apiKey,
        compatibility: "strict",
        fetch: customFetch
      }),
      unknown: () => createOpenAICompatible({
        name: modelConfig.provider,
        baseURL: modelConfig.baseURL || '',
        apiKey: modelConfig.apiKey || '',
        fetch: customFetch
      })
    };

    const createProvider = providerCreators[modelConfig.provider] || providerCreators.unknown;
    const aiProvider = createProvider();
    
    return aiProvider(modelConfig.model);
  }

  /**
   * 验证模型配置
   */
  static validateModelConfig(modelConfig: ModelConfig): void {
    if (!modelConfig.key) {
      throw new Error('Model key is required');
    }
    if (!modelConfig.model) {
      throw new Error('Model name is required');
    }
    if (!modelConfig.apiKey) {
      throw new Error('API key is required');
    }
  }

}