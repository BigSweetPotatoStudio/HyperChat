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

import express, { Request, Response, NextFunction, Router } from "express";
import cors from "cors";
import http from "http";
import path from "path";
import { Server as SocketIO } from "socket.io";
import bodyParser from "body-parser";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { Logger } from "./log.mjs";
import { execFallback } from "./common/execFallback.mjs";
import { electronData } from "./shared/data.mjs";
import { Command } from "./command.mjs";
import { getMessageService } from "./message_service.mjs";
import { appDataDir, Config } from "./const.mjs";

import { registers, refreshRoutes } from "./mcpGateWay.mjs";
import { genRouter } from "./http/command2router.mjs";
import { createUploadRouter } from "./http/uploadRouter.mjs";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { createProxyMiddleware } from "./http/aiProxyMiddleware.mjs";

// 常量定义
const MAX_BODY_SIZE = "1000mb";
const CACHE_CONTROL_HTML = 'no-cache, no-store, must-revalidate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



interface MyRouter {
  prefix: string;
  router: express.Router;
}

// 初始化全局变量
await electronData.init();
export const urlPrefix = "/" + encodeURI(electronData.get().password);


export const callNodejsApiPath = urlPrefix + "/call";




export const routers: MyRouter[] = [];

/**
 * 优化的 HTTP 服务器初始化函数
 * 集成所有中间件、路由和 WebSocket 服务
 */
export async function initHttp(): Promise<void> {
  Logger.info('Routes registered with prefix:', urlPrefix);
  const app = express();

  // 基础中间件配置
  app.use(cors());
  app.use(bodyParser.json({ limit: MAX_BODY_SIZE }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // 注册 Command 路由
  routers.push({
    prefix: callNodejsApiPath,
    router: genRouter(Command)
  });
  // 注册上传路由
  routers.push({
    prefix: callNodejsApiPath,
    router: createUploadRouter()
  });



  // 应用所有路由
  for (const route of routers) {
    app.use(route.prefix, route.router);
  }

  // 静态文件服务配置
  const staticPath = process.env.myEnv === "dev"
    ? path.join(__dirname, "../../web/build")
    : path.join(__dirname, "../web-build");

  Logger.info(`Serving static files from: ${staticPath}`);
  Logger.info("Server password:", electronData.get().password);

  const staticOptions = {
    maxAge: 0,
    setHeaders: (res: any, filePath: string) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', CACHE_CONTROL_HTML);
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }
    }
  };

  // 静态资源路由
  app.use(urlPrefix, express.static(staticPath, staticOptions));
  app.use(urlPrefix + "/temp", express.static(path.join(appDataDir, "temp")));

  // MCP 路由注册
  let mcpRouter = await registers(urlPrefix + "/mcp");
  app.use(urlPrefix + "/mcp", mcpRouter);

  // MCP 路由刷新端点
  app.post(urlPrefix + "/api/refreshMcpRoutes", async (_req, res) => {
    try {
      const newRouter = await refreshRoutes(urlPrefix + "/mcp");

      // 安全地移除旧路由
      app._router.stack = app._router.stack.filter((layer: any) => {
        return layer.handle !== mcpRouter;
      });

      mcpRouter = newRouter;
      app.use(urlPrefix + "/mcp", mcpRouter);

      res.json({ success: true, message: "MCP 路由已刷新" });
    } catch (error) {
      Logger.error("刷新 MCP 路由时出错:", error);
      res.status(500).json({
        success: false,
        message: "刷新 MCP 路由失败",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // 代理中间件（处理 AI API 请求）
  app.use(createProxyMiddleware());

  // 全局错误处理中间件
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    Logger.error("Server error:", err);

    res.status(500).json({
      success: false,
      message: process.env.myEnv === "dev"
        ? (err.message || 'Internal Server Error')
        : 'Internal Server Error'
    });
  });

  // 创建 HTTP 服务器
  const server = http.createServer(app);
  const io = new SocketIO(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 1e10,
  });

  // 启动服务器
  const PORT = await execFallback(Config.port, (port) => {
    server.listen(port, () => {
      Logger.info(`HTTP server listening on port: ${port}`);
    });
  });

  Config.port = PORT;
  await electronData.save();

  // Socket.IO 错误处理
  io.on("error", (error) => {
    Logger.error("Socket.IO error:", error);
  });

  // 创建 Socket.IO 命名空间
  const mainNamespace = io.of("/" + electronData.get().password + "/main-message");
  const terminalNamespace = io.of("/" + electronData.get().password + "/terminal-message");

  getMessageService().init(mainNamespace as any, terminalNamespace as any);

  Logger.info("HTTP server initialization completed successfully");
}


