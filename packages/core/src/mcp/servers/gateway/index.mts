
import dayjs from "dayjs";
import { CallToolRequestSchema, ListToolsRequestSchema, Server } from "../../../es6.mjs";
import { CONST } from "../../../const.mjs";
import { IMCPClient } from "@dadigua/hyperchat-shared";
import { Command } from "../../../command.mjs";
import { workspaceManager } from "../../../lib.mjs";









async function createServer(name: string, description: string, allowMCPs: string[], blockMCPTools: string[] = []) {
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

        let getTools = (allowMCPs: string[], blockMCPTools: string[]) => {
            let tools: IMCPClient["tools"] = [];

            mcpClients.forEach((v) => {
                tools = tools.concat(
                    v.tools.filter((t) => {
                        // 检查 MCP 客户端名称（白名单模式）
                        const mcpAllowed = !allowMCPs || allowMCPs.length === 0 || allowMCPs.includes(t.clientName);
                        
                        // 检查工具是否被阻止（黑名单模式）
                        const toolBlocked = blockMCPTools && blockMCPTools.length > 0 && blockMCPTools.includes(t.displayName);
                        
                        // MCP 允许且工具未被阻止
                        return mcpAllowed && !toolBlocked;
                    }),
                );
            });
            return tools;
        }
        return {
            tools: [
                ...getTools(allowMCPs, blockMCPTools).map((tool) => {
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

            let getTools = (allowMCPs: string[], blockMCPTools: string[]) => {
                let tools: IMCPClient["tools"] = [];

                mcpClients.forEach((v) => {
                    tools = tools.concat(
                        v.tools.filter((t) => {
                            // 检查 MCP 客户端名称（白名单模式）
                            const mcpAllowed = !allowMCPs || allowMCPs.length === 0 || allowMCPs.includes(t.clientName);
                            
                            // 检查工具是否被阻止（黑名单模式）
                            const toolBlocked = blockMCPTools && blockMCPTools.length > 0 && blockMCPTools.includes(t.displayName);
                            
                            // MCP 允许且工具未被阻止
                            return mcpAllowed && !toolBlocked;
                        }),
                    );
                });
                return tools;
            }

            let find = getTools(allowMCPs, blockMCPTools).find((tool) => {
                return tool.name === request.params.name;
            });
            console.log("gateway allowMCPs/blockTools", getTools(allowMCPs, blockMCPTools), request, find);
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
