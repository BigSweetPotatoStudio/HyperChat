[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration through the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimized, local will back up before syncing, syncs every 5 minutes
* LLM adds testing functionality to check for support of image input + tool calls (consumes a little token)
* Chat supports image input
* Chat supports displaying images returned from Tool Call as MCP resources
* fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, temporarily does not support MCP configuration synchronization, operating system inconsistencies may cause issues.
* Supports setting request methods, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Optimized bot display, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support token consumption statistics for large models, such as Qianwen, supports fuzzy count based on word numbers
* Input box supports drag-and-drop file for quick file path entry
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama and Qwen API models

## HyperTools

* Optimized the Tool for opening web pages, with more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`