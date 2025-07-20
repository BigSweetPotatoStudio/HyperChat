[中文](README.zh.md) | [English](README.md)


# HyperChat

> 🌟 **Next Generation AI Workspace** - Pioneering AI as Code Implementation, Configuration-Driven Intelligent Collaboration Platform

HyperChat 2.0 is a revolutionary multi-platform AI workspace that pioneers the **"AI as Code"** concept. Built around **Workspace** and driven by **Configuration Files**, it fully supports the **MCP (Model Context Protocol)** ecosystem. Making AI capabilities **version-controllable, reproducible, and shareable** like infrastructure, creating a truly intelligent development and working environment.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


## 🎯 Project Vision

**[HyperChat 1.0](./archive/README.1.md)** is a completely manually coded project, currently migrating to version 2.0.

**HyperChat 2.0** invites everyone to **Vibe Coding**, and encourages the use of AI tools like Claude Code and GitHub Copilot for development. Here is the project introduction:

## 🎯 Core Philosophy

### 🗂️ AI as Code: Configuration-Driven Intelligence Revolution
HyperChat 2.0 pioneers the **"AI as Code"** concept, making AI capabilities fully configurable:

- **Complete Configuration**: All AI capabilities defined through YAML/JSON configuration files
- **Version Control Friendly**: AI configurations can be managed with Git, supporting branching, merging, rollback
- **Team Collaboration Standardization**: Share Agent configurations, replicate best practices
- **Project Templating**: Different project types have dedicated AI environment templates
- **Declarative Management**: Modify configuration files to change AI behavior without programming

### 🔌 Workspace-Driven Intelligent Collaboration
HyperChat 2.0 centers around the **Workspace**, closely integrating AI capabilities with your projects:

- **Project Workspace**: Each project has its own independent `.hyperchat/` configuration directory
- **Global Workspace**: System-level configuration, shareable across projects
- **Workspace Isolation**: Agent, MCP services, and chat logs are independently managed by workspace
- **Seamless Switching**: Multiple workspace tabs allow one-click switching between different project environments

### 🛠️ Deep Integration of MCP Ecosystem
As a complete implementation of the MCP protocol, HyperChat has built a robust tools ecosystem:

- **Rich Built-in MCP Services**: File system, terminal, settings management, knowledge base, etc.
- **Dynamic Tool Invocation**: Real-time loading and management of MCP tools
- **Workspace-Level Configuration**: Each workspace can configure different MCP services
- **Debug-Friendly**: Visualized tool invocation process, supporting parameter debugging

## ✨ Core Features

### 🏢 Unified Experience Across Platforms
- 🌐 **Web Application**: Access directly from the browser, supporting H5 mobile
- 💻 **Electron Desktop**: Native application experience with full functionality support
- ⌨️ **Command-Line Interface**: Claude Code-like terminal experience with full AI capabilities
- 🔧 **VSCode Plugin**: IDE integrated with WebView

### ⌨️ Powerful CLI Features
- **Direct AI Chat**: `hyperchat "your question"` - Instant AI responses
- **Agent Management**: Create, list, delete, and chat with specialized AI agents
- **Workspace Integration**: Automatic workspace detection and management
- **Task Automation**: Schedule and trigger automated tasks with agents
- **Interactive & Quick Mode**: Both interactive chat and one-shot commands
- **Service Management**: Start web server or run background services
- **Cross-Platform**: Works on Windows, macOS, and Linux

### 📄 Everything as Configuration
- **Transparent & Controllable**: All AI behaviors have corresponding configuration files, completely visible and controllable
- **Version Management**: AI configurations support Git version control with traceable change history
- **Team Sharing**: Agent configurations and workflow templates can be standardized and reused across teams
- **Template Ecosystem**: Different tech stacks have dedicated AI environment configuration templates
- **Configuration as Documentation**: YAML configuration files serve as the best documentation and specifications

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
# Install globally
npm install -g @dadigua/hyperchat

# Or run directly
npx -y @dadigua/hyperchat
```

#### CLI Usage Examples
```bash
# Start web interface
hyperchat serve                        # Access: http://localhost:16102

# Run core services (background)
hyperchat run                          # Run without web interface

# Quick AI chat
hyperchat "Hello, how are you?"        # Direct chat with default model
hyperchat chat "Write a Python script" # Chat command
hyperchat chat                         # Interactive chat mode

