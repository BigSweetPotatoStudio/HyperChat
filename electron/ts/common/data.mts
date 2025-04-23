
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
const { fs, path } = zx;
for (let data of DataList) {
  data.override({

    inget() {
      if (fs.existsSync(path.join(appDataDir, this.KEY))) {
        return fs.readFileSync(path.join(appDataDir, this.KEY));
      } else {
        return "";
      }
    },
    insave() {
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
        JSON.stringify(this.format(this.data), null, 2)
      );
    },
  });
}


// export const MCPServerPORT = 16110;
AppSetting.initSync({ force: true });
VarList.initSync({ force: true });

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


if (VarList.get().data.length == 0) {
  VarList.get().data = VarList.get().data.concat(AppSetting.get().quicks.map(x => {
    return { name: x.label, value: x.quick, type: "variable", key: x.value, scope: "quick", variableType: "string" };
  }));
}
VarList.save();
// electronData.get().mcp_server_port = MCPServerPORT;

electronData.get().version = CONST.getVersion;

electronData.save();

