/**
 * 工作区面板尺寸存储工具
 */

interface PanelSizes {
  left: string;
  middle: string;
  right: string;
}

const DEFAULT_PANEL_SIZES: PanelSizes = {
  left: '25%',
  middle: '50%',
  right: '25%'
};

/**
 * 获取工作区面板尺寸的存储键
 */
const getPanelSizeKey = (workspaceKey: string): string => {
  return `workspace_panel_sizes_${workspaceKey}`;
};

/**
 * 保存工作区面板尺寸
 */
export const savePanelSizes = (workspaceKey: string, sizes: PanelSizes): void => {
  try {
    const key = getPanelSizeKey(workspaceKey);
    localStorage.setItem(key, JSON.stringify(sizes));
  } catch (error) {
    console.warn('Failed to save panel sizes:', error);
  }
};

/**
 * 获取工作区面板尺寸
 */
export const getPanelSizes = (workspaceKey: string): PanelSizes => {
  try {
    const key = getPanelSizeKey(workspaceKey);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 验证数据格式
      if (parsed.left && parsed.middle && parsed.right) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to get panel sizes:', error);
  }
  
  return DEFAULT_PANEL_SIZES;
};

/**
 * 重置工作区面板尺寸为默认值
 */
export const resetPanelSizes = (workspaceKey: string): void => {
  try {
    const key = getPanelSizeKey(workspaceKey);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to reset panel sizes:', error);
  }
};

/**
 * 获取所有工作区的面板尺寸存储键
 */
export const getAllPanelSizeKeys = (): string[] => {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('workspace_panel_sizes_')) {
        keys.push(key);
      }
    }
  } catch (error) {
    console.warn('Failed to get all panel size keys:', error);
  }
  return keys;
};

/**
 * 清理所有工作区面板尺寸存储
 */
export const clearAllPanelSizes = (): void => {
  try {
    const keys = getAllPanelSizeKeys();
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('Failed to clear all panel sizes:', error);
  }
};

/**
 * 工作区历史记录管理
 */

interface WorkspaceHistoryItem {
  path: string;
  name: string;
  lastUsed: number;
}

const WORKSPACE_HISTORY_KEY = 'workspace_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * 获取工作区历史记录
 */
export const getWorkspaceHistory = (): WorkspaceHistoryItem[] => {
  try {
    const stored = localStorage.getItem(WORKSPACE_HISTORY_KEY);
    if (stored) {
      const history = JSON.parse(stored) as WorkspaceHistoryItem[];
      // 按最近使用时间排序
      return history.sort((a, b) => b.lastUsed - a.lastUsed);
    }
  } catch (error) {
    console.warn('Failed to get workspace history:', error);
  }
  return [];
};

/**
 * 添加工作区到历史记录
 */
