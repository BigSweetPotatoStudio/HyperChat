import { McpServer, SSEServerTransport, StreamableHTTPServerTransport } from "ts/es6.mjs";
import { configSchema, getConfig, NAME } from "./lib.mjs";
import { CONST } from "ts/polyfills/polyfills.mjs";

let transport;
async function createServer() {

  const server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  if (process.env.no_electron != "1") {

    let { registerElectronTool } = await import("./electron.mjs");
    registerElectronTool(server);

  } else {
    let { registerNoElectronTool } = await import("./no_electron.mjs");
    registerNoElectronTool(server);
  }
  return server;
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
  // type: "streamableHttp",
};

export * from "./lib.mjs";
