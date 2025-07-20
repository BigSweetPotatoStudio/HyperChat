import * as path from "path";
import * as os from "os";
import { appDataDir } from "../const.mjs";

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
  GLOBAL_PATH: appDataDir,
  GLOBAL_HYPERCHAT_DIR_PATH: path.join(appDataDir, '.hyperchat'),
} as const;