import Koa, { Context } from "koa";
import serve from "koa-static";
import cors from "@koa/cors";
import http from "http";
import path from "path";
import { Server as SocketIO } from "socket.io";
import log from "electron-log";

import { execFallback } from "./common/execFallback.mjs";
import { v4 as uuid } from "uuid";

import { koaBody } from "koa-body";
import { electronData } from "../../common/data";
import { Command, CommandFactory } from "./command.mjs";
import { appDataDir, userDataPath } from "./const.mjs";

import Router from "koa-router";
import Logger from "electron-log";
import { HTTPPORT } from "./common/data.mjs";

export function genRouter(c, prefix: string) {
  let functions = [];
  Object.getOwnPropertyNames(Object.getPrototypeOf(c))
    .filter((x) => x != "constructor")
    .forEach((name) => {
      functions.push(name);
    });

  let router = new Router({
    prefix: prefix,
  });

  for (let name of functions) {
    router.post(`/${name}`, async (ctx) => {
      console.log(name, ctx.request.body);
      try {
        // console.log(ctx.body);
        let res = await Command[name](...ctx.request.body);

        ctx.body = {
          code: 0,
          success: true,
          data: res,
        };
      } catch (e) {
        console.error(e);
        ctx.body = { success: false, code: 1, message: e.message };
      }
    });
  }
  return router;
}

export const model_route = genRouter(new CommandFactory(), "/api");

async function initWebsocket() {
  const app = new Koa() as any;
  app.use(cors() as any);
  app.use(
    koaBody({
      multipart: true, // 允许多部分（文件）上传
      formidable: {
        uploadDir: "./uploads", // 设置上传文件的目录
        keepExtensions: true, // 保留文件的扩展名
      },
    })
  );
  app.use(model_route.routes());

  Logger.info("serve: ", path.join(__dirname, "../web-build"));
  app.use(serve(path.join(__dirname, "../web-build")) as any);

  // 错误处理
  app.on("error", (err, ctx) => {
    console.error("Server error", err);
  });
  let server = http.createServer(app.callback());
  const io = new SocketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // pingInterval: 10 * 60 * 1000,
    maxHttpBufferSize: 1e10,
  });
  let PORT = HTTPPORT;
  PORT = await execFallback(PORT, (port) => {
    server.listen(port);
  });
  electronData.get().port = PORT;
  Logger.info("http server listen on: ", PORT);
  await electronData.save();

  io.on("error", (e) => {
    console.log("error: ", e);
  });
}

await initWebsocket().catch((e) => {
  Logger.info("initWebsocket error: ", e);
});
