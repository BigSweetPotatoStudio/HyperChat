/**
 * Agent页面相关的统一类型定义
 * 基于workspace类型，转换为Agent中心架构
 */

import { AgentConfig, IMCPClient } from "@dadigua/hyperchat-shared";
import type { Task } from "@dadigua/hyperchat-shared";

/**
 * Agent实例信息
 */
export interface AgentInstanceInfo {
  path: string;
  name: string;
  config: AgentConfig;
  isRunning: boolean;
  chatLogsCount: number;
  lastChatTime?: number;
  hasMCPConfig: boolean;
  tasksCount: number;
}

/**
 * 文件树节点
 * 复用workspace的文件树结构
 */
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  modified: number;
  extension?: string;
  isLeaf?: boolean;
  loaded?: boolean;
  isHidden?: boolean;
}

/**
 * Agent聊天标签页配置
 * 基于workspace的ChatTab，简化为Agent中心
 */
export interface AgentChatTab {
  key: string;
  title: string;
  type: 'chat' | 'file' | 'welcome';
  agentPath: string;
  agentName: string;
  filePath?: string;
  fileName?: string;
  closable?: boolean;
  chatLogToLoad?: any;
}

/**
 * Agent详细信息
 * 包含Agent的运行时数据
 */
export interface AgentDetails {
  instanceInfo: AgentInstanceInfo;
  fileTreeData?: FileNode[];
  mcpClients: Record<string, IMCPClient>;
  tasks: Task[];
  chatLogs: Array<{
    key: string;
    label?: string;
    created: number;
    lastModified: number;
  }>;
}

/**
 * 面板尺寸配置
 * 复用workspace的面板配置
 */
export interface PanelSizes {
  left: string;
  middle: string;
  right: string;
}

/**
 * Agent左侧面板Props
 */
export interface AgentLeftPanelProps {
  agentPath: string;
  agentName: string;
  fileTreeData?: FileNode[];
  showHidden: boolean;
  onShowHiddenChange: (showHidden: boolean) => void;
  onRefreshFileTree: () => Promise<void>;
  onFileSelect: (filePath: string, fileName: string) => void;
}

/**
 * Agent中间面板Props
 */
export interface AgentMiddlePanelProps {
  agentPath: string;
  agentName: string;
  chatTabs: AgentChatTab[];
  activeTabKey: string;
  agentInstance: AgentInstanceInfo;
  mcpClients: IMCPClient[];
  onTabChange: (tabKey: string) => void;
  onTabRemove: (targetKey: string) => void;
  onOpenChatLog: (chatLog: { key: string; label?: string }) => void;
  onFileClose: (tabKey: string) => void;
}

/**
 * Agent右侧面板Props
 */
export interface AgentRightPanelProps {
  agentPath: string;
  agentName: string;
  agentInstance: AgentInstanceInfo;
  mcpClients: IMCPClient[];
  tasks: Task[];
  agentManagementRef: React.MutableRefObject<any>;
  mcpManagementRef: React.MutableRefObject<any>;
  taskManagementRef: React.MutableRefObject<any>;
  onRefreshAgent: () => Promise<void>;
  onRefreshMCP: () => Promise<void>;
  onRefreshTasks: () => Promise<void>;
  onOpenChat: (chatLog?: any) => void;
}

/**
 * Agent页面主组件Props
 */
export interface AgentPageProps {
  agentPath?: string;
  agentName?: string;
}

/**
 * Agent启动选项
 */
export interface AgentStartOptions {
  enableMCP?: boolean;
  enableTaskScheduler?: boolean;
}

/**
 * Agent操作命令类型
 */
export type AgentCommand = 
  | 'start'
  | 'stop' 
  | 'restart'
  | 'chat'
  | 'config'
  | 'logs'
  | 'mcp'
  | 'tasks';

/**
 * Agent状态统计
 */
export interface AgentStats {
  totalChatLogs: number;
  totalMCPClients: number;
  totalTasks: number;
  activeTasks: number;
  lastActivityTime?: number;
}