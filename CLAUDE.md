# 请回复中文

## typescript使用指南
* import .mts 文件时，使用 import { xxx } from './xxx.mjs' 的方式导入。

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


* 尽量使用 TypeScript 的类型系统来确保代码的类型安全。尽量少使用any类型。
* packages/core/src/shared/types.mts 定义了常用的类型，包括前端和后端交互的类型，确保前后端的数据结构一致。
* 前端发送消息给后端，默认通过  packages/core/src/command.mts 实现，前端通过调用 call 的方法来实现与后端的交互。
* electron提供更多electron接口 packages/electron/src/command.mts， 前端通过调用 callElectron 的方法来实现与electron的交互。
* 后端发送消息给前端是通过websocket实现的 packages/core/src/message_service.mts，前端通过监听 websocket 的消息来接收后端发送的消息。


## 记忆

- [x] 我现在要改造这个hyperchat项目，以前都用在web浏览器前端发出llm请求通过OpenAI的库。现在我想改成在code目录下(nodejs环境)中通过ai库发请求，代码在packages/core/src/shared/ai.mts 。前后端共用
- [x] 工作区概念已经实现，支持在不同工作区之间隔离数据和配置，支持显示当前工作区文件夹（树状），agent等配置作为文件保存在.hyperchat目录下。

### 2.0 工作区实现状态
- [x] 核心工作区管理类 (workspace.mts, workspaceManager.mts)


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