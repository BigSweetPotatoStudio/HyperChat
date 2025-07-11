// 工作区相关的类型和接口定义
// 注意：这个文件主要用于类型定义，具体实现在 packages/core/src/workspace 中

export interface WorkspaceInfo {
  name: string;
  path: string;
  isDefault: boolean;
}

export interface WorkspaceConfig {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

// 重新导出一些基本的工作区相关类型
// 具体实现请参考 packages/core/src/workspace/