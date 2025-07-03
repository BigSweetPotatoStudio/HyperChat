[中文](README.zh.md) | [English](README.md)


# HyperChat

> 🚀 **HyperChat 2.0** - The evolution from manual coding to AI collaborative development

HyperChat is an open-source, multi-platform AI chat client that fully supports MCP (Model Context Protocol) and integrates various large language model APIs to provide users with the best AI chat experience and productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

## 🎯 Project Vision

**[HyperChat 1.0](./archive/README.1.md)** is a completely manually written project that showcases the fine craftsmanship of traditional software development.

**HyperChat 2.0** marks a shift towards the **Vibe Coding** development model, recommending the use of AI tools such as Claude Code and GitHub Copilot to accelerate the development process, embodying a new era of AI collaborative development.

## ✨ Key Features

- 🌐 **Multi-platform Support**: Web, Electron desktop application, command line, VSCode plugin
- 🤖 **Multi-model Integration**: Supports OpenAI, Claude, Gemini, Qwen, Deepseek, GLM, Ollama, xAI, etc.
- 🔧 **Complete MCP Support**: Highly extensible, supports various MCP plugins
- 💬 **Intelligent Chat**: Supports Artifacts, SVG, HTML, Mermaid rendering
- 🎨 **Modern UI**: Supports dark mode, multiple languages (Chinese and English)
- 📊 **Productivity Tools**: Scheduled tasks, Agent system, knowledge base, RAG support

## 🚀 Quick Experience

### Online Demo
- [HyperChat](https://hyperchat.dadigua.men/123456/) - Node.js version
- [Docker Demo](https://htmivlknrjln.ap-northeast-1.clawcloudrun.com/123456/#/Chat) - ClawCloud deployment

### Command-line Quick Start
```bash
npx -y @dadigua/hyper-chat
```
Default access: http://localhost:16100/123456/ (Password: 123456)

### Docker Deployment
```bash
docker pull dadigua/hyperchat-mini:latest
```

## 🛠️ Technical Architecture

```
HyperChat/
├── packages/
│   ├── core/           # Node.js core functionality
│   │   └── src/
│   │       └── shared/ # Shared code and logic
│   ├── web/            # Web frontend implementation
│   ├── electron/       # Electron desktop application
│   └── cli/            # Command line interface
└── docs/               # Documentation
```

**Communication Architecture:**
- Frontend and backend communicate through `packages/core/src/command.mts`
- Electron provides additional interfaces through `packages/electron/src/command.mts`
- AI requests are processed uniformly through `packages/core/src/shared/ai.mts`

## 🎮 Core Features

### 🤖 AI Model Support
| Model                  | Recommendation | Remarks               |
|-----------------------|----------------|-----------------------|
| Claude                | ⭐⭐⭐⭐⭐⭐        | Best choice           |
| OpenAI                | ⭐⭐⭐⭐⭐         | Perfect support for multi-step function calls |
| Gemini Flash 2.5     | ⭐⭐⭐⭐⭐         | Excellent performance  |
| Qwen                  | ⭐⭐⭐⭐          | Excellent Chinese performance |
| Deepseek              | ⭐⭐⭐⭐          | Significant recent improvements |
| Doubao                | ⭐⭐⭐           | Stable performance     |

### 🛡️ Advanced Features
- ✅ **Multi-platform Support**: Windows + macOS + Linux
- ✅ **WebDAV Sync**: Supports incremental synchronization, fast syncing based on hash
- ✅ **HyperPrompt Syntax**: Supports variables (text + JS code), syntax checking + hover preview
- ✅ **Smart Agent**: Allows preset prompts, selecting allowed MCP
- ✅ **Scheduled Tasks**: Designated Agent for scheduled task completion
- ✅ **Mathematical Formulas**: Supports KaTeX rendering
- ✅ **Knowledge Base RAG**: Knowledge base system based on MCP
- ✅ **ChatSpace**: Supports multiple conversations simultaneously
- ✅ **Model Comparison**: Allows selection of models for comparative chatting

## 📦 Environment Requirements

Ensure your system has installed:
- Node.js
- uv (recommended for Python environment management)

### Install uv
```bash
# macOS
brew install uv

# Windows
winget install --id=astral-sh.uv -e
```

### Install Node.js
```bash
# macOS
brew install node

# Windows
winget install OpenJS.NodeJS.LTS
```

## 🔧 Development Guide

### Local Development
```bash
# Install dependencies
npm install
cd packages/electron && npm install
cd packages/web && npm install

# Start development server
npm run dev
```

### AI Collaborative Development Recommendations
HyperChat 2.0 recommends using the following AI tools to enhance development efficiency:

- **Claude** - Code generation and refactoring
- **GitHub Copilot** - Intelligent code completion
- **Vibe Coding** - AI collaborative development model

## 🌟 Future Plans

- [ ] Multi-Agent Interaction System
- [ ] More MCP plugin support
- [ ] Performance optimization and user experience enhancement
- [ ] Mobile application support

## 📸 Feature Showcase

### Super Input and Variable Support
Supports text + JS code variables, basic syntax checking + real-time hover preview

### Model Comparison Chat
Supports selection of different models for testing comparisons

### MCP Tool Invocation
Supports direct invocation of tools by clicking tool names, dynamically modifying LLM call parameters

### Diversified Rendering
Supports various content rendering such as Artifacts, SVG, HTML, Mermaid, etc.

## 🤝 Community Engagement

- [Telegram](https://t.me/dadigua001)
- [QQ Group](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

## 📄 Disclaimer

This project is for learning and communication purposes only. Any operations (such as crawling behaviors) conducted with this project are unrelated to the project developers.

## 📜 License

This project is licensed under an open-source license; details can be found in the [LICENSE](LICENSE) file.

---

**HyperChat** - Making AI chat smarter and development more efficient 🚀