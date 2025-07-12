import * as path from "path";
import * as os from "os";

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
  GLOBAL_PATH: path.join(os.homedir(), 'Documents', 'HyperChat'),
} as const;