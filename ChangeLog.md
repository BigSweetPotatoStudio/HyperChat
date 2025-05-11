[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


```
# 1.7.2

* Added terminal display, manual command input + AI model via `hyper_terminal` MCP tool
* Fixed bugs

![image](https://github.com/user-attachments/assets/70da7e2b-5555-4611-863c-f71ded3432b2)
![7ec10af4a0474fbb3ed39e13a383bc3a](https://github.com/user-attachments/assets/0ba16d29-136c-4788-91d8-8c8dbc754716)
![b6042f845409bddbcd6ad3f712f27216](https://github.com/user-attachments/assets/62549b1c-4e27-40fb-b877-b9a4be157778)


# 1.7.0

* Improved tool compatibility for Gemini
* Fixed the tool selection count error for some MCP tools
* HyperTool, fetch tool will automatically scroll (some data is lazy-loaded and requires scrolling to trigger it), search tool speed enhancement
* Modified variable prefix naming, changing scope to namespace
* Electron version, added settings for startup window size
* Node.js version, added network settings to allow direct connection via local browser
* Fixed bugs

![image](https://github.com/user-attachments/assets/5c51c083-4ed8-4961-af62-ec34eba3e08e)
![image](https://github.com/user-attachments/assets/943e454e-8506-4a87-a486-d5f465b470f1)
![image](https://github.com/user-attachments/assets/b958bf63-add2-434a-a8e1-405ee1c773d9)


# 1.6.5

* Fixed tool invocation issues for models like Qwen3, added compatibility mode for tool invocation similar to cline, using regex to match <tool_use>
* View repair task results interface, display abnormal issues
* Fixed bugs

# 1.6.3
* Brand new input editor, optimized display, added variable system, supports built-in MCP setting variables, supports JS code variables
* Large model list, supports filtering, optimized display
* Fixed issues with inputting prompts compatible with MCP
* Agent list supports hover descriptions
* WebDAV synchronization optimization
* See MCP supports adding headers
* Chat history performance optimization, using virtual list + display optimization


![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)
![image](https://github.com/user-attachments/assets/6b91d593-51ef-4e51-8d1b-324bc071e9a7)

# 1.5.4
* Fixed issues with web access, added large model test failure problems.

# 1.5.3

* Supports Claude official API
* Optimized built-in terminal, allowing user input
* Supports Agent task invocation failure, using alternative large model
* Added built-in Agent, `MCP helper`, to assist in MCP installation
* Fixed Markdown rendering bug
* Fixed bug for multi-model comparison in chat

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supports chat renaming
* Supports MCP configuration synchronization
* Supports grok3 thinking chain
* Supports AI-generated cron expressions
* Supports message fork cloning
* Supports development mode, quick export of conversation configurations for debugging
* Added enable/disable switch for Claude's MCP
* Added global control enable/disable switch for Task execution
* Optimized tool invocation cancellation, notifying large model users of operation cancellation

![支持聊天重命名](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![支持mcp配置同步](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![支持grok3的思维链](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![支持ai生成cron表达式](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![支持消息分叉克隆](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![支持开发模式，快速导出对话配置，用于调试](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![支持Task运行全局控制启用，禁用](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![支持开发模式，快速导出对话配置，用于调试](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![工具调用取消优化，告诉大模型用户取消了操作](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)



# 1.4.17
* Fixed issue of unable to copy in MacOS, and other shortcut keys not working

# 1.4.16

* Supports displaying MCP Server version number and name
* Added detailed error display when model errors occur
* Added detailed error display when MCP errors occur
* Optimized chat history storage, separating conversation messages to reduce loading and synchronization time
* Modified WebDAV synchronization
* Supports MCP in Claude Desktop configuration
* Supports direct viewing of configuration files on the web
* Supports shortcut keys: MACOS `Alt+Cmd+I`, Windows `Ctrl+Shift+I` to open developer tools
* Chat history list supports displaying Agent icons
* Fixed numerous bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening from the browser, downloading, added support for `Mermaid` pre-release
* Modified tool invocation display
* Supports chat selection of multiple models for comparison

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixed the default conversation setting MCP invalid issue from the last version
* Fixed that the Agent cannot modify system prompts if there has been no chat
* Fixed the error prompt of no LLM when opening for the first time


# 1.4.1

* Fixed the bug of Gemini tool invocation not supporting multiple tools
* Supports selecting some tools of MCP to save tokens
* Supports quick input with @ + calling Agent
* Fixed bugs
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in MCP tool command line
* Supports changing network access password
* Tool invocation collapsible display
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm and modify large model invocation parameters when invoking tools
* Can click on tools to invoke them for testing
* The knowledge base is planned for redevelopment; currently, it is not recommended for use. You can use OpenAI's embedding model instead, without doing local embedding models
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added shortcut button
* Optimized mobile H5 display
* Fixed bugs
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking when invoking tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Mac, Linux automatically gets PATH, no need to enter PATH
* Added Linux deb package
* Fixed WebDAV first synchronization error
* Fixed bugs


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supports pasting in input box, uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* Fixed MacOS image upload
* Added quick copy button, supports buttons for copying messages and code
* WebDAV sync function optimization, only saving 10 versions locally
* Markdown code rendering added highlighting
* HTML Artifacts added error capture, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + MCP native installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDAV synchronization logic optimized, local backup before synchronization, synchronized every 5 minutes
* LLM added test function, testing whether it supports image input + tool invocation (using a bit of token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call from MCP resources
* Fixed bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server
* WebDAV synchronization, temporarily does not support MCP configuration synchronization, inconsistent operating systems may cause issues
* Supports setting request method, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening webpages



# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support counting token consumption for large models, such as Qianwen, support fuzzy statistics by word count
* Input box supports drag-and-drop file quick input
* My LLM Models list supports drag-and-drop sorting
* Supports quickly configuring Ollama and Qwen API models

## HyperTools

* Optimized the Tool for opening webpages, better information extraction. For example, answer this question `https://store.epicgames.com/zh-CN/   哪个游戏是限时免费的？`
```