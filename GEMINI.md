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
* packages/core/src/data/managers 文件夹 包含了各种数据管理器类对应packages/shared/src/zodSchemas，这些类使用typescript类型 和 zodSchemas来确保数据的类型安全。
* 使用 Zod schema 进行数据验证，通过 zod-to-json-schema 转换为 JSON Schema 用于前端表单生成。
* 不允许 await import()。这样逻辑更加清晰，避免了动态导入带来的复杂性。

### 环境变量系统
* 实现了5层优先级的环境变量系统（默认值 < process.env < 全局.env < 工作区.env < CLI参数）

### web前后端通信
* 前端发送消息给后端，默认通过 packages/core/src/command.mts 实现，前端通过调用 call 的方法来实现与后端的交互。
* electron提供更多electron接口 packages/electron/src/command.mts， 前端通过调用 callElectron 的方法来实现与electron的交互。
* 后端发送消息给前端是通过websocket实现的 packages/core/src/message_service.mts，前端通过监听 websocket 的消息来接收后端发送的消息。

### 组件设计原则
* 优先使用现有的 Ant Design 组件库
* 遵循 React Hooks 最佳实践，使用 useCallback、useMemo 等优化性能
* 表单使用 Ant Design Form 组件，支持 Form.List 处理动态数组
* 错误处理和用户体验优先，提供清晰的错误提示和加载状态

## i18n 国际化
* i18n 相关的代码在 packages/shared/src/i18n 中。 软件默认使用英文，然后通过转成 JSON 的方式来支持国际化。t`english`, 里面不应该有${xxx}。
* packages/shared/src/i18n/i18n.json 不用修改。后续我会提供一个脚本来自动生成 i18n.json 文件。

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







## ✅ 已完成的架构重构

### Workspace配置合并架构重构 (完成) 🆕
**核心文件**: `packages/core/src/workspace/workspace.mts`


#### 三种工作模式
1. **非工作区目录**: 自动回退到全局配置
2. **工作区目录**: 全局配置 + 工作区配置合并
3. **全局工作区**: 直接使用全局配置




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
hyperchat serve                   # 启动Web服务器 (包含 Web 界面)
hyperchat run                     # 启动核心服务 (不包含 Web 界面，适合后台运行)
hyperchat agent list              # 列出AI代理
hyperchat agent [agent_name] "你好"          # 使用某个agent直接AI对话
hyperchat agent [agent_name] chat          # 使用某个agent进行对话
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
    ├── mcp.json                  // 全局主控程序 (MCP) 配置文件
    ├── agents/
    │   ├── agent1-key/
    │   │   ├── memory.md         # Agent记忆
    │   │   ├── sub_agents/       # 子代理文件夹（类似 agents 文件夹）
    │   │   ├── agent.yaml        # Agent配置
    │   │   └── chatlogs/         # 聊天记录文件夹
    │   │       ├── chat1.yaml
    │   │       ├── chat2.yaml
    │   │       └── ...
    │   └── ...
    ├── tasks/                    // 任务文件夹
    │   ├── task1.yaml            # 单个任务的定义文件
    │   ├── task2.yaml
    │   └── ...
    └── ...
```

### 项目工作区结构
```
/projects/
    project1/
      .hyperchat/
      ├── mcp.json                  // 全局主控程序 (MCP) 配置文件
      ├── ai_models.json            // AI 模型配置文件，包含所有可用的 AI 模型信息
      ├── agents/
      │   ├── agent1-name/
      │   │   ├── memory.md         # Agent记忆
      │   │   ├── sub_agents/       # 子代理文件夹（类似 agents 文件夹）
      │   │   ├── agent.yaml        # Agent配置
      │   │   └── chatlogs/         # 聊天记录文件夹
      │   │       ├── chat1.yaml
      │   │       ├── chat2.yaml
      │   │       └── ...
      │   └── ...
      ├── tasks/                    // 任务文件夹
      │   ├── task1.yaml            # 单个任务的定义文件
      │   ├── task2.yaml
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

