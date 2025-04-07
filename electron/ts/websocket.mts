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

import { fs } from "./es6.mjs";
import crypto from "crypto";
import { getMessageService } from "./message_service.mjs";
import { Config } from "./const.mjs";
import { threadId } from "worker_threads";
import { PassThrough } from "stream";
import { sleep } from "./common/util.mjs";

const uploadDir = "./uploads";
const uploadDirPath = path.join(appDataDir, uploadDir);
fs.ensureDirSync(uploadDirPath);
fs.emptyDirSync(uploadDirPath);

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
      // const newPath = path.join(uploadDir, newFilename);
      let filepath = path.join(uploadDirPath, newFilename);
      // 重命名文件
      await fs.move(file.filepath, filepath, {
        overwrite: true,
      });

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

let prefix = "/" + encodeURI(electronData.get().password) + "/api";

async function proxy(ctx: Context, next: () => Promise<any>) {
  if (ctx.path.startsWith(prefix + "/proxy")) {
    // console.log("proxy", ctx.path, ctx.request.headers);
    try {
      const requestBody = ctx.request.body;
      let baseURL = decodeURIComponent(
        ctx.request.headers["baseurl"] as string
      );
      console.log("baseURL: ", baseURL);
      if (!baseURL) {
        ctx.status = 400;
        ctx.body = { success: false, message: "baseURL is required" };
        return;
      }

      let headers = {
        "HTTP-Referer": "https://hyperchat.dadigua.men", // Optional. Site URL for rankings on openrouter.ai.
        "X-Title": "HyperChat",
        "Content-Type": "application/json",
        // ...(ctx.request.headers as any),·
        Authorization: ctx.request.headers["authorization"],
      };
      if (baseURL.endsWith("/")) {
        baseURL = baseURL.slice(0, -1);
      }
      baseURL = (baseURL as string) + ctx.path.replace(prefix + "/proxy", "");
      // console.log("proxy", baseURL, headers, requestBody);
      // 发起请求，但不立即解析响应体
      const response = await fetch(baseURL, {
        method: ctx.method,
        headers: headers,
        body: JSON.stringify(requestBody),
      });
      // console.log("proxy response", response.status, response.headers);
      // 检查内容类型，确定是否为SSE
      const contentType = response.headers.get("Content-Type");
      const isSSE = contentType && contentType.includes("text/event-stream");

      // 设置响应状态码和头部
      ctx.status = response.status;
      ctx.set("Content-Type", contentType || "application/json");
      console.log("proxy", isSSE, contentType);
      if (isSSE) {
        // 处理SSE流
        ctx.set("Content-Type", "text/event-stream");
        ctx.set("Cache-Control", "no-cache");
        ctx.set("Connection", "keep-alive");

        // 获取响应体的可读流
        const reader = response.body.getReader();

        const stream = new PassThrough();

        ctx.status = 200;
        ctx.body = stream;

        await next();
        (async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                stream.end();
                break;
              }
              stream.write(value);
            }
          } catch (err) {
            Logger.error("SSE streaming error:", err);
            stream.end();
          }
        })();
      } else {
        // 非SSE请求按原方式处理
        const data = await response.text();
        ctx.body = data;
      }
    } catch (error) {
      Logger.error("Proxy error:", error);
      ctx.status = 500;
      ctx.body = { success: false, message: error.message };
    }
  } else {
    next();
  }
}

electronData.initSync();
export async function initHttp() {
  const app = new Koa() as any;
  app.use(cors() as any);
  app.use(
    koaBody({
      multipart: true, // 允许多部分（文件）上传
      formidable: {
        uploadDir: uploadDirPath, // 设置上传文件的目录
        keepExtensions: true, // 保留文件的扩展名
      },
      jsonLimit: "1000mb",
    })
  );

  const model_route = genRouter(new CommandFactory(), prefix);
  app.use(model_route.routes());

  Logger.info("serve: ", path.join(__dirname, "../web-build"));
  Logger.info("password: ", electronData.get().password);
  app.use(
    mount(
      "/" + electronData.get().password,
      serve(path.join(__dirname, "../web-build")) as any
    )
  );
  app.use(proxy);
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
  let PORT = Config.port;
  PORT = await execFallback(PORT, (port) => {
    server.listen(port, () => {});
  });
  Config.port = PORT;
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
