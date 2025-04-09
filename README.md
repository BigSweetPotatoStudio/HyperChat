[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open-source Chat client that supports MCP and can utilize APIs from various LLMs to provide the best Chat experience and productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)

* Supports OpenAI-style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly MCP installation and configuration, one-click installation, contributions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.
* Also supports manual installation of third-party MCPs by filling in `command`, `args`, and `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command-line operation, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Docker 
    * Command-line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu Desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `WebDAV` synchronization
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Supports free creation and design of `Agent`, preset prompts, and selection of MCP functions
- [x] Supports dark mode 🌙
- [x] Supports Resources, Prompts, and Tools
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, js error capturing, supports opening Chrome's console
- [x] Optimized Agent display, supports searching, drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering adds highlighting and quick copy
- [x] Adds `RAG`, based on MCP knowledge base
- [x] Introduces ChatSpace concept, supports multiple conversations simultaneously
- [x] Supports Agent Call Agent through HyperAgent's MCP
- [x] Adds scheduled tasks, assigns Agents to complete tasks on schedule and check task completion.

### TODO:

- Support official Claude protocol

### LLM

| LLM      | Usability  | Notes                          |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation required      |
| openai   | ⭐⭐⭐⭐ | Also perfectly supports multi-step function calls (gpt-4o-mini also works) |
| gemini flash 2.0   | ⭐⭐⭐⭐ | Very useful                |
| qwen       | ⭐⭐⭐⭐    | Very useful                |
| doubao       | ⭐⭐⭐    | Feels okay to use          |
| deepseek | ⭐⭐⭐      | Multi-step function calls may have issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Make sure you have `uv + nodejs` installed in your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using command line, or check the official Github tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line, or download and install from the official website [nodejs](https://nodejs.org/en)
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

#### Chat support for model comparison
![image_2025-04-07_21-26-19](https://github.com/user-attachments/assets/e8691cd7-0518-4da8-90f2-7dfd8b864a09)

#### Supports clicking tool names for direct debugging
![image](https://github.com/user-attachments/assets/4af1b769-de19-4cab-8a90-7f701b9a8d70)

#### MCP calling Tool tips + dynamically modifying LLM calling Tool parameters
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### Supports @ quick input + calling Agent
![17790cb3c686690e255462c7638b61f6](https://github.com/user-attachments/assets/12fd824c-cad7-4dd7-8df3-699c1da8d1cf)

#### Supports `Artifacts`, `SVG`, `HTML`, `Mermaid` rendering,
![image](https://github.com/user-attachments/assets/d823c671-e989-4f40-aadb-0bc0f3b35175)
![image](https://github.com/user-attachments/assets/869b03fe-f025-4d6d-945c-8dac13d37ee0)

#### Supports selecting MCP + specific Tool selection
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)

#### You can access the Web from anywhere + any device and set a password
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)

#### Calling terminal MCP to automatically analyze ASAR files + help me decompress
![image](https://github.com/user-attachments/assets/f9cc12cd-0c7e-4f2d-9649-4bb31240f4a6)

#### Calling terminal View interface
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)

#### Gaode Map MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### One-click webpage creation and publish to (cloudflare)
![image](https://github.com/user-attachments/assets/b558cf5c-8b07-4621-a95b-fa1c33181414)

#### Calling Google Search, asking what the TGA Game of the Year is
![image](https://github.com/user-attachments/assets/36500a06-2260-4727-bfd2-5fedc72e6d58)

#### What are the limited-time free games, please visit the website and call the tool
![image](https://github.com/user-attachments/assets/8961ef09-1498-4730-b25d-75b1dedbc7e5)

#### Help you open web pages, analyze results, and write to files
![image](https://github.com/user-attachments/assets/a036dcf8-ffb4-4070-ac4f-a3b0533f66c2)

#### Use web tools + command line tools, open GitHub README to learn + GIT clone + build development gold
![image](https://github.com/user-attachments/assets/fd0d737e-0eaa-4410-85e0-27fd45f0e5a5)

#### Multi-chat Workspace + Night mode
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)

#### Scheduled task list + Night mode
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)

#### Install MCP from third parties (supports any MCP)
![image](https://github.com/user-attachments/assets/173484f1-58b3-4e55-821c-ec6ef6cd0572)

#### MCP installation interface from third party
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

* This project is for learning and communication purposes only. If you use this project for any operations, such as web scraping, it has no relation to the developers of this project.