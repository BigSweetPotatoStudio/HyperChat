import { McpServer, SSEServerTransport } from "ts/es6.mjs";
import { configSchema, getConfig, NAME } from "./lib.mjs";
import { CONST } from "ts/polyfills/polyfills.mjs";

let transport;
async function createServer(endpoint: string, response) {
  //   console.log("Received connection");
  transport = new SSEServerTransport(endpoint, response);
  // console.log("==================", getConfig().Web_Tools_Platform);
  const server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });
  let { registerNoElectronTool } = await import("./no_electron.mjs");
  registerNoElectronTool(server);
  if (process.env.no_electron != "1") {
    if (getConfig().Web_Tools_Platform !== "none") {
      let { registerElectronTool } = await import("./electron.mjs");
      registerElectronTool(server);
    }
  }
  await server.connect(transport);
}

async function handlePostMessage(req, res) {
  //   console.log("Received message");
  await transport.handlePostMessage(req, res);
}

export const HyperTools = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
  configSchema: configSchema,
};

export * from "./lib.mjs";
