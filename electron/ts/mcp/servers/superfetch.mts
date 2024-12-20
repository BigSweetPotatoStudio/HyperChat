#!/usr/bin/env node

/**
 * This is a template MCP server that implements a simple notes system.
 * It demonstrates core MCP concepts like resources and tools by allowing:
 * - Listing notes as resources
 * - Reading individual notes
 * - Creating new notes via a tool
 * - Summarizing all notes via a prompt
 */

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
type Note = { title: string; content: string };

/**
 * Simple in-memory storage for notes.
 * In a real implementation, this would likely be backed by a database.
 */
const notes: { [id: string]: Note } = {
  "1": { title: "First Note", content: "This is note 1" },
  "2": { title: "Second Note", content: "This is note 2" },
};

const NAME = "browserOpenUrl";

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
 * Handler for listing available notes as resources.
 * Each note is exposed as a resource with:
 * - A note:// URI scheme
 * - Plain text MIME type
 * - Human readable name and description (now including the note title)
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: Object.entries(notes).map(([id, note]) => ({
      uri: `note:///${id}`,
      mimeType: "text/plain",
      name: note.title,
      description: `A text note: ${note.title}`,
    })),
  };
});

/**
 * Handler for reading the contents of a specific note.
 * Takes a note:// URI and returns the note content as plain text.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const url = new URL(request.params.uri);
  const id = url.pathname.replace(/^\//, "");
  const note = notes[id];

  if (!note) {
    throw new Error(`Note ${id} not found`);
  }

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "text/plain",
        text: note.content,
      },
    ],
  };
});

/**
 * Handler that lists available tools.
 * Exposes a single "create_note" tool that lets clients create new notes.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "create_note",
        description: "Create a new note",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the note",
            },
            content: {
              type: "string",
              description: "Text content of the note",
            },
          },
          required: ["title", "content"],
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
    case "create_note": {
      const title = String(request.params.arguments?.title);
      const content = String(request.params.arguments?.content);
      if (!title || !content) {
        throw new Error("Title and content are required");
      }

      const id = String(Object.keys(notes).length + 1);
      notes[id] = { title, content };

      return {
        content: [
          {
            type: "text",
            text: `Created note ${id}: ${title}`,
          },
        ],
      };
    }

    default:
      throw new Error("Unknown tool");
  }
});

/**
 * Handler that lists available prompts.
 * Exposes a single "summarize_notes" prompt that summarizes all notes.
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "summarize_notes",
        description: "Summarize all notes",
      },
    ],
  };
});

/**
 * Handler for the summarize_notes prompt.
 * Returns a prompt that requests summarization of all notes, with the notes' contents embedded as resources.
 */
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "summarize_notes") {
    throw new Error("Unknown prompt");
  }

  const embeddedNotes = Object.entries(notes).map(([id, note]) => ({
    type: "resource" as const,
    resource: {
      uri: `note:///${id}`,
      mimeType: "text/plain",
      text: note.content,
    },
  }));

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please summarize the following notes:",
        },
      },
      ...embeddedNotes.map((note) => ({
        role: "user" as const,
        content: note,
      })),
      {
        role: "user",
        content: {
          type: "text",
          text: "Provide a concise summary of all the notes above.",
        },
      },
    ],
  };
});

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

const superFetch = {
  createServer,
  handlePostMessage,
  name: NAME,
};

export { superFetch };

// export const superFetchRouter = new Router();
// superFetchRouter.get("/sse", async (ctx, next) => {
//   await createServer(ctx.res);
// });
// superFetchRouter.post("/message", async (ctx, next) => {
//   await handlePostMessage(ctx.req, ctx.res);
// });
// app.get("/sse", async (req, res) => {
//     console.log("Received connection");
//     transport = new SSEServerTransport("/message", res);
//     await server.connect(transport);

//     server.onclose = async () => {
//       await cleanup();
//       await server.close();
//       process.exit(0);
//     };
//   });

//   app.post("/message", async (req, res) => {
//     console.log("Received message");

//     await transport.handlePostMessage(req, res);
//   });

//   const PORT = process.env.PORT || 3001;
//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });
