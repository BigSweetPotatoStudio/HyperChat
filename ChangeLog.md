[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.4

* Fixed the issue where the default dialogue setting for mcp was invalid in the last version.
* Fixed the issue where the system prompt could not be modified when the Agent was not chatting.
* Fixed the bug where LLM was absent upon first opening.


# 1.4.1

* Fixed the bug with Gemini tool calls that did not support multiple tools.
* Supported selecting certain Tools for MCP, saving more Tokens.
* Supported @ for quick input + calling Agent.
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line.
* Supported modifying the network access password.
* Tool call collapsible display.
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Allowed confirming when calling tools and modifying parameters for large model calls.
* Allowed clicking on tools to call them for testing.
* The knowledge base is planned for redevelopment; currently not recommended for use. You can use OpenAI's embedding model instead of a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* Display progress for mcp loading and added shortcut buttons.
* Optimized mobile h5 display.
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supported asking when calling tools. ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supported time display. ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Optimized hypetool settings. ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Added historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Mac, Linux automatically obtain PATH, no need to input PATH anymore.
* Added Linux deb package.
* Fixed WebDav first sync error.
* fixbug


# 1.0.2

* Added temperature setting.
* Fixed bugs.
* Supported pasting in the input box and uploading images.

# 0.2.0

* Added knowledge base.


# 0.1.1

* Fixed MacOS image upload.
* Added quick copy buttons, supported copying messages and code.
* Optimized WebDav synchronization function, only keeping 10 local versions.
* Increased highlight for markdown code rendering.
* HTML Artifacts increased error capture, supported opening Chrome's console.



# 0.1.0

## HyperChat

* Supported two installation methods: plugin market + native MCP installation, allowing quick installation and configuration of plugins. Contributions are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Optimized WebDav synchronization logic; local backup before syncing, synchronizing every 5 minutes.
* Added test function for LLM to check if image input + tool calls are supported (consuming a little token).
* Chat supports image input.
* Chat supports displaying MCP resources returned by Tool Call images.
* Fixed bugs.




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization currently does not support MCP configuration synchronization; inconsistencies in operating systems may cause issues.
* Supported setting request method, Stream | Complete.
* Supported KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized the Tool for opening web pages.



# 0.0.11

## HyperChat

* Optimized Bot display, supporting search and drag-and-drop sorting.
* Conversation records support filtering + searching.
* For APIs that do not support counting token consumption for large models, like Qianwen, supported approximate counting by word count.
* Input box supports drag-and-drop files for quick file path input.
* My LLM Models list supports drag-and-drop sorting.
* Supported quick configuration for Ollama and Qwen's API models.

## HyperTools

* Optimized the Tool for opening web pages, providing more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`