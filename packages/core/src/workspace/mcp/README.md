# 工作区 MCP 管理系统

这个模块实现了基于工作区的 MCP（模型上下文协议）管理系统，支持全局、工作区和内置三种范围的 MCP 服务器配置和管理。

## 特性

- **多范围支持**: 支持全局和工作区两种配置范围
- **MCP 类型区分**: 支持内置 (builtin) 和自定义 (custom) 两种 MCP 类型
- **动态启停**: 支持工作区 MCP 服务的动态启动和停止
- **配置隔离**: 不同工作区的 MCP 配置相互独立
- **优先级管理**: 全局 > 工作区的优先级顺序
- **自动重连**: 支持连接中断后的自动重连
- **状态监控**: 实时监控 MCP 客户端状态变化

## 架构

```
workspace/mcp/
├── types.mts          # 类型定义
├── client.mts         # 工作区 MCP 客户端实现
├── manager.mts        # MCP 管理器
├── init.mts           # 初始化脚本
├── index.mts          # 模块入口
└── README.md          # 说明文档
```

## 配置范围与类型

### 配置范围

#### 1. 全局范围 (global)
- 全局共享的 MCP 服务器配置
- 配置文件: `~/Documents/HyperChat/.hyperchat/mcp.json`
- 所有工作区都可以使用
- 包含内置服务器和用户自定义服务器

#### 2. 工作区范围 (workspace)
- 特定工作区的 MCP 服务器配置
- 配置文件: `{workspacePath}/.hyperchat/mcp.json`
- 仅在对应工作区内有效
- 通常为用户自定义服务器

### MCP 类型

#### 1. 内置类型 (builtin)
- 系统内置的 MCP 服务器
- 自动生成配置，不需要用户手动配置
- 存储在全局范围中，但类型标记为 builtin

#### 2. 自定义类型 (custom)
- 用户配置的 MCP 服务器
- 可以在全局或工作区范围中配置
- 需要用户手动添加和维护

## 使用方法

### 初始化系统

```typescript
import { initWorkspaceMCP } from './workspace/mcp';

// 初始化工作区 MCP 系统
await initWorkspaceMCP();
```

### 管理工作区 MCP

```typescript
import { startWorkspaceMCP, stopWorkspaceMCP } from './workspace/mcp';

// 启动工作区 MCP 服务
await startWorkspaceMCP('/path/to/workspace');

// 停止工作区 MCP 服务
await stopWorkspaceMCP('/path/to/workspace');
```

### 获取 MCP 客户端

```typescript
import { 
  getAllMCPClients, 
  getWorkspaceMCPClients, 
  getGlobalMCPClients,
  getBuiltinMCPClients 
} from './workspace/mcp';

// 获取所有客户端
const allClients = getAllMCPClients();

// 获取特定范围的客户端
const workspaceClients = getWorkspaceMCPClients('/path/to/workspace');
const globalClients = getGlobalMCPClients();
const builtinClients = getBuiltinMCPClients();
```

### 配置管理

```typescript
import { getMCPManager } from './workspace/mcp';

const manager = getMCPManager();

// 添加工作区 MCP 服务器
await manager.setServerConfig('my-server', {
  type: 'stdio',
  command: 'node',
  args: ['server.js']
}, 'workspace', '/path/to/workspace');

// 删除服务器配置
await manager.deleteServerConfig('my-server', 'workspace', '/path/to/workspace');
```

## 配置文件格式

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio|sse|streamableHttp",
      "command": "command-path",
      "args": ["arg1", "arg2"],
      "url": "http://localhost:3000",
      "headers": {},
      "env": {},
      "disabled": false
    }
  }
}
```

## 事件监听

```typescript
import { getMCPManager } from './workspace/mcp';

const manager = getMCPManager();

// 监听客户端状态变化
manager.events.onClientStatusChange = (client) => {
  console.log(`客户端 ${client.name} 状态变化: ${client.status}`);
};

// 监听配置更新
manager.events.onConfigUpdate = (config) => {
  console.log(`配置更新: ${config.scope} 范围`);
};

// 监听错误
manager.events.onError = (error, context) => {
  console.error('MCP 错误:', error, context);
};
```

## 迁移指南

这个新系统替代了原有的 `getMergedMcpConfig` 函数，提供了更强大和灵活的 MCP 管理功能：

### 原有方式
```typescript
// 原有的合并配置方式（已删除）
const config = await workspaceManager.getMergedMcpConfig(workspacePath);
```

### 新方式
```typescript
// 新的管理方式
const manager = getMCPManager();
await startWorkspaceMCP(workspacePath);
const clients = getWorkspaceMCPClients(workspacePath);
```

## 注意事项

1. **初始化顺序**: 确保在使用任何 MCP 功能前调用 `initWorkspaceMCP()`
2. **配置文件**: 配置文件会自动创建，无需手动创建
3. **错误处理**: 所有 MCP 操作都应该包含适当的错误处理
4. **资源清理**: 在应用退出时调用 `cleanupWorkspaceMCP()` 进行资源清理