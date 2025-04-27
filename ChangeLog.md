[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.6.3
* A brand new input editor, optimized display, added variable system, supports built-in mcp setting variables, supports js code variables
* Large model list, supports filtering, optimized display
* Fixed the issue of failed input of prompt words supporting mcp
* Agent list supports hover display of descriptions.
* WebDAV sync optimization.
* See MCP supports adding headers
* Chat history performance optimization, using virtual lists


![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)

# 1.5.4
* Fixed the issue of tests failing when accessing large models via web.

# 1.5.3

* Supports Claude official API.
* Optimized built-in terminal, allowing user input
* Supports fallback to a large model when Agent task calls fail.
* Added built-in Agent, `MCP helper`, to assist with MCP installation
* Fixed Markdown rendering bug
* Fixed bug for comparing multiple models in chat

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supports renaming chats
* Supports mcp configuration synchronization
* Supports grok3's thinking chain
* Supports AI-generated cron expressions
* Supports message fork cloning
* Supports development mode, quick export of conversation configuration for debugging
* Added a switch to enable or disable Claude's mcp
* Added global control for Task execution enable/disable switch
* Tool calling cancellation optimization, informing large model users that the operation has been cancelled

![Supports renaming chats](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Supports mcp configuration synchronization](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Supports grok3's thinking chain](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Supports AI-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Supports message fork cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Supports development mode, quick export of conversation configuration for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Supports global control for Task execution enable/disable](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Supports development mode, quick export of conversation configuration for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![Tool calling cancellation optimization, informing users that the operation has been cancelled](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)



# 1.4.17
* Fixed the issue of copying not working on MacOS and other shortcut keys becoming unresponsive

# 1.4.16

* Supports displaying the MCP Server version number and name.
* Added detailed error display when model errors occur.
* Added detailed error display when MCP errors occur.
* Optimized chat history storage, separating conversation messages to reduce loading and sync time.
* Modified WebDAV sync.
* Supports MCP in Claude Desktop configuration.
* Supports viewing configuration files directly from the web interface.
* Supports keyboard shortcuts on MACOS`Alt+Cmd+I`  Windows`Ctrl+Shift+I` to open developer tools
* Chat history list supports displaying Agent icons
* Fixed many bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening and downloading from the browser, increased support for `Mermaid` pre-release
* Modified tool calling display
* Supports selecting multiple models for comparison in chat

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixed the issue in the last version where default conversations set to mcp became ineffective.
* Fixed the issue where Agents could not modify system prompts if they had not chatted.
* Fixed the error prompt that appeared when first opened with no LLM


# 1.4.1

* Fixed the bug in Gemini tool calls, which did not support multiple tools
* Supports selecting part of the Tool from MCP to save Tokens
* Supports quick input with @ + calling Agent
* Fix bug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line
* Supports modifying network access password
* Tool calling collapsible display
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Option to confirm when calling tools and modify parameters for large model calls
* Can click tools to test them.
* The knowledge base is planned to be redeveloped, currently not recommended for use; you can use OpenAI's embedding model instead of developing a local embedding model
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added quick button
* Optimized mobile H5 display
* Fix bug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically fetches PATH on macOS and Linux, no need to input PATH.
* Added linux deb package
* Fix WebDAV first sync error
* Fix bug


# 1.0.2

* Increased setting temperature
* Fixed bugs
* Supports pasting in the input box and uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* Fixed image upload on MacOS
* Added a quick copy button that supports copying messages and code
* Optimized WebDAV sync function to only keep 10 local versions
* Markdown code rendering increases highlighting
* HTML Artifacts added error capture, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supports both plugin market + native MCP installation, allowing quick installation and configuration from the plugin market; welcome submission of plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDAV sync logic optimized, local will first backup then sync, sync every 5 minutes
* LLM added test function to test for image input support + tool calling (using a little token)
* Chat supports image input
* Chat supports displaying images returned from Tool Call in MCP resources
* Fix bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDAV sync does not currently support MCP configuration sync due to inconsistent operating systems which may cause issues.
* Supports setting the request method, Stream | Complete
* Supports KaTeX to display mathematical formulas

## HyperTools

* Optimized the tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support statistical token consumption for large models, such as Qwen, supports fuzzy counting based on word count
* Input box supports dragging files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports rapid configuration of Ollama, Qwen API models

## HyperTools

* Optimized the tool for opening web pages, with more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`
