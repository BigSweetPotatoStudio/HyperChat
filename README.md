[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open Chat client that can use APIs from various LLMs, fully supports MCP, and aims to provide the best chat experience. It also implements productivity MAX tools based on a native Agent.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market with user-friendly MCP installation and configuration, one-click installation, and contributions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.
* Also supports third-party MCP manual installation; simply fill in `command`, `args`, and `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line execution, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:alpha`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension market + third-party MCP support
- [x] Supports freely creating and designing `Agent`, able to pre-set prompts and select MCP features
- [x] Supports dark mode 🌙
- [x] Supports Resources, Prompts, Tools
- [x] Supports both English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capturing, and can open Chrome's console
- [x] Agent display optimization, supporting search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering increases highlighting with quick copy
- [x] `WebDAV` synchronization
- [x] Adds `RAG`, based on MCP knowledge base
- [x] Introduces ChatSpace concept, supporting multiple conversations simultaneously
- [x] Supports Agent Call Agent via HyperAgent's MCP
- [x] Allows scheduling tasks, designating Agents to complete tasks on a schedule, and reviewing task completion status.

### TODO:

- [ ] Future plans to add a docker version with built-in Linux desktop, built-in Chrome configuration for remote ports, unified environment, and better usability, followed by web control. Usable on any device including mobile 🤣
- [ ] Permission pop-up to ask for allowance
- [ ] Implement LLM to write MCP for itself

### LLM

| LLM           | Usability    | Remarks                         |
| ------------- | ------------ | ------------------------------- |
| claude        | ⭐⭐⭐⭐⭐       | No explanation                  |
| openai        | ⭐⭐⭐⭐⭐       | Also perfectly supports multi-step function calls (gpt-4o-mini also works) |
| gemini flash 2.0 | ⭐⭐⭐⭐🌙   | Very good                      |
| qwen          | ⭐⭐⭐⭐🌙      | Very good                      |
| doubao        | ⭐⭐⭐🌙🌙      | Feels okay                     |
| deepseek      | ⭐⭐⭐🌙🌙      | Multi-step function calls may have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure that `uv + nodejs` is installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line or refer to the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line or download from the official site, [nodejs](https://nodejs.org/en)
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

## Note

* MacOS may encounter corruption or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users should manually input PATH `echo $PATH`, Windows version `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Invoke shell mcp
![image.png](./images/image55.png)

#### Invoke terminal mcp, ssh + command execution
![image.png](./images/image62.png)

#### One-click web page creation and publishing to (cloudflare)
![image.png](./images/image60.png)

#### Call Google search, asking what TGA's game of the year is
![image.png](./images/image22.png)

#### Organize Zhihu hot searches
![image.png](./images/image36.png)

#### Open a web page, analyze results, and write to file
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### MCP market (experimental)
![image.png](./images/image43.png)

#### Install mcp interface from market (experimental)
![image.png](./images/image45.png)

#### Install third-party mcp (supports any mcp)
![image.png](./images/image44.png)

#### Install third-party mcp interface
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

#### Render HTML, supports `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, test model capabilities
![image.png](./images/image48.png)

#### Knowledge Base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any operations, such as web scraping, it is unrelated to the developers of this project.