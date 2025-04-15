[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

![image](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)


# 1.4.17
* Fixed the issue where copy and other shortcuts were ineffective on MacOS

# 1.4.16

* Supported displaying MCP Server version number and name.
* Added detailed error display when a model fails.
* Added detailed error display when MCP fails.
* Optimized chat history storage by storing conversation messages separately, reducing loading and syncing time.
* Modified WebDav synchronization.
* Supported MCP in Claude Desktop configuration.
* Supported directly viewing configuration files on the web.
* Supported shortcuts MACOS `Alt+Cmd+I`   Windows `Ctrl+Shift+I` to open Developer Tools.
* Chat history list supports displaying Agent icons.
* Fixed numerous bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supported opening from the browser, downloading, and added support for `Mermaid` pre-release.
* Modified the display of tool calls.
* Supported selecting multiple models for comparison in chat.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)


# 1.4.4

* Fixed the issue from the previous version where the default conversation settings for mcp failed.
* Fixed the issue where the Agent could not modify system prompts when not chatting.
* Fixed the error message when opened for the first time without an LLM.


# 1.4.1

* Fixed the bug with the Gemini tool call not supporting multiple tools.
* Supported selecting some tools from MCP to save tokens.
* Supported @ quick input + calling Agent.
* Fixed bugs.

![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Added built-in mcp tool command line.
* Supported changing network access password.
* Tool calls display in a collapsible manner.

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm before calling a tool and modify parameters for large model calls.
* Can click on tools to test the calls.
* The knowledge base is planned to be redeveloped, and it is currently not recommended for use. You can use OpenAI's embedding model instead of developing a local embedding model.

![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, added quick buttons.
* Optimized mobile H5 display.
* Fixed bugs.

![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supported asking when calling tools.
![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time.
![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings.
![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Added historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52


# 1.2.2

* Mac and Linux automatically retrieve PATH, no need to enter PATH anymore.
* Added Linux deb package.
* Fixed WebDav first synchronization error.
* Fixed bugs.


# 1.0.2

* Added temperature setting.
* Fixed bugs.
* Supported pasting in the input box and uploading images.

# 0.2.0

* Added knowledge base.


# 0.1.1

* Fixed image upload on MacOS.
* Added quick copy button, supports copying messages and code.
* Optimized WebDav synchronization, only keeping 10 versions locally.
* Added syntax highlighting for markdown code rendering.
* HTML Artifacts added error capture, supports opening Chrome's console.


# 0.1.0

## HyperChat

* Supports both plugin market and native MCP installation, quick installation and configuration from the plugin market, contributions for plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Optimized WebDav synchronization logic, backing up locally before synchronizing, synchronizing every 5 minutes.
* Added testing function for LLM to check for image input support + tool calls (uses a little bit of tokens).
* Chat supports image input.
* Chat supports displaying images returned by Tool Call MCP resources.
* Fixed bugs.


# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization currently does not support MCP configuration synchronization, operating systems may cause issues.
* Supported setting request methods, Stream | Complete.
* Supported KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized the tool for opening webpages.


# 0.0.11

## HyperChat

* Optimized Bot display, supports search and drag-and-drop sorting.
* Conversation records support filtering and searching.
* For APIs that do not support statistics on large model token consumption, such as Qianwen, support fuzzy statistics based on word count.
* The input box supports drag-and-drop file input.
* The My LLM Models list supports drag-and-drop sorting.
* Supported quick configuration for Ollama and Qwen's API models.

## HyperTools

* Optimized the tool for opening webpages for better information extraction, such as answering this question: `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`