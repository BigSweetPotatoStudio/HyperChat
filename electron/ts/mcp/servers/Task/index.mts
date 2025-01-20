import { BrowserWindow } from "electron";
import Logger from "electron-log";
import { fs, path, sleep } from "zx";
import dayjs from "dayjs";
import { GPTS, KNOWLEDGE_BASE } from "../../../../../common/data";
import { getMessageService } from "../../../mianWindow.mjs";
import { EVENT } from "../../../common/event";
import { v4 } from "uuid";

// import { ListPromptsRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const { Server } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/index.js"
);
const { SSEServerTransport } = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/server/sse.js"
);
const {
  ListToolsResultSchema,
  CallToolRequestSchema,
  CallToolResultSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
} = await import(
  /* webpackIgnore: true */ "@modelcontextprotocol/sdk/types.js"
);

/**
 * Type alias for a note object.
 */

const NAME = "hyper_task";

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: NAME,
    version: "0.1.0",
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
  let agents = GPTS.initSync();
  let d = agents.data
    .filter((x) => x.callable)
    .map((x) => {
      return `${x.label} - ${x.description}`;
    })
    .join("\n");
  if (agents.data.length == 0) {
    d = "No agents found";
  } else {
    d = `Select agent:\n${d}`;
  }
  return {
    tools: [
      {
        name: "call_agent",
        description: `Call the Agent(Bot) by sending a message and return the result.`,
        inputSchema: {
          type: "object",
          properties: {
            agent_name: {
              type: "string",
              enum: agents.data
                .filter((x) => x.callable)
                .map((x) => {
                  return x.label;
                }),
              description: d,
            },
            message: {
              type: "string",
              description: "send message to the agent",
            },
          },
          required: ["agent_name", "message"],
        },
      },
    ],
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "call_agent": {
      const agent_name = String(request.params.arguments?.agent_name);
      if (!agent_name) {
        throw new Error("agent_name are required");
      }

      const message = String(request.params.arguments?.message);
      if (!message) {
        throw new Error("message are required");
      }
      try {
        // call_agent(agent_name, message);
        return {
          content: [
            {
              type: "text",
              text: await call_agent(agent_name, message),
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed");
      }
    }

    default:
      throw new Error("Unknown tool");
  }
});

async function call_agent(agent_name: string, message: string) {
  let agents = GPTS.initSync();
  if (agents.data.find((x) => x.label == agent_name) == null) {
    throw new Error(`Agent ${agent_name} not found`);
  }
  let uid = v4();
  getMessageService().sendToRenderer({
    type: "call_agent",
    data: {
      agent_name: agent_name,
      message: message,
      uid,
    },
  });
  return new Promise((resolve, reject) => {
    EVENT.on("call_agent_res", (m) => {
      if (m.uid) {
        console.log(m.data);
        resolve(m.data);
      }
    });
  });
}

let transport;
/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */

async function createServer(endpoint: string, response) {
  //   console.log("Received connection");
  transport = new SSEServerTransport(endpoint, response);
  await server.connect(transport);
  server.onclose = async () => {
    await server.close();
    // process.exit(0);
  };
}

async function handlePostMessage(req, res) {
  //   console.log("Received message");
  await transport.handlePostMessage(req, res);
}

export const HyperTask = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
};
