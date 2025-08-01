import { Router, Request, Response } from "express";
import { SSEServerTransport, StreamableHTTPServerTransport } from "./es6.mjs";
// import { createServer } from "./mcp/servers/gateway/index.mjs"; // 暂时禁用MCP网关
import { Logger } from "./log.mjs";
import { getAppSettingsManager } from "./data/appSettingsService.mjs";
import type { MCPGateway } from "@dadigua/hyperchat-shared";
import { createServer } from "./mcp/servers/gateway/index.mjs";
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


function register(route: Router, name: string, description: string, allowMCPs: string[], blockMCPTools: string[], prefix: string) {
    Logger.info(`Registering MCP Gateway: ${name}`, allowMCPs);

    // type == "streamableHttp"
    {
        // let server = await serve.createServer();
        // await server.connect(transport);
        route.post(`/${name}/mcp`, async (req, res) => {
            // console.log('Received MCP request:', req.body);
            try {
                const server = await createServer(name, description, allowMCPs, blockMCPTools);
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                });
                res.on('close', () => {
                    // console.log('Request closed');
                    transport.close();
                    server.close();
                });
                await server.connect(transport);
                await transport.handleRequest(req, res, req.body);
            } catch (error) {
                console.error('Error handling MCP request:', error);
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
        const handleSessionRequest = async (_req: any, res: Response) => {
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
            // 暂时禁用MCP网关功能
            res.status(503).json({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'MCP Gateway temporarily disabled',
                },
                id: null,
            });
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


/**
 * 从应用设置中获取 MCP 网关配置
 */
function getMCPGateways(): MCPGateway[] {
    try {
        const appSettingsManager = getAppSettingsManager();
        if (!appSettingsManager) {
            Logger.warn('App settings manager not available, returning empty gateways list');
            return [];
        }

        const settings = appSettingsManager.getSettings();
        const gateways = settings.mcpGateWays || [];

        Logger.debug(`Retrieved ${gateways.length} MCP gateways from app settings`);
        return gateways;
    } catch (error) {
        Logger.error('Failed to get MCP gateways from app settings:', error);
        return [];
    }
}

export async function registers(prefix: string) {
    let route = Router();

    // 从应用设置中获取 MCP 网关配置并注册路由
    const gateways = getMCPGateways();
    Logger.info(`Loading ${gateways.length} MCP gateways from app settings`);

    gateways.forEach((gateway) => {
        // 提供默认值以避免 undefined
        register(
            route,
            gateway.name ?? 'default',
            gateway.description ?? '',
            gateway.allowMCPs ?? [],
            gateway.blockMCPTools ?? [],
            prefix
        );
    });

    return route;
}

/**
 * 刷新路由 - 重新从应用设置加载并创建一个新的Router实例
 * 
 * 使用方法:
 * 1. 首先通过前端更新应用设置中的 mcpGateWays 配置
 * 2. 然后调用此函数获取新的路由实例
 * 3. 用新的路由实例替换应用中旧的路由
 * 
 * @param prefix API的前缀路径
 * @returns 新的配置好的Router实例
 */
export function refreshRoutes(prefix: string) {
    // 清除现有连接
    clearTransports();

    Logger.info('Refreshing MCP gateway routes from app settings');

    // 创建新的路由实例，会自动从应用设置中重新加载配置
    return registers(prefix);
}

/**
 * 导出函数：获取当前配置的 MCP 网关列表
 * @returns MCP 网关配置数组
 */
export function getCurrentMCPGateways(): MCPGateway[] {
    return getMCPGateways();
}

