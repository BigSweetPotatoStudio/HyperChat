/**
 * HyperChat HTTP 服务器和 WebSocket 服务模块
 * 
 * 核心功能：
 * - 启动 Express HTTP 服务器，提供 REST API
 * - 集成 Socket.IO WebSocket 服务，支持实时通信
 * - 处理文件上传和静态资源服务
 * - 提供 MCP（模型上下文协议）路由网关
 * - 统一的 API 路由生成和错误处理
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server as SocketIO } from "socket.io";
import { appDataDir, Logger } from "./polyfills/index.mjs";

import { execFallback } from "./common/execFallback.mjs";

import multer from "multer";
import bodyParser from "body-parser";
import { electronData } from "./shared/data.mjs";
import { Command } from "./command.mjs";

import { Router } from "express";

import { fs } from "./es6.mjs";
import crypto from "crypto";
import { getMessageService } from "./message_service.mjs";
import { Config } from "./const.mjs";
import { PassThrough } from "stream";

import { registers, refreshRoutes } from "./mcpGateWay.mjs";
import { createAISDKRouter } from "./ai_sdk_routes.mjs";

// 文件上传目录配置
const uploadDir = "./uploads";
const uploadDirPath = path.join(appDataDir, uploadDir);
fs.ensureDirSync(uploadDirPath);
fs.emptyDirSync(uploadDirPath); // 启动时清空上传目录

/**
 * Multer 文件上传配置
 * 用于处理 HTTP 文件上传请求
 */
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDirPath);
  },
  filename: function (_req, file, cb) {
    cb(null, file.originalname); // 保持原始文件名
  }
});
const upload = multer({ storage: storage });

/**
 * 动态路由生成器
 * 
 * 基于 Command 类的方法自动生成 REST API 路由
 * 每个 Command 方法对应一个 POST 接口
 * 
 * @param c - Command 类实例
 * @returns Express Router 实例
 */
