import { call, msg_receive } from "./call";
import {
  Data,
  DataList,
} from "../../../shared/data.mjs";

/**
 * Initializes the data object by loading data from storage.
 * It attempts to read a JSON file from a path specified by `this.KEY`.
 * If reading fails, it initializes with an empty object.
 * Finally, it merges the loaded data with the default data structure.
 * @returns {Promise<any>} A promise that resolves with the initialized data.
 */
Data.prototype["_init"] = async function ({ } = {}) {
  try {
    this.localStorage = await call("readJSON", { path: this.KEY });
  } catch (e) {
    this.localStorage = {};
  }
  this.data = this.options.formatInit(Object.assign({}, this.data, this.localStorage));
  return this.data;
}

/**
 * Saves the current state of the data object to storage.
 * It writes the data as a JSON file to the path specified by `this.KEY`.
 * @returns {Promise<any>} A promise that resolves when the data is saved.
 */
Data.prototype["_save"] = async function () {
  return await call("writeJSON", {
    path: this.KEY,
    obj: this.options.formatSave(this.data),
  });
}


// The following block is an example of an initial setup process.
// It checks if this is the first time the app is opened and initializes
// necessary configurations like MCP_CONFIG and GPT_MODELS.
// await electronData.init();
// if (electronData.get().firstOpen) {
//   await MCP_CONFIG.init();
//   MCP_CONFIG.save();
//   await GPT_MODELS.init();
//   GPT_MODELS.save();
//   electronData.get().firstOpen = false;
//   await electronData.save();
// }

/**
 * Listens for messages from the main process (backend) to sync data.
 */
msg_receive("message-from-main", (msg) => {
  // Check if the message is for syncing data from Node.js to the web view.
  if (msg.type == "syncNodeToWeb") {
    // Find the corresponding data object in the DataList.
    let c = DataList.find((x) => x.KEY == msg.data.key);
    if (c) {
      // The commented-out logic below is an example of special handling for chat history,
      // where you might want to merge new messages instead of overwriting the whole object.
      // if (c.KEY == "ChatHistory.json") {
      //   let newData = msg.data.data;
      //   for (let x of newData.data) {
      //     if (c.get().data.find((y) => y.key == x.key) == null) {
      //       c.get().data.push(x);
      //     } else {
      //       break;
      //     }
      //   }
      // } else {
      // For other data types, simply merge the new data.
      Object.assign(c.get(), msg.data.data);
      // }
    } else {
      console.error("syncNodeToWeb: data key not found", msg.data.key);
    }
  }
});

// The following block is an example of a data migration script.
// It checks for a specific app version and performs necessary updates
// to the data structure, like adding new fields or transforming existing ones.
// await ChatHistory.init();
// try {
//   if (
//     !electronData.get().updated[electronData.get().version] &&
//     electronData.get().version == "0.3.0"
//   ) {
//     // Update chat history data for version 0.3.0.
//     let h = await ChatHistory.init();
//     for (let d of h.data) {
//       d.dateTime = d.dateTime || Date.now();
//       for (let m of d.messages) {
//         m.content_tool_calls = m.tool_calls;
//       }
//     }
//     await ChatHistory.save();
//
//     // Mark this version as updated to prevent running the migration again.
//     electronData.get().updated[electronData.get().version] = true;
//     await electronData.save();
//   }
// } catch (e) {}
