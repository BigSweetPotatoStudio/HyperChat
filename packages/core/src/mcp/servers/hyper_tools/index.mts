import { McpServer } from "../../../es6.mjs";
import { configSchema, NAME } from "./lib.mjs";
import { CONST } from "../../../polyfills/polyfills.mjs";


async function createServer() {

  const server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  // Core only supports no_electron mode
  let { registerNoElectronTool } = await import("./no_electron.mjs");
  registerNoElectronTool(server);
  return server;
}


export const HyperTools = {
  createServer,

  name: NAME,
  url: ``,
  configSchema: configSchema,
  type: "streamableHttp",
};

export * from "./lib.mjs";
