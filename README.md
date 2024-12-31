[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that seeks to provide the best Chat experience by utilizing APIs from various LLMs and implementing productivity tools through the MCP protocol.

Supports Chat with the [MCP](https://modelcontextprotocol.io/introduction) protocol, using a protocol similar to OpenAI, compatible with the `Claude Desktop` configuration file. Supports `Client` hot reloading, restarting, and disabling.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch`+`search`
- [x] Bot supports selecting permitted MCP clients and tools
- [x] Supports Artifacts, HTML, SVG rendering
- [x] Bot display optimization, supports search and drag-and-drop sorting

### TODO:

- [ ] Permission pop-up, whether to allow
- [ ] Scheduled task support
- [ ] Supports Projects + RAG
- [ ] WebDAV synchronization
- [ ] Implement tools to allow LLMs to write tools for themselves
- [ ] Local shell + js runtime environment

### LLM

| LLM      | Usability  | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐🌙 | Also perfectly supports multi-step function calls (gpt-4o-mini can also) |
| qwen       | ⭐⭐⭐⭐🌙    | Very usable, feels better than openai                 |
| doubao       | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐      | Multi-step function calls have issues       |

## Usage

* 1. You need to configure your OpenAI-style APIKEY
* 2. Make sure you have uvx or npx installed on your system.

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
* MacOS `nvm` users manually input PATH `echo $PATH`, it seems Windows version `nvm` can be used directly

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