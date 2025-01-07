[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 0.1.1

* Fix MacOS image upload
* Add a quick copy button to support copying messages and code
* Optimize WebDav synchronization, only saving 10 versions locally
* Added syntax highlighting for markdown code rendering
* HTML Artifacts added error capture, supporting opening Chrome's console

# 0.1.0

## HyperChat

* Supports two installation methods: Plugin Market and native MCP installation, with quick installation and configuration from the Plugin Market. Contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav synchronization logic, backing up locally before synchronizing, with synchronization every 5 minutes
* Added testing functionality to LLM to test if image input and tool calls are supported (consuming a little bit token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call as MCP resources
* Fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization does not currently support MCP configuration synchronization, as inconsistencies in operating systems may cause issues.
* Supports setting request methods, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, supports searching and drag-and-drop sorting
* Conversation history supports filtering and searching
* For APIs that do not support token consumption statistics for large models, such as Q&A, supports fuzzy statistics by word count
* Input box supports drag-and-drop file quick input for file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama and Qwen API models

## HyperTools

* Optimized the Tool for opening web pages, with more comprehensive information extraction. For example, answer this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`