import { v4 } from "uuid";
import { Data } from "../base/data.mjs";

// 应用设置数据，包含主题、WebDAV、MCP超时等
export const AppSetting = new Data("app_setting.json", {
  isAutoLauncher: false,
  // webdav: { // 废弃⚠️ => electronData
  //   url: "",
  //   username: "",
  //   password: "",
  //   baseDirName: "",
  //   // autoSync: false, // 废弃⚠️ => electronData
  // },
  darkTheme: false,
  mcpCallToolTimeout: 60,
  defaultAllowMCPs: undefined as string[] | undefined,
  // quicks: [] as Array<{  // 废弃⚠️
  //   value: string;
  //   label: string;
  //   quick: string;
  // }>,
});

// Electron 相关数据，包含端口、密码、版本、窗口大小等
export const LocalSetting = new Data(
  "electronData.json",
  {
    // port: 0,
    password: "123456",
    // mcp_server_port: 0,
    version: "",
    appDataDir: "",
    logFilePath: "",
    PATH: "",
    platform: "",
    firstOpen: true,
    downloaded: {} as {
      [s: string]: boolean;
    },
    updated: {} as {
      [s: string]: boolean;
    },
    autoSync: false,
    webdav: {
      url: "",
      username: "",
      password: "",
      baseDirName: "",
    },
    uuid: v4(),
    runTask: false,
    isDeveloper: false,
    isLoadClaudeConfig: true,
    lastSyncTime: 0,
    windowSize: {
      width: 1440,
      height: 900,
    },
    browserNetworkSetting: "server-proxy",
    closeAction: undefined as "minimize" | "exit" | undefined,
    darkTheme: false, // 添加主题设置
  },
  {
    sync: false,
  }
);

export const ENV_CONFIG = new Data(
  "env.json",
  {
    PATH: "",
  },
  {
    sync: false,
  }
);

export const TEMP_FILE = new Data(
  "temp_file.json",
  {
    mcpExtensionDataJS: "",
  },
  {
    sync: false,
  }
);