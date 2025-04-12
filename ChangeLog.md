[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Support displaying MCP Server version number and name.
* When adding a model error, display detailed error.
* When adding MCP error, display detailed error.
* Optimize chat record storage by separating conversation messages to reduce loading and synchronization time.
* Modify WebDav synchronization.
* Support MCP in Claude Desktop configuration.
* Support direct viewing of configuration files on the web.
* Support shortcut keys MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open developer tools.
* Fix bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)


# 1.4.3
* Rewrite markdown rendering, optimize `Artifacts`, support opening from the browser, downloading, and increase support for `Mermaid` pre-release.
* Modify the display of tool calls.
* Support chat selecting multiple models for comparison.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fix the issue from the last version where the default chat setting for MCP became ineffective.
* Fix the issue where the Agent could not modify the system prompt when not chatting.
* Fix the error message for no LLM when first opened.


# 1.4.1

* Fix the bug in Gemini tool calls that do not support multiple tools.
* Support selecting partial Tools for MCP to save tokens.
* Support @ quick input + call Agent.
* Fix bugs.
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Add built-in mcp tool command line.
* Support modifying network access password.
* Fold display of tool calls.

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when calling tools and modify parameters for large model calls.
* Can click tools to test them.
* The knowledge base is planned for redevelopment, currently not recommended for use. You can use OpenAI's embedding model instead of local embedding models.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* Show MCP loading progress, add shortcut buttons.
* Optimize mobile h5 display.
* Fix bugs.
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* mac, linux automatically get PATH, no need to input PATH.
* Add linux deb package.
* Fix WebDav first synchronization error.
* Fix bugs.


# 1.0.2

* Increase setting temperature.
* Fix bugs.
* Support pasting in input box, uploading images.

# 0.2.0

* Add knowledge base.


# 0.1.1

* Fix MacOS image uploading.
* Add quick copy buttons, support buttons for copying messages and codes.
* Optimize WebDav synchronization, keeping only 10 versions locally.
* Markdown code rendering increases highlighting.
* HTML Artifacts add error capture, support opening Chrome's console.



# 0.1.0

## HyperChat

* Support both plugin market + MCP native installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimization, backing up before syncing locally, syncing every 5 minutes.
* LLM add testing function, test if it supports image input + tool calls (consuming a little token).
* Chat supports inputting images.
* Chat supports displaying images returned by Tool Call as MCP resources.
* Fix bugs.




# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization, temporarily does not support synchronizing MCP configuration, operating system inconsistencies may cause issues.
* Support setting request method, Stream | Complete.
* Support KaTeX, display mathematical formulas.

## HyperTools

* Optimized the Tool for opening web pages.



# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting.
* Conversation history supports filtering + searching.
* For APIs that do not support statistics on large model token consumption, such as Qianwen, support fuzzy statistics based on word count.
* Input box supports drag-and-drop files for quick input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration of Ollama and Qwen's API models.

## HyperTools

* Optimized the Tool for opening web pages, more comprehensive information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is free for a limited time?`