#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

import { BrowserWindow } from "electron";
import Logger from "electron-log";
import { fs, path, sleep } from "zx";
import dayjs from "dayjs";
import { KNOWLEDGE_BASE } from "../../../../../common/data";

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

const NAME = "hyper_knowledge_base";

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
  let db = KNOWLEDGE_BASE.initSync({ force: true });
  let d = db.dbList
    .map((x) => {
      return `${x.name} - ${x.description}`;
    })
    .join("\n");
  if (db.dbList.length == 0) {
    d = "No knowledge base found";
  } else {
    d = `Select knowledge base:\n${d}`;
  }
  return {
    tools: [
      {
        name: "search_knowledge_base",
        description: `Search local knowledge base given keywords embedding and returns the RAG results.`,
        inputSchema: {
          type: "object",
          properties: {
            knowledge_base: {
              type: "string",
              enum: db.dbList.map((x) => {
                return x.name;
              }),
              description: d,
            },
            words: {
              type: "string",
              description: "embedding keywords for RAG",
            },
          },
          required: ["knowledge_base", "words"],
        },
      },
      {
        name: "knowledge_base_add",
        description: `Add content to the knowledge base.`,
        inputSchema: {
          type: "object",
          properties: {
            knowledge_base: {
              type: "string",
              enum: db.dbList.map((x) => {
                return x.name;
              }),
              description: d,
            },
            content: {
              type: "string",
              description:
                "Markdown content to be added to the knowledge base.",
            },
          },
          required: ["knowledge_base", "content"],
        },
      },
      {
        name: "list_knowledge_base",
        description: `List all local knowledge bases.`,
        inputSchema: {
          type: "object",
          properties: {},
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
    case "search_knowledge_base": {
      const knowledge_base = String(request.params.arguments?.knowledge_base);
      if (!knowledge_base) {
        throw new Error("knowledge_base are required");
      }

      const words = String(request.params.arguments?.words);
      if (!words) {
        throw new Error("words are required");
      }
      try {
        return {
          content: [
            {
              type: "text",
              text: await search(knowledge_base, words),
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed");
      }
    }
    case "list_knowledge_base": {
      try {
        return {
          content: [
            {
              type: "text",
              text: `knowledge base\n${JSON.stringify(
                KNOWLEDGE_BASE.initSync({ force: true })
                  .dbList.map((x) => x.name)
                  .join(" , ")
              )}`,
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed");
      }
    }
    case "knowledge_base_add": {
      const knowledge_base = String(request.params.arguments?.knowledge_base);
      if (!knowledge_base) {
        throw new Error("knowledge_base are required");
      }

      const content = String(request.params.arguments?.content);
      if (!content) {
        throw new Error("content are required");
      }
      try {
        let { store } = await import("../../../langchain/vectorStore.mjs");
        await store.addResourceByName(knowledge_base, {
          markdown: content,
          type: "markdown",
        });
        return {
          content: [
            {
              type: "text",
              text: `Added content to knowledge base: ${knowledge_base}`,
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

async function search(knowledge_base: string, words: string) {
  let { store } = await import("../../../langchain/vectorStore.mjs");
  let results = await store.searchByName(knowledge_base, words, 5);
  return `
### score: The lower the score, the better. the less advisable it is to use if it exceeds 0.4.
result:${JSON.stringify(results)}`;
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

const HyperKnowledgeBase = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
};

export { HyperKnowledgeBase };
