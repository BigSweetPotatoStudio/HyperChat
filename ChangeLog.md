[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.4.17
* Fixed the issue where MacOS cannot copy and keyboard shortcuts fail

# 1.4.16

* Support displaying the MCP Server version number and name.
* Added detailed error messages when the model encounters errors.
* Added detailed error messages when MCP encounters errors.
* Optimized chat history storage, separating conversation messages to reduce loading and sync time.
* Modified WebDav synchronization.
* Supported MCP in Claude Desktop configuration.
* Supported direct viewing of configuration files on the web.
* Supported keyboard shortcuts MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open Developer Tools.
* Chat history list supports displaying Agent icons.
* Fixed a large number of bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supported opening and downloading from the browser, and added support for `Mermaid` pre-rendering.
* Modified the display of the tool invocation.
* Supported selecting multiple models for comparison in chat.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixed the issue in the previous version where default conversations would cause MCP settings to be ineffective.
* Fixed the issue where the Agent could not modify system prompts when not chatting.
* Fixed the error prompt for the first opening without LLM.


# 1.4.1

* Fixed the bug with Gemini tool invocation not supporting multiple tools.
* Supported selecting partial Tools of MCP to save tokens.
* Supported quick input with @ + invoke Agent.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line.
* Supported changing network access password.
* Collapsed display of tool invocation.
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when invoking tools and modify parameters for large model invocations.
* Can click tools to invoke them for testing.
* The knowledge base is intended for redevelopment; currently not recommended for use. You can use OpenAI's embedding model instead and no longer maintain a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* Added MCP loading progress display and quick-button.
* Optimized mobile H5 display.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supported asking when invoking tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Added historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically get PATH for mac and linux, no need to input PATH anymore.
* Added linux deb package.
* Fixed WebDav first sync error.
* Fixed bugs.


# 1.0.2

* Added setting temperature.
* Fixed bugs.
* Supported pasting in the input box and uploading images.

# 0.2.0

* Added knowledge base.


# 0.1.1

* Fixed MacOS image upload.
* Added quick copy buttons that support copying messages and code.
* Optimized WebDav sync functionality, only saving 10 local versions.
* Markdown code rendering added highlighting.
* HTML Artifacts added error capture, supporting opening the Chrome console.



# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation. Quick installation and configuration through the plugin market; contributions of plugins are welcome at [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Optimized WebDav synchronization logic: local backup followed by sync every 5 minutes.
* Added testing functionality for LLM, testing for support of image input + tool invocation (slightly consumes tokens).
* Chat supports inputting images.
* Chat supports displaying images of Tool Call returned MCP resources.
* Fixed bugs.




# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, currently does not support syncing MCP configurations due to operating system inconsistencies that may cause issues.
* Supports setting request methods, Stream | Complete.
* Supports KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized the Tool for opening web pages.



# 0.0.11

## HyperChat

* Optimized bot display, supports search and drag-and-drop sorting.
* Conversation history supports filtering and searching.
* For APIs that do not support statistics on large model token consumption, such as Q&A, supports fuzzy word count statistics.
* The input box supports drag-and-drop file input for quick file path entry.
* My LLM Models list supports drag-and-drop sorting.
* Supported quick configuration for Ollama and Qwen's API models.

## HyperTools

* Optimized the Tool for opening web pages, providing better information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`