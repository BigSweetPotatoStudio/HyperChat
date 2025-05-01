import { fs, McpServer, SSEServerTransport } from "ts/es6.mjs";

import { appDataDir, CONST } from "ts/polyfills/polyfills.mjs";
import { z } from "zod";
import { MCP_CONFIG } from "../../../../../common/data";
import zodToJsonSchema, { zodPatterns } from "zod-to-json-schema";
import path from "path";

export const NAME = "hyper_tools";



let e = ["chrome", "none"]
if (process.env.no_electron != "1") {
  e = ["electron", "chrome", "none"]
}
let d = "none"
if (process.env.no_electron != "1") {
  d = "electron"
}

export const configSchema = z.object({
  Web_Tools_Platform: z
    .enum(e as any, {
      description: "Platform using web tools",
    })
    .default(d),
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
    .default(path.join(appDataDir, "Chrome")),
  ChromeAutoClose: z
    .enum(["true", "false"], {
      description: "Whether to close automatically after use",
    })
    .default("true"),
  ChromeHeadless: z
    .enum(["true", "false"], {
      description: "open the browser in headless(hidden) mode",
    })
    .default("false"),
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
