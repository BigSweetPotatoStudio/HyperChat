[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.3.3

* It can ask for confirmation when calling tools and modify the parameters for calling the large model.
* You can click on the tools to call them for testing.
* The knowledge base is planned for redevelopment, and it's currently not recommended to use; you can use OpenAI's embedding model instead, no need for a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added shortcut button.
* Optimized mobile H5 display.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Mac and Linux automatically obtain PATH, no need to input PATH anymore.
* Added Linux deb package.
* Fixed WebDav first sync error.
* Fixed bugs.


# 1.0.2

* Added setting for temperature.
* Fixed bugs.
* Supports pasting in the input box and uploading images.

# 0.2.0

* Added knowledge base.


# 0.1.1

* Fixed MacOS image upload.
* Added a quick copy button, supporting copying messages and code.
* Optimized WebDav sync function, only saves 10 local versions.
* Added highlighting for markdown code rendering.
* HTML artifacts added error capture, supports opening Chrome's console.



# 0.1.0

## HyperChat

* Supports two methods for plugin installation: plugin market and MCP native installation. Quick installation and configuration through the plugin market, contributions are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav sync logic, local backup before syncing, syncs every 5 minutes.
* Added testing functionality for LLM to check if it supports image input + tool calls (consumes a bit of token).
* Chat supports image input.
* Chat supports displaying images returned by Tool Call from MCP resources.
* Fixed bugs.




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav sync currently does not support MCP configuration sync; issues may arise from inconsistent operating systems.
* Supports setting request modes, Stream | Complete.
* Supports KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized the tool for opening webpages.



# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting.
* Chat history supports filtering + searching.
* For APIs that do not support statistics on the large model's token consumption, such as Qianwen, it supports fuzzy statistics based on word count.
* The input box supports quick file path input via drag-and-drop.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration for Ollama and Qwen's API models.

## HyperTools

* Optimized the tool for opening webpages, with more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`