[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.2.12

* Support asking when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically get PATH on mac and linux, no need to enter PATH anymore.
* Added linux deb package
* fix WebDav first sync error
* fixbug


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supported input box paste, upload images

# 0.2.0

* Added knowledge base


# 0.1.1

* fix MacOS image upload
* Added quick copy button, supports copying messages and code
* WebDav sync function optimization, only keeps 10 local versions
* markdown code rendering increases highlighting
* HTML Artifacts added error capture, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supports two methods for plugin installation: plugin marketplace + native MCP installation, quick installation and configuration from the plugin marketplace, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav sync logic, local backups before syncing, synced every 5 minutes
* LLM added testing function to check whether image input and tool calls are supported (consuming a little token)
* Chat supports image input
* Chat supports displaying images from Tool Call returned MCP resources
* fix bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav sync, temporarily does not support MCP configuration sync, may encounter issues due to inconsistent operating systems.
* Supports setting request method, Stream | Complete
* Supports KaTeX, displays mathematical formulas

## HyperTools

* Optimized Tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support token consumption statistics for large models, such as Qianwen, it supports fuzzy counting by word count
* Input box supports drag-and-drop file quick input file path
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama, Qwen API models

## HyperTools

* Optimized Tool for opening web pages, more complete information extraction. For example, answer this question: `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`
