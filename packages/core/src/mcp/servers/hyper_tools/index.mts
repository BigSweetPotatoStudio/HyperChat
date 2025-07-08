import { McpServer } from "../../../es6.mjs";
import { configSchema, NAME } from "./lib.mjs";
import { CONST } from "../../../const.mjs";
import { Logger } from "../../../log.mjs";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";



async function createServer(workspacePath: string) {
  // console.log(`Creating MCP server for HyperTools at workspace path: ${workspacePath}`);


  let server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  // Core only supports no_electron mode
  let { registerNoElectronTool } = await import("./no_electron.mjs");
  registerNoElectronTool(server);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  // 连接服务器传输
  await server.connect(serverTransport);

  return clientTransport;
}


export const HyperTools = {
  createServer,
  name: NAME,
  configSchema,
  type: "inMemory" as const,
};

export * from "./lib.mjs";
