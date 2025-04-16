[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Support chat renaming
* Support mcp configuration synchronization
* Support grok3's thought chain
* Support AI-generated cron expressions
* Support message forking and cloning
* Support development mode, quickly export dialogue configuration for debugging
* Added switch to enable or disable Claude's mcp
* Added global control switch to enable or disable Task execution
* Optimized tool call cancellation, informing the large model user that the operation was canceled

![Support chat renaming](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Support mcp configuration synchronization](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Support grok3's thought chain](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Support AI-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Support message forking and cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Support development mode, quickly export dialogue configuration for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Support global control to enable or disable Task execution](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Support development mode, quickly export dialogue configuration for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![Optimized tool call cancellation, informing the large model user that the operation was canceled](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)



# 1.4.17
* Fixed the issue of not being able to copy and some shortcut keys not working on MacOS

# 1.4.16

* Support displaying MCP Server version number and name.
* Added detailed error display for model errors.
* Added detailed error display for MCP errors.
* Optimized chat history storage, separating dialogue messages to reduce loading and synchronization time.
* Modified WebDav synchronization.
* Supported MCP in Claude Desktop configuration.
* Supported direct view of configuration files on the web.
* Supported shortcut keys MACOS `Alt+Cmd+I`   Windows `Ctrl+Shift+I` to open developer tools.
* Chat history list supports displaying Agent icons.
* Fixed a large number of bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supported opening and downloading from the browser, added support for `Mermaid` pre-release,
* Modified tool display
* Supported selecting multiple models for comparison in chat

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixed the issue in the previous version where the default dialogue settings for MCP became ineffective.
* Fixed the issue where the Agent could not modify the system prompt if it hadn't chatted.
* Fixed the error prompt with no LLM when opened for the first time.


# 1.4.1

* Fixed the bug of Gemini tool calls not supporting multiple tools.
* Supported selecting partial tools for MCP to save more tokens.
* Supported quick input for @ + call Agent.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line
* Supported modifying network access password
* Tool call folding display
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Added confirmation when calling tools and the ability to modify parameters of large model calls
* Users can click on tools to test calls.
* The knowledge base is planned for redevelopment. It is currently not recommended for use. You can use OpenAI's embedding model instead of creating a local embedding model.
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

* Support confirmation when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Added historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically obtain PATH on macOS and Linux, no need to input PATH.
* Added linux deb package
* Fixed WebDav first synchronization error
* Fixed bugs


# 1.0.2

* Added setting for temperature
* Fixed bugs
* Supported pasting in input box and uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* Fixed MacOS image upload
* Added quick copy buttons, supporting copying messages and code
* Optimized WebDav synchronization, only saving 10 local versions
* Added syntax highlighting for markdown code rendering
* Added error capture for HTML Artifacts, supporting opening Chrome's console



# 0.1.0

## HyperChat

* Supported two installation methods: plugin market + native MCP installation, with quick installation and configuration through the plugin market. Contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav synchronization logic, local backups before synchronization, synchronizing every 5 minutes
* Added test function for LLM to check if image input + tool call is supported (consumes a little token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call from MCP resources
* Fixed bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization, temporarily does not support MCP configuration synchronization. Inconsistent operating systems may cause issues.
* Supported setting request methods: Stream | Complete
* Supported KaTeX for displaying mathematical formulas

## HyperTools

* Optimized opening webpages with tool



# 0.0.11

## HyperChat

* Bot display optimization, supporting search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support counting token consumption of large models, such as Q&A, it supports vague counting by word count
* Input box supports dragging files for quick file path input
* My LLM Models list supports drag-and-drop sorting
* Supported quick configuration for Ollama and Qwen API models

## HyperTools

* Optimized tool for opening webpages, providing better information extraction. For instance, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`