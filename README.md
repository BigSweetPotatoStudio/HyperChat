[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open-minded Chat client that uses APIs from various LLMs to achieve the best Chat experience and to implement productivity tools via the MCP protocol.

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation and configuration, one-click installation, welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs; just fill in `command`, `args`, and `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows + 🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support 
- [x] Partial support for Prompts 
- [x] Tools support 
- [x] Supports both English and Chinese 
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Supports `Bot`, allows preset prompt words, permitted MCP services 
- [x] Supports `Artifacts`, `HTML`, `SVG` rendering 
- [x] Bot display optimization, supports searching and drag-and-drop sorting 
- [x] Supports `KaTeX`, displays mathematical formulas 
- [x] `WebDAV` synchronization 
- [x] `MCP` plugin marketplace 

### TODO:

- [ ] Permission pop-up, whether to allow 
- [ ] Support for scheduled tasks 
- [ ] Support for Projects + RAG 
- [ ] Implement LLM writing tools for itself 
- [ ] Local `shell` + `nodejs` + `js on web` runtime environment 

### LLM

| LLM      | Usability | Remarks                              |
| -------- | ------ | ------------------------------------ |
| claude   | ⭐⭐⭐⭐⭐ | No explanation                       |
| openai   | ⭐⭐⭐⭐🌙 | Can also perfectly support multi-step function calls (gpt-4o-mini can too) |
| qwen     | ⭐⭐⭐⭐🌙 | Very useful, feels better than OpenAI |
| doubao   | ⭐⭐⭐   | Feels okay to use                    |
| deepseek | ⭐⭐    | Multi-step function calls have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style. 
* 2. Ensure that `uv + nodejs` is installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line, or check the official Github tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv -e
```
### [npx & nodejs](https://nodejs.org/en)

Install via command line, or download from the official website, [nodejs](https://nodejs.org/en)
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

## Notes

* MacOS encounters damaged or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, the Windows version of `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

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