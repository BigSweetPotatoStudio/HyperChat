

// import { store } from "../../../rag/vectorStore.mjs";
// import dayjs from "dayjs";
import { IMCPClient } from "@dadigua/hyperchat-shared/types";
import {
    Server,
    SSEServerTransport as _SSEServerTransport,
    zx,
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "../../../es6.mjs";
import { CONST } from "../../../const.mjs";

import { Command } from "../../../command.mjs";
import { Logger } from "../../../log.mjs";

import { workspaceManager } from "../../../workspace/index.mjs";

const { fs: _fs, path: _path, sleep: _sleep } = zx;







async function createServer(name: string, description: string, allowMCPs: string[]) {
    const NAME = name;

    /**
     * Create an MCP server with capabilities for resources (to list/read notes),
     * tools (to create new notes), and prompts (to summarize notes).
     */
    const server = new Server(
        {
            name: NAME,
            version: CONST.getVersion,
            description: description,
        },
        {
            capabilities: {
                resources: {},
                tools: {},
                prompts: {},
            },
        }
    );

    /**
     * Handler that lists available tools.
     * Exposes a single "create_note" tool that lets clients create new notes.
     */
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        // Logger.debug("gateway allowMCPs", allowMCPs);
        let getTools =  (allowMCPs: any) => {
            let tools: IMCPClient["tools"] = [];
            workspaceManager.getCurrentWorkspace().getMcpClients().forEach((v) => {
                tools = tools.concat(
                    v.tools.filter((t) => {
                        if (!allowMCPs) return true;
                        return (
                            allowMCPs.includes(t.clientName) || allowMCPs.includes(t.displayName)
                        );
                    }),
                );
            });
            Logger.debug("gateway tools", allowMCPs, tools.length);
            return tools;
        }
        return {
            tools: [
                ...(getTools(allowMCPs)),
            ].filter(x => x),
        };
    });

    /**
     * Handler for the create_note tool.
     * Creates a new note with the provided title and content, and returns success message.
     */
    server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
        try {
        let getTools = (allowMCPs: any) => {
            let tools: IMCPClient["tools"] = [];

            workspaceManager.getCurrentWorkspace().getMcpClients().forEach((v) => {
                tools = tools.concat(
                    v.tools.filter((t) => {
                        if (!allowMCPs) return true;
                        return (
                            allowMCPs.includes(t.clientName) || allowMCPs.includes(t.displayName)
                        );
                    }),
                );
            });
            Logger.debug("gateway tools", allowMCPs, tools.length);
            return tools;
        }

            let find = (getTools(allowMCPs)).find((tool) => {
                return tool.name === request.params.name;
            });

            if (!find) {
                throw new Error(`Tool not found: ${request.params.name}`);
            }

            return await Command.mcpCallTool({
                name: find.clientName || '',
                functionName: find.originalName || '',
                args: request.params.arguments || {}
            });
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    });


    return server;
}




export { createServer };
