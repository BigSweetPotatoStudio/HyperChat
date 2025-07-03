import { getDefaultEnvironment, os, shellPathSync } from "../es6.mjs";
import {
  LocalSetting,
  // MCP_CONFIG,
  // MCP_CONFIG_TYPE,
} from "../shared/data.mjs";

// export async function getMCPConfg(): Promise<{
//   mcpServers: { [s: string]: MCP_CONFIG_TYPE };
// }> {
//   let config = MCP_CONFIG.initSync();

//   // let obj: any = {};
//   // config.mcpServers = Object.assign(obj, config.mcpServers);

//   for (let key in config.mcpServers) {
//     if (config.mcpServers[key].hyperchat == null) {
//       config.mcpServers[key].hyperchat = {
//         config: {},
//       } as any;
//     }
//   }
//   return config;
// }

export function getMyDefaultEnvironment() {
  let env = Object.assign(getDefaultEnvironment(), process.env);
  LocalSetting.init();
  if (LocalSetting.get().PATH) {
    env.PATH = LocalSetting.get().PATH;
  } else {
    if (os.platform() != "win32") {
      env.PATH = shellPathSync();
    }
  }
  return env;
}
