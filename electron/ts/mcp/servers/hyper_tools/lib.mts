import { fs, McpServer, SSEServerTransport } from "ts/es6.mjs";

import { appDataDir, CONST } from "ts/polyfills/polyfills.mjs";
import { z } from "zod";
import { MCP_CONFIG } from "../../../../../common/data";
import zodToJsonSchema, { zodPatterns } from "zod-to-json-schema";
import path from "path";

export const NAME = "hyper_tools";

export const configSchema = z.object({
  Web_Tools_Platform: z
    .enum(["electron", "chrome", "none"], {
      description: "Platform using web tools",
    })
    .default("electron"),
  SearchEngine: z
    .enum(["google", "bing"], {
      description: "search engine",
    })
    .default("google"),
  ChromeIsUseLocal: z
    .enum(["true", "false"], {
      description: "Whether to launcher the local browser",
    })
    .default("true"),
  ChromeBrowserURL: z
    .string({
      description: "Connect to the browser's remote debugging port",
    })
    .default("http://localhost:9222"),
  ChromeStartingUrl: z
    .string({
      description: "Chrome starting Page Url",
    })
    .default("https://github.com/BigSweetPotatoStudio/HyperChat"),
  ChromePath: z
    .string({
      description: "Chrome Path",
    })
    .default(""),
  ChromeUserData: z
    .string({
      description: "Chrome userData Path",
    })
    .optional(),
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
