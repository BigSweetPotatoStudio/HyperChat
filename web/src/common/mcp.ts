import { call } from "./call";
import OpenAI from "openai";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { sleep } from "./sleep";


import { TEMP_FILE, MCP_CONFIG, MCP_CONFIG_TYPE } from "../../../common/data";
import type { HyperChatCompletionTool, IMCPClient } from "../../../common/data";


let init = false;
let McpClients: Array<IMCPClient>;



// export type HyperChatCompletionTool = OpenAI.ChatCompletionTool & {
//   // key?: string;
//   origin_name?: string;
//   restore_name?: string;
//   clientName?: string;
//   client?: string;
// };

// export type InitedClient = {
//   tools: Array<HyperChatCompletionTool>;
//   prompts: Array<typeof MCPTypes.PromptSchema._type & { key: string }>;
//   resources: Array<typeof MCPTypes.ResourceSchema._type & { key: string }>;
//   name: string;
//   status: "disconnected" | "connected" | "connecting" | "disabled";
//   order: number;
//   config: MCP_CONFIG_TYPE;
//   ext: any;
//   source: "hyperchat" | "claude"
// };

export {
  HyperChatCompletionTool,
  IMCPClient as InitedClient
}


export async function initMcpClients() {
  let res: any = await call("initMcpClients", []);
  McpClients = res;
  console.log("initMcpClients", McpClients);

}

// setInterval(async () => {
//   let res = await call("getMcpClientsLoad", []);
//   console.log("getMcpClientsLoad", res);
// }, 100);

// initMcpClients()
//   .then(() => {
//     init = true;
//   })
//   .catch((e) => {
//     init = true;
//   });

// export function getMcpInited() {
//   return init;
// }

export function getTools(allowMCPs: string[] | undefined | false = undefined) {
  let tools: IMCPClient["tools"] = [];

  McpClients.forEach((v) => {
    tools = tools.concat(
      v.tools.filter((t) => {
        if (!allowMCPs) return true;
        return (
          allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
        );
      }),
    );
  });
  return tools;
}
export function getPrompts(mcp: string[]) {
  let set = new Set();
  for (let tool_name of mcp) {
    let [name, _] = tool_name.split(" > ");
    set.add(name);
  }

  let prompts: IMCPClient["prompts"] = [];

  McpClients
    .filter((m) => set.has(m.name))
    .forEach((v) => {
      prompts = prompts.concat(v.prompts);
    });
  return prompts;
}

export function getResourses(mcp: string[]) {
  let set = new Set();
  for (let tool_name of mcp) {
    let [name, _] = tool_name.split(" > ");
    set.add(name);
  }

  let resources: IMCPClient["resources"] = [];

  McpClients
    .filter((m) => set.has(m.name))
    .forEach((v) => {
      resources = resources.concat(v.resources);
    });
  return resources;
}

export async function getClients() {
  return await call("getMcpClients", []);
}
export async function setClients(res) {
  McpClients = res;
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

