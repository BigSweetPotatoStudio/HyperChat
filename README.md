[中文](README.zh.md) | [English](README.md)


## Features

Supports the [MCP](https://modelcontextprotocol.io/introduction) protocol for Chat, using an OpenAI-like protocol, compatible with `Claude Desktop` configuration. Supports `Client` hot reloading, restarting, and disabling.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] gpts-supports selection of allowed MCP clients and tools
- [x] Supports Artifacts, HTML, SVG rendering

### TODO:

- [ ] More user-friendly
- [ ] Permission pop-up, whether to allow
- [ ] Support for scheduled tasks

### LLM

| LLM      | Usability  | Remarks                       |
| -------- | ------ | ---------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation               |
| openai   | ⭐⭐⭐⭐🌙 | Also perfectly supports multi-step function calls (gpt-4o-mini can also) |
| qwen     | ⭐⭐⭐⭐🌙 | Very useful, feels better than openai |
| doubao   | ⭐⭐⭐    | Feels okay to use           |
| deepseek | ⭐⭐      | Multi-step function calls can have issues |

## Usage

* 1. You need to configure your OpenAI-style APIKEY
* 2. Ensure that `uvx` or `npx` is installed on your system.

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

* MacOS encountering corrupted or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, the Windows version of `nvm` seems to be usable directly

![image.png](./images/image4.png)



## Telegram

[HyperChat user group](https://t.me/dadigua001)

![image.png](./images/image33.png)


![image.png](./images/image13.png)

![image.png](./images/image32.png)

![image.png](./images/image31.png)

![image.png](./images/image22.png)

![image.png](./images/image21.png)

![image.png](./images/image30.png)