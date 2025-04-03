[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.1

* Fixed the bug where the Gemini tool call did not support multiple tools
* Supported selecting certain Tools from MCP, saving more Tokens
* Supported quick input with @ + calling Agent
* fixed bugs


# 1.4.0

* Added built-in mcp tool command line
* Supported modifying network access passwords
* Folded display for tool calls
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when calling tools, and modify parameters for large model calls
* Can click tools to test tool calls
* The knowledge base is planned for redevelopment, currently not recommended for use; you can use OpenAI's embedding model instead of maintaining a local embedding model
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* Display loading progress for mcp, added quick buttons
* Optimized mobile h5 display
* fixed bugs
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supported asking when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* mac, linux automatically acquire PATH, no need to input PATH anymore.
* Added linux deb package
* fixed WebDav first sync error
* fixed bugs


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supported pasting in the input box, uploading images

# 0.2.0

* Added knowledge base


# 0.1.1

* fixed MacOS image upload
* Added quick copy button, supports copying messages and code
* Optimized WebDav sync function, only keeps 10 local versions
* Added syntax highlighting for markdown code rendering
* Enhanced HTML Artifacts error capture, supports opening Chrome's console



# 0.1.0

## HyperChat

* Supports plugin marketplace + native MCP installation modes, quick installation and configuration from the plugin marketplace, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDav sync logic, local backup before sync, syncs every 5 minutes
* LLM added test function to check if image input + tool calls are supported (consuming a bit of tokens)
* Chat supports image input
* Chat supports displaying images returned from Tool Call MCP resources
* fixed bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav sync, temporarily does not support MCP configuration sync, as incongruent operating systems may cause issues.
* Supports setting request method, Stream | Complete
* Supports KaTeX, displays mathematical formulas

## HyperTools

* Optimized the Tool for opening web pages



# 0.0.11

## HyperChat

* Optimized bot display, supports search, drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support tracking large model token consumption, such as Q&A, supports fuzzy statistics based on word count
* Input box supports drag-and-drop file for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama, Qwen's API models

## HyperTools

* Optimized the Tool for opening webpages, more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`
