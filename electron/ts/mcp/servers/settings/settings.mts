import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import os from "os";
import fs from "fs";
// import uuid from "uuid";

import * as pty from "node-pty";
import { z } from "zod";
import { shellPathSync, strip } from "ts/es6.mjs";
import { getConfig } from "./lib.mjs";
import { openMcpClient } from "ts/mcp/config.mjs";
import { VarList, VarScopeList } from "../../../../../common/data";
import { v4 } from "uuid";
import dayjs from "dayjs";
import { getMessageService } from "ts/message_service.mjs";


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
      env: z.array(z.object({
        name: z.string({
          description: "Name of the Environment variables",
        }),
        value: z.string({
          description: "Value of the Environment variables",
        }),
      })), // Optional record of strings
    },
    async ({ name, command, args, env }) => {
      let envs = {} as { [s: string]: string };
      for (let e of (env || [])) {
        envs[e.name?.trim()] = e.value?.trim();
      }
      await openMcpClient(name, {
        command,
        args,
        env: envs,
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
  server.tool(
    "set-variables",
    `set-variables`,
    {

      variables: z.array(z.object({
        name: z.string({
          description: "Name of the variable",
        }),
        value: z.string({
          description: "Value of the variable",
        }),
      })), // Optional array of strings
    },
    async ({ variables }) => {
      VarList.initSync();
      VarScopeList.initSync();
      for (let v of variables) {
        let scope, name;
        if (v.name.includes(".")) {
          [scope, name] = v.name.split(".");
        } else {
          scope = "var";
          name = v.name;
        }
        if (VarScopeList.get().data.findIndex(v => v.name == scope) == -1) {
          VarScopeList.get().data.push({
            "key": v4(),
            "name": scope,
            type: "custom",
          })
        }
        let findIndex = VarList.get().data.findIndex(v => v.name == name && v.scope == scope);
        if (findIndex == -1) {
          VarList.get().data.push({
            "key": v4(),
            "name": name,
            "variableType": "string",
            "code": "",
            "scope": scope,
            "variableStrategy": "lazy",
            "description": v.value + " " + dayjs().format("YYYY-MM-DD HH:mm:ss"),
            "value": v.value,
          })
        } else {
          VarList.get().data[findIndex].value = v.value;
          VarList.get().data[findIndex].description = v.value + " " + dayjs().format("YYYY-MM-DD HH:mm:ss");
        }

      }
      await VarList.saveSync();
      await VarScopeList.saveSync();
      getMessageService().sendToRenderer({ type: "update_var_list" });
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
