import { call } from "./call";
import OpenAI from "openai";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { sleep } from "./sleep";
import type { MCPClient } from "../../../electron/ts/mcp/config.mjs";
import { get } from "http";

import { TEMP_FILE, MCP_CONFIG, MCP_CONFIG_TYPE } from "../../../common/data";

let init = false;
let McpClients: {
  [s: string]: MCPClient;
};

export function getMcpClients() {
  return McpClients || {};
}

export type HyperChatCompletionTool = OpenAI.ChatCompletionTool & {
  key?: string;
  origin_name?: string;
  restore_name?: string;
  clientName?: string;
  client?: string;
};

export type InitedClient = {
  tools: Array<HyperChatCompletionTool>;
  prompts: Array<typeof MCPTypes.PromptSchema._type & { key: string }>;
  resources: Array<typeof MCPTypes.ResourceSchema._type & { key: string }>;
  name: string;
  status: string;
  order: number;
  // enable: boolean;
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

export function getTools(filter = (x: InitedClient) => true) {
  let tools: InitedClient["tools"] = [];

  initedClientArray.filter(filter).forEach((v) => {
    tools = tools.concat(v.tools);
  });
  return tools;
}
export function getPrompts(filter = (x: InitedClient) => true) {
  let prompts: InitedClient["prompts"] = [];

  initedClientArray.filter(filter).forEach((v) => {
    prompts = prompts.concat(v.prompts);
  });
  return prompts;
}

export function getResourses(filter = (x: InitedClient) => true) {
  let resources: InitedClient["resources"] = [];

  initedClientArray.filter(filter).forEach((v) => {
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
  let array: InitedClient[] = [];

  for (let key in mcpClients) {
    let client = mcpClients[key];

    array.push({
      ...client,
      prompts: client.prompts.map((x) => {
        return {
          ...x,
          key: key + " > " + x.name,
          clientName: key,
        };
      }),
      resources: client.resources.map((x) => {
        return {
          ...x,
          key: key + " > " + x.name,
          clientName: key,
        };
      }),
      tools: client.tools
        .map((tool) => {
          // let name = clientName2Index.getIndex(key) + "--" + tool.name;
          // if (tool.name.includes("worker_put")) {
          //   return;
          // }
          return {
            type: "function" as const,
            function: {
              name: tool.name,
              description: tool.description,
              parameters: {
                type: tool.inputSchema.type,
                properties: formatProperties(tool.inputSchema.properties),
                required: tool.inputSchema.required,
                // additionalProperties: false,
              },
            },
            origin_name: tool.name,
            restore_name: key + " > " + tool.name,
            key: key,
            clientName: key,
          };
        })
        .filter((x) => x != null),
      name: key,
      status: client.status,
      order: client.config.hyperchat?.scope == "built-in" ? 0 : 1,
      get config() {
        let config = MCP_CONFIG.get().mcpServers[key];
        if (config == null) {
          return { hyperchat: {} } as any;
        }
        if (config.hyperchat == null) {
          config.hyperchat = {} as any;
        }
        return config;
      },
      set config(value: any) {
        MCP_CONFIG.get().mcpServers[key] = value;
      },
      // enable: !MCP_CONFIG.get().mcpServers[key]?.disabled,
    });
  }
  array.sort((a, b) => {
    return a.order - b.order;
  });
  array.forEach((client, i) => {
    client.tools.forEach((tool) => {
      tool.function.name = "m" + i + "_" + tool.function.name;
    });
  });
  return array;
}

export async function getMCPExtensionData() {
  // Because of GitHub's rate limiting、

  // let latest = await fetch(
  //   "https://api.github.com/repos/BigSweetPotatoStudio/HyperChatMCP/releases/latest",
  // ).then((res) => res.json());
  // let js = await latest.assets[0].browser_download_url;
  let jscode;
  try {
    let js =
      process.env.myEnv == "dev"
        ? "https://dev.hyperchatmcp.pages.dev/main.js"
        : "https://hyperchatmcp.pages.dev/main.js";
    jscode = await fetch(js).then((res) => res.text());
    await TEMP_FILE.init();

    let res = await new Promise(async (resolve, reject) => {
      window["jsonp"] = function (res) {
        resolve(res.data);
      };
      eval(jscode);

      setTimeout(() => {
        reject(new Error("The network is not connected"));
      }, 5000);
    });
    return res;
  } catch (e) {
    if (TEMP_FILE.get().mcpExtensionDataJS != "") {
      jscode = TEMP_FILE.get().mcpExtensionDataJS;
      return new Promise(async (resolve, reject) => {
        window["jsonp"] = function (res) {
          // res.data.unshift({
          //   name: "hyper_tools",
          //   description: "hyper_tools",
          // });
          resolve(res.data);
        };
        eval(jscode);
      });
    } else {
      throw new Error("The network is not connected and there is no cache.");
    }
  } finally {
    TEMP_FILE.get().mcpExtensionDataJS = jscode;
    TEMP_FILE.save();
  }
}

function formatProperties(obj: any) {
  if (obj == null) {
    return {
      compatible: {
        type: "string",
        description: "ignore, no enter", // compatible gemini-openai
      },
    };
  }

  try {
    for (let key in obj) {
      if (obj[key].type == "object") {
        obj[key].properties = formatProperties(obj[key].properties);
        delete obj[key].items;
      } else if (obj[key].type == "array") {
        obj[key].items = formatProperties(obj[key].items);
        delete obj[key].properties;
      }
    }
    delete obj.additionalProperties;
  } catch (e) {
    console.error(e);
  }
  // console.log(obj);
  return obj;
}
