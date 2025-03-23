import dayjs from "dayjs";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerNoElectronTool(server: McpServer) {
  server.tool(
    "current_time",
    `Get the current local time as a string.`,
    {},
    async ({}) => {
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
}
