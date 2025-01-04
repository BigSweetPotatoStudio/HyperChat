import { call } from "./call";
import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/src/resources/chat/completions";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { sleep } from "./sleep";
import { MCP_CONFIG, MCP_CONFIG_TYPE } from "./data";
import type { MCPClient } from "../../../electron/ts/mcp/config.mjs";
import { get } from "http";

let init = false;
let McpClients: {
  [s: string]: MCPClient;
};

export function getMcpClients() {
  return McpClients || {};
}

export type InitedClient = {
  tools: Array<ChatCompletionTool & { key: string }>;
  prompts: Array<typeof MCPTypes.PromptSchema._type & { key: string }>;
  resources: Array<typeof MCPTypes.ResourceSchema._type & { key: string }>;
  name: string;
  status: string;
  enable: boolean;
  config: MCP_CONFIG_TYPE;
};

let initedClientArray: Array<InitedClient> = [];
export async function initMcpClients() {
  McpClients = await call("initMcpClients", []);
  console.log("initMcpClients", McpClients);
  initedClientArray = mcpClientsToArray(McpClients);
  return initedClientArray;
}

initMcpClients()
  .then(() => {
    init = true;
  })
  .catch((e) => {
    init = true;
  });

export async function getTools() {
  while (1) {
    if (init) {
      break;
    }
    await sleep(500);
  }

  let tools: InitedClient["tools"] = [];

  initedClientArray
    .filter((v) => v.enable == null || v.enable == true)
    .forEach((v) => {
      tools = tools.concat(v.tools);
    });
  return tools;
}
export async function getPrompts() {
  while (1) {
    if (init) {
      break;
    }
    await sleep(500);
  }

  let prompts: InitedClient["prompts"] = [];

  initedClientArray
    .filter((v) => v.enable == null || v.enable == true)
    .forEach((v) => {
      prompts = prompts.concat(v.prompts);
    });
  return prompts;
}

export async function getResourses() {
  while (1) {
    if (init) {
      break;
    }
    await sleep(500);
  }

  let resources: InitedClient["resources"] = [];

  initedClientArray
    .filter((v) => v.enable == null || v.enable == true)
    .forEach((v) => {
      resources = resources.concat(v.resources);
    });
  return resources;
}

export async function getClients(filter = true): Promise<InitedClient[]> {
  while (1) {
    if (init) {
      break;
    }
    await sleep(500);
  }
  McpClients = await call("getMcpClients", []);
  // console.log("getMcpClients", McpClients);
  let res = mcpClientsToArray(McpClients);
  initedClientArray = res.filter((x) => x.status == "connected");
  if (filter) {
    return initedClientArray;
  } else {
    return res;
  }
}

function mcpClientsToArray(mcpClients: {
  [s: string]: MCPClient;
}): InitedClient[] {
  let array = [];
  for (let key in mcpClients) {
    let client = mcpClients[key];
    let tools: Array<ChatCompletionTool & { key: string }> = [];
    for (let tool of client.tools) {
      let newTool = {
        type: "function" as const,
        function: {
          name: key + "--" + tool.name,
          client: key,
          description: tool.description,
          parameters: {
            type: tool.inputSchema.type,
            properties: tool.inputSchema.properties,
            required: tool.inputSchema.required,
            additionalProperties: false,
          },
          //   returns: { type: "string", description: "The weather in the location" },
        },
        key: key,
        clientName: key,
      };

      tools.push(newTool);
    }

    array.push({
      ...client,
      prompts: client.prompts.map((x) => {
        return {
          ...x,
          key: key + "--" + x.name,
          clientName: key,
        };
      }),
      resources: client.resources.map((x) => {
        return {
          ...x,
          key: key + "--" + x.name,
          clientName: key,
        };
      }),
      tools: tools,
      name: key,
      status: client.status,
      get config() {
        let config = MCP_CONFIG.get().mcpServers[key];
        if (config.hyperchat == null) {
          config.hyperchat = {} as any;
        }
        return config;
      },
      set config(value: any) {
        MCP_CONFIG.get().mcpServers[key] = value;
      },
      enable: !McpClients[key].config.disabled,
    });
  }
  return array;
}

export async function getMCPExtensionData() {
  let latest = await fetch(
    "https://api.github.com/repos/BigSweetPotatoStudio/HyperChatMCP/releases/latest",
  ).then((res) => res.json());
  let js = await latest.assets[0].browser_download_url;
  let script = document.createElement("script");
  script.src = js;
  return new Promise(async (resolve, reject) => {
    window["jsonp"] = function (res) {
      res.data.unshift({
        name: "hyper_tools",
        description: "hyper_tools",
      });
      resolve(res.data);
    };
    document.body.appendChild(script);
  });
}
