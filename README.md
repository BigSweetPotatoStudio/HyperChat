[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open Chat client that can use APIs from various LLMs, fully supports MCP, and provides the best Chat experience. It also implements productivity MAX tools based on native Agents.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* Supports OpenAI style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation and configuration, one-click installation, and welcome submissions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Supports manual installation of third-party MCPs by filling in `command`, `args`, and `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line execution, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Supports freely creating and designing `Agents`, can pre-set prompts and select MCP functions
- [x] Supports dark mode 🌙
- [x] Supports Resources, Prompts, Tools
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error capture, and can open the Chrome console
- [x] Agent display optimization, supports searching, drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering adds highlights and quick copy
- [x] `WebDAV` syncing
- [x] Adds `RAG`, based on MCP knowledge base
- [x] Introduces ChatSpace concept, supports multiple conversations at the same time
- [x] Supports Agent calling Agent through HyperAgent's MCP
- [x] Adds scheduled tasks, specifies Agents to complete tasks at specified times, and view task completion status.


### TODO:

- [ ] Future versions will include Docker version, built-in Linux desktop, built-in Chrome configuration to remote port, unified environment for better usability. Then web interface control will be available on any device, including phones 🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement LLM to write MCP for itself

### LLM

| LLM      | Usability   | Remarks                     |
| -------- | -------- | ---------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation               |
| openai   | ⭐⭐⭐⭐⭐ | Can also perfectly support multi-step function calls (gpt-4o-mini can also) |
| gemini flash 2.0   | ⭐⭐⭐⭐🌙 | Very usable                |
| qwen       | ⭐⭐⭐⭐🌙    | Very usable                 |
| doubao       | ⭐⭐⭐🌙🌙    | Feels okay to use          |
| deepseek | ⭐⭐⭐🌙🌙      | Multi-step function calls may have issues       |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Make sure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line, or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install via command line, or download it from the official website, [nodejs](https://nodejs.org/en)
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

* MacOS has encountered damage or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* For MacOS `nvm` users, manually enter PATH `echo $PATH`, the Windows version of `nvm` can be used directly

![image.png](./images/image47.png)



## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Calling shell mcp
![image.png](./images/image55.png)

#### Calling terminal mcp, ssh + can execute commands
![image.png](./images/image62.png)

#### One-click webpage creation and publish to (cloudflare)
![image.png](./images/image60.png)

#### Calling Google search, asking what the TGA game of the year is
![image.png](./images/image22.png)

#### Organizing Zhihu hot searches
![image.png](./images/image36.png)

#### Helping you open a webpage, analyze results, and write to a file
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)


#### Scheduled task list
![image.png](./images/image52.png)

#### MCP marketplace (experimental)
![image.png](./images/image43.png)

#### Installing the mcp interface from the marketplace (experimental)
![image.png](./images/image45.png)

#### Installing third-party mcp (supports any mcp)
![image.png](./images/image44.png)

#### Installing third-party mcp interface
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

#### Rendering HTML, supports `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, testing model capabilities
![image.png](./images/image48.png)

#### Knowledge base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any actions, such as web scraping, it has no relation to the developers of this project.