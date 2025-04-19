import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import os from "os";
import fs from "fs";
// import uuid from "uuid";

import * as pty from "node-pty";
import { z } from "zod";
import { shellPathSync, strip } from "ts/es6.mjs";
import { getConfig } from "./lib.mjs";
import { openMcpClient } from "ts/mcp/config.mjs";


type MCP_CONFIG_TYPE = {
  command: string;
  args: string[];
  env: { [s: string]: string };
  url: string;
  type: "stdio" | "sse" | "streamableHttp";
  hyperchat: {
    config: { [s in string]: any };
    url: string;
    type: "stdio" | "sse";
    scope: "built-in" | "outer";
  };
  disabled: boolean;
  isSync?: boolean;
};

export function registerTool(server: McpServer) {

  const config = getConfig();

  server.tool(
    "add-stdio-mcp",
    `add-stdio-mcp`,
    {
      name: z.string({
        description: "Name of the MCP",
      }),
      command: z.string({
        description: "Command to execute",
      }),// Updated to use z.string() for validation
      args: z.array(z.string({
        description: "Arguments to pass to the command",
      })).optional(), // Optional array of strings
      env: z.record(z.string({
        description: "Environment variables for the command",
      })).optional(), // Optional record of strings
    },
    async ({ name, command, args, env }) => {
      await openMcpClient(name, {
        command,
        args,
        env,
        type: "stdio"
      });

      return {
        content: [
          {
            type: "text",
            text: `success added`,
          },
        ],
      };
    }
  );

  // server.tool(
  //   "add-mcp2",
  //   `add-see-mcp or add streamableHttp mcp`,
  //   {
  //     name: z.string(),
  //     url: z.string(),// Updated to use z.string() for validation
  //     type: z.enum(["sse", "streamableHttp"]),
  //   },
  //   async ({ name, url, type }) => {
  //     await openMcpClient(name, {
  //       url,
  //       type: type,
  //     });

  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: `success added`,
  //         },
  //       ],
  //     };
  //   }
  // );

}
