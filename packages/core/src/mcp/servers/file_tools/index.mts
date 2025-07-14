import { McpServer } from "../../../es6.mjs";
import { configSchema, NAME } from "./lib.mjs";
import { CONST } from "../../../const.mjs";
import { Logger } from "../../../log.mjs";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  registerReadFileTool,
  registerWriteFileTool,
  registerListDirectoryTool,
  registerReplaceTool,
  registerGlobTool,
  registerSearchFileContentTool,
  registerReadManyFilesTool,
  registerRunShellCommandTool,
  registerSaveMemoryTool
} from "./tools/index.mjs";

async function createServer(workspacePath: string) {
  Logger.info(`Creating MCP server for FileTools at workspace path: ${workspacePath}`);

  const server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  // 注册所有工具
  registerReadFileTool(server, workspacePath);
  registerWriteFileTool(server, workspacePath);
  registerListDirectoryTool(server, workspacePath);
  registerReplaceTool(server, workspacePath);
  registerGlobTool(server, workspacePath);
  registerSearchFileContentTool(server, workspacePath);
  registerReadManyFilesTool(server, workspacePath);
  registerRunShellCommandTool(server, workspacePath);
  registerSaveMemoryTool(server, workspacePath);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  
  // 连接服务器传输
  await server.connect(serverTransport);
  
  Logger.info(`FileTools MCP server started successfully with ${9} tools`);
  
  return clientTransport;
}

export const FileTools = {
  createServer,
  name: NAME,
  configSchema,
  type: "inMemory" as const,
};