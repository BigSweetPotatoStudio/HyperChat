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