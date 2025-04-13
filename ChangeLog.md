[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.17
* Fixed the issue where MacOS cannot copy

# 1.4.16

* Added support for displaying MCP Server version number and name.
* Added detailed error display for model errors.
* Added detailed error display for MCP errors.
* Optimized chat history storage by separating conversation messages to reduce loading and synchronization time.
* Modified WebDav synchronization.
* Added support for MCP in Claude Desktop configuration.
* Added support for directly viewing configuration files on the web.
* Added shortcut keys: MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open Developer Tools.
* Chat history list supports displaying Agent icons.
* Fixed numerous bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote Markdown rendering, optimized `Artifacts`, supported opening and downloading from the browser, added support for `Mermaid` pre-release.
* Modified the display of tool calls.
* Supported selecting multiple models for chat comparison.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixed the issue where the default conversation setting for MCP became ineffective in the last version.
* Fixed the issue where the Agent could not modify the system prompt if it had not chatted.
* Fixed the error message when opened for the first time without LLM.


# 1.4.1

* Fixed the bug that Gemini tool calls did not support multiple tools.
* Supported selecting some Tools from MCP to save Tokens.
* Supported quick input with @ + calling Agent.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in MCP tool command line.
* Supported modifying the network access password.
* Collapsed display for tool calls.
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Enabled confirmation when calling tools, and modifying parameters for large models.
* Allowed clicking on tools to test calls.
* The knowledge base is planned for redevelopment; currently not recommended for use. You can use OpenAI's embedding model instead of local embedding models.
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

* Supported asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimized, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Mac, Linux automatically obtain PATH, no need to input PATH.
* Added Linux deb package.
* Fixed WebDav first synchronization error.
* Fixed bugs.


# 1.0.2

* Added setting for temperature.
* Fixed bugs.
* Supported pasting in the input box, uploading images.

# 0.2.0

* Added knowledge base.


# 0.1.1

* Fixed MacOS image upload.
* Added quick copy button to support copying messages and code.
* Optimized WebDav synchronization, keeping only 10 versions locally.
* Markdown code rendering added highlighting.
* HTML Artifacts increased error capture, supports opening Chrome's console.


# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation. Quick installation and configuration from the plugin market are welcome, please submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* WebDav synchronization logic optimization, local will back up first and then synchronize, synchronizing every 5 minutes.
* LLM added testing functionality to check if image input + tool calls are supported (consuming a little token).
* Chat supports inputting images.
* Chat supports displaying images returned by Tool Call resources from MCP.
* Fixed bugs.



# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization currently does not support MCP configuration synchronization; operating system inconsistencies may cause issues.
* Supported setting request method, Stream | Complete.
* Supported KaTeX to display mathematical formulas.

## HyperTools

* Optimized the tool for opening web pages.



# 0.0.11

## HyperChat

* Bot display optimization, supports searching and drag-and-drop sorting.
* Chat history supports filtering + searching.
* For APIs that do not support statistical token consumption for large models, such as Qianwen, support fuzzy statistics by word count.
* Input box supports drag-and-drop files for fast input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supported fast configuration of Ollama, Qwen API models.

## HyperTools

* Optimized the tool for opening web pages, with improved information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`