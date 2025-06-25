import { McpServer } from "src/es6.mjs";
import { configSchema, NAME } from "./lib.mjs";
import { CONST } from "src/polyfills/polyfills.mjs";
import { registerTool } from "./terminal.mjs";



let transport: any;
async function createServer(_endpoint: string, _response: any) {
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

async function handlePostMessage(req: any, res: any) {
  //   console.log("Received message");
  if (transport) {
    await transport.handlePostMessage(req, res);
  }
}

export const HyperTerminal = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
  configSchema: configSchema,
  type: "streamableHttp",
};


