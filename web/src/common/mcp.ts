import { call } from "./call";
import OpenAI from "openai";
import type { ChatCompletionTool } from "openai/src/resources/chat/completions";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { sleep } from "./sleep";
import { MCP_CONFIG } from "./data";

let init = false;
let McpClients;

export type InitedClient = {
  tools: Array<ChatCompletionTool & { key: string }>;
  prompts: Array<typeof MCPTypes.PromptSchema._type & { key: string }>;
  resources: Array<typeof MCPTypes.ResourceSchema._type & { key: string }>;
  name: string;
  status: string;
  enable: boolean;
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
  let res = mcpClientsToArray(McpClients);
  initedClientArray = res.filter((x) => x.status == "connected");
  if (filter) {
    return initedClientArray;
  } else {
    return res;
  }
}

function mcpClientsToArray(mcpClients): InitedClient[] {
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
        if (McpClients[key].type == "sse") {
          return {} as any;
        }
        return MCP_CONFIG.get().mcpServers[key] || {};
      },
      set config(value) {
        if (McpClients[key].type == "sse") {
          return;
        }
        MCP_CONFIG.get().mcpServers[key] = value;
      },
      enable: McpClients[key].enable,
    });
  }
  return array;
}
