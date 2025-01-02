[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that utilizes various LLM APIs to provide the best chat experience, and also realize productivity tools through the MCP protocol.

Supports Chat using the [MCP](https://modelcontextprotocol.io/introduction) protocol, employing OpenAI-like protocols, compatible with the `Claude Desktop` configuration. Supports `Client` hot reload, restart, and disable.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Bot supports selecting allowed MCP clients and tools
- [x] Supports Artifacts, HTML, SVG rendering
- [x] Optimized bot display, supports search, drag and drop sorting
- [x] Supports KaTeX, displays mathematical formulas

### TODO:

- [ ] Permission pop-up, allow or not
- [ ] Support cron jobs
- [ ] Support Projects + RAG
- [ ] WebDAV sync
- [ ] Implement LLM writing Tools for itself
- [ ] Local shell + js running environment

### LLM

| LLM      | Usability    | Notes                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐🌙 | Can also perfectly support multi-step function calls (gpt-4o-mini can too) |
| qwen     | ⭐⭐⭐⭐🌙    | Very usable, feels better than openai                 |
| doubao   | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐      | Multi-step function calls may have issues       |

## Usage

* 1. You need to configure your OpenAI-style APIKEY
* 2. Ensure you have uvx or npx installed on your system.

### [uvx](https://github.com/astral-sh/uv)

```
brew install uv
```
### [npx & nodejs](https://nodejs.org/en)

```
brew install node 
```

## Development

```
cd electron && npm install
cd web && npm install
npm install
npm run dev
```

## Note

* For MacOS, if you encounter damage or permission issues, run `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* For MacOS `nvm` users, manually enter PATH `echo $PATH`, Windows version of `nvm` seems to work directly

![image.png](./images/image4.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

![image.png](./images/image33.png)

![image.png](./images/image34.png)

![image.png](./images/image13.png)

![image.png](./images/image32.png)

![image.png](./images/image31.png)

![image.png](./images/image22.png)

![image.png](./images/image21.png)

![image.png](./images/image30.png)

![image.png](./images/image35.png)

![image.png](./images/image36.png)