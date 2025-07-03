# HyperChat

> 🚀 **HyperChat 2.0** - 从手工编码到 AI 协作开发的进化之路

HyperChat 是一个开源的多平台 AI 聊天客户端，完全支持 MCP（模型上下文协议），集成多种大语言模型 API，为用户提供最佳的 AI 聊天体验和生产力工具。

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

## 🎯 项目愿景

**[HyperChat 1.0](./archive/README.1.md)** 是一个完全手工编写的项目，展现了传统软件开发的精细工艺。

**HyperChat 2.0** 标志着向 **Vibe Coding** 开发模式的转变，推荐使用 Claude Code 和 GitHub Copilot 等 AI 工具来加速开发过程，体现了 AI 协作开发的新时代。

## ✨ 特色功能

- 🌐 **多平台支持**：Web、Electron 桌面应用、命令行、VSCode 插件
- 🤖 **多模型集成**：支持 OpenAI、Claude、Gemini、Qwen、Deepseek、GLM、Ollama、xAI 等
- 🔧 **完整 MCP 支持**：扩展性强，支持各种 MCP 插件
- 💬 **智能聊天**：支持 Artifacts、SVG、HTML、Mermaid 渲染
- 🎨 **现代 UI**：支持暗黑模式、多语言（中英文）
- 📊 **生产力工具**：定时任务、Agent 系统、知识库、RAG 支持

## 🚀 快速体验

### 在线 Demo
- [HyperChat](https://hyperchat.dadigua.men/123456/) - Node.js 版本
- [Docker Demo](https://htmivlknrjln.ap-northeast-1.clawcloudrun.com/123456/#/Chat) - ClawCloud 部署

### 命令行快速启动
```bash
npx -y @dadigua/hyper-chat
```
默认访问：http://localhost:16100/123456/ (密码: 123456)

### Docker 部署
```bash
docker pull dadigua/hyperchat-mini:latest
```

## 🛠️ 技术架构

```
HyperChat/
├── packages/
│   ├── core/           # Node.js 核心功能
│   │   └── src/
│   │       └── shared/ # 共享代码和逻辑
│   ├── web/            # Web 前端实现
│   ├── electron/       # Electron 桌面应用
│   └── cli/            # 命令行界面
└── docs/               # 文档
```

**通信架构：**
- 前后端通过 `packages/core/src/command.mts` 进行通信
- Electron 通过 `packages/electron/src/command.mts` 提供额外接口
- AI 请求统一通过 `packages/core/src/shared/ai.mts` 处理

## 🎮 核心功能

### 🤖 AI 模型支持
| 模型 | 推荐度 | 备注 |
|------|--------|------|
| Claude | ⭐⭐⭐⭐⭐⭐ | 最佳选择 |
| OpenAI | ⭐⭐⭐⭐⭐ | 完美支持多步 function call |
| Gemini Flash 2.5 | ⭐⭐⭐⭐⭐ | 性能优秀 |
| Qwen | ⭐⭐⭐⭐ | 中文表现优秀 |
| Deepseek | ⭐⭐⭐⭐ | 最近有显著提升 |
| Doubao | ⭐⭐⭐ | 性能稳定 |

### 🛡️ 高级特性
- ✅ **多平台支持**：Windows + macOS + Linux
- ✅ **WebDAV 同步**：支持增量同步，基于 hash 快速同步
- ✅ **HyperPrompt 语法**：支持变量（文本+JS代码），语法检测+悬停预览
- ✅ **智能 Agent**：可预设提示词，选择允许的 MCP
- ✅ **定时任务**：指定 Agent 定时完成任务
- ✅ **数学公式**：支持 KaTeX 渲染
- ✅ **知识库 RAG**：基于 MCP 的知识库系统
- ✅ **ChatSpace**：支持多对话同时进行
- ✅ **模型对比**：支持选择模型进行对比聊天

## 📦 环境要求

确保您的系统已安装：
- Node.js
- uv (推荐用于 Python 环境管理)

### 安装 uv
```bash
# macOS
brew install uv

# Windows
winget install --id=astral-sh.uv -e
```

### 安装 Node.js
```bash
# macOS
brew install node

# Windows
winget install OpenJS.NodeJS.LTS
```

## 🔧 开发指南

### 本地开发
```bash
# 安装依赖
npm install
cd packages/electron && npm install
cd packages/web && npm install

# 启动开发服务器
npm run dev
```

### AI 协作开发推荐
HyperChat 2.0 推荐使用以下 AI 工具来提升开发效率：

- **Claude** - 代码生成和重构
- **GitHub Copilot** - 智能代码补全
- **Vibe Coding** - AI 协作开发模式

## 🌟 未来规划

- [ ] 多 Agent 交互系统
- [ ] 更多 MCP 插件支持
- [ ] 性能优化和用户体验提升
- [ ] 移动端应用支持

## 📸 功能展示

### 超级输入和变量支持
支持文本+JS代码变量，基础语法检测+悬停实时预览

### 模型对比聊天
支持选择不同模型进行对比测试

### MCP 工具调用
支持点击工具名称直接调用调试，动态修改 LLM 调用参数

### 多样化渲染
支持 Artifacts、SVG、HTML、Mermaid 等多种内容渲染

## 🤝 社区交流

- [Telegram](https://t.me/dadigua001)
- [QQ 群](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

## 📄 免责声明

本项目仅供学习交流使用。使用本项目进行的任何操作（如爬虫行为等）与项目开发者无关。

## 📜 许可证

本项目采用开源许可证，详情请查看 [LICENSE](LICENSE) 文件。

---

**HyperChat** - 让 AI 聊天更智能，让开发更高效 🚀