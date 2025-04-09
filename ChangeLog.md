[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Rewrite markdown rendering, optimize `Artifacts`, support opening from browser, downloading, and add support for `Mermaid` pre-release.
* Modify display of tool calls.
* Support chat selection of multiple models for comparison.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)

# 1.4.4

* Fix issue in the last version where the default conversation and mcp settings failed.
* Fix issue where the Agent could not modify the system prompt without chatting.
* Fix error message when opened for the first time with no LLM.

# 1.4.1

* Fix bug with Gemini tool calls not supporting multiple tools.
* Support selecting some Tools for MCP to save Tokens.
* Support @ quick input + call Agent.
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Add built-in mcp tool command line.
* Support modifying network access password.
* Tool call collapse display.

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Confirm when calling tools and modify parameters for big model calls.
* Click tools to call tools for testing.
* The knowledge base is planned for redevelopment; currently not recommended for use. You can use OpenAI's embedding model instead of developing a local embedding model.

![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* mcp loading progress display, add shortcut button.
* Optimize mobile h5 display.
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059).
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96).
* hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5).
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52.

# 1.2.2

* Mac, Linux automatically obtain PATH, no need to input PATH anymore.
* Add linux deb package.
* fix WebDav first synchronization error.
* fixbug.

# 1.0.2

* Increase setting temperature.
* Fix bugs.
* Support pasting in the input box, uploading images.

# 0.2.0

* Add knowledge base.

# 0.1.1

* fix MacOS image upload.
* Add quick copy button, supporting copying messages and code.
* WebDav synchronization function optimization, only saving 10 local versions.
* markdown code rendering adds highlighting.
* HTML Artifacts adds error capture, supports opening Chrome's console.

# 0.1.0

## HyperChat

* Supports both plugin market + native MCP installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* WebDav synchronization logic optimization, local will first back up and then synchronize, synchronizing every 5 minutes.
* LLM adds testing function, testing whether to support image input + tool calls (consuming a little token).
* Chat supports image input.
* Chat supports displaying Tool Call returned image MCP resources.
* fix bugs.

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, currently does not support MCP configuration synchronization, inconsistent operating systems may cause problems.
* Support setting request method, Stream | Complete.
* Support KaTeX, displaying mathematical formulas.

## HyperTools

* Optimized the Tool that opens web pages.

# 0.0.11

## HyperChat

* Bot display optimization, supporting search, drag-and-drop sorting.
* Conversation history supports filtering + searching.
* For APIs that do not support statistics of big model's consumed tokens, such as Qianwen, support using word count for fuzzy statistics.
* Input box supports drag-and-drop file for quick input of file paths.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration of Ollama and Qwen's API models.

## HyperTools

* Optimized the Tool that opens web pages, more complete information extraction. For example, answer this question `https://store.epicgames.com/zh-CN/   Which game is available for free for a limited time?`