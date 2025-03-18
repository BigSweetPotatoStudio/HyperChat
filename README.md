[中文](README.zh.md) | [English](README.md)


## Features

HyperChat is an open Chat client that can use APIs from various LLMs, fully supports MCP, and provides the best Chat experience. It also implements a productivity MAX tool based on native agents.

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation and configuration, one-click installation, contributions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.
* Also supports manual installation of third-party MCPs, fill in `command`, `args`, `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line execution, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyper-chat-mini:1.2.8`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Supports free creation and design of `Agent`, can preset prompts and select MCP functions
- [x] Supports dark mode🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capture, and the ability to open Chrome's console
- [x] Agent display optimization, supports searching and drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering adds highlighting and quick copying
- [x] `WebDAV` synchronization
- [x] Adds `RAG`, based on MCP knowledge base
- [x] Adds ChatSpace concept, supports multiple conversations simultaneously
- [x] Supports Agent Call Agent through HyperAgent's MCP
- [x] Adds scheduled tasks, specifies agents to complete tasks at scheduled times, as well as task completion status monitoring.

### TODO:

- [ ] A Docker version will be added later, with a built-in Linux desktop, built-in Chrome configuration for remote ports, unified environment, easier to manage. Then control through a web interface. It can be used on any device, including mobile phones. 🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement LLM to write MCP for itself

### LLM

| LLM                 | Usability    | Notes                             |
|---------------------|--------------|-----------------------------------|
| claude              | ⭐⭐⭐⭐⭐       | No explanation                    |
| openai              | ⭐⭐⭐⭐⭐       | Also perfectly supports multi-step function calls (gpt-4o-mini can also) |
| gemini flash 2.0    | ⭐⭐⭐⭐🌙      | Very usable                      |
| qwen                | ⭐⭐⭐⭐🌙      | Very usable                      |
| doubao              | ⭐⭐⭐🌙🌙      | Feels okay to use                |
| deepseek            | ⭐⭐⭐🌙🌙      | Multi-step function calls may have issues |

## Usage

* 1. Configure the APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed in your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line, or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install via command line, or download from the official website [nodejs](https://nodejs.org/en)
```
# MacOS
brew install node
# Windows
winget install OpenJS.NodeJS.LTS
```

## Development

```
cd electron && npm install
cd web && pnpm install
npm install
npm run dev
```

## Note

* MacOS encounters damaged or permission issues, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` users manually input PATH `echo $PATH`, Windows version `nvm` seems to be directly usable

![image.png](./images/image47.png)

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Call shell mcp
![image.png](./images/image55.png)

#### Call terminal mcp, ssh + can execute commands
![image.png](./images/image62.png)

#### One-click create webpage and publish to (cloudflare)
![image.png](./images/image60.png)

#### Call Google Search, ask what TGA Game of the Year is
![image.png](./images/image22.png)

#### Organize Zhihu hot searches
![image.png](./images/image36.png)

#### Help you open webpages, analyze results, and write to files
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### mcp marketplace (experimental)
![image.png](./images/image43.png)

#### Install mcp interface from the marketplace (experimental)
![image.png](./images/image45.png)

#### Install mcp from third party (supports any mcp)
![image.png](./images/image44.png)

#### Install mcp interface from third party
![image.png](./images/image46.png)

#### mcp list (can be dynamically selected)
![image.png](./images/image21.png)

#### Render HTML, supports `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, test model capabilities
![image.png](./images/image48.png)

#### Knowledge Base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any operations, such as web scraping, etc., it has nothing to do with the project developers.