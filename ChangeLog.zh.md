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