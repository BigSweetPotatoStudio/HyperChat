import { PROVIDER_CONFIGS, ProviderConfig } from './data.mjs';
import { v4 } from 'uuid';





// 默认内置提供商列表，支持 OpenAI、Claude、Gemini、Qwen、Deepseek 等主流大模型
export const BUILTIN_PROVIDERS: ProviderConfig[] = [
    {
        key: 'openai',
        label: 'OpenAI',
        baseURL: 'https://api.openai.com/v1',
        // key: 'openai',
        description: 'GPT-4, GPT-3.5 等模型',
        icon: 'openai',
        isBuiltIn: true,
    },
    {
        key: 'anthropic',
        label: 'Anthropic',
        baseURL: 'https://api.anthropic.com/v1',
        // key: 'anthropic-openai',
        description: 'Claude 系列模型',
        icon: 'anthropic',
        isBuiltIn: true,
    },
    {
        key: 'openrouter',
        label: 'OpenRouter',
        baseURL: 'https://openrouter.ai/api/v1',
        // key: 'openrouter',
        description: '多模型聚合平台',
        icon: 'openrouter',
        isBuiltIn: true,
    },
    {
        key: 'gemini',
        label: 'Google Gemini',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        // value: 'gemini-openai',
        description: 'Gemini Pro, Gemini Flash',
        icon: 'gemini',
        isBuiltIn: true,
    },
    {
        key: 'qwen',
        label: 'Qwen',
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        // key: 'qwen',
        description: '通义千问系列模型',
        icon: 'qwen',
        isBuiltIn: true,
    },
    {
        key: 'deepseek',
        label: 'DeepSeek',
        baseURL: 'https://api.deepseek.com',
        // key: 'deepseek',
        description: 'DeepSeek 推理模型',
        icon: 'deepseek',
        isBuiltIn: true,
    },
    {
        key: 'doubao',
        label: 'DoubBao',
        baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
        // key: 'doubao',
        description: '豆包大模型',
        icon: 'doubao',
        isBuiltIn: true,
    },
    {
        key: 'xai',
        label: 'XAI',
        baseURL: 'https://api.x.ai/v1',
        // key: 'xai',
        description: 'Grok 系列模型',
        icon: 'xai',
        isBuiltIn: true,
    },
    {
        key: 'glm',
        label: 'GLM',
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        // key: 'glm',
        description: '智谱 GLM 系列模型',
        icon: 'glm',
        isBuiltIn: true,
    },
    {
        key: 'ollama',
        label: 'Ollama',
        baseURL: 'http://127.0.0.1:11434/v1',
        // key: 'ollama',
        description: '本地部署的开源模型',
        icon: 'ollama',
        isBuiltIn: true,
    },
];



// 提供商管理工具类，支持增删改查、启用禁用等
export class ProviderManager {
    // 获取所有可用的提供商（内置 + 自定义）
    static getAllProviders(): ProviderConfig[] {
        const { customProviders, disabledBuiltinProviders } = PROVIDER_CONFIGS.get();

        // 过滤掉被禁用的内置提供商
        const enabledBuiltinProviders = BUILTIN_PROVIDERS.filter(
            provider => !disabledBuiltinProviders.includes(provider.key)
        );

        return [...enabledBuiltinProviders, ...customProviders];
    }

    // 添加自定义提供商
    static addCustomProvider(provider: Omit<ProviderConfig, 'isBuiltIn'>): ProviderConfig {
        const newProvider: ProviderConfig = {
            ...provider,
            key: v4() as any,
            isBuiltIn: false,
        };

        const data = PROVIDER_CONFIGS.get();
        data.customProviders.push(newProvider);
        PROVIDER_CONFIGS.save();

        return newProvider;
    }

    // 删除自定义提供商
    static removeCustomProvider(key: string): boolean {
        const data = PROVIDER_CONFIGS.get();
        const index = data.customProviders.findIndex(p => p.key === key);

        if (index !== -1) {
            data.customProviders.splice(index, 1);
            PROVIDER_CONFIGS.save();
            return true;
        }

        return false;
    }

