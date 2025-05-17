import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server as SocketIO } from "socket.io";
import { appDataDir, Logger } from "ts/polyfills/index.mjs";

import { execFallback } from "./common/execFallback.mjs";

import multer from "multer";
import bodyParser from "body-parser";
import { electronData } from "../../common/data";
import { Command, CommandFactory } from "./command.mjs";

import { Router } from "express";

import { fs } from "./es6.mjs";
import crypto from "crypto";
import { getMessageService } from "./message_service.mjs";
import { Config } from "./const.mjs";
import { PassThrough } from "stream";
import { sleep } from "./common/util.mjs";

const uploadDir = "./uploads";
const uploadDirPath = path.join(appDataDir, uploadDir);
fs.ensureDirSync(uploadDirPath);
fs.emptyDirSync(uploadDirPath);

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });

export function genRouter(c) {
  let functions = [];
  Object.getOwnPropertyNames(Object.getPrototypeOf(c))
    .filter((x) => x != "constructor")
    .forEach((name) => {
      functions.push(name);
    });
  console.log("Command functions: ", functions);
  let router = Router();
  for (let name of functions) {
    // 不再添加前缀，因为在app.use(apiPrefix, model_route)中已经添加了前缀
    router.post(`/${name}`, async (req: Request, res: Response, next: NextFunction) => {
      let args = req.body;
      try {
        if (name == "getHistory") {
          // log.info(name, args);
        } else {
          if (name == "writeFile") {
            Logger.info(
              name,
              args[0],
              "writeFile Data length: " + args[1].length
            );
          } else {
            Logger.info(
              name,
              args
            );
          }
        }

        // 调用Command方法处理请求
        let result = await Command[name](...args);

        // 发送JSON响应
        res.json({
          code: 0,
          success: true,
          data: result,
        });
      } catch (e) {
        // 错误处理
        Logger.error(e);
        res.status(500).json({
          success: false,
          code: 1,
          message: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    });
  }
  // 文件上传处理
  router.post(`/uploads`, upload.single('file'), async (req: Request, res: Response) => {
    try {
      // 使用multer上传的文件会被添加到req.file
      if (req.file) {
        const file = req.file;
        // 读取文件内容
        const fileContent = await fs.readFile(file.path);

        // 计算文件的SHA256哈希值
        const hash = crypto
          .createHash("sha256")
          .update(fileContent as any)
          .digest("hex");

        // 获取文件扩展名
        const ext = path.extname(file.originalname);

        // 新的文件名 = 哈希值 + 原始扩展名
        const newFilename = `${hash}${ext}`;
        let filepath = path.join(uploadDirPath, newFilename);
        // 重命名文件
        await fs.move(file.path, filepath, {
          overwrite: true,
        });

        res.status(200).json({
          data: {
            filename: newFilename,
            filepath: filepath,
            mimetype: file.mimetype,
          },
        });
      } else {
        throw new Error("No file uploaded");
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

let apiPrefix = "/" + encodeURI(electronData.get().password) + "/api";

// 代理中间件
function proxyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith(apiPrefix + "/ai")) {
    // 处理代理请求
    (async () => {
      try {
        const requestBody = req.body;
        let baseURL = req.headers["baseurl"]
          ? decodeURIComponent(req.headers["baseurl"] as string)
          : '';

        if (process.env.NODE_ENV !== "production") {
          console.log("baseURL: ", baseURL);
        }

        if (!baseURL) {
          return res.status(400).json({ success: false, message: "baseURL is required" });
        }        // 处理headers - 将headers处理成Record<string, string>格式
        let customHeaders: Record<string, string> = {};

        // 构建新的headers对象
        for (const key in req.headers) {
          if (req.headers[key] !== undefined &&
            key !== 'content-length' &&
            key !== 'origin' &&
            key !== 'host' &&
            key !== 'baseurl') {
            const value = req.headers[key];
            if (typeof value === 'string') {
              customHeaders[key] = value;
            } else if (Array.isArray(value) && value.length > 0) {
              customHeaders[key] = value[0];
            }
          }
        }

        // 添加自定义headers
        customHeaders["HTTP-Referer"] = "https://hyperchat.dadigua.men";
        customHeaders["X-Title"] = "HyperChat";

        // 处理URL
        if (baseURL.endsWith("/")) {
          baseURL = baseURL.slice(0, -1);
        }
        baseURL = baseURL + req.path.replace(apiPrefix + "/ai", "");

        // 发起请求
        const response = await fetch(baseURL, {
          method: req.method,
          headers: customHeaders,
          body: (req.method === "GET" || req.method === "HEAD") ? undefined : JSON.stringify(requestBody),
        });

        // 检查内容类型，确定是否为SSE
        const contentType = response.headers.get("Content-Type");
        const isSSE = contentType && contentType.includes("text/event-stream");

        // 设置响应头
        res.status(response.status);
        res.setHeader("Content-Type", contentType || "application/json");

        if (process.env.NODE_ENV !== "production") {
          console.log("proxy", isSSE, contentType);
        }

        if (isSSE) {
          // 处理SSE流
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");

          // 获取响应体的可读流
          const reader = response.body.getReader();
          const stream = new PassThrough();

          // 将PassThrough流连接到响应
          stream.pipe(res);

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
        } else {
          // 非SSE请求按原方式处理
          const data = await response.text();
          res.send(data);
        }
      } catch (error) {
        Logger.error("Proxy error:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    })();
  } else {
    next();
  }
}

electronData.initSync();
export async function initHttp() {
  const app = express();

  // 配置中间件
  app.use(cors());
  app.use(bodyParser.json({ limit: "1000mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));

  const model_route = genRouter(new CommandFactory());
  // 在apiPrefix路径下挂载路由
  app.use(apiPrefix, model_route);

  // 静态文件服务
  Logger.info("serve: ", path.join(__dirname, "../web-build"));
  Logger.info("password: ", electronData.get().password);

  const staticOptions = {
    maxAge: 0, // 禁用 HTML 文件缓存
    setHeaders: (res, filePath) => {
      // 为 HTML 文件设置特殊的缓存头
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  };

  // 静态资源
  app.use("/" + electronData.get().password, express.static(path.join(__dirname, "../web-build"), staticOptions));
  app.use("/" + electronData.get().password + "/temp", express.static(path.join(appDataDir, "temp")));

  // 代理
  app.use(proxyMiddleware);
  // 错误处理中间件
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Server error", err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  });

  // 创建HTTP服务器
  let server = http.createServer(app);
  const io = new SocketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    // pingInterval: 10 * 60 * 1000,
    maxHttpBufferSize: 1e10,
  });

  // 开始监听端口
  let PORT = Config.port;
  PORT = await execFallback(PORT, (port) => {
    server.listen(port, () => { });
  });
  Config.port = PORT;
  Logger.info("http server listen on: ", PORT);
  await electronData.saveSync();

  // 错误处理
  io.on("error", (e) => {
    console.log("error: ", e);
  });

  // 创建Socket.IO命名空间
  let main = io.of("/" + electronData.get().password + "/main-message");
  let terminalMsg = io.of("/" + electronData.get().password + "/terminal-message");
  getMessageService().init(main, terminalMsg);
}
