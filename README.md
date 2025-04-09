[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open-source Chat client that supports MCP and can utilize various LLM APIs to provide the best chat experience as well as productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* Supports OpenAI-style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace with user-friendly MCP installation and configuration; one-click installation; welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCPs by filling in `command`, `args`, and `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Run from command line: `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `WebDAV` synchronization
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Supports free creation and design of `Agent`, allowing preset prompts and selection of MCP functions
- [x] Supports dark mode🌙
- [x] Supports Resources, Prompts, Tools
- [x] Supports both English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JavaScript error catching, and the ability to open Chrome's console
- [x] Optimized Agent display with search and drag-and-drop sorting
- [x] Supports `KaTeX` for displaying mathematical formulas, code rendering with syntax highlighting and quick copy
- [x] Adds `RAG` based on MCP knowledge base
- [x] Introduces the concept of ChatSpace, allowing multiple conversations to chat simultaneously
- [x] Supports Agent Call Agent through HyperAgent's MCP
- [x] Adds scheduled tasks, specifying Agents to complete tasks periodically, and view task completion status.


### TODO:

- Support for official Claude protocol

### LLM

| LLM      | Usability    | Notes                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐ | Can also perfectly support multi-step function calls (gpt-4o-mini can also) |
| gemini flash 2.0   | ⭐⭐⭐⭐ | Very useful |
| qwen       | ⭐⭐⭐⭐    | Very useful                 |
| doubao       | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐⭐      | Multi-step function calls may have issues       |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Make sure `uv + nodejs` are installed in your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line or download and install from the official website, [nodejs](https://nodejs.org/en)
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

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Chat supports model comparison selection
![image_2025-04-07_21-26-19](https://github.com/user-attachments/assets/e8691cd7-0518-4da8-90f2-7dfd8b864a09)

#### Supports clicking tool names for direct debugging
![image](https://github.com/user-attachments/assets/4af1b769-de19-4cab-8a90-7f701b9a8d70)

#### MCP calling Tool prompt + dynamically modifying LLM call Tool parameters
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### Supports @ for quick input + calling Agent
![17790cb3c686690e255462c7638b61f6](https://github.com/user-attachments/assets/12fd824c-cad7-4dd7-8df3-699c1da8d1cf)

#### Supports rendering of `Artifacts`, `SVG`, `HTML`, `Mermaid`
![image](https://github.com/user-attachments/assets/d823c671-e989-4f40-aadb-0bc0f3b35175)
![image](https://github.com/user-attachments/assets/869b03fe-f025-4d6d-945c-8dac13d37ee0)

#### Supports selecting MCP + selecting some Tool
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)

#### You can access from anywhere + any device via web, and you can set a password
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)

#### Calling terminal MCP automatically helps me analyze ASAR files + help me extract
![image](https://github.com/user-attachments/assets/16c0dba7-ae62-4261-a068-1217b5e9bd3c)

#### Calling terminal view interface
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)

#### Amap MAP MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### One-click webpage writing and publishing to (cloudflare)
![image](https://github.com/user-attachments/assets/e869b8ab-a430-4f22-a2db-d4ef8e6f36a4)

#### Calling Google Search, asking what the TGA Game of the Year is
![image](https://github.com/user-attachments/assets/f8f36547-dfcb-423a-8d83-f53234b0d94a)

#### What are the limited-time free games? Please visit the URL and call the tool
![image](https://github.com/user-attachments/assets/6d4c4144-2749-4d03-9824-9ead5c37bc51)

#### Helps you open web pages, analyze results, and write to a file
![image](https://github.com/user-attachments/assets/302bda76-dcbf-4a4d-bfb4-39f3a911434b)

#### Using web tools + command line tools, open GitHub README to learn + GIT clone + setting up development environment
![image](https://github.com/user-attachments/assets/6affd3dd-aa8e-4429-9c70-d456e5376786)

#### Multiple chat workspaces + night mode
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)

#### Scheduled task list + night mode
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)

#### Install MCP from third-party (supports any MCP) 
![image](https://github.com/user-attachments/assets/173484f1-58b3-4e55-821c-ec6ef6cd0572)


#### Third-party MCP installation interface
![image](https://github.com/user-attachments/assets/06b1b2d4-e368-45f2-ac81-b9080838f9f5)



#### H5 interface
![image](https://github.com/user-attachments/assets/e8349fb5-c98e-4fef-a93d-778079a27237)
![image](https://github.com/user-attachments/assets/8a381114-6b26-4af2-90f2-270c0e85e819)
![image](https://github.com/user-attachments/assets/b1487b6b-2cbc-46d8-ab1e-a335417c23ce)
![image](https://github.com/user-attachments/assets/3a51dab9-375b-479b-8c6b-74a1be0dd037)


#### Testing model capabilities
![image.png](./images/image48.png)

#### Knowledge base
![image.png](./images/image50.png)

## Disclaimer

* This project is intended for learning and communication purposes only. If you use this project for any operations, such as web crawling, it is unrelated to the developers of this project.