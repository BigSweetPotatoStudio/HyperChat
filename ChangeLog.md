[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Supports renaming of chats
* Supports synchronization of mcp configuration
* Supports the thinking chain of grok3
* Supports AI-generated cron expressions
* Supports message fork cloning
* Supports developer mode for quick export of conversation configurations for debugging
* Added a switch to enable or disable Claude's mcp
* Added a global control switch to enable or disable Task running

![Supports renaming of chats](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Supports synchronization of mcp configuration](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Supports the thinking chain of grok3](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Supports AI-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Supports message fork cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Supports developer mode for quick export of conversation configurations for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Supports Task running global control enable/disable](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Supports developer mode for quick export of conversation configurations for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)


# 1.4.17
* Fixed the issue where MacOS couldn't copy and keyboard shortcuts were ineffective

# 1.4.16

* Supports displaying MCP Server version number and name.
* Added detailed error display for model errors.
* Added detailed error display for MCP errors.
* Optimized chat history storage by separating conversation messages, reducing loading and synchronization time.
* Modified WebDav synchronization.
* Supports MCP in Claude Desktop configuration.
* Supports direct viewing of configuration files on the web.
* Supports keyboard shortcuts: MACOS `Alt+Cmd+I`   Windows `Ctrl+Shift+I` to open developer tools
* Chat history list supports displaying Agent icons
* Fixed a large number of bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening in the browser, downloading, added support for `Mermaid` pre-release,
* Modified display for invoking tools
* Supports multi-model comparison in chat selection

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)


# 1.4.4

* Fixed the issue in the previous version where the default chat and mcp settings became ineffective.
* Fixed the issue where the Agent could not modify the system prompt when not chatting.
* Fixed the error message showing no LLM when opened for the first time


# 1.4.1

* Fixed the bug where the Gemini tool call did not support multiple tools
* Supports selecting certain tools of MCP to save more tokens
* Supports `@` quick input + invoking Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line
* Supports changing network access password
* Tool call collapsible display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when invoking tools, and modify parameters for large model calls
* Can click tools to invoke them for testing.
* The knowledge base is intended for redevelopment, currently not recommended for use, users can use OpenAI's embedding model instead of a local embedding model
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added shortcut buttons
* Optimized mobile H5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking when invoking tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Added historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52


# 1.2.2

* mac, linux automatically fetch PATH, no need to input PATH anymore.
* Added linux deb package
* Fixed WebDav first synchronization error
* fixbug


# 1.0.2

* Added setting temperature
* Fixed bugs
* Supports pasting in input box, uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* Fixed MacOS image upload
* Added a quick copy button, supporting message and code copying
* Optimized WebDav synchronization feature, only keeping 10 local versions
* Added highlighting for markdown code rendering
* Enhanced error capture for HTML Artifacts, supports opening Chrome's console


# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + MCP native installation, quick installation and configuration in the plugin market; contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav synchronization logic, local backups first, synchronizing every 5 minutes
* LLM added testing function, testing whether it supports image input + tool invocation (consumes a bit of token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call MCP resources
* fix bugs


# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization does not currently support MCP configuration synchronization; inconsistencies in operating systems may cause issues.
* Supports setting request methods, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages


# 0.0.11

## HyperChat

* Optimized Bot display, supports searching, drag-and-drop sorting
* Conversation records support filtering + searching
* For APIs that do not support counting token consumption for large models, such as Qianwen, support using word count for fuzzy statistics
* Input box supports dragging and dropping files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama and Qwen API models

## HyperTools

* Optimized the Tool for opening web pages, with more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`
