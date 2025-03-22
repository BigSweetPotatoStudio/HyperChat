import { McpServer, SSEServerTransport } from "ts/es6.mjs";

import { CONST } from "ts/polyfills/polyfills.mjs";
import { z } from "zod";
import { MCP_CONFIG } from "../../../../../common/data";

export const NAME = "hyper_tools";
export const server = new McpServer({
  name: NAME,
  version: CONST.getVersion,
});

let transport;
async function createServer(endpoint: string, response) {
  //   console.log("Received connection");
  transport = new SSEServerTransport(endpoint, response);
  await server.connect(transport);
}

async function handlePostMessage(req, res) {
  //   console.log("Received message");
  await transport.handlePostMessage(req, res);
}

export const configSchema = z.object({
  Web_Tools_Platform: z
    .enum(["electron", "chrome"], {
      description: "Platform using web tools",
    })
    .default("electron"),
  SEARCH_ENGINE: z
    .enum(["google", "bing"], {
      description: "search engine",
    })
    .default("google"),
  isAutoLauncher: z
    .enum(["true", "false"], {
      description: "Whether to automatically launcher the browser",
    })
    .default("true"),
  browserURL: z
    .string({
      description: "Connect to the browser's remote debugging port",
    })
    .default("http://localhost:9222"),
  startingUrl: z
    .string({
      description: "starting Page Url",
    })
    .default("https://github.com/BigSweetPotatoStudio/HyperChat"),
  chromePath: z.nullable(
    z
      .string({
        description: "Chrome Path",
      })
      .default("")
  ),
});

export const HyperTools = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
  configSchema: configSchema,
};

export function getConfig() {
  let mcpconfig = MCP_CONFIG.initSync();

  let config = mcpconfig.mcpServers[NAME].hyperchat.config as z.infer<
    typeof configSchema
  >;
  return config;
}
