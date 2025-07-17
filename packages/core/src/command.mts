/**
 * command.mts - HyperChat 后端命令系统
 * 
 * 重构说明：
 * 原本的 CommandFactory 类已按功能模块拆分到 commands/ 目录下：
 * - mcpCommands.mts - MCP 客户端管理、工具调用、资源管理
 * - fileCommands.mts - 文件读写、目录操作、路径处理
 * - workspaceCommands.mts - 工作区创建、切换、配置、文件树
 * - agentCommands.mts - Agent 的增删改查、聊天记录管理
 * - terminalCommands.mts - 终端创建、关闭、操作
 * - settingsCommands.mts - 工作区设置和应用设置管理
 * - systemCommands.mts - 网络、端口、代码执行等系统功能
 * 
 * 现在只需要从 commands/index.mts 导入合并后的 Command 对象
 */

import { Command } from "./commands/index.mjs";

/**
 * 为了保持向后兼容性，保留原有的 CommandFactory 类结构
 * 但实际功能委托给分类后的命令模块
 */


// 导出单例实例，保持与原代码的兼容性
export { Command };



// 导出分类的命令模块，便于按需引用
export {
  mcpCommands,
  fileCommands,
  workspaceCommands,
  agentCommands,
  taskCommands,
  terminalCommands,
  settingsCommands,
  systemCommands,
  chatCommands
} from "./commands/index.mjs";

// 导出类型定义
export type {
  CommandType,
  MCPCommandsType,
  FileCommandsType,
  WorkspaceCommandsType,
  AgentCommandsType,
  TaskCommandsType,
  TerminalCommandsType,
  SettingsCommandsType,
  SystemCommandsType,
  ChatCommandsType
} from "./commands/index.mjs";