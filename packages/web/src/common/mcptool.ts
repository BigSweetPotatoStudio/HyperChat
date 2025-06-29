
import { IMCPClient } from "@hyperchat/shared/data.mjs";
import type { InitedClient } from "./mcp";

/**
 * Retrieves a filtered list of tools from MCP clients, specifically for Node.js environment.
 * This function is similar to `getTools` in `mcp.ts` but is intended for use where `IMCPClient`
 * might be directly available from a Node.js context.
 * @param {IMCPClient[]} mcpClients - An array of MCP client objects.
 * @param {string[] | undefined | false} [allowMCPs=undefined] - An optional array of MCP client names to filter by.
 *   If `undefined` or `false`, all tools are returned. Otherwise, only tools from the specified MCP clients are included.
 * @returns {InitedClient["tools"]} An array of filtered tools.
 */
export function getToolsOnNode(
  mcpClients: IMCPClient[],
  allowMCPs: string[] | undefined | false = undefined,
): InitedClient["tools"] {
  let tools: InitedClient["tools"] = [];
  mcpClients.forEach((v) => {
    tools = tools.concat(
      v.tools.filter((t) => {
        if (!allowMCPs) return true;
        return allowMCPs.includes(t.clientName) || allowMCPs.includes(t.origin_name);
      }),
    );
  });
  return tools;
}