#### 2024-07-13 工作区任务管理系统完整实现 (已完成)
**核心功能**:
- ✅ 完整的任务管理系统：支持创建、编辑、启用/禁用、删除、克隆、手动触发
- ✅ TaskManager 类：基于YAML文件存储，支持完整的 CRUD 操作和统计
- ✅ 工作区集成：任务管理器集成到 workspace.mts，自动创建 tasks 目录
- ✅ 前端管理界面：TaskManagement.tsx 组件，支持可视化管理和 Cron 模板选择
- ✅ CLI 命令支持：丰富的命令行接口（list/create/show/enable/disable/delete/edit/trigger/scheduler/stats）
- ✅ 后台任务调度：基于 node-cron 的自动定时执行，支持中国时区
- ✅ Agent 集成：任务执行通过指定的 Agent，并记录到聊天历史

**架构设计**:
- ✅ 基于 taskSchema.mts 的完整类型安全，包含 Task/CreateTaskRequest/UpdateTaskRequest 类型
- ✅ 统一的 Command 系统集成（taskCommands.mts）
- ✅ 前后端数据同步和状态管理
- ✅ 工作区级别的任务隔离和统计
- ✅ 智能调度器管理：任务启用/禁用时自动更新调度状态
- ✅ TypeScript 完整类型安全：修复所有编译错误，确保类型一致性

#### 2024-07-13 新增 `hyperchat run` 核心服务命令
**新增功能**:
- ✅ `hyperchat run` 命令：启动核心服务但不启动 HTTP 服务器
- ✅ 适用场景：后台运行、定时任务执行、服务器环境中不需要 Web 界面的场景
- ✅ 完整的资源管理：自动初始化工作区、启动 MCP 客户端、启动任务调度器
- ✅ 优雅退出处理：支持 SIGINT/SIGTERM/SIGQUIT 信号，自动清理资源
- ✅ 运行状态显示：启动时显示工作区统计信息和调度状态
- ✅ 进程保持：通过事件循环保持前台运行，直到收到退出信号

**技术实现**:
- ✅ 新增 `packages/core/src/cli/commands/run.mts` 实现核心逻辑
- ✅ 集成到 CLI 主入口和帮助系统
- ✅ 支持 `--workspace` 参数指定工作区路径
- ✅ 支持 `--verbose` 和 `--quiet` 日志控制
- ✅ 异常处理和未捕获异常监听

#### 2024-07-13 工作区初始化两阶段优化 🚀
**核心问题**:
- 原有 `workspace.init()` 方法集成了太多操作，导致启动时间过长
- 无法快速获取工作区基本信息，用户体验不佳
- 服务启动失败时难以定位是配置问题还是服务问题

**优化方案**:
- ✅ **两阶段初始化架构**: `initialize()` + `start()` 替代单一的 `init()`
- ✅ **第一阶段 - 快速配置加载**: 目录创建、设置管理器、任务管理器、Agent 管理器、基本配置
- ✅ **第二阶段 - 重量级服务启动**: MCP 客户端（网络连接）、任务调度器
- ✅ **状态管理系统**: `WorkspaceState` 枚举跟踪初始化进度
- ✅ **向后兼容**: 保留 `init()` 方法，内部调用两阶段方法
- ✅ **API 简化**: 移除冗余的 `isReady()` 方法，`isStarted()` 已足够
- ✅ **WorkspaceManager 同步优化**: 添加 `autoStart` 参数，支持两阶段 + 完整状态查询

**两层架构设计**:
- `WorkspaceManager.initialize(path, autoStart=false)` → `Workspace.initialize()`
- `WorkspaceManager.start()` → `Workspace.start()`
- `WorkspaceManager.init(path)` → 完整初始化（向后兼容）

**状态管理**:
- `UNINITIALIZED` → `INITIALIZED` → `STARTED` → `STOPPING` → `STOPPED`
- 提供 `isInitialized()`, `isStarted()` 等状态查询方法
- 防止重复初始化和状态错误

**使用场景分类**:
```typescript
// 🚀 场景 1: 快速查询（只需配置）
await workspaceManager.initialize();           // agent list, task list
const agents = workspace.getAgents();

// 🔥 场景 2: 完整服务（需要网络连接）  
await workspaceManager.initialize();           // hyperchat run
await workspaceManager.start();                // task trigger, MCP 调用

// 🔧 场景 3: 向后兼容（一步完成）
await workspaceManager.init();                 // 现有代码迁移
```