# Agent management and chat
hyperchat agent list                   # List all agents
hyperchat agent create mybot           # Create new agent
hyperchat agent delete mybot           # Delete agent
hyperchat agent mybot "Hello"          # Quick chat with specific agent
hyperchat agent mybot chat             # Interactive chat with agent

# Workspace management
hyperchat workspace create             # Create workspace in current directory

# Task management (scheduled automation)
hyperchat task list                    # List all tasks
hyperchat task create "daily-report" --description "Generate daily report" --agent mybot --cron "0 9 * * *"
hyperchat task trigger "daily-report"  # Manually trigger task
hyperchat task stats                   # Show task statistics

# Global options
hyperchat chat --workspace /path/to/project  # Use specific workspace
hyperchat --verbose chat "Hello"             # Verbose logging
hyperchat --help                             # Show help
```

### Docker Deployment
```bash
docker pull dadigua/hyperchat-mini:latest
```

## 🛠️ Technical Architecture

### 📂 Project Structure
```
HyperChat/
├── packages/
│   ├── shared/            # Shared code and type definitions
│   ├── core/              # Node.js core service + CLI
│   │   ├── src/workspace/ # Workspace management system
│   │   ├── src/mcp/       # MCP service implementation
│   │   ├── src/cli/       # Command line interface
│   │   └── src/commands/  # API command layer
│   ├── web/               # React Web front-end
│   └── electron/          # Electron desktop application
└── docs/                  # Complete documentation
```

### 🏗️ AI as Code Architecture
```
Project Directory/
├── .hyperchat/           # AI capabilities configuration (version controllable)
│   ├── workspace.json    # Workspace configuration
│   ├── mcp.json         # MCP service configuration (Tools as Code)
│   ├── ai_models.json   # AI model configuration
│   ├── tasks/           # Workflow configuration (Workflow as Code)
│   │   ├── daily-report.yaml  # Automated task definition
│   │   └── code-review.yaml   # Code review workflow
│   └── agents/          # AI agent configuration (AI as Code)
│       ├── frontend-expert/
│       │   ├── agent.yaml      # Agent capability definition
│       │   ├── memory.md       # Persistent memory
│       │   └── chatlogs/       # Conversation history
│       ├── backend-optimizer/
│       └── security-scanner/
├── .git/                # Code version control
├── .gitignore
└── README.md

# Global Template Library
~/Documents/HyperChat/
├── .hyperchat/          # Global configuration
└── templates/           # Project templates
    ├── react-project/   # React project AI environment
    ├── python-ml/       # Python ML project AI environment
    └── golang-api/      # Go API project AI environment
```

### 🔄 Configuration-Driven Architecture
- **Configuration Parser**: Automatically parse YAML/JSON configurations with real-time effect
- **Unified Command Layer**: `packages/core/src/command.mts` handles front-end and back-end communication
- **AI Service Layer**: `packages/shared/src/ai.mts` unifies AI model calls across platforms
- **Workspace Management**: `packages/core/src/workspace/` provides configuration-driven workspace management
- **MCP Integration**: `packages/core/src/mcp/` implements complete MCP protocol support
- **Real-Time Communication**: WebSocket supports real-time message pushing and configuration hot-reload

## 🌟 Revolutionary Advantages of AI as Code

### 🔄 Manage AI Like Managing Code
```bash
# AI configurations are also version controllable
git add .hyperchat/agents/code-reviewer/
git commit -m "Add TypeScript-specific code review Agent"
git push origin feature/new-agent

# Share team AI best practices
git clone https://github.com/team/ai-templates.git
cp -r ai-templates/react-expert/.hyperchat ./

# Rollback AI configurations
git checkout HEAD~1 -- .hyperchat/agents/
```

### 📋 Configuration as Documentation
```yaml
# .hyperchat/agents/frontend-expert/agent.yaml
name: "Frontend Architecture Expert"
description: "AI assistant specialized in React, TypeScript, performance optimization"
modelKey: "claude-3-5-sonnet"
isConfirmCallTool: false
allowMCPs: ["filesystem", "terminal", "knowledge-base"]
prompt: |
  You are a senior frontend architect specializing in:
  1. React 18+ best practices and performance optimization
  2. TypeScript type system design
  3. Modern frontend engineering toolchains
  4. Responsive design and mobile adaptation
  
  Working principles:
  - Prioritize performance and maintainability
  - Follow team coding standards
  - Provide actionable specific recommendations
