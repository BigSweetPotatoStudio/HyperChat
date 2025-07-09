import { Router, Request, Response } from "express";
// import { MCP_GateWay } from "./shared/data.mjs";
import { SSEServerTransport, StreamableHTTPServerTransport } from "./es6.mjs";
import { createServer } from "./mcp/servers/gateway/index.mjs";
import { Logger } from "./log.mjs";
const KEEP_ALIVE_INTERVAL_MS = 25000; // Send keep-alive every 25 seconds

const transports = {
    streamable: {} as Record<string, any>,
    sse: {} as Record<string, any>
};

// 清除现有的所有传输连接
function clearTransports() {
    // 关闭所有SSE传输连接
    Object.keys(transports.sse).forEach(sessionId => {
        const transport = transports.sse[sessionId];
        if (transport && typeof transport.close === 'function') {
            transport.close();
        }
    });

    // 关闭所有streamable传输连接
    Object.keys(transports.streamable).forEach(sessionId => {
        const transport = transports.streamable[sessionId];
        if (transport && typeof transport.close === 'function') {
            transport.close();
        }
    });

    // 重置传输对象
    transports.sse = {};
    transports.streamable = {};
}


function register(route: Router, name: string, description: string, allowMCPs: string[], prefix: string) {
    Logger.info(`Registering MCP Gateway: ${name}`, allowMCPs);

    // type == "streamableHttp"
    {
        // let server = await serve.createServer();
        // await server.connect(transport);
        route.post(`/${name}/mcp`, async (req: Request, res: Response) => {
            // Logger.debug('Received MCP request:', req.body);
            try {
                const server = await createServer(name, description, allowMCPs);
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined, // 由 MCP_GateWay 提供
                });
                await server.connect(transport as any);
                res.on('close', () => {
                    // Logger.debug('Request closed');
                    transport.close();
                    server.close();
                });
                await transport.handleRequest(req, res, req.body);
            } catch (error) {
                Logger.error('Error handling MCP request:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error',
                        },
                        id: null,
                    });
                }
            }



        });

        // Reusable handler for GET and DELETE requests
        const handleSessionRequest = async (_req: Request, res: Response) => {
            res.writeHead(405).end(JSON.stringify({
                jsonrpc: "2.0",
                error: {
                    code: -32000,
                    message: "Method not allowed."
                },
                id: null
            }));
        };

        route.get(`/${name}/mcp`, handleSessionRequest);

        route.delete(`/${name}/mcp`, handleSessionRequest);
    }

    // type == "see"
    {
        route.get(`/${name}/sse`, async (_req: Request, res: Response) => {
            let transport = new SSEServerTransport(prefix + `/${name}/message`, res);
            transports.sse[transport.sessionId] = transport;

            // Start keep-alive ping
            const intervalId = setInterval(() => {
                if (!res.writableEnded) {
                    res.write(': keepalive\n\n');
                } else {
                    // Should not happen if close handler is working, but clear just in case
                    clearInterval(intervalId);
                }
            }, KEEP_ALIVE_INTERVAL_MS);
            let server = await createServer(name, description, allowMCPs);
            await server.connect(transport);
        });
        route.post(`/${name}/message`, async (req: Request, res: Response) => {
            // await transport.handlePostMessage(req, res);
            const sessionId = req.query.sessionId as string;
            const transport = transports.sse[sessionId];
            if (transport) {
                await transport.handlePostMessage(req, res, req.body);
            } else {
                res.status(400).send('No transport found for sessionId');
            }
        });
    }
}


export async function registers(prefix: string) {
    let route = Router();
    // (await MCP_GateWay.init()).data.forEach((serve) => {
    //     // Provide default values to avoid undefined
    //     register(
    //         route,
    //         serve.name ?? 'default',
    //         serve.description ?? '',
    //         serve.allowMCPs ?? [],
    //         prefix
    //     );
    // });
    return route;
}

/**
 * 刷新路由 - 重新从配置加载并创建一个新的Router实例
 * 
 * 使用方法:
 * 1. 首先更新MCP_GateWay的配置数据
 * 2. 然后调用此函数获取新的路由实例
 * 3. 用新的路由实例替换应用中旧的路由
 * 
 * @param prefix API的前缀路径
 * @returns 新的配置好的Router实例
 */
export function refreshRoutes(prefix: string) {
    // 清除现有连接
    clearTransports();


    // 创建新的路由实例
    return registers(prefix);
}

