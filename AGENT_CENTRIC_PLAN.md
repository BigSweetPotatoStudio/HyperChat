# Agent中心架构改造计划

## 📋 项目概述

将HyperChat从"工作区中心"架构调整为"Agent中心"架构，让每个Agent成为完全自包含的AI应用，为未来的Agent Creator项目奠定基础。

## 🎯 核心目标

- **简化概念**：用户只需理解Agent，工作区仅作为Agent发现路径
- **完全自包含**：每个Agent拥有自己的MCP工具和任务配置
- **零破坏性改动**：保持现有用户体验，无需数据迁移
- **向前兼容**：为Agent Creator和Agent分发功能打基础

## 🏗️ 架构调整

### 当前架构
```
.hyperchat/
├── mcp.json              # 工作区级MCP配置
├── tasks/                # 工作区级任务
│   ├── task1.yaml
│   └── task2.yaml
└── agents/               # Agent集合
    ├── agent1/
    │   ├── agent.yaml
    │   ├── memory.md
    │   └── chatlogs/
    └── agent2/
        └── ...
```

### 目标架构
```
.hyperchat/
└── agents/               # 工作区 = Agent发现路径
    ├── agent1/
    │   ├── agent.yaml    # Agent配置
    │   ├── memory.md     # Agent记忆
    │   ├── chatlogs/     # 聊天记录
    │   ├── mcp.json      # Agent专属MCP配置 (新增)
    │   └── tasks/        # Agent专属任务 (新增)
    │       ├── task1.yaml
    │       └── task2.yaml
    └── agent2/
        └── ...
```

## 📋 实施计划

### Phase 1: 扩展Agent内部资源管理 (1-2周)

#### 1.1 扩展AgentConfig Schema
- 文件: `packages/shared/src/zodSchemas/agentConfigSchema.mts`
- 更新Agent目录结构，支持mcp.json和tasks/目录
- 保持向后兼容

#### 1.2 扩展AgentInstance类
- 文件: `packages/core/src/data/managers/agentManager.mts`
- 新增MCP配置管理方法
- 新增任务管理方法
- 支持Agent内部资源文件读写

#### 1.3 更新Agent目录结构
- 支持Agent目录下的`mcp.json`和`tasks/`目录
- 实现懒加载和按需创建

### Phase 2: 调整工作区管理逻辑 (1周)

#### 2.1 简化WorkspaceManager
- 文件: `packages/core/src/workspace/workspace.mts`
- 移除工作区级MCP和任务管理
- 保留Agent发现和统一管理功能

#### 2.2 更新初始化逻辑
- 工作区初始化时不再创建全局MCP和任务配置
- Agent创建时自动创建专属资源目录

### Phase 3: 前端界面适配 (1周)

#### 3.1 Agent管理界面调整
- 文件: `packages/web/src/components/AgentManagement/`
- 在Agent详情中显示专属MCP和任务配置
- 支持Agent级别的资源管理

#### 3.2 工作区界面简化
- 移除工作区级MCP和任务管理界面
- 保留Agent列表和统计信息

### Phase 4: CLI命令适配 (几天)

#### 4.1 更新Agent相关命令
- 文件: `packages/core/src/cli/commands/agent.mts`
- 支持Agent级MCP和任务管理
- 新增Agent资源配置命令

#### 4.2 简化工作区命令
- 移除工作区级资源管理命令
- 保留Agent发现和列表功能

### Phase 5: 测试和文档更新 (1周)

#### 5.1 功能测试
- 验证Agent创建和资源管理
- 验证现有Agent的兼容性
- 性能测试

#### 5.2 文档更新
- 更新CLAUDE.md中的架构说明
- 更新用户使用文档
- 添加新功能的使用示例

## 🔧 核心实现细节

### 新的AgentConfig结构
```typescript
interface AgentConfig {
  // 现有字段保持不变
  name: string;
  description?: string;
  tags: string[];
  subAgents: string[];
  version: number;
  
  // 继承现有AI配置
  prompt: string;
  temperature?: number;
  maxTokens: number;
  modelKey?: string;
  // ... 其他AI配置
  
  // 资源配置将存储在独立文件中，不在这里定义
  // mcp.json - Agent专属MCP配置
  // tasks/ - Agent专属任务目录
}
```

### Agent资源管理API
```typescript
class AgentInstance {
  // 现有方法保持不变
  
  // 新增MCP管理
  async getMCPConfig(): Promise<MCPConfig | null>;
  async updateMCPConfig(config: MCPConfig): Promise<void>;
  async hasMCPConfig(): Promise<boolean>;
  
  // 新增任务管理
  async getTasks(): Promise<Task[]>;
  async addTask(task: Task): Promise<void>;
  async updateTask(taskId: string, task: Task): Promise<void>;
  async deleteTask(taskId: string): Promise<void>;
  
  // 资源路径方法
  getMCPConfigPath(): string;
  getTasksPath(): string;
}
```

### 工作区管理简化
```typescript
class Workspace {
  // 保留现有核心功能
  async initialize(): Promise<void>;
  async start(): Promise<void>;
  
  // 简化资源管理 - 只负责Agent发现
  getAgents(): Map<string, AgentInstance>;
  async createAgent(name: string, config: AgentConfig): Promise<AgentInstance>;
  
  // 移除工作区级资源管理方法
  // getMCPManager() - 删除
  // getTaskManager() - 删除
}
```

## ✅ 成功标准

1. **功能完整性**：所有现有功能正常工作
2. **零破坏性**：现有用户无需任何操作即可使用
3. **Agent独立性**：每个Agent可以独立配置MCP和任务
4. **代码简洁性**：移除工作区级资源管理代码
5. **向前兼容**：支持未来的Agent Creator集成

## 🚀 预期收益

1. **概念简化**：用户只需理解Agent概念
2. **Agent完全自包含**：便于分享、备份、迁移
3. **为Agent Creator铺路**：Agent即应用的理念
4. **代码简化**：减少工作区级别的复杂性
5. **更好的隔离性**：Agent之间完全独立

## 📝 注意事项

1. **兼容性保证**：现有Agent必须能无缝升级
2. **性能考虑**：Agent数量增多时的资源管理
3. **文件组织**：保持清晰的目录结构
4. **错误处理**：资源文件缺失或损坏的处理
5. **测试覆盖**：确保所有场景都有测试覆盖

## 🔄 回滚计划

如果改造过程中遇到问题，可以通过以下方式回滚：

1. **代码回滚**：回到`dev2`分支
2. **配置保持**：Agent内部资源配置可以保留
3. **功能降级**：临时禁用Agent级资源管理功能
4. **数据安全**：所有改动都是增量的，不会丢失现有数据

---

**开始时间**: 2024-07-24  
**预期完成**: 2024-08-15  
**负责人**: 开发团队  
**分支**: `feature/agent-centric-architecture`