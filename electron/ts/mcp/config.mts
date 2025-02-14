import path from "path";
import { fs, os, sleep } from "zx";
import * as MCP from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import log from "electron-log";
import { appDataDir } from "../const.mjs";
import { getMessageService } from "../mianWindow.mjs";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { initMcpServer } from "./servers/express.mjs";
import { MyServers } from "./servers/index.mjs";
import { electron, env } from "process";
import {
  electronData,
  AppSetting,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
} from "../../../common/data";
import { request } from "http";

import { spawnWithOutput } from "../common/util.mjs";
import { clientPaths } from "./claude.mjs";
import Logger from "electron-log";
import { startTask } from "./task.mjs";

await initMcpServer().catch((e) => {
  console.error("initMcpServer", e);
});

const { Client } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/index.js"
);
const { StdioClientTransport, getDefaultEnvironment } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/stdio.js"
);
const { SSEClientTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/client/sse.js"
);
const {
  ListToolsResultSchema,
  CallToolRequestSchema,
  CallToolResultSchema,
  CompatibilityCallToolResultSchema,
} = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/types.js"
);

// type ClientConfig = {
//   command?: string;
//   args?: string[];
//   env?: { [s: string]: string };
//   type?: "stdio" | "sse";
//   url?: string;
//   disabled?: boolean;
//   scope?:"built-in" | "outer";
// };

export const mcpClients = {} as {
  [s: string]: MCPClient;
};
export class MCPClient {
  public tools: Array<typeof MCPTypes.ToolSchema._type> = [];
  public resources: Array<typeof MCPTypes.ResourceSchema._type> = [];
  public prompts: Array<typeof MCPTypes.PromptSchema._type> = [];
  public client: MCP.Client = undefined;
  public status: string = "disconnected";

  constructor(public name: string, public config: MCP_CONFIG_TYPE) {}
  async callTool(functionName: string, args: any): Promise<any> {
    log.info("MCP callTool", functionName, args);
    if (this.status == "disconnected") {
      log.error("MCP callTool disconnected, restarting");
      await this.open();
    }

    return await this.client
      .callTool({ name: functionName, arguments: args })
      .catch((e) => {
        return this.client
          .request(
            {
              method: "tools/call",
              params: {
                name: functionName,
                arguments: args,
              },
            },
            CompatibilityCallToolResultSchema
          )
          .then((res) => {
            console.log("CompatibilityCallToolResultSchema: ", res);
            if (res.toolResult) {
              return res.toolResult;
            } else {
              return res;
            }
          });
      });
  }
  async callResource(uri: string): Promise<any> {
    log.info("MCP callTool", uri);
    if (this.status == "disconnected") {
      log.error("MCP callTool disconnected, restarting");
      await this.open();
    }
    return await this.client.readResource({ uri: uri });
  }
  async callPrompt(functionName: string, args: any): Promise<any> {
    log.info("MCP callPrompt", functionName, args);
    if (this.status == "disconnected") {
      log.error("MCP callTool disconnected, restarting");
      await this.open();
    }
    return await this.client.getPrompt({ name: functionName, arguments: args });
  }
  toJSON() {
    let { client, ...out } = this;
    return out;
  }
  async open(config?: MCP_CONFIG_TYPE) {
    if (this.config?.hyperchat?.type == "sse") {
      await this.openSse(config);
    } else {
      await this.openStdio(config);
    }

    let client = this.client;
    let tools_res = await client.listTools().catch((e) => {
      return { tools: [] };
    });
    let resources_res = await client.listResources().catch((e) => {
      return { resources: [] };
    });
    let listPrompts_res = await client.listPrompts().catch((e) => {
      return { prompts: [] };
    });
    // let listResourceTemplates_res = await client
    //   .listResourceTemplates()
    //   .catch((e) => {
    //     return { resourceTemplates: [] };
    //   });

    client.onclose = () => {
      log.info("client close");
      this.status = "disconnected";
      this.tools = [];
      this.resources = [];
      this.prompts = [];
    };
    client.onerror = (e) => {
      if (this.config.hyperchat.type == "sse") {
        //
      } else {
        log.error("client error", e);
      }

      // setTimeout(() => {
      //   this.open();
      // }, 3000);
    };

    this.tools = tools_res.tools;
    this.resources = resources_res.resources;
    this.prompts = listPrompts_res.prompts;
    this.status = "connected";
  }
  async openSse(c?: MCP_CONFIG_TYPE) {
    const client = new Client(
      {
        name: this.name,
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    let config = c || (await getConfg().then((r) => r.mcpServers[this.name]));
    let urlStr = config.hyperchat.url;

    const transport = new SSEClientTransport(new URL(urlStr));
    await client.connect(transport);
    this.client = client;
  }
  async openStdio(c?: MCP_CONFIG_TYPE) {
    let config = c || (await getConfg().then((r) => r.mcpServers[this.name]));

    try {
      let key = this.name;
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: Object.assign(getMyDefaultEnvironment(), config.env),
      });

      const client = new Client(
        {
          name: key,
          version: "1.0.0",
        },
        {
          capabilities: {},
        }
      );

      await client.connect(transport);
      this.client = client;
    } catch (e) {
      // let res = await spawnWithOutput(config.command, config.args, {
      //   env: Object.assign(getMyDefaultEnvironment(), config.env),
      // }).catch((e) => {
      //   return e;
      // });
      // console.log("spawnWithOutput ", res);
      // if (res.stderr) {
      //   throw new Error(res.stderr);
      // }
      // if (res.stdout) {
      //   throw new Error(res.stdout);
      // }
      throw e;
    }
  }
}

