import { app } from "electron";
import {
  electronData,
  taskHistory,
  AppSetting,
  DataList,
  ENV_CONFIG,
} from "../../../common/data.js";
import { fs, path } from "zx";
import { appDataDir } from "../const.mjs";

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
      return fs.writeFile(
        path.join(appDataDir, this.KEY),
        JSON.stringify(this.data, null, 4)
      );
    },
  });
}

export const HTTPPORT = 16100;
export const MCPServerPORT = 16110;

await electronData.init();

if (ENV_CONFIG.initSync().PATH != "") {
  electronData.get().PATH = ENV_CONFIG.get().PATH;
}

electronData.get().port = HTTPPORT;
electronData.get().mcp_server_port = MCPServerPORT;

electronData.get().version = app.getVersion();

electronData.save();

await taskHistory.init();

export { electronData, taskHistory, AppSetting };
