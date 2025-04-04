[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.1

* Fixed the bug of Gemini tool calls that do not support multiple tools
* Supports selecting part of the Tool for MCP, saving more tokens
* Supports @ for quick input + calling Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in MCP tool command line
* Supports changing network access password
* Tool call collapsible display
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* You can confirm when calling the tool and modify the parameters of the large model call
* You can click the tool to call the tool for testing.
* The knowledge base is planned for redevelopment, and is currently not recommended for use. You can use OpenAI's embedding model instead of the local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added shortcut button
* Optimized mobile H5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking when calling the tool ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically get PATH for mac and linux, no need to enter PATH.
* Added linux deb package
* fix WebDav first sync error
* fixbug


# 1.0.2

* Added temperature setting
* Fixed bugs
* Supports paste in input box, upload images

# 0.2.0

* Added knowledge base


# 0.1.1

* fix MacOS image upload
* Added quick copy button, supports buttons for copying messages and code
* WebDav sync function optimization, only keeps 10 local versions
* Markdown code rendering increases highlighting
* HTML artifacts add error capture, supports opening the Chrome console



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav sync logic optimization, local will first back up before syncing, syncing every 5 minutes
* LLM adds testing function, tests whether image input + tool calls are supported (consumes a bit of token)
* Chat supports inputting images
* Chat supports displaying images returned by Tool Call as MCP resources
* fix bugs




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav sync currently does not support MCP configuration sync, operating systems may have inconsistent issues.
* Supports setting request method, Stream | Complete
* Supports KaTeX, displaying mathematical formulas

## HyperTools

* Optimized opening web page Tool



# 0.0.11

## HyperChat

* Bot display optimization, supports search and drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support calculating token usage of large models, such as Qianwen, supports fuzzy statistics by word count
* Input box supports drag-and-drop file for quick input of file path
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama and Qwen API models

## HyperTools

* Optimized opening webpage Tool, more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`
