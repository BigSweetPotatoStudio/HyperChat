/**
 * 前后端交互的消息类型定义
 */

/**
 * 消息类型定义
 */
export type MessageType = 
  | "TaskResult"           // 任务完成通知
  | "UpdateMsg"           // 应用更新消息
  | "sync"                // 同步状态消息
  | "changeMcpClient"     // MCP客户端状态变化
  | "download-progress"   // 下载进度更新
  | "terminal-receive"    // 终端消息处理
  | "update_var_list";    // 变量列表更新

/**
 * 主消息数据结构
 */
export interface MessageData {
  type: MessageType;
  data?: any;
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