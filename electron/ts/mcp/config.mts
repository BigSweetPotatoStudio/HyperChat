import path from "path";
import {
  CallToolResultSchema,
  Client,
  CompatibilityCallToolResultSchema,
  LoggingMessageNotificationSchema,
  NotificationSchema,
  ProgressNotificationSchema,
  ResourceListChangedNotificationSchema,
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
  MCP_CONFIG_SYNC,
} from "../../../common/data";

import { clientPaths } from "./claude.mjs";

import { startTask } from "./task.mjs";

import spawn from "cross-spawn";
import { getMyDefaultEnvironment } from "./utils.mjs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Config } from "ts/const.mjs";
import { v4 } from "uuid";
import type { HyperChatCompletionTool, IMCPClient } from "../../../common/data";
import { getMessageService } from "ts/message_service.mjs";
import { shell } from "electron";
import { Stream } from "node:stream";

let config = MCP_CONFIG.initSync();
let sync_config = MCP_CONFIG_SYNC.initSync();
for (let key in sync_config.mcpServers) {
  if (sync_config.mcpServers[key].isSync) {
    config.mcpServers[key] = sync_config.mcpServers[key];
  } else {
    if (config.mcpServers[key] != null) {
      config.mcpServers[key].isSync = false;
    }
  }
}

let buildinMcpJSONPath = path.join(appDataDir, "mcpBuiltIn.json");
let buildinMcpJSON = {
  mcpServers: {} as { [s: string]: MCP_CONFIG_TYPE },
}
let mcpOBj = {} as { [s: string]: MCPClient };
if (fs.existsSync(buildinMcpJSONPath)) {
  try {
    buildinMcpJSON = fs.readJsonSync(buildinMcpJSONPath);
  } catch (e) {
    Logger.error("Failed to read buildInMcp.json", e);
  }

}
for (let s of MyServers) {
  let key = s.name;
  buildinMcpJSON.mcpServers[key] = {
    type: "sse",
    url: `http://localhost:${Config.mcp_server_port}/${key}/sse`,
    hyperchat: {
      scope: "built-in",
      config: buildinMcpJSON.mcpServers[key]?.hyperchat?.config || {},
    } as any,
    disabled: buildinMcpJSON.mcpServers[key]?.disabled,
  } as MCP_CONFIG_TYPE;
}
fs.writeFileSync(buildinMcpJSONPath, JSON.stringify(buildinMcpJSON, null, 2));

for (let key in config.mcpServers) {
  if (
    config.mcpServers[key].hyperchat?.scope == "built-in"
  ) {
    delete config.mcpServers[key];
  }

  if (config.mcpServers[key]?.hyperchat?.type == "sse") {
    config.mcpServers[key].type = "sse";
    config.mcpServers[key].url = config.mcpServers[key].hyperchat.url;
  }
}
await MCP_CONFIG.save(false);

await initMcpServer().catch((e) => {
  console.error("initMcpServer", e);
});

export let mcpClients: Array<MCPClient> = [];
export class MCPClient implements IMCPClient {
  public tools: Array<HyperChatCompletionTool> = [];
  public resources = [];
  public prompts = [];
  public client: MCP.Client = undefined;
  public status: "disconnected" | "connected" | "connecting" | "disabled" =
    "disconnected";
  public version = "";
  public servername = "";
  public ext: {
    configSchema?: { [s in string]: any };
  } = {};

