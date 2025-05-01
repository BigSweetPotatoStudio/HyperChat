import { McpServer, SSEServerTransport } from "ts/es6.mjs";
import { configSchema, getConfig, NAME } from "./lib.mjs";
import { CONST } from "ts/polyfills/polyfills.mjs";
import { registerTool } from "./terminal.mjs";



let transport;
async function createServer(endpoint: string, response) {
  //   console.log("Received connection");
  // transport = new SSEServerTransport(endpoint, response);
  // // console.log("==================", getConfig().Web_Tools_Platform);
  const server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  registerTool(server);

  
  // await server.connect(transport);
  return server;
}

async function handlePostMessage(req, res) {
  //   console.log("Received message");
  await transport.handlePostMessage(req, res);
}

export const HyperTerminal = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
  configSchema: configSchema,
  // type: "streamableHttp",
};


