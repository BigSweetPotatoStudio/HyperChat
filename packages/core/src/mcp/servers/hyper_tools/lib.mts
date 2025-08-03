import { fs } from "../../../es6.mjs";

import { appDataDir } from "../../../const.mjs";
import { z } from "zod";
// import { MCP_CONFIG } from "../../../../../common/data.mjs";
// import zodToJsonSchema from "zod-to-json-schema";
import path from "path";
import { Logger } from "../../../log.mjs";

export const NAME = "hyper_browser";





export const configSchema = z.object({
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

// Logger.debug("safeParse : ", configSchema.safeParse({}));
export function getConfig() {
  //  let buildinMcpJSONPath = path.join(appDataDir, "mcpBuiltIn.json");
  //   let mcpconfig = fs.readJSONSync(buildinMcpJSONPath);

  //   let config = mcpconfig.mcpServers[NAME].hyperchat.config as z.infer<
  //     typeof configSchema
  //   >;

  return configSchema.safeParse({}).data;
}

// Shared reason field for all tools
export const reasonField = z.string()
  .min(1, "Reason must be at least 1 character")
  .max(200, "Reason must not exceed 200 characters")
  .describe('REQUIRED: Explain why you need to use this tool and what you plan to accomplish. This is for transparency and audit purposes.');

// Helper function to create tool schemas with mandatory reason field
export function createToolSchema<T extends z.ZodRawShape>(additionalFields: T) {
  return z.object({
    reason: reasonField,
    ...additionalFields,
  });
}
