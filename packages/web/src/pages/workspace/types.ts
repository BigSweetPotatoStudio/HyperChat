/**
 * Workspace 相关的统一类型定义
 * 避免在多个文件中重复定义相同的接口
 */

import { AgentConfig, IMCPClient } from "@dadigua/hyperchat-shared/types";
import type { Task } from "@dadigua/hyperchat-shared";

/**
 * 工作区配置基础信息
 */
export interface WorkspaceConfig {
  name: string;
  description?: string;
  created: number;
  settings: Record<string, any>;
  agentsCount?: number;
  mcpServersCount?: number;
}

/**
 * 完整的工作区信息
 * 扩展了基础配置，包含路径和状态信息
 */
export interface WorkspaceInfo extends WorkspaceConfig {
  path: string;
  agentsCount: number;
  mcpServersCount: number;
  isGlobal: boolean;
}

/**
 * 文件树节点
 * 用于表示工作区中的文件和目录结构
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
 * 聊天标签页配置
 * 用于管理工作区中的不同类型标签页
 */
export interface ChatTab {
  key: string;
  title: string;
  type: 'chat' | 'file' | 'welcome';
  agentKey?: string;
  agentName?: string;
  filePath?: string;
  fileName?: string;
  workspacePath: string;
  closable?: boolean;
  chatLogToLoad?: any;
}

/**
 * 单工作区详细信息
 * 包含当前工作区的运行时数据
 */
export interface CurrentWorkspaceDetails {
  fileTreeData?: FileNode[];
  agents: Array<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }>;
  mcpClients: Record<string, IMCPClient>;
  tasks: Task[];
}

/**
 * 工作区详细信息 (向后兼容)
 * @deprecated 使用 CurrentWorkspaceDetails 替代
 */
export type WorkspaceDetails = {
  [key: string]: CurrentWorkspaceDetails;
};

/**
 * 面板尺寸配置
 * 用于保存和恢复工作区布局
 */
export interface PanelSizes {
  left: string;
  middle: string;
  right: string;
}

/**
 * 工作区历史记录项
 */
export interface WorkspaceHistoryItem {
  path: string;
  name: string;
  lastUsed: number;
}

/**
 * 工作区打开表单的值类型
 */
export interface WorkspaceOpenFormValues {
  path: string;
}

/**
 * 工作区面板的通用 Props
 */
export interface WorkspacePanelProps {
  workspace: WorkspaceInfo;
  workspaceKey: string;
}

/**
 * 左侧面板 Props
 */
export interface WorkspaceLeftPanelProps {
  workspace: WorkspaceInfo;
  fileTreeData?: FileNode[];
  showHidden: boolean;
  onShowHiddenChange: (showHidden: boolean) => void;
  onRefreshFileTree: () => Promise<void>;
  onFileSelect: (filePath: string, fileName: string) => void;
}


/**
 * 中间面板 Props (单工作区版本)
 */
export interface WorkspaceMiddlePanelProps {
  workspace: WorkspaceInfo;
  chatTabs: ChatTab[];
  activeTabKey: string;
  agents: Array<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }>;
  mcpClients: IMCPClient[];
  agentManagementRef: React.MutableRefObject<any>;
  onTabChange: (tabKey: string) => void;
  onTabRemove: (targetKey: string) => void;
  onOpenAgentChat: (
    agent: { config: AgentConfig; chatLogsCount: number; lastChatTime?: number },
    chatLog?: { key: string; label?: string }
  ) => void;
  onFileClose: (tabKey: string) => void;
}

/**
 * 右侧面板 Props (单工作区版本)
 */
export interface WorkspaceRightPanelProps {
  workspace: WorkspaceInfo;
  workspaceKey: string;
  agents: Array<{
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
  }>;
  mcpClients: IMCPClient[];
  tasks: Task[];
  agentManagementRef: React.MutableRefObject<any>;
  mcpManagementRef: React.MutableRefObject<any>;
  taskManagementRef: React.MutableRefObject<any>;
  onRefreshAgents: () => Promise<void>;
  onRefreshMCP: () => Promise<void>;
  onRefreshTasks: () => Promise<void>;
  onOpenChat: (
    agent: { config: AgentConfig; chatLogsCount: number; lastChatTime?: number },
    chatLog?: any
  ) => void;
}