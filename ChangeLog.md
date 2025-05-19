[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# 1.8.0

* Support for MCP gateway, combining multiple MCP tools into one gateway, supporting SSE + HTTP, making it convenient for external software calls
* Added toolbox, supporting other OpenAI APIs
* The built-in MCP upgraded from `see` to `streamableHttp`
* Added minimize to tray feature

![image](https://github.com/user-attachments/assets/3b4a7279-747f-48c3-aa20-46cec929b364)
![image](https://github.com/user-attachments/assets/f3d6ec07-af4a-4ce7-aef4-6b644080b093)

# 1.7.2

* Added terminal display, manual command input + AI model, input commands through `hyper_terminal` MCP tool
* Fixed bugs

![image](https://github.com/user-attachments/assets/70da7e2b-5555-4611-863c-f71ded3432b2)
![7ec10af4a0474fbb3ed39e13a383bc3a](https://github.com/user-attachments/assets/0ba16d29-136c-4788-91d8-8c8dbc754716)
![b6042f845409bddbcd6ad3f712f27216](https://github.com/user-attachments/assets/62549b1c-4e27-40fb-b877-b9a4be157778)

# 1.7.0

* Improved tool compatibility for Gemini
* Fixed the issue with selected tool count error when selecting some MCP tools.
* HyperTool fetch tool will auto-scroll (some data is lazily loaded and requires scrolling to trigger), search tool speed enhanced.
* Prefix naming for variables changed from scope to namespace.
* Electron version, added setting for startup window size.
* Node.js version, added network settings, allowing direct connection through local browser.
* Fixed bugs

![image](https://github.com/user-attachments/assets/5c51c083-4ed8-4961-af62-ec34eba3e08e)
![image](https://github.com/user-attachments/assets/943e454e-8506-4a87-a486-d5f465b470f1)
![image](https://github.com/user-attachments/assets/b958bf63-add2-434a-a8e1-405ee1c773d9)

# 1.6.5

* Fixed tool calls for models like Qwen3, added tool call compatibility mode, similar to cline, using regex to match <tool_use>
* View repair task results interface, display issues with abnormalities.
* Fixed bugs

# 1.6.3
* Brand new input editor, optimized display, added variable system, supports built-in MCP to set variables, supports JS code variables
* Large model list, supports filtering, optimized display
* Fixed the issue where prompt input for MCP support failed
* Agent list supports hover to display description.
* WebDAV synchronization optimized.
* See MCP supports adding headers
* Chat record performance optimization, using virtual list + display optimization

![image](https://github.com/user-attachments/assets/b2c9d59f-650f-49b8-a0ea-f0634644b27e)
![image](https://github.com/user-attachments/assets/3452890a-864b-4ea7-84d4-505bd1821fdc)
![image](https://github.com/user-attachments/assets/6b91d593-51ef-4e51-8d1b-324bc071e9a7)

# 1.5.4
* Fixed the issue with web access, added large model test failure problem.

# 1.5.3

* Supports Claude official API.
* Optimized built-in terminal, allowing user input
* Supports Agent task call failures, uses backup large model.
* Added built-in Agent, `MCP helper`, to help install MCP
* Fixed Markdown rendering bugs
* Fixed bugs in comparison of multiple models in chat

![image](https://github.com/user-attachments/assets/c450aea2-c3f2-4527-ae06-8bcaa928416c)
![image](https://github.com/user-attachments/assets/7094cef7-e6f2-452e-9a1d-59871d146364)
![image](https://github.com/user-attachments/assets/5ebf05c7-007e-4eee-9b98-df5662b54f62)

# 1.5.0
* Supports renaming chats
* Supports MCP configuration synchronization
* Supports Grok3's thought chain
* Supports AI-generated cron expressions
* Supports message forking and cloning
* Supports development mode, rapid export of conversation configuration for debugging
* Added toggle to enable/disable Claude's MCP
* Added global control toggle for Task running
* Optimized tool call cancellation, informing large model users that the operation was canceled

![Supports renaming chats](https://github.com/user-attachments/assets/9e178d72-2446-4d63-a1ac-ac0299a3d0a4)
![Supports MCP configuration synchronization](https://github.com/user-attachments/assets/ecc4945d-3170-476f-b653-badecf972957)
![Supports Grok3's thought chain](https://github.com/user-attachments/assets/6123221e-2646-4553-b8d4-16b49428c69a)
![Supports AI-generated cron expressions](https://github.com/user-attachments/assets/5855ed6e-d502-4913-a712-7a1d65b7722f)
![Supports message forking and cloning](https://github.com/user-attachments/assets/498d4e03-0555-4b9b-9838-ec46602fb501)
![Supports development mode, rapid export of conversation configuration for debugging](https://github.com/user-attachments/assets/124a6e1a-6436-4308-8475-9fb32b5e3f09)
![Supports global control toggle for Task running](https://github.com/user-attachments/assets/7537941a-1e2d-41a8-abb6-2569fe040067)
![Supports development mode, rapid export of conversation configuration for debugging](https://github.com/user-attachments/assets/9bfdf789-378e-43d7-bcdf-8a91c593fe16)
![Optimized tool call cancellation, informing large model users that the operation was canceled](https://github.com/user-attachments/assets/8b1186b3-929f-4c86-95ce-50dbf2216f01)

# 1.4.17
* Fixed issues with MacOS unable to copy and shortcut keys failing

# 1.4.16

* Supports displaying MCP Server version number and name.
* Added detailed error display when the model encounters errors.
* Added detailed error display when MCP encounters errors.
* Optimized chat record storage, separating conversation messages to reduce loading and synchronization time.
* Modified WebDAV synchronization.
* Supports MCP in Claude Desktop configuration.
* Supports direct viewing of configuration files on the web
* Shortcut keys MACOS `Alt+Cmd+I` Windows `Ctrl+Shift+I` to open developer tools
* Chat record list supports displaying Agent icons
* Fixed many bugs

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)
![image](https://github.com/user-attachments/assets/c69addb1-6a07-4fb8-8858-8851cfd31be6)
![image](https://github.com/user-attachments/assets/23717164-7177-4622-a4bd-bd2d13be1edf)

# 1.4.3
* Rewrote markdown rendering, optimized `Artifacts`, supports opening from the browser, downloading, and increased support for `Mermaid` pre-releases,
* Modified the display of tool calls
* Supports selecting multiple models for comparison in chat

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)

# 1.4.4

* Fixed the issue in the previous version where the default conversation had the MCP settings invalidated.
* Fixed the issue where Agents couldn't modify system prompts when not chatting.
* Fixed the error prompt with no LLM during the first opening

# 1.4.1

* Fixed the bug where Gemini tool calls did not support multiple tools
* Supports selecting partial Tools from MCP to save Token
* Supports quick input with @ + calling Agent
* Fixed bugs
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)

# 1.4.0

* Added built-in MCP tool command line
* Supports modifying network access password
* Tool calls folded display

![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* When calling tools, can confirm and modify large model calling parameters
* Can click tools to test calls.
* The knowledge base is planned for redevelopment, currently not recommended for use. OpenAI's embedding model can be used instead, without a local embedding model
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)

# 1.2.15

* MCP loading progress display, added quick buttons
* Optimized mobile H5 display
* Fixed bugs
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)

# 1.2.12

* Supports asking when calling tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* Chat supports displaying time ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* Hypetool optimization, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52

# 1.2.2

* mac, linux automatically obtain PATH, no need to enter PATH anymore.
* Added linux deb package
* Fixed WebDAV first synchronization error
* Fixed bugs

# 1.0.2

* Added setting temperature
* Fixed bugs
* Supports pasting in input box, uploading images

# 0.2.0

* Added knowledge base

# 0.1.1

* Fixed MacOS image upload
* Added quick copy button, supports copying messages and code
* Optimized WebDAV synchronization function, keeping only 10 local versions
* Markdown code rendering increased highlighting
* HTML artifacts added error capturing, supports opening Chrome's console

# 0.1.0

## HyperChat

* Supports two installation methods: plugin market + native installation of MCP, quick installation and configuration through the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* Optimized WebDAV synchronization logic, backing up before synchronizing, synchronizing every 5 minutes
* Added testing function to LLM, testing whether it supports image input + tool calls (consuming a little token)
* Chat supports image input
* Chat supports displaying images returned from Tool Call MCP resources
* Fixed bugs

# 0.0.13

## HyperChat

* Optimized the startup speed of the MCP Server.
* WebDAV synchronization, currently does not support MCP configuration synchronization, operating system inconsistencies may cause issues.
* Supports setting request method, Stream | Complete
* Supports KaTeX for displaying mathematical formulas

## HyperTools

* Optimized the tool for opening webpages

# 0.0.11

## HyperChat

* Optimized Bot display, supports searching, drag-and-drop sorting
* Conversation records support filtering + searching
* For APIs that do not support counting token consumption of large models, such as Qianwen, supports fuzzy counting based on word count
* Input box supports dragging files for quick input of file paths
* My LLM Models list supports drag-and-drop sorting
* Supports quick configuration of Ollama, Qwen API models

## HyperTools

* Optimized the tool for opening webpages, extracting information more comprehensively. For example, answering this question `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`