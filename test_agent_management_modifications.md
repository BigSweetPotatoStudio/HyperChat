# AgentManagement.tsx 修改总结

## 已完成的修改

### 1. 导入修改
```typescript
// 移除
import { AI_MODELS } from "@hyperchat/shared/data.mjs";

// 替换为
import type { AISettings, AIModelConfigItem } from "@hyperchat/shared/jsonSchemas/appSettingsSchema.mts";
```

### 2. 添加状态管理
```typescript
// 新增 AI 设置状态
const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
```

### 3. 添加辅助函数
```typescript
// 获取模型的显示名称
const getModelDisplayName = (modelKey: string): string => {
  if (!aiSettings) return modelKey;
  const model = aiSettings.models.find(m => m.key === modelKey);
  return model ? (model.fullName || model.name || modelKey) : modelKey;
};
```

### 4. 修改初始化逻辑
```typescript
// 旧版本
useEffect(() => {
  AI_MODELS.init().then(() => {
    refresh();
  });
}, []);

// 新版本
useEffect(() => {
  // 从 AppSettings 获取 AI 配置
  call('getAppSettings').then(appSettings => {
    setAiSettings((appSettings as any).ai);
    refresh();
  }).catch(error => {
    console.error('Failed to load AI settings:', error);
  });
}, []);
```

### 5. 替换所有模型显示逻辑

#### 代理列表中的模型显示
```typescript
// 旧版本
<Tag color="green">{AI_MODELS.get().data.find(x => x.key === agent.config.modelKey)?.fullName || agent.config.modelKey}</Tag>

// 新版本
<Tag color="green">{getModelDisplayName(agent.config.modelKey)}</Tag>
```

#### 代理详情中的模型显示
```typescript
// 旧版本
{selectedAgent.config.modelKey
  ? AI_MODELS.get().data.find(x => x.key === selectedAgent.config.modelKey)?.fullName || selectedAgent.config.modelKey
  : "N/A"}

// 新版本
{selectedAgent.config.modelKey
  ? getModelDisplayName(selectedAgent.config.modelKey)
  : "N/A"}
```

#### 模型选择下拉框（两处）
```typescript
// 旧版本
options={AI_MODELS.get().data.map((x) => ({
  label: x.fullName || x.name,
  value: x.key,
}))}

// 新版本
options={aiSettings ? aiSettings.models.map((m) => ({
  label: m.fullName || m.name,
  value: m.key,
})) : []}
```

#### 聊天历史记录中的模型显示
```typescript
// 旧版本
<Tag color="green">{AI_MODELS.get().data.find(x => x.key === chatLog.modelKey)?.fullName || chatLog.modelKey}</Tag>

// 新版本
<Tag color="green">{getModelDisplayName(chatLog.modelKey)}</Tag>
```

## 修改位置汇总

1. **第40行**: 导入声明
2. **第84行**: 添加 aiSettings 状态
3. **第87-91行**: 添加 getModelDisplayName 函数
4. **第93-101行**: 修改初始化逻辑
5. **第377行**: 代理列表模型显示
6. **第442行**: 代理详情模型显示
7. **第591-594行**: 模型选择下拉框
8. **第641-644行**: TaskFallbackLLM 选择下拉框
9. **第719行**: 聊天历史模型显示

## 主要变化总结

1. **数据源切换**：从 AI_MODELS 单例切换到 AppSettings 的 AI 配置
2. **状态管理**：添加了 aiSettings 状态来管理 AI 配置
3. **初始化流程**：使用 `call('getAppSettings')` 来获取配置
4. **统一显示逻辑**：使用 `getModelDisplayName` 函数统一处理模型名称显示
5. **错误处理**：添加了对 aiSettings 为空的检查

## 预期功能

- 代理管理组件可以正确显示和使用新的 AI 配置系统中的模型
- 模型选择器显示所有可用的模型
- 模型名称显示优先使用 fullName，然后是 name，最后是 key
- 与其他使用 AppSettings 的组件保持一致

## 注意事项

- 使用 `(appSettings as any).ai` 来避免类型错误，因为 call 函数的返回类型定义可能不完整
- getModelDisplayName 函数提供了安全的降级逻辑，确保总是有名称显示
- 所有模型选择下拉框在 aiSettings 未加载时显示空数组，避免错误