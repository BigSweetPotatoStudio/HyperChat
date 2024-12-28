[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is a Chat client that strives for openness, utilizing APIs from various LLMs to achieve the best Chat experience, as well as implementing productivity tools through the MCP protocol.

Supports Chat with the [MCP](https://modelcontextprotocol.io/introduction) protocol, using a protocol similar to OpenAI, compatible with `Claude Desktop` configuration. Supports `Client` hot loading, restart, and disable.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Bot support for selecting allowed MCP clients and tools
- [x] Supports Artifacts, HTML, SVG rendering
- [x] Bot display optimization, supports search, drag-and-drop sorting

### TODO:

- [ ] Permission pop-up, whether to allow
- [ ] Support for scheduled tasks
- [ ] Support for Projects + RAG
- [ ] WebDAV synchronization
- [ ] Implement LLM writing Tools for itself
- [ ] Local shell + js runtime environment

### LLM

| LLM      | Usability    | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐🌙 | Can also perfectly support multi-step function call (gpt-4o-mini can too) |
| qwen       | ⭐⭐⭐⭐🌙    | Very good, feels better than openai                 |
| doubao       | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐      | Multi-step function call may have issues       |

## Usage

* 1. You need to configure your OpenAI-style APIKEY
* 2. Make sure you have installed uvx or npx in your system.

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

## Notes

* MacOS encounters damaged or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, the Windows version of `nvm` seems to work directly

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