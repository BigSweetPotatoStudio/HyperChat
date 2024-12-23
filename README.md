[中文](README.zh.md) | [English](README.md)


## Features

Supports Chat with the [MCP](https://modelcontextprotocol.io/introduction) protocol, using a similar protocol to OpenAI, compatible with `Claude Desktop` configuration. Supports `Client` hot reloading, restarting, and disabling.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resource support
- [x] Partial support for Prompts
- [x] Tool support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] gpts- supports selection of allowed MCP clients and tools

### LLM

| LLM      | Usability | Remarks                           |
| -------- | --------- | --------------------------------- |
| claude   | ⭐⭐⭐⭐⭐    | No explanation                     |
| openai   | ⭐⭐⭐⭐🌙    | Can also perfectly support multi-step function calls (gpt-4o-mini can too) |
| 豆包       | ⭐⭐⭐      | Feels okay to use                 |
| deepseek | ⭐⭐       | Multi-step function calls may have issues |

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

## Note

* MacOS encountered damage or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, Windows version `nvm` seems to work directly

![image.png](./images/image4.png)

## Telegram

[HyperChat user communication](https://t.me/dadigua001)

![image.png](./images/image11.png)

![image.png](./images/image13.png)

![image.png](./images/image12.png)

![image.png](./images/image14.png)

![image.png](./images/image22.png)

![image.png](./images/image21.png)