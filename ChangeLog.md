[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 0.2.0

* Added knowledge base

# 0.1.1

* Fixed MacOS image upload
* Added quick copy button, supporting copying messages and code
* Optimized WebDav synchronization, only keeping 10 versions locally
* Added syntax highlighting for markdown code rendering
* Added error capture for HTML artifacts, supporting opening the Chrome console

# 0.1.0

## HyperChat

* Supports two installation methods: plugin marketplace + MCP native installation, quick installation and configuration from the plugin marketplace, contributions are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav synchronization logic, backing up locally before syncing, synchronizing every 5 minutes
* Added testing feature for LLM, testing support for image input + tool calls (consumes a little bit of token)
* Chat supports inputting images
* Chat supports displaying images returned from Tool Call as MCP resources
* Fixed bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, currently does not support syncing MCP configurations; issues may arise due to inconsistent operating systems.
* Supports setting request methods, Stream | Complete
* Supports KaTeX to display mathematical formulas

## HyperTools

* Optimized the web-opening tool

# 0.0.11

## HyperChat

* Optimized bot display, supports search and drag-and-drop sorting
* Conversation history supports filtering + search
* For APIs that do not support statistical consumption tokens for large models, such as Qianwen, support fuzzy counting by word count
* Input box supports drag-and-drop files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama and Qwen's API models

## HyperTools

* Optimized the web-opening tool, more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`