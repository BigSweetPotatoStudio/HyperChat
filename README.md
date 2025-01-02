[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that utilizes various LLM APIs to achieve the best chat experience and implements productivity tools through the MCP protocol.

Supports Chat based on the [MCP](https://modelcontextprotocol.io/introduction) protocol, using a protocol similar to OpenAI's and compatible with the `Claude Desktop` configuration. Supports `Client` hot reloading, restart, and disabling.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows + 🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Supports `Bot`, can preset prompts and allowed MCP services
- [x] Supports `Artifacts`, `HTML`, `SVG` rendering
- [x] Bot display optimization, supports search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas
- [x] `WebDAV` synchronization

### TODO:

- [ ] Permission pop-up, whether to allow
- [ ] Support for scheduled tasks
- [ ] Support for Projects + RAG
- [ ] Implement LLM writing tools for itself
- [ ] Local shell + js runtime environment

### LLM

| LLM      | Usability   | Notes                        |
| -------- | ----------- | ---------------------------- |
| claude   | ⭐⭐⭐⭐⭐      | Not explained                |
| openai   | ⭐⭐⭐⭐🌙    | Can also perfectly support multi-step function call (gpt-4o-mini can too) |
| qwen     | ⭐⭐⭐⭐🌙    | Very usable, feels better than openai |
| doubao   | ⭐⭐⭐       | Feels okay to use            |
| deepseek | ⭐⭐        | Multi-step function call has issues |

## Usage

* 1. You need to configure your OpenAI-style APIKEY
* 2. Ensure that UVX or NPX is installed in your system.

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

* On MacOS, if you encounter a damaged or permission issue, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users need to manually enter PATH `echo $PATH`, the Windows version of `nvm` seems to work directly

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