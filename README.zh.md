# HyperChat

> 🌟 **下一代 AI 工作空间** - 基于工作区概念和 MCP 生态的智能协作平台

HyperChat 2.0 是一个革命性的多平台 AI 工作空间，以**工作区（Workspace）**为核心设计理念，完整支持 **MCP（模型上下文协议）**生态，让 AI 与您的项目深度融合，打造真正智能的开发和工作环境。

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


## 🎯 项目愿景

**[HyperChat 1.0](./archive/README.1.md)** 是一个完全手工编写的项目，正在迁移到2.0。

**HyperChat 2.0** 大家一起 **Vibe Coding**，欢迎使用 Claude Code 和 GitHub Copilot 等 AI 工具一起开发。下面是项目介绍：

## 🎯 核心理念

### 🗂️ 工作区驱动的智能协作
HyperChat 2.0 以**工作区（Workspace）**为核心，将 AI 能力与您的项目紧密结合：

- **项目工作区**：每个项目都有独立的 `.hyperchat/` 配置目录
- **全局工作区**：系统级配置，可跨项目共享
- **工作区隔离**：Agent、MCP 服务、聊天记录按工作区独立管理
- **无缝切换**：多工作区标签页，一键切换不同项目环境

### 🔌 MCP 生态深度集成
作为 MCP 协议的完整实现，HyperChat 打造了强大的工具生态：

- **丰富的内置 MCP 服务**：文件系统、终端、设置管理、知识库等
- **动态工具调用**：实时加载和管理 MCP 工具
- **工作区级配置**：每个工作区可配置不同的 MCP 服务
- **调试友好**：可视化工具调用过程，支持参数调试

## ✨ 核心特性

### 🏢 多平台统一体验
- 🌐 **Web 应用**：浏览器直接访问，支持 H5 移动端
- 💻 **Electron 桌面**：原生应用体验，完整功能支持
- ⌨️ **命令行界面**：类似 Claude Code 的终端体验，具备完整 AI 能力
- 🔧 **VSCode 插件**：IDE 内 WebView 集成

### ⌨️ 强大的 CLI 功能
- **直接 AI 对话**：`hyperchat "你的问题"` - 即时 AI 响应
- **Agent 管理**：创建、列出、删除和与专业化 AI 代理对话
- **工作区集成**：自动工作区检测和管理
- **任务自动化**：使用代理安排和触发自动化任务
- **交互与快速模式**：支持交互式聊天和一次性命令
- **服务管理**：启动 Web 服务器或运行后台服务
- **跨平台**：支持 Windows、macOS 和 Linux

### 🤖 AI 能力矩阵
- **多模型支持**：OpenAI、Claude、Gemini、Qwen、Deepseek、GLM、Ollama、xAI 等
- **智能 Agent 系统**：可预设提示词，选择允许的 MCP 工具
- **定时任务执行**：指定 Agent 定时完成任务
- **模型对比聊天**：同时使用多个模型进行对比测试

### 🎨 现代化界面
- **标签页工作区**：直观的多工作区管理
- **智能渲染**：Artifacts、SVG、HTML、Mermaid、数学公式支持
- **暗黑模式**：护眼的深色主题
- **多语言支持**：中英文无缝切换


## 🚀 快速体验 1.0

