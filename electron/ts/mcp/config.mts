import path from "path";
import {
  CallToolResultSchema,
  Client,
  CompatibilityCallToolResultSchema,
  shellPathSync,
  SSEClientTransport,
  zx,
} from "ts/es6.mjs";
const { fs, os, sleep } = zx;
import * as MCP from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { Logger } from "ts/polyfills/index.mjs";
import { appDataDir } from "ts/polyfills/index.mjs";
import {
  StdioClientTransport,
  type StdioServerParameters,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { initMcpServer, MyServers } from "./servers/index.mjs";

import {
  electronData,
  AppSetting,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
} from "../../../common/data";

import { clientPaths } from "./claude.mjs";

import { startTask } from "./task.mjs";

import { spawn } from "node:child_process";
import { getMyDefaultEnvironment } from "./utils.mjs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Config } from "ts/const.mjs";
// import cross_spawn from "cross-spawn";

let config = MCP_CONFIG.initSync();

for (let s of MyServers) {
  let key = s.name;
  config.mcpServers[key] = {
    command: "",
    args: [],
    env: {},
    hyperchat: {
      url: `http://localhost:${Config.mcp_server_port}/${key}/sse`,
      type: "sse",
      scope: "built-in",
      config: config.mcpServers[key]?.hyperchat?.config || {},
    },
    disabled: config.mcpServers[key]?.disabled,
  };
}
for (let key in config.mcpServers) {
  if (
    config.mcpServers[key].hyperchat?.scope == "built-in" &&
    !MyServers.find((s) => s.name == key)
  ) {
    delete config.mcpServers[key];
  }

  if (config.mcpServers[key].hyperchat == null) {
    config.mcpServers[key].hyperchat = {
      config: {},
    } as any;
  } else {
    if (config.mcpServers[key].hyperchat.config == null) {
      config.mcpServers[key].hyperchat.config = {};
    }
  }
}
await MCP_CONFIG.save();

await initMcpServer().catch((e) => {
  console.error("initMcpServer", e);
});

export const mcpClients = {} as {
  [s: string]: MCPClient;
};
export class MCPClient {
  public tools: Array<typeof MCPTypes.ToolSchema._type> = [];
  public resources: Array<typeof MCPTypes.ResourceSchema._type> = [];
  public prompts: Array<typeof MCPTypes.PromptSchema._type> = [];
  public client: MCP.Client = undefined;
  public status: "disconnected" | "connected" | "connecting" | "disabled" =
    "disconnected";

  public ext: {
    configSchema?: { [s in string]: any };
  } = {};

  constructor(public name: string, public config: MCP_CONFIG_TYPE) {
    let s = MyServers.find((s) => s.name == name);
    if (s) {
      this.ext.configSchema = s.configSchema
        ? zodToJsonSchema(s.configSchema)
        : undefined;
    }
  }
  async callTool(functionName: string, args: any): Promise<any> {
    Logger.info("MCP callTool", functionName, args);
    if (this.status == "disconnected") {
      Logger.error("MCP callTool disconnected, restarting");
      await this.open();
    }
    let mcpCallToolTimeout = (await AppSetting.init()).mcpCallToolTimeout;
    let res = await this.client
      .callTool(
        {
          name: functionName,
          arguments: args,
        },
        CallToolResultSchema,
        { timeout: mcpCallToolTimeout * 1000 }
      )
      .catch(async (e) => {
        return await this.client
          .request(
            {
              method: "tools/call",
              params: {
                name: functionName,
                arguments: args,
              },
            },
            CompatibilityCallToolResultSchema,
            { timeout: mcpCallToolTimeout * 1000 }
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
    return res;
  }
  async callResource(uri: string): Promise<MCPTypes.ReadResourceResult> {
    Logger.info("MCP callTool", uri);
    if (this.status == "disconnected") {
      Logger.error("MCP callTool disconnected, restarting");
      await this.open();
    }
    return await this.client.readResource({ uri: uri });
  }
  async callPrompt(functionName: string, args: any): Promise<any> {
    Logger.info("MCP callPrompt", functionName, args);
    if (this.status == "disconnected") {
      Logger.error("MCP callTool disconnected, restarting");
      await this.open();
    }
    return await this.client.getPrompt({ name: functionName, arguments: args });
  }
  toJSON() {
    let { client, ...out } = this;
    return out;
  }
  async open() {

    try {
      this.status = "connecting";
      // await sleep(Math.random() * 10000);
      // if(Math.random() > 0.5) {
      //   throw new Error("test error");
      // }
      if (this.config?.hyperchat?.type == "sse") {
        await this.openSse(this.config);
      } else {
        await this.openStdio(this.config);
      }
      let client = this.client;
      // let c = client.getServerCapabilities();
      // console.log(c);
      let tools_res = await client.listTools().catch((e) => {
        return { tools: [] };
      });
      // console.log("listTools", tools_res);
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
        Logger.info("client close");
        this.status = "disconnected";
        this.tools = [];
        this.resources = [];
        this.prompts = [];
      };
      client.onerror = (e) => {
        // console.log("client onerror: ", this.config);
        if (this.config?.hyperchat?.type == "sse") {
          if (e.message.includes("Body Timeout Error")) {
          } else {
            Logger.error("client see onerror: ", e);
          }
        } else {
          if (e.message.includes("not valid JSON")) {
          } else {
            Logger.error("client stdio onerror: ", e);
          }
        }
      };

      this.tools = tools_res.tools;
      this.resources = resources_res.resources;
      this.prompts = listPrompts_res.prompts;
      this.status = "connected";
    } catch (e) {
      this.status = "disconnected";
      throw e;
    }
  }
  async openSse(config: MCP_CONFIG_TYPE) {
    const client = new Client({
      name: this.name,
      version: "1.0.0",
    });

    const transport = new SSEClientTransport(new URL(config?.hyperchat?.url));
    await client.connect(transport);
    this.client = client;
  }
  async openStdio(config: MCP_CONFIG_TYPE) {
    let env = Object.assign(getMyDefaultEnvironment(), config.env);
    // console.log("openStdio", config.command, config.args, env);
    let params = {
      command: config.command,
      args: config.args,
      env: env,
    };

    try {
      const transport = new StdioClientTransport(params);
      const client = new Client({
        name: this.name,
        version: "1.0.0",
      });

      await client.connect(transport);
      this.client = client;
    } catch (e) {
      Logger.error(params, e);
      // if (os.platform() == "win32" && e.message.includes("Connection closed")) {
      //   // log.error("Connection closed, testing");
      //   e = await checkError(params)
      //     .then((_) => e)
      //     .catch((e) => e);
      // }
      throw e;
    }
  }
}

async function checkError(params: any) {
  return await new Promise((resolve, reject) => {
    let proc = spawn(params.command, params.args, {
      env: params.env,
      // shell: true,
    });
    // proc.on("data", (data) => {
    //   console.log(data.toString());
    // });
    setTimeout(() => {
      proc.kill();
      resolve({ error: 0 });
    }, 1000);
    proc.on("error", (err) => {
      reject(err);
    });
  });
}

let firstRunStatus = 0;

export const loadObj = {
  status: {} as { [s: string]: number },
  all: 0,
  loaded: 0,
};
export async function initMcpClients() {
  // console.log("initMcpClientsRunning", firstRunStatus);

  while (1) {
    if (firstRunStatus == 1) {
      console.log("waiting");
      await sleep(500);
    } else {
      break;
    }
  }
  if (firstRunStatus == 0) {
    firstRunStatus = 1;
  }
  if (firstRunStatus == 2) {
    Logger.info(
      "getMcpClients cached mcpClients",
      Object.keys(mcpClients).length
    );
    return mcpClients;
  }
  let p = clientPaths.claude;
  let mcp_path = path.join(appDataDir, "mcp.json");
  if (fs.existsSync(p) && !fs.existsSync(mcp_path)) {
    fs.copy(p, mcp_path);
  }

  let config = await MCP_CONFIG.initSync();

  // console.log(config);
  let tasks = [];

  for (let key in config.mcpServers) {
    // tasks.push(openMcpClient(key, config.mcpServers[key]));

    if (config.mcpServers[key].disabled) {
      // mcpClients[key].status = "disconnect";
    } else {
      if (mcpClients[key] == null) {
        mcpClients[key] = new MCPClient(key, config.mcpServers[key]);
      }
      try {
        loadObj.all += 1;
        loadObj.status[key] = 0;
        tasks.push(
          mcpClients[key].open().then(() => {
            loadObj.loaded += 1;
            loadObj.status[key] = 1;
          })
        );
      } catch (e) {
        Logger.error("initMcpClient", e);
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
  // if (mcpClients[clientName] != null) {
  //   await mcpClients[clientName].open(clientConfig);
  // }

  if (clientConfig == null) {
    let config = await MCP_CONFIG.initSync();
    if (config.mcpServers[clientName] == null) {
      throw new Error("MCP Config is null");
    }
    clientConfig = config.mcpServers[clientName] as MCP_CONFIG_TYPE;
  }

  if (mcpClients[clientName] && clientConfig?.disabled) {
    mcpClients[clientName].client?.close();
    mcpClients[clientName].status = "disabled";
    return mcpClients;
  }
  let newMCP = new MCPClient(clientName, clientConfig);
  try {
    await newMCP.open();
  } catch (e) {
    Logger.error("openMcpClient", e);
    throw e;
  }
  // clean old client
  if (mcpClients[clientName] != null) {
    if (mcpClients[clientName].client != null) {
      mcpClients[clientName].client.close();
    }
  }
  mcpClients[clientName] = newMCP;
  return mcpClients;
}

export async function getMcpClients() {
  // while (1) {
  //   if (firstRunStatus == 1 || firstRunStatus == 0) {
  //     await sleep(100);
  //   } else {
  //     break;
  //   }
  // }
  return mcpClients;
}

export async function closeMcpClients(clientName: string, isdelete: boolean) {
  let client = mcpClients[clientName];
  if (client == null) {
    return;
  }
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
