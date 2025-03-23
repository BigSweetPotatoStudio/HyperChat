[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open Chat client that can use APIs from various LLMs, fully supports MCP, and provides the best Chat experience. It also implements a productivity MAX tool based on native agents.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

* Supports OpenAI-style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation and configuration, one-click installation, and welcome submissions for [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs, just fill in `command`, `args`, and `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line run, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyper-chat-mini:1.2.8`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Supports creating and designing `Agents` freely, can preset prompts, select MCP functionalities
- [x] Supports dark mode 🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capturing, supports opening the Chrome console
- [x] Optimized Agent display, supports search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering with highlights and quick copy
- [x] `WebDAV` synchronization
- [x] Added `RAG`, based on MCP knowledge base
- [x] Introduced ChatSpace concept, supports multiple conversations simultaneously
- [x] Supports Agent Call Agent through HyperAgent's MCP
- [x] Added scheduled tasks, specify Agents to complete tasks on a schedule, and view task completion status.

### TODO:

- [ ] A subsequent version will include a Docker version, with an embedded Linux desktop, built-in Chrome configuration to remote ports, standardizing the environment for better usability. Then control via a web interface. Usable on any device, including mobile 🤣
- [ ] Permission prompt, whether to allow
- [ ] Implement LLM writing its own MCP

### LLM

| LLM        | Usability   | Remarks                                |
| ---------- | ----------- | -------------------------------------- |
| claude     | ⭐⭐⭐⭐⭐      | No explanation                         |
| openai     | ⭐⭐⭐⭐⭐      | Also supports multi-step function calls perfectly (gpt-4o-mini can too) |
| gemini flash 2.0 | ⭐⭐⭐⭐🌙 | Very usable                           |
| qwen       | ⭐⭐⭐⭐🌙     | Very usable                           |
| doubao     | ⭐⭐⭐🌙🌙   | Feels okay to use                     |
| deepseek   | ⭐⭐⭐🌙🌙   | Multi-step function calls have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line, or check out the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install via command line, or download from the official website, official site [nodejs](https://nodejs.org/en)
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

* MacOS encountered damage or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually enter PATH `echo $PATH`, Windows version `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat User Discussion](https://t.me/dadigua001)

#### Call shell mcp
![image.png](./images/image55.png)

#### Call terminal mcp, ssh + can also execute commands
![image.png](./images/image62.png)

#### One-click write webpage and publish to (cloudflare)
![image.png](./images/image60.png)

#### Call Google search, ask it what the TGA game of the year is
![image.png](./images/image22.png)

#### Organize Zhihu hot searches
![image.png](./images/image36.png)

#### Help you open web pages, analyze results, and write to files
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### MCP marketplace (experimental)
![image.png](./images/image43.png)

#### Install MCP interface from the marketplace (experimental)
![image.png](./images/image45.png)

#### Install MCP from third party (supports any MCP)
![image.png](./images/image44.png)

#### Install MCP interface from third party
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

#### Render HTML, supports `Artifacts`, `SVG`, `HTML` rendering
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, test model capabilities
![image.png](./images/image48.png)

#### Knowledge base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any operations, such as web scraping, etc., it is not related to the developers of this project.