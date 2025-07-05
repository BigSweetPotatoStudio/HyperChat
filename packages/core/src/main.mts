#!/usr/bin/env node
import { Logger } from "./log.mjs";
import "./first.mjs";
import { initHttp } from "./http.mjs";
import "./workspace/index.mjs";

// 主入口文件，负责初始化 HTTP 服务和日志


// 启动 HTTP 服务，捕获并记录异常
await initHttp().catch((e) => {
  Logger.info("initHttp error: ", e);
});
