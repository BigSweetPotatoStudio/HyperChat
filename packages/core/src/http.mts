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
import { PassThrough } from "stream";
import multer from "multer";
import bodyParser from "body-parser";
import crypto from "crypto";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { Logger } from "./log.mjs";
import { execFallback } from "./common/execFallback.mjs";
import { electronData } from "./shared/data.mjs";
import { Command } from "./command.mjs";
import { fs } from "./es6.mjs";
import { getMessageService } from "./message_service.mjs";
import { appDataDir, Config } from "./const.mjs";

import { registers, refreshRoutes } from "./mcpGateWay.mjs";
import { createAISDKRouter } from "./ai_sdk_routes.mjs";

// 常量定义
const UPLOAD_DIR = "./uploads";
const MAX_BODY_SIZE = "1000mb";
const CACHE_CONTROL_HTML = 'no-cache, no-store, must-revalidate';
const EXCLUDED_PROXY_HEADERS = ['content-length', 'origin', 'host', 'baseurl'];
const CUSTOM_HEADERS = {
  "HTTP-Referer": "https://hyperchat.dadigua.men",
  "X-Title": "HyperChat"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 类型定义
interface CustomHeaders {
  [key: string]: string;
}

interface ProxyRequestOptions {
  baseURL: string;
  method: string;
  headers: CustomHeaders;
  body: string;
}

interface UploadedFileInfo {
  filename: string;
  filepath: string;
  mimetype: string;
}

interface MyRouter {
  prefix: string;
  router: express.Router;
}

// 文件上传配置
const uploadDirPath = path.join(appDataDir, UPLOAD_DIR);
fs.ensureDirSync(uploadDirPath);
fs.emptyDirSync(uploadDirPath); // 启动时清空上传目录

/**
 * 安全的文件上传配置
 * 限制文件类型和大小，防止安全漏洞
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirPath);
  },
  filename: (_req, file, cb) => {
    // 生成安全的文件名，避免路径遍历攻击
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safeFilename);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB 限制
    files: 10 // 最多10个文件
  },
  fileFilter: (_req, file, cb) => {
    // 基本的文件类型验证
    const allowedMimes = [
      'image/', 'text/', 'application/json', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats'
    ];
    const isAllowed = allowedMimes.some(mime => file.mimetype.startsWith(mime));
    cb(null, isAllowed);
  }
});

/**
 * 构建安全的请求头
 * 过滤敏感头部信息，添加自定义头部
 */
function buildSafeHeaders(originalHeaders: any): CustomHeaders {
  const safeHeaders: CustomHeaders = {};

  for (const [key, value] of Object.entries(originalHeaders)) {
    if (value !== undefined && !EXCLUDED_PROXY_HEADERS.includes(key.toLowerCase())) {
      if (typeof value === 'string') {
        safeHeaders[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        safeHeaders[key] = value[0] ?? '';
      }
    }
  }

  // 添加自定义安全头部
  Object.assign(safeHeaders, CUSTOM_HEADERS);
  
  return safeHeaders;
}

/**
 * SSE 流处理器
 * 安全地处理服务器发送事件流
 */
async function handleSSEStream(response: globalThis.Response, res: express.Response): Promise<void> {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Unable to get response stream reader");
  }

  const stream = new PassThrough();
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
    stream.destroy();
  } finally {
    reader.releaseLock();
  }
}

/**
 * 处理代理请求
 * 安全地转发请求到目标服务器
 */
