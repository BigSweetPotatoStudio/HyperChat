[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Support chat renaming
* Support MCP configuration synchronization
* Support AI-generated cron expressions
* Support message branching and cloning
* Support development mode for quick exporting of chat configurations for debugging
* Add switch to enable or disable the MCP for Claude
* Add global control switch for Task execution

![Support chat renaming](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Support MCP configuration synchronization](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Support AI-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Support message branching and cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Support development mode for quick exporting of chat configurations for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Support global control for Task execution enable or disable](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Support development mode for quick exporting of chat configurations for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)


# 1.4.17
* Fix the issue where copy and other shortcuts do not work on MacOS

# 1.4.16

* Support displaying the MCP Server version number and name.
* Add detailed error display for model errors.
* Add detailed error display for MCP errors.
* Optimize chat history storage by separating conversation messages, reducing loading and synchronization time.
* Modify WebDav synchronization.
* Support MCP in Claude Desktop configuration.
* Support direct viewing of configuration files on the web.
* Support shortcut keys on MACOS `Alt+Cmd+I`   Windows `Ctrl+Shift+I` to open developer tools.
* Chat history list supports displaying Agent icons.
* Fix numerous bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)


# 1.4.3
* Rewrite markdown rendering, optimize `Artifacts`, support opening from the browser, downloading, and adding support for `Mermaid` preview.
* Modify the display of called tools.
* Support selecting multiple models for comparison in chat.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)


# 1.4.4

* Fix the issue from the last version where the default chat setting for MCP became ineffective.
* Fix the issue where Agents could not modify system prompts when not chatting.
* Fix the error prompt with no LLM when first opened.


# 1.4.1

* Fix the bug where Gemini tool calls do not support multiple tools.
* Support selecting some tools from MCP to save tokens.
* Support quick input with @ + call Agent.
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Add built-in MCP tool command line.
* Support modifying network access password.
* Collapsed display for tool calls.

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Ask for confirmation when calling a tool and modify parameters for large model calls.
* Click on tools to test tool calls.
* The knowledge base is planned for redevelopment; it is currently not recommended to use. You can use OpenAI's embedding model instead of keeping a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* MCP loading progress display, add quick buttons.
* Optimize mobile H5 display.
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52


# 1.2.2

* Automatically get PATH on mac and linux, no need to input PATH.
* Add linux deb package.
* Fix WebDav first synchronization error.
* fixbug


# 1.0.2

* Add setting for temperature.
* Fix bug.
* Support pasting in the input box and uploading images.

# 0.2.0

* Add knowledge base.


# 0.1.1

* Fix MacOS image upload.
* Add quick copy buttons, support copying messages and code.
* Optimize WebDav synchronization, only keeping 10 local versions.
* Markdown code rendering adds highlighting.
* HTML artifacts increase error capture, support opening Chrome's console.


# 0.1.0

## HyperChat

* Support both plugin market and native MCP installation. Quick installation and configuration through the plugin market. Welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Optimize WebDav synchronization logic, local backup is performed before synchronization, synchronized every 5 minutes.
* Add testing function for LLM to check for image input and tool calls (consuming a little bit of tokens).
* Chat supports image input.
* Chat supports displaying Tool Call returning images from MCP resources.
* fix bugs.


# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization does not currently support MCP configuration synchronization; inconsistencies in operating systems may cause issues.
* Support setting request method, Stream | Complete.
* Support KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized the tool for opening webpages.


# 0.0.11

## HyperChat

* Bot display optimization, support searching and drag-and-drop sorting.
* Conversation history supports filtering and searching.
* For APIs that do not support counting tokens for large models, such as Qianwen, support fuzzy counting based on word count.
* Input box supports dragging files for quick file path input.
* My LLM Models list supports drag-and-drop sorting.
* Support quick configuration for Ollama, Qwen API models.

## HyperTools

* Optimized the tool for opening webpages, providing more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/ 哪个游戏是限时免费的？`