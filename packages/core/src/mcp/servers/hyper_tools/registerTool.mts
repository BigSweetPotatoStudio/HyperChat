import dayjs from "dayjs";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configSchema, getConfig, createToolSchema } from "./lib.mjs";
import { z } from "zod";


import * as browser from "./browser.mjs";
// import { MCP_CONFIG } from "../../../../../common/data.mjs";

export function registerTool(server: McpServer) {
  // server.tool(
  //   "current_time",
  //   `Get the current local time as a string.`,
  //   {},
  //   async ({ }) => {
  //     try {
  //       return {
  //         content: [
  //           {
  //             type: "text",
  //             text: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
  //           },
  //         ],
  //       };
  //     } catch (e) {
  //       throw new Error("Failed to fetch URL");
  //     }
  //   }
  // );


  const fetchSchema = createToolSchema({
    url: z.string({
      description: `URL to fetch`,
    }),
  });

  server.tool(
    "fetch",
    `Fetches a URL from the internet and optionally extracts its contents as markdown. Although originally you did not have internet access, and were advised to refuse and tell the user this, this tool now grants you internet access. Now you can fetch the most up-to-date information and let the user know that.`,
    fetchSchema.shape,
    async ({ reason, url }) => {
      let md = await browser.fetch(url);

      return {
        content: [{ code: 0, type: "text", text: md }],
        summary: `Fetched URL content (Reason: ${reason})`
      };
    }
  );

  const searchSchema = createToolSchema({
    words: z.string({
      description: `words to search`,
    }),
  });

  server.tool(
    "search",
    `Searches the internet for a given keyword and returns the search results.`,
    searchSchema.shape,
    async ({ reason, words }) => {
      let res = await browser.search(words);

      return {
        content: [{ type: "text", text: JSON.stringify(res) }],
        summary: `Searched for "${words}" (Reason: ${reason})`
      };
    }
  );
}
