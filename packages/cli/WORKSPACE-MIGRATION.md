# 工作区启动逻辑迁移说明

## 📋 迁移概述

将工作区启动逻辑从 `packages/core` 迁移到 `packages/cli`，实现更清晰的职责分离。

## 🏗️ 架构变化

### 迁移前（Core 负责启动）
```
main.mts → first.mts → workspace/index.mts → WorkspaceManager构造 → 
全局工作区自动初始化 → MCP自动启动
```

### 迁移后（CLI 负责启动）
```
CLI启动 → CLIWorkspaceManager.initialize() → 智能工作区选择 → 
按需加载工作区 → 按需启动MCP
```

## 📁 新增文件

### 1. CLI 工作区管理器
**文件**: `packages/cli/src/workspace/cli-workspace-manager.mts`

**功能**:
- ✅ 智能工作区选择（当前目录 > 全局工作区）
- ✅ 工作区切换和状态管理
- ✅ MCP 客户端生命周期管理
- ✅ CLI 退出时的清理

**核心方法**:
```typescript
class CLIWorkspaceManager {
  async initialize()                    // CLI启动时初始化
  async switchWorkspace(path)           // 工作区切换
  async cleanup()                       // 退出清理
  getCurrentWorkspace()                 // 获取当前状态
  async reloadMcpClients()             // 重新加载MCP
}
```

## 📝 修改的文件

### 1. CLI 主入口
**文件**: `packages/cli/src/index.mts`
- ✅ 添加全局退出处理和清理逻辑
- ✅ 新增 `workspace current` 命令
- ✅ 更新帮助信息

### 2. 聊天命令
**文件**: `packages/cli/src/commands/chat.mts`
- ✅ 使用 `ensureWorkspaceInitialized()` 替代手动检测
- ✅ 集成CLI工作区管理器

### 3. 工作区命令
**文件**: `packages/cli/src/commands/workspace.mts`
- ✅ 使用 `ensureWorkspaceInitialized()` 获取当前工作区
- ✅ `switchWorkspace()` 使用CLI工作区管理器

### 4. Agent命令
**文件**: `packages/cli/src/commands/agent.mts`
- ✅ 使用 `ensureWorkspaceInitialized()` 获取当前工作区

## 🚀 新增功能

### 1. 智能工作区选择
```bash
# 在项目目录中（有.hyperchat/）
cd /path/to/my-project
hyperchat chat  # 自动使用项目工作区

# 在其他目录中  
cd /home/user
hyperchat chat  # 自动使用全局工作区
```

### 2. 工作区查看
```bash
hyperchat workspace current          # 显示当前工作区信息
hyperchat workspace info /path      # 查看指定工作区信息
hyperchat chat --workspace /path    # 临时使用指定工作区
```

### 3. 生命周期管理
- ✅ CLI启动时按需初始化工作区
- ✅ CLI退出时自动清理资源
- ✅ 每次运行时重新检测当前目录工作区

## 🔧 核心变化说明

### 1. Core包职责（保持不变）
```typescript
// Core只提供API，不包含启动逻辑
Command.loadWorkspace()               // 加载工作区
Command.startWorkspaceMcpClients()    // 启动MCP
Command.stopWorkspaceMcpClients()     // 停止MCP
Command.getWorkspaceMcpClients()      // 获取MCP状态
```

### 2. CLI包新增职责
```typescript
// CLI负责应用级启动逻辑
CLIWorkspaceManager.initialize()      // 决定启动哪个工作区
CLIWorkspaceManager.switchWorkspace() // 编排切换流程
CLIWorkspaceManager.cleanup()         // 退出清理
```

### 3. 智能选择逻辑
```typescript
async detectWorkspace(): Promise<string> {
  // 1. 检查当前目录是否有.hyperchat
  if (existsSync(join(process.cwd(), '.hyperchat'))) {
    return process.cwd();  // 使用项目工作区
  }
  
  // 2. 回退到全局工作区
  const global = await Command.getGlobalWorkspace();
  return global.path;
}
```

## ⚠️ Core包需要的修改

### 1. 移除自动启动逻辑
需要在Core包中移除以下自动启动代码：

**文件**: `packages/core/src/workspace/workspaceManager.mts`
```typescript
// ❌ 需要移除
constructor() {
  this.globalWorkspace = new Workspace(CONSTANTS.GLOBAL_PATH);
  this.initGlobalWorkspace(); // 自动初始化
}

// ❌ 需要移除
private async initGlobalWorkspace(): Promise<void> {
  await this.globalWorkspace.init(); // 自动启动
}
```

**修改为**:
```typescript
// ✅ 只创建实例，不自动启动
constructor() {
  this.globalWorkspace = new Workspace(CONSTANTS.GLOBAL_PATH);
  // 不再自动初始化
}

// ✅ 改为按需初始化方法
async ensureGlobalWorkspaceInitialized(): Promise<void> {
  if (!this.globalWorkspace.isInitialized()) {
    await this.globalWorkspace.init();
  }
}
```

### 2. 添加初始化状态检查
**文件**: `packages/core/src/workspace/workspace.mts`
```typescript
class Workspace {
  private initialized = false;
  
  async init(): Promise<void> {
    if (this.initialized) return;
    // ... 现有初始化逻辑
    this.initialized = true;
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
}
```

## 📊 迁移效果

### 优势
1. **职责清晰**: Core提供能力，CLI负责应用逻辑
2. **按需启动**: 只启动真正需要的工作区
3. **智能选择**: 自动检测当前目录工作区
4. **生命周期**: 完整的启动、切换、清理流程
5. **扩展性**: 不同前端可以有不同的启动策略

### 性能提升
- ❌ 之前：总是启动全局工作区 + 所有MCP
- ✅ 现在：按需启动相关工作区 + 相关MCP

### 用户体验提升
- ❌ 之前：必须手动指定工作区
- ✅ 现在：自动检测并使用合适的工作区

## 🧪 测试建议

### 1. 基础功能测试
```bash
# 测试智能工作区选择
cd /path/to/project-with-hyperchat
hyperchat workspace current

cd /path/to/normal-directory  
hyperchat workspace current

# 测试工作区切换
hyperchat workspace switch /other/workspace
hyperchat workspace current
```

### 2. MCP集成测试
```bash
# 测试MCP启动
hyperchat chat "列出当前目录文件"  # 应该能调用MCP工具

# 测试工作区切换后MCP
hyperchat workspace switch /other/workspace
hyperchat chat "列出当前目录文件"  # 应该使用新工作区的MCP
```

### 3. 清理测试
```bash
# 测试正常退出
hyperchat chat
# 输入 /exit

# 测试Ctrl+C
hyperchat chat
# 按 Ctrl+C
```

## 🎯 下一步

1. **完成Core包修改** - 移除自动启动逻辑
2. **测试迁移** - 验证所有功能正常
3. **更新文档** - 更新用户文档和开发文档
4. **Web前端适配** - Web前端可能需要类似的管理器

这样的迁移将让HyperChat的架构更加清晰和灵活！