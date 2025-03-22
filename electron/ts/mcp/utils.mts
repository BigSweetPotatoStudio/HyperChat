import { getDefaultEnvironment, os, shellPathSync } from "ts/es6.mjs";
import {
  electronData,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
} from "../../../common/data";

export async function getConfg(): Promise<{
  mcpServers: { [s: string]: MCP_CONFIG_TYPE };
}> {
  let config = MCP_CONFIG.initSync();

  // let obj: any = {};
  // config.mcpServers = Object.assign(obj, config.mcpServers);

  for (let key in config.mcpServers) {
    if (config.mcpServers[key].hyperchat == null) {
      config.mcpServers[key].hyperchat = {
        config: {},
      } as any;
    }
  }
  return config;
}

export function getMyDefaultEnvironment() {
  let env = Object.assign(getDefaultEnvironment(), process.env);
  electronData.initSync();
  if (electronData.get().PATH) {
    env.PATH = electronData.get().PATH;
  } else {
    if (os.platform() != "win32") {
      env.PATH = shellPathSync();
    }
  }
  return env;
}
