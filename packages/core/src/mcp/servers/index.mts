export * from "./express.mjs";
import { HyperTools } from "./hyper_tools/index.mjs";
import { HyperKnowledgeBase } from "./KnowledgeBase/index.mjs";
import { HyperSettings } from "./settings/index.mjs";
import { HyperAgent } from "./Task/index.mjs";
import { HyperTerminal } from "./terminal/index.mjs";
type ServerConfig = {
  name: string;
  type: string;
  configSchema?: any;
};

export const MyServers: ServerConfig[] = [];

MyServers.push(HyperTools, HyperKnowledgeBase, HyperAgent, HyperTerminal, HyperSettings);
