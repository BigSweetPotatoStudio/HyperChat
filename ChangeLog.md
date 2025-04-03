[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.1

* Fixed the bug where the Gemini tool call does not support multiple tools
* Supports selecting some Tools from MCP, saving more Tokens
* Supports quick input with @ + invoking Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in MCP tool command line
* Supports changing network access password
* Tool call collapse display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* When calling tools, it can ask for confirmation and modify the parameters for large model invocation
* You can click on tools to invoke them for testing.
* The knowledge base is planned to be redeveloped, currently not recommended for use. You can use OpenAI's embedding model instead, no longer using local embedding models
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added shortcut buttons
* Optimized mobile H5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking during tool invocation ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports showing time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52


# 1.2.2

* mac, linux automatically get PATH, no need to enter PATH anymore.
* Added linux deb package
* fix WebDav first sync error
* fixbug


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supports input box paste, image upload

# 0.2.0

* Added knowledge base


# 0.1.1

* fix MacOS image upload
* Added quick copy buttons, supports copying messages and code
* WebDav sync function optimization, only saves 10 local versions
* Markdown code rendering adds highlighting
* HTML Artifacts added error capture, supports opening Chrome console


# 0.1.0

## HyperChat

* Supports two methods of installation: plugin market + native MCP installation, quick installation and configuration in the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav sync logic optimization, local will backup before syncing, syncing every 5 minutes
* LLM adds testing function, tests whether support for image input + tool calls (consumes a little token)
* Chat supports input of images
* Chat supports displaying Tool Call returned image MCP resources
* fix bugs


# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization, currently does not support MCP configuration synchronization, may have issues due to inconsistent operating systems.
* Supports setting request method, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the tool for opening web pages


# 0.0.11

## HyperChat

* Bot display optimized, supports search, drag and drop sorting
* Chat history supports filtering + searching
* For APIs that do not support counting token consumption of large models, such as Qianwen, it supports fuzzy counting based on word count
* Input box supports drag and drop files for quick input file paths
* My LLM Models list supports drag and drop sorting
* Supports quick configuration for Ollama, Qwen API models

## HyperTools

* Optimized the tool for opening web pages, more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`
