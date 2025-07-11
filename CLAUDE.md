# 请回复中文

## typescript使用指南
* import .mts 文件时，使用 import { xxx } from './xxx.mjs' 的方式导入。
* xx.ts.bak ， .bak 文件是老逻辑代码，不用阅读，也不用修改和删除。

## 项目概述

HyperChat 是一个多平台的 AI 聊天应用，该项目拥有完善的 MCP（模型上下文协议） 支持，并集成了包括 OpenAI、Claude、Gemini、Qwen、Deepseek 等在内的多种大语言模型 API。

### 多平台支持
* **核心**: nodejs
* **Web前端**: 通过浏览器访问，支持h5
* **Electron**: 桌面应用，自带浏览器
* **命令行前端**: 类似Claude Code，只能聊天，配置通过web前端完成
* **VSCode插件**: 通过webview访问构建

### 包结构
* `packages/shared` - 共享代码和类型定义，前后端通用
* `packages/core` - Node.js 后端服务
* `packages/web` - Web 前端的实现
* `packages/electron` - Electron 桌面应用
* `packages/cli` - 命令行前端的实现

## 开发逻辑

### 类型安全
* 尽量使用 TypeScript 的类型系统来确保代码的类型安全。尽量少使用any类型。
* packages/shared/src/types.mts 定义了常用的类型，包括前端和后端交互的类型，确保前后端的数据结构一致。
* 使用 Zod schema 进行数据验证，通过 zod-to-json-schema 转换为 JSON Schema 用于前端表单生成。
* 不允许 await import()。这样逻辑更加清晰，避免了动态导入带来的复杂性。

### 前后端通信
* 前端发送消息给后端，默认通过 packages/core/src/command.mts 实现，前端通过调用 call 的方法来实现与后端的交互。
* electron提供更多electron接口 packages/electron/src/command.mts， 前端通过调用 callElectron 的方法来实现与electron的交互。
* 后端发送消息给前端是通过websocket实现的 packages/core/src/message_service.mts，前端通过监听 websocket 的消息来接收后端发送的消息。

### Schema驱动开发
* 使用 JSON Schema 7 规范定义数据结构和表单验证规则
* Zod schema 作为数据验证和类型定义的统一来源
* Schema2Form 组件自动根据 schema 生成对应的表单组件
* 支持复杂类型：数组、嵌套对象、条件schema(oneOf/anyOf/allOf)、Record类型等

### 组件设计原则
* 优先使用现有的 Ant Design 组件库
* 遵循 React Hooks 最佳实践，使用 useCallback、useMemo 等优化性能
* 表单使用 Ant Design Form 组件，支持 Form.List 处理动态数组
* 错误处理和用户体验优先，提供清晰的错误提示和加载状态

## i18n Web前端
* i18n 相关的代码在 packages/web/src/i18n.ts 中。 软件默认使用英文，然后通过 t`english` 转成中文
* packages/web/src/i18n.json 不用修改。后续我会提供一个脚本来自动生成 i18n.json 文件。

## 🚀 新架构决策 (2.0版本核心理念)

### 核心理念：进程/会话 = 全局配置 + 工作区配置（覆盖模式）
**目标**：统一CLI和Web端的架构，实现更简单、一致的用户体验

### 配置层次结构
```
一个CLI进程/Web会话 = 全局配置基础 + 当前工作区配置覆盖

启动流程：
1️⃣ 加载全局配置 (~/.hyperchat/)
   ├── 全局AI模型配置
   ├── 全局MCP工具配置  
   ├── 全局Agent配置
   └── 全局系统设置

2️⃣ 检测/选择当前工作区 (./.hyperchat/ 或项目根目录)
   ├── 工作区AI模型配置 (覆盖全局)
   ├── 工作区MCP工具配置 (补充/覆盖全局)
   ├── 工作区Agent配置 (补充全局)
   └── 工作区项目设置

3️⃣ 合并配置启动服务
   ├── 最终AI模型列表
   ├── 最终MCP客户端列表
   ├── 最终Agent列表
   └── 统一运行环境
```

### 关键变化
- **CLI端**：去掉运行时工作区切换，每个目录的CLI会话独立（类似git工作方式）
- **Web端**：启动时选择项目，整个会话使用合并后的配置，简化UI
- **MCP工具**：从工作区绑定改为全局+项目特定补充的模式
- **配置合并**：工作区配置覆盖/补充全局配置，一次加载，稳定运行

### 用户体验优化
- ❌ 移除：复杂的工作区切换UI和逻辑
- ❌ 移除：动态MCP客户端重启
- ❌ 移除：多工作区状态管理复杂性
- ✅ 新增：简单的项目选择器（Web端）
- ✅ 新增：自动工作区检测（CLI端）
- ✅ 新增：统一的配置覆盖机制

