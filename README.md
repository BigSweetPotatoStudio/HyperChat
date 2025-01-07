[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that utilizes various LLM APIs to provide the best Chat experience and implement productivity tools through the MCP protocol.

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation configuration, one-click installation, contributions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.
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
- [x] Supports `Bot`, allows preset prompts, and permissible MCP services
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capture, and opening Chrome's console
- [x] Bot display optimization, supports searching and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering with highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] `MCP` extension marketplace + third-party MCP support

### TODO:

- [ ] Permission pop-up, whether to allow
- [ ] Support scheduled tasks
- [ ] Support Projects + RAG
- [ ] Implement tools writing themselves using LLM
- [ ] Local `shell` + `nodejs` + `js on web` runtime environment

### LLM

| LLM      | Usability | Remarks                         |
| -------- | -------- | ------------------------------- |
| claude   | ⭐⭐⭐⭐⭐    | No explanation                 |
| openai   | ⭐⭐⭐⭐🌙   | Also supports multi-step function calls perfectly (gpt-4o-mini also works) |
| qwen     | ⭐⭐⭐⭐🌙   | Very usable, feels better than openai |
| doubao   | ⭐⭐⭐      | Feels okay to use              |
| deepseek | ⭐⭐       | Multi-step function calls have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure that `uv + nodejs` are installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line, or refer to the official Github tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line, or download and install from the official website [nodejs](https://nodejs.org/en)
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

* On MacOS, if you encounter damaged or permission issues, run `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* For MacOS `nvm` users, manually input PATH `echo $PATH`, the Windows version `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat user discussion](https://t.me/dadigua001)

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