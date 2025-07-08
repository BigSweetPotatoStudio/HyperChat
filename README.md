[中文](README.zh.md) | [English](README.md)


# HyperChat

> 🌟 **Next Generation AI Workspace** - An intelligent collaboration platform based on the workspace concept and MCP ecosystem

HyperChat 2.0 is a revolutionary multi-platform AI workspace designed with the core concept of **Workspace**, fully supporting the **MCP (Model Context Protocol)** ecosystem, allowing AI to deeply integrate with your projects to create a truly intelligent development and working environment.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


## 🎯 Project Vision

**[HyperChat 1.0](./archive/README.1.md)** is a completely manually coded project, currently migrating to version 2.0.

**HyperChat 2.0** invites everyone to **Vibe Coding**, and encourages the use of AI tools like Claude Code and GitHub Copilot for development. Here is the project introduction:

## 🎯 Core Philosophy

### 🗂️ Workspace-Driven Intelligent Collaboration
HyperChat 2.0 centers around the **Workspace**, closely integrating AI capabilities with your projects:

- **Project Workspace**: Each project has its own independent `.hyperchat/` configuration directory
- **Global Workspace**: System-level configuration, shareable across projects
- **Workspace Isolation**: Agent, MCP services, and chat logs are independently managed by workspace
- **Seamless Switching**: Multiple workspace tabs allow one-click switching between different project environments

### 🔌 Deep Integration of MCP Ecosystem
As a complete implementation of the MCP protocol, HyperChat has built a robust tools ecosystem:

- **Rich Built-in MCP Services**: File system, terminal, settings management, knowledge base, etc.
- **Dynamic Tool Invocation**: Real-time loading and management of MCP tools
- **Workspace-Level Configuration**: Each workspace can configure different MCP services
- **Debug-Friendly**: Visualized tool invocation process, supporting parameter debugging

## ✨ Core Features

### 🏢 Unified Experience Across Platforms
- 🌐 **Web Application**: Access directly from the browser, supporting H5 mobile
- 💻 **Electron Desktop**: Native application experience with full functionality support
- ⌨️ **Command-Line Interface**: Terminal experience similar to Claude Code
- 🔧 **VSCode Plugin**: IDE integrated with WebView

### 🤖 AI Capability Matrix
- **Multi-Model Support**: OpenAI, Claude, Gemini, Qwen, Deepseek, GLM, Ollama, xAI, etc.
- **Intelligent Agent System**: Assign preset prompts and select allowed MCP tools
- **Scheduled Task Execution**: Specify Agent to complete tasks on schedule
- **Model Comparison Chatting**: Simultaneously use multiple models for comparison testing

### 🎨 Modern Interface
- **Tab Workspace**: Intuitive management of multiple workspaces
- **Smart Rendering**: Supports Artifacts, SVG, HTML, Mermaid, mathematical formulas
- **Dark Mode**: Eye-friendly dark theme
- **Multi-Language Support**: Seamless switching between Chinese and English


## 🚀 Quick Experience 1.0