## ✅ 已完成的架构重构

### Workspace配置合并架构重构 (完成) 🆕
**核心文件**: `packages/core/src/workspace/workspace.mts`

#### 实现特性
- **智能工作区检测**: 在Workspace构造函数中自动检测当前目录是否为工作区
- **自动回退机制**: 非工作区目录自动使用全局工作区配置，确保始终有可用配置
- **配置合并逻辑**: 实现了`loadMergedConfig()`方法，先加载全局配置作为基础，再加载工作区配置覆盖
- **Agent配置合并**: `getAgents()`和`getMergedAgents()`方法实现全局+工作区Agent的去重合并

#### 三种工作模式
1. **非工作区目录**: 自动回退到全局配置
2. **工作区目录**: 全局配置 + 工作区配置合并
3. **全局工作区**: 直接使用全局配置

#### 优势
- **向下兼容**: 保持现有API不变，对外部调用透明
- **自动化**: 无需手动管理配置切换
- **稳定性**: 一次加载，会话期间配置稳定

### CLI 架构重构 (完成)
- **HTTP API 移除**: 从 HTTP API 通信改为直接导入 core 模块，提高性能和可靠性
- **完整命令支持**: 实现了聊天、服务器管理、工作区、代理、配置等完整功能
- **服务器管理**: 支持启动 core 服务器，供浏览器访问 Web 界面
- **命令行体验**: 提供类似 Claude Code 的命令行体验，支持交互式聊天
- **架构清晰**: CLI 作为独立的前端包，与 core 后端分离，符合 monorepo 最佳实践

#### CLI 功能特性
- **聊天功能**: `hyperchat "你好"` 或 `hyperchat chat` 进行 AI 对话
- **服务器管理**: `hyperchat server start/stop/status` 管理后端服务器
- **工作区管理**: `hyperchat workspace list/create/switch` 管理项目工作区
- **代理管理**: `hyperchat agent list/create` 管理 AI 代理
- **配置管理**: `hyperchat config get/set` 管理应用配置

### Schema2Form 组件系统 (完成)
- **packages/web/src/components/Schema2Form.tsx** - 主组件，支持表单和JSON编辑器双模式切换
- **packages/web/src/components/Schema2FormItems.tsx** - 表单项渲染组件，支持复杂JSON Schema
- **packages/web/src/components/AppSettings.tsx** - 应用设置页面，使用Schema2Form渲染配置界面

### AI配置管理系统 (完成)
- **packages/shared/src/jsonSchemas/appSettingsSchema.mts** - 应用设置的Zod schema定义
- 支持多提供商管理、模型配置、API Key管理，集成到应用设置中
- 应用设置系统采用Schema驱动的UI生成，支持复杂对象、数组、条件schema等

### 包结构现代化重构 (完成)

#### Shared 包独立工作区重构
- **独立包创建**: 将 `packages/core/src/shared` 移动到独立的 `packages/shared` 工作区
- **包配置**: 创建完整的 `package.json` 和 TypeScript 配置，支持 ES 模块导出
- **依赖管理**: Core 和 Web 包添加 `@hyperchat/shared` 依赖
- **引用重构**: 所有相对路径引用更新为模块引用 (如 `'./shared/types.mts'` → `'@hyperchat/shared/types'`)
- **构建系统**: 更新构建脚本，shared 包优先构建，支持独立开发模式

#### 构建系统现代化重构
- **npm workspaces**: 配置 npm workspaces 替代分散的包管理
- **统一构建脚本**: 创建 `scripts/build.mjs` 统一管理所有包的构建
- **TypeScript 编译**: Core 包使用 tsc 编译，输出正确的 .mjs 文件而非 .mts 文件
- **构建顺序**: shared → web → core → cli → electron 的依赖顺序构建

### 其他已完成重构

#### AppSettings 架构重构
- **DesktopSchema 分离**: 将 `closeAction` 和 `windowSize` 从 `SystemSchema` 分离到新的 `DesktopSchema`
- **前端支持**: 在 `AppSettings.tsx` 中添加了独立的 "Desktop" 选项卡
- **Context 更新**: `AppSettingsContext.tsx` 添加了 `desktop` 属性和 `updateDesktop` 函数
- **类型安全**: 修复了所有 TypeScript 错误，保持完整的类型支持

#### WorkspaceSettings 架构重构
- **Schema 分离**: 创建 `packages/shared/src/jsonSchemas/workspaceSettingsSchema.mts`
- **实现迁移**: 创建 `packages/core/src/data/workspaceSettingsManager.mts`
- **引用更新**: 更新了所有相关文件的导入和类型引用
- **命名冲突解决**: 使用 `WorkspaceDetailedSettings` 避免与现有类型冲突

