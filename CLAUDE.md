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
* **命令行前端**: 类似Claude Code，已集成到core包中，配置通过web前端完成
* **VSCode插件**: 通过webview访问构建

### 包结构
* `packages/shared` - @dadigua/hyperchat-shared，共享代码和类型定义+zodSchemas，前后端通用
* `packages/core` - Node.js 后端服务 + CLI命令行工具
* `packages/web` - Web 前端的实现
* `packages/electron` - Electron 桌面应用

## 开发逻辑

### 类型安全
* 尽量使用 TypeScript 的类型系统来确保代码的类型安全。尽量少使用any类型。
* packages/shared/src/types.mts 定义了常用的类型，包括前端和后端交互的类型，确保前后端的数据结构一致。
* packages/shared/src/zodSchemas文件夹 定义了 Zod schema，用于数据验证和前端表单生成。所有的 schema 都是基于 TypeScript 类型定义的，确保类型一致性。
* 使用 Zod schema 进行数据验证，通过 zod-to-json-schema 转换为 JSON Schema 用于前端表单生成。
* 不允许 await import()。这样逻辑更加清晰，避免了动态导入带来的复杂性。

### 前后端通信
* 前端发送消息给后端，默认通过 packages/core/src/command.mts 实现，前端通过调用 call 的方法来实现与后端的交互。
* electron提供更多electron接口 packages/electron/src/command.mts， 前端通过调用 callElectron 的方法来实现与electron的交互。
* 后端发送消息给前端是通过websocket实现的 packages/core/src/message_service.mts，前端通过监听 websocket 的消息来接收后端发送的消息。

### 组件设计原则
* 优先使用现有的 Ant Design 组件库
* 遵循 React Hooks 最佳实践，使用 useCallback、useMemo 等优化性能
* 表单使用 Ant Design Form 组件，支持 Form.List 处理动态数组
* 错误处理和用户体验优先，提供清晰的错误提示和加载状态

## i18n Web前端
* i18n 相关的代码在 packages/web/src/i18n.ts 中。 软件默认使用英文，然后通过 t`english` 转成中文
* packages/web/src/i18n.json 不用修改。后续我会提供一个脚本来自动生成 i18n.json 文件。

## ✅ 新架构决策 (2.0版本 - 已完成实现)

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


#### 实现状态 ✅ 全部完成
1. **后端配置合并逻辑** ✅：workspace.mts中实现loadMergedConfig()和getMergedAgents()
2. **WorkspaceManager架构重构** ✅：简化为单工作区模式，完整向后兼容
3. **前端Web架构重构** ✅：移除"运行工作区"概念，实现简单工作区切换
4. **API接口完善** ✅：添加switchWorkspace命令，完善前后端通信
5. **UI组件更新** ✅：更新WorkspaceInfo接口，修改关闭确认对话框，简化用户体验

#### 详细实现记录 (2025-01-12)

**前端架构重构 (packages/web/src/pages/workspace/workspace.tsx)**
- 移除 `isRunning` 属性，新增 `isCurrent` 属性标记当前工作区
- 删除 `runningWorkspaces` 状态管理和相关UI逻辑  
- 简化 `switchToWorkspace()` 函数，使用新的 `switchWorkspace` API
- 重构关闭工作区确认对话框，移除"后台运行"选项
- 更新工作区列表显示，从"运行工作区"改为"可切换工作区"
- 移除 `startWorkspaceMcpClients()` 和 `runWorkspaceInBackground()` 函数

**后端API扩展 (packages/core/src/command.mts)**
- 新增 `switchWorkspace({ workspacePath })` 命令
- 利用 WorkspaceManager.switchWorkspace() 实现工作区切换
- 保持与现有 `getRunningWorkspaces()` API的兼容性

**用户体验改进**
- 工作区切换更加直观简单
- 消除了"运行中"和"前端显示"的概念混淆
- 统一了CLI和Web端的工作区管理模式
- 自动配置合并，用户无需关心复杂的配置层次

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

### CLI 架构重构 (完成) ✨
- **集成到core包**: 将CLI作为core的一部分，简化架构和依赖管理
- **完整命令支持**: 实现了聊天、服务器管理、工作区、代理、配置等完整功能
- **服务器管理**: 支持启动 core 服务器，供浏览器访问 Web 界面
- **命令行体验**: 提供类似 Claude Code 的命令行体验，支持交互式聊天
- **架构清晰**: CLI作为core的子模块，符合简化的monorepo最佳实践

#### CLI 功能特性 (2024-07-12 更新) 🆕
- **聊天功能**: `hyperchat "你好"` 或 `hyperchat chat` 进行 AI 对话
- **服务器管理**: `hyperchat serve` 启动后端服务器
- **工作区管理**: `hyperchat workspace create` 在当前目录创建工作区 (简化：移除list/info/current/switch)
- **代理管理**: `hyperchat agent list/create` 管理 AI 代理，支持完整信息显示

#### CLI 最新修复 (2024-07-12) ✅
- **修复agent显示**: 解决agent列表显示"undefined (undefined)"问题
  - 正确访问`agentSummary.config`获取agent配置信息
  - 添加AgentConfig类型导入和类型断言
  - 增强显示：显示模型信息、聊天记录数量
- **简化命令结构**: 移除不必要的命令，符合新架构理念
  - 简化为`serve`：将`server start`简化为`serve`
  - 移除`workspace list/info/current/switch`：只保留`workspace create`
  - 修复ES模块导入：将`require('path').basename`改为`import { basename }`
- **代码质量提升**: 
  - 移除动态导入：避免使用`await import()`
  - 移除别名导入：避免使用`as`关键字
  - 添加日志功能：在chat命令中输出工作区agent和MCP工具数量

