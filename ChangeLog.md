[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Supports Claude official API.
* Optimized the built-in terminal to allow user input.
* Supports fallback to a backup large model in case of Agent task call failure.
* Added built-in Agent, `MCP helper`, to assist in installing MCP.
* Fixed Markdown rendering bug.
* Fixed bug for comparing multiple models in chat.

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supports renaming chats.
* Supports MCP configuration synchronization.
* Supports thinking chain of grok3.
* Supports AI-generated cron expressions.
* Supports message branching clones.
* Supports developer mode, quickly exporting conversation configurations for debugging.
* Added toggle to enable or disable Claude's MCP.
* Added global control toggle to enable or disable Task runs.
* Optimized tool call cancellation, notifying users in large models that the operation was canceled.

![Supports renaming chats](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Supports MCP configuration synchronization](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Supports thinking chain of grok3](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Supports AI-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Supports message branching clones](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Supports developer mode, quickly exporting conversation configurations for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Supports global control to enable or disable Task runs](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Supports developer mode, quickly exporting conversation configurations for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![Optimized tool call cancellation, notifying users in large models that the operation was canceled](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)

# 1.4.17
* Fixed the issue of inability to copy on MacOS and other hotkeys being ineffective.

# 1.4.16

* Supports displaying MCP Server version number and name.
* Added detailed error display for model errors.
* Added detailed error display for MCP errors.
* Optimized chat record storage, storing conversation messages separately to reduce loading and synchronization time.
* Modified WebDav synchronization.
* Supports MCP in Claude Desktop configuration.
* Supports direct viewing of configuration files on the web.
* Supports hotkeys MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open developer tools.
* Chat record list supports displaying Agent icons.
* Fixed numerous bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)

# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening from browser, downloading, increased support for `Mermaid` pre-rendering.
* Modified the display of tool calls.
* Supports selecting multiple models for comparison in chat.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)

# 1.4.4

* Fixed the issue from the previous version where the default conversation setting for MCP became ineffective.
* Fixed the issue where Agents could not modify system prompts when not chatting.
* Fixed the error prompt with no LLM upon first opening.

# 1.4.1

* Fixed the bug where Gemini tool calls did not support multiple tools.
* Supports selecting partial Tools from MCP to save Tokens.
* Supports quick input with @ + calling Agent.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Added built-in MCP tool command line.
* Supports modifying network access password.
* Tool calls are displayed in a collapsed manner.

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm whether to call the tool and modify parameters for large model calls when calling tools.
* Can click tools to test them.
* The knowledge base is planned for redevelopment, currently not recommended for use; openai's embedding model can be used instead, no need for a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* Displays MCP loading progress, added shortcut buttons.
* Optimized mobile H5 display.
* Fixed bugs.
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Supports asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Automatically get PATH on mac and linux without inputting it.
* Added Linux deb package.
* Fixed WebDav first synchronization error.
* Fixed bugs.

# 1.0.2

* Increased temperature setting.
* Fixed bugs.
* Supports pasting in input box and uploading images.

# 0.2.0

* Added knowledge base.

# 0.1.1

* Fixed image upload on MacOS.
* Added quick copy button, supports copying messages and code buttons.
* Optimized WebDav synchronization function, only saving 10 versions locally.
* Markdown code rendering increased highlighting.
* HTML Artifacts increased error capture, supports opening Chrome console.

# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration through plugin market, submissions welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Optimized WebDav synchronization logic, backing up locally before synchronizing, synchronizing every 5 minutes.
* LLM added testing function to test if it supports image input + tool calls (consuming a little bit of token).
* Chat supports image input.
* Chat supports displaying image MCP resources returned by Tool Call.
* Fixed bugs.

# 0.0.13

## HyperChat

* Optimized startup speed of MCP Server.
* WebDav synchronization currently does not support MCP configuration synchronization, issues may arise due to inconsistent operating systems.
* Supports setting request methods, Stream | Complete.
* Supports KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized tool to open web pages.

# 0.0.11

## HyperChat

* Optimized Bot display, supports searching, drag-and-drop sorting.
* Conversation records support filtering + searching.
* For APIs that do not support calculating token consumption for large models, such as Qianwen, fuzzy statistics by word count are supported.
* Input box supports drag-and-drop file for quick input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration of Ollama, Qwen API models.

## HyperTools

* Optimized tool to open web pages, more complete information extraction. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`