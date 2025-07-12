# HyperChat Core 目录结构

## 目录说明

### `/shared` - 前后端共享模块
这个目录包含前后端都可以使用的纯 TypeScript 代码，**不能**包含 Node.js 特定的库。

#### 特点：
- ✅ 可以使用纯 JavaScript/TypeScript 功能
- ✅ 可以使用 Zod 等跨平台库
- ❌ 不能使用 `fs`、`path`、`os` 等 Node.js 模块
- ❌ 不能使用 `jsonc-parser`、`uuid` 等 Node.js 特定库

#### 文件：
- `appSettingsSchema.mts` - 应用设置的 Zod schema 定义
- `types.mts` - 共享类型定义
- `data.mts` - 数据管理接口（不包含具体实现）

### `/core` - 核心 Node.js 模块
这个目录包含仅限 Node.js 环境使用的核心功能实现。

#### 特点：
- ✅ 可以使用所有 Node.js 模块
- ✅ 可以进行文件系统操作
- ✅ 可以使用 Node.js 专用库
- ❌ 前端无法直接使用

#### 文件：
- `appSettingsManager.mts` - 应用设置管理器（Node.js 实现）
- `index.mts` - 核心模块导出

## 使用示例

### 前端使用 (共享模块)
```typescript
import { 
  AppSettingsSchema, 
  DEFAULT_APP_SETTINGS,
  type AppSettings 
} from '@dadigua/hyperchat-shared/appSettingsSchema.mjs';

// 可以使用 schema 进行验证
const isValid = AppSettingsSchema.safeParse(data).success;

// 可以使用类型定义
const settings: AppSettings = DEFAULT_APP_SETTINGS;
```

### 后端使用 (核心模块)
```typescript
import { AppSettingsManager } from '../data/appSettingsManager.mjs';
import { AppSettingsSchema } from '../shared/appSettingsSchema.mjs';

// 创建管理器实例
const manager = new AppSettingsManager('/path/to/appdata');
await manager.init();

// 使用管理器操作设置
const settings = manager.getSettings();
await manager.updateSettings({ appearance: { darkTheme: true } });
```

## 架构优势

1. **清晰分离**: 前后端代码职责分明
2. **类型安全**: 共享类型定义确保一致性
3. **跨平台**: 共享模块可在任何环境使用
4. **可维护性**: 代码结构清晰，易于维护

## 注意事项

- 在 `shared` 目录中添加新功能时，确保不使用 Node.js 特定的库
- 文件操作和平台相关功能应放在 `core` 目录中
- 类型定义和验证 schema 应放在 `shared` 目录中
- 导入路径要正确区分 `shared` 和 `core` 模块