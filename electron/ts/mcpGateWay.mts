import { Router } from "express";
import { MCP_GateWay } from "../../common/data";
import { isInitializeRequest, SSEServerTransport, StreamableHTTPServerTransport } from "ts/es6.mjs";
import { createServer } from "./mcp/servers/gateway/index.mjs";
const KEEP_ALIVE_INTERVAL_MS = 25000; // Send keep-alive every 25 seconds

function register(route, name, description, allowMCPs, prefix) {
    console.log(`Registering MCP Gateway: ${name}`, allowMCPs);

    let type;
    if (true || type == "streamableHttp") {


        // let server = await serve.createServer();
        // await server.connect(transport);
        route.post(`/${name}/mcp`, async (req, res) => {
            // console.log('Received MCP request:', req.body);

            try {
                const server = await createServer(name, description, allowMCPs);
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
        const handleSessionRequest = async (req, res) => {
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
    if (true || type == "sse") {
        let transport;

        route.get(`/${name}/sse`, async (req, res) => {
            transport = new SSEServerTransport(prefix + `/${name}/message`, res);
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
        route.post(`/${name}/message`, async (req, res) => {
            await transport.handlePostMessage(req, res);
        });
    }
}

export function registers(prefix: string) {
    let route = Router();
    MCP_GateWay.initSync().data.forEach((serve) => {
        register(route, serve.name, serve.description, serve.allowMCPs, prefix);
    });
    return route;
}

