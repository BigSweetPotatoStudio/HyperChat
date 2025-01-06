[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that can use APIs from various LLMs to provide the best chat experience and implement productivity tools via the MCP protocol.

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market, user-friendly MCP installation and configuration, one-click installation, and welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs, simply fill in `command`, `args`, `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows + 🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Supports `Bot`, allows predefined prompts, allowed MCP services
- [x] Supports `Artifacts`, `HTML`, `SVG` rendering
- [x] Bot display optimization, supporting search and drag-and-drop sorting
- [x] Supports `KaTeX`, displaying mathematical formulas
- [x] `WebDAV` sync
- [x] `MCP` plugin market

### TODO:

- [ ] Permissions pop-up, allow or deny
- [ ] Support scheduled tasks
- [ ] Support Projects + RAG
- [ ] Implement use of LLM to write tools for itself
- [ ] Local `shell` + `nodejs` + `js on web` runtime environment

### LLM

| LLM      | Usability  | Note                          |
| -------- | ------ | ----------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation               |
| openai   | ⭐⭐⭐⭐🌙 | Also perfectly supports multi-step function calls (gpt-4o-mini can too) |
| qwen     | ⭐⭐⭐⭐🌙 | Very usable, feels better than OpenAI |
| doubao   | ⭐⭐⭐    | Feels okay to use            |
| deepseek | ⭐⭐      | Multi-step function calls have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure `uv + nodejs` are installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv -e
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
cd web && npm install
npm install
npm run dev
```

## Notes

* MacOS encountered damaged or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users need to manually input PATH `echo $PATH`, the Windows version of `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat User Community](https://t.me/dadigua001)

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