#### 技术实现细节
**核心文件修改**:
- `packages/core/src/cli/commands/agent.mts`: 修复agent数据结构访问
- `packages/core/src/cli/index.mts`: 简化命令结构和帮助信息
- `packages/core/src/cli/commands/workspace.mts`: 修复ES模块导入
- `packages/core/src/cli/commands/chat.mts`: 添加工作区资源统计日志

**问题解决**:
1. **Agent显示问题**: `getWorkspaceAgentsSummary`返回`{config: AgentConfig, chatLogsCount: number}`格式，需访问`.config`属性
2. **构建问题**: TypeScript编译需要正确的类型断言和ES模块导入
3. **架构简化**: 符合"每个目录CLI会话独立"的新架构理念

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

### 可用的构建脚本 (更新)
```bash
# 构建
npm run build             # 构建所有包（按依赖顺序）
npm run build:shared      # 构建 shared 包
npm run build:web         # 构建 Web 前端
npm run build:core        # 构建 Core 后端 + CLI
npm run build:electron    # 构建 Electron 应用

# 开发模式
npm run dev:shared        # shared 包开发模式（watch）
npm run dev:web          # Web 开发服务器
npm run dev:core         # Core + CLI 开发模式
npm run dev:electron     # Electron 开发模式

# 工具
npm run clean            # 清理所有构建产物
npm run typecheck        # 所有包类型检查
```

### 构建顺序 (更新)
1. **shared** - 必须最先构建，其他包依赖它
2. **web** - React 前端构建
3. **core** - Node.js 后端 + CLI 构建
4. **electron** - 桌面应用（依赖 web 构建产物）

### CLI使用方式 (更新)
```bash
# 直接运行
node packages/core/dist/cli/index.mjs --help

# 安装后使用 (如果全局安装core包)
hyperchat --help
hc workspace current

# 常用命令
hyperchat chat                  # 直接AI对话
hyperchat "你好"                    # 直接AI对话
hyperchat serve                   # 启动Web服务器
hyperchat workspace current        # 查看当前工作区
hyperchat agent list              # 列出AI代理
hyperchat [agent_name] "你好"          # 使用某个agent直接AI对话
hyperchat [agent_name] chat          # 使用某个agent进行对话
```

## 🗂️ 项目结构 (更新)

### 当前包结构
```
HyperChat/
├── packages/
│   ├── shared/          # 共享类型和工具库
│   ├── web/            # React Web前端
│   ├── core/           # Node.js后端 + CLI (合并后)
│   │   ├── src/cli/    # ✨ CLI命令行工具
│   │   │   ├── index.mts          # CLI主入口
│   │   │   ├── commands/          # 命令实现
│   │   │   │   ├── agent.mts     # 代理管理
│   │   │   │   ├── chat.mts      # AI聊天
│   │   │   │   ├── config.mts    # 配置管理
│   │   │   │   ├── server.mts    # 服务器控制
│   │   │   │   └── workspace.mts # 工作区管理
│   │   │   └── utils/            # CLI工具函数
│   │   ├── src/workspace/        # 工作区管理
│   │   ├── src/command.mts       # API命令层
│   │   └── src/mcp/              # MCP协议实现
│   └── electron/       # Electron桌面应用
```

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
- [x] CLI架构重构：从HTTP API改为直接导入core模块，并集成到core包中
- [x] Workspace配置合并逻辑：在workspace.mts中实现了智能工作区检测和配置合并
- [x] CLI集成到Core包：简化架构，提升性能，统一构建流程
- [x] CLI bug修复和简化 (2024-07-12)：修复agent显示undefined问题，简化命令结构，提升代码质量

### 架构优势
- **分离关注点**: JSON Schema 与业务逻辑分离，shared 包独立维护
- **统一管理**: 所有 Schema 集中在 `packages/shared/src/jsonSchemas` 目录
- **数据管理**: 所有管理器类集中在 `data` 目录
- **类型安全**: 保持完整的 TypeScript 类型支持，跨包类型共享
- **前端集成**: Schema2Form 自动生成 UI 界面
- **构建效率**: npm workspaces 避免依赖重复，统一的构建管理
- **架构简化**: CLI集成到core包，减少包管理复杂性

### 🎯 最新更新日志

#### 2024-07-12 CLI修复和简化
**问题修复**:
- ✅ 修复agent列表显示"undefined (undefined)"的bug
- ✅ 修复ES模块导入问题，避免使用CommonJS require
- ✅ 修复TypeScript类型错误，添加正确的类型断言

**功能简化**:
- ✅ 简化server命令：只保留`start`，移除`stop`和`status`
- ✅ 简化workspace命令：只保留`create`，移除`list/info/current/switch`
- ✅ 遵循项目TypeScript编码规范：避免动态导入和别名导入

**用户体验提升**:
- ✅ 增强agent列表显示：显示模型信息和聊天记录数量
- ✅ 添加工作区资源统计：在chat命令中显示agent和MCP工具数量
- ✅ 优化帮助文档：更新命令说明，移除废弃功能

这次更新进一步简化了CLI架构，符合"每个目录CLI会话独立"的设计理念，提升了用户体验和代码质量。

### 待办事项
- [ ] 减少any使用，多使用packages/shared/src/types.mts定义的类型
- [ ] 完善 Schema2Form 组件的单元测试
- [ ] 优化 AI 配置管理的性能，考虑大量模型时的加载优化
- [ ] 为 WorkspaceSettings 添加前端配置界面
- [ ] 考虑在 Electron 中集成 CLI 功能
- [ ] 优化 MCP 工具性能和错误处理
- [ ] 添加 CLI 命令的单元测试和集成测试
- [ ] 优化 workspace create 功能，确保在各种环境下正常工作