[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.8.4

* fix user message editing

# 1.8.3

* Support Qwen3 model from Qianwen official

# 1.8.2

* Fix compatibility mode and bugs in tool invocation
* Fix the bug where MCP exceptions were closed and automatically restarted when calling tools.
* Fix bugs

# 1.8.1

* Fix the issue of calling OpenAI and DeepSeek tools.
* Fix the bug of incorrect indentation when pasting long text.

# 1.8.0

* Support MCP gateway, combine multiple MCP tools into one gateway, support SSE + HTTP for easy access by external software
* Add toolbox, support for other OpenAI APIs
* Built-in MCP upgraded from `see` to `streamableHttp`
* Add the feature to minimize to tray

![image](https://github.com/user-attachments/assets/3b4a7279-747f-48c3-aa20-46cec929b364)
![image](https://github.com/user-attachments/assets/f3d6ec07-af4a-4ce7-aef4-6b644080b093)

# 1.7.2

* Add terminal display, manually input commands + AI model through `hyper_terminal` MCP tool input commands
* Fix bugs

![image](https://github.com/user-attachments/assets/70da7e2b-5555-4611-863c-f71ded3432b2)
![7ec10af4a0474fbb3ed39e13a383bc3a](https://github.com/user-attachments/assets/0ba16d29-136c-4788-91d8-8c8dbc754716)
![b6042f845409bddbcd6ad3f712f27216](https://github.com/user-attachments/assets/62549b1c-4e27-40fb-b877-b9a4be157778)

# 1.7.0

* Improve tool compatibility for Gemini
* Fix the issue where some tools in MCP showed incorrect count of selected tools.
* HyperTool and fetch tool will auto-scroll (some data is lazy-loaded, requires scrolling to trigger), search tool speed improved.
* Change the prefix naming for variables from scope to namespace.
* Electron version, add settings for the startup window size.
* Node.js version, add network settings, allow direct connection through local browser.
* Fix bugs

![image](https://github.com/user-attachments/assets/5c51c083-4ed8-4961-af62-ec34eba3e08e)
![image](https://github.com/user-attachments/assets/943e454e-8506-4a87-a486-d5f465b470f1)
![image](https://github.com/user-attachments/assets/b958bf63-add2-434a-a8e1-405ee1c773d9)

# 1.6.5

* Fix tool invocation for Qwen3 and other models, add tool invocation compatibility mode, similar to cline, matching <tool_use> via regex.
* View the result interface of repair tasks displaying exceptions.
* Fix bugs

# 1.6.3
* Brand new input editor, optimized display, added variable system, support built-in MCP to set variables, support JS code variables
* Large model list, support filtering, optimized display
* Fix the issue of failed hints for MCP-supported prompt input
* Agent list supports hover to display descriptions.
* WebDAV synchronization optimization.
* See MCP supports adding headers
* Chat log performance optimization, using virtual list + display optimization

![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)
![image](https://github.com/user-attachments/assets/6b91d593-51ef-4e51-8d1b-324bc071e9a7)

# 1.5.4
* Fix the issue of large model testing failures in web access.

# 1.5.3

* Support Claude official API.
* Optimized built-in terminal, allowing user input
* Support for Agent task invocation failures, using backup large models.
* Add built-in Agent, `MCP helper`, to assist in installing MCP
* Fix Markdown rendering bug
* Fix bug of comparing multiple models in chat

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Support renaming chats
* Support MCP configuration synchronization
* Support grok3 thinking chains
* Support AI-generated cron expressions
* Support message fork cloning
* Support development mode, quickly export conversation configurations for debugging
* Add enable/disable switch for Claude's MCP
* Add global control enable/disable switch for Task runtime
* Optimize tool invocation cancellation, informing large model users of canceled operations

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
* Fix the issue where MacOS cannot copy and other shortcut keys are ineffective

# 1.4.16

* Support displaying MCP Server version number and name.
* Add detailed error display when the model reports an error.
* Add detailed error display when MCP reports an error.
* Optimize chat record storage, store conversation messages separately to reduce loading and synchronization time.
* Modify WebDav synchronization.
* Support MCP in Claude Desktop configuration.
* Support direct viewing of configuration files on the web
* Support shortcut keys MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open developer tools
* Chat record list supports displaying Agent icons
* Fix numerous bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)

# 1.4.3
* Rewritten markdown rendering, optimized `Artifacts`, support opening from browser, downloading, and added support for `Mermaid` pre-rendering.
* Modify the display for invoking tools
* Support selecting multiple models for comparison in chat

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)

# 1.4.4

* Fix the issue in the previous version where default conversations had MCP settings invalid.
* Fix the issue where Agents couldn't modify system prompts without chatting.
* Fix the error prompt when opened for the first time without LLM

# 1.4.1

* Fix the bug in Gemini tool invocation that did not support multiple tools
* Support selecting some tools in MCP to save tokens
* Support quick input with @ + invoke Agent
* Fix bugs

![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Add built-in MCP tools command line
* Support modifying network access password
* Tool invocation collapsible display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Confirm when invoking tools, and modify parameters for large model invocation
* Can click tools to invoke them for testing.
* The knowledge base is planned to be redeveloped, currently not recommended for use, can use OpenAI's embedding model, no longer doing local embedding models

![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* Display MCP loading progress, add shortcut buttons
* Optimize mobile H5 display
* Fix bugs

![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Support asking when invoking tools
![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time
![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings
![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* Mac and Linux automatically get PATH, no need to input PATH.
* Add Linux deb package
* Fix WebDav first-time synchronization error
* Fix bugs

# 1.0.2

* Increase setting temperature
* Fix bugs
* Support pasting in the input box, uploading images

# 0.2.0

* Add knowledge base

# 0.1.1

* Fix MacOS image upload
* Add quick copy button, support copying messages and code
* WebDav synchronization function optimization, only saving 10 versions locally
* Markdown code rendering adds highlighting
* HTML Artifacts add error capture, support opening Chrome's console

# 0.1.0

## HyperChat

* Support for plugin market + native installation of MCP, quick installation and configuration through the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav synchronization logic optimization, local backup before synchronization, synchronize once every 5 minutes
* LLM adds testing function, testing if image input is supported + tool invocation (consuming a little token)
* Chat supports image input
* Chat supports displaying Tool Call returned image MCP resource
* Fix bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of MCP Server.
* WebDav synchronization, temporarily does not support MCP configuration synchronization, inconsistent operating systems may cause issues.
* Support setting request method, Stream | Complete
* Support KaTeX, display mathematical formulas

## HyperTools

* Optimized opening web Tool

# 0.0.11

## HyperChat

* Bot display optimization, support searching, drag-and-drop sorting
* Conversation records support filtering + searching
* For APIs that do not support counting tokens consumed by large models, such as Qianwen, support fuzzy counting by word count
* Input box supports dragging files to quickly input file paths
* My LLM Models list supports drag-and-drop sorting
* Support quick configuration for Ollama, Qwen's API models

## HyperTools

* Optimized opening web Tool, more complete extraction of information. For example, to answer this question `https://store.epicgames.com/zh-CN/   哪个游戏是限时免费的？`