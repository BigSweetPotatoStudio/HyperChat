import { Data } from "../base/data.mjs";
import { ProviderManager } from "../../shared/providers.mjs";
import type { AIModelConfigItem, KnownProvider, ProviderConfig } from "../../shared/types.mjs";

export class AIModelConfig<T = { data: Array<AIModelConfigItem> }> extends Data<T> {
  providerConfigs!: typeof PROVIDER_CONFIGS;
  override async init(): Promise<T> {
    let res: { data: Array<AIModelConfigItem> } = await this._init() as { data: Array<AIModelConfigItem> };
    let providerConfigs = await PROVIDER_CONFIGS.init();
    this.providerConfigs = providerConfigs as any;
    for (let item of res.data) {
      if (item.provider === "gemini-openai") {
        item.provider = "gemini"; // 兼容旧数据
      }
      if (item.provider === "anthropic-openai") {
        item.provider = "anthropic"; // 兼容旧数据
      }
      let provider = providerConfigs.builtinApiKeys[item.provider as KnownProvider] || providerConfigs.customProviders.find(p => p.key === item.provider);
      item.apiKey = provider?.apiKey || '';
      item.baseURL = provider?.baseURL || '';
      item.fullName = `${item.provider}:${item.name}`;
      // 确保 supportImage 和 supportTool 字段有默认值
      if (item.supportImage === undefined || item.supportImage === null) {
        item.supportImage = true;
      }
      if (item.supportTool === undefined || item.supportTool === null) {
        item.supportTool = true;
      }
    }
    return res as T;
  }
  getGroupedByProvider(): { label: string, value: string, options: Array<{ label: string, value: string }> }[] {
    // let providerConfigs = await PROVIDER_CONFIGS.init();
    const modelData = (this.get() as { data: Array<AIModelConfigItem> }).data.filter(
      (x) => x.type == "llm" || x.type == null,
    );
    const providers = ProviderManager.getAllProviders();

    return providers.map((provider) => {
      // 找到该供应商下的所有模型
      const providerModels = modelData.filter(model => model.provider === provider.key);

      return {
        label: provider.label,
        value: provider.key,
        options: providerModels.map(model => ({
          label: `${provider.key}:${model.name}`,
          value: model.key,
        })),
      };
    }).filter(group => group.options.length > 0); // 只返回有模型的供应商

  }
}

export const AI_MODELS = new AIModelConfig("ai_models.json", { // ai_models.json
  data: [] as Array<AIModelConfigItem>,
});

// 提供商管理数据存储，包含自定义、API Key 等
export const PROVIDER_CONFIGS = new Data('provider_configs.json', {
  customProviders: [] as Array<ProviderConfig>,
  builtinApiKeys: {} as { [key: string]: { apiKey: string; baseURL: string } }, // 新增属性
});