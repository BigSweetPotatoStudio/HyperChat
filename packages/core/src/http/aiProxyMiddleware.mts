import { Logger } from "../log.mjs";
import { NextFunction, Request, Response, Router } from "express";
import { PassThrough } from "stream";
import { urlPrefix } from "../http.mjs";


const CUSTOM_HEADERS = {
    "HTTP-Referer": "https://hyperchat.dadigua.men",
    "X-Title": "HyperChat"
};

const EXCLUDED_PROXY_HEADERS = ['content-length', 'origin', 'host', 'baseurl'];

// 类型定义
interface CustomHeaders {
    [key: string]: string;
}

interface MyRouter {
    prefix: string;
    router: Router;
}


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
async function handleSSEStream(response: globalThis.Response, res: Response): Promise<void> {
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
async function handleProxyRequest(req: Request, res: Response): Promise<void> {
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
        req.url.replace(urlPrefix + "/ai", "");

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
 * 优化的代理中间件
 * 处理 AI API 代理请求，支持 SSE 流
 */
export function createProxyMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
        // console.log("Proxy middleware activated", req.method, req.url, urlPrefix);
        // 检查是否为 AI API 请求
        if (!req.path.startsWith(urlPrefix + "/ai")) {
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