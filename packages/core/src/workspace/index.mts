// 导出常量
export { CONSTANTS } from "./constants.mjs";

// 导出类型定义
export type {
  AgentConfig,
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
} from "../data/managers/workspaceSettingsManager.mjs";

export type {
  WorkspaceSettings as WorkspaceDetailedSettings,
  WorkspaceAppearanceSettings,
  WorkspaceEditorSettings,
  WorkspaceDefaultAISettings,
  WorkspaceAdvancedSettings
} from "@dadigua/hyperchat-shared";

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
import { Command } from "../command.mjs";

// 全局工作区管理器实例
export const workspaceManager = new WorkspaceManager();

// 获取工作区管理器实例的函数
export function getWorkspaceManager(): WorkspaceManager {
  return workspaceManager;
}


const defaultAgentName = 'Hyper';
/**
 * 获取或创建默认 Agent
 * 如果工作区中没有名为 "default" 的 Agent，则自动创建一个
 */
export async function getDefaultAgent(): Promise<{ agentName: string; agentInstance: any; agentConfig: any } | null> {
  try {
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      return null;
    }


    // 首先检查是否已经存在默认 Agent
    const agents = await workspace.getAllAgentsSummary();
    const existingDefaultAgent = agents.find(a => a.config.name === defaultAgentName);

    if (existingDefaultAgent) {
      // 如果已经存在，直接返回
      const agentInstance = workspace.getAgentInstance(defaultAgentName);
      if (agentInstance) {
        return {
          agentName: defaultAgentName,
          agentInstance: agentInstance,
          agentConfig: existingDefaultAgent.config
        };
      }
    }

    // 如果不存在默认 Agent，创建一个
    await createDefaultAgent(workspace);

    // 重新获取创建后的默认 Agent
    const updatedAgents = await workspace.getAllAgentsSummary();
    const newDefaultAgent = updatedAgents.find(a => a.config.name === defaultAgentName);

    if (newDefaultAgent) {
      const agentInstance = workspace.getAgentInstance(defaultAgentName);
      if (agentInstance) {
        return {
          agentName: defaultAgentName,
          agentInstance: agentInstance,
          agentConfig: newDefaultAgent.config
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting/creating default agent:', error);
    return null;
  }
}

/**
 * 创建默认 Agent
 * 内部辅助函数，用于创建一个标准的默认 Agent
 */
async function createDefaultAgent(workspace: any): Promise<void> {

  // 使用内置提示词生成增强的系统提示词
  const basePrompt = `You are a helpful AI assistant. You can assist with various tasks including file operations, coding, research, and general questions.`;

  // 创建默认 Agent 配置
  const agentConfig = {
    name: defaultAgentName,
    prompt: basePrompt,
    description: `Default AI assistant`,
    allowMCPs: ["hyper_system"] as string[],
    isConfirmCallTool: false,
    tags: ['default', 'auto-created']
  };

  // 使用 Command API 创建 Agent
  await Command.createAgent({
    config: agentConfig,
    scope: "global",
  });
}


