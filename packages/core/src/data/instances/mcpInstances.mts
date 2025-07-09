import { Data } from "../base/data.mjs";
import type { MCPServerConfig } from "../../shared/types.mjs";

export const MCP_CONFIG = new Data(
  "mcp.json",
  {
    mcpServers: {} as { [s: string]: MCPServerConfig },
  },
  {
    sync: false,
  }
);

export const MCP_GateWay = new Data(
  "mcp_gateway.json",
  {
    data: [] as Array<{
      name: string;
      description?: string;
      allowMCPs: string[];
    }>,
  },
  {
    sync: true,
  }
);