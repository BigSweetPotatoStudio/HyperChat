import { mcpCommands } from "./mcpCommands.mjs";
import { fileCommands } from "./fileCommands.mjs";
import { workspaceCommands } from "./workspaceCommands.mjs";
import { agentCommands } from "./agentCommands.mjs";
import { terminalCommands } from "./terminalCommands.mjs";
import { settingsCommands } from "./settingsCommands.mjs";
import { systemCommands } from "./systemCommands.mjs";

/**
 * 合并所有命令模块
 * 将分类的命令合并为一个统一的 Command 对象
 */
export const Command = {
  ...mcpCommands,
  ...fileCommands,
  ...workspaceCommands,
  ...agentCommands,
  ...terminalCommands,
  ...settingsCommands,
  ...systemCommands
};

// 默认导出
export default Command;

/**
 * 分类导出，便于按需引用
 */
export {
  mcpCommands,
  fileCommands,
  workspaceCommands,
  agentCommands,
  terminalCommands,
  settingsCommands,
  systemCommands
};

/**
 * 命令类型定义
 */
export type CommandType = typeof Command;

/**
 * 各分类命令类型定义
 */
export type MCPCommandsType = typeof mcpCommands;
export type FileCommandsType = typeof fileCommands;
export type WorkspaceCommandsType = typeof workspaceCommands;
export type AgentCommandsType = typeof agentCommands;
export type TerminalCommandsType = typeof terminalCommands;
export type SettingsCommandsType = typeof settingsCommands;
export type SystemCommandsType = typeof systemCommands;