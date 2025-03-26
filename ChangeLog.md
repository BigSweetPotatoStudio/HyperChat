[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.2.15

* mcp loading progress display, added shortcut buttons
* optimized mobile H5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* mac, linux automatically get PATH, no need to input PATH.
* add linux deb package
* fix WebDav first synchronization error
* fixbug


# 1.0.2

* add temperature setting
* fix bug
* support pasting in input box, upload images

# 0.2.0

* add knowledge base


# 0.1.1

* fix MacOS image upload
* add quick copy button, support copying messages and code
* WebDav sync function optimization, only save 10 versions locally
* markdown code rendering adds highlighting
* HTML Artifacts increases error capture, supports opening Chrome's console



# 0.1.0

## HyperChat

* supports plugin market + MCP native installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav sync logic optimized, will back up locally before syncing, sync every 5 minutes
* LLM adds testing feature, tests whether image input + tool call is supported (consumes a little token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call MCP resources
* fix bugs




# 0.0.13

## HyperChat

* optimized the startup speed of MCP Server.
* WebDav sync, temporarily does not support MCP configuration sync, operating system inconsistency may cause issues.
* supports setting request methods, Stream | Complete
* supports KaTeX, displays mathematical formulas

## HyperTools

* optimized the tool for opening webpages



# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag and sort
* conversation logs support filtering + searching
* for APIs that do not support counting tokens of large models, such as Q&A, support fuzzy counting by word count
* input box supports dragging files for quick input of file paths
* My LLM Models list supports drag and sort
* supports quick configuration of Ollama, Qwen API models

## HyperTools

* optimized the tool for opening webpages, more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`
