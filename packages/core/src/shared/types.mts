/**
 * 前后端交互的消息类型定义
 */

/**
 * 任务结果消息数据
 */
export interface TaskResultData {
  task: {
    name: string;
    key: string;
  };
  agent: {
    label: string;
  };
  result: string;
}

/**
 * 应用更新消息数据
 */
export interface UpdateMsgData {
  status: number; // 0-正在检查更新, 1-发现可更新, 2-无更新, 3-下载中, 4-下载完成, -1-错误
  info?: {
    version: string;
    releaseName: string;
    releaseNotes: string | Array<{ note: string }>;
  };
}

/**
 * 同步状态消息数据
 */
export interface SyncData {
  status: number; // 0-正常/完成, 1-同步中, -1-失败
}

/**
 * MCP客户端状态变化消息数据
 */
export type ChangeMcpClientData = IMCPClient;

/**
 * 下载进度消息数据
 */
export interface DownloadProgressData {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

/**
 * 终端消息数据
 */
export interface TerminalReceiveData {
  command?: string;
  output?: string;
  error?: string;
  [key: string]: any;
}

/**
 * 变量列表更新消息数据
 */
export interface UpdateVarListData {
  // 这个消息类型没有额外的data字段，只是一个通知信号
}

/**
 * 消息类型映射
 */
export type MessageDataMap = {
  TaskResult: TaskResultData;
  UpdateMsg: UpdateMsgData;
  sync: SyncData;
  changeMcpClient: ChangeMcpClientData;
  "download-progress": DownloadProgressData;
  "terminal-receive": TerminalReceiveData;
  update_var_list: UpdateVarListData;
}

/**
 * 主消息数据结构 - 使用泛型确保类型安全
 */
export interface MessageData<T extends keyof MessageDataMap = keyof MessageDataMap> {
  type: T;
  data?: MessageDataMap[T];
  timestamp?: string;
  workspacePath: string;
}

/**
 * 终端消息数据结构
 */
export interface TerminalMessage {
  command?: string;
  output?: string;
  error?: string;
  [key: string]: any;
}

/**
 * 终端回调函数类型
 */
export type TerminalCallback = (msg: TerminalMessage) => void;

/**
 * 用户Socket映射类型
 */
export type UserSocketMap = Map<string, string>;

/**
 * 连接状态信息
 */
export interface ConnectionStatus {
  isInitialized: boolean;
  activeUser?: string;
  connectedUsers: string[];
  totalConnections: number;
  terminalListeners: number;
}


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
  tags?: string[];
  subAgents?: string[];
  version?: number;
  created?: number;
  lastModified?: number;
}

/**
 * Data类的配置选项类型
 */
export interface DataOptions {
  sync?: boolean;
  formatInit?: (x: any) => any;
  formatSave?: (x: any) => any;
}

// 工具调用类型定义
export type Tool_Call = {
  origin_name: string;  // 废弃
  restore_name: string; // 废弃
  index: number;
  id: string;
  type: "function";
  function: {
    name: string;
    args: any;
  };
};

type CommonContent = Array<{ text: string; type: "text" } | { type: "image_url", image_url: { url: string } }>;

type UserMessage = {
  role: "user";
  content: string | CommonContent;
};

type SystemMessage = {
  role: "system";
  content: string | CommonContent;
};

type AssistantMessage = {
  role: "assistant";
  content: string | CommonContent;
}

type ToolMessage = {
  role: "tool";
  content: string | CommonContent;
  tool_calls?: Tool_Call[];
};

export type AllMessage = UserMessage | SystemMessage | AssistantMessage | ToolMessage;

// 消息类型扩展，支持多种内容状态、附件、推理内容等
export type MyMessage = AllMessage & {
  content_status?:
  | "loading" // request is loading
  | "success" // request is success
  | "error" // request is error
  | "dataLoading" // stream data is loading
  | "dataLoadComplete"; // stream is load complete
  content_sended?: boolean;
  content_template?: string;
  content_error?: string;
  content_from?: string;
  content_attachment?: Array<{
    type: string;
    text?: string;
    mimeType?: string;
    data?: string;
  }>;
  reasoning_content?: string;
  content_tool_calls?: Tool_Call[]; // openai tool call
  content_context?: any;
  content_attached?: boolean;
  content_date?: number;
  content_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  tool_call_id?: string; // 工具调用的 ID
  tool_call_name?: string; // 工具调用的名称 // 谷歌需要
};

