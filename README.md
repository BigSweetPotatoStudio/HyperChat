[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open-minded Chat client that can use various LLM APIs, fully supports MCP, and provides the best chat experience. It also implements the MAX productivity tools based on native agents.

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market with user-friendly MCP installation and configuration, one-click installation, welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs, simply fill in `command`, `args`, and `env`.

### MCP: 

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] `MCP` extension market + third-party MCP support
- [x] Supports freely creating `Agent`, can preset prompts and select MCP functions
- [x] 🪟Windows + 🍏MacOS
- [x] Supports dark mode 🌙
- [x] Resources, Prompts, and Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error catching, supports opening Chrome's console
- [x] Agent display optimization, supports search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering with highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] Adds `RAG`, based on the MCP knowledge base
- [x] Introduces the concept of ChatSpace, supports simultaneous chatting in multiple conversations
- [x] Supports Agent Call Agent through HyperAgent's MCP
- [x] Adds scheduled tasks to specify Agents to complete tasks on time, and view task completion status.

### TODO:

- [ ] Will later add a docker version, built-in Linux desktop, built-in Chrome configuration to remote port, unified environment for easier handling. Then control via web interface. Can be used on any device, including mobile phones 🤣
- [ ] Permission pop-up, whether to allow or not
- [ ] Implement the ability for LLM to create its own MCP

### LLM

| LLM      | Usability    | Notes                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐⭐ | Perfectly supports multi-step function calls (gpt-4o-mini also works) |
| gemini flash 2.0   | ⭐⭐⭐⭐🌙 | Very user-friendly |
| qwen       | ⭐⭐⭐⭐🌙    | Very user-friendly                 |
| doubao       | ⭐⭐⭐🌙🌙    | Feels okay to use                   |
| deepseek | ⭐⭐⭐🌙🌙      | Multi-step function calls may have issues       |

## Usage

* 1. Configure the APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Make sure `uv + nodejs` is installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using command line, or check the official Github tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using command line, or go to the official site to download and install, official site [nodejs](https://nodejs.org/en)
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

## Notes

* On MacOS, if you encounter damage or permission issues, run `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users should manually input PATH `echo $PATH`, the Windows version of `nvm` seems to work directly.

![image.png](./images/image47.png)

## Telegram

[HyperChat user discussion](https://t.me/dadigua001)

#### Calling shell mcp
![image.png](./images/image55.png)

#### One-click webpage creation and publish to (cloudflare)
![image.png](./images/image60.png)

#### Calling Google Search, asking what TGA Game of the Year is
![image.png](./images/image22.png)

#### Organizing Zhihu hot searches
![image.png](./images/image36.png)

#### Helping you open a webpage, analyze the results, and write to a file
![image.png](./images/image13.png)

#### Opening Baidu and taking a screenshot
![image.png](./images/image61.png)


#### Scheduled task list
![image.png](./images/image52.png)


#### MCP market (experimental)
![image.png](./images/image43.png)

#### Installing MCP interface from the market (experimental)
![image.png](./images/image45.png)

#### Installing third-party MCP (supports any MCP)
![image.png](./images/image44.png)

#### Installing third-party MCP interface
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

#### Rendering HTML, supports `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, testing model capability
![image.png](./images/image48.png)

#### Knowledge base
![image.png](./images/image50.png)

## Disclaimer

* This project is for educational and communication purposes only. If you use this project for any actions, such as web scraping, it has nothing to do with the developers of this project.