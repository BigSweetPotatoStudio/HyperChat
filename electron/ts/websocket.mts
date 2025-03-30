import Koa, { Context } from "koa";
import serve from "koa-static";
import cors from "@koa/cors";
import http from "http";
import path from "path";
import { Server as SocketIO } from "socket.io";
import { appDataDir, Logger } from "ts/polyfills/index.mjs";

import { execFallback } from "./common/execFallback.mjs";

import mount from "koa-mount";
import { koaBody } from "koa-body";
import { electronData } from "../../common/data";
import { Command, CommandFactory } from "./command.mjs";

import Router from "koa-router";
import { HTTPPORT } from "./common/data.mjs";
import { fs } from "./es6.mjs";
import crypto from "crypto";
import { getMessageService } from "./message_service.mjs";

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
    router.post(`/${name}`, async (ctx: Koa.Context) => {
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
  const uploadDir = "./uploads";
  const uploadDirPath = path.join(appDataDir, uploadDir);
  fs.ensureDirSync(uploadDirPath);
  fs.emptyDirSync(uploadDirPath);
  // console.log(prefix + "/uploads");
  router.post("/uploads", async (ctx) => {
    // 如果只上传一个文件，files.file就是文件对象
    const files = ctx.request.files;
    if (files && files.file) {
      const file = files.file;
      // 读取文件内容
      const fileContent = await fs.readFile(file.filepath);

      // 计算文件的SHA256哈希值
      const hash = crypto
        .createHash("sha256")
        .update(fileContent as any)
        .digest("hex");

      // 获取文件扩展名
      const ext = path.extname(file.originalFilename);

      // 新的文件名 = 哈希值 + 原始扩展名
      const newFilename = `${hash}${ext}`;
      const newPath = path.join(uploadDir, newFilename);
      let filepath = path.join(process.cwd(), newPath);
      // 重命名文件
      await fs.rename(file.filepath, newPath);

      ctx.status = 200;
      ctx.body = {
        data: {
          filename: newFilename,
          filepath: filepath,
          // url: url + "/" + newFilename,
          mimetype: file.mimetype,
        },
      };
    } else {
      throw new Error("No file uploaded");
    }
  });
  return router;
}

export async function initHttp() {
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
  const model_route = genRouter(
    new CommandFactory(),
    "/" + electronData.get().password + "/api"
  );
  app.use(model_route.routes());

  Logger.info("serve: ", path.join(__dirname, "../web-build"));
  Logger.info("password: ", electronData.initSync().password);
  app.use(
    mount(
      "/" + electronData.get().password,
      serve(path.join(__dirname, "../web-build")) as any
    )
  );

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
    server.listen(port, () => {});
  });
  electronData.get().port = PORT;
  Logger.info("http server listen on: ", PORT);
  await electronData.save();

  io.on("error", (e) => {
    console.log("error: ", e);
  });
  let main = io.of("/" + electronData.get().password + "/main-message");
  let terminalMsg = io.of(
    "/" + electronData.get().password + "/terminal-message"
  );
  getMessageService().init(main, terminalMsg);
}
