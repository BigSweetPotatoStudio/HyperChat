[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.6.5

* Fixed the tool calls for models such as qwen3, added a tool call compatibility mode, similar to cline, using regex to match <tool_use>,
* View the interface for fixing task results, displaying abnormal issues.
* fixbug

# 1.6.3
* A brand new input editor, optimized displays, added a variable system, supports built-in mcp variable settings, supports js code variables
* Large model list, support filtering, optimized display
* Fixed the issue of failed prompt input for mcp support
* Agent list supports hover display descriptions.
* Optimized webdav synchronization.
* see MCP supports adding headers
* Optimized chat history performance, using virtual lists + display optimizations

![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)
![image](https://github.com/user-attachments/assets/6b91d593-51ef-4e51-8d1b-324bc071e9a7)

# 1.5.4
* Fixed the issue of adding large model test failure for web access.

# 1.5.3

* Supports Claude official API.
* Optimized the built-in terminal, allowing user input
* Supports Agent task call failures, using backup large models.
* Added built-in Agent, `MCP helper`, to assist with MCP installation
* Fixed Markdown rendering bug
* Fixed bug with chat multi-model comparison

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supports chat renaming
* Supports mcp configuration synchronization
* Supports grok3's thought chain
* Supports ai-generated cron expressions
* Supports message fork cloning
* Supports development mode, quickly export conversation configurations for debugging
* Added switch to enable or disable Claude's mcp
* Added global control switch to enable or disable Task operations
* Optimized tool call cancellation, informing the large model user that the operation was canceled

![Supports chat renaming](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Supports mcp configuration synchronization](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Supports grok3's thought chain](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Supports ai-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Supports message fork cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Supports development mode, quickly export conversation configurations for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Supports global control to enable or disable Task operations](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Supports development mode, quickly export conversation configurations for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![Optimized tool call cancellation, informing the large model user that the operation was canceled](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)

# 1.4.17
* Fixed the issue of MacOS not being able to copy and other keyboard shortcuts failing

# 1.4.16

* Supports displaying the MCP Server version number and name.
* Added detailed error display when a model reports an error.
* Added detailed error display when MCP reports an error.
* Optimized chat history storage, separating conversation messages to reduce load and sync times.
* Modified WebDav synchronization.
* Supports MCP in Claude Desktop configuration.
* Supports direct file viewing on the web.
* Supports keyboard shortcuts MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open developer tools
* Chat history list supports displaying agent icons
* Fixed numerous bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)

# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening from the browser, downloading, increased support for `Mermaid`
* Modified tool call display
* Supports selecting multiple models for chat comparison

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)

# 1.4.4

* Fixed the issue of the default conversation setting for mcp being ineffective in the previous version.
* Fixed the problem of not being able to modify system prompts for agents that have not chatted.
* Fixed the error prompt when opened for the first time without LLM

# 1.4.1

* Fixed the bug where Gemini tool calls do not support multiple tools
* Supports selecting partial Tool of MCP to save more tokens
* Supports @ for quick input + calling Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Added built-in mcp tool command line
* Supports modifying network access passwords
* Tool call collapsible display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm whether to call the tool, and modify parameters for large model calls
* Can click on tools to call and test their functionality.
* The knowledge base is planned to be redeveloped, currently not recommended for use; the OpenAI embedding model can be used instead, not developing a local embedding model
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* MCP loading progress display, added quick buttons
* Optimized mobile h5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Supports asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Mac and Linux automatically get PATH, no need to input PATH anymore.
* Added linux deb package
* Fixed WebDav first synchronization error
* fixbug

# 1.0.2

* Added setting temperature
* Fixed bugs
* Supports paste in input box, upload images

# 0.2.0

* Added knowledge base

# 0.1.1

* Fixed MacOS image upload
* Added quick copy button, supports message and code copy buttons
* WebDav synchronization functionality optimization, keeping only 10 local versions
* Markdown code Code rendering increased highlighting
* HTML Artifacts added error capture, supports opening Chrome console

# 0.1.0

## HyperChat

* Supports both plugin market + native MCP installation; quick installation and configuration through the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimized, local backup before synchronization, syncing every 5 minutes
* LLM added testing functionality, testing support for image input + tool calls (consumes a bit of tokens)
* Chat supports image input
* Chat supports showing Tool Call returned image MCP resources
* fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, currently does not support MCP configuration synchronization, different operating systems may cause issues.
* Supports setting request methods, Stream | Complete
* Supports KaTeX, displays mathematical formulas

## HyperTools

* Optimized tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting
* Conversation records support filtering + searching
* For APIs that do not support token consumption statistics for large models, such as Qianwen, fuzzy statistics with word count are supported
* Input box supports drag-and-drop file for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama, Qwen API models

## HyperTools

* Optimized the tool for opening web pages, more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`