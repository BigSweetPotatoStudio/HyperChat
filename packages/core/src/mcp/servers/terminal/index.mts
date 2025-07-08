import { McpServer } from "../../../es6.mjs";
import { configSchema, NAME } from "./lib.mjs";
import { CONST } from "../../../const.mjs";
import { registerTool } from "./terminal.mjs";
import { Logger } from "../../../log.mjs";

interface Transport {
  handlePostMessage(req: unknown, res: unknown): Promise<void>;
}

let transport: Transport | null = null;

async function createServer(_endpoint: string, _response: unknown) {
  const server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  registerTool(server);
  
  Logger.info(`${NAME} MCP server created successfully`);
  return server;
}

async function handlePostMessage(req: unknown, res: unknown): Promise<void> {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    Logger.warn("No transport available for handling post message");
  }
}

export const HyperTerminal = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
  configSchema,
  type: "streamableHttp" as const,
} as const;