// 聊天历史项类型，包含消息、模型、代理、任务等信息
export type ChatHistoryItem = {
  label: string;
  key: string;
  messages: Array<MyMessage>;
  modelKey: string;
  agentKey: string;
  sented: boolean;
  icon?: string;
  requestType: "stream";  // 以后只支持 stream
  dateTime: number;
  isCalled: boolean;
  isTask: boolean;
  taskKey?: string;
  allowMCPs: string[];
  attachedDialogueCount?: number;
  temperature?: number;
  deleted?: boolean;
  confirm_call_tool: boolean;
  lastMessage?: MyMessage;
  version?: number | string;
};

export type KnownProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "gemini"
  | "qwen"
  | "deepseek"
  | "doubao"
  | "xai"
  | "glm"
  | "ollama";

// 提供商配置接口，描述每个大模型 API 的基本信息
export interface ProviderConfig {
  key: KnownProvider; // 唯一标识
  label: string; // 显示名称
  baseURL: string; // API 基础地址
  icon?: string; // 图标
  description?: string; // 描述
  hasApiKey?: boolean;
  apiKey?: string; // API Key 字段
  isBuiltIn: boolean; // 是否内置（true=内置，false=自定义）
}

export type AIModelConfigItem = {
  key: string;
  name: string;
  model: string;
  apiKey: string; // 废弃 get from provider
  baseURL: string; // 废弃 get from provider
  provider: KnownProvider | string;
  supportImage: boolean;
  supportTool: boolean;
  call_tool_step?: number;
  type?: "llm" | "embedding";
  toolMode?: "standard" | "compatible";
  isDefault?: boolean;
  fullName?: string; // 提供商:模型名称
}

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

export type HyperChatCompletionTool = {
  name: string;
  origin_name: string;
  restore_name: string;
  clientName: string;
  description: string;
  inputSchema: {
    [x: string]: unknown;
    type: "object";
    properties?: {
      [x: string]: unknown;
    } | undefined;
  };
  workspacePath: string;
};

export type IMCPClient = {
  tools: Array<HyperChatCompletionTool>;
  prompts: Array<any>; // MCPTypes.PromptSchema._type & { key: string }
  resources: Array<any>; // MCPTypes.ResourceSchema._type & { key: string }
  serverName: string;
  status: "disconnected" | "connected" | "connecting" | "disabled" | "deleted" | "error";
  order: number;
  config: MCPServerConfig;
  ext: {
    configSchema?: { [s in string]: any };
  };
  mcpType: "builtin" | "custom";
  version: string;
  workspacePath: string;
};

export type KnowledgeStore = {
  localPath: string;
  key: string;
  resources: KnowledgeResource[];
  name: string;
  model: string;
  description: string;
};

export type KnowledgeResource = {
  key: string;
  name: string;
  type: "file" | "text";
  fragments?: KnowledgeFragment[];
  filepath?: string;
  text?: string;
  uniqueId: string;
  entriesAdded: number;
  loaderType: string;
};

export type KnowledgeFragment = {
  resourceKey: string;
  date: number;
  text: string;
  vector: number[];
};

export type Task = {
  key: string;
  name: string;
  command: string;
  agentKey: string;
  description: string;
  cron: string;
  disabled: boolean;
};

export type Var = {
  key: string;
  name: string;
  value?: string;
  scope: string;
  variableStrategy: "lazy" | "immediate";
  variableType: "string" | "js" | "webjs";
  code?: string;
  description?: string;
};

export type VarScope = {
  key: string;
  name: string;
  type: "builtin" | "custom";
};


export interface DirectoryItem {
  name: string;
  path: string;
  type: "directory" | "file";
  size?: number;
  modified: number;
  extension?: string;
  isLeaf: boolean;
  isHidden: boolean;
}