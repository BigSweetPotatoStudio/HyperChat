import { McpServer } from "../../../es6.mjs";
import { configSchema, NAME } from "./lib.mjs";
import { CONST } from "../../../const.mjs";
import { registerTool } from "./terminal.mjs";
import { Logger } from "../../../log.mjs";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";


async function createServer(workspacePath: string, globalPath?: string) {
  // console.log(`Creating MCP server for HyperTerminal at workspace path: ${workspacePath}`);


  let server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  registerTool(server, workspacePath);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  // 连接服务器传输
  await server.connect(serverTransport);

  return clientTransport;
}




export const HyperTerminal = {
  createServer,
  name: NAME,
  configSchema,
  type: "inMemory" as const,
};