tags: ["frontend", "react", "typescript", "performance"]
```

### 🚀 Project Template Standardization
```bash
# Quickly initialize React project AI environment
hyperchat workspace create
cp -r ~/.hyperchat/templates/react-enterprise/.hyperchat ./

# Instantly get:
# ✅ Frontend development expert Agent
# ✅ Code review automation workflow
# ✅ Performance monitoring tasks
# ✅ Documentation generation workflow
```

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

### ⚠️ Important Windows Requirements

**Windows users MUST use Node.js version 20.19.1** due to native module compilation requirements (specifically node-pty).

```bash
# Install specific Node.js version on Windows
nvm install 20.19.1
nvm use 20.19.1

# Or download directly from Node.js official website
# https://nodejs.org/dist/v20.19.1/
```

#### Windows Native Dependencies

HyperChat depends on `node-pty` for terminal functionality, which requires:

1. **Visual Studio Build Tools**: For C++ compilation
2. **Python**: For node-gyp
3. **Windows SDK**: For native module building

**Installation recommendations:**
- Read the official [node-pty installation guide](https://github.com/microsoft/node-pty#dependencies) for detailed Windows setup
- Consider using **Windows Subsystem for Linux (WSL)** for easier development environment setup
- Install Visual Studio Build Tools from [Microsoft Visual Studio](https://visualstudio.microsoft.com/build-tools/)

**If you encounter compilation errors:**
```bash
# Install windows-build-tools (may be needed for older systems)
npm install --global windows-build-tools

# Or use chocolatey
choco install visualstudio2019buildtools
```

For detailed troubleshooting, please refer to:
- [node-pty GitHub Repository](https://github.com/microsoft/node-pty)
- [Node.js native addons documentation](https://nodejs.org/api/addons.html)

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

### 🏗️ AI as Code Development Model
1. **Initialize Project AI Environment**: `hyperchat workspace create`
2. **Choose Project Template**: Copy corresponding tech stack AI configuration templates
3. **Customize Agent Configuration**: Edit YAML files to define dedicated AI assistants
4. **Version Control AI Configuration**: Include `.hyperchat/` in Git management
5. **Share Team Best Practices**: Share and synchronize AI workflows through Git
6. **Continuous Optimization Iteration**: Optimize AI configurations like refactoring code

## 🌟 Development Roadmap

### 🎯 Short-Term Goals
- [ ] **AI Configuration Template Marketplace**: Community-shared Agent and workflow templates
- [ ] **Intelligent Configuration Recommendations**: Auto-recommend AI configurations based on project characteristics
- [ ] **Multi-Agent Collaboration Orchestration**: Configuration-based Agent collaboration workflows
- [ ] **Deep VSCode Integration**: AI as Code development experience within IDE
- [ ] **Configuration Compliance Checking**: Security and compliance validation for AI configurations

### 🚀 Long-Term Vision
- [ ] **AI as Code Standards**: Drive industry AI configuration standardization
- [ ] **Enterprise-Grade AI Governance**: Auditable, compliant AI configuration management
- [ ] **AI Capability Marketplace**: Standardized AI capability trading and distribution platform
- [ ] **Intelligent Configuration Generation**: AI automatically generates and optimizes AI configurations
- [ ] **Full-Stack AI Development Platform**: Unified platform for Infrastructure as Code + AI as Code

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

## 🔥 Why Choose HyperChat 2.0?

### 🎯 Traditional AI Tools vs HyperChat 2.0

| Feature | Traditional AI Tools | HyperChat 2.0 |
|---------|---------------------|---------------|
| **AI Configuration** | Online interface setup | Local configuration files (AI as Code) |
| **Version Control** | ❌ No version control | ✅ Git management, rollback, branching |
| **Team Collaboration** | ❌ Hard to share configurations | ✅ Standardized team AI environment |
| **Project Integration** | ❌ Separated from projects | ✅ AI configurations travel with project |
| **Transparency** | ❌ AI behavior black box | ✅ Completely transparent and controllable |
| **Reproducibility** | ❌ Hard to replicate configurations | ✅ One-click complete AI environment replication |

### 💡 Core Value Propositions

1. **Manage AI capabilities like code** - Version control, code review, CI/CD
2. **Team AI standardization** - New employees instantly get team AI best practices
3. **Project AI integration** - AI configurations coexist with project code
4. **Complete transparency and control** - Every AI behavior has corresponding configuration file
5. **Enterprise-grade AI governance** - Auditable AI configuration change history

---

✨ **HyperChat 2.0** - Pioneering AI as Code, redefining how we work with AI ✨