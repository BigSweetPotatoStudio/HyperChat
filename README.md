# HyperChat 中文文档

# HyperChat

> 🌟 **本地 AI Agent 平台** - 首创 AI as Code 理念，让每个项目都有专属的 AI 大脑

HyperChat 是一个革命性的**本地 AI Agent 平台**，通过**配置文件驱动**的方式，让 AI 能力完全本地化、可迁移、可版本控制。告别云端依赖，拥有真正属于自己的项目级 AI 专家。

### 🎯 核心特色
- 🏠 **完全本地化**：数据不出本地，隐私安全可控
- 🧠 **Agent记忆**：AI Agent 理解并记住你的项目上下文  
- 📁 **配置即代码**：所有 AI 能力通过文件配置，支持 Git 管理
- 🔧 **深度工具集成**：MCP 协议支持，可直接操作本地文件系统
- 📦 **一键迁移**：完整的 `.hyperchat/` 配置目录，随项目迁移

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyperchat](https://img.shields.io/npm/v/%40dadigua%2Fhyperchat)](https://www.npmjs.com/package/@dadigua/hyperchat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyperchat)](https://npm-stat.com/charts.html?package=@dadigua/hyperchat)

## 🎯 项目愿景

**[HyperChat 1.0](./archive/README.1.md)** 是一个完全手工编写的项目，正在迁移到2.0。

**HyperChat 2.0** 大家一起 **Vibe Coding**，欢迎使用 Claude Code 和 GitHub Copilot 等 AI 工具一起开发。

## 🎯 双层架构设计

> **创新的双模式架构** - 根据不同使用场景优化用户体验

### 🌐 Web 前端：多工作区协作中心
**设计理念**：项目级协作，统一资源管理

- **🗂️ 多工作区标签页管理**：同时打开多个项目工作区，一键切换
- **👥 团队协作优化**：工作区级别的 Agent 集合、MCP 服务池
- **📊 可视化管理界面**：图形化配置、实时监控、数据统计
- **💼 适用场景**：项目开发、团队协作、工作区管理、可视化操作

### 💻 CLI 前端：Agent 优先快速交互
**设计理念**：Agent 中心化，极速启动单个智能体

- **⚡ 快速启动**：直接选择 Agent，从工作区按需加载 MCP 工具
- **🎯 专注对话**：Agent 专属记忆、上下文、聊天历史
- **🔧 灵活工具链**：Agent 内置 MCP 工具，回退到工作区共享资源
- **🚀 适用场景**：快速对话、自动化脚本、命令行工作流、CI/CD 集成

### 📋 架构对比

| 功能特性 | 🌐 Web 多工作区模式 | 💻 CLI Agent 优先模式 |
|---------|---------------------|----------------------|
| **核心理念** |
| 设计中心 | 🗂️ 工作区协作中心 | 🤖 Agent 直接交互 |
| 资源管理 | 工作区统一 MCP 池 | Agent按需启动MCP |
| 使用方式 | 多标签页并发管理 | 单 Agent 快速启动 |
| **界面体验** |
| 界面风格 | 🖥️ 现代 Web 界面 | 📟 命令行 + 🎨 TUI |
| 交互模式 | 鼠标点击 + 表单操作 | 键盘输入 + 命令参数 |
| 实时更新 | ✅ SSE 流式推送 | ✅ 终端流式输出 |
| **适用场景** |
| 主要用途 | 项目开发、团队协作 | 快速对话、脚本集成 |
| 使用环境 | 桌面浏览器、开发 IDE | 终端、服务器、CI/CD |
| 工作流程 | 长期项目管理 | 临时对话处理 |

## 🚀 快速体验

### ⌨️ 命令行快速启动
```bash
# 全局安装
npm install -g @dadigua/hyperchat

# 或直接运行
npx -y @dadigua/hyperchat
```

**快速配置环境变量**：
```bash
# 基础配置 - 设置默认 AI 模型
export HyperChat_API_KEY=your-api-key           # API 密钥
export HyperChat_API_URL=your-api-url           # API 端点 URL
export HyperChat_AI_Provider=openai             # AI 提供商 (openai/claude/gemini/kimi/qwen等)
export HyperChat_AI_Model=gpt-4o                # 默认模型名称

# 然后直接使用
hyperchat "你好，世界！"                        # 使用配置的默认模型
```

### 🌐 Web 多工作区模式使用示例
```bash
# 启动多工作区 Web 界面
hyperchat serve                        # 访问: http://localhost:16100

# Web 界面功能特色：
# ✅ 多工作区标签页管理
# ✅ 每个标签页独立的 Agent 集合、MCP 服务、聊天记录
# ✅ 可视化配置和实时监控
# ✅ 团队协作和项目管理
```

### 💻 CLI Agent 优先模式使用示例
```bash
# 🚀 Agent 优先快速启动 - 核心特色
hyperchat agent list                   # 发现可用 Agent（全局 + 工作区）
hyperchat agent mybot "你好"           # 🎯 直接启动 Agent，按需加载 MCP
hyperchat agent mybot chat             # 🎯 Agent 专属对话会话

# 快速 AI 聊天（使用默认 Agent）
hyperchat "你好，今天怎么样？"           # 直接与默认模型聊天
hyperchat chat "写一个 Python 脚本"     # 聊天命令
hyperchat chat                         # 交互式聊天模式

# Agent 管理（在当前工作区或全局）
hyperchat agent create mybot           # 创建新 Agent
hyperchat agent delete mybot           # 删除 Agent

# 工作区管理
hyperchat workspace create             # 在当前目录创建工作区


# 全局选项和工作区指定
hyperchat chat --workspace /path/to/project  # 使用特定工作区
hyperchat --verbose chat "你好"             # 详细日志
hyperchat --help                            # 显示帮助

# CLI 模式优势：
# ⚡ Agent 直接启动，无需切换界面
# 🔧 按需从工作区加载 MCP 工具
# 💾 Agent 专属记忆和聊天历史
# 🚀 适合脚本集成和自动化
```

### 🔄 双模式协同工作
```bash
# 场景1：开发时 Web
hyperchat serve                       # 启动 Web 界面管理项目

# 场景2：CI/CD 自动化使用 CLI
hyperchat agent test-runner "运行所有测试并生成报告"

# 场景3：团队协作使用 Web
# 在 Web 界面中管理多个项目工作区，配置共享的 Agent 和 MCP 服务
```


### 🔧 环境变量配置

HyperChat 2.0 实现了强大的**5层优先级环境变量系统**，让配置管理更加灵活：

**优先级顺序**（从低到高）：
1. **默认值** - 代码中的内置默认配置
2. **process.env** - 系统环境变量
3. **全局 .env** - `~/Documents/HyperChat/.env`
4. **工作区 .env** - 项目目录下的 `.env` 文件
5. **CLI 参数** - 命令行传入的参数（最高优先级）

**支持的核心环境变量**：
```bash
# 快速配置 - 默认 AI 模型
HyperChat_API_KEY=your-api-key              # 默认 API 密钥
HyperChat_API_URL=your-api-url              # 默认 API 端点
HyperChat_AI_Provider=openai                # 默认 AI 提供商
HyperChat_AI_Model=gpt-4o                   # 默认模型名称


# 服务配置
HYPERCHAT_WEB_PASSWORD=your-web-password    # Web 界面访问密码
HYPERCHAT_PORT=16100                        # Web 服务端口
HYPERCHAT_HOST=localhost                    # 服务绑定地址

# 界面配置
HYPERCHAT_LANGUAGE=zh                       # 界面语言 (zh/en)
HYPERCHAT_LOG_LEVEL=info                    # 日志级别

# 自定义 API 端点
HYPERCHAT_OPENAI_BASE_URL=https://api.openai.com/v1
HYPERCHAT_CLAUDE_BASE_URL=https://api.anthropic.com
```

**使用示例**：
```bash
# 方式1：快速配置默认模型
export HyperChat_API_KEY=sk-1234567890
export HyperChat_AI_Provider=openai
export HyperChat_AI_Model=gpt-4o
hyperchat "你好"                            # 直接使用默认配置

# 方式2：Web 服务配置
export HYPERCHAT_WEB_PASSWORD=mypassword
hyperchat serve

# 方式3：项目 .env 文件
echo "HyperChat_API_KEY=your-key" > .env
echo "HyperChat_AI_Provider=claude" >> .env
hyperchat chat

# 方式4：CLI 参数（最高优先级）
hyperchat serve --password=clipass

# 方式5：全局配置文件
echo "HyperChat_API_KEY=global-key" > ~/Documents/HyperChat/.env
echo "HyperChat_AI_Provider=gemini" >> ~/Documents/HyperChat/.env
```



## 🛠️ 技术架构

### 🎯 双层架构技术实现

HyperChat 2.0 采用**双层架构设计**，根据不同使用场景提供最优化的体验：

#### 🌐 Web 层：工作区中心架构
```typescript
// Web 前端：工作区统一 MCP 管理
const workspace = workspaceManager.get(workspacePath);
const mcpManager = workspace.getMcpManager();
const client = mcpManager.getClient(clientName);
```

**技术特点**：
- 🗂️ **多工作区并发管理**：`WorkspaceManager-enhanced` 支持多个工作区实例缓存
- 🔌 **工作区级 MCP 服务池**：统一的 MCP 客户端管理
- 📊 **实时数据同步**：SSE 流式推送，多标签页独立状态管理
- 🔄**配置合并机制**：全局配置 + 工作区配置的智能合并

#### 💻 CLI 层：Agent 优先架构
```typescript
// CLI 前端：Agent 专属 MCP 访问
const agentInstance = workspace.getAgentInstance(agentName);
const client = agentInstance.getMCPClient(clientName);
// 回退到工作区共享 MCP（如果需要）
```

**技术特点**：
- ⚡ **Agent 直接启动**：省略工作区初始化，直接访问 Agent 实例
- 🔧 **工具链按需加载**：从 Agent 内置工具到工作区共享资源的渐进式加载
- 💾 **专属上下文**：Agent 独立记忆、聊天历史、配置管理
- 🚀 **极速响应**：无 UI 渲染开销，适合脚本和自动化


```
HyperChat 双层架构/
├── packages/
│   ├── shared/              # 共享代码和类型定义
│   ├── core/                # Node.js 核心服务 + CLI Agent 优先层
│   │   ├── src/cli/         # 💻 CLI Agent 直接交互层
│   │   ├── src/workspace/   # 双层工作区管理系统
│   │   │   ├── workspaceManager-enhanced.mts  # 🌐 多工作区并发管理
│   │   ├── src/mcp/         # MCP 协议实现
│   │   └── src/commands/    # Web API 命令系统
│   ├── web/                 # 🌐 React Web 多工作区层
│   │   ├── src/pages/workspace/  # 多工作区管理组件
│   │   │   ├── WorkspaceManage.tsx   # 多标签页管理器
│   │   │   └── workspace.tsx         # 单工作区实例组件
│   │   └── src/hooks/useChatStream.ts    # workspacePath 参数化
│   └── electron/            # Electron 应用封装
└── docs/                    # 双层架构文档
```

### 💼 双层架构配置管理

```
🌐 Web 多工作区模式配置：
项目目录/
├── .hyperchat/                    # 工作区统一配置目录
│   ├── mcp.json                   # 🔌 工作区级 MCP 服务池
│   ├── ai_models.json             # 🤖 工作区 AI 模型配置
│   ├── .env                       # 工作区环境变量
│   └── agents/                    # 🗂️ 工作区 Agent 集合
│       ├── project-assistant/     # 项目专用 Agent
│       │   ├── agent.yaml         # Agent 配置
│       │   ├── memory.md          # 项目上下文记忆
│       │   └── chatlogs/          # 团队对话历史
│       └── code-reviewer/         # 代码审查 Agent
├── .git/                         # 版本控制
└── package.json                  # 项目配置

💻 CLI Agent 优先模式访问：
全局配置/
~/Documents/HyperChat/
  .hyperchat/
  ├── mcp.json                     # 🌍 全局 MCP 服务池
  ├── .env                         # 全局环境变量
  └── agents/                      # 🚀 全局 Agent 库
      ├── personal-assistant/      # 个人助手 Agent
      │   ├── agent.yaml           # Agent 配置
      │   ├── memory.md            # 个人上下文记忆
      │   └── chatlogs/            # 个人对话历史
      └── code-expert/             # 专业代码 Agent
```

**双层配置的核心优势**：
- 🌐 **Web 模式**：工作区中心化，适合项目级管理和团队协作
- 💻 **CLI 模式**：Agent 中心化，支持跨项目的个人工具使用
- 🔄 **智能合并**：全局配置 + 工作区配置的 5 层优先级管理
- 💾 **数据隔离**：项目级和个人级数据完全分离，互不干扰

```

## 🌟 AI as Code 的革命性优势

### 🔄 双层架构下的智能管理

#### 🌐 Web 模式：团队协作版本控制
```bash
# 📁 项目级 AI 配置版本管理
git add .hyperchat/agents/project-assistant/
git commit -m "添加项目专用 AI 助手"
git push origin feature/project-ai

# 👥 团队 AI 最佳实践分享
git clone https://github.com/team/ai-workspace-templates.git
cp -r ai-workspace-templates/react-fullstack/.hyperchat ./

# 🔄 项目 AI 配置回滚
git checkout HEAD~1 -- .hyperchat/
```

#### 💻 CLI 模式：个人工具管理
```bash
# 🚀 快速部署个人 Agent
hyperchat agent create personal-coder --template ~/ai-templates/

# 🌍 跨项目使用个人 Agent
cd /project-a && hyperchat agent personal-coder "分析这个项目"
cd /project-b && hyperchat agent personal-coder "分析这个项目"

# 💾 Agent 记忆和上下文自动切换
# personal-coder 会记住不同项目的特点和上下文
```



### Agent 配置
```yaml
# .hyperchat/agents/project-assistant/agent.yaml
name: "项目助手"
description: "专门为本项目设计的 React + Node.js 全栈助手"
modelKey: "claude-3-5-sonnet"
isConfirmCallTool: false
# 🔌 使用工作区级 MCP 服务池
allowMCPs: ["filesystem", "git", "npm", "database"]
prompt: |
  你是本项目的专属 AI 助手，熟悉：
  - 项目架构：React + TypeScript + Node.js
  - 业务领域：电商平台开发
  - 团队规范：ESLint + Prettier + Jest
  
  请基于项目上下文提供专业建议。
tags: ["project", "fullstack", "ecommerce"]
```

```yaml
# ~/Documents/HyperChat/.hyperchat/agents/personal-coder/agent.yaml
name: "个人编程助手"
description: "跨项目的通用编程助手，支持多种技术栈"
modelKey: "gpt-4o"
isConfirmCallTool: true
# ⚡ Agent 专属 MCP 工具 + 回退到工作区
allowMCPs: ["terminal", "browser", "calculator"]
prompt: |
  你是我的个人编程助手，擅长：
  - 多语言开发：Python, JavaScript, Go, Rust
  - 架构设计和代码审查
  - 快速原型开发和问题解决
  
  根据不同项目的上下文调整回答风格。
tags: ["personal", "general", "cross-project"]
```



### 🤖 AI 模型推荐
| 模型提供商 | 推荐程度 | 特色功能 |
|------------|----------|----------|
| Claude | ⭐⭐⭐⭐⭐⭐ | 最强 |
| Kimi k2 | ⭐⭐⭐⭐⭐ | 很不错 |


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



## 🤝 社区交流

- [Telegram](https://t.me/dadigua001)
- [QQ 群](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

## 📄 免责声明

本项目仅供学习交流使用。使用本项目进行的任何操作（如爬虫行为等）与项目开发者无关。

## 📜 许可证

本项目采用开源许可证，详情请查看 [LICENSE](LICENSE) 文件。

