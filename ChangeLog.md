[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.4

* Fixed the issue where the default conversation setting mcp would be ineffective in the last version.
* Fixed the bug where the system prompt could not be modified when the Agent had not chatted.
* Fixed the error message for no LLM when first opened.


# 1.4.1

* Fixed the bug in Gemini tool invocation that did not support multiple tools.
* Supported selecting some Tool of MCP to save more Tokens.
* Supported quick input with @ + invoking Agent.
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line.
* Supported modifying network access password.
* Tool call collapsible display.
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* You can confirm whether to call a tool and modify the parameters for calling the large model.
* You can click on the tool to test it.
* The knowledge base is planned for redevelopment, currently not recommended for use; you can use OpenAI's embedding model and no longer use local embedding models.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* Display loading progress of mcp, added quick button.
* Optimized mobile h5 display.
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Support prompting when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports showing time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* mac, linux automatically get PATH, no need to enter PATH.
* Added linux deb package.
* Fix WebDav first sync error.
* fixbug.


# 1.0.2

* Added temperature setting.
* Fixed bugs.
* Supported paste in input box, upload images.

# 0.2.0

* Added knowledge base.


# 0.1.1

* Fix MacOS image upload.
* Added quick copy button, supports copying messages and code.
* Optimized WebDav sync function, only keeping 10 versions locally.
* Markdown code rendering increases highlighting.
* HTML Artifacts added error capture, supports opening the Chrome console.



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation; rapid installation and configuration from plugin market, contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* WebDav sync logic optimized, will first back up locally and then sync, sync every 5 minutes.
* Added test function for LLM, to check if it supports image input + tool invocation (consumes a little token).
* Chat supports inputting images.
* Chat supports displaying images returned from Tool Call as MCP resources.
* fix bugs.




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav sync, currently does not support MCP configuration sync, inconsistent operating systems may cause issues.
* Supports setting request method, Stream | Complete.
* Supports KaTeX, displaying mathematical formulas.

## HyperTools

* Optimized the Tool for opening webpages.



# 0.0.11

## HyperChat

* Bot display optimized, supports searching and drag-and-drop sorting.
* Conversation history supports filtering + searching.
* For APIs that do not support calculating token consumption of large models, such as Qianwen, support using word count for approximate statistics.
* Input box supports dragging files for quick input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration of Ollama and Qwen's API models.

## HyperTools

* Optimized the Tool for opening webpages, more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`
