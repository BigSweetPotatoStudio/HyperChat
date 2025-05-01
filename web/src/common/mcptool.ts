
import { IMCPClient } from "../../../common/data";
import type { InitedClient } from "./mcp";

export function getToolsOnNode(
  mcpClients,
  allowMCPs: string[] | undefined | false = undefined,
) {
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

export function mcpClientsToArray(mcpClients: Array<IMCPClient>): InitedClient[] {
  let array: InitedClient[] = [];

  // for (let mcpClient of mcpClients) {

  //   let client = mcpClient;
  //   let key = client.name;
  //   array.push({
  //     ...client,
  //     prompts: client.prompts.map((x) => {
  //       return {
  //         ...x,
  //         key: key + " > " + x.name,
  //         clientName: key,
  //       };
  //     }),
  //     resources: client.resources.map((x) => {
  //       return {
  //         ...x,
  //         key: key + " > " + x.name,
  //         clientName: key,
  //       };
  //     }),
  //     tools: client.tools
  //       .map((tool) => {
  //         // let name = "m" + i + "_" + tool.name;
  //         return {
  //           type: "function" as const,
  //           function: {
  //             name: tool.name,
  //             description: tool.description,
  //             parameters: {
  //               type: tool.inputSchema.type,
  //               properties: formatProperties(tool.inputSchema.properties, tool.name),
  //               required: tool.inputSchema.required,
  //             },
  //           },
  //           origin_name: tool.name,
  //           restore_name: key + " > " + tool.name,
  //           key: key,
  //           clientName: key,
  //           client: key,
  //         };
  //       })
  //       .filter((x) => x != null),
  //     name: key,
  //     status: client.status,
  //     order: client.config.hyperchat?.scope == "built-in" ? client.order : 10000,
  //     // get config() {
  //     //   let config = MCP_CONFIG.get().mcpServers[key];
  //     //   if (config == null) {
  //     //     return { hyperchat: {} } as any;
  //     //   }
  //     //   if (config.hyperchat == null) {
  //     //     config.hyperchat = {} as any;
  //     //   }
  //     //   return config;
  //     // },
  //     // set config(value: any) {
  //     //   MCP_CONFIG.get().mcpServers[key] = value;
  //     // },
  //     source: client.source,
  //     ext: client.ext,
  //   });
  // }
  // array.sort((a, b) => {
  //   return a.order - b.order;
  // });
  // array.forEach((client, i) => {
  //   client.tools.forEach((tool) => {
  //     tool.function.name = "m" + (i + 1) + "_" + tool.function.name;
  //   });
  // });
  return array;
}

// export function formatProperties(obj: any, toolName: string = "") {
//   if (obj == null) {
//     return {
//       compatible: {
//         type: "string",
//         description: "ignore, no enter", // compatible gemini-openai
//       },
//     };
//   }
//   // if (toolName == "NOTION_INSERT_ROW_DATABASE") {
//   //   debugger;
//   // }
//   try {
//     for (let key in obj) {
//       if (obj[key].type == "object") {
//         obj[key].properties = formatProperties(obj[key].properties, toolName);
//         delete obj[key].additionalProperties; // Corrected to delete obj[key].additionalProperties
//         delete obj[key].items;
//       } else if (obj[key].type == "array") {
//         obj[key].items = formatProperties(obj[key].items, toolName);
//         delete obj[key].items.additionalProperties; // Corrected to delete obj[key].additionalProperties
//         delete obj[key].properties;
//       }
//     }

//   } catch (e) {
//     console.error(e);
//   }
//   // console.log(obj);
//   return obj;
// }
