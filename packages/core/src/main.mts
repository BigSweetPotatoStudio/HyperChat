#!/usr/bin/env node
import { Logger } from "./log.mjs";
import "./first.mjs";

import { initHttp } from "./http.mjs";
import { WorkspaceManager } from "./workspace/workspaceManager.mjs";

export const workspaceManager = new WorkspaceManager();

await workspaceManager.initialize();
// 主入口文件，负责初始化 HTTP 服务和日志

// 等待初始化完成


// 启动 HTTP 服务，捕获并记录异常
await initHttp().catch(async (e) => {
  // await import("./workspace/index.mjs");
  Logger.info("initHttp error: ", e);
});