  constructor(public name: string, public config: MCP_CONFIG_TYPE, public source: "hyperchat" | "claude" | "builtin" = "hyperchat", public order: number = 0) {
    let s = MyServers.find((s) => s.name == name);
    if (s) {
      this.ext.configSchema = s.configSchema
        ? zodToJsonSchema(s.configSchema)
        : undefined;
    }

  }
  async callTool(functionName: string, args: any): Promise<any> {

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
        Logger.info("MCP CallTool Error: ", functionName, args, e);
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
          }).catch((e) => {
            Logger.info("MCP CallTool Compatibility Error: ", functionName, args, e);
            throw e;
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


    if (this.config.disabled) {
      this.status = "disabled";
      return;
    }
    try {
      this.status = "connecting";
      getMessageService().sendAllToRenderer({
        type: "changeMcpClient",
        data: mcpClients,
      })
      // await sleep(Math.random() * 10000);
      // if(Math.random() > 0.5) {
      //   throw new Error("test error");
      // }
      if (this.config?.type == "sse" || this.config?.hyperchat?.type == "sse") {
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
        if (this.config?.type == "sse" || this.config?.hyperchat?.type == "sse") {
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
      let res = await this.client.getServerVersion();
      this.version = res.version;
      this.servername = res.name;

      this.tools = tools_res.tools.map((tool, i) => {
        let name = "m" + i + "_" + tool.name;

        return {
          type: "function" as const,
          function: {
            name: name,
            description: tool.description,
            parameters: {
              type: tool.inputSchema.type,
              properties: formatProperties(tool.inputSchema.properties, name),
              required: tool.inputSchema.required,
            },
          },
          origin_name: tool.name,
          restore_name: this.name + " > " + tool.name,
          key: this.name,
          clientName: this.name,
          client: this.name,
        };
      });
      this.resources = resources_res.resources.map((x) => {
        return {
          ...x,
          key: this.name + " > " + x.name,
          clientName: this.name,
        };
      });
      this.prompts = listPrompts_res.prompts.map((x) => {
        return {
          ...x,
          key: this.name + " > " + x.name,
          clientName: this.name,
        };
      });
      // this.client.subscribeResource({
      //   uri: "resource://modelcontextprotocol/metadata",
      // });
      // this.client.setLoggingLevel("debug");
      this.client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
        Logger.info("Received notification LoggingMessageNotificationSchema:", notification);
      });

      this.client.setNotificationHandler(ResourceListChangedNotificationSchema, async (notification) => {
        Logger.info("Received notification ResourceListChangedNotificationSchema:", notification);
        let resources_res = await client.listResources().catch((e) => {
          return { resources: [] };
        });
        this.resources = resources_res.resources.map((x) => {
          return {
            ...x,
            key: this.name + " > " + x.name,
            clientName: this.name,
          };
        });
        getMessageService().sendAllToRenderer({
          type: "changeMcpClient",
          data: mcpClients,
        })
      });

      this.status = "connected";
      getMessageService().sendAllToRenderer({
        type: "changeMcpClient",
        data: mcpClients,
      })

    } catch (e) {
      this.status = "disconnected";
      getMessageService().sendAllToRenderer({
        type: "changeMcpClient",
        data: mcpClients,
      })
      throw e;
    }
  }
  async openSse(config: MCP_CONFIG_TYPE) {
    const client = new Client({
      name: this.name,
      version: "1.0.0",
      capabilities: {
      }
    });

    const transport = new SSEClientTransport(new URL(config?.url || config?.hyperchat?.url));
    await client.connect(transport);
    this.client = client;
  }
  async openStdio(config: MCP_CONFIG_TYPE) {
    let env = Object.assign(getMyDefaultEnvironment(), config.env);
    // console.log("openStdio", config.command, config.args, env);
    let stream = new Stream();
    stream.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
    let params = {
      command: config.command,
      args: config.args,
      env: env,
      // stderr: stream,
    };

    try {
      const transport = new StdioClientTransport(params);
      const client = new Client({
        name: this.name,
        version: "1.0.0",
        capabilities: {

        }
      });

      await client.connect(transport);
      this.client = client;
    } catch (e) {
      Logger.error(params, e);
      if (e.message.includes("MCP error -32000: Connection closed")) {
        await SpawnError(config.command, config.args, env);
      }
      // console.log("eeeeeeeeeeeeeeeeeeeeeeeee");
      throw e;
    }
  }
  loadConfig() {
    if (this.source == "hyperchat") {
      this.config = MCP_CONFIG.initSync().mcpServers[this.name] as MCP_CONFIG_TYPE;
    }
    if (this.source == "builtin") {
      buildinMcpJSON = fs.readJsonSync(buildinMcpJSONPath);
      this.config = buildinMcpJSON.mcpServers[this.name] as MCP_CONFIG_TYPE;
    }
    if (this.source == "claude") {
      let p = clientPaths.claude;
      Logger.info("initClaudeConfig", "found", p);
      let config = fs.readJsonSync(p);
      this.config = config.mcpServers[this.name] as MCP_CONFIG_TYPE;
    }
  }
  saveConfig({ isdelete }: { isdelete?: boolean } = {}) {
    if (this.source == "hyperchat") {
      if (isdelete) {
        delete MCP_CONFIG.initSync().mcpServers[this.name];
        MCP_CONFIG.save()
        return;
      } else {
        MCP_CONFIG.initSync().mcpServers[this.name] = this.config;
        MCP_CONFIG.save()
      }

    } else if (this.source == "builtin") {
      buildinMcpJSON = fs.readJsonSync(buildinMcpJSONPath);
      buildinMcpJSON.mcpServers[this.name] = this.config;
      fs.writeFileSync(buildinMcpJSONPath, JSON.stringify(buildinMcpJSON, null, 2));
    }
  }
}

