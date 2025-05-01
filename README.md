[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open-source chat client that supports MCP and can utilize APIs from various LLMs to achieve the best chat experience and productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* Supports OpenAI-style LLMs: `OpenAI`, `Claude`, `Claude(OpenAI)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`, `xAI`, `Gemini`.
* Fully supports MCP.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Nodejs
* [Docker](https://htmivlknrjln.ap-northeast-1.clawcloudrun.com/123456/#/Chat) on ClawCloud

## Features: 

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line run: `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access at http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `WebDAV` supports incremental syncing, with the fastest synchronization through hashing.
- [x] `HyperPrompt` prompt syntax, supports variables (text + js code variables), basic syntax checking + hover live preview.
- [x] `MCP` extensions
- [x] Supports dark mode🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML`, `Mermaid` rendering
- [x] Supports defining agents, preset prompts, and selecting allowed MCPs
- [x] Supports scheduled tasks, specifying agents to complete tasks on a schedule, and viewing task completion status.
- [x] Supports `KaTeX`, displaying mathematical formulas, code rendering with highlighting and quick copy
- [x] Added `RAG`, based on the MCP knowledge base
- [x] Introduced the ChatSpace concept, supporting multiple conversations at the same time
- [x] Supports model comparison selection in chat

### TODO:

- Implement a multi-agent interaction system.

### LLM

| LLM      | Usability   | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐⭐ | Can also perfectly support multi-step function calls (gpt-4o-mini can also) |
| gemini flash 2.5   | ⭐⭐⭐⭐⭐ | Very user-friendly |
| qwen       | ⭐⭐⭐⭐    | Very user-friendly                 |
| doubao       | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐⭐⭐      | Recently improved       |

## Usage

* 1. Configure APIKEY, ensure that your LLM service is compatible with OpenAI style.
* 2. Ensure you have `uv + nodejs` installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line, or check the official Github tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# Windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line, or go to the official site to download and install, the official site [nodejs](https://nodejs.org/en)
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

## HyperChat User Communication

* [Telegram](https://t.me/dadigua001)
* [QQ Group](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

#### Super input, supports variables (text + js code variables), basic syntax checking + hover live preview
![动画](https://github.com/user-attachments/assets/b1ec72d9-be05-4f9a-bed1-16f4ed72de61)

#### Chat supports model comparison selection
![image_2025-04-07_21-26-19](https://github.com/user-attachments/assets/e8691cd7-0518-4da8-90f2-7dfd8b864a09)
![image](https://github.com/user-attachments/assets/c9cd15c8-9bce-4df9-b2b2-5fc4e9224ea6)

#### Supports clicking the tool name for direct debugging
![image](https://github.com/user-attachments/assets/a9b22e98-d7b7-497a-93aa-c1501763fb8a)

#### MCP calls Tool prompts + dynamically modify LLM call Tool parameters
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### Supports @ quick input + calling Agent
![17790cb3c686690e255462c7638b61f6](https://github.com/user-attachments/assets/12fd824c-cad7-4dd7-8df3-699c1da8d1cf)

#### Supports rendering `Artifacts`, `SVG`, `HTML`, `Mermaid`
![image](https://github.com/user-attachments/assets/d823c671-e989-4f40-aadb-0bc0f3b35175)
![image](https://github.com/user-attachments/assets/869b03fe-f025-4d6d-945c-8dac13d37ee0)

#### Supports selecting MCP + choosing specific Tools
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)

#### You can access from anywhere + any device through the web, and set a password
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)

#### Call terminal MCP to automatically analyze the ASAR file + help me extract it
![image](https://github.com/user-attachments/assets/f9cc12cd-0c7e-4f2d-9649-4bb31240f4a6)

#### Call terminal view interface
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)

#### Gaode Map MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### One-click webpage creation and publish to (Cloudflare)
![image](https://github.com/user-attachments/assets/b558cf5c-8b07-4621-a95b-fa1c33181414)


#### Call Google Search, ask what the TGA Game of the Year is
![image](https://github.com/user-attachments/assets/36500a06-2260-4727-bfd2-5fedc72e6d58)

#### What are the limited-time free games; visit the website to call the tool
![image](https://github.com/user-attachments/assets/8961ef09-1498-4730-b25d-75b1dedbc7e5)

#### Help you open a webpage, analyze the results, and write to a file
![image](https://github.com/user-attachments/assets/a036dcf8-ffb4-4070-ac4f-a3b0533f66c2)


#### Learn through web tools + command line tools, open Github README + GIT clone + set up a developer environment
![image](https://github.com/user-attachments/assets/fd0d737e-0eaa-4410-85e0-27fd45f0e5a5)


#### Multi-chat Workspace + Night Mode
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)

#### Scheduled task list + regularly send messages to the Agent to complete tasks
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)

#### Install MCP from third parties (supports any MCP)
![image](https://github.com/user-attachments/assets/8580f194-139c-4d1c-b423-68627663232c)

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

* This project is for learning and communication purposes only. If you use this project for any operations, such as web scraping, etc., it has nothing to do with the developers of this project.