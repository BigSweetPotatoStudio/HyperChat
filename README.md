[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is a Chat client that pursues openness, capable of using APIs from various LLM providers, fully supports MCP, and aims to provide the best Chat experience. It also features productivity MAX tools based on native Agent implementation.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

* Supports OpenAI-style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation and configuration, one-click installation, and welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCP, just fill in `command`, `args`, `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Run from command line: `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access at http://localhost:16100/123456/
- [x] Docker 
    * Command line version: `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension market + third-party MCP support
- [x] Supports free creation and design of `Agent`, can preset prompts and select MCP features
- [x] Supports dark mode 🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error capture, and opens Chrome's console
- [x] Optimized Agent display, supports search, drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering adds highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] Added `RAG`, based on MCP knowledge base
- [x] Introduced the concept of ChatSpace, supports multiple dialogues concurrently
- [x] Supports Agent Call Agent via HyperAgent's MCP
- [x] Added scheduled tasks to specify Agents to complete tasks at scheduled times and check task completion status.

### TODO:

- [ ] Future updates will include a Docker version with built-in Linux desktop, built-in Chrome configuration for remote ports, unified environment for easier usage, and web interface control. It will be usable on any device, including phones. 🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement LLM to write its own MCP.

### LLM

| LLM      | Usability   | Notes                         |
| -------- | -------- | --------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | Need not explain                    |
| openai   | ⭐⭐⭐⭐⭐ | Also perfectly supports multi-step function calls (gpt-4o-mini can also) |
| gemini flash 2.0   | ⭐⭐⭐⭐🌙 | Very usable |
| qwen       | ⭐⭐⭐⭐🌙    | Very usable                 |
| doubao       | ⭐⭐⭐🌙🌙    | Feels okay to use                   |
| deepseek | ⭐⭐⭐🌙🌙      | Multi-step function calls may have issues       |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line or download from the official website, [nodejs](https://nodejs.org/en)
```
# MacOS
brew install node
# Windows
winget install OpenJS.NodeJS.LTS
```

## Development

```
cd electron && npm install
cd web && pnpm install
npm install
npm run dev
```

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Supports clicking tool names for direct debugging
![image](https://github.com/user-attachments/assets/4af1b769-de19-4cab-8a90-7f701b9a8d70)

#### MCP allows prompt + dynamically modify LLM call Tool parameters
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### Call terminal MCP to automatically analyze asar files + help with extraction
![image](https://github.com/user-attachments/assets/16c0dba7-ae62-4261-a068-1217b5e9bd3c)

#### Open the terminal view
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)

#### Gaode Map MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### One-click webpage creation and publish to (cloudflare)
![image](https://github.com/user-attachments/assets/e869b8ab-a430-4f22-a2db-d4ef8e6f36a4)

#### Call Google Search to ask what the TGA Game of the Year is
![image](https://github.com/user-attachments/assets/f8f36547-dfcb-423a-8d83-f53234b0d94a)

#### What are the free games available for a limited time, please visit the website and call the tool
![image](https://github.com/user-attachments/assets/6d4c4144-2749-4d03-9824-9ead5c37bc51)

#### Help you open webpages, analyze results, and write to files
![image](https://github.com/user-attachments/assets/302bda76-dcbf-4a4d-bfb4-39f3a911434b)

#### Use web tools + command line tools to open GitHub README for learning + GIT clone + set up development environment
![image](https://github.com/user-attachments/assets/6affd3dd-aa8e-4429-9c70-d456e5376786)

#### Scheduled task list
![image.png](./images/image52.png)

#### Install third-party MCP (supports any MCP)
![image.png](./images/image44.png)

#### Third-party MCP installation interface
![image](https://github.com/user-attachments/assets/06b1b2d4-e368-45f2-ac81-b9080838f9f5)

#### MCP list (can be selected dynamically)
![image](https://github.com/user-attachments/assets/ce98f964-dfd4-4c48-bfab-286db035ca23)

#### Render HTML, supports `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, testing model capabilities
![image.png](./images/image48.png)

#### Knowledge Base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any activities, such as crawling behaviors, etc., it has nothing to do with the developers of this project.