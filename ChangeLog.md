[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Rewrite markdown rendering, optimize `Artifacts`, support opening from the browser, downloading, and increase support for `Mermaid` pre-releases,
* Modify the display of the called tools

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)

# 1.4.4

* Fix the issue in the previous version where the default conversation and setting MCP became ineffective.
* Fix the problem where the agent's system prompt could not be modified when not in chat.
* Fix the error message without LLM when opened for the first time.

# 1.4.1

* Fix the bug that Gemini tool calling does not support multiple tools.
* Support selecting part of Tool for MCP, saving more Tokens.
* Support @ for quick input + call Agent.
* fix bug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Add built-in MCP tool command line.
* Support modifying network access password.
* Tool call collapsible display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm whether to call the tool and modify the parameters of the large model call.
* Can click on tools to call tools for testing.
* The knowledge base is planned to be redeveloped and is currently not recommended for use. You can use OpenAI's embedding model instead of doing a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* MCP loading progress display, added shortcut button.
* Optimize mobile H5 display.
* fix bug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Support asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* mac, linux automatically get PATH, no need to enter PATH.
* Added linux deb package.
* fix WebDav error during first synchronization.
* fix bug

# 1.0.2

* Increase setting temperature.
* Fix bugs.
* Support input box paste, upload images.

# 0.2.0

* Add knowledge base.

# 0.1.1

* fix MacOS image upload.
* Add quick copy button, support copying messages and code.
* WebDav synchronization function optimization, only save 10 local versions.
* Markdown code rendering increases highlighting.
* HTML Artifacts increase error capture, support opening Chrome console.

# 0.1.0

## HyperChat

* Support two installation methods: plugin market + MCP native installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimization, local will backup first and then synchronize, synchronize every 5 minutes.
* LLM adds testing functionality to check if image input + tool call is supported (consumes a little token).
* Chat supports image input.
* Chat supports displaying images returned by Tool Call from MCP resources.
* fix bugs.

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDav synchronization, currently does not support MCP configuration synchronization. Inconsistent operating systems may cause issues.
* Support setting request method, Stream | Complete.
* Support KaTeX for displaying mathematical formulas.

## HyperTools

* Optimized the Tool for opening web pages.

# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting.
* Conversation history supports filtering + searching.
* For APIs that do not support counting token consumption of large models, such as Qianwen, support fuzzy counting by word count.
* Input box supports drag-and-drop file quick input file path.
* My LLM Models list supports drag-and-drop sorting.
* Support quick configuration for Ollama and Qwen's API models.

## HyperTools

* Optimized the Tool for opening web pages, more complete information extraction. For example, answering the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`