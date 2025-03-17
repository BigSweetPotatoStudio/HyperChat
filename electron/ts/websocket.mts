import Koa, { Context } from "koa";
import serve from "koa-static";
import cors from "@koa/cors";
import http from "http";
import path from "path";
import { Server as SocketIO } from "socket.io";
import { Logger } from "ts/polyfills/index.mjs";

import { execFallback } from "./common/execFallback.mjs";
import { v4 as uuid } from "uuid";

import { koaBody } from "koa-body";
import { electronData } from "../../common/data";
import { Command, CommandFactory } from "./command.mjs";
import { appDataDir, userDataPath } from "./const.mjs";

import Router from "koa-router";
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
      let args = ctx.request.body;
      // console.log(name, args);
      try {
        if (name == "getHistory") {
          // log.info(name, args);
        } else {
          if (name == "writeFile") {
            Logger.info(
              name,
              args[0],
              "writeFile Data length: " + args[1].length
              // res
            );
          } else {
            Logger.info(
              name,
              args
              // res
            );
          }
        }
        let res = await Command[name](...args);
        ctx.body = {
          code: 0,
          success: true,
          data: res,
        };
      } catch (e) {
        Logger.error(e);
        ctx.body = { success: false, code: 1, message: e.message };
      }
    });
  }
  return router;
}

export const model_route = genRouter(new CommandFactory(), "/api");

let mainMsg = undefined;

export function genMainMsg() {
  if (mainMsg) {
    return mainMsg;
  } else {
    throw new Error("mainMsg not init");
  }
}
export const userSocketMap = new Map();
export let activeUser = undefined;
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
      jsonLimit: "1000mb",
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
  let main = io.of("/main-message");
  mainMsg = main;
  main.on("connection", (socket) => {
    Logger.info("用户已连接，socket ID:", socket.id);

    // 用户登录时记录关系
    socket.on("active", (userId) => {
      userSocketMap.set(userId, socket.id);
      activeUser = userId;
    });
    socket.on("disconnect", () => {
      // 遍历删除断开连接的socket
      for (const [userId, socketId] of userSocketMap.entries()) {
        if (socketId === socket.id) {
          userSocketMap.delete(userId);
        }
      }
    });
  });
}

await initWebsocket().catch((e) => {
  Logger.info("initWebsocket error: ", e);
});
