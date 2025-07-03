# 请回复中文

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


## 前后端通信

* 前后端通信默认通过  packages/core/src/command.mts 实现，前端通过调用 call 的方法来实现与后端的交互。
* electron提供更多electron接口 packages/electron/src/command.mts， 前端通过调用 callElectron 的方法来实现与electron的交互。


## 记忆

[x] 我现在要改造这个hyperchat项目，以前都用在web浏览器前端发出llm请求通过OpenAI的库。现在我想改成在code目录下(nodejs环境)中通过ai库发请求，代码在packages/core/src/shared/ai.mts 。前后端共用
[ ] 正在添加工作区概念，支持在不同工作区之间隔离数据和配置如下，支持显示当前工具区文件夹（树状），agent等配置作为文件保存在.hyperchat目录下。

2.0 版本的 HyperChat 项目结构如下：

```
/projects/
├── /my_project_1/                // 项目一的工作区
│   ├── .hyperchat/               // HyperChat 在此工作区的所有配置和数据 (对项目隔离)
│   │   ├── agents/
│   │   │   ├── chats/
│   │   │   │   └── history_<uuid>.json // 此工作区内 AI Agent 的聊天历史
│   │   │   └── memory/
│   │   │       └── memory_<name>.md  // 此工作区内 AI Agent 的记忆
│   │   ├── mcp.json                   // 此工作区专属的(MCP) 配置文件 (可添加到全局配置)
│   ├── src/                      // 项目源代码
│   │   └── main.py
│   └── README.md                 // 项目说明文件
│
└── /my_project_2/                // 项目二的工作区
    ├── .hyperchat/               // 与项目一隔离的另一套 HyperChat 配置
    │   └── ... (结构同上)
    ├── data/
    └── report.docx



~/Documents/HyperChat/
├── agents/                       // <new> 的 agents.json 文件夹
│   ├── chats/
│   │   └── history_<uuid>.json  // 某个 AI Agent 的聊天历史记录
│   └── memory/
│       └── memory_<uuid>.json   // 某个 AI Agent 的记忆数据
├── mcp.json                     // 全局主控程序 (MCP) 配置文件
├── ai_models.json               // AI 模型配置文件，包含所有可用的 AI 模型信息
└── agents.json                  // <old> agents.json 文件，包含所有 AI Agent 的配置和状态
```