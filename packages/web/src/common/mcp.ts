import { call } from "./call";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";

// import { TEMP_FILE } from "@dadigua/hyperchat-shared.mjs"; // 已移除
import type { HyperChatCompletionTool, IMCPClient } from "@dadigua/hyperchat-shared";

/**
 * Stores the initialized MCP clients.
 * @type {IMCPClient[]}
 */
let McpClients: IMCPClient[];

export {
  HyperChatCompletionTool,
  IMCPClient as InitedClient
}




/**
 * Retrieves a filtered list of prompts from the initialized MCP clients.
 * @param {string[]} mcp - An array of tool names (e.g., "clientName > toolName") to filter prompts by their client names.
 * @returns {(typeof MCPTypes.PromptSchema._type & { key: string })[]} An array of filtered prompts.
 */
export function getPrompts(mcp: string[]): (typeof MCPTypes.PromptSchema._type & { key: string })[] {
  let set = new Set<string>();
  for (let tool_name of mcp) {
    let [name, _] = tool_name.split(" > ");
    if (name) set.add(name);
  }

  let prompts: (typeof MCPTypes.PromptSchema._type & { key: string })[] = [];

  // McpClients
  //   .filter((m) => set.has(m.serverName))
  //   .forEach((v) => {
  //     prompts = prompts.concat(v.prompts);
  //   });
  return prompts;
}

/**
 * Retrieves a filtered list of resources from the initialized MCP clients.
 * @param {string[]} mcp - An array of tool names (e.g., "clientName > toolName") to filter resources by their client names.
 * @returns {(typeof MCPTypes.ResourceSchema._type & { key: string })[]} An array of filtered resources.
 */
export function getResourses(mcp: string[]): (typeof MCPTypes.ResourceSchema._type & { key: string })[] {
  let set = new Set<string>();
  for (let tool_name of mcp) {
    let [name, _] = tool_name.split(" > ");
    if (name) set.add(name);
  }

  let resources: (typeof MCPTypes.ResourceSchema._type & { key: string })[] = [];

  // McpClients
  //   .filter((m) => set.has(m.serverName))
  //   .forEach((v) => {
  //     resources = resources.concat(v.resources);
  //   });
  return resources;
}

/**
 * Fetches the current list of all active MCP clients from the backend.
 * This includes clients from all workspaces (global and project workspaces).
 * @returns {Promise<IMCPClient[]>} A promise that resolves with an array of all MCP clients.
 */
export async function getClients(): Promise<IMCPClient[]> {
  return [];
}

/**
 * Sets the global list of MCP clients.
 * @param {IMCPClient[]} res - The array of MCP clients to set.
 */
export async function setClients(res: IMCPClient[]) {
  McpClients = res;
}

/**
 * Fetches and executes external MCP extension data (JavaScript code).
 * This function attempts to fetch the latest extension data from a remote URL.
 * If fetching fails (e.g., due to network issues), it falls back to a cached version.
 * The fetched code is executed using `eval`, which requires careful security consideration.
 * The data is expected to be in a JSONP format, calling a global `jsonp` function.
 * @returns {Promise<any>} A promise that resolves with the data returned by the executed extension code.
 * @throws {Error} If the network is not connected and no cache is available, or if the JSONP callback is not received within a timeout.
 */
export async function getMCPExtensionData(): Promise<any> {
  let jscode: string | undefined;
  try {
    // Determine the URL for the extension data based on the environment.
    let jsUrl =
      process.env.myEnv === "dev"
        ? "https://dev.hyperchatmcp.pages.dev/main.js"
        : "https://hyperchatmcp.pages.dev/main.js";

    // Fetch the JavaScript code.
    jscode = await fetch(jsUrl).then((res) => res.text());

    // Initialize TEMP_FILE for caching.
    // await TEMP_FILE.init(); // 已移除

    // Execute the fetched code using a Promise and a global JSONP callback.
    let res = await new Promise(async (resolve, reject) => {
      // Define a global JSONP callback function.
      (window as any)["jsonp"] = function (data: any) {
        resolve(data);
      };
      // Execute the fetched JavaScript code.
      if (jscode) eval(jscode);

      // Set a timeout for the JSONP callback to prevent indefinite waiting.
      setTimeout(() => {
        reject(new Error("The network is not connected or JSONP callback timed out."));
      }, 5000);
    });
    return res;
  } catch (e: any) {
    // If fetching fails, try to use the cached version.
    // if (TEMP_FILE.get().mcpExtensionDataJS !== "") {
    //   jscode = TEMP_FILE.get().mcpExtensionDataJS;
    //   return new Promise(async (resolve, reject) => {
    //     window["jsonp"] = function (data: any) {
    //       resolve(data);
    //     };
    //     if (jscode) eval(jscode);
    //   });
    // } else {
      // If no network and no cache, throw an error.
      throw new Error("The network is not connected and there is no cache.");
    // }
  } finally {
    // Cache the fetched JavaScript code if it was successfully obtained.
    if (jscode) {
      // TEMP_FILE.get().mcpExtensionDataJS = jscode;
      // TEMP_FILE.save();
    }
  }
}

