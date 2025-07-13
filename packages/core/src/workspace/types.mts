// 类型定义
export type AgentConfig = {
  type?: "builtin" | "custom";
  key: string;
  name: string;
  prompt: string;
  description?: string;
  callable?: boolean;
  allowMCPs: string[];
  modelKey?: string;
  maxAttachedDialogs?: number;
  temperature?: number;
  isConfirmCallTool: boolean;
  tags?: string[];
  version?: number;
  created?: number;
  lastModified?: number;
};



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