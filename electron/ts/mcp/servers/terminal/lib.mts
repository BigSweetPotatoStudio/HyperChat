import { fs, McpServer, SSEServerTransport } from "ts/es6.mjs";
import { MCP_CONFIG } from "../../../../../common/data";
import { appDataDir, CONST } from "ts/polyfills/polyfills.mjs";
import { z } from "zod";
import path from "path";



export const NAME = "hyper_terminal";

export const configSchema = z.object({
  Terminal_End_CheckCount: z.number({
    description: `Determine whether to end by checking if the output remains unchanged. The default is 15 times`,
  }).default(15),
  Terminal_Output_MaxToken: z.number({
    description: `The maximum number of tokens to output`,
  }).default(10000),
  Terminal_Timeout: z.number({
    description: `The timeout for the command to end`,
  }).default(5 * 60 * 1000),
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
