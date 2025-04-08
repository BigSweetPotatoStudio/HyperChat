[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.4

* Fixed the issue where the default conversation settings for MCP became ineffective in the previous version.
* Fixed the problem where the system prompt could not be modified when the Agent had not chatted.
* Fixed the error message appearing when opened for the first time without an LLM.


# 1.4.1

* Fixed the bug in calling the Gemini tool that did not support multiple tools.
* Added support for selecting some tools from MCP, saving more tokens.
* Supported quick input using @ + calling Agent.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in MCP tool command line.
* Supported changing the network access password.
* Tool call collapsible display.

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Supported confirmation when calling tools and modifying parameters for large model calls.
* Clickable tools to test tool calls.
* The knowledge base is planned for redevelopment; currently, it is not recommended for use. You can use OpenAI's embedding model instead of a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added quick button.
* Optimized mobile H5 display.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supported prompting while calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52


# 1.2.2

* Automatically obtain PATH for mac and linux, no need to input PATH.
* Added linux deb package.
* Fixed WebDav first sync error.
* Fixed bugs.


# 1.0.2

* Added settings for temperature.
* Fixed bugs.
* Supports pasting in input box, uploading images.

# 0.2.0

* Added knowledge base.


# 0.1.1

* Fixed MacOS image upload issue.
* Added quick copy button, supports copying messages and code.
* Optimized WebDav synchronization feature, keeping only 10 local versions.
* Markdown code rendering added syntax highlighting.
* HTML Artifacts added error capture, supporting opening Chrome console.


# 0.1.0

## HyperChat

* Supports two installation methods, plugin market + native MCP installation, rapid installation and configuration through the plugin market. Contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Optimized WebDav sync logic, backing up locally before syncing, syncing every 5 minutes.
* LLM added testing functionality to check for image input + tool calling (uses a little token).
* Chat supports image input.
* Chat supports displaying images returned from Tool Call as MCP resources.
* Fixed bugs.


# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization currently does not support MCP configuration synchronization; inconsistencies across operating systems may cause issues.
* Supported setting request methods, Stream | Complete.
* Supported KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized Tool for opening web pages.


# 0.0.11

## HyperChat

* Optimized Bot display, supporting search and drag-and-drop sorting.
* Conversation history supports filtering and searching.
* For APIs that do not support statistics on large model token consumption, such as Q&A, it supports rough statistics based on word count.
* Input box supports dragging files for quick input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supported quick configuration of Ollama and Qwen API models.

## HyperTools

* Optimized Tool for opening web pages, more comprehensive information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`