### Online Demo 1.0
- [HyperChat](https://hyperchat.dadigua.men/123456/) - Node.js version
- [Docker Demo](https://htmivlknrjln.ap-northeast-1.clawcloudrun.com/123456/#/Chat) - ClawCloud deployment

### Command Line Quick Start
```bash
npx -y @dadigua/hyper-chat
```
Default access: http://localhost:16100/123456/ (Password: 123456)

### Docker Deployment
```bash
docker pull dadigua/hyperchat-mini:latest
```

## 🛠️ Technical Architecture

### 📂 Project Structure
```
HyperChat/
├── packages/
│   ├── core/              # Node.js core service layer
│   │   ├── src/shared/    # Shared code between front-end and back-end
│   │   ├── src/workspace/ # Workspace management system
│   │   ├── src/mcp/       # MCP service implementation
│   │   └── src/rag/       # Knowledge base RAG system
│   ├── web/               # React Web front-end
│   ├── electron/          # Electron desktop application
│   └── cli/               # Command line interface
└── docs/                  # Complete documentation
```

### 🏗️ Workspace Architecture
```
Project Directory/
├── .hyperchat/
│   ├── workspace.json     # Workspace configuration
│   ├── mcp.json           # MCP service configuration
│   ├── ai_models.json     # AI model configuration
│   └── agents/            # Agent configurations and chat logs
│       ├── agent-name/
│       │   ├── agent.yaml      # Agent configuration
│       │   ├── memory.md       # Agent memory
│       │   └── chatlogs/       # Chat logs
│       └── ...
└── Global Workspace: ~/Documents/HyperChat/.hyperchat/
```

### 🔄 Communication Architecture
- **Unified Command Layer**: `packages/core/src/command.mts` handles front-end and back-end communication
- **AI Service Layer**: `packages/core/src/shared/ai.mts` unifies AI model calls
- **Workspace Management**: `packages/core/src/workspace/` provides workspace lifecycle management
- **MCP Integration**: `packages/core/src/mcp/` implements complete MCP protocol support
- **Real-Time Communication**: WebSocket supports real-time message pushing and status synchronization

## 🎮 Feature Matrix

### 🗂️ Workspace Features
- ✅ **Multi-Workspace Tab**: Manage multiple projects within a single interface
- ✅ **Workspace Isolation**: Configurations, Agents, and chat logs are completely isolated
- ✅ **File Tree Integration**: Browse and edit project files directly in the workspace
- ✅ **Workspace History**: Quickly access recently used workspaces
- ✅ **Global/Project Configuration**: Flexible configuration inheritance mechanism

### 🔌 MCP Ecosystem
- ✅ **Built-in MCP Services**:
  - 🗃️ **KnowledgeBase**: Intelligent knowledge base management
  - 💾 **Settings**: System settings management
  - 🖥️ **Terminal**: Execute terminal commands
  - 🔗 **Gateway**: MCP service gateway
  - 🛠️ **HyperTools**: Super toolset
- ✅ **Dynamic Service Management**: Real-time start/stop of MCP services
- ✅ **Tool Invocation Visualization**: Clearly display AI tool usage process
- ✅ **Parameter Debugging**: Supports manual debugging of MCP tool parameters

### 🤖 AI Model Matrix
| Model Provider | Recommendation | Special Features |
|----------------|----------------|------------------|
| Claude         | ⭐⭐⭐⭐⭐⭐       | Best code understanding and generation |
| OpenAI         | ⭐⭐⭐⭐⭐        | Perfect Function Calling support |
| Gemini Flash 2.5 | ⭐⭐⭐⭐⭐      | High-performance inference |
| Qwen           | ⭐⭐⭐⭐         | Excellent performance in Chinese scenarios |
| Deepseek       | ⭐⭐⭐⭐         | Expertise in code generation |
| Doubao         | ⭐⭐⭐          | Good stability |

### 🎨 Advanced Features
- ✅ **HyperPrompt Syntax**: Supports variables and JS code snippets
- ✅ **Intelligent Agent System**: Configurable prompts and tool permissions
- ✅ **Scheduled Task Execution**: Supports automated workflows
- ✅ **Multi-Modal Rendering**: Artifacts, SVG, HTML, Mermaid, mathematical formulas
- ✅ **WebDAV Sync**: Cross-device configuration synchronization
- ✅ **Model Comparison Chatting**: Parallel testing of different models' effectiveness

## 📦 Environment Requirements

Make sure your system has installed:
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

### 💻 Local Development
```bash
# Clone the project
git clone https://github.com/BigSweetPotatoStudio/HyperChat.git
cd HyperChat

# Install dependencies
npm install
cd packages/electron && npm install
cd packages/web && npm install
cd ../..

# Start the development server
npm run dev
```

### 🌟 AI Collaborative Development
HyperChat 2.0 itself is the best practice for **AI Collaborative Development**:

- **HyperChat 1.0** → Traditional manual development model
- **HyperChat 2.0** → AI-driven Vibe Coding model

Recommended development toolchain:
- 🤖 **Claude Code** - Intelligent code generation and refactoring
- 🔧 **GitHub Copilot** - Real-time code completion
- 📝 **HyperChat** - AI dialogue with project context

### 🏗️ Workspace Development Model
1. **Create Project Workspace**: Run HyperChat in the project directory
2. **Configure MCP Services**: Enable file system, terminal, and other tools as needed
3. **Set Up Dedicated Agent**: Configure specific AI assistants for the project
4. **AI Collaborative Coding**: Utilize workspace context for intelligent development

## 🌟 Development Roadmap

### 🎯 Short-Term Goals
- [ ] **Multi-Agent Collaboration**: Intelligent dialogue and task division among Agents
- [ ] **Deep Integration with VSCode**: Complete in-IDE development experience
- [ ] **MCP Plugin Store**: Community discovery and installation of MCP services
- [ ] **Mobile Adaptation**: Responsive design optimization

### 🚀 Long-Term Vision
- [ ] **AI-Native IDE**: A fully AI and workspace-based development environment
- [ ] **Team Collaboration Platform**: Shared workspaces and Agents for multiple users
- [ ] **Ecosystem Building**: An open MCP developer community
- [ ] **Intelligent Project Management**: AI-driven full lifecycle project management

## 📸 Feature Preview

### 🗂️ Workspace Tab Management
- Intuitive interface for switching between multiple workspaces
- Both global workspaces and project workspaces co-exist
- Each workspace has its own file tree, Agent, and MCP configurations

![Workspace Tab Preview](./images/7f613001-daa3-4f2e-a0b5-c3380bc0a25f.png)

### 🔌 MCP Service Ecosystem
- Rich built-in MCP services: knowledge base, terminal, settings management, etc.
- Visualized tool invocation process, supporting parameter debugging
- Workspace-level MCP configuration with flexible service combinations

### 🤖 Intelligent Agent System
- Workspace-specific Agent configurations
- Supports preset prompts and tool permissions management
- Chat logs organized by workspace and Agent

### 🎨 Multi-Modal Content Rendering
- **HyperPrompt**: Supports text + JS code variables
- **Artifacts**: Interactive code and interface previews
- **Mathematical Formulas**: KaTeX rendering support
- **Chart Support**: Mermaid, SVG, HTML, etc.

### 📊 Model Comparison Testing
- Parallel use of multiple AI models
- Real-time comparison of different models' response quality
- Supports workspace-level model configurations

## 🤝 Community Communication

- [Telegram](https://t.me/dadigua001)
- [QQ Group](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

## 📄 Disclaimer

This project is for learning and communication purposes only. Any actions taken using this project (such as crawling behaviors, etc.) are not related to the project developers.

## 📜 License

This project is under an open-source license, please refer to the [LICENSE](LICENSE) file for details.

---

✨ **HyperChat 2.0** - Redefining AI workspaces, making intelligent collaboration a reality ✨