[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.0

* Added built-in mcp tool command line
* Support for modifying network access password
* Tool invocation collapsible display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Option to confirm before invoking a tool and modify parameters for large model invocation
* Click on the tool to invoke it for testing.
* The knowledge base is planned for redevelopment, currently not recommended for use; you can use OpenAI's embedding model instead of local embedding model
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* MCP loading progress display, add shortcut buttons
* Optimize mobile H5 display
* Fix bugs
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Support asking when invoking tools
![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time
![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings
![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Automatically acquire PATH for mac and linux, no need to input PATH anymore.
* Added linux deb package
* Fix WebDav first sync error
* Fix bugs

# 1.0.2

* Add temperature setting
* Fix bugs
* Support for pasting in input box, uploading images

# 0.2.0

* Added knowledge base

# 0.1.1

* Fix MacOS image upload
* Add quick copy button, support for copying messages and code
* WebDav sync functionality optimization, only saving 10 versions locally
* Markdown code rendering increases highlighting
* HTML Artifacts add error capture, support for opening Chrome's console

# 0.1.0

## HyperChat

* Support for both plugin market + native MCP installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav sync logic optimized, first backing up locally before syncing, syncing every 5 minutes
* LLM adds testing function, tests if image input + tool invocation are supported (consumes a bit of token)
* Chat supports image input
* Chat supports displaying images returned from Tool Call MCP resources
* Fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav sync, temporarily does not support MCP configuration sync, may encounter issues due to inconsistent operating systems.
* Support for setting request method, Stream | Complete
* Support for KaTeX, displaying mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages

# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support counting large model token consumption, such as Qianwen, fuzzy counting by word count is supported
* Input box supports dragging files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama and Qwen API models

## HyperTools

* Optimized the Tool for opening web pages, more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/ 哪个游戏是限时免费的？`