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

async function createServer(workspacePath: string, globalPath?: string) {
  Logger.info(`Creating MCP server for FileTools at workspace path: ${workspacePath}${globalPath ? `, global path: ${globalPath}` : ''}`);

  const server = new McpServer({
    name: NAME,
    version: CONST.getVersion,
  });

  // 注册所有工具，传入工作区路径和全局路径
  registerReadFileTool(server, workspacePath, globalPath);
  registerWriteFileTool(server, workspacePath, globalPath);
  registerListDirectoryTool(server, workspacePath, globalPath);
  registerReplaceTool(server, workspacePath, globalPath);
  registerGlobTool(server, workspacePath, globalPath);
  registerSearchFileContentTool(server, workspacePath, globalPath);
  registerReadManyFilesTool(server, workspacePath, globalPath);
  registerRunShellCommandTool(server, workspacePath, globalPath);
  registerSaveMemoryTool(server, workspacePath, globalPath);

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