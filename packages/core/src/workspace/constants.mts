import * as path from "path";
import * as os from "os";

// 常量定义
export const CONSTANTS = {
  HYPERCHAT_DIR: '.hyperchat',
  CONFIG_FILES: {
    WORKSPACE: 'workspace.json',
    MCP: 'mcp.json',
    AGENT_CONFIG: 'config.json',
  },
  DIRECTORIES: {
    AGENTS: 'agents',
    CHAT_LOGS: 'chatlogs',
    KNOWLEDGE: 'knowledge',
    TEMP: 'temp',
  },
  FILE_PATTERNS: {
    JSON: '.json',
    HIDDEN_PREFIX: '.',
  },
  GLOBAL_PATH: path.join(os.homedir(), 'Documents', 'HyperChat', '.hyperchat'),
} as const;