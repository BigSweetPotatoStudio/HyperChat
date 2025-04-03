# 1.4.1

* 修复Gemini工具调用，不支持多工具的的bug
* 支持选择MCP的部分Tool，更加省Token
* 支持 @ 快速输入 + 调用Agent
* fixbug


# 1.4.0

* 添加内置mcp工具 命令行
* 支持修改网络访问密码
* 工具调用折叠显示
  
![8af53675c625ca34cfc4753a106e9462](https://github.com/user-attachments/assets/ef030a65-ba9e-4cd5-9ca8-669677b483be)
![image](https://github.com/user-attachments/assets/af1598b6-d912-4f04-8919-a3d3e1ed93bc)

# 1.3.3

* 可以在调用工具的时候，是否确认，并且修改大模型调用的参数
* 可以点击工具，调用工具做测试。
* 知识库打算重新开发，目前不建议使用，可以使用openai的embedding模型，不搞本地embedding模型了
![886a04f531ca15ef1f6e93ea8403c0b7](https://github.com/user-attachments/assets/7c6eb1d4-7ba1-430b-8fca-18023f7dadd3)
![image](https://github.com/user-attachments/assets/fc87b507-8427-4157-a0f9-78d141299151)


# 1.2.15

* mcp加载进度显示，添加快捷按钮
* 优化手机h5显示
* fixbug
![image](https://github.com/user-attachments/assets/1c60e98f-f57b-4a38-9464-c7548c09cc3c)
![image](https://github.com/user-attachments/assets/d8ba028d-d091-40f3-82bb-40e6f6ba10de)
![image](https://github.com/user-attachments/assets/f53652cd-07f4-4f98-89d5-865213dc3fb5)


# 1.2.12

* 支持调用工具时询问![image](https://github.com/user-attachments/assets/11c03c92-399e-457e-8000-ff00c3c1e059)
* 聊天支持显示时间![image](https://github.com/user-attachments/assets/dba7bf09-99a1-46bd-9c94-052d18469b96)
* hypetool优化，设置![image](https://github.com/user-attachments/assets/cfc2c8e5-f7e7-4078-aaff-240b567f47c5)
* Add historyFilterType hover tip by @xtyuns in https://github.com/BigSweetPotatoStudio/HyperChat/pull/52



# 1.2.2

* mac ,linux 自动获取PATH，不用输入PATH了。
* 添加 linux deb包
* fix WebDav 第一次同步报错
* fixbug


# 1.0.2

* 增加设定temperature
* 修复bug
* 支持输入框粘贴，上传图片

# 0.2.0

* 添加知识库


# 0.1.1

* fix MacOS 图片上传
* 添加快速复制的按钮，支持复制消息和代码的按钮
* WebDav同步功能优化，本地只保存10个版本
* markdown 代码Code渲染增加高亮
* HTML Artifacts 增加错误捕获，支持打开Chrome的控制台



# 0.1.0

## HyperChat

* 支持插件市场+MCP原生安装两种，插件市场快速安装和配置，欢迎提交插件，[Github](https://github.com/BigSweetPotatoStudio/HyperChatMCP)
* WebDav 同步逻辑优化，本地会先备份再同步，5min同步一次
* LLM 添加测试功能，测试是否支持图片输入 + 工具调用（消耗一点点token）
* Chat支持输入图片
* Chat支持显示Tool Call 返回的图片MCP资源
* fix bugs




# 0.0.13

## HyperChat

* 优化了，MCP Server的启动速度。
* WebDav 同步, 暂时不支持MCP配置同步，操作系统不一致，可能会出现问题。
* 支持设置请求方式，Stream | Complete
* 支持KaTeX，显示数学公式

## HyperTools

* 优化了，打开网页的Tool



# 0.0.11

## HyperChat

* Bot显示优化，支持搜索，拖拽排序
* 对话记录支持过滤+搜索
* 对于不支持统计大模型的消耗token的API，如千问，支持用字数模糊统计
* 输入框支持 拖拽文件快速输入文件路径
* My LLM Models列表支持拖拽排序
* 支持快速配置Ollama, Qwen的API模型

## HyperTools

* 优化了，打开网页的Tool, 更完善的提取信息。如回答这个问题 `https://store.epicgames.com/zh-CN/   哪个游戏是限时免费的？`
