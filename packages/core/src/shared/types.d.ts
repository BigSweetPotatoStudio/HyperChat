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
export interface ChangeMcpClientData {
  name: string;
  config: any; // MCPServerConfig
  order: number;
  tools: Array<any>; // HyperChatCompletionTool
  resources: any[];
  prompts: any[];
  status: "connecting" | "connected" | "disconnected" | "error" | "disabled";
  version: string;
  servername: string;
  scope: "workspace";
  mcpType: any; // MCPType
  workspacePath: string;
  ext: {
    configSchema?: { [s in string]: any };
  };
}

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