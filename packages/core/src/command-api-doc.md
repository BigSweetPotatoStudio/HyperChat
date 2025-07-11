# Command.mts API 文档

## 概述
command.mts 是 HyperChat 后端的业务调度核心，封装了所有与前端交互的命令。通过 CommandFactory 类对外暴露方法，供主进程和 HTTP 服务调用。

## 已实现的功能

### 1. MCP (Model Context Protocol) 管理

#### 全局 MCP 管理
- ✅ `forceReloadMcpClients()` - 强制重新加载全局MCP配置
- ✅ `openMcpClient()` - 添加或启动全局MCP客户端（已废弃）
- ✅ `closeMcpClients()` - 管理全局MCP客户端生命周期（已废弃）

#### 工作区 MCP 管理
- ✅ `startWorkspaceMcpClient()` - 启动或重启工作区MCP客户端
- ✅ `manageWorkspaceMcpClient()` - 管理工作区MCP客户端（重启/禁用/删除）
- ✅ `startWorkspaceMcpClients()` - 启动工作区所有MCP服务
- ✅ `stopWorkspaceMcpClients()` - 停止工作区所有MCP服务
- ✅ `forceReloadWorkspaceMcpClients()` - 强制重新加载工作区MCP配置
- ✅ `setWorkspaceMcpServerConfig()` - 添加或更新工作区MCP服务器配置
- ✅ `deleteWorkspaceMcpServerConfig()` - 删除工作区MCP服务器配置
- ✅ `getWorkspaceMcpClients()` - 获取工作区MCP客户端列表

#### MCP 功能调用
- ✅ `mcpCallTool()` - 调用全局MCP客户端的工具函数
- ✅ `mcpCallToolWithWorkspace()` - 调用工作区MCP客户端的工具函数
- ✅ `mcpCallResource()` - 获取全局MCP客户端的资源内容
- ✅ `mcpCallResourceWithWorkspace()` - 获取工作区MCP客户端的资源内容
- ✅ `mcpCallPrompt()` - 调用全局MCP客户端的提示模板
- ✅ `mcpCallPromptWithWorkspace()` - 调用工作区MCP客户端的提示模板

### 2. 工作区管理

#### 基础操作
- ✅ `getWorkspaceList()` - 获取所有已知的工作区列表
- ✅ `openWorkspace()` - 打开已存在的工作区
- ✅ `createWorkspace()` - 创建或初始化新的工作区
- ✅ `deleteWorkspace()` - 删除指定的工作区
- ✅ `loadWorkspace()` - 加载已存在的工作区配置
- ✅ `getCurrentWorkspace()` - 获取已加载的工作区信息
- ✅ `getGlobalWorkspace()` - 获取全局工作区信息
- ✅ `closeWorkspace()` - 关闭工作区（停止MCP和终端）
- ✅ `getRunningWorkspaces()` - 获取运行中的工作区列表

#### 工作区查询
- ✅ `isWorkspaceDirectory()` - 检查目录是否为工作区
- ✅ `getWorkspaceFromDirectory()` - 从目录获取工作区

#### 文件系统操作
- ✅ `getWorkspaceFileTree()` - 获取工作区完整文件树（已废弃）
- ✅ `getWorkspaceDirectoryList()` - 获取工作区指定目录的子项（懒加载）
- ✅ `readWorkspaceFile()` - 读取工作区内指定文件
- ✅ `writeWorkspaceFile()` - 写入内容到工作区文件

#### 工作区设置
- ✅ `getWorkspaceSettings()` - 获取工作区设置
- ✅ `updateWorkspaceSettings()` - 更新工作区设置
- ✅ `resetWorkspaceSettings()` - 重置工作区设置
- ✅ `exportWorkspaceSettings()` - 导出工作区设置
- ✅ `importWorkspaceSettings()` - 导入工作区设置

### 3. Agent 管理

#### Agent CRUD
- ✅ `createAgent()` - 创建新的 Agent
- ✅ `getWorkspaceAgentList()` - 获取工作区中的所有 Agent
- ✅ `getWorkspaceAgentsSummary()` - 获取工作区 Agent 摘要信息
- ✅ `getAgent()` - 获取指定 Agent 的配置
- ✅ `updateAgent()` - 更新 Agent 配置
- ✅ `deleteAgent()` - 删除 Agent

#### Agent 聊天记录
- ✅ `getAgentChatLogs()` - 获取 Agent 的聊天记录列表
- ✅ `getAgentChatLog()` - 获取单个聊天记录
- ✅ `saveAgentChatLog()` - 保存 Agent 聊天记录
- ✅ `deleteAgentChatLog()` - 删除指定聊天记录
- ✅ `clearAgentChatLogs()` - 清空所有聊天记录

### 4. 应用设置管理
- ✅ `getAppSettings()` - 获取应用设置
- ✅ `updateAppSettings()` - 更新应用设置
- ✅ `resetAppSettings()` - 重置应用设置
- ✅ `exportAppSettings()` - 导出应用设置
- ✅ `importAppSettings()` - 导入应用设置

### 5. 文件系统操作
- ✅ `getAppDataDir()` - 获取应用数据目录路径
- ✅ `readDir()` - 读取目录内容
- ✅ `removeFile()` - 删除文件或目录
- ✅ `writeFile()` - 写入文本文件
- ✅ `readFile()` - 读取文本文件
- ✅ `readJSON()` - 读取JSON文件
- ✅ `writeJSON()` - 写入JSON文件
- ✅ `exists()` - 检查文件存在性
- ✅ `pathJoin()` - 拼接路径并确保父目录存在
- ✅ `processedFilePath()` - 生成处理后的文件路径

