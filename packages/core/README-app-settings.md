# HyperChat 应用设置系统

## 概述

HyperChat 现在具备了完整的双层设置系统：
- **应用设置**: 全局软件设置，影响整个应用
- **工作区设置**: 特定工作区的设置，仅影响该工作区

## 应用设置 (AppSettings)

### 设置分类

#### 1. 外观设置 (Appearance)
- `darkTheme`: 是否启用夜间模式
- `theme`: 主题模式 (light/dark/auto)
- `fontSize`: 字体大小 (small/medium/large)
- `language`: 界面语言 (zhCN/enUS)
- `closeAction`: 关闭窗口行为 (minimize/exit)

#### 2. 网络设置 (Network)
- `browserNetworkSetting`: 浏览器网络设置 (server-proxy/direct)
- `autoSync`: 是否启用自动同步
- `webdav`: WebDAV 同步配置
  - `url`: WebDAV 服务器地址
  - `username`: 用户名
  - `password`: 密码
  - `baseDirName`: 基础目录名

#### 3. 系统设置 (System)
- `password`: 应用密码
- `runTask`: 是否运行任务
- `isDeveloper`: 是否为开发者模式
- `isLoadClaudeConfig`: 是否加载 Claude 配置
- `firstOpen`: 是否为首次打开
- `windowSize`: 窗口尺寸
  - `width`: 窗口宽度
  - `height`: 窗口高度

#### 4. 开发者设置 (Developer)
- `enableDebugMode`: 是否启用调试模式
- `enableTelemetry`: 是否启用遥测
- `experimentalFeatures`: 是否启用实验性功能
- `showAdvancedOptions`: 是否显示高级选项

### 文件存储

应用设置存储在应用数据目录下：
```
AppData/
├── app-settings.jsonc      # 设置文件（支持注释）
└── app-settings.schema.json # 自动生成的 JSON Schema
```

## 技术实现

### 后端实现

#### 1. Schema 定义 (`appSettings.mts`)
- 使用 Zod 进行运行时验证
- 自动生成 JSON Schema
- 支持 JSONC 格式

#### 2. 管理器类 (`AppSettingsManager`)
```typescript
// 初始化
const manager = new AppSettingsManager(appDataDir);
await manager.init();

// 获取设置
const settings = manager.getSettings();

// 更新设置
await manager.updateSettings({ appearance: { darkTheme: true } });

// 重置设置
await manager.reset();
```

#### 3. API 接口 (`command.mts`)
- `getAppSettings()`: 获取应用设置
- `updateAppSettings()`: 更新应用设置
- `resetAppSettings()`: 重置应用设置
- `exportAppSettings()`: 导出应用设置
- `importAppSettings()`: 导入应用设置

### 前端实现

#### 1. UI 组件 (`AppSettings.tsx`)
- 分类标签页设计
- 表单验证和状态管理
- 导入/导出功能

#### 2. 集成方式
- 在 `AppActions` 组件中添加"应用设置"按钮
- 使用抽屉式界面展示设置

## 兼容性

### 与 LocalSetting 的关系
- `LocalSetting` 仍然保留，用于向后兼容
- 新的 `AppSettingsManager` 提供更好的类型安全和验证
- 支持从 `LocalSetting` 迁移数据

### 迁移策略
```typescript
// 从旧设置迁移
await appSettingsManager.migrateFromLocalSetting(localSettingData);
```

## 使用方法

### 1. 后端初始化
```typescript
import { initAppSettingsManager } from './shared/data.mjs';

// 在应用启动时初始化
const appSettingsManager = initAppSettingsManager(appDataDir);
await appSettingsManager.init();
```

### 2. 前端访问
```typescript
// 获取设置
const settings = await call('getAppSettings', {});

// 更新设置
await call('updateAppSettings', {
  updates: {
    appearance: { darkTheme: true }
  }
});
```

### 3. 用户界面
- 点击工作区界面右上角的"应用设置"按钮
- 在弹出的抽屉中修改各项设置
- 支持实时保存和重置功能

## 特性

✅ **类型安全**: 完整的 TypeScript 类型支持  
✅ **运行时验证**: 使用 Zod 进行数据验证  
✅ **JSON Schema**: 自动生成，支持编辑器智能提示  
✅ **JSONC 支持**: 设置文件支持注释  
✅ **导入导出**: 支持设置的备份和迁移  
✅ **实时生效**: 外观设置修改后立即应用  
✅ **向后兼容**: 与现有 LocalSetting 兼容  
✅ **分层设计**: 应用级别和工作区级别设置分离