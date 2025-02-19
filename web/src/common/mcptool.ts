import type { MCPClient } from "../../../electron/ts/mcp/config.mjs";
import type { InitedClient } from "./mcp";

export function getToolsOnNode(mcpClients, filter = (x: InitedClient) => true) {
  let tools: InitedClient["tools"] = [];
  let initedClientArray = mcpClientsToArray(mcpClients);
  initedClientArray.filter(filter).forEach((v) => {
    tools = tools.concat(v.tools);
  });
  return tools;
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
      tools: client.tools.map((tool) => {
        // let name = clientName2Index.getIndex(key) + "--" + tool.name;
        return {
          type: "function" as const,
          function: {
            name: tool.name,
            description: tool.description,
            parameters: {
              type: tool.inputSchema.type,
              properties: removeAdditionalProperties(
                tool.inputSchema.properties,
              ),
              required: tool.inputSchema.required,
              // additionalProperties: false,
            },
          },
          origin_name: tool.name,
          restore_name: key + " > " + tool.name,
          key: key,
          clientName: key,
        };
      }),
      name: key,
      status: client.status,
      order: client.config.hyperchat?.scope == "built-in" ? 0 : 1,
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
function removeAdditionalProperties(obj: any) {
  if (obj == null) {
    return obj;
  }
  try {
    for (let key in obj) {
      if (obj[key].type == "object") {
        removeAdditionalProperties(obj[key].properties);
      } else if (obj[key].type == "array") {
        removeAdditionalProperties(obj[key].items);
      }
    }
    delete obj.additionalProperties;
  } catch (e) {
    console.error(e);
  }
  // console.log(obj);
  return obj;
}
