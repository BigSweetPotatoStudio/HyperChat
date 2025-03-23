[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports showing the time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Automatically get PATH on mac and linux, no need to input PATH anymore.
* Add linux deb package
* fix WebDav synchronization error on first sync
* fix bug

# 1.0.2

* Add temperature setting
* Fix bug
* Support pasting in the input box, upload images

# 0.2.0

* Add knowledge base

# 0.1.1

* fix MacOS image upload
* Add quick copy button, support buttons for copying messages and code
* WebDav synchronization function optimization, locally save only 10 versions
* markdown code rendering enhances highlighting
* HTML Artifacts add error catching, supports opening Chrome's console

# 0.1.0

## HyperChat

* Supports both plugin market + native MCP installation, fast installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimization, local backup before synchronization, sync every 5 minutes
* LLM adds testing function to check if image input + tool calling is supported (uses a little bit of token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call as MCP resources
* fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization temporarily does not support MCP configuration synchronization, inconsistent operating systems may cause issues.
* Support setting request methods, Stream | Complete
* Support KaTeX, display mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, support search, drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support statistical large models' token consumption, like Qianwen, support approximate statistics based on word count
* Input box supports drag-and-drop files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama, Qwen's API models

## HyperTools

* Optimized the Tool for opening web pages, more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`