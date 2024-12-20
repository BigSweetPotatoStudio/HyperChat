import { fs, path } from "zx";
import { Command } from "../command.mjs";
import { app } from "electron";
import { appDataDir } from "../const.mjs";
import { Data } from "./dataConstructor.mjs";
import dayjs from "dayjs";
export const HTTPPORT = 16100;
export const MCPServerPORT = 16110;
export const electronData = new Data("electronData.json", {
  port: HTTPPORT,
  mcp_server_port: MCPServerPORT,
  version: app.getVersion(),
});

await electronData.init();
electronData.get().version = app.getVersion();
await electronData.save();
export const taskHistory = new Data("taskHistory.json", {
  history: [],
});
await taskHistory.init();

export class ClipboardHistoryData extends Data<{
  history: Array<{
    type: "text" | "image";
    content: string;
    time: string;
    name: string;
  }>;
  max: 300;
}> {
  constructor(Key: string) {
    super(Key, {
      history: [],
      max: 300,
    });
  }
  add(history: {
    type: "text" | "image";
    content: string;
    name: string;
    time: string;
  }) {
    this.get().history.unshift(history);
    if (this.get().history.length > this.get().max) {
      this.get().history.pop();
    }
    this.save();
  }
}

export const clipboardHistoryData = new ClipboardHistoryData(
  "clipboardHistory.json"
);
await clipboardHistoryData.init();
