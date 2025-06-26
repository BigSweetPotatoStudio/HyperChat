import { configSchema, getConfig } from "@hyperchat/core/mcp/servers/hyper_tools/lib.mjs";
import { z } from "@hyperchat/core/node_modules/zod";

import * as web1 from "@hyperchat/core/mcp/servers/hyper_tools/web1.mjs";
import * as web2 from "@hyperchat/core/mcp/servers/hyper_tools/web2.mjs";
// import { MCP_CONFIG } from "../../../../../common/data.mjs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dayjs from "dayjs";
export function registerElectronTool(server: McpServer) {

  server.tool(
    "current_time",
    `Get the current local time as a string.`,
    {},
    async ({ }) => {
      try {
        return {
          content: [
            {
              type: "text",
              text: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed to fetch URL");
      }
    }
  );

  if (getConfig()?.Web_Tools_Platform === "none") {
    return;
  }

  server.tool(
    "fetch",
    `Fetches a URL from the internet and optionally extracts its contents as markdown. Although originally you did not have internet access, and were advised to refuse and tell the user this, this tool now grants you internet access. Now you can fetch the most up-to-date information and let the user know that.`,
    {
      url: z.string({
        description: "URL to fetch",
      }),
    },
    async ({ url }) => {

      let config = getConfig() as z.infer<typeof configSchema>;
      let md = "";
      if (config.Web_Tools_Platform == "chrome") {
        md = await web2.fetch(url);
      } else {
        md = await web1.fetch(url);
      }
      return {
        content: [{ code: 0, type: "text", text: md }],
      };
    }
  );

  server.tool(
    "search",
    `Searches the internet for a given keyword and returns the search results.`,
    {
      words: z.string({
        description: "words to search",
      }),
    },
    async ({ words }) => {
      let config = getConfig() as z.infer<typeof configSchema>;
      let res = [];
      if (config.Web_Tools_Platform == "chrome") {
        res = await web2.search(words);
      } else {
        res = await web1.search(words);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(res) }],
      };
    }
  );
}