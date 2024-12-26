## 功能

支持 [MCP](https://modelcontextprotocol.io/introduction) 协议的Chat，使用类OpenAI的协议，兼容 `Claude Desktop` 配置文件。支持 `Client` 热加载，重启，禁用。

### MCP: 

[![Build](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml/badge.svg)](https://github.com/BigSweetPotatoStudio/HyperChat/actions/workflows/build.yml)

- [x] 🪟Windows+🍏MacOS
- [x] 支持 `nvm`, 看下面
- [x] Resources 支持
- [x] Prompts 部分支持
- [x] Tools 支持
- [x] 支持英文和中文
- [x] 添加了内置的MCP客户端`hypertools`, `fetch`+`search`
- [x] gpts-支持选择允许使用的MCP客户端和工具

### TODO:

- [ ] 更加简单使用
- [ ] 权限弹窗，是否允许
- [ ] 支持定时任务

### LLM

| LLM      | 好用度    | 备注                         |
| -------- | ------ | -------------------------- |
| claude   | ⭐⭐⭐⭐⭐  | 不解释                    |
| openai   | ⭐⭐⭐⭐🌙 | 也可以完美支持多步function call(gpt-4o-mini也可以) |
| 豆包       | ⭐⭐⭐    | 使用起来感觉还行                   |
| deepseek | ⭐⭐      | 多步function call会出问题       |

## 使用

* 1.需要配置你的OpenAI风格的APIKEY
* 2.确保您的系统中已安装 uvx 或 npx。

### [uvx](https://github.com/astral-sh/uv)

```
brew install uv
```
### [npx & nodejs](https://nodejs.org/en)

```
brew install node 
```

## 开发

```
cd electron && npm install
cd web && npm install
npm install
npm run dev
```


## 注意

* MacOS 遇到了已损坏或者权限问题， `sudo xattr -d com.apple.quarantine /Applications/HyperChat.app`
* MacOS `nvm` 用户 手动输入PATH `echo $PATH`, windows版本 `nvm` 好像可以直接使用

![image.png](./images/image4.png)



## Telegram

[HyperChat用户交流](https://t.me/dadigua001)

![image.png](./images/image11.png)

![image.png](./images/image13.png)

![image.png](./images/image32.png)

![image.png](./images/image31.png)

![image.png](./images/image22.png)

![image.png](./images/image21.png)

![image.png](./images/image30.png)