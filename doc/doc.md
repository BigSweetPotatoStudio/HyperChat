
这个项目在3个月前就开始开发了，去年`Claude`才出MCP协议的时候，我就觉这个很厉害，就搞了这个开源项目（当时`Claude`账号也被封了），目标是最佳的Chat体验+实现AI生产力。

介绍一个下个这个Chat项目的核心吧：在实现这个Chat调用MCP工具这个方面，我这个项目应该是最早的，我理解的 `Agent =智能(大模型)+Tool+记忆`。所以这样才能帮人完成任务 `Task` 来实现生产力，这个软件也是贯彻这思想。

1. HyperChat添加Agent时候，支持选择MCP Tool，通过系统提示词，定义Agent![image](https://github.com/user-attachments/assets/3fa6ec84-7e29-4df1-a149-3f672332629d)
2. 支持添加Task，定时通过发送消息的方式，调用Agent完成任务，同时支持Web Api方式调用 ![image](https://github.com/user-attachments/assets/de5328f9-3b7c-483d-956f-c76aebd564cd)
3. 支持Agent Call Agent，把Agent看做一个智能体，同时通过内置的MCP，通过发消息的方式，调用另一个Agent(比如，这个4o-mini，本来答不对9.8和9.11的，但是，我要他call `Gemini Think` Agent回答，他就会了。) ![image](https://github.com/user-attachments/assets/4201af2d-8fe2-427a-8ca4-a25595fc2aa8)

这就是这个软件是核心了，虽然他是一个Chat软件，但是核心是Agent，创建Agent和它聊天+调用工具，甚至他们可以相互Call。ps:我上面说的`Agent =智能(大模型)+Tool+记忆`，还有记忆没有很好的解决，目前没啥好用的办法，RAG的知识库实在是不咋地，以后会关注技术进步。


HyperChat特点
1. 一切皆MCP的概念，内置了4个常用的MCP，把知识库封装成MCP，别的应该没这么搞
	- 常用工具（网页+谷歌+Bing搜索+获取时间）
	- 知识库，（使用那个知识库都可以让大模型选择，还可以让它把内容添加到知识库）
	- Agent相关 （支持Call Agent，新建Task)
	- 命令行 (命令行MCP，为什么内置？这个mcp很难安装，你可以让他执行命令 or ssh，很好用)![image](https://github.com/user-attachments/assets/954c6eaf-7c38-47de-bccd-a89dc48ef438)

2. 基于Web，可以脱离electron，可以用命令行运行`npx -y @dadigua/hyper-chat`，或者docker。
   - 支持了H5适配，可以端口映射，通过Web在任何设备访问，包括手机。
   - 可设置访问密码，安全访问。
   - 可以通过Web接口调用软件的功能，比如，你可以把它当成一个MCP Tool网关
  
3. 极致的Chat理念，现在其他的Chat软件输入框一大堆按钮，我总是感觉这样不太对劲，比如连个网搜索，还要点一下联网搜索按钮，首先我认为应该是模型决定回答这个问题是不是要联网么，这里我把搜索封装一个MCP工具，让模型决定是否调用工具，如何模型决定错了，我加上提示词让他记得使用工具。`就像龙珠里面许愿一样，发送消息就够了。`所以这里我想到了必须支持快速输入提示词，HyperChat通过一个@，可以快速输入Agent名称+快速输入短语，完成提示词 ![image](https://github.com/user-attachments/assets/0b42b361-a85e-40b3-9604-37b67be59f13)![image](https://github.com/user-attachments/assets/2a38f7bc-41fe-4360-bc74-aabddbdc73de)


