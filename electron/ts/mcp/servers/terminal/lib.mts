import { McpServer, SSEServerTransport } from "ts/es6.mjs";
import { MCP_CONFIG } from "../../../../../common/data";
import { CONST } from "ts/polyfills/polyfills.mjs";
import { z } from "zod";

export const NAME = "hyper_terminal";

export const configSchema = z.object({

});

// console.log("safeParse : ", configSchema.safeParse({}));
export function getConfig() {
  let mcpconfig = MCP_CONFIG.initSync();

  let config = mcpconfig.mcpServers[NAME].hyperchat.config as z.infer<
    typeof configSchema
  >;

  return configSchema.safeParse(config).data;
}
