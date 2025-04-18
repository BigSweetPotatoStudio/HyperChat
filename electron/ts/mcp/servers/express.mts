import App from "express";
import { electronData } from "../../../../common/data";
import { execFallback } from "../../common/execFallback.mjs";
import { Logger } from "ts/polyfills/index.mjs";
import { MyServers } from "./index.mjs";

import { Config } from "ts/const.mjs";
import { v4 } from "uuid";
import { isInitializeRequest, StreamableHTTPServerTransport } from "ts/es6.mjs";

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
        let server = await serve.createServer();
        
        app.post(`/${serve.name}/mcp`, async (req, res) => {

          // Check for existing session ID
          const sessionId = req.headers['mcp-session-id'] as string | undefined;
          console.log("Received message", sessionId, req.body);
          let transport;

          if (sessionId && transports[sessionId]) {
            // Reuse existing transport
            transport = transports[sessionId];
          } else if (sessionId) {
            // New initialization request
            console.log("New session ID", sessionId, req.body);
            transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: undefined,
            });

            // let server = await serve.createServer();


            // Clean up transport when closed
            transport.onclose = () => {
              delete transports[sessionId];
            };
            transports[sessionId] = transport;

            // Connect to the MCP server
            await server.connect(transport);
          } else {
            // Invalid request
            res.status(400).json({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
              },
              id: null,
            });
            return;
          }

          // Handle the request
          await transport.handleRequest(req, res, req.body);
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

        app.get(`/${serve.name}/sse`, async (req, res) => {
          // Start keep-alive ping
          const intervalId = setInterval(() => {
            if (!res.writableEnded) {
              res.write(': keepalive\n\n');
            } else {
              // Should not happen if close handler is working, but clear just in case
              clearInterval(intervalId);
            }
          }, KEEP_ALIVE_INTERVAL_MS);
          await serve.createServer(`/${serve.name}/message`, res);
        });
        app.post(`/${serve.name}/message`, async (req, res) => {
          await serve.handlePostMessage(req, res);
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
