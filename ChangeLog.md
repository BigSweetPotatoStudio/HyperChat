[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Rewrite markdown rendering, optimize `Artifacts`, support opening from the browser, downloading, and add support for pre-releasing `Mermaid`,
* Modify the display of called tools

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)

# 1.4.4

* Fix the issue in the last version where the default conversation and mcp settings became ineffective.
* Fix the problem where the Agent cannot modify system prompts when not chatting.
* Fix the error prompt of no LLM when opened for the first time

# 1.4.1

* Fix the bug where Gemini tool calls do not support multiple tools
* Support selecting partial Tool for MCP to save Tokens
* Support @ for quick input + call Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Add built-in mcp tool command line
* Support changing network access password
* Collapse display of tool calls
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Additional confirmation option for calling tools, and modify parameters for large model calls
* Clickable tools for testing calls.
* Knowledge base is planned for redevelopment; currently not recommended for use, can use OpenAI's embedding model, no longer use local embedding models
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* mcp loading progress display, add quick buttons
* Optimize mobile h5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Support asking when calling a tool ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* mac, linux automatically fetch PATH, no need to input PATH anymore.
* Add linux deb package
* fix WebDav first-time synchronization error
* fixbug

# 1.0.2

* Increase setting temperature
* Fix bugs
* Support pasting in the input box, uploading pictures

# 0.2.0

* Add knowledge base

# 0.1.1

* fix MacOS image upload
* Add quick copy button, support copying messages and code
* WebDav synchronization function optimization, locally only keep 10 versions
* markdown code rendering increased highlighting
* HTML Artifacts add error capture, support opening Chrome's console

# 0.1.0

## HyperChat

* Support two methods for plugin market + native MCP installation, quick installation and configuration through the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimization, local will back up before sync, sync every 5 minutes
* LLM added testing function to check if it supports image input + tool calls (consuming a little token)
* Chat supports image input
* Chat supports displaying images returned by Tool Call MCP resources
* fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization temporarily does not support MCP configuration synchronization; operating system inconsistencies may cause issues.
* Support setting request method, Stream | Complete
* Support KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, support search, drag and drop sorting
* Conversation records support filtering + searching
* For APIs that do not support counting token consumption of large models, such as Q&A, support fuzzy statistics by word count
* Input box supports drag and drop files for quick input of file paths
* My LLM Models list supports drag and drop sorting
* Support quick configuration for Ollama, Qwen's API models

## HyperTools

* Optimized the Tool for opening web pages, better information extraction. For example, answer this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`