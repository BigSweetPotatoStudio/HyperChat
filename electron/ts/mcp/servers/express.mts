import App from "express";
import { HyperTools } from "./hyper_tools.mjs";
import { electronData, MCPServerPORT } from "../../common/data.mjs";
import { execFallback } from "../../common/execFallback.mjs";
import log from "electron-log";
import { MyServers } from "./index.mjs";

export async function initMcpServer() {
  let PORT = await new Promise<number>(async (resolve, reject) => {
    log.info("initMcpServer");
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
    //   app.listen(PORT, () => {
    //     console.log(`McpServer is running on port ${PORT}`);
    //   });

    PORT = await execFallback(PORT, (port: number) => {
      app.listen(port, () => {
        console.log(`McpServer is running on port ${port}`);
        resolve(port);
      });
    });
  });
  electronData.get().mcp_server_port = PORT;
  await electronData.save();
}
