[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.3.3

* You can confirm and modify the parameters for calling the large model when invoking the tool.
* You can click on the tool to call it for testing.
* The knowledge base is intended to be redeveloped, and it is currently not recommended for use. You can use OpenAI's embedding model instead, and local embedding models will not be developed anymore.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* MCP loading progress display, added shortcut buttons.
* Optimized mobile H5 display.
* Fix bugs.
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Mac, Linux automatically obtain PATH, no need to enter PATH anymore.
* Added Linux deb package.
* Fix WebDav first synchronization error.
* Fix bugs.

# 1.0.2

* Increased setting temperature.
* Fixed bugs.
* Supports pasting in input box, uploading images.

# 0.2.0

* Added knowledge base.

# 0.1.1

* Fix MacOS image upload.
* Added a quick copy button, supporting copying messages and code.
* WebDav synchronization function optimized, local only saves 10 versions.
* Markdown code rendering added highlighting.
* HTML Artifacts added error capture, supports opening Chrome's console.

# 0.1.0

## HyperChat

* Supports both plugin market + native MCP installation. The plugin market allows quick installation and configuration. Contributions are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* WebDav synchronization logic optimized, local will first back up and then synchronize, syncing every 5 minutes.
* LLM added testing function, testing whether image input + tool call is supported (consumes a little bit of token).
* Chat supports inputting images.
* Chat supports displaying images returned by Tool Call in MCP resources.
* Fix bugs.

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization temporarily does not support MCP configuration synchronization; inconsistencies in operating systems may cause issues.
* Supports setting request method, Stream | Complete.
* Supports KaTeX, displays mathematical formulas.

## HyperTools

* Optimized the Tool for opening web pages.

# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting.
* Conversation history supports filtering + searching.
* For APIs that do not support statistical consumption of large model tokens, such as Qianwen, support fuzzy statistics by word count.
* Input box supports drag and drop of files for quick input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration of Ollama, Qwen's API models.

## HyperTools

* Optimized the Tool for opening web pages, more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`