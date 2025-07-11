# HyperChat CLI

强大的 AI 助手命令行工具，提供类似 Claude Code 的命令行体验。

## 功能特性

- 🤖 **交互式 AI 聊天** - 直接在终端中与 AI 对话
- 📁 **工作区管理** - 管理多个项目工作区
- 🛠️ **代理管理** - 创建和管理 AI 代理
- 🖥️ **服务器管理** - 启动和管理 HyperChat 服务器
- ⚙️ **配置管理** - 灵活的配置选项

## 快速开始

### 安装

```bash
# 通过 npm 安装
npm install -g @hyperchat/cli

# 或者使用 pnpm
pnpm add -g @hyperchat/cli
```

### 基本使用

```bash
# 开始聊天（默认命令）
hyperchat "你好，我需要帮助"

# 启动服务器并打开 Web 界面
hyperchat --web

# 或者直接运行进入交互模式
hyperchat

# 使用简短命令
hc "帮我写一个 Python 脚本"
```

## 主要命令

### 聊天命令

```bash
# 开始聊天会话
hyperchat chat "你的问题"

# 指定 AI 代理
hyperchat chat -a my-agent "你的问题"

# 指定工作区
hyperchat chat -w /path/to/workspace "你的问题"

# 指定模型
hyperchat chat -m gpt-4 "你的问题"
```

### 服务器管理

```bash
# 启动本地服务器
hyperchat server start

# 启动服务器并打开 Web 界面
hyperchat server start --web

# 启动服务器并打开 Web 界面（简化命令）
hyperchat --web

# 查看服务器状态
hyperchat server status

# 停止服务器
hyperchat server stop
```

### 工作区管理

```bash
# 列出所有工作区
hyperchat workspace list

# 创建新工作区
hyperchat workspace create /path/to/project

# 切换工作区
hyperchat workspace switch /path/to/project
```

### 代理管理

```bash
# 列出所有代理
hyperchat agent list

# 创建新代理
hyperchat agent create my-agent
```

### 配置管理

```bash
# 获取配置
hyperchat config get api-key

# 设置配置
hyperchat config set api-key your-key
```

## 交互命令

在聊天模式中，你可以使用以下命令：

- `/help` - 显示帮助信息
- `/exit` - 退出聊天
- `/clear` - 清屏
- `/status` - 显示服务器状态
- `/agents` - 显示可用代理
- `/workspaces` - 显示工作区

## 全局选项

```bash
# 启动服务器并打开 Web 界面
hyperchat --web

# 显示详细日志
hyperchat --verbose server start

# 静默模式
hyperchat --quiet server status

# 组合使用选项
hyperchat --web --verbose
```

## 配置文件

CLI 会在以下位置查找配置文件：

- `~/.hyperchat/config.json` - 全局配置
- `./hyperchat.config.json` - 项目配置

示例配置：

```json
{
  "defaultAgent": "my-agent",
  "defaultModel": "gpt-4",
  "server": {
    "host": "localhost",
    "port": 16102,
    "password": "your-password"
  }
}
```

## 开发

```bash
# 克隆项目
git clone https://github.com/your-repo/HyperChat.git
cd HyperChat/packages/cli

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

## 许可证

MIT License