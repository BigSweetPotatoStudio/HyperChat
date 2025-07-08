#!/usr/bin/env node
import { Logger } from "./log.mjs";
import "./first.mjs";
import { initHttp } from "./http.mjs";
import "./workspace/index.mjs";
// import { initMcpServer } from "./mcp/servers/express.mjs";

// await initMcpServer().catch((e) => {
//   Logger.error("initMcpServer", e);
// });
// 主入口文件，负责初始化 HTTP 服务和日志


// 启动 HTTP 服务，捕获并记录异常
await initHttp().catch(async (e) => {
  // await import("./workspace/index.mjs");
  Logger.info("initHttp error: ", e);
});
