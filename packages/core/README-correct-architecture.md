# HyperChat 正确的架构分层

## 问题解决

之前的架构存在一个问题：`shared/data.mts` 文件导入了 `core/appSettingsManager.mjs`，这导致 `shared` 目录间接依赖了 Node.js 库，违反了前后端共享代码的原则。

## 解决方案

### 🔄 重新组织架构

```
packages/core/src/
├── shared/                    # 前后端共享（无 Node.js 依赖）
│   ├── appSettingsSchema.mts  # ✅ 纯 Zod schema 和类型
│   ├── types.mts             # ✅ 共享类型定义
│   └── data.mts              # ✅ 数据接口（无具体实现）
├── core/                     # Node.js 专用模块
│   ├── appSettingsManager.mts # 设置管理器实现
│   ├── appSettingsService.mts # 全局服务管理
│   └── index.mts             # 核心模块导出
└── command.mts               # 使用核心模块
```

### 📋 文件职责

#### `/shared/appSettingsSchema.mts`
```typescript
// ✅ 可以包含的内容
- Zod schema 定义
- TypeScript 类型导出
- 默认设置对象
- 纯验证函数

// ❌ 不能包含的内容
- Node.js 模块导入
- 文件系统操作
- 平台特定代码
```

#### `/core/appSettingsManager.mts`
```typescript
// ✅ 可以包含的内容
- 文件系统操作
- JSON Schema 生成
- 配置文件读写
- Node.js 专用功能

// ❌ 不应该被前端直接使用
- 仅限服务器端使用
```

#### `/core/appSettingsService.mts`
```typescript
// ✅ 全局服务管理
- 管理器实例创建
- 全局状态管理
- 服务生命周期
```

### 🔌 正确的导入方式

#### 前端代码
```typescript
// ✅ 正确：只导入共享模块
import { 
  AppSettingsSchema, 
  type AppSettings,
  DEFAULT_APP_SETTINGS 
} from '@hyperchat/shared/appSettingsSchema.mjs';

// ❌ 错误：不应该导入核心模块
import { AppSettingsManager } from '@hyperchat/core/appSettingsManager.mjs';
```

#### 后端代码
```typescript
// ✅ 正确：可以导入所有模块
import { AppSettingsManager } from '../core/appSettingsManager.mjs';
import { AppSettingsSchema } from '../shared/appSettingsSchema.mjs';
import { 
  initAppSettingsManager,
  getAppSettingsManager 
} from '../core/appSettingsService.mjs';
```

## 架构优势

### 1. 清晰分离
- **shared**: 真正的前后端共享代码
- **core**: 纯 Node.js 功能实现
- **command**: 业务逻辑和API定义

### 2. 依赖控制
- shared 目录零 Node.js 依赖
- 前端无法意外引入服务器端代码
- 类型安全在所有层面保证

### 3. 可维护性
- 职责明确，易于维护
- 代码复用性高
- 测试覆盖更容易

### 4. 扩展性
- 新功能容易添加到正确的层
- 不会破坏现有架构
- 支持不同平台的实现

## 使用示例

### 服务器端初始化
```typescript
// 在服务器启动时
import { initAppSettingsManager } from './core/appSettingsService.mjs';

const appSettingsManager = initAppSettingsManager('/path/to/appdata');
await appSettingsManager.init();
```

### API 层使用
```typescript
// 在 command.mts 中
import { getAppSettingsManager } from './core/appSettingsService.mjs';

async function getAppSettings() {
  const manager = getAppSettingsManager();
  return manager.getSettings();
}
```

### 前端使用
```typescript
// 在前端组件中
import { AppSettingsSchema } from '@hyperchat/shared/appSettingsSchema.mjs';

// 通过 API 获取设置
const settings = await call('getAppSettings');

// 使用共享的验证和类型
const isValid = AppSettingsSchema.safeParse(settings).success;
```

## 验证结果

✅ **TypeScript 编译通过**: 无类型错误  
✅ **依赖分离正确**: shared 目录无 Node.js 依赖  
✅ **功能完整**: 所有设置功能正常工作  
✅ **架构清晰**: 每个模块职责明确  

这样的架构确保了代码的可维护性、可扩展性和正确的依赖关系，同时保持了前后端代码的真正共享。