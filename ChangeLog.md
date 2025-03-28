[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.3.3

* You can confirm and modify the parameters for calling the large model when invoking tools
* You can click the tool to test its functionality.
* The knowledge base is planned to be redeveloped and is not recommended for use at the moment. You can use OpenAI's embedding model instead of creating a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added shortcut buttons
* Optimized mobile H5 display
* Fixed bugs
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Support for asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization and settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Mac and Linux automatically obtain PATH, no need to input PATH anymore.
* Added Linux deb package
* Fixed WebDav first synchronization error
* Fixed bugs


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supported pasting in input box and uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* Fixed MacOS image upload
* Added quick copy button to support copying messages and code
* Optimized WebDav synchronization function, only keeps 10 local versions
* Markdown code rendering added syntax highlighting
* HTML Artifacts added error capture and support for opening Chrome's console



# 0.1.0

## HyperChat

* Supports both plugin market and MCP native installation, quick installation and configuration from the plugin market. Contributions for plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav synchronization logic, first backs up locally before syncing, synchronizes every 5 minutes
* Added testing functionality for LLM, to test whether it supports image input + tool invocation (consuming a little bit of token)
* Chat supports image input
* Chat supports displaying images returned from Tool Call as MCP resources
* Fixed bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization currently does not support MCP configuration synchronization; operating system discrepancies may cause issues.
* Supports setting request method, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting
* Chat history supports filtering + searching
* For APIs that do not support tracking large model token usage, such as Qianwen, supports approximate statistics based on word count
* Input box supports drag-and-drop files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama and Qwen's API models

## HyperTools

* Optimized the Tool for opening web pages, for more comprehensive information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`