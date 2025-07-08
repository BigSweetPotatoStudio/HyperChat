import { fs } from "../../../es6.mjs";
import { appDataDir } from "../../../const.mjs";
import { z } from "zod";
import path from "path";
import { Logger } from "../../../log.mjs";

export const NAME = "hyper_terminal" as const;

export const configSchema = z.object({
  Terminal_End_CheckCount: z.number({
    description: `Determine whether to end by checking if the output remains unchanged. The default is 15 times`,
  }).default(15),
  Terminal_Output_MaxToken: z.number({
    description: `The maximum number of tokens to output`,
  }).default(10000),
  Terminal_Timeout: z.number({
    description: `The timeout for the command to end (in milliseconds)`,
  }).default(5 * 60 * 1000),
  Terminal_Working_Directory: z.string({
    description: `Default working directory for new terminals. If not specified, uses the user's home directory`,
  }).optional(),
});

export type TerminalConfig = z.infer<typeof configSchema>;

interface McpServerConfig {
  hyperchat: {
    config: TerminalConfig;
  };
}

interface McpConfig {
  mcpServers: {
    [NAME]: McpServerConfig;
  };
}

export function getConfig(): TerminalConfig | undefined {
  try {
    const buildinMcpJSONPath = path.join(appDataDir, "mcpBuiltIn.json");
    const mcpconfig = fs.readJSONSync(buildinMcpJSONPath) as McpConfig;

    const config = mcpconfig.mcpServers[NAME]?.hyperchat?.config;
    if (!config) {
      Logger.warn(`No configuration found for ${NAME}, using defaults`);
      return configSchema.parse({});
    }

    const parsed = configSchema.safeParse(config);
    if (!parsed.success) {
      Logger.error(`Invalid configuration for ${NAME}:`, parsed.error);
      return configSchema.parse({});
    }

    return parsed.data;
  } catch (error) {
    Logger.error(`Failed to read configuration for ${NAME}:`, error);
    return configSchema.parse({});
  }
}
