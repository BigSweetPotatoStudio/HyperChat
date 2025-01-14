[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 0.2.0

* Added knowledge base

# 0.1.1

* Fix MacOS image upload
* Added a quick copy button to support copying messages and code
* Optimized WebDav sync function, only keeping 10 versions locally
* Added syntax highlighting for markdown code rendering
* HTML Artifacts increased error capture, supports opening Chrome's console

# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration from the plugin market, contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav sync logic, backing up locally before syncing, syncing every 5 minutes
* Added test function for LLM to test image input support + tool calling (consumes a little bit of tokens)
* Chat supports inputting images
* Chat supports displaying images returned from Tool Call as MCP resources
* Fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav sync, currently does not support synchronizing MCP configurations, inconsistent operating systems may cause problems.
* Supports setting request method, Stream | Complete
* Supports KaTeX, displays mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support token consumption statistics for large models, like Qianwen, supports fuzzy counting using word count
* Input box supports drag-and-drop for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama and Qwen API models

## HyperTools

* Optimized the Tool for opening web pages, with more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`