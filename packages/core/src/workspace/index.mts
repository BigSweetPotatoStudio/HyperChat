// 导出常量
export { CONSTANTS } from "./constants.mjs";

// 导出类型定义
export type {
  AgentConfig,
  Agent,
  ChatHistoryItem,
  MCPServerConfig,
  IMCPClient,
  WorkspaceConfig,
  WorkspaceSettings,
  WorkspaceFileNode
} from "./types.mjs";

export {
  validateWorkspaceConfig,
  validateWorkspaceSettings
} from "./types.mjs";

// 导出数据列表管理类
export { DataList } from "./dataList.mjs";

// 导出 Agent 管理相关类
export { AgentInstance, AgentManager } from "./agentManager.mjs";

// 导出工作区类
export { Workspace } from "./workspace.mjs";

// 导出工作区管理器
export { WorkspaceManager } from "./workspaceManager.mjs";

// 导出数据管理类
export { Data } from "./data.mjs";

// 导出 MCP 相关模块
export {
  WorkspaceMCPManager,
  WorkspaceMCPClientImpl,
  getMCPManager,
  initMCPManager,
  destroyMCPManager,
  startWorkspaceMCP,
  stopWorkspaceMCP,
  getWorkspaceMCPClients,
  initWorkspaceMCP,
  isWorkspaceMCPInitialized,
  restartWorkspaceMCP,
  cleanupWorkspaceMCP,
} from "./mcp/index.mjs";

export type {
  WorkspaceMCPConfig,
  WorkspaceMCPClient,
  MCPType,
  MCPManagerOptions,
  MCPManagerEvents,
} from "./mcp/types.mjs";

// 导出全局实例
import { WorkspaceManager } from "./workspaceManager.mjs";
import { Data } from "./data.mjs";
import { WorkspaceConfig } from "./types.mjs";

// 全局工作区管理器实例
export const workspaceManager = new WorkspaceManager();

// 获取工作区管理器实例的函数
export function getWorkspaceManager(): WorkspaceManager {
  return workspaceManager;
}

// 工作区配置数据存储（全局工作区列表）
export const WorkspaceConfigs = new Data("workspace_configs.json", {
  workspaces: [] as WorkspaceConfig[],
}, {
  sync: true,
});