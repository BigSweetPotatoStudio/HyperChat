[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.3

* Fixed the issue of default conversations and invalid mcp settings in the previous version.
* Fixed the inability to modify the system prompt when the Agent has not chatted.


# 1.4.1

* Fixed the bug of Gemini tool calling that does not support multiple tools
* Supports selecting some Tools for MCP, saving more Tokens
* Supports @ quick input + calling Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line
* Supports modifying the network access password
* Tool call collapsible display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* You can confirm whether to call the tool and modify the parameters for large model calls
* You can click the tool to call it for testing.
* The knowledge base is planned for redevelopment, currently not recommended for use, you can use OpenAI's embedding model, no longer using the local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* mcp loading progress display, added shortcut buttons
* Optimized mobile H5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Mac, Linux automatically get PATH, no need to enter PATH anymore.
* Added Linux deb package
* fix WebDav first synchronization error
* fixbug


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supports pasting in the input box and uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* fix MacOS image upload
* Added a quick copy button, supports buttons for copying messages and code
* WebDav synchronization function optimization, locally only keep 10 versions
* Markdown code rendering adds highlighting
* HTML Artifacts adds error catching, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native installation of MCP, quick installation and configuration from the plugin market, contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimization, local backup before synchronization, sync every 5 minutes
* LLM adds testing function, tests whether to support image input + tool calls (consuming a little token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call as MCP resources
* fix bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, temporarily does not support MCP configuration synchronization, operating systems may have issues.
* Supports setting request method, Stream | Complete
* Supports KaTeX, displays mathematical formulas

## HyperTools

* Optimized the tool for opening web pages



# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support statistical consumption of tokens for large models, such as Qianwen, supports fuzzy statistics by word count
* The input box supports dragging files to quickly input file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama and Qwen API models

## HyperTools

* Optimized the tool for opening web pages, with more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`
