[中文](README.zh.md) | [English](README.md)


## Functionality

HyperChat is an open-minded Chat client that can use APIs from various LLMs, fully supports MCP, and delivers the best Chat experience. It also implements a productivity MAX tool based on a native Agent.

* Supports OpenAI-style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market with user-friendly MCP installation configuration, one-click installation, and submissions are welcome at [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs by filling in `command`, `args`, `env`.

### MCP:

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Run from the command line: `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version: `docker pull dadigua/hyper-chat-mini`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `MCP` extension market + support for third-party MCPs
- [x] Supports free creation and design of `Agent`, with preset prompts and selection of MCP functions
- [x] Supports dark mode 🌙
- [x] Resources, Prompts, Tools supported
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error capture, and allows opening Chrome's console
- [x] Agent display optimization, supports search and drag-and-drop sorting
- [x] Supports `KaTeX` for displaying mathematical formulas, code rendering with highlighting and quick copy
- [x] `WebDAV` synchronization
- [x] Added `RAG` based on MCP knowledge base
- [x] Introduced ChatSpace concept, enabling multiple dialogues to chat simultaneously
- [x] Supports Agent Calling Agent through HyperAgent's MCP
- [x] Added scheduled tasks, allowing specified Agents to complete tasks at scheduled times and check task completion status.

### TODO:

- [ ] Future plans to add Docker version with built-in Linux desktop, Chrome configuration for remote ports, unify the environment for better management. Then web interface control. Usable on any device, including mobile phones. 🤣
- [ ] Permission pop-up, whether to allow
- [ ] Implement use of LLM to write MCP for itself

### LLM

| LLM      | Usability    | Notes                         |
| -------- | ------ | ---------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation needed                   |
| openai   | ⭐⭐⭐⭐⭐ | Also perfectly supports multi-step function calls (gpt-4o-mini can also) |
| gemini flash 2.0   | ⭐⭐⭐⭐🌙 | Very useful |
| qwen       | ⭐⭐⭐⭐🌙    | Very useful                 |
| doubao       | ⭐⭐⭐🌙🌙    | Feels okay to use                   |
| deepseek | ⭐⭐⭐🌙🌙      | Multi-step function calls may have issues       |

## Usage

* 1. Configure APIKEY, ensuring your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install via command line or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install via command line or download from the official site, [nodejs](https://nodejs.org/en)
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

* MacOS users encountering a damaged or permissions issue, `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* For MacOS `nvm` users, manually enter PATH `echo $PATH`, Windows version `nvm` can be used directly

![image.png](./images/image47.png)

## Telegram

[HyperChat user communication](https://t.me/dadigua001)

#### Call shell MCP
![image.png](./images/image55.png)

#### Call terminal MCP, ssh + can execute commands
![image.png](./images/image62.png)

#### One-click web page creation and publishing to (cloudflare)
![image.png](./images/image60.png)

#### Call Google Search to ask what the TGA Game of the Year is
![image.png](./images/image22.png)

#### Organize hot searches on Zhihu
![image.png](./images/image36.png)

#### Help you open a web page, analyze results, and write to a file
![image.png](./images/image13.png)

#### Open Baidu and take a screenshot
![image.png](./images/image61.png)

#### Scheduled task list
![image.png](./images/image52.png)

#### MCP market (experimental)
![image.png](./images/image43.png)

#### Install MCP interface from the market (experimental)
![image.png](./images/image45.png)

#### Install MCP from third parties (supports any MCP)
![image.png](./images/image44.png)

#### Install MCP interface from third parties
![image.png](./images/image46.png)

#### MCP list (can dynamically select)
![image.png](./images/image21.png)

#### Render HTML, supports `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### Interface 1
![image.png](./images/image51.png)

#### Interface 2
![image.png](./images/image34.png)

#### Interface 3, testing model capabilities
![image.png](./images/image48.png)

#### Knowledge base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any activities, such as web scraping, it has nothing to do with the developers of this project.