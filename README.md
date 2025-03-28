[中文](README.zh.md) | [English](README.md)


## Introduction


HyperChat is an open Chat client that can utilize APIs from various LLMs, fully supporting MCP for the best Chat experience. It also implements productivity MAX tools based on native Agents.


[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)


[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market with user-friendly MCP installation and configuration, one-click installation, and welcome submissions for [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs, just fill in `command`, `args`, and `env`.


## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Run from the command line, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension market + third-party MCP support
- [x] Supports free creation and design of `Agent`, with preset prompts and selection of MCP features
- [x] Supports dark mode🌙
- [x] Supports Resources, Prompts, and Tools
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error capturing, and opening Chrome's console
- [x] Agent display optimization, supports searching and drag-and-drop sorting
- [x] Supports `KaTeX`, displaying mathematical formulas, code rendering with highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] Added `RAG`, based on MCP knowledge base
- [x] Introduced ChatSpace concept, supports multiple conversations simultaneously
- [x] Supports Agent Call Agent through HyperAgent's MCP
- [x] Added scheduled tasks, specify Agent to complete tasks at specified times and view task completion status.

### TODO:

- [ ] A Docker version will be added later, with a built-in Linux desktop, built-in Chrome configured remote port, unified environment for better usability. Then a web interface control. Usable on any device, including mobile🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement LLM writing MCP for itself

### LLM

| LLM      | Usability  | Remarks                    |
| -------- | ---------- | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐     | No explanation needed      |
| openai   | ⭐⭐⭐⭐⭐     | Also perfectly supports multi-step function calls (gpt-4o-mini can do it too) |
| gemini flash 2.0   | ⭐⭐⭐⭐🌙    | Very usable                |
| qwen     | ⭐⭐⭐⭐🌙    | Very usable                |
| doubao   | ⭐⭐⭐🌙🌙    | Feels okay to use          |
| deepseek | ⭐⭐⭐🌙🌙    | Multi-step function calls may have issues |


## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure `uv + nodejs` is installed in your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)


Install via command line or download from the official site, [nodejs](https://nodejs.org/en)

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


* On MacOS, if you encounter issues with it being damaged or permissions, run `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, Windows version `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram


[HyperChat User Community](https://t.me/dadigua001)

#### Invoke shell mcp
![image.png](./images/image55.png)


#### Invoke terminal mcp, ssh + executes commands
![image.png](./images/image62.png)

#### One-click webpage writing, and publish to (cloudflare)
![image.png](./images/image60.png)

#### Call Google search, ask what TGA Game of the Year is
![image.png](./images/image22.png)

#### Organize Zhihu hot searches
![image.png](./images/image36.png)

#### Help you open a webpage, analyze results, and write to a file

![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### MCP market (experimental)
![image.png](./images/image43.png)

#### Install mcp interface from the market (experimental)
![image.png](./images/image45.png)

#### Install third-party mcp (supports any mcp)
![image.png](./images/image44.png)

#### Install third-party mcp interface
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

#### Render HTML, supports `Artifacts`, `SVG`,`HTML` rendering,

![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, model capability testing
![image.png](./images/image48.png)

#### Knowledge base
![image.png](./images/image50.png)

## Disclaimer


* This project is for educational and communication purposes only. If you use this project for any operation, such as web scraping, it has no connection with the developers of this project.

