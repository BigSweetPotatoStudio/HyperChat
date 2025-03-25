[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.2.12

* Support asking when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* mac, linux automatically get PATH, no need to input PATH anymore.
* Add linux deb package
* Fix WebDav first synchronization error
* Fix bug

# 1.0.2

* Add temperature setting
* Fix bugs
* Support paste in input box, upload images

# 0.2.0

* Add knowledge base

# 0.1.1

* Fix MacOS image upload
* Add quick copy button, support copying messages and code
* WebDav synchronization feature optimized, keeping only 10 local versions
* Markdown code rendering adds highlighting
* HTML artifacts increase error capture, support opening Chrome console

# 0.1.0

## HyperChat

* Support plugin market + native MCP installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimized, local will back up first before syncing, synchronizing every 5 minutes
* LLM add testing feature to check if image input + tool call is supported (consuming a little bit of token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call as MCP resources
* Fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization, currently does not support MCP configuration synchronization, operating system inconsistencies may cause issues.
* Support setting request method, Stream | Complete
* Support KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag and drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support counting token consumption for large models, such as Q&A, supports fuzzy counting by word count
* Input box supports drag and drop files for quick input of file paths
* My LLM Models list supports drag and drop sorting
* Support quick configuration for Ollama, Qwen API models

## HyperTools

* Optimized the tool for opening web pages, more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`