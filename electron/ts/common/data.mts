import { app } from "electron";
import { Data } from "./dataConstructor.mjs";
export const HTTPPORT = 16100;
export const MCPServerPORT = 16110;
export const electronData = new Data("electronData.json", {
  port: HTTPPORT,
  mcp_server_port: MCPServerPORT,
  version: app.getVersion(),
  appDataDir: "",
  logFilePath: "",
});

electronData.get().version = app.getVersion();
await electronData.save();
export const taskHistory = new Data("taskHistory.json", {
  history: [],
});
await taskHistory.init();

export const AppSetting = new Data("app_setting.json", {
  isAutoLauncher: false,
  firstOpen: true,
  webdav: {
    url: "",
    username: "",
    password: "",
    baseDirName: "",
  },
  PATH: "",
});
