# 工作区设置功能使用示例

## 功能概述

HyperChat 现在支持工作区级别的设置文件，使用 JSONC（带注释的 JSON）格式存储，并通过 Zod schema 进行验证。

## 设置文件位置

设置文件存储在每个工作区的 `.hyperchat/settings.jsonc` 路径下。

## 设置结构

设置包含以下几个主要部分：

### 1. 外观设置 (appearance)
- `isDarkMode`: 是否启用夜间模式
- `theme`: 主题模式 (light/dark/auto)
- `fontSize`: 字体大小 (small/medium/large)
- `language`: 界面语言 (zh-CN/en-US)

### 2. 编辑器设置 (editor)
- `autoSave`: 是否自动保存
- `autoSaveDelay`: 自动保存延迟（毫秒）
- `wordWrap`: 是否自动换行
- `tabSize`: Tab 大小

### 3. AI 设置 (ai)
- `defaultModel`: 默认 AI 模型
- `defaultAgent`: 默认 Agent
- `temperature`: 温度参数
- `maxTokens`: 最大 Token 数
- `streamResponse`: 是否流式响应

### 4. 高级设置 (advanced)
- `enableTelemetry`: 是否启用遥测
- `debugMode`: 是否启用调试模式
- `experimentalFeatures`: 是否启用实验性功能

## 前端使用示例

```typescript
// 获取工作区设置
const settings = await call('getWorkspaceSettings', { workspacePath: '/path/to/workspace' });

// 更新外观设置
await call('updateWorkspaceSettings', {
  workspacePath: '/path/to/workspace',
  updates: {
    appearance: {
      isDarkMode: true,
      theme: 'dark'
    }
  }
});

// 重置设置为默认值
await call('resetWorkspaceSettings', { workspacePath: '/path/to/workspace' });

// 导出设置
const settingsJson = await call('exportWorkspaceSettings', { workspacePath: '/path/to/workspace' });

// 导入设置
await call('importWorkspaceSettings', {
  workspacePath: '/path/to/workspace',
  settingsJson: settingsJson
});
```

## 设置文件示例

```jsonc
{
  "$schema": "./settings.schema.json",
  "appearance": {
    "isDarkMode": true,
    "theme": "dark",
    "fontSize": "medium",
    "language": "zh-CN"
  },
  "editor": {
    "autoSave": true,
    "autoSaveDelay": 5000,
    "wordWrap": true,
    "tabSize": 2
  },
  "ai": {
    "defaultModel": "gpt-4",
    "defaultAgent": "default",
    "temperature": 0.7,
    "maxTokens": 4000,
    "streamResponse": true
  },
  "advanced": {
    "enableTelemetry": false,
    "debugMode": false,
    "experimentalFeatures": false
  }
}
```

## 特性

1. **JSON Schema 支持**: 自动生成 `settings.schema.json` 文件，支持编辑器智能提示
2. **JSONC 格式**: 支持在设置文件中添加注释
3. **类型安全**: 使用 Zod 进行运行时验证，确保设置的类型安全
4. **默认值**: 所有设置都有合理的默认值
5. **分组管理**: 设置按功能分组，便于管理和扩展