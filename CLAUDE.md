# 请回复中文

## typescript使用指南
* import .mts 文件时，使用 import { xxx } from './xxx.mjs' 的方式导入。
* xx.ts.bak ， .bak 文件是老逻辑代码，不用阅读，也不用修改和删除。

## 项目概述

HyperChat 是一个多平台的 AI 聊天应用，该项目拥有完善的 MCP（模型上下文协议） 支持，并集成了包括 OpenAI、Claude、Gemini、Qwen、Deepseek 等在内的多种大语言模型 API。

* 核心是nodejs
* 支持web前端，通过浏览器访问，支持h5。
* 支持electron，相当于自带了浏览器。
* 支持命令行前端，类似Claude Code。只能聊天，配置通过web前端完成。
* 支持vscode插件，通过webview访问构建。

packages/core 专注于 Node.js 相关的功能
packages/core/src/shared 主要包含共享的代码和逻辑
packages/electron 专门处理 Electron 桌面应用的需求。
packages/web 专注于 Web 前端的实现
packages/cli 专注于命令行前端的实现

## i18n Web前端

* i18n 相关的代码在 packages/web/src/i18n.ts 中。 软件默认使用英文  然后，通过 t`english` 转成中文
* packages/web/src/i18n.json 不用修改。后续我会提供一个脚本来自动生成 i18n.json 文件。

## 开发逻辑

### 类型安全
* 尽量使用 TypeScript 的类型系统来确保代码的类型安全。尽量少使用any类型。
* packages/core/src/shared/types.mts 定义了常用的类型，包括前端和后端交互的类型，确保前后端的数据结构一致。
* 使用 Zod schema 进行数据验证，通过 zod-to-json-schema 转换为 JSON Schema 用于前端表单生成。

### 前后端通信
* 前端发送消息给后端，默认通过  packages/core/src/command.mts 实现，前端通过调用 call 的方法来实现与后端的交互。
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


## 记忆

- [x] 我现在要改造这个hyperchat项目，以前都用在web浏览器前端发出llm请求通过OpenAI的库。现在我想改成在code目录下(nodejs环境)中通过ai库发请求，代码在packages/core/src/shared/ai.mts 。前后端共用
- [x] 工作区概念已经实现，支持在不同工作区之间隔离数据和配置，支持显示当前工作区文件夹（树状），agent等配置作为文件保存在.hyperchat目录下。
- [x] 核心工作区管理类 (workspace.mts, workspaceManager.mts)
- [x] Schema2Form组件系统已完成，支持JSON Schema转Ant Design表单，包括双模式编辑（表单/JSON）和Monaco编辑器集成
- [x] AI配置管理系统已完成，支持多提供商管理、模型配置、API Key管理，集成到应用设置中
- [x] 应用设置系统采用Schema驱动的UI生成，支持复杂对象、数组、条件schema等

### 核心组件架构

#### Schema2Form 系统
- **packages/web/src/components/Schema2Form.tsx** - 主组件，支持表单和JSON编辑器双模式切换
- **packages/web/src/components/Schema2FormItems.tsx** - 表单项渲染组件，支持复杂JSON Schema
- **packages/web/src/components/AppSettings.tsx** - 应用设置页面，使用Schema2Form渲染配置界面

#### AI配置管理
- **packages/core/src/shared/jsonSchemas/appSettingsSchema.mts** - 应用设置的Zod schema定义


#### 关键设计决策
- KnownProvider 枚举包含 "unknown" 选项，用于未知提供商
- 移除联合类型，统一使用枚举类型确保类型安全
- Schema2FormItems 支持数组、对象、条件schema、Record类型等复杂结构
- API Keys 采用固定提供商列表展示，避免动态键值对的复杂性

#### 已知问题与解决方案
- **复杂对象数组显示问题** - 通过检测 itemSchema.type === 'object' 来决定是否使用 Schema2FormItems 递归渲染
- **Record类型渲染问题** - 为 builtinApiKeys 字段提供专门的固定键列表渲染逻辑
- **版本号显示问题** - 在 AppSettingsManager 中正确设置 CONST.getVersion 等系统信息
- **TypeScript类型错误** - 统一使用枚举类型，避免联合类型导致的类型推断问题

