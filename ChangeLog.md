[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.6.3
* A brand new input editor, optimized display, added variable system, supports built-in MCP setting variables, supports JS code variables
* Large model list, supports filtering, optimized display
* Fixed the issue of failed prompt input when supporting MCP
* Agent list supports hover display descriptions.
* WebDAV sync optimization.
* See MCP supports adding headers
* Chat history performance optimization, uses virtual list + display optimization


![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)
![image](https://github.com/user-attachments/assets/6b91d593-51ef-4e51-8d1b-324bc071e9a7)

# 1.5.4
* Fixed the issue of failed large model testing added for web access.

# 1.5.3

* Support for Claude official API.
* Optimized built-in terminal, allowing user input
* Supported Agent task call failure, using backup large model.
* Added built-in Agent, `MCP helper`, to assist in MCP installation
* Fixed Markdown rendering bug
* Fixed bug of multi-model comparison in chat

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supports renaming chats
* Supports MCP configuration sync
* Supports thinking chain of grok3
* Supports AI-generated cron expressions
* Supports message fork cloning
* Supports development mode, quick export of chat configuration for debugging
* Added switch to enable or disable Claude's MCP
* Added global control switch for Task execution to enable or disable
* Tool call cancellation optimization, informing large model users of the canceled operation

![Support renaming chats](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Support MCP configuration sync](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Support thinking chain of grok3](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Support AI-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Support message fork cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Support development mode, quick export of chat configuration for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Support global control switch for Task execution](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Support development mode, quick export of chat configuration for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![Tool call cancellation optimization, informing large model users of the canceled operation](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)



# 1.4.17
* Fixed the issue of not being able to copy on MacOS and other shortcut key failures

# 1.4.16

* Supports displaying MCP Server version number and name.
* Added detailed error display when model reports an error.
* Added detailed error display when MCP reports an error.
* Optimized chat history storage, storing conversation messages separately to reduce loading and sync time.
* Modified WebDAV sync.
* Supports MCP in Claude Desktop configuration.
* Supports directly viewing configuration files on the web side
* Supports shortcut keys MACOS `Alt+Cmd+I`   Windows `Ctrl+Shift+I` to open developer tools
* Chat history list supports displaying Agent icons
* Fixed numerous bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening from the browser, downloading, increased support for `Mermaid` pre-release,
* Modified tool calling display
* Supports selecting multiple models for comparison in chat

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixed the issue in the previous version where the default conversation setting for MCP was invalid.
* Fixed the issue where Agent could not modify system prompts when not chatting.
* Fixed the error prompt when opened for the first time without LLM.


# 1.4.1

* Fixed bug of Gemini tool calls not supporting multiple tools
* Supports selecting part of the Tool for MCP, saving more Tokens
* Supports @ quick input + call Agent
* Fixed bugs
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in MCP tool command line
* Supports modifying network access passwords
* Tool call collapsed display
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when calling tools, and modify parameters for large model calls
* Can click on tools to conduct testing.
* Knowledge base is planned for redevelopment, currently not recommended for use, can use OpenAI's embedding model, no longer developing local embedding models
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added quick buttons
* Optimized mobile H5 display
* Fixed bugs
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking during tool calls![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization and settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically get PATH on mac, linux, no need to input PATH anymore.
* Added Linux deb package
* Fixed WebDAV first sync error
* Fixed bugs


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supports input box paste, image upload

# 0.2.0

* Added knowledge base


# 0.1.1

* Fixed MacOS image upload
* Added quick copy buttons, supports copying messages and code buttons
* Optimized WebDAV sync function, storing only 10 local versions
* Markdown code rendering increased highlighting
* HTML Artifacts added error capture, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration through the plugin market, submit plugins welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDAV sync logic optimized, local backup before sync, sync every 5 minutes
* LLM added testing functionality, to test whether it supports image input + tool calls (consuming a little token)
* Chat supports image input
* Chat supports displaying images returned from Tool Call as MCP resources
* Fixed bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDAV sync, currently does not support MCP configuration sync, operating system inconsistencies may cause problems.
* Supports setting request methods, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support statistics for large model token consumption, such as Qianwen, supports fuzzy statistics based on word count
* Input box supports drag-and-drop file quick input file path
* My LLM Models list supports drag-and-drop sorting
* Supports rapid configuration of Ollama, Qwen's API models

## HyperTools

* Optimized the Tool for opening web pages, more complete information extraction. For example, to answer this question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`