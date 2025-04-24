[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.5.4
* Fixed the issue with web access, adding the problem of large model test failures.

# 1.5.3

* Supported Claude official API.
* Optimized the built-in terminal, allowing user input.
* Supported failure in Agent task calls, using a backup large model.
* Added built-in Agent, `MCP helper`, to assist in installing MCP.
* Fixed Markdown rendering bug.
* Fixed bug in comparing multiple models in chat.

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supported chat renaming.
* Supported mcp configuration synchronization.
* Supported grok3's thought chain.
* Supported AI generating cron expressions.
* Supported message fork cloning.
* Supported development mode, quick export of conversation configurations for debugging.
* Added enable and disable switch for Claude's mcp.
* Added global control enable and disable switch for Task running.
* Optimized tool call cancellation to inform large model users of the cancellation.

![Support chat renaming](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Support mcp configuration synchronization](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Support grok3's thought chain](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Support AI generating cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Support message fork cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Support development mode, quick export of conversation configurations for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Support global control enable and disable for Task running](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Support development mode, quick export of conversation configurations for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![Optimized tool call cancellation to inform large model users of the cancellation](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)

# 1.4.17
* Fixed the issue that MacOS could not copy and other shortcut keys were not functioning.

# 1.4.16

* Supported displaying MCP Server version number and name.
* Added detailed error display for model errors.
* Added detailed error display for MCP errors.
* Optimized chat record storage, separating conversation messages to reduce loading and synchronization time.
* Modified WebDav synchronization.
* Supported MCP in Claude Desktop configuration.
* Supported direct viewing of configuration files on the web.
* Supported shortcut keys MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open developer tools.
* Chat record list supports displaying Agent icons.
* Fixed numerous bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)

# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supported opening from browser, downloading, added support for `Mermaid` preview.
* Modified the display of tool calls.
* Supported multiple model comparisons in chat.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)

# 1.4.4

* Fixed the issue in the previous version where the default conversation setting for mcp was invalid.
* Fixed the issue where the Agent could not modify the system prompt without chatting.
* Fixed the error prompt when opened for the first time with no LLM.

# 1.4.1

* Fixed the bug in Gemini tool calls that did not support multiple tools.
* Supported selecting part of the Tool from MCP to save Token.
* Supported quick input with @ + calling Agent.
* Fixed bugs.

![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Added built-in mcp tool command line.
* Supported modifying network access password.
* Tool call displays in a collapsed form.

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when calling tools and modify parameters for large model calls.
* Can click tools to call tools for testing.
* The knowledge base is planned to be redeveloped and is currently not recommended for use. You can use OpenAI's embedding model instead, and no longer work on local embedding models.

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
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Mac, Linux automatically obtain PATH, no need to input PATH.
* Added Linux deb package.
* Fixed WebDav first sync error.
* Fixed bugs.

# 1.0.2

* Increased temperature setting.
* Fixed bugs.
* Supported pasting in input box, uploading images.

# 0.2.0

* Added knowledge base.

# 0.1.1

* Fixed MacOS image upload.
* Added quick copy button, supports copying messages and code.
* Optimized WebDav synchronization function, only saving 10 local versions.
* Markdown code rendering increased highlighting.
* HTML Artifacts increased error capture, supports opening Chrome's console.

# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration from the plugin market. Contributions of plugins are welcome, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* WebDav synchronization logic optimized, backing up locally before syncing, syncing every 5 minutes.
* LLM added testing function, testing whether image input + tool calling is supported (consumes a little token).
* Chat supports image input.
* Chat supports displaying images from Tool Call returned MCP resources.
* Fixed bugs.

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, temporarily does not support MCP configuration synchronization. Inconsistent operating systems may cause issues.
* Supported setting request mode, Stream | Complete.
* Supported KaTeX, displaying mathematical formulas.

## HyperTools

* Optimized the Tool for opening webpages.

# 0.0.11

## HyperChat

* Optimized bot display, supports search and drag sorting.
* Conversation records support filtering + search.
* For APIs that do not support counting token consumption for large models, such as Qianwen, support using word count for fuzzy statistics.
* Input box supports dragging files for quick input of file paths.
* My LLM Models list supports drag sorting.
* Supports quick configuration for Ollama and Qwen API models.

## HyperTools

* Optimized the Tool for opening webpages, with improved information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`
