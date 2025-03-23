[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* mac, linux automatically get PATH, no need to input PATH anymore.
* Added linux deb package
* fix WebDav first sync error
* fix bug

# 1.0.2

* Increase setting temperature
* Fix bug
* Support pasting in input box, uploading images

# 0.2.0

* Add knowledge base

# 0.1.1

* fix MacOS image upload
* Add quick copy button, supporting copying messages and code
* WebDav sync function optimization, locally only saving 10 versions
* markdown code rendering increases highlighting
* HTML Artifacts add error capture, supports opening Chrome's console

# 0.1.0

## HyperChat

* Support plugin marketplace + MCP native installation, quick installation and configuration from the plugin marketplace, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav sync logic optimized, locally will back up first and then sync, synchronized every 5 minutes
* LLM adds testing function to test if it supports image input + tool invocation (consuming a little token)
* Chat supports inputting images
* Chat supports displaying Tool Call returned image MCP resources
* fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav sync, temporarily does not support MCP configuration sync, inconsistency of operating systems may cause issues.
* Support setting request method, Stream | Complete
* Support KaTeX, displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting
* Conversation records support filtering + searching
* For APIs that do not support tracking large model token consumption, such as Qianwen, support fuzzy statistics based on word count
* Input box supports dragging files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama, Qwen's API models

## HyperTools

* Optimized the Tool for opening web pages, with improved information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`