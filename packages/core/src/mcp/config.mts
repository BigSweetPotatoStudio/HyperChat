/**
 * MCP (Model Context Protocol) 客户端配置和连接管理模块
 * 
 * 核心功能：
 * - 管理 MCP 服务器配置（内置服务器 + 用户自定义服务器）
 * - 处理不同传输类型的 MCP 连接（stdio、HTTP、SSE）
 * - 提供统一的 MCP 客户端接口和工具调用
 * - 支持配置同步和热重载
 * - 处理连接重试和错误恢复
 */

import path from "path";
import {
  CallToolResultSchema,
  Client,
  CompatibilityCallToolResultSchema,
  LoggingMessageNotificationSchema,
  NotificationSchema as _NotificationSchema,
  ProgressNotificationSchema as _ProgressNotificationSchema,
  ResourceListChangedNotificationSchema,
  shellPathSync as _shellPathSync,
  SSEClientTransport,
  StreamableHTTPClientTransport,
  zx,
} from "src/es6.mjs";
const { fs, os, sleep } = zx;
import * as MCP from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";

import { Logger } from "src/polyfills/index.mjs";
import { appDataDir } from "src/polyfills/index.mjs";
import {
  StdioClientTransport,
  type StdioServerParameters as _StdioServerParameters,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { initMcpServer, MyServers } from "./servers/index.mjs";

import {
  electronData,
  AppSetting,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
  MCP_CONFIG_SYNC,
} from "../../../shared/data.mjs";

import { clientPaths } from "./claude.mjs";

import { startTask } from "./task.mjs";

import spawn from "cross-spawn";
import { getMyDefaultEnvironment } from "./utils.mjs";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Config } from "src/const.mjs";
import { v4 as _v4 } from "uuid";
import type { HyperChatCompletionTool, IMCPClient } from "../../../shared/data.mjs";
import { getMessageService } from "src/message_service.mjs";
import { shell as _shell } from "electron";
import { Stream as _Stream } from "node:stream";


// 初始化 MCP 配置，合并用户配置和同步配置
let config = await MCP_CONFIG.init();
let sync_config = await MCP_CONFIG_SYNC.init();

// 配置合并逻辑：同步配置优先级更高
for (let key in sync_config.mcpServers) {
  if (sync_config.mcpServers[key]?.isSync) {
    config.mcpServers[key] = sync_config.mcpServers[key]!;
  } else {
    if (config.mcpServers[key] != null) {
      config.mcpServers[key].isSync = false;
    }
  }
}

// 内置 MCP 服务器配置管理
let buildinMcpJSONPath = path.join(appDataDir, "mcpBuiltIn.json");
let buildinMcpJSON = {
  mcpServers: {} as { [s: string]: MCP_CONFIG_TYPE },
}

// MCP 客户端实例缓存
let mcpOBj = {} as { [s: string]: MCPClient };

// 读取已保存的内置服务器配置
if (fs.existsSync(buildinMcpJSONPath)) {
  try {
    buildinMcpJSON = fs.readJsonSync(buildinMcpJSONPath);
  } catch (e) {
    Logger.error("Failed to read buildInMcp.json", e);
  }
}