### 6. 服务器文件浏览
- ✅ `listServerDirectory()` - 列出服务器目录内容
- ✅ `getServerCurrentDirectory()` - 获取服务器当前工作目录
- ✅ `getServerParentDirectory()` - 获取服务器路径的父目录
- ✅ `checkServerPath()` - 检查服务器路径是否存在

### 7. 终端管理
- ✅ `OpenTerminal()` - 打开新终端
- ✅ `GetTerminals()` - 获取工作区所有终端
- ✅ `CloseTerminal()` - 关闭终端
- ✅ `ActiveAITerminal()` - 激活AI终端

### 8. 工具函数
- ✅ `getLocalIP()` - 获取本地IP地址
- ✅ `isPortUse()` - 检查端口是否被占用
- ✅ `saveTempFile()` - 保存临时文件
- ✅ `runCode()` - 在VM中运行代码
- ✅ `refreshMcpRoutes()` - 刷新MCP网关路由

### 9. 任务管理（部分注释）
- ⚠️ `checkTask()` - 检查任务cron表达式
- ❌ `startTask()` - 启动任务（已注释）
- ❌ `stopTask()` - 停止任务（已注释）
- ❌ `runTask()` - 运行任务（已注释）
- ❌ `callAgent()` - 调用Agent（已注释）

### 10. 向量存储（已注释）
- ❌ `vectorStoreAdd()` - 向量存储添加（已注释）
- ❌ `vectorStoreDelete()` - 向量存储删除（已注释）
- ❌ `vectorStoreRemoveResource()` - 向量存储移除资源（已注释）
- ❌ `vectorStoreSearch()` - 向量存储搜索（已注释）

## 缺失的功能

### 1. 工作区启动功能 ⭐
当前只有创建、加载、关闭工作区，缺少明确的"启动工作区"功能：
```typescript
// 建议添加
async startWorkspace({ workspacePath }: { workspacePath: string }) {
  // 1. 加载工作区配置
  // 2. 启动该工作区的所有MCP客户端
  // 3. 初始化工作区的终端管理器
  // 4. 恢复工作区状态
}
```

### 2. 工作区状态管理 ⭐
缺少工作区的状态持久化和恢复：
```typescript
// 建议添加
async saveWorkspaceState({ workspacePath }: { workspacePath: string }) {
  // 保存工作区当前状态（打开的文件、终端、配置等）
}

async restoreWorkspaceState({ workspacePath }: { workspacePath: string }) {
  // 恢复工作区之前的状态
}
```

### 3. 批量操作
缺少批量管理功能：
```typescript
// 建议添加
async startAllWorkspaceMcpClients() {
  // 启动所有工作区的MCP客户端
}

async stopAllMcpClients() {
  // 停止所有MCP客户端（包括全局和所有工作区）
}
```

### 4. MCP 客户端健康检查
缺少MCP客户端的健康检查和自动重连：
```typescript
// 建议添加
async checkMcpClientHealth({ clientName, workspacePath }: { 
  clientName: string, 
  workspacePath?: string 
}) {
  // 检查MCP客户端健康状态
}

async enableMcpAutoReconnect({ clientName, workspacePath }: { 
  clientName: string, 
  workspacePath?: string 
}) {
  // 启用自动重连
}
```

### 5. 工作区切换
缺少工作区切换的便捷方法：
```typescript
// 建议添加
async switchWorkspace({ fromWorkspace, toWorkspace }: { 
  fromWorkspace: string, 
  toWorkspace: string 
}) {
  // 1. 保存当前工作区状态
  // 2. 关闭当前工作区
  // 3. 启动新工作区
  // 4. 恢复新工作区状态
}
```

### 6. 工作区模板
缺少工作区模板功能：
```typescript
// 建议添加
async createWorkspaceFromTemplate({ 
  workspacePath, 
  templateName 
}: { 
  workspacePath: string, 
  templateName: string 
}) {
  // 从预定义模板创建工作区
}

async saveWorkspaceAsTemplate({ 
  workspacePath, 
  templateName 
}: { 
  workspacePath: string, 
  templateName: string 
}) {
  // 将当前工作区保存为模板
}
```

### 7. 工作区同步
缺少工作区配置同步功能：
```typescript
// 建议添加
async syncWorkspaceConfig({ 
  workspacePath, 
  remotePath 
}: { 
  workspacePath: string, 
  remotePath: string 
}) {
  // 同步工作区配置到远程
}
```

### 8. Agent 相关功能
- Agent 导入/导出功能
- Agent 版本管理
- Agent 权限管理
- Agent 使用统计

### 9. 事件和钩子
缺少工作区和MCP的事件系统：
```typescript
// 建议添加
async onWorkspaceStart(callback: Function) {
  // 工作区启动事件
}

async onMcpClientConnect(callback: Function) {
  // MCP客户端连接事件
}
```

### 10. 调试和诊断
缺少调试相关功能：
```typescript
// 建议添加
async getMcpClientLogs({ clientName, workspacePath }: { 
  clientName: string, 
  workspacePath?: string 
}) {
  // 获取MCP客户端日志
}

async getWorkspaceDiagnostics({ workspacePath }: { 
  workspacePath: string 
}) {
  // 获取工作区诊断信息
}
```

## 总结

Command.mts 已经实现了大部分核心功能，但在以下方面还可以增强：

1. **工作区生命周期管理** - 需要更完整的启动、停止、切换流程
2. **状态持久化** - 工作区和MCP客户端的状态保存和恢复
3. **批量操作** - 提高管理效率
4. **健康监控** - MCP客户端和工作区的健康检查
5. **事件系统** - 更好的扩展性和集成能力
6. **调试支持** - 便于问题诊断和开发

这些功能将使 HyperChat 成为更加完善和专业的开发工具。