function SpawnError(command: string, args: string[], env) {
  return new Promise((resolve, reject) => {
    try {
      // reject(new Error("test error"));
      let child = spawn(command, args, {
        // stdio: ['pipe', 'pipe', 'pipe', 'pipe'],  // 使用管道
        stdio: 'pipe',

        // 其他选项
        cwd: os.homedir(),
        // signal: abortCtrl.signal,
        env: env,
        shell: false,
      });
      let output = "";
      // 添加事件处理器
      child.stdout.on('data', (data) => {
        output += data + "\n";
        // console.log(`stdout: ${data}`);
      });

      child.stderr.on('data', (data) => {
        output += data + "\n";
        // console.error(`stderr: ${data}`);
      });

      child.on('error', (err) => {
        console.error(`Failed to start the child process: ${err}`);
        reject(err); // 正确地拒绝 Promise
      });

      child.on('close', (code) => {
        console.log(`The child process exited, exit code: ${code}`);
        if (code !== 0) {
          reject(new Error(`The child process exited, exit code: ${code}\n${output}`)); // 正确地拒绝 Promise
        } else {
          resolve(code); // 正确地完成 Promise
        }
      });
    } catch (e) {
      console.error(`Error creating child process: ${e}`);
      reject(e); // 捕获并拒绝 Promise
    }
  });

}

let firstRunStatus = 0;

