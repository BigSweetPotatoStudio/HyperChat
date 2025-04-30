[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.6.5

* Fixed tool calls for models like qwen3, added tool call compatibility mode, similar to cline, through regex matching <tool_use>,
* View the results of the repair task interface, displaying abnormal issues.
* fixbug

# 1.6.3
* Brand new input editor, optimized display, added variable system, supports built-in mcp settings variables, supports js code variables
* Large model list, supports filtering, optimized display
* Fixed the issue where prompts supporting mcp failed to input
* Agent list supports hover to display description.
* WebDAV sync optimization.
* see MCP supports adding headers
* Chat record performance optimization, using virtual list + display optimization

![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)
![image](https://github.com/user-attachments/assets/6b91d593-51ef-4e51-8d1b-324bc071e9a7)

# 1.5.4
* Fixed the issue where web access added large model test failure.

# 1.5.3

* Supports Claude official API.
* Optimized the built-in terminal, allowing user input
* Supports Agent task call failure, using backup large model.
* Added built-in Agent, `MCP helper`, to assist in installing MCP
* Fixed Markdown rendering bug
* Fixed the bug of multi-model comparison in chat

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supports chat renaming
* Supports mcp configuration sync
* Supports grok3's thought chain
* Supports ai-generated cron expressions
* Supports message branching cloning
* Supports development mode, quick export of conversation configuration for debugging
* Added an enable/disable switch for Claude's MCP
* Added global control enable/disable switch for Task execution
* Tool call cancellation optimization, informing the large model user that the operation was cancelled

![支持聊天重命名](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![支持mcp配置同步](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![支持grok3的思维链](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![支持ai生成cron表达式](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![支持消息分叉克隆](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![支持开发模式，快速导出对话配置，用于调试](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![支持Task运行全局控制启用，禁用](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![支持开发模式，快速导出对话配置，用于调试](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![工具调用取消优化，告诉大模型用户取消了操作](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)

# 1.4.17
* Fixed the issue of MacOS not being able to copy and other shortcut keys becoming ineffective

# 1.4.16

* Supports displaying MCP Server version number and name.
* Added detailed error display when the model fails.
* Added detailed error display when MCP fails.
* Optimized chat record storage, separating dialogue messages to reduce loading and sync time.
* Modified WebDav sync.
* Supports MCP in Claude Desktop configuration.
* Supports direct viewing of configuration files on the web end
* Supports shortcut keys MACOS `Alt+Cmd+I`   Windows `Ctrl+Shift+I` to open developer tools
* Chat record list supports displaying Agent icons
* Fixed numerous bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)

# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening from browser, downloading, added support for `Mermaid` pre-releases,
* Changed tool call display
* Supports chat selection of multiple model comparisons

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)

# 1.4.4

* Fixed the issue in the previous version where the default conversation and setting mcp became ineffective.
* Fixed the issue where the Agent could not modify the system prompt word when not chatting.
* Fixed the non-LLM error prompt when first opened.

# 1.4.1

* Fixed the bug in Gemini tool calls that do not support multiple tools
* Supports selecting some Tools of MCP, saving tokens
* Supports @ quick input + calling Agent
* fixbug
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Added built-in mcp tool command line
* Supports modifying network access password
* Tool call collapsible display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* You can confirm when calling tools and modify parameters for large model calls
* You can click on tools to test the tool calls.
* The knowledge base is planned for redevelopment, and currently not recommended for use, you can use OpenAI's embedding model, and no longer develop local embedding models.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* mcp loading progress display, added shortcut button
* Optimized mobile h5 display
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Supports asking when calling tools![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool optimization, settings![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Mac, Linux automatically get PATH, no need to input PATH anymore.
* Added linux deb package
* fix WebDav first sync error
* fixbug

# 1.0.2

* Added setting temperature
* Fixed bug
* Supports paste in input box, upload images

# 0.2.0

* Added knowledge base

# 0.1.1

* fix MacOS image upload
* Added quick copy button, supports copying messages and code
* WebDav sync function optimization, only saving 10 versions locally
* Markdown code rendering increases highlighting
* HTML Artifacts added error capture, supports opening Chrome's console

# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native MCP installation, quick installation and configuration from the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav sync logic optimization, will back up before syncing, sync every 5 minutes
* LLM added testing function, testing whether supports image input + tool calls (consuming a little token)
* Chat supports image input
* Chat supports displaying images returned by Tool Call MCP resources
* fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav sync temporarily does not support MCP configuration sync; operating system inconsistencies may cause issues.
* Supports setting request method, Stream | Complete
* Supports KaTeX, displaying mathematical formulas

## HyperTools

* Optimized, opening web Tool

# 0.0.11

## HyperChat

* Bot display optimization, supports search, drag-and-drop sorting
* Conversation history supports filtering + searching
* For APIs that do not support token consumption statistics for large models, such as Qianwen, support fuzzy statistics based on word count
* Input box supports drag-and-drop file for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration for Ollama, Qwen's API model

## HyperTools

* Optimized, opening web Tool, more comprehensive information extraction. For example, answer the question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`