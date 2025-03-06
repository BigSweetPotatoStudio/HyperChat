import { app } from "electron";
import {
  electronData,
  taskHistory,
  AppSetting,
  DataList,
  ENV_CONFIG,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
} from "../../../common/data.js";

import { appDataDir } from "../const.mjs";
import { getMessageService } from "../mianWindow.mjs";
import { zx } from "../es6.mjs";
const { fs, path } = zx;
for (let data of DataList) {
  data.override({
    async inget() {
      if (await fs.exists(path.join(appDataDir, this.KEY))) {
        return await fs.readFile(path.join(appDataDir, this.KEY));
      } else {
        return "";
      }
    },
    ingetSync() {
      if (fs.existsSync(path.join(appDataDir, this.KEY))) {
        return fs.readFileSync(path.join(appDataDir, this.KEY));
      } else {
        return "";
      }
    },
    async insave() {
      try {
        getMessageService().sendToRenderer({
          type: "syncNodeToWeb",
          data: { key: this.KEY, data: this.data },
        });
      } catch (e) {}

      return fs.writeFile(
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

electronData.get().version = app.getVersion();

electronData.save();

taskHistory.initSync({ force: true });
