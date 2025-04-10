import { configSchema, getConfig } from "./lib.mjs";
import { z } from "zod";

import * as web1 from "./web1.mjs";
import * as web2 from "./web2.mjs";
import { MCP_CONFIG } from "../../../../../common/data";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerElectronTool(server: McpServer) {
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
        description: `words to serach`,
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
