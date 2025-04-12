[中文](ChangeLog.zh.md) | [English](ChangeLog.md)


# latest

* Supports displaying the MCP Server version number and name.
* Adds detailed error display when the model reports an error.
* Adds detailed error display when the MCP reports an error.
* Optimizes chat history storage by storing dialogue messages separately, reducing loading and syncing time.
* Modifies WebDav synchronization.
* Supports MCP in Claude Desktop configurations.
* Supports direct viewing of configuration files on the web.
* Supports keyboard shortcuts for MACOS `Alt+Cmd+I`   Windows `Ctrl+Shift+I` to open Developer Tools.
* Fixes bugs.

![image](https://github.com/user-attachments/assets/e00bb252-83a6-40ca-928a-3162859b0c27)
![image](https://github.com/user-attachments/assets/5378bba1-91f5-4d77-accf-544d9a09e909)
![image](https://github.com/user-attachments/assets/2b236af6-a0bc-453a-b08e-8f3627a5d392)
![image](https://github.com/user-attachments/assets/ca3cc911-bc6a-4560-aede-f34969190e91)


# 1.4.3
* Rewrites markdown rendering, optimizes `Artifacts`, supports opening and downloading from the browser, adds support for pre-release `Mermaid`.
* Modifies tool invocation display.
* Supports selecting multiple models for comparison in chat.

![image](https://github.com/user-attachments/assets/b4b88d6c-da7f-4822-8ca7-a79c3d02b6a5)
![image](https://github.com/user-attachments/assets/d1b54fb3-e0d6-4999-9c89-879c8c095ab6)
![71afe79bd956c2b9f83d73e7c038be70](https://github.com/user-attachments/assets/13e81223-d00f-4100-8128-19adc262ce83)
![a1520e5ed245419b28c68a58184e1a56](https://github.com/user-attachments/assets/940a971e-cdb1-4824-8391-292217e9c1af)




# 1.4.4

* Fixes the issue with the default conversation where the MCP setting becomes ineffective in the previous version.
* Fixes the issue where the Agent cannot modify the system prompt when not chatting.
* Fixes the error message with no LLM when opened for the first time.


# 1.4.1

* Fixes the bug where Gemini tool invocation does not support multiple tools.
* Supports selecting some Tools of MCP to save Tokens.
* Supports quick input with @ + invoking Agent.
* Fixes bugs.
![image](https://github.com/user-attachments/assets/63ae6853-5df4-4b29-8bc9-c33d99239833)
![image](https://github.com/user-attachments/assets/6010494f-1218-4714-bbfe-8e61969a6826)


# 1.4.0

* Adds built-in MCP tool command line.
* Supports modifying network access passwords.
* Collapses tool invocation display.
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* Can confirm when invoking tools and modify parameters for large model calls.
* Can click tools to invoke and test them.
* The knowledge base is planned for redevelopment, and its use is not currently recommended. You can use the OpenAI embedding model, and there's no need for a local embedding model.
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* Displays MCP loading progress, adds quick buttons.
* Optimizes mobile H5 display.
* Fixes bugs.
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* Supports asking when invoking tools ![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059).
* Supports displaying time in chat ![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96).
* Optimizes hypetool, settings ![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5).
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* Automatically obtains PATH for mac and linux, no need to input PATH anymore.
* Adds linux deb package.
* Fixes WebDav first synchronization error.
* Fixes bugs.


# 1.0.2

* Adds temperature setting.
* Fixes bugs.
* Supports pasting in the input box and uploading images.

# 0.2.0

* Adds knowledge base.


# 0.1.1

* Fixes MacOS image upload issues.
* Adds quick copy buttons, supports copying messages and code.
* Optimizes WebDav synchronization function, only saves the last 10 versions locally.
* Adds syntax highlighting for markdown code rendering.
* HTML Artifacts increases error capture, supports opening the Chrome console.


# 0.1.0

## HyperChat

* Supports two installation methods: plugin market and native MCP installation, quick installation and configuration via the plugin market, welcome to submit plugins, [Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP).
* Optimizes WebDav synchronization logic, backs up locally before syncing, syncs every 5 minutes.
* Adds testing function for LLM to check support for image input + tool invocation (consumes a little token).
* Chat supports inputting images.
* Chat supports displaying images returned from Tool Call as MCP resources.
* Fixes bugs.


# 0.0.13

## HyperChat

* Optimizes the startup speed of MCP Server.
* WebDav synchronization temporarily does not support MCP configuration synchronization; issues may arise due to operating system inconsistencies.
* Supports setting request methods, Stream | Complete.
* Supports KaTeX, displays mathematical formulas.

## HyperTools

* Optimizes opening web Tool.


# 0.0.11

## HyperChat

* Optimizes Bot display, supports search and drag-and-drop sorting.
* Chat history supports filtering and searching.
* For APIs that do not support counting token consumption for large models (e.g., Qianwen), supports fuzzy counting based on word count.
* The input box supports drag-and-drop file insertion for quick file path input.
* My LLM Models list supports drag-and-drop sorting.
* Supports quick configuration of Ollama and Qwen API models.

## HyperTools

* Optimizes opening web Tool, with better information extraction. For example, answer this question: `https://store.epicgames.com/zh-CN/   Which game is temporarily free?`