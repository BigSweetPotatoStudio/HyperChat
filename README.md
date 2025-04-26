[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open-source chat client that supports MCP and can use APIs from various LLMs to provide the best chat experience as well as productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Fully supports MCP.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features: 

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Command line run, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)
- [x] `WebDAV` supports incremental synchronization
- [x] Added `HyperPrompt` prompt syntax, supporting variables (text + JS code variables), basic syntax checking + hover real-time preview.
- [x] `MCP` extension
- [x] Supports dark mode🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML`, `Mermaid` rendering
- [x] Supports defining agents, presetting prompts, and selecting allowed MCPs
- [x] Supports scheduled tasks, specifying agents to complete tasks on time and view task completion status.
- [x] Supports `KaTeX`, displaying mathematical formulas, code rendering with highlighting and quick copy
- [x] Added `RAG`, based on mcp knowledge base
- [x] Introduced ChatSpace concept, supporting multiple conversations simultaneously
- [x] Supports chat model comparison selections

### TODO:

- Support official Claude protocol

### LLM

| LLM      | Usability    | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐ | Also supports multi-step function call perfectly (gpt-4o-mini also works) |
| gemini flash 2.0   | ⭐⭐⭐⭐ | Very useful |
| qwen       | ⭐⭐⭐⭐    | Very useful                 |
| doubao       | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐⭐      | Issues with multi-step function calls       |

## Usage

* 1. Configure the APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure that `uv + nodejs` and others are installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using the command line, or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using the command line, or go to the official site to download, official website [nodejs](https://nodejs.org/en)
```
# MacOS
brew install node
# windows
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

#### Super input supports variables (text + JS code variables), basic syntax detection + hover real-time preview
![Animation](https://github.com/user-attachments/assets/b1ec72d9-be05-4f9a-bed1-16f4ed72de61)

#### Chat supports model comparison selection
![image_2025-04-07_21-26-19](https://github.com/user-attachments/assets/e8691cd7-0518-4da8-90f2-7dfd8b864a09)
![image](https://github.com/user-attachments/assets/c9cd15c8-9bce-4df9-b2b2-5fc4e9224ea6)

#### Supports clicking tool names for direct invocation and debugging
![image](https://github.com/user-attachments/assets/a9b22e98-d7b7-497a-93aa-c1501763fb8a)

#### MCP calling Tool prompts + dynamic modification of LLM calling Tool parameters
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### Supports @ quick input + calling Agent
![17790cb3c686690e255462c7638b61f6](https://github.com/user-attachments/assets/12fd824c-cad7-4dd7-8df3-699c1da8d1cf)

#### Supports `Artifacts`, `SVG`, `HTML`, `Mermaid` rendering,
![image](https://github.com/user-attachments/assets/d823c671-e989-4f40-aadb-0bc0f3b35175)
![image](https://github.com/user-attachments/assets/869b03fe-f025-4d6d-945c-8dac13d37ee0)

#### Supports selecting MCP + selecting specific Tools
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)

#### You can access from anywhere + any device via the web and set a password
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)

#### Calling terminal MCP helps analyze ASAR files + helps unpack them
![image](https://github.com/user-attachments/assets/f9cc12cd-0c7e-4f2d-9649-4bb31240f4a6)

#### Calling terminal to view interface
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)

#### Gaode Map MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### One-click to write a webpage and publish to (cloudflare)
![image](https://github.com/user-attachments/assets/b558cf5c-8b07-4621-a95b-fa1c33181414)

#### Calling Google search, asking what the TGA annual game is
![image](https://github.com/user-attachments/assets/36500a06-2260-4727-bfd2-5fedc72e6d58)

#### What free games are time-limited, please visit the website, call the tool
![image](https://github.com/user-attachments/assets/8961ef09-1498-4730-b25d-75b1dedbc7e5)

#### Helps you open a webpage, analyze results, and write to a file
![image](https://github.com/user-attachments/assets/a036dcf8-ffb4-4070-ac4f-a3b0533f66c2)

#### Using web tools + command line tools to open GitHub README for learning + GIT clone + set up development gold
![image](https://github.com/user-attachments/assets/fd0d737e-0eaa-4410-85e0-27fd45f0e5a5)

#### Multi-chat Workspace + Night mode
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)

#### Scheduled task list + scheduled messages to the agent to complete tasks
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)

#### Installing MCP from third parties (supports any MCP) 
![image](https://github.com/user-attachments/assets/8580f194-139c-4d1c-b423-68627663232c)

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

* This project is for learning and communication purposes only. If you use this project for any operations such as web scraping, it is not related to the developers of this project.