## 当前构建命令 🚀

### 可用的构建脚本
```bash
# 构建
npm run build             # 构建所有包（按依赖顺序）
npm run build:shared      # 构建 shared 包
npm run build:web         # 构建 Web 前端
npm run build:core        # 构建 Core 后端
npm run build:cli         # 构建 CLI 工具
npm run build:electron    # 构建 Electron 应用

# 开发模式
npm run dev:shared        # shared 包开发模式（watch）
npm run dev:web          # Web 开发服务器
npm run dev:core         # Core 开发模式
npm run dev:cli          # CLI 开发模式
npm run dev:electron     # Electron 开发模式

# 工具
npm run clean            # 清理所有构建产物
npm run typecheck        # 所有包类型检查
```

### 构建顺序
1. **shared** - 必须最先构建，其他包依赖它
2. **web** - React 前端构建
3. **core** - Node.js 后端构建
4. **cli** - 命令行工具
5. **electron** - 桌面应用（依赖 web 构建产物）

## 🗂️ 项目结构

### 全局配置目录
```
~/Documents/HyperChat/
    .hyperchat/
    ├── mcp.json                     // 全局主控程序 (MCP) 配置文件
    ├── ai_models.json               // AI 模型配置文件，包含所有可用的 AI 模型信息
    ├── agents/
    │   ├── agent1-key/
    │   │   ├── memory.md            # Agent记忆
    │   │   ├── sub_agents/          # 子代理文件夹（类似 agents 文件夹）
    │   │   ├── agent.yaml           # Agent配置
    │   │   └── chatlogs/            # 聊天记录文件夹
    │   │       ├── chat1.yaml
    │   │       ├── chat2.yaml
    │   │       └── ...
    │   └── ...
    └── ...
```

### 项目工作区结构
```
/projects/
    project1/
        .hyperchat/
        ├── mcp.json                     // (MCP) 配置文件
        ├── ai_models.json               // AI 模型配置文件，包含所有可用的 AI 模型信息
        ├── agents/
        │   ├── agent1-key/
        │   │   ├── memory.md            # Agent记忆
        │   │   ├── sub_agents/          # 子代理文件夹（类似 agents 文件夹）
        │   │   ├── agent.yaml           # Agent配置
        │   │   └── chatlogs/            # 聊天记录文件夹
        │   │       ├── chat1.yaml
        │   │       ├── chat2.yaml
        │   │       └── ...
        │   └── ...
        └── ...
```

## 📝 项目记忆

### 已完成功能
- [x] AI请求改造：从web浏览器前端改为在nodejs环境中通过ai库发请求，代码在packages/shared/src/ai.mts，前后端共用
- [x] 工作区概念实现：支持在不同工作区之间隔离数据和配置，支持显示当前工作区文件夹（树状），agent等配置作为文件保存在.hyperchat目录下
- [x] 核心工作区管理类实现：workspace.mts, workspaceManager.mts
- [x] Schema2Form组件系统：支持JSON Schema转Ant Design表单，包括双模式编辑（表单/JSON）和Monaco编辑器集成
- [x] AI配置管理系统：支持多提供商管理、模型配置、API Key管理，集成到应用设置中
- [x] 应用设置系统：采用Schema驱动的UI生成，支持复杂对象、数组、条件schema等
- [x] CLI架构重构：从HTTP API改为直接导入core模块，实现了完整的命令行界面
- [x] Workspace配置合并逻辑：在workspace.mts中实现了智能工作区检测和配置合并

### 架构优势
- **分离关注点**: JSON Schema 与业务逻辑分离，shared 包独立维护
- **统一管理**: 所有 Schema 集中在 `packages/shared/src/jsonSchemas` 目录
- **数据管理**: 所有管理器类集中在 `data` 目录
- **类型安全**: 保持完整的 TypeScript 类型支持，跨包类型共享
- **前端集成**: Schema2Form 自动生成 UI 界面
- **构建效率**: npm workspaces 避免依赖重复，统一的构建管理

### 待办事项
- [ ] 减少any使用，多使用packages/shared/src/types.mts定义的类型
- [ ] 完善 Schema2Form 组件的单元测试
- [ ] 优化 AI 配置管理的性能，考虑大量模型时的加载优化
- [ ] 为 WorkspaceSettings 添加前端配置界面
- [ ] 完善 CLI 与 core 模块的深度集成，实现真正的 AI 对话功能
- [ ] 修复 shared 包的 TypeScript 类型错误
- [ ] 优化 shared 包的模块导出配置