// 注册内置 MCP 服务器配置
for (let s of MyServers) {
  let key = s.name;
  if (s.type === "streamableHttp") {
    buildinMcpJSON.mcpServers[key] = {
      type: "streamableHttp",
      url: `http://localhost:${Config.mcp_server_port}/${key}/mcp`,
      hyperchat: {
        scope: "built-in",
        config: buildinMcpJSON.mcpServers[key]?.hyperchat?.config || {},
      } as any,
      disabled: buildinMcpJSON.mcpServers[key]?.disabled,
    } as MCP_CONFIG_TYPE;
  } else {
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

}
fs.writeFileSync(buildinMcpJSONPath, JSON.stringify(buildinMcpJSON, null, 2));

for (let key in config.mcpServers) {
  if (
    config.mcpServers[key]?.hyperchat?.scope === "built-in"
  ) {
    delete config.mcpServers[key];
  }

  if (config.mcpServers[key]?.hyperchat?.type == "sse") {
    config.mcpServers[key].type = "sse";
    config.mcpServers[key].url = config.mcpServers[key].hyperchat.url;
  }
}
MCP_CONFIG.saveSync(false);

await initMcpServer().catch((e) => {
  console.error("initMcpServer", e);
});

let notificationCount = 0;
export let mcpClients: Array<MCPClient> = [];
export class MCPClient implements IMCPClient {
  public tools: Array<HyperChatCompletionTool> = [];
  public resources: any[] = [];
  public prompts: any[] = [];
  public client!: MCP.Client;
  public status: "disconnected" | "connected" | "connecting" | "disabled" =
    "disconnected";
  public version = "";
  public servername = "";
  public ext: {
    configSchema?: { [s in string]: any };
  } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5秒

  constructor(public name: string, public config: MCP_CONFIG_TYPE, public source: "hyperchat" | "claude" | "builtin" = "hyperchat", public order: number = 0) {
    let s = MyServers.find((s) => s.name === name);
    if (s?.configSchema) {
      this.ext.configSchema = zodToJsonSchema(s.configSchema);
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
    // console.log("open", this.config)

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
      await sleep(Math.random() * 1000);

      // if(Math.random() > 0.5) {
      //   throw new Error("test error");
      // }
      if (this.config?.type == "sse" || this.config?.hyperchat?.type == "sse") {
        await this.openSse(this.config);
      } else if (this.config?.type == "streamableHttp") {
        await this.openStreamableHttp(this.config);
      } else {
        await this.openStdio(this.config);
      }

      let client = this.client;
      // let c = client.getServerCapabilities();
      // console.log(c);
      let tools_res = await client.listTools().catch((e) => {
        Logger.error("listTools error: ", e);
        return { tools: [] };
      });
      // console.log("listTools", tools_res);
      let resources_res = await client.listResources().catch((_e) => {
        return { resources: [] };
      });
      let listPrompts_res = await client.listPrompts().catch((_e) => {
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
        getMessageService().sendAllToRenderer({
          type: "changeMcpClient",
          data: mcpClients,
        })
      };
      client.onerror = (e) => {
        // console.log("client onerror: ", this.config);
        if (this.config?.type == "sse" || this.config?.hyperchat?.type == "sse") { // sse
          this.status = "disconnected";
          if (e.message.includes("SSE stream disconnected") || e.message.includes("Body Timeout Error")) {
            // 对于超时错误，只记录信息，不显示为错误
            if (process.env.myEnv == "dev") {
              console.log(`${this.name} client encountered timeout, this is normal for SSE`);
            }
          } else {
            Logger.error(`${this.name} client see onerror: `, e);
          }
        } else if (this.config?.type == "streamableHttp") { // streamableHttp
          this.status = "disconnected";
          if (e.message.includes("SSE stream disconnected") || e.message.includes("connection terminated")) {
            // 处理 SSE 流断开的情况
            if (process.env.myEnv == "dev") {
              console.log(`${this.name} StreamableHTTP connection terminated, will reconnect automatically`);
            }
          } else {
            Logger.error(`${this.name} client ${this.config?.type} onerror: `, e);
          }
        } else { // stdio
          if (e.message.includes("not valid JSON")) {
            Logger.info(`${this.name} client received invalid JSON, continuing`);
          } else {
            Logger.error(`${this.name} client ${this.config?.type} onerror: `, e);
            this.status = "disconnected";
            getMessageService().sendAllToRenderer({
              type: "changeMcpClient",
              data: mcpClients,
            })
          }
        }
      };
      let res = await this.client.getServerVersion();
      this.version = res?.version || '';
      this.servername = res?.name || '';

      this.tools = tools_res.tools.map((tool, i) => {
        let name = this.name.replace(/[^a-zA-Z0-9_-]/g, "") + "_" + (tool.name.replace(/[^a-zA-Z0-9_-]/g, "") || i.toString())

        return {
          name: tool.name,
          inputSchema: tool.inputSchema,
          description: tool.description,
          type: "function" as const,
          function: {
            name: name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
          origin_name: tool.name,
          restore_name: this.name + " > " + tool.name,
          key: this.name,
          clientName: this.name,
          client: this.name,
        } as HyperChatCompletionTool;
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
        notificationCount++;
        console.log(`\nNotification #${notificationCount}: ${notification.params.level} - ${notification.params.data}`);
        // Re-display the prompt
        process.stdout.write('> ');
      });

      this.client.setNotificationHandler(LoggingMessageNotificationSchema, (notification) => {
        Logger.info("Received notification LoggingMessageNotificationSchema:", notification);
      });

      this.client.setNotificationHandler(ResourceListChangedNotificationSchema, async (notification) => {
        Logger.info("Received notification ResourceListChangedNotificationSchema:", notification);
        let resources_res = await client.listResources().catch((_e) => {
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

    const url = config?.url || config?.hyperchat?.url;
    if (!url) throw new Error('URL is required for SSE transport');
    const transport = new SSEClientTransport(new URL(url), {
      requestInit: {
        keepalive: true,
        headers: config.headers || {},
      }
    });
    await client.connect(transport);
    this.client = client;
  }
  async openStreamableHttp(config: MCP_CONFIG_TYPE) {
    const client = new Client({
      name: this.name,
      version: "1.0.0",
      capabilities: {
      }
    });
    if (!config?.url) throw new Error('URL is required for StreamableHTTP transport');
    const transport = new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: {
        keepalive: true,
        headers: config.headers || {},
      }
      // sessionId: v4(),
    });

    try {
      await client.connect(transport as any);
      this.client = client;

    } catch (e) {
      throw e;
    }
  }
  async openStdio(config: MCP_CONFIG_TYPE) {
    let env = Object.assign(getMyDefaultEnvironment(), config.env);
    // console.log("openStdio", config.command, config.args, env);
    // let stream = new Stream();
    // stream.on('data', (data) => {
    //   console.log(`stderr: ${data}`);
    // });
    if (!config.command) throw new Error('Command is required for stdio transport');
    let params = {
      command: config.command,
      args: config.args || [],
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
      if (e instanceof Error && e.message.includes("MCP error -32000: Connection closed")) {
        await SpawnError(config.command!, config.args || [], env);
      }
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
        MCP_CONFIG.saveSync()
        return;
      } else {
        MCP_CONFIG.initSync().mcpServers[this.name] = this.config;
        MCP_CONFIG.saveSync()
      }

    } else if (this.source == "builtin") {
      buildinMcpJSON = fs.readJsonSync(buildinMcpJSONPath);
      buildinMcpJSON.mcpServers[this.name] = this.config;
      fs.writeFileSync(buildinMcpJSONPath, JSON.stringify(buildinMcpJSON, null, 2));
    }
  }

  // 添加新的重连方法
  async tryReconnect() {
    if (this.status === "disabled" || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        Logger.error(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached for ${this.name}`);
      }
      this.status = "disconnected";
      getMessageService().sendAllToRenderer({
        type: "changeMcpClient",
        data: mcpClients,
      });
      this.reconnectAttempts = 0;
      return false;
    }

    this.reconnectAttempts++;
    Logger.info(`Attempting to reconnect ${this.name} (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    this.status = "connecting";
    getMessageService().sendAllToRenderer({
      type: "changeMcpClient",
      data: mcpClients,
    });

    try {
      await sleep(this.reconnectDelay);
      await this.open();
      Logger.info(`Successfully reconnected to ${this.name}`);
      this.reconnectAttempts = 0;
      return true;
    } catch (error) {
      Logger.error(`Failed to reconnect to ${this.name}:`, error);

      // 指数退避策略，每次失败后增加等待时间
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // 最大30秒

      // 触发下一次重连
      setTimeout(() => {
        this.tryReconnect();
      }, 0);

      return false;
    }
  }
}

function SpawnError(command: string, args: string[], env: any) {
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
      child.stdout?.on('data', (data) => {
        output += data + "\n";
        // console.log(`stdout: ${data}`);
      });

      child.stderr?.on('data', (data) => {
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
      await sleep(1000);
    } else {
      break;
    }
  }
  if (firstRunStatus == 0) {
    firstRunStatus = 1;
  }
  if (firstRunStatus == 2) {
    Logger.info(
      "initMcpClients cached mcpClients",
      mcpClients.length
    );
    getMessageService().sendAllToRenderer({
      type: "changeMcpClient",
      data: mcpClients,
    })
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
            }).catch((_e) => {
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
    if (!c) continue;
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
        }).catch((_e) => {
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
            }).catch((_e) => {
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

  await Promise.allSettled(tasks).catch((e) => {
    Logger.error("initMcpClient", e);
    firstRunStatus = 2;
  });

  firstRunStatus = 2;
  getMessageService().sendAllToRenderer({
    type: "changeMcpClient",
    data: mcpClients,
  });
  return mcpClients;
}

let t = setInterval(() => {
  getMessageService().sendAllToRenderer({
    type: "changeMcpClient",
    data: mcpClients,
  });
}, 1000);

Promise.race([initMcpClients(), sleep(1000 * 60)]).then(() => {
  firstRunStatus = 2;
  clearInterval(t);
  startTask();
}).catch((_e) => {
  firstRunStatus = 2;
  clearInterval(t);
  startTask();
});
export async function openMcpClient(
  name?: string,
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
    if (!name || !clientConfig) throw new Error('Name and clientConfig are required');
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
  return mcpClients;
}

export async function closeMcpClients(name: string, {
  isdelete,
  isdisable
}: {
  isdelete?: boolean;
  isdisable?: boolean;
}) {
  let mcpClient = mcpClients.find((c) => c.name == name);
  if (mcpClient == null) {
    return;
  }
  if (mcpClient.client != null) {
    await mcpClient.client.close();
  }
  mcpClient.client = null as any;
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


