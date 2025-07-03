## 简介

HyperChat 是一个开源的Chat客户端，支持MCP，可以使用各家LLM的API，实现最好的Chat体验。以及实现生产力工具。

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)
[![@dadigua/hyper-chat](https://img.shields.io/npm/v/%40dadigua%2Fhyper-chat)](https://www.npmjs.com/package/@dadigua/hyper-chat)
[![npm downloads](https://img.shields.io/npm/dm/@dadigua/hyper-chat)](https://npm-stat.com/charts.html?package=@dadigua/hyper-chat)


* 支持 OpenAI风格的LLM，`OpenAI` ,`Claude`, `Claude(OpenAI)`, `Qwen`, `Deepseek`, `GLM`, `Ollama`，`xAI`, `Gemini` 。
* 完全支持MCP。

## DEMO

* [HyperChat](https://hyperchat.dadigua.men/123456/) on Nodejs
* [Docker](https://htmivlknrjln.ap-northeast-1.clawcloudrun.com/123456/#/Chat) on ClawCloud

## 功能: 

- [x] **🪟Windows** + **🍏MacOS** + **Linux**
- [x] 命令行运行，`npx -y @dadigua/hyper-chat`，默认端口 16100, 密码 123456, Web访问 http://localhost:16100/123456/
- [x] Docker 
    * 命令行的版本 `docker pull dadigua/hyperchat-mini:latest`
    * Ubuntu桌面 + Chrome + BrowserUse 版本(**coming soon**)
- [x] `WebDAV` 支持增量同步，通过hash最快速同步。
- [x] `HyperPrompt` 提示词语法，支持变量（文本+js代码变量），基础语法检测+Hover实时预览。
- [x] `MCP`扩展
- [x] 支持暗黑模式🌙
- [x] Resources，Prompts，Tools 支持
- [x] 支持英文和中文
- [x] 支持 `Artifacts`, `SVG`,`HTML`,`Mermaid`渲染
- [x] 支持定义Agent，可以预设提示词，选择允许的MCP
- [x] 支持定时任务，指定Agent定时完成任务，以及查看任务完成情况。
- [x] 支持 `KaTeX`，显示数学公式，代码Code渲染增加高亮和快速复制
- [x] 添加`RAG`，基于mcp知识库
- [x] 添加ChatSpace概念，支持多对话同时聊天
- [x] 支持聊天支持选择模型对比

### TODO:

- 实现多Agent交互系统。

### LLM

| LLM      | 好用度    | 备注                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐⭐  | 不解释                    |
| openai   | ⭐⭐⭐⭐⭐ | 也可以完美支持多步function call(gpt-4o-mini也可以) |
| gemini flash 2.5   | ⭐⭐⭐⭐⭐ |  很好用 |
| qwen       | ⭐⭐⭐⭐    | 很好用                 |
| doubao       | ⭐⭐⭐    | 使用起来感觉还行                   |
| deepseek | ⭐⭐⭐⭐      | 最近提升了       |

## 使用

* 1.配置APIKEY，确保你的LLM服务兼容OpenAI风格。
* 2.确保您的系统中已安装 `uv + nodejs` 等。

### [uvx & uv](https://github.com/astral-sh/uv)

使用命令行安装，或者去看官方Github教程 [uv](https://github.com/astral-sh/uv)

```
# MacOS
brew install uv
# windows
winget install --id=astral-sh.uv  -e
```
### [npx & nodejs](https://nodejs.org/en)

使用命令行安装，或者去官网下载安装，官网 [nodejs](https://nodejs.org/en)
```
# MacOS
brew install node
# windows
winget install OpenJS.NodeJS.LTS
```

## 开发

```
cd electron && npm install
cd web && npm install
npm install
npm run dev
```

## HyperChat用户交流

* [Telegram](https://t.me/dadigua001)
* [QQ群](https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim)

#### 超级输入，支持变量（文本+js代码变量），基础语法检测+Hover实时预览
![动画](https://github.com/user-attachments/assets/b1ec72d9-be05-4f9a-bed1-16f4ed72de61)

#### 聊天支持选择模型对比
![image_2025-04-07_21-26-19](https://github.com/user-attachments/assets/e8691cd7-0518-4da8-90f2-7dfd8b864a09)
![image](https://github.com/user-attachments/assets/c9cd15c8-9bce-4df9-b2b2-5fc4e9224ea6)

#### 支持点击tool名称，直接调用调试
![image](https://github.com/user-attachments/assets/a9b22e98-d7b7-497a-93aa-c1501763fb8a)

#### mcp调用Tool提示 + 动态修改LLM调用Tool的参数
![image](https://github.com/user-attachments/assets/080320e3-37d2-4f5a-ae3d-3517b3d692ad)

#### 支持 @ 快速输入 + 调用Agent
![image](https://github.com/user-attachments/assets/405ab516-fb8d-4f5b-b0f4-f3470354059e)


#### 支持 `Artifacts`, `SVG`,`HTML`,`Mermaid` 渲染,
![image](https://github.com/user-attachments/assets/d823c671-e989-4f40-aadb-0bc0f3b35175)
![image](https://github.com/user-attachments/assets/869b03fe-f025-4d6d-945c-8dac13d37ee0)

#### 支持选择MCP + 选择部分Tool
![image](https://github.com/user-attachments/assets/9a297608-90be-4960-a4f1-ae627965486b)

#### 你可以通过Web在任何地方+任何设备访问，并且可以设置密码
![image](https://github.com/user-attachments/assets/a9825e5b-da6d-4e0a-852f-177a3f6df992)

#### 调用terminal mcp  自动帮我分析asar文件 + 帮我解压
![image](https://github.com/user-attachments/assets/f9cc12cd-0c7e-4f2d-9649-4bb31240f4a6)

#### 调用terminal，编译并升级nginx
![image](https://github.com/user-attachments/assets/29a659cc-c844-4ca9-abe0-ff4372882f6b)


#### 高德地图MCP
![image](https://github.com/user-attachments/assets/549e8fee-085d-4e8a-86a8-184ebe1053e6)

#### 一键写网页，并发布到（cloudflare）
![image](https://github.com/user-attachments/assets/b558cf5c-8b07-4621-a95b-fa1c33181414)


#### 调用谷歌搜索，问他TGA年度游戏是什么
![image](https://github.com/user-attachments/assets/36500a06-2260-4727-bfd2-5fedc72e6d58)

#### 有什么限时免费游戏，请访问网址，调用工具
![image](https://github.com/user-attachments/assets/8961ef09-1498-4730-b25d-75b1dedbc7e5)

#### 帮你打开网页，分析结果，并写入文件
![image](https://github.com/user-attachments/assets/a036dcf8-ffb4-4070-ac4f-a3b0533f66c2)


#### 通过网页工具+命令行工具，打开Github README学习 + GIT克隆 + 搭建开发黄金
![image](https://github.com/user-attachments/assets/fd0d737e-0eaa-4410-85e0-27fd45f0e5a5)


#### 多聊天Workspace + 夜间模式
![image](https://github.com/user-attachments/assets/ca9d77d7-d023-431f-8359-6023ab3e338a)

#### 定时任务列表 +  定时发送消息给Agent 完成任务
![image](https://github.com/user-attachments/assets/302a767c-bd00-48e4-ac41-5443d98a4708)

#### 从第三方安装mcp（支持任意mcp） 
![image](https://github.com/user-attachments/assets/8580f194-139c-4d1c-b423-68627663232c)





#### h5界面
![image](https://github.com/user-attachments/assets/e8349fb5-c98e-4fef-a93d-778079a27237)
![image](https://github.com/user-attachments/assets/8a381114-6b26-4af2-90f2-270c0e85e819)
![image](https://github.com/user-attachments/assets/b1487b6b-2cbc-46d8-ab1e-a335417c23ce)
![image](https://github.com/user-attachments/assets/3a51dab9-375b-479b-8c6b-74a1be0dd037)


#### 测试模型能力
![image.png](./images/image48.png)

#### 知识库
![image.png](./images/image50.png)

## 免责声明

* 本项目仅供学习交流使用，如果您使用本项目进行任何操作，如爬虫行为等，与本项目开发者无关。
