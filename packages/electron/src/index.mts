/**
 * Electron 包的主入口
 * 创建支持 electron 的 MCP 服务器
 */

// import { McpServer } from "../../core/src/es6.mjs";
// import { configSchema, NAME } from "../../core/src/mcp/servers/hyper_tools/lib.mjs";
// import { CONST } from "../../core/src/polyfills/index.mjs";
// import { registerElectronTool } from "./mcp/servers/hyper_tools/electron.mjs";

// export async function createElectronMcpServer() {
//   const server = new McpServer({
//     name: NAME,
//     version: CONST.getVersion,
//   });

//   registerElectronTool(server);
//   return server;
// }

// export const ElectronHyperTools = {
//   createServer: createElectronMcpServer,
//   name: NAME,
//   url: ``,
//   configSchema: configSchema,
//   type: "streamableHttp",
// };

// Re-export core functionality
// export * from "../../core/src/mcp/servers/hyper_tools/lib.mjs";
// export * from "./polyfills/index.mjs";