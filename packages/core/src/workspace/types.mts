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
  attachedDialogueCount?: number;
  temperature?: number;
  confirm_call_tool: boolean;
  fallbackModelKey?: string;
  tags?: string[];
  subAgents?: string[];
  version?: number;
  created: number;
  lastModified: number;
};

// 兼容旧的 Agent 类型
export type Agent = AgentConfig;

export type ChatHistoryItem = {
  label: string;
  key: string;
  messages: Array<any>;
  modelKey: string;
  agentKey: string;
  sented: boolean;
  icon?: string;
  requestType: "stream";
  dateTime: number;
  isCalled: boolean;
  isTask: boolean;
  taskKey?: string;
  allowMCPs: string[];
  attachedDialogueCount?: number;
  temperature?: number;
  deleted?: boolean;
  confirm_call_tool: boolean;
  lastMessage?: any;
  version?: number | string;
};

export type MCPServerConfig = {
  command?: string;
  args?: string[];
  env?: { [s: string]: string };
  headers?: { [s: string]: string };
  url?: string;
  type?: "stdio" | "sse" | "streamableHttp";
  hyperchat?: {
    config: { [s in string]: any };
  };
  disabled?: boolean;
};

export type IMCPClient = {
  tools: Array<any>;
  prompts: Array<any>;
  resources: Array<any>;
  name: string;
  status: "disconnected" | "connected" | "connecting" | "disabled" | "deleted";
  order: number;
  config: MCPServerConfig;
  ext: {
    configSchema?: { [s in string]: any };
  };
  source: "hyperchat" | "builtin";
  version: string;
  servername: string;
};

// 工作区配置类型定义
export type WorkspaceConfig = {
  name: string;
  description?: string;
  created: number;
  lastAccessed: number;
  settings: WorkspaceSettings;
};

// 工作区设置
export type WorkspaceSettings = {
  enableMCP: boolean;
  enableAgents: boolean;
  enableKnowledgeBase: boolean;
  defaultModel?: string;
  defaultAgent?: string;
  autoSave: boolean;
  syncToCloud: boolean;
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
    typeof config.lastAccessed === 'number' &&
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
    typeof settings === 'object' &&
    typeof settings.enableMCP === 'boolean' &&
    typeof settings.enableAgents === 'boolean' &&
    typeof settings.enableKnowledgeBase === 'boolean' &&
    typeof settings.autoSave === 'boolean' &&
    typeof settings.syncToCloud === 'boolean'
  );
}