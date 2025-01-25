[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that utilizes various LLM APIs to provide the best Chat experience and enables productivity tools through the MCP protocol.

* Supports OpenAI-style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace with user-friendly MCP installation configuration, one-click installation, and welcome submissions of [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports third-party MCP manual installation by filling in `command`, `args`, and `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows + 🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial Prompts support
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Supports `Bot`, allows preset prompts and permitted MCP services
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error capture, supports opening Chrome console
- [x] Bot display optimization, supports search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays math formulas, code rendering includes highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Added `RAG`, based on MCP knowledge base
- [x] Introduced ChatSpace concept, supports multiple conversations simultaneously

### TODO:

- [ ] Permission prompt, whether to allow
- [ ] Add task concept. Agent Administrator, manage Task through Administrator.
- [ ] Implement LLM writing tools for itself
- [ ] Local `shell` + `nodejs` + `js on web` runtime environment

### LLM

| LLM      | Usability   | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation               |
| openai   | ⭐⭐⭐⭐🌙 | Also can perfectly support multi-step function calls (gpt-4o-mini can too) |
| qwen     | ⭐⭐⭐⭐🌙 | Very usable, feels better than OpenAI |
| doubao   | ⭐⭐⭐    | Okay to use                   |
| deepseek | ⭐⭐      | Multi-step function calls may have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure `uv + nodejs` is installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using command line, or refer to the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv -e
```

### [npx & nodejs](https://nodejs.org/en)

Install using command line, or go to the official website to download, official site [nodejs](https://nodejs.org/en)

```
# MacOS
brew install node
# windows
winget install OpenJS.NodeJS.LTS
```

## Development

```
cd electron && npm install
cd web && npm install
npm install
npm run dev
```

## Note

* On MacOS, if you encounter issues with corrupt files or permissions, use `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* For MacOS `nvm` users, manually input PATH `echo $PATH`, the Windows version of `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

![image.png](./images/image51.png)

![image.png](./images/image13.png)

![image.png](./images/image43.png)

![image.png](./images/image45.png)

![image.png](./images/image44.png)

![image.png](./images/image46.png)

![image.png](./images/image22.png)

![image.png](./images/image21.png)

![image.png](./images/image35.png)

![image.png](./images/image36.png)

![image.png](./images/image42.png)

![image.png](./images/image33.png)

![image.png](./images/image34.png)

![image.png](./images/image48.png)

![image.png](./images/image50.png)

## Disclaimer

* This project is for educational and communication purposes only. If you use this project for any actions, such as web scraping, it is unrelated to the developers of this project.