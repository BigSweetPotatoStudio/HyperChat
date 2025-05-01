
import {
  electronData,
  AppSetting,
  DataList,
  ENV_CONFIG,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
  VarList,
} from "../../../common/data.js";

import { appDataDir, CONST } from "ts/polyfills/index.mjs";

import { zx } from "../es6.mjs";
import { getMessageService } from "../message_service.mjs";
import { cat } from "@xenova/transformers";
const { fs, path } = zx;
for (let data of DataList) {
  data.override({
    async init() {

      try {
        if (await fs.exists(path.join(appDataDir, this.KEY))) {
          this.localStorage = await fs.readJSON(path.join(appDataDir, this.KEY));
        } else {
          this.localStorage = {};
        }
      } catch (e) {
        this.localStorage = {};
      }
      this.data = this.options.formatInit(Object.assign({}, this.data, this.localStorage));
      return this.data;
    },
    initSync() {
      try {
        if (fs.existsSync(path.join(appDataDir, this.KEY))) {
          this.localStorage = fs.readJsonSync(path.join(appDataDir, this.KEY));
        } else {
          this.localStorage = {};
        }
      } catch (e) {
        this.localStorage = {};
      }
      this.data = this.options.formatInit(Object.assign({}, this.data, this.localStorage));
      return this.data;
    },
    async save() {
      try {
        if (this.KEY == "chat_history.json") {
        } else {
          getMessageService().sendAllToRenderer({
            type: "syncNodeToWeb",
            data: { key: this.KEY, data: this.data },
          });
        }
      } catch (e) { }

      return await fs.writeFile(
        path.join(appDataDir, this.KEY),
        JSON.stringify(this.options.formatSave(this.data), null, 2)
      );
    },
    saveSync() {
      try {
        if (this.KEY == "chat_history.json") {
        } else {
          getMessageService().sendAllToRenderer({
            type: "syncNodeToWeb",
            data: { key: this.KEY, data: this.data },
          });
        }
      } catch (e) { }

      return fs.writeFileSync(
        path.join(appDataDir, this.KEY),
        JSON.stringify(this.options.formatSave(this.data), null, 2)
      );
    }
  });
}


// export const MCPServerPORT = 16110;
AppSetting.initSync({ force: true });

electronData.initSync({ force: true });
electronData.get().webdav.url = electronData.get().webdav.url || AppSetting.get().webdav.url;
electronData.get().webdav.password = electronData.get().webdav.password || AppSetting.get().webdav.password;
electronData.get().webdav.username = electronData.get().webdav.username || AppSetting.get().webdav.username;
electronData.get().webdav.baseDirName = electronData.get().webdav.baseDirName || AppSetting.get().webdav.baseDirName;

electronData.get().runTask = electronData.get().runTask == null ? true : electronData.get().runTask;
electronData.get().isLoadClaudeConfig = electronData.get().isLoadClaudeConfig == null ? true : electronData.get().isLoadClaudeConfig;
electronData.get().platform = process.platform;

if (ENV_CONFIG.initSync({ force: true }).PATH != "") {
  electronData.get().PATH = ENV_CONFIG.get().PATH;
  ENV_CONFIG.get().PATH = "";
  ENV_CONFIG.save();
}


if (AppSetting.get().quicks.length > 0 && !fs.existsSync(path.join(appDataDir, VarList.KEY))) {
  VarList.initSync({ force: true });
  VarList.get().data = VarList.get().data.concat(AppSetting.get().quicks.map(x => {
    return { name: x.label, value: x.quick, variableStrategy: "lazy", key: x.value, scope: "quick", variableType: "string" };
  }));
  AppSetting.get().quicks = [];
  VarList.save();
}

AppSetting.save();
// electronData.get().mcp_server_port = MCPServerPORT;

electronData.get().version = CONST.getVersion;

electronData.save();

