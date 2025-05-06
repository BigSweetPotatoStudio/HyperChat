[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.7.0

* Improved tool compatibility, for gemini
* Fixed the issue where some tools for selecting mcp displayed incorrect counts of selected tools.
* HyperTool and fetch tools will auto-scroll (some data is lazy-loaded and needs scroll triggering), and search tool speed has been improved.
* Changed the prefix naming of variables, changing scope to namespace.
* fixbug

# 1.6.5

* Fixed tool calls for models like qwen3, added a tool call compatibility mode similar to cline, using regex to match <tool_use>,
* View repair task results interface, displaying issues.
* fixbug

# 1.6.3
* A brand new input editor, optimized display, added a variable system, supports built-in mcp setting variables, supports js code variables
* Large model list, supports filtering, optimized display
* Fixed the issue where inputting supported mcp prompts failed
* Agent list supports hover display descriptions.
* WebDAV sync optimization.
* See MCP supports adding headers
* Chat history performance optimization, using virtual lists + display optimization


![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)
![image](https://github.com/user-attachments/assets/6b91d593-51ef-4e51-8d1b-324bc071e9a7)

# 1.5.4
* Fixed the issue of failed large model tests accessed via web.

# 1.5.3

* Supported Claude official API.
* Optimized the built-in terminal, allowing user input
* Supported agent task call failure, using backup large model.
* Added built-in Agent, `MCP helper`, to assist in installing MCP
* Fixed Markdown rendering bug
* Fixed bugs in chat multi-model comparisons

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supported chat renaming
* Supported mcp configuration sync
* Supported grok3's thinking chain
* Supported ai generated cron expressions
* Supported message branching clone
* Supported development mode, quickly export dialogue configuration for debugging
* Added enable/disable switch for Claude's mcp
* Added global Task run control enable/disable switch
* Tool call cancellation optimization, notifying large model users that the operation was canceled

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
* Fixed the issue of not being able to copy on MacOS, and other shortcut keys becoming ineffective

# 1.4.16

* Supported displaying MCP Server version number and name.
* Added detailed error display when the model reports errors.
* Added detailed error display when MCP reports errors.
* Optimized chat history storage, storing dialogue messages separately to reduce loading and sync time.
* Modified WebDAV sync.
* Supported MCP in Claude Desktop configuration.
* Supported direct viewing of configuration files on the web side
* Supported shortcut keys MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open developer tools
* Chat history list supports displaying Agent icons
* Fixed a lot of bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening from the browser, downloading, and added support for `Mermaid` pre-releases,
* Modified tool display
* Supported comparing multiple models in chat

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixed the issue in the previous version where the default dialogue setting mcp failed.
* Fixed the issue where the Agent could not modify system prompts if it had not chatted.
* Fixed the error message with no LLM upon first opening


# 1.4.1

* Fixed the bug in Gemini tool calls that did not support multiple tools
* Supported selecting some Tools of MCP to save Tokens
* Supported @ for quick input + calling Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line
* Supported changing network access password
* Tool call folding display
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Allowed confirming when calling tools, and modifying parameters for large model calls
* Allowed clicking tools to test tools.
* Planning to redevelop the knowledge base, currently not recommended for use, can use openai's embedding model, no longer developing local embedding models
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* Added MCP loading progress display, added shortcut button
* Optimized mobile h5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supported asking when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically obtain PATH on mac, linux, no need to input PATH anymore.
* Added linux deb package
* Fix WebDAV first sync error
* fixbug


# 1.0.2

* Added setting temperature
* Fixed bugs
* Supported pasting text and uploading images in the input box

# 0.2.0

* Added knowledge base


# 0.1.1

* Fixed image upload on MacOS
* Added quick copy button, supported copying messages and code
* Optimized WebDAV sync, only the last 10 versions are saved locally
* Markdown code rendering added highlighting
* HTML Artifacts added error capturing, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supported two installation methods: plugin market + MCP native installation, quick installation and configuration in the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDAV sync logic optimized, local backup first before sync, sync every 5 minutes
* LLM added testing function, testing for image input support + tool calls (consumes a little token)
* Chat supports inputting images
* Chat supports displaying images returned from Tool Call MCP resources
* fix bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDAV sync, currently does not support MCP configuration sync, inconsistent operating systems may cause issues.
* Supported setting request methods, Stream | Complete
* Supported KaTeX, displaying mathematical formulas

## HyperTools

* Optimized the tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, supports searching, drag-and-drop sorting
* Chat history supports filtering + searching
* For APIs that do not support tracking token consumption for large models, like Qianwen, it supports vague statistics based on word count
* Input box supports drag-and-drop files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quickly configuring Ollama and Qwen API models

## HyperTools

* Optimized the tool for opening web pages, more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`