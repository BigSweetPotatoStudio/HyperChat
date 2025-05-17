

import { store } from "../../../rag/vectorStore.mjs";
import dayjs from "dayjs";
import { IMCPClient, KNOWLEDGE_BASE } from "../../../../../common/data";
import {
    Server,
    SSEServerTransport,
    zx,
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "ts/es6.mjs";
import { CONST } from "ts/polyfills/polyfills.mjs";
import { mcpClients } from "ts/mcp/config.mjs";
import { Command } from "ts/command.mjs";
const { fs, path, sleep } = zx;







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
        let getTools = (allowMCPs) => {
            let tools: IMCPClient["tools"] = [];

            mcpClients.forEach((v) => {
                tools = tools.concat(
                    v.tools.filter((t) => {
                        if (!allowMCPs) return true;
                        return (
                            allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
                        );
                    }),
                );
            });
            return tools;
        }
        return {
            tools: [
                ...getTools(allowMCPs).map((tool) => {
                    return {
                        name: tool.function.name,
                        description: tool.function.description,
                        inputSchema: tool.function.parameters,
                    };
                }),
            ].filter(x => x),
        };
    });

    /**
     * Handler for the create_note tool.
     * Creates a new note with the provided title and content, and returns success message.
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        try {
            let getTools = (allowMCPs) => {
                let tools: IMCPClient["tools"] = [];

                mcpClients.forEach((v) => {
                    tools = tools.concat(
                        v.tools.filter((t) => {
                            if (!allowMCPs) return true;
                            return (
                                allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
                            );
                        }),
                    );
                });
                return tools;
            }

            let find = getTools(allowMCPs).find((tool) => {
                return tool.function.name === request.params.name;
            });
            console.log("find", find, request.params.arguments);
            return await Command.mcpCallTool(find.clientName, find.origin_name, request.params.arguments);
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `error: ${error.message}`,
                    },
                ],
            };
        }
    });


    return server;
}




export { createServer };
