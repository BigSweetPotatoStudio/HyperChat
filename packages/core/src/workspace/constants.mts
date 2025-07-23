import * as path from "path";
import { getAppDataDir } from "../const.mjs";

// 常量定义
export const CONSTANTS = {
  HYPERCHAT_DIR: '.hyperchat',
  CONFIG_FILES: {
    SETTINGS: 'settings.jsonc',
    MCP: 'mcp.json',
    AGENT_CONFIG: 'agent.yaml',
  },
  DIRECTORIES: {
    AGENTS: 'agents',
    CHAT_LOGS: 'chatlogs',
    KNOWLEDGE: 'knowledge',
    TEMP: 'temp',
  },
  // 使用getter动态获取全局路径
  get GLOBAL_PATH(): string {
    return getAppDataDir();
  },
  get GLOBAL_HYPERCHAT_DIR_PATH(): string {
    return path.join(getAppDataDir(), '.hyperchat');
  },
} as const;