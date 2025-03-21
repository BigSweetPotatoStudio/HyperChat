import App from "express";
import { HyperTools } from "./hyper_tools.mjs";
import { electronData } from "../../../../common/data";
import { execFallback } from "../../common/execFallback.mjs";
import { Logger } from "ts/polyfills/index.mjs";
import { MyServers } from "./index.mjs";
import { MCPServerPORT } from "../../common/data.mjs";

export async function initMcpServer() {
  let PORT = await new Promise<number>(async (resolve, reject) => {
    // Logger.info("initMcpServer", MCPServerPORT);
    const app = App();

    function register(serve: typeof HyperTools) {
      app.get(`/${serve.name}/sse`, async (req, res) => {
        await serve.createServer(`/${serve.name}/message`, res);
      });
      app.post(`/${serve.name}/message`, async (req, res) => {
        await serve.handlePostMessage(req, res);
      });
    }
    for (let serve of MyServers) {
      register(serve);
    }
    let PORT = MCPServerPORT;

    PORT = await execFallback(PORT, (port: number) => {
      app.listen(port, () => {
        // console.log(`McpServer is running on port ${port}`);
        resolve(port);
      });
    });
  });
  electronData.initSync();
  electronData.get().mcp_server_port = PORT;
  await electronData.save();
}
