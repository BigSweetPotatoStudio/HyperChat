# @hyperchat/electron

HyperChat 的 Electron 主进程和相关功能包。

## 概述

这个包包含了所有与 Electron 相关的代码，从 `@hyperchat/core` 中分离出来，使得 core 包只包含 Node.js 相关的代码。

## 目录结构

```
src/
├── main.ts                     # Electron 主进程入口
├── preload.ts                  # 预加载脚本
├── index.ts                    # 包的主入口
├── window/
│   └── mainWindow.ts          # 主窗口管理
├── polyfills/
│   ├── index.ts               # Polyfills 入口
│   ├── electron.ts            # Electron 环境的 polyfills
│   └── electron_autoupdate.ts # 自动更新功能
└── mcp/
    └── servers/
        └── hyper_tools/
            └── electron.ts     # Electron 环境的 MCP 工具服务器
```

## 主要功能

### 主进程 (main.ts)
- 初始化 Electron 应用和主窗口
- 启动 HTTP 服务器和 WebSocket 连接
- 处理 IPC 通信（渲染进程与主进程间通信）
- 管理应用生命周期事件
- 注册自定义协议处理器

### 窗口管理 (window/mainWindow.ts)
- 设置窗口大小、标题、图标、菜单等
- 配置 webview、预加载脚本、沙箱等安全参数
- 支持多平台窗口特性和自定义行为
- 依赖 electronData 进行窗口状态持久化

### Polyfills
- **electron.ts**: Electron 环境的日志记录、自动启动等功能实现
- **electron_autoupdate.ts**: 基于 electron-updater 的自动更新功能

### MCP 服务器
- **electron.ts**: Electron 环境下的 MCP 工具实现，支持 web1 和 web2 两种抓取方式

## 构建

```bash
# 开发模式构建
npm run dev

# 生产模式构建
npm run build

# 启动 Electron 应用
npm run start
```

## 与 Core 包的关系

- `@hyperchat/electron` 依赖 `@hyperchat/core` 提供的基础功能
- `@hyperchat/core` 现在只包含 Node.js 环境相关的代码
- Electron 特有的功能（如窗口管理、自动更新、特定的 MCP 工具）都在这个包中实现

## 环境变量

- `use_electron=1`: 标识当前运行在 Electron 环境中
- `runtime=electron`: 运行时类型标识
- `myEnv`: 开发/生产环境标识