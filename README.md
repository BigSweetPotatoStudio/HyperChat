[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is a Chat client that pursues openness, utilizing the APIs of various LLMs, fully supporting MCP, to achieve the best Chat experience. It also implements a productivity MAX tool based on local Agents.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation configuration, one-click installation, and submissions for [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.
* Also supports third-party MCP manual installation, just fill in `command`, `args`, `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command-line run, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Docker 
    * Command-line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Supports free creation, design of `Agent`, can preset prompts, and select MCP functions
- [x] Supports dark mode🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, js error capturing, supports opening Chrome's console
- [x] Agent display optimization, supports searching, drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering with syntax highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] Adds `RAG`, based on MCP knowledge base
- [x] Introduces ChatSpace concept, supports multiple conversations simultaneously
- [x] Supports Agent Call Agent via HyperAgent's MCP
- [x] Adds scheduled tasks, specifying Agents to complete tasks on time and view task completion status.

### TODO:

- [ ] Will add a docker version with built-in Linux desktop, built-in Chrome configuration for remote ports, unified environment for better usability. Then control through a web interface. Usable on any device, including mobile phones🤣
- [ ] Permission pop-up, allow or not
- [ ] Implement LLM to write its own MCP

### LLM

| LLM      | Usability    | Notes                         |
| -------- | ------ | ---------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation required              |
| openai   | ⭐⭐⭐⭐⭐ | Also perfectly supports multi-step function calls (gpt-4o-mini also works) |
| gemini flash 2.0   | ⭐⭐⭐⭐🌙 | Very usable              |
| qwen       | ⭐⭐⭐⭐🌙    | Quite usable                  |
| doubao       | ⭐⭐⭐🌙🌙    | Feels okay to use                  |
| deepseek | ⭐⭐⭐🌙🌙      | Multi-step function calls have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line or check the official Github tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install via command line or download from the official site, see [nodejs](https://nodejs.org/en)
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


## Note

* MacOS encounters a damaged or permission issue, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, the Windows version seems to work directly with `nvm`

![image.png](./images/image47.png)



## Telegram

[HyperChat user communication](https://t.me/dadigua001)

#### Call shell mcp
![image.png](./images/image55.png)

#### Call terminal mcp, ssh + can execute commands
![image.png](./images/image62.png)

#### One-click webpage writing and publishing to (cloudflare)
![image.png](./images/image60.png)

#### Call Google search, ask what TGA's game of the year is
![image.png](./images/image22.png)

#### Organize trending topics on Zhihu
![image.png](./images/image36.png)

#### Help you open a webpage, analyze the results, and write to a file
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)


#### Scheduled task list
![image.png](./images/image52.png)

#### MCP marketplace (experimental)
![image.png](./images/image43.png)

#### Install MCP interface from the marketplace (experimental)
![image.png](./images/image45.png)

#### Install MCP from third parties (supports any MCP)
![image.png](./images/image44.png)

#### Install MCP interface from third parties
![image.png](./images/image46.png)

#### MCP list (can be selected dynamically)
![image.png](./images/image21.png)

#### Render HTML, supporting `Artifacts`, `SVG`, `HTML` rendering,
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

* This project is for learning and communication purposes only. If you use this project for any activities, such as web scraping, it is unrelated to the project developers.