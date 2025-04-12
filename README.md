[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open-source chat client that supports MCP and can use various LLM APIs to provide the best chat experience, as well as productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* Supports OpenAI style LLMs: `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.
* Built-in MCP plugin market, user-friendly MCP installation configuration, one-click installation, and welcome to submit [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Also supports manual installation of third-party MCP, just fill in `command`, `args`, and `env`.

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker

## Features: 

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] Run from command line, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, web access http://localhost:16100/123456/
- [x] Docker 
    * Command line version `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu desktop + Chrome + BrowserUse version(**coming soon**)
- [x] `WebDAV` synchronization
- [x] `MCP` extension market + third-party MCP support
- [x] Supports freely creating and designing `Agent`, preset prompts, and selecting MCP features
- [x] Supports dark mode🌙
- [x] Resources, Prompts, Tools support
- [x] Supports English and Chinese
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, JS error capture, and allows opening Chrome's console
- [x] Agent display optimization, supports search, drag-and-drop sorting
- [x] Supports `KaTeX`, displaying mathematical formulas, code rendering includes highlighting and quick copying
- [x] Added `RAG`, based on the MCP knowledge base
- [x] Introduced ChatSpace concept, supports multiple conversations at the same time
- [x] Supports Agent Call Agent through HyperAgent's MCP
- [x] Added scheduled tasks, designate Agents to complete tasks on schedule, and check task completion status.


### TODO:

- Support official Claude protocol

### LLM

| LLM      | Usability    | Remarks                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |
| openai   | ⭐⭐⭐⭐ | Can also perfectly support multi-step function calls (gpt-4o-mini can too) |
| gemini flash 2.0   | ⭐⭐⭐⭐ | Very usable |
| qwen       | ⭐⭐⭐⭐    | Very usable                 |
| doubao       | ⭐⭐⭐    | Feels okay to use                   |
| deepseek | ⭐⭐⭐      | Multi-step function calls may have issues       |

## Usage

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.
* 2. Ensure that `uv + nodejs` is installed on your system.

### [uvx & uv](https://github.com/astral-sh/uv)

Install using command line, or refer to the official GitHub tutorial [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

Install using command line, or download from the official website, official site [nodejs](https://nodejs.org/en)
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

[HyperChat User Community](https://t.me/dadigua001)

#### Chat supports model comparison selection
![image_2025-04-07_21-26-19](https://github.com/user-attachments/assets/e8691cd7-0518-4da8-90f2-7dfd8b864a09)
![image](https://github.com/user-attachments/assets/c9cd15c8-9bce-4df9-b2b2-5fc4e9224ea6)

#### Supports clicking tool names for direct debugging calls
![image](https://github.com/user-attachments/assets/a9b22e98-d7b7-497a-93aa-c1501763fb8a)

#### MCP calls tool tips + dynamically modify LLM call tool parameters
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### Supports @ quick input + calling Agent
![17790cb3c686690e255462c7638b61f6](https://github.com/user-attachments/assets/12fd824c-cad7-4dd7-8df3-699c1da8d1cf)

#### Supports `Artifacts`, `SVG`, `HTML`, `Mermaid` rendering,
![image](https://github.com/user-attachments/assets/d823c671-e989-4f40-aadb-0bc0f3b35175)
![image](https://github.com/user-attachments/assets/869b03fe-f025-4d6d-945c-8dac13d37ee0)

#### Supports selecting MCP + choosing certain tools
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)

#### You can access via web from anywhere + any device and set a password
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)

#### Calls terminal MCP to automatically analyze asar files + helps with extraction
![image](https://github.com/user-attachments/assets/f9cc12cd-0c7e-4f2d-9649-4bb31240f4a6)

#### Calls terminal to view interface
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)

#### Gaode Map MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### One-click webpage creation and publish to (cloudflare)
![image](https://github.com/user-attachments/assets/b558cf5c-8b07-4621-a95b-fa1c33181414)


#### Calls Google search to ask what the TGA Game of the Year is
![image](https://github.com/user-attachments/assets/36500a06-2260-4727-bfd2-5fedc72e6d58)

#### For limited-time free games, please visit the website and call the tool
![image](https://github.com/user-attachments/assets/8961ef09-1498-4730-b25d-75b1dedbc7e5)

#### Helps open web pages, analyze results, and write to a file
![image](https://github.com/user-attachments/assets/a036dcf8-ffb4-4070-ac4f-a3b0533f66c2)


#### Through web tools + command line tools, open GitHub README to learn + GIT clone + set up development environment
![image](https://github.com/user-attachments/assets/fd0d737e-0eaa-4410-85e0-27fd45f0e5a5)


#### Multi-chat Workspace + Night mode
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)

#### Scheduled task list + scheduled messages to Agent to complete tasks
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)

#### Install MCP from third parties (supports any MCP) 
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

* This project is for learning and communication purposes only. If you use this project for any actions, such as web scraping, it is unrelated to the developers of this project.