### 在线 Demo 1.0
- [HyperChat](https://hyperchat.dadigua.men/123456/) - Node.js 版本
- [Docker Demo](https://htmivlknrjln.ap-northeast-1.clawcloudrun.com/123456/#/Chat) - ClawCloud 部署

### 命令行快速启动
```bash
# 全局安装
npm install -g @dadigua/hyperchat

# 或直接运行
npx -y @dadigua/hyperchat
```

#### CLI 使用示例
```bash
# 启动 Web 界面
hyperchat serve                        # 访问: http://localhost:16102

# 运行核心服务（后台）
hyperchat run                          # 不启动 Web 界面

# 快速 AI 对话
hyperchat "你好，请帮我写一个Python脚本"    # 直接与默认模型对话
hyperchat chat "写一个Python脚本"         # 聊天命令
hyperchat chat                         # 交互式聊天模式

# Agent 管理和对话
hyperchat agent list                   # 列出所有代理
hyperchat agent create mybot           # 创建新代理
hyperchat agent delete mybot           # 删除代理
hyperchat agent mybot "你好"            # 与指定代理快速对话
hyperchat agent mybot chat             # 与代理交互式聊天

# 工作区管理
hyperchat workspace create             # 在当前目录创建工作区

# 任务管理（定时自动化）
hyperchat task list                    # 列出所有任务
hyperchat task create "daily-report" --description "生成日报" --agent mybot --cron "0 9 * * *"
hyperchat task trigger "daily-report"  # 手动触发任务
hyperchat task stats                   # 显示任务统计

# 全局选项
hyperchat chat --workspace /path/to/project  # 使用指定工作区
hyperchat --verbose chat "你好"               # 详细日志
hyperchat --help                             # 显示帮助
```

### Docker 部署
```bash
docker pull dadigua/hyperchat-mini:latest
```

## 🛠️ 技术架构

### 📂 项目结构
```
HyperChat/
├── packages/
│   ├── shared/            # 共享代码和类型定义
│   ├── core/              # Node.js 核心服务 + CLI
│   │   ├── src/workspace/ # 工作区管理系统
│   │   ├── src/mcp/       # MCP 服务实现
│   │   ├── src/cli/       # 命令行界面
│   │   └── src/commands/  # API 命令层
│   ├── web/               # React Web 前端
│   └── electron/          # Electron 桌面应用
└── docs/                  # 完整文档
```

### 🏗️ 工作区架构
```
项目目录/
├── .hyperchat/
│   ├── workspace.json     # 工作区配置
│   ├── mcp.json          # MCP 服务配置
│   ├── ai_models.json    # AI 模型配置
│   └── agents/           # Agent 配置和聊天记录
│       ├── agent-name/
│       │   ├── agent.yaml      # Agent 配置
│       │   ├── memory.md       # Agent 记忆
│       │   └── chatlogs/       # 聊天记录
│       └── ...
└── 全局工作区: ~/Documents/HyperChat/.hyperchat/
```

### 🔄 通信架构
- **统一命令层**：`packages/core/src/command.mts` 处理前后端通信
- **AI 服务层**：`packages/core/src/shared/ai.mts` 统一 AI 模型调用
- **工作区管理**：`packages/core/src/workspace/` 提供工作区生命周期管理
- **MCP 集成**：`packages/core/src/mcp/` 实现完整的 MCP 协议支持
- **实时通信**：WebSocket 支持实时消息推送和状态同步

## 🎮 功能矩阵

### 🗂️ 工作区功能
- ✅ **多工作区标签页**：一个界面管理多个项目
- ✅ **工作区隔离**：配置、Agent、聊天记录完全隔离
- ✅ **文件树集成**：直接在工作区内浏览和编辑项目文件
- ✅ **工作区历史**：快速访问最近使用的工作区
- ✅ **全局/项目配置**：灵活的配置继承机制

### 🔌 MCP 生态系统
- ✅ **内置 MCP 服务**：
  - 🗃️ **KnowledgeBase**：智能知识库管理
  - 💾 **Settings**：系统设置管理
  - 🖥️ **Terminal**：终端命令执行
  - 🔗 **Gateway**：MCP 服务网关
  - 🛠️ **HyperTools**：超级工具集
- ✅ **动态服务管理**：实时启动/停止 MCP 服务
- ✅ **工具调用可视化**：清晰展示 AI 工具使用过程
- ✅ **参数调试**：支持手动调试 MCP 工具参数

### 🤖 AI 模型矩阵
| 模型提供商 | 推荐度 | 特色功能 |
|------------|--------|----------|
| Claude | ⭐⭐⭐⭐⭐⭐ | 最佳代码理解和生成 |
| OpenAI | ⭐⭐⭐⭐⭐ | 完美 Function Calling 支持 |
| Gemini Flash 2.5 | ⭐⭐⭐⭐⭐ | 高性能推理 |
| Qwen | ⭐⭐⭐⭐ | 中文场景优秀表现 |
| Deepseek | ⭐⭐⭐⭐ | 代码生成专长 |
| Doubao | ⭐⭐⭐ | 稳定性良好 |

### 🎨 高级特性
- ✅ **HyperPrompt 语法**：支持变量和 JS 代码片段
- ✅ **智能 Agent 系统**：可配置提示词和工具权限
- ✅ **定时任务执行**：自动化工作流支持
- ✅ **多模态渲染**：Artifacts、SVG、HTML、Mermaid、数学公式
- ✅ **WebDAV 同步**：跨设备配置同步
- ✅ **模型对比聊天**：并行测试不同模型效果

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

### 💻 本地开发
```bash
# 克隆项目
git clone https://github.com/BigSweetPotatoStudio/HyperChat.git
cd HyperChat

# 安装依赖
npm install
cd packages/electron && npm install
cd packages/web && npm install
cd ../..

# 启动开发服务器
npm run dev
```

### 🌟 AI 协作开发
HyperChat 2.0 本身就是 **AI 协作开发**的最佳实践：

- **HyperChat 1.0** → 传统手工开发模式
- **HyperChat 2.0** → AI 驱动的 Vibe Coding 模式

推荐开发工具链：
- 🤖 **Claude Code** - 智能代码生成和重构
- 🔧 **GitHub Copilot** - 实时代码补全
- 📝 **HyperChat** - 项目上下文的 AI 对话

### 🏗️ 工作区开发模式
1. **创建项目工作区**：在项目目录运行 HyperChat
2. **配置 MCP 服务**：按需启用文件系统、终端等工具
3. **设置专属 Agent**：为项目配置特定的 AI 助手
4. **AI 协作编码**：利用工作区上下文进行智能开发

## 🌟 发展路线图

### 🎯 近期目标
- [ ] **多 Agent 协作**：Agent 间智能对话和任务分工
- [ ] **VSCode 深度集成**：完整的 IDE 内开发体验
- [ ] **MCP 插件商店**：社区 MCP 服务发现和安装
- [ ] **移动端适配**：响应式设计优化

### 🚀 长期愿景
- [ ] **AI 原生 IDE**：完全基于 AI 和工作区的开发环境
- [ ] **团队协作平台**：多人共享工作区和 Agent
- [ ] **生态系统建设**：开放的 MCP 开发者社区
- [ ] **智能项目管理**：AI 驱动的项目全生命周期管理

## 📸 功能预览

### 🗂️ 工作区标签页管理
- 直观的多工作区切换界面
- 全局工作区与项目工作区并存
- 每个工作区独立的文件树、Agent、MCP 配置

![工作区标签页预览](./images/7f613001-daa3-4f2e-a0b5-c3380bc0a25f.png)

### 🔌 MCP 服务生态
- 内置丰富的 MCP 服务：知识库、终端、设置管理等
- 可视化工具调用过程，支持参数调试
- 工作区级 MCP 配置，灵活的服务组合

### 🤖 智能 Agent 系统
- 工作区专属 Agent 配置
- 支持预设提示词和工具权限管理
- 聊天记录按工作区和 Agent 组织

### 🎨 多模态内容渲染
- **HyperPrompt**：文本 + JS 代码变量支持
- **Artifacts**：交互式代码和界面预览
- **数学公式**：KaTeX 渲染支持
- **图表支持**：Mermaid、SVG、HTML 等

### 📊 模型对比测试
- 并行使用多个 AI 模型
- 实时对比不同模型的回答质量
- 支持工作区级模型配置

## 🤝 社区交流

- [Telegram](https://t.me/dadigua001)
- [QQ 群](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

## 📄 免责声明

本项目仅供学习交流使用。使用本项目进行的任何操作（如爬虫行为等）与项目开发者无关。

## 📜 许可证

本项目采用开源许可证，详情请查看 [LICENSE](LICENSE) 文件。

---

✨ **HyperChat 2.0** - 重新定义 AI 工作空间，让智能协作成为现实 ✨