/**
 * 前后端交互的消息类型定义
 */

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
export interface TerminalReceiveData extends TerminalMessageExtended {
  command?: string;
  output?: string;
  error?: string;
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
  UpdateMsg: UpdateMsgData;
  syncMsg: SyncData;
  changeMcpClient: ChangeMcpClientData;
  downloadProgress: DownloadProgressData;
  terminalReceive: TerminalReceiveData;
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
export interface TerminalMessage extends TerminalMessageExtended {
  command?: string;
  output?: string;
  error?: string;
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


export interface AgentConfig {
  type?: "builtin" | "custom";
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
  subAgents?: string[];
  version?: number;
  created?: number;
  lastModified?: number;
}

/**
 * Data类的配置选项类型
 */
export interface DataOptions<T = unknown> {
  sync?: boolean;
  formatInit?: DataFormatFunction<T>;
  formatSave?: DataFormatFunction<T>;
}

// 工具调用类型定义
export interface HyperToolCall {
  origin_name: string;
  restore_name: string;
  index: number;
  id: string;
  type: "function";
  function: {
    name: string;
    args: ToolCallArgs;
  };
};

export type CommonContentItem = { text: string; type: "text" } | { type: "image_url", image_url: { url: string } };

export type CommonContent = Array<CommonContentItem>;

type UserMessage = {
  role: "user";
  content: string | CommonContent;
};

type SystemMessage = {
  role: "system";
  content: string;
};

type AssistantMessage = {
  role: "assistant";
  content: string | CommonContent;
};

type ToolMessage = {
  role: "tool";
  content: string | CommonContent;
  tool_calls?: HyperToolCall[];
};

type HyperMemoryMessage = {
  role: "hyper_memory";
  content: string;
  memory_key_points?: string[];
  memory_original_count?: number;
  memory_token_saved?: number;
};

export type AllMessage = UserMessage | SystemMessage | AssistantMessage | ToolMessage | HyperMemoryMessage;

// 消息类型扩展，支持多种内容状态、附件、推理内容等
export type MyMessage = AllMessage & {
  content_status?:
  | "loading" // request is loading
  | "success" // request is success
  | "error" // request is error
  | "dataLoading" // stream data is loading
  | "dataLoadComplete"; // stream is load complete
  content_error?: string;
  content_from?: string;
  content_attachment?: Array<{
    type: string;
    text?: string;
    mimeType?: string;
    data?: string;
  }>;
  reasoning_content?: string;
  content_tool_calls?: HyperToolCall[]; // openai tool call
  content_attached?: boolean;
  content_date?: number;
  content_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  tool_call_id?: string; // 工具调用的 ID
  tool_call_name?: string; // 工具调用的名称 // 谷歌需要

  // 记忆相关字段（仅当 role === "hyper_memory" 时使用）

};

// 聊天历史项类型，包含消息、模型、代理、任务等信息
export interface ChatHistoryItem {
  label: string;
  key: string;
  messages: Array<MyMessage>;
  modelKey: string;
  agentName: string;
  dateTime: number;
  chatType: "user" | "task" | "called";
  taskKey?: string;
  allowMCPs: string[];
  maxAttachedDialogs?: number;
  temperature?: number;
  isConfirmCallTool: boolean;
  version?: number;
};

// export type KnownProvider =
//   | "openai"
//   | "anthropic"
//   | "openrouter"
//   | "gemini"
//   | "qwen"
//   | "deepseek"
//   | "doubao"
//   | "xai"
//   | "glm"
//   | "ollama"
//   | "unknown";

// 提供商配置接口，描述每个大模型 API 的基本信息
// export interface ProviderConfig {
//   key: KnownProvider; // 唯一标识
//   label: string; // 显示名称
//   baseURL: string; // API 基础地址
//   icon?: string; // 图标
//   description?: string; // 描述
//   hasApiKey?: boolean;
//   apiKey?: string; // API Key 字段
//   isBuiltIn: boolean; // 是否内置（true=内置，false=自定义）
// }

// export interface AIModelConfigItem {
//   key: string;
//   name: string;
//   model: string;
//   apiKey: string; // 废弃 get from provider
//   baseURL: string; // 废弃 get from provider
//   provider: KnownProvider;
//   supportImage: boolean;
//   supportTool: boolean;
//   call_tool_step?: number;
//   type?: "llm" | "embedding";
//   toolMode?: "standard" | "compatible";
//   fullName?: string; // 提供商:模型名称
// }

export interface MCPServerConfig {
  command?: string;
  args?: string[];
  env?: { [s: string]: string };
  headers?: { [s: string]: string };
  url?: string;
  type?: "stdio" | "sse" | "streamableHttp" | "inMemory";
  hyperchat?: {
    config: Record<string, unknown>;
  };
  disabled?: boolean;
};

export interface HyperChatCompletionTool {
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

export interface IMCPClient {
  tools: Array<HyperChatCompletionTool>;
  prompts: Array<MCPPromptSchema & { key: string }>;
  resources: Array<MCPResourceSchema & { key: string }>;
  serverName: string;
  status: "disconnected" | "connected" | "connecting" | "disabled" | "deleted" | "error";
  order: number;
  config: MCPServerConfig;
  ext: {
    configSchema?: MCPConfigSchema;
  };
  mcpType: "builtin" | "custom";
  version: string;
  workspacePath: string;
  scope: "workspace" | "global";
};

export interface KnowledgeStore {
  localPath: string;
  key: string;
  resources: KnowledgeResource[];
  name: string;
  model: string;
  description: string;
};

export interface KnowledgeResource {
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

export interface KnowledgeFragment {
  resourceKey: string;
  date: number;
  text: string;
  vector: number[];
};


export interface Var {
  key: string;
  name: string;
  value?: string;
  scope: string;
  variableStrategy: "lazy" | "immediate";
  variableType: "string" | "js" | "webjs";
  code?: string;
  description?: string;
};

export interface VarScope {
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
  isLeaf?: boolean;
  isHidden: boolean;
}

// 别名，向前兼容
export type FileSystemItem = DirectoryItem;

export interface DirectoryListResult {
  items: DirectoryItem[];
  total: number;
  hasMore: boolean;
  path: string;
}

// 工作区相关类型
export interface WorkspaceSummary {
  path: string;
  name: string;
  isGlobal: boolean;
  agentsCount: number;
  mcpServersCount: number;
  created: number;
  description?: string;
}


/**
 * MCP 相关类型定义
 */
export interface MCPPromptSchema {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface MCPResourceSchema {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/**
 * MCP 配置 Schema
 */
export interface MCPConfigSchema {
  [key: string]: {
    type: string;
    description?: string;
    default?: unknown;
    required?: boolean;
  };
}

/**
 * 数据格式化函数类型
 */
export type DataFormatFunction<T = unknown> = (data: T) => T;

/**
 * 工具调用参数类型
 */
export interface ToolCallArgs {
  [key: string]: unknown;
}

/**
 * 终端消息扩展属性
 */
export interface TerminalMessageExtended {
  command?: string;
  output?: string;
  error?: string;
  exitCode?: number;
  timestamp?: number;
  workdir?: string;
  terminalID?: number;
  type?: string;
  data?: string | { cols: number; rows: number; status: number };
}

/**
 * JSON Schema 对象类型
 */
export interface JSONSchemaObject {
  type: "object";
  properties?: {
    [key: string]: JSONSchemaProperty;
  };
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description?: string;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  properties?: {
    [key: string]: JSONSchemaProperty;
  };
}

/**
 * AI 相关类型定义
 */
export interface AIProvider {
  model: string;
  apiKey: string;
  baseURL: string;
  [key: string]: unknown;
}

/**
 * AI 扩展平台接口
 */
export interface AIExtension {
  platform: "web" | "node" | "electron";
  getURL_PRE?(): string;
  [key: string]: unknown;
}

/**
 * 响应格式类型
 */
export interface ResponseFormat {
  json_schema?: {
    schema: JSONSchemaObject;
  };
  [key: string]: unknown;
}

/**
 * 自定义 fetch 类型
 */
export type CustomFetch = (url: string | URL | Request, init?: RequestInit) => Promise<Response>;

/**
 * 事件系统相关类型
 */
export type EventCallback<T = unknown> = (...args: T[]) => void;
export type EventCallbackWithOnce<T = unknown> = EventCallback<T> & { once?: boolean };
export type EventHoldsMap = Record<string, unknown[][]>;
export type EventCallbacksMap = Record<string, EventCallbackWithOnce[]>;