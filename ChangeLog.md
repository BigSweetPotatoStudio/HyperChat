[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.0

* Added built-in mcp tool command line
* Support for modifying network access password
* Tool call folding display
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when calling tools, and modify parameters for large model calls
* Can click tools to test them
* The knowledge base is planned for redevelopment, currently not recommended for use; you can use OpenAI's embedding model instead of the local embedding model
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* MCP loading progress display, added shortcut buttons
* Optimized mobile h5 display
* Fixed bugs
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Support for asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Automatically obtain PATH on mac and linux, no need to input PATH
* Added linux deb package
* Fixed WebDav first sync error
* Fixed bugs

# 1.0.2

* Added temperature setting
* Fixed bugs
* Supported pasting in input box and uploading images

# 0.2.0

* Added knowledge base

# 0.1.1

* Fixed MacOS image upload
* Added quick copy button, support for copying messages and code
* WebDav sync function optimized, only retains 10 local versions
* Added highlighting for markdown code rendering
* HTML Artifacts increased error capture, supports opening Chrome's console

# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration from the market, contributions to plugins welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav sync logic optimized, locally backing up before syncing, syncs every 5 minutes
* LLM added testing function, tests support for image input + tool calls (uses a little token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call in MCP resources
* Fixed bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server
* WebDav sync currently does not support MCP configuration sync; operating system inconsistencies may cause issues
* Support for setting request method, Stream | Complete
* Support for KaTeX, displaying mathematical formulas

## HyperTools

* Optimized opening web page tool

# 0.0.11

## HyperChat

* Bot display optimized, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support statistics on large model token consumption, like Qianwen, supports fuzzy statistics based on word count
* Input box supports drag-and-drop file for quick file path input
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama, Qwen's API model

## HyperTools

* Optimized web page opening tool, more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`