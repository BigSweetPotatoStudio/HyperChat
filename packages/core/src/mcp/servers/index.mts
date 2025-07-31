export * from "./express.mjs";
import { HyperTools } from "./hyper_tools/index.mjs";
// import { HyperKnowledgeBase } from "./KnowledgeBase/index.mjs";
// import { HyperSettings } from "./settings/index.mjs";
// import { HyperAgent } from "./Task/index.mjs";
import { HyperTerminal } from "./terminal/index.mjs";
import { HyperSystem } from "./hyper_system/index.mjs";
type ServerConfig = {
  name: string;
  type: string;
  configSchema: any;
  createServer: () => Promise<any>;
};


// 工作区的内置mcp服务器
export const WorkSpaceServers: ServerConfig[] = [
  HyperSystem, HyperTools
];