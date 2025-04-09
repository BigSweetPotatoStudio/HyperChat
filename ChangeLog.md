[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.4

* Fixed the issue where the default conversation setting for mcp became ineffective in the last version.
* Fixed the problem where the system prompt could not be modified when the Agent was not chatting.
* Fixed the incorrect prompt for no LLM when opened for the first time.


# 1.4.1

* Fixed the bug where the Gemini tool call did not support multiple tools.
* Supported selecting certain Tools from MCP, saving more Tokens.
* Supported quick input with @ + calling Agent.
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line.
* Supported modifying network access password.
* Tool invocation collapsible display.
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* You can confirm whether to invoke a tool and modify the parameters for large model calls.
* You can click on the tool to invoke it for testing.
* The knowledge base is planned to be redeveloped, currently not recommended for use, you can use OpenAI's embedding model, no longer using local embedding models.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added quick buttons.
* Optimized mobile H5 display.
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Support asking when invoking tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* mac, linux automatically obtain PATH, no need to input PATH.
* Added linux deb package.
* fix WebDav first synchronization error.
* fixbug


# 1.0.2

* Added setting temperature.
* Fixed bug.
* Supported pasting in the input box, uploading pictures.

# 0.2.0

* Added knowledge base.


# 0.1.1

* fix MacOS picture upload.
* Added quick copy button, supports copying messages and code.
* Optimized WebDav synchronization feature, only keeping 10 versions locally.
* Added highlighting to markdown code rendering.
* HTML Artifacts increased error capture, supports opening Chrome's console.



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + MCP native installation. Quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* WebDav synchronization logic optimized, local backups before syncing, synchronized every 5 minutes.
* LLM added testing function, testing whether image input + tool invocation is supported (consumes a little token).
* Chat supports inputting images.
* Chat supports displaying Tool Call returned image MCP resources.
* fix bugs.




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization currently does not support MCP configuration synchronization, inconsistent operating systems may cause problems.
* Supports setting request method, Stream | Complete.
* Supports KaTeX, displays mathematical formulas.

## HyperTools

* Optimized the Tool for opening web pages.



# 0.0.11

## HyperChat

* Bot display optimized, supports search and drag-and-drop sorting.
* Conversation history supports filtering + searching.
* For APIs that do not support statistics on large model token consumption, such as Qianwen, supports fuzzy statistics by word count.
* Input box supports drag-and-drop files for quick input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration for Ollama, Qwen API models.

## HyperTools

* Optimized the Tool for opening web pages, more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`
