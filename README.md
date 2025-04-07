[中文](README.zh.md) | [English](README.md)


## Introduction

HyperChat is an open-source chat client that supports MCP and can use APIs from various LLMs to achieve the best chat experience as well as productivity tools.

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)  
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)  
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)  

* Supports OpenAI-style LLMs, `OpenAI`, `Claude(OpenRouter)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`.  
* Built-in MCP plugin market with user-friendly MCP installation configuration, one-click installation, and contributions to [HyperChatMCP](https://github.com/BigSweetPotatoStudio/HyperChatMCP) are welcome.  
* Also supports manual installation of third-party MCPs by filling in `command`, `args`, `env`.  

## DEMO 

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Docker  

## Features: 

- [x] **🪟Windows** + **🍏MacOS** + **Linux**  
- [x] Command line run, `npx -y @dadigua/hyper-chat`, default port 16100, password 123456, Web access http://localhost:16100/123456/  
- [x] Docker   
    * Command line version `docker pull dadigua/hyperchat-mini:latest`  
    * Ubuntu desktop + Chrome + BrowserUse version (**coming soon**)  
- [x] `WebDAV` synchronization  
- [x] `MCP` extension market + third-party MCP support  
- [x] Supports freely creating and designing `Agent`, can preset prompts and choose MCP functions  
- [x] Supports dark mode 🌙  
- [x] Resources, Prompts, Tools support  
- [x] Supports English and Chinese  
- [x] Supports `Artifacts`, `SVG`, `HTML` rendering, js error capture, supports opening the Chrome console  
- [x] Agent display optimization, supports search and drag-and-drop sorting  
- [x] Supports `KaTeX`, displays mathematical formulas, code rendering increases highlighting and quick copying  
- [x] Adds `RAG`, based on MCP knowledge base  
- [x] Adds ChatSpace concept, supports multiple conversations to chat simultaneously  
- [x] Supports Agent Call Agent through HyperAgent's MCP  
- [x] Adds scheduled tasks, specifies an Agent to complete tasks regularly, and view task completion status.  

### TODO: 

- Support official Claude protocol  

### LLM  

| LLM      | Usability    | Remarks                         |  
| -------- | ------ | ---------------------------- |  
| claude   | ⭐⭐⭐⭐⭐  | No explanation                    |  
| openai   | ⭐⭐⭐⭐ | Also perfectly supports multiple step function calls (gpt-4o-mini also works) |  
| gemini flash 2.0   | ⭐⭐⭐⭐ | Very usable |  
| qwen       | ⭐⭐⭐⭐    | Very usable                 |  
| doubao       | ⭐⭐⭐    | Feels okay to use                   |  
| deepseek | ⭐⭐⭐      | Multiple step function calls will have issues       |  

## Usage  

* 1. Configure APIKEY, ensure your LLM service is compatible with OpenAI style.  
* 2. Ensure `uv + nodejs` are installed in your system.  

### [uvx & uv](https://github.com/astral-sh/uv)  

Install via command line, or check the official GitHub tutorial [uv](https://github.com/astral-sh/uv)  

```
# MacOS  
brew install uv  
# windows  
winget install --id=astral-sh.uv  -e  
```  

### [npx & nodejs](https://nodejs.org/en)  

Install via command line or download from the official website [nodejs](https://nodejs.org/en)  
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

[HyperChat User Group](https://t.me/dadigua001)  

#### Supports clicking tool names for direct debugging calls  
![image](https://github.com/user-attachments/assets/4af1b769-de19-4cab-8a90-7f701b9a8d70)  

#### MCP calling Tool prompts + dynamically modifying LLM calling Tool parameters  
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)  

#### Supports @ quick input + calling Agent  
![17790cb3c686690e255462c7638b61f6](https://github.com/user-attachments/assets/12fd824c-cad7-4dd7-8df3-699c1da8d1cf)  

#### Supports selecting MCP + selecting partial Tool  
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)  

#### You can access from anywhere + any device through Web, and set a password  
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)  

#### Calling terminal MCP automatically analyzes ASAR files + helps decompress  
![image](https://github.com/user-attachments/assets/16c0dba7-ae62-4261-a068-1217b5e9bd3c)  

#### Calling terminal view interface  
![image](https://github.com/user-attachments/assets/009317f2-d49b-432a-bb46-a15133d12f9f)  

#### Gaode Map MCP  
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)  

#### One-click web page writing and publishing to (cloudflare)  
![image](https://github.com/user-attachments/assets/e869b8ab-a430-4f22-a2db-d4ef8e6f36a4)  

#### Calling Google search, asking what the TGA Game of the Year is  
![image](https://github.com/user-attachments/assets/f8f36547-dfcb-423a-8d83-f53234b0d94a)  

#### What are the limited-time free games, please visit the website to call the tool  
![image](https://github.com/user-attachments/assets/6d4c4144-2749-4d03-9824-9ead5c37bc51)  

#### Helps you open the webpage, analyze the results, and write into a file  
![image](https://github.com/user-attachments/assets/302bda76-dcbf-4a4d-bfb4-39f3a911434b)  

#### Through web tools + command line tools, open GitHub README to learn + GIT clone + set up development environment  
![image](https://github.com/user-attachments/assets/6affd3dd-aa8e-4429-9c70-d456e5376786)  

#### Multi-chat Workspace + Night mode  
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)  

#### Scheduled tasks list + Night mode  
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)  

#### Install MCP from third parties (supports any MCP)  
![image](https://github.com/user-attachments/assets/173484f1-58b3-4e55-821c-ec6ef6cd0572)  

#### MCP installation interface from third parties  
![image](https://github.com/user-attachments/assets/06b1b2d4-e368-45f2-ac81-b9080838f9f5)  

#### Rendering HTML, supports `Artifacts`, `SVG`, `HTML` rendering,  
![image.png](./images/image33.png)  

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

* This project is for learning and communication purposes only. The developers of this project are not responsible for any operations you carry out using this project, such as web scraping behavior, etc.