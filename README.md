[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open pursuit Chat client that can use APIs from various LLMs, fully supports MCP, and offers the best Chat experience. It also implements productivity MAX tools based on native Agents.

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market, user-friendly MCP installation and configuration, one-click installation, and contributions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.
* Also supports manual installation of third-party MCPs, just fill in `command`, `args`, `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] `MCP` extension market + third-party MCP support
- [x] Supports the free creation of `Agents`, preset prompt words, and selection of MCP functions
- [x] 🪟Windows + 🍏MacOS + Linux + Docker(coming soon)
- [x] Run from the command line, npx -y @dadigua/hyper-chat, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Supports dark mode🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error catching, and opening Chrome console
- [x] Optimized Agent display, supports search and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering increases highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] Adds `RAG`, based on the MCP knowledge base
- [x] Introduces the concept of ChatSpace, supports multi-conversation chatting
- [x] Supports Agent Call Agent via HyperAgent's MCP
- [x] Adds scheduled tasks, designates Agents to complete tasks on schedule, and displays task completion status.

### TODO:

- [ ] Will add a Docker version, with built-in Linux desktop, built-in Chrome configuration for remote ports, unifying the environment for better usability. Then control through a web interface. Usable on any device, including mobile phones🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement LLM writing its own MCP

### LLM

| LLM              | Usability  | Notes                                |
| ---------------- | ---------- | ------------------------------------ |
| claude           | ⭐⭐⭐⭐⭐     | No explanation                        |
| openai           | ⭐⭐⭐⭐⭐     | Also perfectly supports multi-step function calls (gpt-4o-mini also works) |
| gemini flash 2.0 | ⭐⭐⭐⭐🌙    | Very useful                          |
| qwen             | ⭐⭐⭐⭐🌙    | Very useful                          |
| doubao           | ⭐⭐⭐🌙🌙    | Feels okay to use                    |
| deepseek         | ⭐⭐⭐🌙🌙    | Multi-step function calls can have issues |

## Usage

* 1. Configure APIKEY, make sure your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line, or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```

### [npx & nodejs](https://nodejs.org/en)

Install via command line, or download and install from the official website, official [nodejs](https://nodejs.org/en)
```
# MacOS
brew install node
# windows
winget install OpenJS.NodeJS.LTS
```

## Development

```
cd electron && npm install
cd web && pnpm install
npm install
npm run dev
```

## Notice

* MacOS users encountering damaged or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually enter PATH `echo $PATH`, Windows version `nvm` seems to work directly

![image.png](./images/image47.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Call shell mcp
![image.png](./images/image55.png)

#### Call terminal mcp, ssh + can also execute commands
![image.png](./images/image62.png)

#### One-click webpage writing and publish to (cloudflare)
![image.png](./images/image60.png)

#### Call Google search, ask what the TGA Game of the Year is
![image.png](./images/image22.png)

#### Organize Zhihu hot searches
![image.png](./images/image36.png)

#### Help you open a webpage, analyze results, and write to a file
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### MCP market (experimental)
![image.png](./images/image43.png)

#### Install mcp interface from market (experimental)
![image.png](./images/image45.png)

#### Install mcp from third-party (supports any mcp)
![image.png](./images/image44.png)

#### Install mcp interface from third-party
![image.png](./images/image46.png)

#### MCP list (can be dynamically selected)
![image.png](./images/image21.png)

#### Render HTML, supports `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, test model capabilities
![image.png](./images/image48.png)

#### Knowledge base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any actions, such as web scraping, it has nothing to do with the developers of this project.