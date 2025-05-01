import { fs, McpServer, SSEServerTransport } from "ts/es6.mjs";
import { MCP_CONFIG } from "../../../../../common/data";
import { appDataDir, CONST } from "ts/polyfills/polyfills.mjs";
import { z } from "zod";
import path from "path";



export const NAME = "hyper_settings";

export const configSchema = z.object({

});

// console.log("safeParse : ", configSchema.safeParse({}));
export function getConfig() {
  let buildinMcpJSONPath = path.join(appDataDir, "mcpBuiltIn.json");
  let mcpconfig = fs.readJSONSync(buildinMcpJSONPath);

  let config = mcpconfig.mcpServers[NAME].hyperchat.config as z.infer<
    typeof configSchema
  >;

  return configSchema.safeParse(config).data;
}
