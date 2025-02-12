[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that can use the APIs of various LLMs to provide the best chat experience and implement productivity tools through the MCP protocol.

* Supports OpenAI style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market, user-friendly MCP installation and configuration, one-click installation, welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs, just fill in `command`, `args`, and `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows + 🍏MacOS
- [x] Supports dark mode 🌙
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Supports `Agent`, can preset prompts and allowed MCP services
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error capture, supports opening Chrome console
- [x] Agent display optimization, supports searching, drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering adds highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] `MCP` extension market + third-party MCP support
- [x] Added `RAG`, based on MCP knowledge base
- [x] Added ChatSpace concept, supports multiple conversations simultaneously
- [x] Supports Agent Call Agent via HyperAgent's MCP

### TODO:

- [ ] Permission pop-up, whether to allow
- [ ] Add task, HyperAgent concept, supports scheduled tasks. Manage tasks through HyperAgent.
- [ ] Implement self-writing tools using LLM
- [ ] Local `shell` + `nodejs` + `js on web` runtime environment

### LLM

| LLM      | Usability   | Note                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | no explanation             |
| openai   | ⭐⭐⭐⭐🌙 | Also supports multi-step function calls perfectly (gpt-4o-mini also works) |
| qwen     | ⭐⭐⭐⭐🌙  | Very easy to use, feels better than OpenAI  |
| doubao   | ⭐⭐⭐    | Feels okay to use          |
| deepseek | ⭐⭐      | Multi-step function calls have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure `uv + nodejs` is installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line, or refer to the official Github tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line, or download it from the official website [nodejs](https://nodejs.org/en)
```
# MacOS
brew install node
# Windows
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

* MacOS encountered corrupted or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, Windows version `nvm` seems to be directly usable

![image.png](./images/image47.png)

## Telegram

[HyperChat User Community](https://t.me/dadigua001)

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

* This project is for learning and communication purposes only. If you use this project for any operations, such as crawling behaviors, the project developers bear no responsibility.