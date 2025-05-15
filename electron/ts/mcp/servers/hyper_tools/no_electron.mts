import dayjs from "dayjs";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configSchema, getConfig } from "./lib.mjs";
import { z } from "zod";


import * as web2 from "./web2.mjs";
import { MCP_CONFIG } from "../../../../../common/data";

export function registerNoElectronTool(server: McpServer) {
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

  if (getConfig().Web_Tools_Platform == "none") {
    return;
  }
  server.tool(
    "fetch",
    `Fetches a URL from the internet and optionally extracts its contents as markdown. Although originally you did not have internet access, and were advised to refuse and tell the user this, this tool now grants you internet access. Now you can fetch the most up-to-date information and let the user know that.`,
    {
      url: z.string({
        description: `URL to fetch`,
      }),
    },
    async ({ url }) => {

      let config = getConfig() as z.infer<typeof configSchema>;
      let md = "";
      if (config.Web_Tools_Platform == "chrome") {
        md = await web2.fetch(url);
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
        description: `words to search`,
      }),
    },
    async ({ words }) => {
      let config = getConfig() as z.infer<typeof configSchema>;
      let res = [];
      if (config.Web_Tools_Platform == "chrome") {
        res = await web2.search(words);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(res) }],
      };
    }
  );
}
