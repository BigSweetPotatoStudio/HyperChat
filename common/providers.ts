import { Data } from './data';
import { v4 } from 'uuid';

// 提供商配置接口
export interface ProviderConfig {
  key: string;
  label: string;
  baseURL: string;
  value: string;
  icon?: string;
  description?: string;
  hasApiKey?: boolean;
  isCustom: boolean;
  isBuiltIn: boolean;
}

// 默认内置提供商
export const BUILTIN_PROVIDERS: ProviderConfig[] = [
  {
    key: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    value: 'openai',
    description: 'GPT-4, GPT-3.5 等模型',
    icon: 'openai',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'anthropic',
    label: 'Anthropic',
    baseURL: 'https://api.anthropic.com/v1',
    value: 'anthropic-openai',
    description: 'Claude 系列模型',
    icon: 'anthropic',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'openrouter',
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    value: 'openrouter',
    description: '多模型聚合平台',
    icon: 'openrouter',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'gemini',
    label: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
    value: 'gemini-openai',
    description: 'Gemini Pro, Gemini Flash',
    icon: 'gemini',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'qwen',
    label: 'Qwen',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    value: 'qwen',
    description: '通义千问系列模型',
    icon: 'qwen',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com',
    value: 'deepseek',
    description: 'DeepSeek 推理模型',
    icon: 'deepseek',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'doubao',
    label: 'DoubBao',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    value: 'doubao',
    description: '豆包大模型',
    icon: 'doubao',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'xai',
    label: 'XAI',
    baseURL: 'https://api.x.ai/v1',
    value: 'xai',
    description: 'Grok 系列模型',
    icon: 'xai',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'glm',
    label: 'GLM',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    value: 'glm',
    description: '智谱 GLM 系列模型',
    icon: 'glm',
    isBuiltIn: true,
    isCustom: false,
  },
  {
    key: 'ollama',
    label: 'Ollama',
    baseURL: 'http://127.0.0.1:11434/v1',
    value: 'ollama',
    description: '本地部署的开源模型',
    icon: 'ollama',
    isBuiltIn: true,
    isCustom: false,
  },
];

// 提供商管理数据存储
export const PROVIDER_CONFIGS = new Data('provider_configs.json', {
  customProviders: [] as Array<ProviderConfig>,
  disabledBuiltinProviders: [] as string[], // 存储被禁用的内置提供商key
});

// 提供商管理工具类
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
  static addCustomProvider(provider: Omit<ProviderConfig, 'key' | 'isBuiltIn' | 'isCustom'>): ProviderConfig {
    const newProvider: ProviderConfig = {
      ...provider,
      key: v4(),
      isBuiltIn: false,
      isCustom: true,
    };

    const data = PROVIDER_CONFIGS.get();
    data.customProviders.push(newProvider);
    PROVIDER_CONFIGS.set(data);
    
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
        isCustom: true,
      };
      PROVIDER_CONFIGS.set(data);
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
    
    PROVIDER_CONFIGS.set(data);
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
      value,
      description: description || '自定义兼容 OpenAI API 的服务',
      icon: 'custom',
    });
  }
}
