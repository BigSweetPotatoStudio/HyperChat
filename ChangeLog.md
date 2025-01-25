[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 0.2.0

* Added knowledge base

# 0.1.1

* Fixed MacOS image upload
* Added a quick copy button to support copying messages and code
* Optimized WebDav synchronization, local storage retains only 10 versions
* Added syntax highlighting for markdown code rendering
* HTML Artifacts improved error catching, supports opening Chrome's console

# 0.1.0

## HyperChat

* Supports two methods: plugin marketplace + native MCP installation, quick installation and configuration from the plugin marketplace, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav synchronization logic, backing up locally before synchronizing, syncs every 5 minutes
* Added testing functionality for LLM, testing support for image input + tool invocation (consumes a bit of token)
* Chat supports image input
* Chat supports displaying images returned from Tool Call as MCP resources
* Fixed bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, currently does not support MCP configuration synchronization; issues may arise due to inconsistent operating systems.
* Supports setting request methods, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Optimized bot display, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support token consumption statistics of large models, such as Qianwen, supports fuzzy counting based on word count
* Input box supports drag-and-drop for quickly inputting file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama, Qwen API models

## HyperTools

* Optimized the Tool for opening web pages, providing more complete information extraction. For example, answer this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`