#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

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
// import { ListPromptsRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const NAME = "hyper_knowledge_base";

/**
 * Create an MCP server with capabilities for resources (to list/read notes),
 * tools (to create new notes), and prompts (to summarize notes).
 */
const server = new Server(
  {
    name: NAME,
    version: CONST.getVersion,
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
      db.dbList.length > 0 && {
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
      db.dbList.length > 0 && {
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
      KNOWLEDGE_BASE.initSync({ force: true })
      if (KNOWLEDGE_BASE.get()
        .dbList.length == 0) {
        return {
          content: [
            {
              type: "text",
              text: `No knowledge base found`,
            },
          ],
        };
      }
      try {
        return {
          content: [
            {
              type: "text",
              text: `knowledge base\n${KNOWLEDGE_BASE.get()
                .dbList.map((x) => x.name + " - " + x.description)
                .join("\n")}`,
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
        await store.addResourceByName(knowledge_base, {
          text: content,
          type: "text",
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

  let results = await store.searchByName(knowledge_base, words, 5);
  return `
### score: The high the score, the better.
result:
${JSON.stringify(results)}`;
}

let transport;
/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */

async function createServer(endpoint: string, response) {
  return server;
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
  // type: "streamableHttp",
};

export { HyperKnowledgeBase };