    // 更新自定义提供商
    static updateCustomProvider(key: string, updates: Partial<ProviderConfig>): boolean {
        const data = PROVIDER_CONFIGS.get();
        const index = data.customProviders.findIndex(p => p.key === key);

        if (index !== -1) {
            data.customProviders[index] = {
                ...data.customProviders[index],
                ...updates,
                key, // 确保key不被更改
                isBuiltIn: false,
            } as any;;
            PROVIDER_CONFIGS.save();
            return true;
        }

        return false;
    }

    // 禁用/启用内置提供商
    static toggleBuiltinProvider(key: string, disabled: boolean): boolean {
        const provider = BUILTIN_PROVIDERS.find(p => p.key === key);
        if (!provider) return false;

        const data = PROVIDER_CONFIGS.get();

        if (disabled) {
            if (!data.disabledBuiltinProviders.includes(key)) {
                data.disabledBuiltinProviders.push(key);
            }
        } else {
            const index = data.disabledBuiltinProviders.indexOf(key);
            if (index !== -1) {
                data.disabledBuiltinProviders.splice(index, 1);
            }
        }

        PROVIDER_CONFIGS.save();
        return true;
    }

    // 获取单个提供商
    static getProvider(key: string): ProviderConfig | null {
        const allProviders = this.getAllProviders();
        return allProviders.find(p => p.key === key) || null;
    }

    // 检查提供商是否存在
    static hasProvider(key: string): boolean {
        return this.getProvider(key) !== null;
    }

    // 创建 OpenAI Compatibility 类型的提供商
    static createOpenAICompatibilityProvider(
        label: string,
        value: string,
        baseURL: string,
        description?: string
    ): ProviderConfig {
        return this.addCustomProvider({
            label,
            baseURL,
            key: value as any,
            description: description || '自定义兼容 OpenAI API 的服务',
            icon: 'custom',
        });
    }

    // 更新指定 Provider 的 apiKey 和 baseURL（支持内置和自定义）
    static updateProviderApiKey(key: string, updates: { apiKey: string; baseURL: string }): boolean {
        // 先查找自定义
        const data = PROVIDER_CONFIGS.get();
        const customIndex = data.customProviders.findIndex(p => p.key === key);
        if (customIndex !== -1) {
            data.customProviders[customIndex] = {
                ...data.customProviders[customIndex],
                ...updates,
                hasApiKey: !!updates.apiKey,
            } as any;;
            PROVIDER_CONFIGS.save();
            return true;
        }
        // 再查找内置
        const builtinIndex = BUILTIN_PROVIDERS.findIndex(p => p.key === key);
        if (builtinIndex !== -1) {
            // 由于内置是常量数组，不能直接改，需在 disabledBuiltinProviders 里做标记，或扩展 PROVIDER_CONFIGS 存储
            // 这里简单做法：在 PROVIDER_CONFIGS 里维护一份 builtinApiKeys
            if (!data.builtinApiKeys) data.builtinApiKeys = {};
            data.builtinApiKeys[key] = {
                apiKey: updates.apiKey,
                baseURL: updates.baseURL,
            };
            PROVIDER_CONFIGS.save();
            return true;
        }
        return false;
    }

    // 获取提供商的 API Key 信息
    static getProviderApiKey(key: string): { apiKey: string; baseURL: string } | null {
        const data = PROVIDER_CONFIGS.get();

        // 先查找自定义提供商
        const customProvider = data.customProviders.find(p => p.key === key);
        if (customProvider && customProvider.hasApiKey) {
            return {
                apiKey: customProvider.apiKey || '',
                baseURL: customProvider.baseURL || '',
            };
        }

        // 查找内置提供商的 API Key
        if (data.builtinApiKeys && data.builtinApiKeys[key]) {
            return data.builtinApiKeys[key];
        }

        return null;
    }

    // 检查提供商是否有 API Key
    static hasProviderApiKey(key: string): boolean {
        const apiKeyInfo = this.getProviderApiKey(key);
        return !!(apiKeyInfo && apiKeyInfo.apiKey && apiKeyInfo.apiKey.trim() !== '');
    }
}
