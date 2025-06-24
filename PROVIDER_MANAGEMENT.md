# 提供商管理功能说明

## 功能概述

我们为 HyperChat 项目添加了完整的提供商管理功能，包括：

1. **提供商数据管理** (`common/providers.ts`)
2. **动态添加/删除提供商**
3. **支持 OpenAI Compatibility 类型**
4. **内置提供商的启用/禁用**

## 新增文件

### `common/providers.ts`
- `ProviderConfig` 接口：定义提供商配置结构
- `BUILTIN_PROVIDERS` 常量：内置提供商列表
- `PROVIDER_CONFIGS` 数据存储：自定义提供商和禁用的内置提供商
- `ProviderManager` 类：提供商管理工具类

## 更新的功能

### ProviderSettings.tsx
- 添加了"添加提供商"按钮
- 提供商卡片上添加了编辑和删除选项
- 新的提供商添加/编辑模态框
- 支持删除自定义提供商
- 支持禁用/启用内置提供商

## 主要功能

### 1. 添加自定义提供商
- 点击"添加提供商"按钮
- 填写提供商名称、Base URL 和描述
- 自动创建 OpenAI Compatibility 类型的提供商

### 2. 编辑自定义提供商
- 只有自定义提供商可以编辑
- 点击提供商卡片右上角的编辑按钮
- 修改名称、Base URL 和描述

### 3. 删除/禁用提供商
- **自定义提供商**：完全删除，包括其下的所有模型
- **内置提供商**：禁用显示，可以重新启用

### 4. 提供商状态显示
- 绿色"Active"标签：已配置 API Key
- 橙色"Custom"标签：自定义提供商
- 模型数量显示

## 数据结构

### ProviderConfig
```typescript
interface ProviderConfig {
  key: string;           // 唯一标识
  label: string;         // 显示名称
  baseURL: string;       // API 基础 URL
  value: string;         // 提供商类型
  icon?: string;         // 图标类型
  description?: string;  // 描述
  hasApiKey?: boolean;   // 是否有 API Key
  isCustom: boolean;     // 是否为自定义
  isBuiltIn: boolean;    // 是否为内置
}
```

### 存储文件
- `provider_configs.json`: 存储自定义提供商和禁用的内置提供商
- `gpt_models.json`: 存储模型配置（与提供商关联）

## 使用方法

1. **添加 OpenAI Compatibility 提供商**：
   - 点击"添加提供商"
   - 输入名称（如"My Custom API"）
   - 输入 Base URL（如"https://api.example.com/v1"）
   - 点击添加

2. **配置 API Key**：
   - 点击提供商卡片
   - 如果没有 API Key，会弹出配置窗口
   - 输入 API Key 和其他设置

3. **管理模型**：
   - 配置 API Key 后，再次点击提供商卡片
   - 进入模型管理界面
   - 添加、编辑或删除模型

4. **删除提供商**：
   - 点击提供商卡片右上角的删除按钮
   - 确认删除（会同时删除所有关联模型）

## 技术实现

- 使用 `Data` 类进行数据持久化
- 提供商管理器模式，集中管理所有操作
- 响应式 UI 更新
- 错误处理和用户反馈
