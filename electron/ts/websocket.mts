import Koa, { Context } from "koa";
import serve from "koa-static";
import cors from "@koa/cors";
import http from "http";
import path from "path";
import { Server as SocketIO } from "socket.io";
import log from "electron-log";
import { fs, os } from "zx";
import { execFallback } from "./common/execFallback.mjs";
import { v4 as uuid } from "uuid";

import { koaBody } from "koa-body";
import { electronData, HTTPPORT } from "./common/data.mjs";
import { Command, CommandFactory } from "./command.mjs";
import { appDataDir, userDataPath } from "./const.mjs";

import Router from "koa-router";

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
await electronData.save();

fs.ensureDirSync(path.join(appDataDir, "downloadVideos"));
let fileClient = io.of("/fileClient");
// let fileResolve = io.of("/fileResolve");

fileClient.on("connection", (socket) => {
  console.log("fileClient已连接");
  let u = new URL(
    "http://localhost:" + electronData.get().port + socket.request.url
  );

  // 接收文件数据

  let filename = u.searchParams.get("uuid") + ".mp4";
  console.log("文件名: ", filename);
  // 创建一个可写流，将数据写入 output.mp4 文件
  let p = path.join(appDataDir, "downloadVideos", filename);
  let fileStream = fs.createWriteStream(p, { flags: "a" });

  // 当接收到消息时触发
  socket.on("message", (data) => {
    // console.log("接收到数据");
    // 将数据写入文件
    fileStream.write(data);
  });

  socket.on("downloaded", async () => {
    console.log("downloaded");

    socket.emit("downloaded");
    // 结束文件写入流
  });
  // 当连接关闭时触发
  socket.on("disconnect", async () => {
    console.log("连接已关闭");
    fileStream.end();
  });
});

io.on("error", (e) => {
  console.log("error: ", e);
});
