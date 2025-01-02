[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that can use APIs from various LLMs to provide the best Chat experience and implement productivity tools through the MCP protocol.

It supports Chat that complies with the [MCP](https://modelcontextprotocol.io/introduction) protocol, using a protocol similar to OpenAI, and is compatible with the `Claude Desktop` configuration file. It supports `Client` hot loading, restarting, and disabling.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] Supports `Bot`, allows preset prompts, permitted MCP services
- [x] Supports `Artifacts`, `HTML`, `SVG` rendering
- [x] Bot display optimization, supports search, drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas
- [x] `WebDAV` synchronization

### TODO:

- [ ] Permission pop-up, allow or not
- [ ] Support scheduled tasks
- [ ] Support Projects + RAG
- [ ] Implement using LLM to write Tools for itself
- [ ] Local `shell` + `nodejs` + `js on web` runtime environment

### LLM

| LLM      | Usability    | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation needed                    |
| openai   | ⭐⭐⭐⭐🌙 | Also perfectly supports multi-step function calls (gpt-4o-mini can also) |
| qwen     | ⭐⭐⭐⭐🌙 | Very user-friendly, feels better than OpenAI                 |
| doubao   | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐      | Multi-step function calls will have issues       |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure `uv + nodejs` is installed on your system.

### [uvx](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
```
### [npx & nodejs](https://nodejs.org/en)

```
# MacOS
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

* On MacOS, if you encounter issues with damage or permissions, use `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* For MacOS `nvm` users, manually enter PATH `echo $PATH`, Windows version `nvm` seems to be directly usable

![image.png](./images/image40.png)

## Telegram

[HyperChat User Community](https://t.me/dadigua001)

![image.png](./images/image33.png)

![image.png](./images/image34.png)

![image.png](./images/image13.png)

![image.png](./images/image32.png)

![image.png](./images/image31.png)

![image.png](./images/image22.png)

![image.png](./images/image21.png)

![image.png](./images/image35.png)

![image.png](./images/image36.png)

![image.png](./images/image42.png)