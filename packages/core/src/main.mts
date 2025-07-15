#!/usr/bin/env node
import { Logger } from "./log.mjs";
import "./first.mjs";

import { initHttp } from "./http.mjs";
import { getWorkspaceManager } from "./workspace/index.mjs";



await getWorkspaceManager().initialize(process.cwd());
await getWorkspaceManager().start();

// 启动 HTTP 服务，捕获并记录异常
await initHttp().catch(async (e) => {
  // await import("./workspace/index.mjs");
  Logger.info("initHttp error: ", e);
});
