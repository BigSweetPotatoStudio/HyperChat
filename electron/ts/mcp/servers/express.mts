import App from "express";
import { electronData } from "../../../../common/data";
import { execFallback } from "../../common/execFallback.mjs";
import { Logger } from "ts/polyfills/index.mjs";
import { MyServers } from "./index.mjs";

import { Config } from "ts/const.mjs";
import { v4 } from "uuid";
import { isInitializeRequest, SSEServerTransport, StreamableHTTPServerTransport } from "ts/es6.mjs";

type HyperMcp = {
  createServer;
  handlePostMessage;
  name: string;
  url: string;
  type: "sse" | "streamableHttp";
};
const KEEP_ALIVE_INTERVAL_MS = 25000; // Send keep-alive every 25 seconds


// Map to store transports by session ID
const transports: { [sessionId: string]: any } = {};
export async function initMcpServer() {
  let PORT = await new Promise<number>(async (resolve, reject) => {
    // Logger.info("initMcpServer", MCPServerPORT);
    const app = App();

    async function register(serve: HyperMcp) {
      if (serve.type == "streamableHttp") {


        // let server = await serve.createServer();
        // await server.connect(transport);
        app.post(`/${serve.name}/mcp`, async (req, res) => {
          // console.log('Received MCP request:', req.body);

          try {
            const server = await serve.createServer();
            const transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: undefined,
            });
            res.on('close', () => {
              console.log('Request closed');
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

        app.get(`/${serve.name}/mcp`, handleSessionRequest);

        app.delete(`/${serve.name}/mcp`, handleSessionRequest);
      } else {
        let transport;

        app.get(`/${serve.name}/sse`, async (req, res) => {
          transport = new SSEServerTransport(`/${serve.name}/message`, res);
          // Start keep-alive ping
          const intervalId = setInterval(() => {
            if (!res.writableEnded) {
              res.write(': keepalive\n\n');
            } else {
              // Should not happen if close handler is working, but clear just in case
              clearInterval(intervalId);
            }
          }, KEEP_ALIVE_INTERVAL_MS);
          let server = await serve.createServer();
          await server.connect(transport);
        });
        app.post(`/${serve.name}/message`, async (req, res) => {
          await transport.handlePostMessage(req, res);
        });
      }
    }
    for (let serve of MyServers) {
      await register(serve);
    }
    let PORT = Config.mcp_server_port;

    PORT = await execFallback(PORT, (port: number) => {
      app.listen(port, () => {
        // console.log(`McpServer is running on port ${port}`);
        resolve(port);
      });
    });
  });

  Config.mcp_server_port = PORT;
}
