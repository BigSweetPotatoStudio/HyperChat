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

### 🖥️ 界面功能对比

| 功能特性 | CLI Legacy 模式 | CLI Ink 模式 | Web 界面 |
|---------|----------------|-------------|---------|
| **UI 样式** |
| 界面风格 | 📟 传统命令行 | 🎨 现代化 TUI | 🖥️ 图形界面 |
| 交互体验 | 简单文本输出 | 丰富组件渲染 | 完整 Web 体验 |
| 实时更新 | ✅ 流式输出 | ✅ 流式输出 | ✅ 流式输出 |
| **适用场景** |
| 主要用途 | 脚本集成、CI/CD | 开发调试、交互操作 | 项目管理、团队协作 |
| 使用环境 | 服务器、自动化脚本 | 开发终端、日常使用 | 桌面浏览器 |

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

#### CLI 使用示例
```bash
# 启动 Web 界面
hyperchat serve                        # 访问: http://localhost:16100

# 运行核心服务（后台）
hyperchat run                          # 不包含 Web 界面运行

# 快速 AI 聊天
hyperchat "你好，今天怎么样？"           # 直接与默认模型聊天
hyperchat chat "写一个 Python 脚本"     # 聊天命令
hyperchat chat                         # 交互式聊天模式

# Agent 管理和聊天
hyperchat agent list                   # 列出所有代理
hyperchat agent create mybot           # 创建新代理
hyperchat agent delete mybot           # 删除代理
hyperchat agent mybot "你好"           # 与特定代理快速聊天
hyperchat agent mybot chat             # 与代理交互式聊天

# 工作区管理
hyperchat workspace create             # 在当前目录创建工作区

# 任务管理（定时自动化）
hyperchat task list                    # 列出所有任务
hyperchat task create "daily-report" --description "生成日报" --agent mybot --cron "0 9 * * *"
hyperchat task trigger "daily-report"  # 手动触发任务
hyperchat task stats                   # 显示任务统计

# 全局选项
hyperchat chat --workspace /path/to/project  # 使用特定工作区
hyperchat --verbose chat "你好"             # 详细日志
hyperchat --help                             # 显示帮助

# 环境变量使用
export HYPERCHAT_WEB_PASSWORD=mypass         # 设置 Web 密码
export HYPERCHAT_LANGUAGE=en                 # 设置界面语言为英文
hyperchat serve --port 16100                  # CLI 参数覆盖环境变量
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

### 🔌 工作区驱动的智能协作
HyperChat 2.0 以**工作区（Workspace）**为核心，将 AI 能力与您的项目紧密结合：

- **项目工作区**：每个项目都有独立的 `.hyperchat/` 配置目录
- **全局工作区**：系统级配置，可跨项目共享
- **工作区隔离**：Agent、MCP 服务、聊天记录按工作区独立管理
- **无缝切换**：多工作区标签页，一键切换不同项目环境
```
HyperChat/
├── packages/
│   ├── shared/            # 共享代码和类型定义
│   ├── core/              # Node.js 核心服务 + CLI（主要平台）
│   │   ├── src/cli/       # 命令行界面（首要平台，功能最完整）
│   │   ├── src/workspace/ # 工作区管理系统
│   │   ├── src/mcp/       # MCP 服务实现
│   │   └── src/commands/  # API 命令层
│   ├── web/               # React Web 前端（基于 CLI 核心）
│   └── electron/          # Electron 桌面应用（开发中）
└── docs/                  # 完整文档
```

```
项目目录/
├── .hyperchat/           # AI 能力配置目录（可版本控制）
│   ├── workspace.json    # 工作区配置
│   ├── mcp.json         # MCP 服务配置（Tools as Code）
│   ├── ai_models.json   # AI 模型配置
│   ├── .env              # 全局 环境变量配置 
│   ├── tasks/           # 工作流配置（Workflow as Code）
│   │   ├── daily-report.yaml  # 自动化任务定义
│   │   └── code-review.yaml   # 代码审查流程
│   └── agents/          # AI 智能体配置（AI as Code）
│       ├── frontend-expert/
│       │   ├── agent.yaml      # Agent 能力定义
│       │   ├── memory.md       # 持久化记忆
│       │   └── chatlogs/       # 对话历史
│       ├── backend-optimizer/
│       └── security-scanner/
├── .git/                # 代码版本控制·
├── .gitignore
└── README.md

```

## 🌟 AI as Code 的革命性优势

### 🔄 像管理代码一样管理 AI
```bash
# AI 配置也可以版本控制
git add .hyperchat/agents/code-reviewer/
git commit -m "添加 TypeScript 专用代码审查 Agent"
git push origin feature/new-agent

# 分享团队 AI 最佳实践
git clone https://github.com/team/ai-templates.git
cp -r ai-templates/react-expert/.hyperchat ./

# 回滚 AI 配置
git checkout HEAD~1 -- .hyperchat/agents/
```

### 📋 配置即Agent
```yaml
# .hyperchat/agents/frontend-expert/agent.yaml
name: "前端架构专家"
description: "专注于 React、TypeScript、性能优化的 AI 助手"
modelKey: "claude-3-5-sonnet"
isConfirmCallTool: false
allowMCPs: ["filesystem", "terminal", "knowledge-base"]
prompt: |
  你是一位资深的前端架构师，专精于：
  1. React 18+ 最佳实践和性能优化
  2. TypeScript 类型系统设计
  3. 现代前端工程化工具链
  4. 响应式设计和移动端适配
  
  工作原则：
  - 优先考虑性能和可维护性
  - 遵循团队编码规范
  - 提供可执行的具体建议
tags: ["frontend", "react", "typescript", "performance"]
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

