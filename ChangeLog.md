[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.3

* Fixed the issue of default chat settings being invalid for mcp in the previous version.
* Fixed the problem where the system prompt could not be modified if the Agent was not chatting.

# 1.4.1

* Fixed the bug where the Gemini tool call did not support multiple tools.
* Supported selecting parts of the MCP Tool to save more tokens.
* Supported quick input with @ and calling the Agent.
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Added built-in mcp tool command line.
* Supported modifying the network access password.
* Tool call display can be collapsed.
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* You can confirm and modify the parameters for calling the large model when using a tool.
* You can click on a tool to test it.
* The knowledge base is planned for redevelopment, and it's currently not recommended for use. You can use OpenAI's embedding model instead of the local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* Added MCP loading progress display and quick buttons.
* Optimized mobile h5 display.
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Supported asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Automatically obtain PATH for mac and linux, no need to input PATH anymore.
* Added linux deb package.
* Fixed WebDav first synchronization error.
* fixbug

# 1.0.2

* Increased setting temperature.
* Fixed bugs.
* Supported pasting in the input box and uploading images.

# 0.2.0

* Added knowledge base.

# 0.1.1

* Fixed MacOS image upload.
* Added quick copy button, supports copying messages and code.
* Optimized WebDav synchronization function, only saving 10 local versions.
* Increased highlighting for markdown code rendering.
* HTML Artifacts added error capture, supporting opening Chrome's console.

# 0.1.0

## HyperChat

* Supports plugin market + MCP native installation; quick installation and configuration via the plugin market. Contributions are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* WebDav synchronization logic optimized; backups will be created locally before synchronization, occurring every 5 minutes.
* Added testing function for LLM to check support for image input + tool calls (using a small amount of tokens).
* Chat supports image input.
* Chat supports displaying images returned from Tool Call MCP resources.
* fix bugs.

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, temporarily does not support MCP configuration synchronization. Inconsistent operating systems may have issues.
* Supports setting request method, Stream | Complete.
* Supports KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized opening web page tool.

# 0.0.11

## HyperChat

* Optimized Bot display, supports search and drag-and-drop sorting.
* Conversation history supports filtering + searching.
* For APIs that do not support counting token usage of large models, such as Q&A, supports approximate word count statistics.
* Input box supports drag-and-drop file quick input for file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration of Ollama and Qwen API models.

## HyperTools

* Optimized opening web page tool for better information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`