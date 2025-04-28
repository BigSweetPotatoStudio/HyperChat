import { call, msg_receive } from "./call";
import {
  AppSetting,
  ChatHistory,
  Agents,
  GPT_MODELS,
  MCP_CONFIG,
  electronData,
  DataList,
  MCP_CONFIG_TYPE,
} from "../../../common/data.js";
import { e } from "./service";

for (let item of DataList) {
  item.override({
    async init() {
      try {

        this.localStorage = await call("readJSON", [this.KEY]);

      } catch (e) {
        this.localStorage = {};
      }
      this.data = Object.assign({}, this.data, this.localStorage);
      return this.data;
    },
    initSync() {
      throw new Error("saveSync is not supported in web");
    },
    async save() {
      return await call("writeJSON", [
        this.KEY,
        this.format(this.data),
      ]);
    },
    saveSync() {
      throw new Error("saveSync is not supported in web");
    },

  });
}

// 初始化配置
// await electronData.init();
// if (electronData.get().firstOpen) {
// await MCP_CONFIG.init();
// MCP_CONFIG.save();
// await GPT_MODELS.init();
// GPT_MODELS.save();
//   electronData.get().firstOpen = false;
//   await electronData.save();
// }

msg_receive("message-from-main", (msg) => {
  if (msg.type == "syncNodeToWeb") {
    let c = DataList.find((x) => x.KEY == msg.data.key);
    if (c) {
      // if (c.KEY == "ChatHistory.json") {
      // let newData = msg.data.data;

      // for (let x of newData.data) {
      //   if (c.get().data.find((y) => y.key == x.key) == null) {
      //     c.get().data.push(x);
      //   } else {
      //     break;
      //   }
      // }
      // } else {
      Object.assign(c.get(), msg.data.data);
      // }
    } else {
      console.error("syncNodeToWeb", msg.data.key, "not found");
    }
  }
});

// await ChatHistory.init();
// try {
//   if (
//     !electronData.get().updated[electronData.get().version] &&
//     electronData.get().version == "0.3.0"
//   ) {
//     // 更新配置
//     let h = await ChatHistory.init();
//     for (let d of h.data) {
//       d.dateTime = d.dateTime || Date.now();
//       for (let m of d.messages) {
//         m.content_tool_calls = m.tool_calls;
//       }
//     }
//     await ChatHistory.save();
//     //
//     electronData.get().updated[electronData.get().version] = true;
//     await electronData.save();
//   }
// } catch (e) {}
