#!/usr/bin/env node
import { Logger } from "ts/polyfills/index.mjs";
import "./first.mjs";
import { initHttp } from "./websocket.mjs";

// import { createWindow } from "./mianWindow.mjs";

await initHttp().catch((e) => {
  Logger.info("initHttp error: ", e);
});
