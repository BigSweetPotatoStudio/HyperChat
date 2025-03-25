[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.2.12

* Support asking when calling the tool ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically get PATH for mac and linux, no need to input PATH anymore.
* Added linux deb package
* fix WebDav first synchronization error
* fix bug


# 1.0.2

* Increase temperature setting
* Fix bugs
* Support paste in input box, upload images

# 0.2.0

* Add knowledge base


# 0.1.1

* fix MacOS image upload
* Add a quick copy button, support buttons for copying messages and code
* WebDav synchronization function optimized, only save 10 local versions
* markdown code rendering added highlighting
* HTML Artifacts added error capturing, support opening Chrome's console



# 0.1.0

## HyperChat

* Support two installation methods: plugin market and native MCP installation, quick installation and configuration in the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimized, backup locally before synchronizing, synchronizing every 5 minutes
* LLM added testing function, testing for image input support + tool calls (consume a little token)
* Chat supports inputting images
* Chat supports displaying images returned from Tool Call as MCP resources
* fix bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, currently does not support MCP configuration synchronization, operating system inconsistencies may cause problems.
* Support setting request methods, Stream | Complete
* Support KaTeX, display mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, support search and drag sorting
* Conversation history supports filtering + searching
* For APIs that do not support calculating token consumption for large models, such as Qianwen, support vague counting by word count
* Input box supports dragging files for quick input of file paths
* My LLM Models list supports drag sorting
* Support quick configuration of Ollama, Qwen's API models

## HyperTools

* Optimized the Tool for opening web pages, more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`
