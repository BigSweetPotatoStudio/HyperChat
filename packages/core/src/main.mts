#!/usr/bin/env node
import { Logger } from "./polyfills/index.mjs";
import "./first.mjs";
import { initHttp } from "./websocket.mjs";

// 主入口文件，负责初始化 HTTP 服务和日志

// import { createWindow } from "./mianWindow.mjs";

// 启动 HTTP 服务，捕获并记录异常
await initHttp().catch((e) => {
  Logger.info("initHttp error: ", e);
});
