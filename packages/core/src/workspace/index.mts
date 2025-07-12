// 导出常量
export { CONSTANTS } from "./constants.mjs";

// 导出类型定义
export type {
  AgentConfig,
  Agent,
  WorkspaceConfig,
  WorkspaceSettings,
  WorkspaceFileNode
} from "./types.mjs";

export {
  validateWorkspaceConfig,
  validateWorkspaceSettings
} from "./types.mjs";

// 导出设置相关
export {
  WorkspaceSettingsManager,
  WorkspaceSettingsSchema,
  DEFAULT_WORKSPACE_SETTINGS
} from "../data/workspaceSettingsManager.mjs";

export type {
  WorkspaceSettings as WorkspaceDetailedSettings,
  WorkspaceAppearanceSettings,
  WorkspaceEditorSettings,
  WorkspaceAISettings,
  WorkspaceAdvancedSettings
} from "@hyperchat/shared/jsonSchemas/workspaceSettingsSchema";

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