let order = 0;
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
      mcpClients.length
    );
    return mcpClients;
  }
  let config = MCP_CONFIG.initSync();

  // console.log(config);
  let tasks = [];

  try {
    let p = buildinMcpJSONPath;
    if (fs.existsSync(p)) {
      Logger.info("initBuildInMcpConfig", "found", p);
      let config = fs.readJsonSync(p);
      for (let key in config.mcpServers) {
        order++;
        const c = config.mcpServers[key];
        if (mcpOBj[key] != null) {
          key = key + "_" + electronData.initSync().uuid.slice(0, 8);
        }
        const mcpClient = new MCPClient(key, c, "builtin", order);
        mcpClients.push(mcpClient);
        mcpOBj[key] = mcpClient;
        try {
          tasks.push(
            mcpClient.open().then(() => {
              getMessageService().sendAllToRenderer({
                type: "changeMcpClient",
                data: mcpClients,
              })
            }).catch((e) => {
              getMessageService().sendAllToRenderer({
                type: "changeMcpClient",
                data: mcpClients,
              })
            })
          );
        } catch (e) {
          Logger.error("initMcpClient", e);
          continue;
        }

      }
    }
  } catch (e) {
    Logger.error("initClaudeConfig", "error", e);
  }

  for (let key in config.mcpServers) {
    order++;

    const c = config.mcpServers[key];
    if (mcpOBj[key] != null) {
      key = key + "_" + electronData.initSync().uuid.slice(0, 8);
    }
    const mcpClient = new MCPClient(key, c, "hyperchat", order);
    mcpClients.push(mcpClient);
    mcpOBj[key] = mcpClient;
    try {
      tasks.push(
        mcpClient.open().then(() => {
          getMessageService().sendAllToRenderer({
            type: "changeMcpClient",
            data: mcpClients,
          })
        }).catch((e) => {
          getMessageService().sendAllToRenderer({
            type: "changeMcpClient",
            data: mcpClients,
          })
        })
      );
    } catch (e) {
      Logger.error("initMcpClient", e);
      continue;
    }
  }
  try {
    let p = clientPaths.claude;
    if (fs.existsSync(p)) {
      Logger.info("initClaudeConfig", "found", p);
      let config = fs.readJsonSync(p);
      for (let key in config.mcpServers) {
        order++;

        const c = config.mcpServers[key];
        if (mcpOBj[key] != null) {
          key = key + "_" + electronData.initSync().uuid.slice(0, 8);
        }

        c.disabled = !electronData.initSync().isLoadClaudeConfig;

        const mcpClient = new MCPClient(key, c, "claude", order);
        mcpClients.push(mcpClient);
        mcpOBj[key] = mcpClient;

        try {


          tasks.push(

            mcpClient.open().then(() => {
              getMessageService().sendAllToRenderer({
                type: "changeMcpClient",
                data: mcpClients,
              })
            }).catch((e) => {
              getMessageService().sendAllToRenderer({
                type: "changeMcpClient",
                data: mcpClients,
              })
            })
          );
        } catch (e) {
          Logger.error("initMcpClient", e);
          continue;
        }

      }
    }
  } catch (e) {
    Logger.error("initClaudeConfig", "error", e);
  }

  await Promise.allSettled(tasks);

  firstRunStatus = 2;
  return mcpClients;
}
initMcpClients().then(() => {
  startTask();
});
export async function openMcpClient(
  name: string = undefined,
  clientConfig?: MCP_CONFIG_TYPE,
  options = {
    onlySave: false,
  }
) {

  let mcpClient = mcpClients.find((c) => c.name == name);
  if (mcpClient != null) {
    if (clientConfig == null) {
      mcpClient.loadConfig();
    } else {
      mcpClient.config = clientConfig;
    }
    delete mcpClient.config.disabled;
  } else {
    mcpClient = new MCPClient(name, clientConfig, "hyperchat", order);
    mcpClients.push(mcpClient);
    mcpOBj[name] = mcpClient;
  }
  if (options.onlySave) {
    mcpClient.saveConfig();

  } else {
    if (mcpClient.source == "builtin") {
      mcpClient.saveConfig();
    }
    try {
      await mcpClient.open();
      mcpClient.saveConfig();

    } catch (e) {
      Logger.error("openMcpClient", e);
      throw e;
    }
  }
  getMessageService().sendAllToRenderer({
    type: "changeMcpClient",
    data: mcpClients,
  })
  return mcpClients;
}

export async function getMcpClients() {
  getMessageService().sendAllToRenderer({
    type: "changeMcpClient",
    data: mcpClients,
  })
  return mcpClients;
}

export async function closeMcpClients(name: string, {
  isdelete,
  isdisable
}) {
  let mcpClient = mcpClients.find((c) => c.name == name);
  if (mcpClient == null) {
    return;
  }
  if (mcpClient.client != null) {
    await mcpClient.client.close();
  }
  mcpClient.client = undefined;
  mcpClient.tools = [];
  mcpClient.prompts = [];
  mcpClient.resources = [];
  if (isdisable) {
    mcpClient.status = "disabled";
    mcpClient.config.disabled = true;
    mcpClient.saveConfig();
  }
  if (isdelete) {
    mcpClient.saveConfig({ isdelete: isdelete });
    mcpClients = mcpClients.filter((c) => c.name != name);
  }
  getMessageService().sendAllToRenderer({
    type: "changeMcpClient",
    data: mcpClients,
  })
  return mcpClients;
}


export function formatProperties(obj: any, toolName: string = "") {
  if (obj == null) {
    return {
      compatible: {
        type: "string",
        description: "ignore, no enter", // compatible gemini-openai
      },
    };
  }
  // if (toolName == "NOTION_INSERT_ROW_DATABASE") {
  //   debugger;
  // }
  try {
    for (let key in obj) {
      if (obj[key].type == "object") {
        obj[key].properties = formatProperties(obj[key].properties, toolName);
        // delete obj[key].additionalProperties; // Corrected to delete obj[key].additionalProperties
        delete obj[key].items;
      } else if (obj[key].type == "array") {
        obj[key].items = formatProperties(obj[key].items, toolName);
        // delete obj[key].items.additionalProperties; // Corrected to delete obj[key].additionalProperties
        delete obj[key].properties;
      }
    }

  } catch (e) {
    console.error(e);
  }
  // console.log(obj);
  return obj;
}
