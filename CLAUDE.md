# 请回复中文

## 项目概述

HyperChat 是一个多平台的 AI 聊天应用，该项目拥有完善的 MCP（模型上下文协议） 支持，并集成了包括 OpenAI、Claude、Gemini、Qwen、Deepseek 等在内的多种大语言模型 API。

* 核心是nodejs
* 支持web前端，通过浏览器访问，支持h5。
* 支持electron，相当于自带了浏览器。
* 支持命令行前端，类似Claude Code。只能聊天，配置通过web前端完成。
* 支持vscode插件，通过webview访问构建。

packages/core 专注于 Node.js 相关的功能
packages/electron 专门处理 Electron 桌面应用的需求。
packages/web 专注于 Web 前端的实现
packages/cli 专注于命令行前端的实现


## 前后端通信

* 前后端通信默认通过  packages/core/src/command.mts 实现，前端通过调用 call 的方法来实现与后端的交互。
* electron web环境 提供更多electron接口 packages/electron/src/command.mts， 前端通过调用 callElectron  的方法来实现与后端的交互。


## 记忆

[x] 我现在要改造这个hyperchat项目，以前都用在web浏览器前端发出llm请求通过OpenAI的库。现在我想改成在code目录下(nodejs环境)中通过ai库发请求，代码在packages/core/src/shared/ai.mts 。前后端共用