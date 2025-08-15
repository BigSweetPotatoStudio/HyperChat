export * from "./express.mjs";
import { HyperTools } from "./hyper_tools/index.mjs";
// import { HyperKnowledgeBase } from "./KnowledgeBase/index.mjs";
// import { HyperSettings } from "./settings/index.mjs";
// import { HyperAgent } from "./Task/index.mjs";
import { HyperTerminal } from "./terminal/index.mjs";
import { HyperSystem } from "./hyper_system/index.mjs";
import type { ZodSchema } from "zod";

export interface ServerConfig {
  name: string;
  type: string;
  configSchema: ZodSchema;
  createServer: () => Promise<unknown>;
}


// 工作区的内置mcp服务器
export const WorkSpaceServers: ServerConfig[] = [
  HyperSystem, HyperTools
];