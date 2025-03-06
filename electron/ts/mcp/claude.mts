import path from "path";
import { zx } from "../es6.mjs";
const { os } = zx;

const homeDir = os.homedir();
const platformPaths = {
  win32: {
    baseDir: process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
    vscodePath: path.join("Code", "User", "globalStorage"),
  },
  darwin: {
    baseDir: path.join(homeDir, "Library", "Application Support"),
    vscodePath: path.join("Code", "User", "globalStorage"),
  },
  linux: {
    baseDir: process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config"),
    vscodePath: path.join("Code/User/globalStorage"),
  },
};

const platform = process.platform as keyof typeof platformPaths;
const { baseDir, vscodePath } = platformPaths[platform];

// Define client paths using the platform-specific base directories
export const clientPaths = {
  claude: path.join(baseDir, "Claude", "claude_desktop_config.json"),
  // cline: path.join(baseDir, vscodePath, "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
  // "roo-cline": path.join(baseDir, vscodePath, "rooveterinaryinc.roo-cline", "settings", "cline_mcp_settings.json")
};