async function handleProxyRequest(req: Request, res: express.Response): Promise<void> {
  const requestBody = req.body;
  let baseURL = req.headers["baseurl"]
    ? decodeURIComponent(req.headers["baseurl"] as string)
    : '';

  if (!baseURL) {
    res.status(400).json({ 
      success: false, 
      message: "baseURL is required" 
    });
    return;
  }

  // 构建安全的请求头
  const customHeaders = buildSafeHeaders(req.headers);

  // 标准化 URL
  const normalizedURL = baseURL.replace(/\/$/, '') + 
    req.url.replace(apiPrefix + "/ai", "");

  if (process.env.myEnv === "dev") {
    Logger.debug("Proxy request to:", normalizedURL);
  }

  try {
    const response = await fetch(normalizedURL, {
      method: req.method,
      headers: customHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      Logger.error("Proxy request failed:", response.status, response.statusText);
    }

    const contentType = response.headers.get("Content-Type");
    const isSSE = contentType?.includes("text/event-stream");

    res.status(response.status);
    res.setHeader("Content-Type", contentType || "application/json");

    if (isSSE) {
      await handleSSEStream(response, res);
    } else {
      const data = await response.text();
      res.send(data);
    }
  } catch (error: any) {
    Logger.error("Proxy error:", error);
    res.status(500).json({ 
      success: false, 
      message: process.env.myEnv === "dev" ? error?.message : "Proxy request failed"
    });
  }
}

/**
 * 安全的文件处理
 * 生成文件哈希和安全文件名
 */
async function processUploadedFile(file: Express.Multer.File): Promise<UploadedFileInfo> {
  const fileContent = await fs.readFile(file.path);
  const hash = crypto.createHash("sha256").update(fileContent as any).digest("hex");
  const ext = path.extname(file.originalname);
  const newFilename = `${hash}${ext}`;
  const filepath = path.join(uploadDirPath, newFilename);

  await fs.move(file.path, filepath, { overwrite: true });

  return {
    filename: newFilename,
    filepath,
    mimetype: file.mimetype,
  };
}
/**
 * 动态路由生成器
 * 基于 Command 类的方法自动生成 REST API 路由
 * 每个 Command 方法对应一个 POST 接口
 * 
 * @param commandInstance - Command 类实例
 * @returns Express Router 实例
 */
export function genRouter(commandInstance: any): Router {
  const router = Router();
  
  // 获取 Command 类的所有方法名（排除构造函数）
  const functionNames = Object.getOwnPropertyNames(Object.getPrototypeOf(commandInstance))
    .filter(name => name !== "constructor" && typeof commandInstance[name] === "function");

  // 为每个 Command 方法生成对应的 POST 路由
  for (const methodName of functionNames) {
    router.post(`/${methodName}`, async (req: Request, res: express.Response, _next: NextFunction) => {
      const startTime = Date.now();
      const args = req.body;
      
      try {
        // 选择性日志记录（避免敏感信息和过多日志）
        if (methodName !== "getHistory") {
          if (methodName === "writeFile") {
            Logger.info(`${methodName}:`, args[0], `writeFile Data length: ${args[1]?.length || 0}`);
          } else {
            Logger.info(`${methodName}:`, args);
          }
        }

        // 调用 Command 方法处理请求
        const result = await (Command[methodName as keyof typeof Command] as any)(args);
        
        const duration = Date.now() - startTime;
        if (process.env.myEnv === "dev" && duration > 1000) {
          Logger.warn(`Slow API call: ${methodName} took ${duration}ms`);
        }

        // 返回统一格式的成功响应
        res.json({
          code: 0,
          success: true,
          data: result,
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        Logger.error(`API Error in ${methodName} (${duration}ms):`, error);
        
        res.status(500).json({
          success: false,
          code: 1,
          message: process.env.myEnv === "dev" 
            ? (error instanceof Error ? error.message : 'Unknown error')
            : 'Internal server error'
        });
      }
    });
  }

  // 优化的文件上传处理
  router.post('/uploads', upload.single('file'), async (req: Request, res: express.Response) => {
    const startTime = Date.now();
    
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
        return;
      }

      const fileInfo = await processUploadedFile(req.file);
      const duration = Date.now() - startTime;
      
      Logger.info(`File uploaded successfully: ${fileInfo.filename} (${duration}ms)`);
      
      res.status(200).json({
        success: true,
        data: fileInfo,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      Logger.error(`File upload error (${duration}ms):`, error);
      
      res.status(500).json({
        success: false,
        message: process.env.myEnv === "dev" 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'File upload failed'
      });
    }
  });

  return router;
}

// 初始化全局变量
await electronData.init();
const prefix = "/" + encodeURI(electronData.get().password);
const apiPrefix = prefix + "/api";

/**
 * 优化的代理中间件
 * 处理 AI API 代理请求，支持 SSE 流
 */
function createProxyMiddleware() {
  return async (req: Request, res: express.Response, next: NextFunction) => {
    // 检查是否为 AI API 请求
    if (!req.path.startsWith(apiPrefix + "/ai")) {
      next();
      return;
    }

    if (process.env.myEnv === "dev") {
      Logger.debug("Proxy request:", req.method, req.url);
    }

    try {
      await handleProxyRequest(req, res);
    } catch (error) {
      Logger.error("Proxy middleware error:", error);
      next(error);
    }
  };
}

export const routers: MyRouter[] = [];

/**
 * 优化的 HTTP 服务器初始化函数
 * 集成所有中间件、路由和 WebSocket 服务
 */
export async function initHttp(): Promise<void> {
  const app = express();

  // 基础中间件配置
  app.use(cors());
  app.use(bodyParser.json({ limit: MAX_BODY_SIZE }));
  app.use(bodyParser.urlencoded({ extended: true }));

  // 注册 AI SDK 路由（优先级高）
  const aiRouter = createAISDKRouter();
  routers.push({
    prefix: apiPrefix,
    router: aiRouter
  });

  // 注册 Command 路由
  routers.push({
    prefix: apiPrefix,
    router: genRouter(Command)
  });

  Logger.info('Routes registered with prefix:', apiPrefix);

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
  app.use(prefix, express.static(staticPath, staticOptions));
  app.use(prefix + "/temp", express.static(path.join(appDataDir, "temp")));

  // MCP 路由注册
  let mcpRouter = await registers(prefix + "/mcp");
  app.use(prefix + "/mcp", mcpRouter);

  // MCP 路由刷新端点
  app.post(prefix + "/api/refreshMcpRoutes", async (_req, res) => {
    try {
      const newRouter = await refreshRoutes(prefix + "/mcp");
      
      // 安全地移除旧路由
      app._router.stack = app._router.stack.filter((layer: any) => {
        return layer.handle !== mcpRouter;
      });

      mcpRouter = newRouter;
      app.use(prefix + "/mcp", mcpRouter);

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
  app.use((err: Error, _req: Request, res: express.Response, _next: NextFunction) => {
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

