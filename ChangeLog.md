[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.0

* Added built-in mcp tool command line  
* Supports modifying network access password  
* Tool invocation collapsible display  

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)  
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)  

# 1.3.3

* Can confirm when invoking tools and modify large model invocation parameters  
* Can click tools to invoke them for testing.  
* The knowledge base is planned for redevelopment and is currently not recommended for use; OpenAI's embedding model can be used instead of a local embedding model.  
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

* Support asking when invoking tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)  
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)  
* hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)  
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52  

# 1.2.2

* mac, linux automatically get PATH, no need to enter PATH anymore.  
* Added linux deb package  
* fix WebDav first sync error  
* fixbug  

# 1.0.2

* Added setting for temperature  
* Fixed bugs  
* Supports paste in input box and image upload  

# 0.2.0

* Added knowledge base  

# 0.1.1

* fix MacOS image upload  
* Added quick copy button, supports copying messages and code  
* WebDav sync function optimized, only saves 10 versions locally  
* Added highlighting for markdown code rendering  
* HTML Artifacts added error capture, supports opening Chrome's console  

# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + MCP native installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)  
* WebDav sync logic optimized, local will back up before syncing, syncs every 5 minutes  
* LLM adds testing functionality to check support for image input + tool calling (consumes a little token)  
* Chat supports image input  
* Chat supports displaying images returned by Tool Call as MCP resources  
* fix bugs  

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.  
* WebDav sync, currently does not support MCP configuration sync, may encounter issues due to inconsistent operating systems.  
* Supports setting request method, Stream | Complete  
* Supports KaTeX, displays mathematical formulas  

## HyperTools

* Optimized the tool for opening web pages  

# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting  
* Conversation history supports filtering + searching  
* For APIs that do not support counting token consumption for large models, such as Qianwen, supports approximate counting by word count  
* Input box supports dragging files for quick input of file paths  
* My LLM Models list supports drag-and-drop sorting  
* Supports quick configuration for Ollama, Qwen API models  

## HyperTools

* Optimized the tool for opening web pages, with improved information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`  