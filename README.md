[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open Chat client that can utilize various LLM APIs, fully supports MCP, and provides the best Chat experience. It also implements a productivity MAX tool based on native Agents.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

* Supports OpenAI style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market, user-friendly MCP installation configuration, one-click installation, and welcome submissions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs by filling in `command`, `args`, and `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line operation, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu Desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension market + third-party MCP support
- [x] Supports freely creating and designing `Agents`, preset prompts, and selecting MCP functions
- [x] Supports dark mode 🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capturing, and supports opening the Chrome console
- [x] Agent display optimization, supports search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering with highlighting and quick copying
- [x] `WebDAV` synchronization
- [x] Added `RAG`, based on the MCP knowledge base
- [x] Introduced the concept of ChatSpace, supports multiple dialogues at the same time
- [x] Supports Agent Call Agent via HyperAgent's MCP
- [x] Added scheduled tasks, specify Agents to complete tasks on schedule, and view task completion status.

### TODO:

- [ ] Future updates will include a Docker version, built-in Linux desktop, built-in Chrome configuration for remote ports, unified environments for easier use. Then control through a web interface. It will be usable on any device, including mobile phones 🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement using LLM to write MCP for itself

### LLM

| LLM      | Usability   | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐⭐ | Also supports multi-step function calls perfectly (gpt-4o-mini also works) |
| gemini flash 2.0   | ⭐⭐⭐⭐🌙 | Very usable |
| qwen       | ⭐⭐⭐⭐🌙    | Very usable                 |
| doubao       | ⭐⭐⭐🌙🌙    | Feels okay to use                   |
| deepseek | ⭐⭐⭐🌙🌙      | Multi-step function calls may have issues       |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line or refer to the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line or download from the official website, [nodejs](https://nodejs.org/en)
```
# MacOS
brew install node
# windows
winget install OpenJS.NodeJS.LTS
```

## Development

```
cd electron && npm install
cd web && pnpm install
npm install
npm run dev
```

## Notes

* MacOS encountering damage or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, Windows version `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat user communication](https://t.me/dadigua001)

#### Call shell mcp
![image.png](./images/image55.png)

#### Call terminal mcp, ssh + can execute commands
![image.png](./images/image62.png)

#### One-click webpage writing and publishing to (cloudflare)
![image.png](./images/image60.png)

#### Call Google search, ask it what the TGA Game of the Year is
![image.png](./images/image22.png)

#### Organize Zhihu hot searches
![image.png](./images/image36.png)

#### Help you open webpages, analyze results, and write to files
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### MCP market (experimental)
![image.png](./images/image43.png)

#### Install mcp interface from the market (experimental)
![image.png](./images/image45.png)

#### Install mcp from third parties (supports any mcp)
![image.png](./images/image44.png)

#### Install mcp interface from third parties
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

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

* This project is for learning and communication purposes only. If you use this project for any actions, such as web scraping, it is not related to the developers of this project.