#### 测试与验证
- 确保所有表单字段都能正确显示和编辑
- 验证 JSON Schema 验证规则正确应用
- 测试双模式（表单/JSON）数据同步
- 确保 Monaco 编辑器语法高亮和错误提示正常

### 已完成的架构重构 ✅

#### AppSettings 架构重构 (完成)
- **DesktopSchema 分离**: 将 `closeAction` 和 `windowSize` 从 `SystemSchema` 分离到新的 `DesktopSchema`
- **前端支持**: 在 `AppSettings.tsx` 中添加了独立的 "Desktop" 选项卡
- **Context 更新**: `AppSettingsContext.tsx` 添加了 `desktop` 属性和 `updateDesktop` 函数
- **类型安全**: 修复了所有 TypeScript 错误，保持完整的类型支持

#### WorkspaceSettings 架构重构 (完成)
- **Schema 分离**: 创建 `packages/core/src/shared/jsonSchemas/workspaceSettingsSchema.mts`
  - 包含 `WorkspaceAppearanceSchema`, `WorkspaceEditorSchema`, `WorkspaceAISchema`, `WorkspaceAdvancedSchema`
  - 提供完整的类型定义和验证函数
- **实现迁移**: 创建 `packages/core/src/data/workspaceSettingsManager.mts`
  - `WorkspaceSettingsManager` 类封装所有设置管理逻辑
  - JSON Schema 生成和文件操作
- **引用更新**: 更新了所有相关文件的导入和类型引用
- **命名冲突解决**: 使用 `WorkspaceDetailedSettings` 避免与现有类型冲突

#### Schema2FormItems 组件修复 (完成)
- **TypeScript 错误修复**: 解决了所有类型断言和 spread 操作的错误
- **代码清理**: 移除了未使用的导入和变量

### 架构优势
- **分离关注点**: JSON Schema 与业务逻辑分离
- **统一管理**: 所有 Schema 集中在 `shared/jsonSchemas` 目录
- **数据管理**: 所有管理器类集中在 `data` 目录
- **类型安全**: 保持完整的 TypeScript 类型支持
- **前端集成**: Schema2Form 自动生成 UI 界面

### 2.0 TODO
- [ ] 减少any使用，多使用这个文件定义的类型 packages/core/src/shared/types.mts
- [ ] 完善 Schema2Form 组件的单元测试
- [ ] 优化 AI 配置管理的性能，考虑大量模型时的加载优化
- [ ] 为 WorkspaceSettings 添加前端配置界面


2.0 版本的 HyperChat 项目结构如下：

```
# 工作区如下

/projects/
    project1/
        .hyperchat/
        ├── mcp.json                     // (MCP) 配置文件
        ├── ai_models.json               // AI 模型配置文件，包含所有可用的 AI 模型信息
        ├── agents/
        │   ├── agent1-key/
        │   │   ├── memory.md            # Agent记忆
        │   │   ├── sub_agents/          # <sub_agents>子代理文件夹（类似 agents 文件夹）
        │   │   ├── agent.yaml           # Agent配置
        │   │   └── chatlogs/            # 聊天记录文件夹
        │   │       ├── chat1.yaml
        │   │       ├── chat2.yaml
        │   │       └── ...
        │   ├── agent2-key/
        │   │   ├── agent.yaml
        │   │   └── chatlogs/
        │   │       └── ...
        │   └── ...
        └── ...


# 全局 HyperChat 配置和数据存储在 ~/Documents/HyperChat/ 目录下，结构如下：

~/Documents/HyperChat/

    .hyperchat/
    ├── mcp.json                     // 全局主控程序 (MCP) 配置文件
    ├── ai_models.json               // AI 模型配置文件，包含所有可用的 AI 模型信息
    ├── agents/
    │   ├── agent1-key/
    │   │   ├── memory.md            # Agent记忆
    │   │   ├── sub_agents/          # <sub_agents>子代理文件夹（类似 agents 文件夹）
    │   │   ├── agent.yaml           # Agent配置
    │   │   └── chatlogs/            # 聊天记录文件夹
    │   │       ├── chat1.yaml
    │   │       ├── chat2.yaml
    │   │       └── ...
    │   ├── agent2-key/
    │   │   ├── agent.yaml
    │   │   └── chatlogs/
    │   │       └── ...
    │   └── ...
    └── ...

```