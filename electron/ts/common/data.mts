
import {
  electronData,
  taskHistory,
  AppSetting,
  DataList,
  ENV_CONFIG,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
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
        getMessageService().sendAllToRenderer({
          type: "syncNodeToWeb",
          data: { key: this.KEY, data: this.data },
        });
      } catch (e) {}

      return fs.writeFileSync(
        path.join(appDataDir, this.KEY),
        JSON.stringify(this.data, null, 4)
      );
    },
  });
}

export const HTTPPORT = 16100;
export const MCPServerPORT = 16110;

electronData.initSync({ force: true });

electronData.get().platform = process.platform;

if (ENV_CONFIG.initSync({ force: true }).PATH != "") {
  electronData.get().PATH = ENV_CONFIG.get().PATH;
  ENV_CONFIG.get().PATH = "";
  ENV_CONFIG.save();
}

electronData.get().port = HTTPPORT;
electronData.get().mcp_server_port = MCPServerPORT;

electronData.get().version = CONST.getVersion;

electronData.save();

taskHistory.initSync({ force: true });
