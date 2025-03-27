import { McpServer, SSEServerTransport } from "ts/es6.mjs";

import { CONST } from "ts/polyfills/polyfills.mjs";
import { z } from "zod";
import { MCP_CONFIG } from "../../../../../common/data";
import zodToJsonSchema, { zodPatterns } from "zod-to-json-schema";

export const NAME = "hyper_tools";

export const configSchema = z.object({
  Web_Tools_Platform: z
    .enum(["electron", "chrome", "none"], {
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
  chromePath: z
    .string({
      description: "Chrome Path",
    })
    .default(""),
});

function JsonSchema2DefaultValue(schema: any) {
  let obj = {};
  function run(item) {
    for (const key in item.properties) {
      const prop = item.properties[key];
      obj[key] = prop.default;
    }
  }

  if (schema && schema.type === "object") {
    run(schema);
  }
  return obj;
}

// console.log("safeParse : ", configSchema.safeParse({}));
export function getConfig() {
  let mcpconfig = MCP_CONFIG.initSync();

  let config = mcpconfig.mcpServers[NAME].hyperchat.config as z.infer<
    typeof configSchema
  >;
  
  return configSchema.safeParse(config).data;
}
