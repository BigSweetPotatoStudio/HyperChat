// 从 shared 包导入AI配置类型，避免重复定义
export type { BaseAIConfig, AgentConfig } from '@dadigua/hyperchat-shared';



// 工作区配置类型定义
export type WorkspaceConfig = {
  name: string;
  description?: string;
  created: number;
  settings: WorkspaceSettings;
  agentsCount?: number;
  mcpServersCount?: number;
};

// 工作区设置
export type WorkspaceSettings = {
  defaultModel?: string;
  defaultAgent?: string;
};

// 工作区文件树节点
export type WorkspaceFileNode = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  modified?: number;
  children?: WorkspaceFileNode[];
  extension?: string;
  isHidden?: boolean;
};

/**
 * 验证工作区配置
 */
export function validateWorkspaceConfig(config: any): config is WorkspaceConfig {
  return (
    config &&
    typeof config === 'object' &&
    typeof config.name === 'string' &&
    typeof config.created === 'number' &&
    config.settings &&
    typeof config.settings === 'object'
  );
}

/**
 * 验证工作区设置
 */
export function validateWorkspaceSettings(settings: any): settings is WorkspaceSettings {
  return (
    settings &&
    typeof settings === 'object'
  );
}