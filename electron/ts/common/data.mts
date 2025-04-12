
import {
  electronData,
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
        JSON.stringify(this.format(this.data), null, 2)
      );
    },
  });
}


// export const MCPServerPORT = 16110;
AppSetting.initSync({ force: true });

electronData.initSync({ force: true });
electronData.get().webdav.url = electronData.get().webdav.url || AppSetting.get().webdav.url;
electronData.get().webdav.password = electronData.get().webdav.password || AppSetting.get().webdav.password;
electronData.get().webdav.username = electronData.get().webdav.username || AppSetting.get().webdav.username;
electronData.get().webdav.baseDirName = electronData.get().webdav.baseDirName || AppSetting.get().webdav.baseDirName;


electronData.get().platform = process.platform;

if (ENV_CONFIG.initSync({ force: true }).PATH != "") {
  electronData.get().PATH = ENV_CONFIG.get().PATH;
  ENV_CONFIG.get().PATH = "";
  ENV_CONFIG.save();
}


// electronData.get().mcp_server_port = MCPServerPORT;

electronData.get().version = CONST.getVersion;

electronData.save();