export const addToWorkspaceHistory = (path: string, name?: string): void => {
  try {
    const history = getWorkspaceHistory();
    const now = Date.now();
    
    // 检查是否已存在
    const existingIndex = history.findIndex(item => item.path === path);
    
    // 提取文件夹名作为默认名称
    const folderName = name || path.split(/[/\\]/).pop() || 'Workspace';
    
    if (existingIndex >= 0) {
      // 更新已存在的记录
      history[existingIndex] = {
        path,
        name: folderName,
        lastUsed: now
      };
    } else {
      // 添加新记录
      history.unshift({
        path,
        name: folderName,
        lastUsed: now
      });
    }
    
    // 限制历史记录数量
    const limitedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(WORKSPACE_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.warn('Failed to add to workspace history:', error);
  }
};

/**
 * 从历史记录中删除工作区
 */
export const removeFromWorkspaceHistory = (path: string): void => {
  try {
    const history = getWorkspaceHistory();
    const filteredHistory = history.filter(item => item.path !== path);
    localStorage.setItem(WORKSPACE_HISTORY_KEY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.warn('Failed to remove from workspace history:', error);
  }
};

/**
 * 清空工作区历史记录
 */
export const clearWorkspaceHistory = (): void => {
  try {
    localStorage.removeItem(WORKSPACE_HISTORY_KEY);
  } catch (error) {
    console.warn('Failed to clear workspace history:', error);
  }
};

/**
 * Agent 最近使用记录管理
 */

interface AgentRecentUsage {
  workspacePath: string;
  agentKey: string;
  agentName: string;
  lastUsed: number;
}

const AGENT_RECENT_USAGE_KEY = 'agent_recent_usage';
const MAX_RECENT_AGENTS = 20;

/**
 * 获取 Agent 最近使用记录
 */
export const getAgentRecentUsage = (workspacePath?: string): AgentRecentUsage[] => {
  try {
    const stored = localStorage.getItem(AGENT_RECENT_USAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as AgentRecentUsage[];
      let filteredUsage = usage;
      
      // 如果指定了工作区路径，只返回该工作区的记录
      if (workspacePath) {
        filteredUsage = usage.filter(item => item.workspacePath === workspacePath);
      }
      
      // 按最近使用时间排序
      return filteredUsage.sort((a, b) => b.lastUsed - a.lastUsed);
    }
  } catch (error) {
    console.warn('Failed to get agent recent usage:', error);
  }
  return [];
};

/**
 * 添加 Agent 使用记录
 */
export const addAgentRecentUsage = (workspacePath: string, agentKey: string, agentName: string): void => {
  try {
    const usage = getAgentRecentUsage();
    const now = Date.now();
    
    // 检查是否已存在相同的记录
    const existingIndex = usage.findIndex(item => 
      item.workspacePath === workspacePath && item.agentKey === agentKey
    );
    
    if (existingIndex >= 0) {
      // 更新已存在的记录
      usage[existingIndex] = {
        workspacePath,
        agentKey,
        agentName,
        lastUsed: now
      };
    } else {
      // 添加新记录
      usage.unshift({
        workspacePath,
        agentKey,
        agentName,
        lastUsed: now
      });
    }
    
    // 限制记录数量
    const limitedUsage = usage.slice(0, MAX_RECENT_AGENTS);
    
    localStorage.setItem(AGENT_RECENT_USAGE_KEY, JSON.stringify(limitedUsage));
  } catch (error) {
    console.warn('Failed to add agent recent usage:', error);
  }
};

/**
 * 从最近使用记录中删除 Agent
 */
export const removeAgentRecentUsage = (workspacePath: string, agentKey: string): void => {
  try {
    const usage = getAgentRecentUsage();
    const filteredUsage = usage.filter(item => 
      !(item.workspacePath === workspacePath && item.agentKey === agentKey)
    );
    localStorage.setItem(AGENT_RECENT_USAGE_KEY, JSON.stringify(filteredUsage));
  } catch (error) {
    console.warn('Failed to remove agent recent usage:', error);
  }
};

/**
 * 清空 Agent 最近使用记录
 */
export const clearAgentRecentUsage = (workspacePath?: string): void => {
  try {
    if (workspacePath) {
      // 只清空指定工作区的记录
      const usage = getAgentRecentUsage();
      const filteredUsage = usage.filter(item => item.workspacePath !== workspacePath);
      localStorage.setItem(AGENT_RECENT_USAGE_KEY, JSON.stringify(filteredUsage));
    } else {
      // 清空所有记录
      localStorage.removeItem(AGENT_RECENT_USAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear agent recent usage:', error);
  }
};

/**
 * 聊天对话最近使用记录管理
 */

interface ChatRecentUsage {
  workspacePath: string;
  agentKey: string;
  agentName: string;
  chatKey: string;
  chatLabel: string;
  lastUsed: number;
  usageCount: number;
}

const CHAT_RECENT_USAGE_KEY = 'chat_recent_usage';
const MAX_RECENT_CHATS = 50;

/**
 * 获取聊天对话最近使用记录
 */
export const getChatRecentUsage = (workspacePath?: string, agentKey?: string): ChatRecentUsage[] => {
  try {
    const stored = localStorage.getItem(CHAT_RECENT_USAGE_KEY);
    if (stored) {
      const usage = JSON.parse(stored) as ChatRecentUsage[];
      let filteredUsage = usage;
      
      // 如果指定了工作区路径，只返回该工作区的记录
      if (workspacePath) {
        filteredUsage = usage.filter(item => item.workspacePath === workspacePath);
      }
      
      // 如果指定了agentKey，进一步过滤
      if (agentKey) {
        filteredUsage = filteredUsage.filter(item => item.agentKey === agentKey);
      }
      
      // 按最近使用时间排序
      return filteredUsage.sort((a, b) => b.lastUsed - a.lastUsed);
    }
  } catch (error) {
    console.warn('Failed to get chat recent usage:', error);
  }
  return [];
};

/**
 * 添加聊天对话使用记录
 */
export const addChatRecentUsage = (
  workspacePath: string, 
  agentKey: string, 
  agentName: string,
  chatKey: string,
  chatLabel: string
): void => {
  try {
    const usage = getChatRecentUsage();
    const now = Date.now();
    
    // 检查是否已存在相同的记录
    const existingIndex = usage.findIndex(item => 
      item.workspacePath === workspacePath && 
      item.agentKey === agentKey && 
      item.chatKey === chatKey
    );
    
    if (existingIndex >= 0) {
      // 更新已存在的记录
      const existing = usage[existingIndex];
      if (existing) {
        usage[existingIndex] = {
          ...existing,
          agentName,
          chatLabel,
          lastUsed: now,
          usageCount: existing.usageCount + 1
        };
      }
    } else {
      // 添加新记录
      usage.unshift({
        workspacePath,
        agentKey,
        agentName,
        chatKey,
        chatLabel,
        lastUsed: now,
        usageCount: 1
      });
    }
    
    // 限制记录数量
    const limitedUsage = usage.slice(0, MAX_RECENT_CHATS);
    
    localStorage.setItem(CHAT_RECENT_USAGE_KEY, JSON.stringify(limitedUsage));
  } catch (error) {
    console.warn('Failed to add chat recent usage:', error);
  }
};

/**
 * 从最近使用记录中删除聊天对话
 */
export const removeChatRecentUsage = (workspacePath: string, agentKey: string, chatKey: string): void => {
  try {
    const usage = getChatRecentUsage();
    const filteredUsage = usage.filter(item => 
      !(item.workspacePath === workspacePath && item.agentKey === agentKey && item.chatKey === chatKey)
    );
    localStorage.setItem(CHAT_RECENT_USAGE_KEY, JSON.stringify(filteredUsage));
  } catch (error) {
    console.warn('Failed to remove chat recent usage:', error);
  }
};

/**
 * 清空聊天对话最近使用记录
 */
export const clearChatRecentUsage = (workspacePath?: string, agentKey?: string): void => {
  try {
    if (workspacePath || agentKey) {
      // 只清空指定条件的记录
      const usage = getChatRecentUsage();
      const filteredUsage = usage.filter(item => {
        if (workspacePath && item.workspacePath !== workspacePath) return true;
        if (agentKey && item.agentKey !== agentKey) return true;
        return false;
      });
      localStorage.setItem(CHAT_RECENT_USAGE_KEY, JSON.stringify(filteredUsage));
    } else {
      // 清空所有记录
      localStorage.removeItem(CHAT_RECENT_USAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear chat recent usage:', error);
  }
};