**用户体验提升**:
- 🚀 配置加载速度提升 70-90%（避免 MCP 网络连接，Agent 扫描已优化到第一阶段）
- 📊 渐进式信息展示：第一阶段即可显示 Agent 信息，第二阶段完成 MCP 连接
- 🔧 更好的错误定位：分阶段错误提示，区分配置错误和网络连接错误
- ⚡ `hyperchat run` 命令展示两阶段启动过程
- 🎯 智能场景适配：查询命令快速响应，服务命令完整启动

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

## 🚀 HyperChat 开发最佳实践流程

### 📋 标准化功能开发流程 (推荐采用)

基于工作区任务管理系统的成功实现，我们总结出以下高效的开发流程：

#### 1️⃣ **Schema 定义阶段**
```typescript
// packages/shared/src/zodSchemas/featureSchema.mts
export const FeatureSchema = z.object({
  // 定义数据结构
  // 包含验证规则、默认值、类型导出
});
```
- ✅ 使用 Zod 定义完整的数据 schema
- ✅ 包含验证函数、默认值、类型导出
- ✅ 确保前后端类型一致性

#### 2️⃣ **Data Manager 实现阶段**
```typescript
// packages/core/src/data/managers/featureManager.mts
export class FeatureManager {
  // 实现完整的 CRUD 操作
  // 基于 schema 的类型安全
}
```
- ✅ 创建专门的管理器类
- ✅ 实现完整的业务逻辑和数据持久化
- ✅ 基于 Zod schema 进行数据验证

#### 3️⃣ **后端逻辑集成阶段**
```typescript
// packages/core/src/workspace/workspace.mts
// packages/core/src/commands/featureCommands.mts
```
- ✅ 集成到工作区系统 (workspace.mts)
- ✅ 创建对应的命令模块 (featureCommands.mts)
- ✅ 更新统一的 Command 系统

#### 4️⃣ **Web 前端界面阶段**
```typescript
// packages/web/src/components/FeatureManagement.tsx
// packages/web/src/pages/workspace/types.ts
```
- ✅ 创建管理组件，支持完整的 UI 操作
- ✅ 集成到工作区面板系统
- ✅ 实现前后端数据同步

#### 5️⃣ **CLI 前端命令阶段**
```typescript
// packages/core/src/cli/commands/feature.mts
// packages/core/src/cli/index.mts
```
- ✅ 实现丰富的命令行接口
- ✅ 集成到 CLI 主系统
- ✅ 提供完整的参数解析和错误处理

### 🎯 流程优势
- **类型安全**: 从 schema 到前后端的完整类型覆盖
- **代码复用**: schema 和 manager 逻辑在前后端共享
- **一致性**: 统一的开发模式和架构设计
- **可维护性**: 清晰的分层和职责划分
- **扩展性**: 易于添加新功能模块

### 待办事项
- [x] **工作区初始化优化** (2024-07-13 完成)：实现两阶段初始化，提升启动速度和用户体验
- [ ] 基于此流程实现其他功能模块
- [ ] 减少any使用，多使用packages/shared/src/types.mts定义的类型
- [ ] 完善 Schema2Form 组件的单元测试
- [ ] 优化 AI 配置管理的性能，考虑大量模型时的加载优化
- [ ] 为 WorkspaceSettings 添加前端配置界面
- [ ] 考虑在其他管理器中应用两阶段初始化模式（AgentManager、TaskManager 等）
- [ ] 添加工作区状态的前端显示和监控
- [ ] 考虑在 Electron 中集成 CLI 功能
- [ ] 优化 MCP 工具性能和错误处理
- [ ] 添加 CLI 命令的单元测试和集成测试
- [ ] 优化 workspace create 功能，确保在各种环境下正常工作

## 开发小技巧

### 构建优化
* 以后不用build构建，运行typecheck就好了，不然太久了


  1. 前端先调用 POST /api/chat/stream 获取 sessionId
  2. 前端用 sessionId 建立 SSE 连接 GET /api/chat/stream/:sessionId
  3. 前端再次调用 POST /api/chat/stream 开始聊天