
import dayjs from "dayjs";
import { CallToolRequestSchema, ListToolsRequestSchema, Server } from "../../../es6.mjs";
import { CONST } from "../../../const.mjs";
import { IMCPClient } from "@dadigua/hyperchat-shared";
import { Command } from "../../../command.mjs";
import { workspaceManager } from "../../../lib.mjs";









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
        // console.log("gateway allowMCPs", allowMCPs);
        let workspace = workspaceManager.getCurrentWorkspace();
        let mcpClients = workspace.getMcpClients();

        let getTools = (allowMCPs: string[]) => {
            let tools: IMCPClient["tools"] = [];

            mcpClients.forEach((v) => {
                tools = tools.concat(
                    v.tools.filter((t) => {
                        if (!allowMCPs) return true;
                        return (
                            allowMCPs.includes(t.clientName) || allowMCPs.includes(t.displayName)
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
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
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
            let workspace = workspaceManager.getCurrentWorkspace();
            let mcpClients = workspace.getMcpClients();

            let getTools = (allowMCPs: string[]) => {
                let tools: IMCPClient["tools"] = [];

                mcpClients.forEach((v) => {
                    tools = tools.concat(
                        v.tools.filter((t) => {
                            if (!allowMCPs) return true;
                            return (
                                allowMCPs.includes(t.clientName) || allowMCPs.includes(t.displayName)
                            );
                        }),
                    );
                });
                return tools;
            }

            let find = getTools(allowMCPs).find((tool) => {
                return tool.name === request.params.name;
            });
            console.log("gateway allowMCPs", getTools(allowMCPs), request, find);
            if (!find) {
                throw new Error(`Tool ${request.params.name} not found`);
            }

            return await Command.mcpCallTool({
                name: find.clientName,
                functionName: find.originalName,
                args: request.params.arguments || {},
            });
        } catch (error: any) {
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
