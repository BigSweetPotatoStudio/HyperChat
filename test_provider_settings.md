# ProviderSettings 组件修改测试

## 修改内容总结

1. **数据源切换**: 从旧的 `AI_MODELS` 和 `PROVIDER_CONFIGS` 切换到新的应用设置系统
2. **API调用**: 使用 `call` 函数与后端的 `appSettingsManager` 交互
3. **类型安全**: 使用新的 TypeScript 类型定义
4. **数据结构**: 适配新的 AI 配置 schema

## 主要修改点

### 1. 导入修改
```typescript
// 旧版本
import { AI_MODELS, AIModelConfigItem, PROVIDER_CONFIGS, ProviderConfig } from '../../../core/src/shared/data.mjs';
import { ProviderManager } from '../../../core/src/shared/providers.mjs';

// 新版本
import { call } from '../common/call';
import type { AIModelConfigItem, ProviderConfig, KnownProvider, AISettings } from '../../../core/src/shared/jsonSchemas/appSettingsSchema.mts';
```

### 2. 状态管理修改
```typescript
// 添加了 aiSettings 状态
const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
```

### 3. 数据刷新逻辑
```typescript
// 旧版本
await AI_MODELS.init();
await PROVIDER_CONFIGS.init();
const allProviders = ProviderManager.getAllProviders();

// 新版本
const appSettings = await call('getAppSettings');
const ai = appSettings.ai;
setAiSettings(ai);
const builtinProviders = getBuiltinProviders();
const allProviders = [...builtinProviders, ...ai.customProviders];
```

### 4. API Key 检查逻辑
```typescript
// 旧版本
return ProviderManager.hasProviderApiKey(provider.key);

// 新版本
if (provider.isBuiltIn) {
  return !!aiSettings.builtinApiKeys[provider.key]?.apiKey;
} else {
  return !!provider.apiKey;
}
```

### 5. 数据保存逻辑
```typescript
// 旧版本
await AI_MODELS.save();
await PROVIDER_CONFIGS.save();

// 新版本
await call('updateAppSettings', {
  updates: {
    ai: {
      ...aiSettings,
      models: updatedModels
    }
  }
});
```

## 预期功能

1. **提供商管理**: 内置提供商 + 自定义提供商
2. **API Key 配置**: 内置提供商使用 `builtinApiKeys`，自定义提供商使用提供商配置
3. **模型管理**: 每个提供商可以添加多个模型
4. **数据持久化**: 通过应用设置管理器保存到文件

## 测试建议

1. 打开提供商设置页面，检查是否正确显示内置提供商
2. 为内置提供商配置 API Key
3. 添加自定义提供商
4. 为提供商添加模型
5. 设置默认模型
6. 检查数据是否正确保存到应用设置中