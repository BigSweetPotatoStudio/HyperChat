import { call } from "./call";
import {
  AppSetting,
  ChatHistory,
  GPTS,
  GPT_MODELS,
  MCP_CONFIG,
  electronData,
  DataList,
} from "../../../common/data.js";

for (let data of DataList) {
  data.override({
    async inget() {
      return await call("readFile", [this.KEY]).catch((e) => "");
    },
    ingetSync() {
      throw new Error("Method not implemented.");
    },
    async insave() {
      return await call("writeFile", [
        this.KEY,
        JSON.stringify(this.data, null, 4),
      ]);
    },
  });
}

// 初始化配置
await electronData.init();
if (electronData.get().firstOpen) {
  MCP_CONFIG.save();
  GPT_MODELS.save();
  electronData.get().firstOpen = false;
  electronData.save();
}

export { AppSetting, ChatHistory, GPTS, GPT_MODELS, MCP_CONFIG, electronData };
