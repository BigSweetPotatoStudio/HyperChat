[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically obtain PATH on mac, linux, no need to input PATH anymore.
* Added linux deb package
* Fix WebDav first synchronization error
* Fix bug


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supports pasting in the input box, uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* Fix MacOS image upload
* Added a quick copy button, supporting copying messages and code
* WebDav sync function optimized, only keeping 10 local versions
* Markdown code rendering adds highlighting
* HTML artifacts enhance error capture, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimized, local will backup before synchronizing, synchronizing every 5 minutes
* LLM adds testing functionality, testing whether image input + tool calls are supported (consuming a little bit of tokens)
* Chat supports image input
* Chat supports displaying images returned by Tool Call from MCP resources
* Fix bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav sync does not currently support MCP configuration sync, there may be problems due to inconsistent operating systems.
* Supports setting request methods, Stream | Complete
* Supports KaTeX, displaying mathematical formulas

## HyperTools

* Optimized the tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag and drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support statistics on large models' token consumption, such as Qianwen, supports fuzzy statistics based on word count
* The input box supports dragging files to quickly input file paths
* My LLM Models list supports drag and drop sorting
* Supports quick configuration of Ollama, Qwen's API models

## HyperTools

* Optimized the tool for opening web pages, more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`
