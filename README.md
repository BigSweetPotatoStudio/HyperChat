[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that can use APIs from various LLMs, fully supports MCP, and provides the best Chat experience. It also implements a productivity MAX tool based on native Agents.

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market, user-friendly MCP installation and configuration, one-click installation, contributions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.
* Also supports manual installation of third-party MCPs, simply fill in `command`, `args`, and `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] `MCP` extension market + third-party MCP support
- [x] Supports creating `Agent` freely, presetting prompts, selecting MCP functionalities
- [x] 🪟 Windows + 🍏 MacOS + Linux + Docker (coming soon)
- [x] Supports dark mode 🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capturing, and opening Chrome console
- [x] Agent display optimization, supports search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering with syntax highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] Add `RAG`, based on MCP knowledge base
- [x] Add ChatSpace concept, supports multiple conversations at the same time
- [x] Supports Agent calling Agent through HyperAgent's MCP
- [x] Add scheduled tasks, specify Agent to complete tasks at specified times, and view task completion status.

### TODO:

- [ ] A Docker version will be added later, with a built-in Linux desktop and built-in Chrome configure remote ports, unified environment for better usability. Then control via web interface. Usable on any device, including mobile phones 🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement LLM writing MCP for itself

### LLM

| LLM              | Usability | Remarks                          |
| ---------------- | --------- | -------------------------------- |
| claude           | ⭐⭐⭐⭐⭐    | No explanation                   |
| openai           | ⭐⭐⭐⭐⭐    | Can also perfectly support multi-step function calls (gpt-4o-mini can also) |
| gemini flash 2.0 | ⭐⭐⭐⭐🌙   | Very useful                      |
| qwen             | ⭐⭐⭐⭐🌙   | Very useful                      |
| doubao           | ⭐⭐⭐🌙🌙   | Feels okay to use                |
| deepseek         | ⭐⭐⭐🌙🌙   | Multi-step function calls have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure that `uv + nodejs` are installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line, or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```

### [npx & nodejs](https://nodejs.org/en)

Install using the command line, or download and install from the official website, [nodejs](https://nodejs.org/en)

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

* If you encounter a damaged or permission issue on MacOS, run `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users should manually set PATH with `echo $PATH`, Windows version of `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Calling shell MCP
![image.png](./images/image55.png)

#### Calling terminal MCP, ssh + can execute commands
![image.png](./images/image62.png)

#### One-click web page writing and publishing to (cloudflare)
![image.png](./images/image60.png)

#### Calling Google search, asking what TGA Game of the Year is
![image.png](./images/image22.png)

#### Organizing Zhihu hot searches
![image.png](./images/image36.png)

#### Helping you open web pages, analyze results, and write to files
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### MCP Market (experimental)
![image.png](./images/image43.png)

#### Installing MCP interface from the market (experimental)
![image.png](./images/image45.png)

#### Installing MCP from third parties (supports any MCP)
![image.png](./images/image44.png)

#### Installing MCP interface from third parties
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

#### Rendering HTML, supports `Artifacts`, `SVG`, `HTML` rendering
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, testing model capabilities
![image.png](./images/image48.png)

#### Knowledge Base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any operations, such as web crawling behavior, it is not related to the developers of this project.