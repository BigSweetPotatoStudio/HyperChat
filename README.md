[中文](README.zh.md) | [English](README.md)


## Features

Chat that supports the [MCP](https://modelcontextprotocol.io/introduction) protocol, using a protocol similar to OpenAI, compatible with the `Claude Desktop` configuration. Supports `Client` hot loading, restart, and disable.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese

### LLM

| LLM      | Usability   | Remarks                      |
| -------- | ------ | ---------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation               |
| openai   | ⭐⭐⭐⭐🌙 | Also perfectly supports multi-step function calls (gpt-4o-mini can too) |
| doubao   | ⭐⭐⭐    | Feels okay to use            |
| deepseek | ⭐⭐      | Multi-step function calls have issues |

## Usage

* 1. You need to configure your OpenAI-style APIKEY
* 2. Ensure that uvx or npx is installed on your system.

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

* MacOS encountered corrupted or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, Windows version `nvm` seems to be usable directly

![image.png](./images/image4.png)

## Telegram

[HyperChat user communication](https://t.me/dadigua001)

![image.png](./images/image11.png)

![image.png](./images/image13.png)

![image.png](./images/image12.png)

![image.png](./images/image14.png)