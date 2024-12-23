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
import { electron } from "process";
import { electronData } from "../common/data.mjs";
import { request } from "http";

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

let mcpClients = {} as {
  [s: string]: MCPClient;
};
class MCPClient {
  public tools: Array<typeof MCPTypes.ToolSchema._type> = [];
  public resources: Array<typeof MCPTypes.ResourceSchema._type> = [];
  public prompts: Array<typeof MCPTypes.PromptSchema._type> = [];
  public client: MCP.Client = undefined;
  public status: string = "disconnected";

  constructor(
    public name: string,
    public type: "stdio" | "sse" = "stdio",
    public scope: "local" | "outer" = "outer"
  ) {}
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
  async open() {
    if (this.type == "sse") {
      await this.openSse();
    } else {
      await this.openStdio();
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
      log.error("client error", e);
      // setTimeout(() => {
      //   this.open();
      // }, 3000);
    };

    this.tools = tools_res.tools;
    this.resources = resources_res.resources;
    this.prompts = listPrompts_res.prompts;
    this.status = "connected";
  }
  async openSse() {
    const client = new Client(
      {
        name: this.name,
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
    // console.log(
    //   `http://localhost:${electronData.get().mcp_server_port}/${this.name}/sse`
    // );

    let config = await getConfg();
    let urlStr = config.mcpServers[this.name].url;

    const transport = new SSEClientTransport(new URL(urlStr));
    await client.connect(transport);
    this.client = client;
  }
  async openStdio() {
    let config = await getConfg();
    if (config.mcpServers[this.name].disabled) {
      log.error("MCPClient open disabled", this.name);
      return;
    } else {
      let key = this.name;
      const transport = new StdioClientTransport({
        command: config.mcpServers[key].command,
        args: config.mcpServers[key].args,
        env: Object.assign(getDefaultEnvironment(), config.mcpServers[key].env),
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
    }
  }
}

let firstRunStatus = 0;

export async function openMcpClients(clientName: string = undefined) {
  if (clientName != null) {
    await mcpClients[clientName].open();
  }
  firstRunStatus == 1;
  // console.log("mcpClients", mcpClients, Object.keys(mcpClients).length);
  while (1) {
    if (firstRunStatus == 1) {
      log.info("getMcpClients runing");
      await sleep(100);
    } else {
      break;
    }
  }

  if (firstRunStatus == 2 && clientName == null) {
    log.info("getMcpClients cached mcpClients", Object.keys(mcpClients).length);
    return mcpClients;
  }
  let p = path.join(
    os.homedir(),
    "AppData",
    "Roaming",
    "Claude",
    "claude_desktop_config.json"
  );
  let mcp_path = path.join(appDataDir, "mcp.json");
  if (fs.existsSync(p) && !fs.existsSync(mcp_path)) {
    fs.copy(p, mcp_path);
  }

  let config = await getConfg();

  console.log(config);

  for (let key in config.mcpServers) {
    if (clientName != null && key != clientName) {
      continue;
    }
    if (mcpClients[key] == null) {
      mcpClients[key] = new MCPClient(
        key,
        config.mcpServers[key].type || "stdio",
        config.mcpServers[key].scope || "outer"
      );
    }
    if (config.mcpServers[key].disabled) {
      mcpClients[key].status = "disabled";
    } else {
      try {
        await mcpClients[key].open();
      } catch (e) {
        log.error("openMcpClient", e);
        continue;
      }
    }
  }

  // function format(res) {
  //   for (let key in res) {
  //     res[key] = Object.assign({}, res[key]);
  //     delete res[key].client;
  //     delete res[key].call;
  //   }
  //   return res;
  // }

  // getMessageService().sendToRenderer({
  //   type: "getMcpClients",
  //   data: format(mcpClients),
  // });
  firstRunStatus = 2;
  return mcpClients;
}

async function getMcpClients() {
  while (1) {
    if (firstRunStatus == 1 || firstRunStatus == 0) {
      await sleep(100);
    } else {
      break;
    }
  }

  return mcpClients;
}

async function closeMcpClients(clientName: string = undefined) {
  let p = path.join(
    os.homedir(),
    "AppData",
    "Roaming",
    "Claude",
    "claude_desktop_config.json"
  );
  for (let key in mcpClients) {
    if (clientName == null || key == clientName) {
      let client = mcpClients[key].client;
      if (client) {
        await client.close();
      }

      mcpClients[key].client = undefined;
      mcpClients[key].tools = [];
      mcpClients[key].prompts = [];
      mcpClients[key].resources = [];
    }
  }
  return mcpClients;
}
export { getMcpClients, closeMcpClients, mcpClients };

export async function getConfg() {
  let mcp_path = path.join(appDataDir, "mcp.json");
  let config = await fs.readJson(mcp_path, "utf-8").catch((e) => {
    return {
      mcpServers: {},
    };
  });
  let obj: any = {};
  for (let s of MyServers) {
    let key = s.name;
    obj[key] = {
      url: `http://localhost:${electronData.get().mcp_server_port}/${key}/sse`,
      type: "sse",
      scope: "local",
    };
  }
  config.mcpServers = Object.assign(obj, config.mcpServers);
  return config;
}
