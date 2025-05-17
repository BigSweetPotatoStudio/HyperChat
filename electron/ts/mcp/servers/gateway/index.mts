

import { store } from "../../../rag/vectorStore.mjs";
import dayjs from "dayjs";
import { KNOWLEDGE_BASE } from "../../../../../common/data";
import {
    Server,
    SSEServerTransport,
    zx,
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from "ts/es6.mjs";
import { CONST } from "ts/polyfills/polyfills.mjs";
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

        return {
            tools: [
                {
                    name: "list_knowledge_base",
                    description: `List all local knowledge bases.`,
                    inputSchema: {
                        type: "object",
                        properties: {},
                    },
                },
            ].filter(x => x),
        };
    });

    /**
     * Handler for the create_note tool.
     * Creates a new note with the provided title and content, and returns success message.
     */
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        switch (request.params.name) {
            case "search_knowledge_base": {
            }


            default:
                throw new Error("Unknown tool");
        }
    });


    return server;
}




export { createServer };