let firstRunStatus = 0;

export async function initMcpClients() {
  // console.log("initMcpClientsRunning", firstRunStatus);

  while (1) {
    if (firstRunStatus == 1) {
      console.log("getMcpClients runing");
      await sleep(100);
    } else {
      break;
    }
  }
  if (firstRunStatus == 0) {
    firstRunStatus = 1;
  }
  if (firstRunStatus == 2) {
    log.info("getMcpClients cached mcpClients", Object.keys(mcpClients).length);
    return mcpClients;
  }
  let p = clientPaths.claude;
  let mcp_path = path.join(appDataDir, "mcp.json");
  if (fs.existsSync(p) && !fs.existsSync(mcp_path)) {
    fs.copy(p, mcp_path);
  }

  let config = await getConfg();

  console.log(config);
  let tasks = [];
  for (let key in config.mcpServers) {
    if (mcpClients[key] == null) {
      mcpClients[key] = new MCPClient(key, config.mcpServers[key]);
    }
    if (config.mcpServers[key].disabled) {
      mcpClients[key].status = "disconnect";
    } else {
      try {
        tasks.push(mcpClients[key].open());
      } catch (e) {
        log.error("openMcpClient", e);
        continue;
      }
    }
  }
  await Promise.allSettled(tasks);

  firstRunStatus = 2;
  return mcpClients;
}
initMcpClients().then(() => {
  startTask();
});
export async function openMcpClient(
  clientName: string = undefined,
  clientConfig?: MCP_CONFIG_TYPE
) {
  if (mcpClients[clientName] != null) {
    await mcpClients[clientName].open(clientConfig);
  }

  let config = await getConfg();
  if (clientConfig == null) {
    clientConfig =
      config.mcpServers[clientName] || ({ hyperchat: {} } as MCP_CONFIG_TYPE);
  }
  let key = clientName;

  if (mcpClients[key] == null) {
    mcpClients[key] = new MCPClient(key, clientConfig);
  }
  if (clientConfig?.disabled) {
    mcpClients[key].status = "disabled";
  } else {
    try {
      await mcpClients[key].open(clientConfig);
    } catch (e) {
      log.error("openMcpClient", e);
      throw e;
    }
  }

  return mcpClients;
}

export async function getMcpClients() {
  while (1) {
    if (firstRunStatus == 1 || firstRunStatus == 0) {
      await sleep(100);
    } else {
      break;
    }
  }

  return mcpClients;
}

export async function closeMcpClients(clientName: string, isdelete: boolean) {
  let client = mcpClients[clientName];

  if (client.client != null) {
    await client.client.close();
  }
  client.client = undefined;
  client.tools = [];
  client.prompts = [];
  client.resources = [];
  if (isdelete) {
    delete mcpClients[clientName];
  }
  return mcpClients;
}

let config = MCP_CONFIG.initSync({ force: true });
for (let s of MyServers) {
  let key = s.name;
  config.mcpServers[key] = {
    command: "",
    args: [],
    env: {},
    hyperchat: {
      url: `http://localhost:${electronData.get().mcp_server_port}/${key}/sse`,
      type: "sse",
      scope: "built-in",
      config: {},
    },
    disabled: false,
  };
}
for (let key in config.mcpServers) {
  if (
    config.mcpServers[key].hyperchat?.scope == "built-in" &&
    !MyServers.find((x) => x.name == key)
  ) {
    delete config.mcpServers[key];
  }
}
await MCP_CONFIG.save();
export async function getConfg(): Promise<{
  mcpServers: { [s: string]: MCP_CONFIG_TYPE };
}> {
  let config = MCP_CONFIG.initSync({ force: true });

  // let obj: any = {};

  // config.mcpServers = Object.assign(obj, config.mcpServers);
  for (let key in config.mcpServers) {
    if (config.mcpServers[key].hyperchat == null) {
      config.mcpServers[key].hyperchat = {} as any;
    }
  }
  return config;
}

export function getMyDefaultEnvironment() {
  let env = getDefaultEnvironment();
  electronData.initSync({ force: true });
  if (electronData.get().PATH) {
    env.PATH = electronData.get().PATH;
  }
  return env;
}
