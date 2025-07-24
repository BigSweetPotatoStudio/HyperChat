

// Gateway server is deprecated in Agent-centered architecture
// TODO: Remove or refactor for Agent-centered MCP tool access

// // import { store } from "../../../rag/vectorStore.mjs";
// // import dayjs from "dayjs";
// import { IMCPClient } from "@dadigua/hyperchat-shared/types";
// import {
//     Server,
//     SSEServerTransport as _SSEServerTransport,
//     zx,
//     ListToolsRequestSchema,
//     CallToolRequestSchema,
// } from "../../../es6.mjs";
// import { CONST } from "../../../const.mjs";

// import { Command } from "../../../command.mjs";
// import { Logger } from "../../../log.mjs";

// import { workspaceManager } from "../../../workspace/index.mjs";

// const { fs: _fs, path: _path, sleep: _sleep } = zx;







// Gateway server function - deprecated in Agent-centered architecture
// Each agent now manages its own MCP clients directly

// async function createServer(name: string, description: string, allowMCPs: string[]) {
//     // Implementation commented out - to be removed or refactored for Agent-centered architecture
//     throw new Error("Gateway server is deprecated in Agent-centered architecture");
// }

// Placeholder export to maintain compatibility
export function createServer(name: string, description: string, allowMCPs: string[]): never {
    throw new Error("Gateway server is deprecated in Agent-centered architecture. Each agent now manages its own MCP clients directly.");
}