export function genRouter(c: any) {
  // 获取 Command 类的所有方法名（排除构造函数）
  let functions: string[] = [];
  Object.getOwnPropertyNames(Object.getPrototypeOf(c))
    .filter((x) => x != "constructor")
    .forEach((name) => {
      functions.push(name);
    });

  let router = Router();

  // 为每个 Command 方法生成对应的 POST 路由
  for (let name of functions) {
    router.post(`/${name}`, async (req: Request, res: Response, _next: NextFunction) => {
      let args = req.body;
      try {
        // 日志记录（getHistory 方法不记录，避免日志过多）
        if (name == "getHistory") {
          // 跳过日志记录
        } else {
          if (name == "writeFile") {
            Logger.info(
              name,
              args[0],
              "writeFile Data length: " + args[1].length
            );
          } else {
            Logger.info(name, args);
          }
        }

        // 调用 Command 方法处理请求
        let result = await (Command[name as keyof typeof Command] as any)(args);

        // 返回统一格式的成功响应
        res.json({
          code: 0,
          success: true,
          data: result,
        });
      } catch (e: any) {
        // 统一错误处理
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

await electronData.init();
let prefix = "/" + encodeURI(electronData.get().password);
let apiPrefix = prefix + "/api";

// 代理中间件
function proxyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith(apiPrefix + "/ai")) {
    if (process.env.myEnv === "dev") {
      console.log("Proxy request:", req.method, req.url);
    }
    // 处理代理请求
    (async () => {
      try {
        const requestBody = req.body;
        let baseURL = req.headers["baseurl"]
          ? decodeURIComponent(req.headers["baseurl"] as string)
          : '';


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
              customHeaders[key] = value[0] ?? '';
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

        baseURL = baseURL + req.url.replace(apiPrefix + "/ai", "");
        if (process.env.myEnv === "dev") {
          console.log("baseURL: ", baseURL);
        }

        // 发起请求
        const response = await fetch(baseURL, {
          method: req.method,
          headers: customHeaders,
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          console.error("Proxy request failed:", response.statusText);
        }
        // 检查内容类型，确定是否为SSE
        const contentType = response.headers.get("Content-Type");
        const isSSE = contentType && contentType.includes("text/event-stream");

        // 设置响应头
        res.status(response.status);
        res.setHeader("Content-Type", contentType || "application/json");

        if (process.env.myEnv !== "dev") {
          console.log("proxy", isSSE, contentType);
        }

        if (isSSE) {
          // 处理SSE流
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");

          // 获取响应体的可读流
          const reader = response.body?.getReader();
          const stream = new PassThrough();

          // 将PassThrough流连接到响应
          stream.pipe(res);

          try {
            while (reader) {
              const readResult = await reader.read();
              if (readResult.done) {
                stream.end();
                break;
              }
              stream.write(readResult.value);
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
      } catch (error: any) {
        Logger.error("Proxy error:", error);
        res.status(500).json({ success: false, message: error?.message ?? String(error) });
      }
      return;
    })();
  } else {
    next();
  }
}
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


type MyRouter = {
  prefix: string;
  router: express.Router;
}
export const routers: MyRouter[] = [];

export async function initHttp() {
  const app = express();

  // 配置中间件
  app.use(cors());
  app.use(bodyParser.json({ limit: "1000mb" }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // 添加 AI SDK 路由 (先注册，避免被 genRouter 覆盖)
  const aiRouter = createAISDKRouter();
  routers.push({
    prefix: apiPrefix,
    router: aiRouter
  })

  routers.push({
    prefix: apiPrefix,
    router: genRouter(Command)
  })

  // 调试: 记录路由注册
  Logger.info('AI SDK routes registered at prefix:', apiPrefix);

  for (const route of routers) {
    app.use(route.prefix, route.router);
  }
  // 静态文件服务
  let staticPath = path.join(__dirname, "../web-build");
  if (process.env.myEnv == "dev") {
    staticPath = path.join(__dirname, "../../web/build");
    Logger.info("Running in development mode, serving from: ", staticPath);
  } else {
    Logger.info("Running in production mode, serving from: ", staticPath);
  }

  Logger.info("password: ", electronData.get().password);

  const staticOptions = {
    maxAge: 0, // 禁用 HTML 文件缓存
    setHeaders: (res: any, filePath: string) => {
      // 为 HTML 文件设置特殊的缓存头
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  };

  // 静态资源
  app.use(prefix, express.static(staticPath, staticOptions));
  app.use(prefix + "/temp", express.static(path.join(appDataDir, "temp")));

  // MCP 路由刷新函数
  let mcpRouter = await registers(prefix + "/mcp");
  app.use(prefix + "/mcp", mcpRouter);

  // 添加 API 端点用于刷新 MCP 路由
  app.post(prefix + "/api/refreshMcpRoutes", async (_req, res) => {
    try {
      // 获取新的路由实例
      const newRouter = await refreshRoutes(prefix + "/mcp");

      // 移除旧路由
      app._router.stack = app._router.stack.filter((layer: any) => {
        return layer.handle !== mcpRouter;
      });

      // 添加新路由
      mcpRouter = newRouter;
      app.use(prefix + "/mcp", mcpRouter);

      res.json({ success: true, message: "MCP 路由已刷新" });
    } catch (error) {
      console.error("刷新 MCP 路由时出错:", error);
      res.status(500).json({
        success: false,
        message: "刷新 MCP 路由失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 代理
  app.use(proxyMiddleware);
  // 错误处理中间件
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
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
  await electronData.save();

  // 错误处理
  io.on("error", (e) => {
    console.log("error: ", e);
  });

  // 创建Socket.IO命名空间
  let main = io.of("/" + electronData.get().password + "/main-message");
  let terminalMsg = io.of("/" + electronData.get().password + "/terminal-message");
  getMessageService().init(main as any, terminalMsg as any);
}

