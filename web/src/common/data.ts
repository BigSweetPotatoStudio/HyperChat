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
    async inget() {
      return await call("readFile", [this.KEY]).catch((e) => "");
    },
    async insave() {
      return await call("writeFile", [
        this.KEY,
        JSON.stringify(this.format(this.data), null, 2),
      ]);
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
      if (c.KEY == "ChatHistory.json") {
        // let newData = msg.data.data;

        // for (let x of newData.data) {
        //   if (c.get().data.find((y) => y.key == x.key) == null) {
        //     c.get().data.push(x);
        //   } else {
        //     break;
        //   }
        // }
      } else {
        Object.assign(c.get(), msg.data.data);
      }
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
