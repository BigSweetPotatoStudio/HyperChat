[中文](README.zh.md) | [English](README.md)


## Features

Supports Chat with the [MCP](https://modelcontextprotocol.io/introduction) protocol, uses an OpenAI-like protocol, and is compatible with the `Claude Desktop` configuration file. Supports `Client` hot loading, restart, and disabling.

### MCP: 

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] Supports `nvm`, see below
- [x] Resources support
- [x] Partial support for Prompts
- [x] Tools support
- [x] Supports English and Chinese
- [x] Added built-in MCP client `hypertools`, `fetch` + `search`
- [x] gpts- supports selecting allowed MCP clients and tools

### TODO:

- [ ] Easier to use
- [ ] Permission pop-up, allow or not
- [ ] Support scheduled tasks

### LLM

| LLM      | Usability    | Notes                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐🌙 | Also perfectly supports multi-step function calls (gpt-4o-mini can too) |
| 豆包       | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐      | Multi-step function calls will have issues       |

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

* MacOS encounters damaged or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users need to manually enter PATH `echo $PATH`, Windows version `nvm` seems to work directly

![image.png](./images/image4.png)



## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

![image.png](./images/image11.png)

![image.png](./images/image13.png)

![image.png](./images/image32.png)

![image.png](./images/image31.png)

![image.png](./images/image22.png)

![image.png](./images/image21.png)

![image.png](./images/image30.png)