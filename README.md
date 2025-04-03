[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open-source Chat client that supports MCP and can use APIs from various LLMs to achieve the best Chat experience and implement productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* Supports OpenAI-style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin marketplace, user-friendly installation and configuration for MCP, one-click installation, welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCP, just fill in `command`, `args`, `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features:

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line run, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu Desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `WebDAV` synchronization
- [x] `MCP` extension marketplace + third-party MCP support
- [x] Supports free creation, design `Agent`, can preset prompts, select MCP features
- [x] Supports dark mode🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capture, supports opening Chrome console
- [x] Agent display optimization, supports searching, drag-and-drop sorting
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering adds highlighting and quick copy
- [x] Added `RAG`, based on MCP knowledge base
- [x] Added ChatSpace concept, supports multiple conversations simultaneously
- [x] Supports Agent Call Agent via HyperAgent's MCP
- [x] Added scheduled tasks, specify agents to complete tasks regularly, and view task completion status.


### TODO:

- Support official Claude protocol

### LLM

| LLM       | Usability   | Remarks                          |
| --------- | ----------- | ------------------------------- |
| claude    | ⭐⭐⭐⭐⭐      | No explanation                  |
| openai    | ⭐⭐⭐⭐      | Can also perfectly support multi-step function call (gpt-4o-mini also works) |
| gemini flash 2.0 | ⭐⭐⭐⭐ | Very usable                    |
| qwen      | ⭐⭐⭐⭐      | Very usable                    |
| doubao    | ⭐⭐⭐        | Feels okay to use              |
| deepseek  | ⭐⭐⭐        | Multi-step function call has issues |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure `uv + nodejs` is installed in your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using command line, or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using command line, or download and install from the official website [nodejs](https://nodejs.org/en)
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

## Telegram

[HyperChat User Communication](https://t.me/dadigua001)

#### Click on tool name to directly call and debug
![image](https://github.com/user-attachments/assets/4af1b769-de19-4cab-8a90-7f701b9a8d70)

#### MCP call Tool prompt + dynamically modify LLM call Tool parameters
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### Supports @ quick input + call Agent
![17790cb3c686690e255462c7638b61f6](https://github.com/user-attachments/assets/12fd824c-cad7-4dd7-8df3-699c1da8d1cf)

#### Supports selecting MCP + selecting some Tools
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)

#### You can access via Web from anywhere + any device, and set a password
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)

#### Call terminal MCP to automatically analyze asar files + help me decompress
![image](https://github.com/user-attachments/assets/16c0dba7-ae62-4261-a068-1217b5e9bd3c)

#### Call terminal to view interface
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)

#### Amap MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### One-click write webpage and publish to (Cloudflare)
![image](https://github.com/user-attachments/assets/e869b8ab-a430-4f22-a2db-d4ef8e6f36a4)

#### Call Google Search to ask what the TGA Game of the Year is
![image](https://github.com/user-attachments/assets/f8f36547-dfcb-423a-8d83-f53234b0d94a)

#### What are the limited-time free games, please visit the website, call the tool
![image](https://github.com/user-attachments/assets/6d4c4144-2749-4d03-9824-9ead5c37bc51)

#### Help you open a webpage, analyze the result, and write to a file
![image](https://github.com/user-attachments/assets/302bda76-dcbf-4a4d-bfb4-39f3a911434b)

#### Use web tools + command line tools to open GitHub README for learning + GIT clone + set up Dev Golden
![image](https://github.com/user-attachments/assets/6affd3dd-aa8e-4429-9c70-d456e5376786)

#### Multiple chat Workspaces + Night mode
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)

#### Scheduled task list + Night mode
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)

#### Install MCP from third-party (supports any MCP)
![image](https://github.com/user-attachments/assets/173484f1-58b3-4e55-821c-ec6ef6cd0572)


#### Third-party MCP installation interface
![image](https://github.com/user-attachments/assets/06b1b2d4-e368-45f2-ac81-b9080838f9f5)


#### Render HTML, support `Artifacts`, `SVG`, `HTML` rendering,
![image.png](./images/image33.png)

#### H5 interface
![image](https://github.com/user-attachments/assets/e8349fb5-c98e-4fef-a93d-778079a27237)
![image](https://github.com/user-attachments/assets/8a381114-6b26-4af2-90f2-270c0e85e819)
![image](https://github.com/user-attachments/assets/b1487b6b-2cbc-46d8-ab1e-a335417c23ce)
![image](https://github.com/user-attachments/assets/3a51dab9-375b-479b-8c6b-74a1be0dd037)


#### Test model capabilities
![image.png](./images/image48.png)

#### Knowledge Base
![image.png](./images/image50.png)

## Disclaimer

* This project is for learning and communication purposes only. If you use this project for any operations, such as web scraping, it has nothing to do with the developers of this project.