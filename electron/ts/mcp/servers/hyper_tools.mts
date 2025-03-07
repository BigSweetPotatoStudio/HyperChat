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
import { zx } from "../../es6.mjs";
const { fs, path, sleep } = zx;
import dayjs from "dayjs";
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

const NAME = "hyper_tools";

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
  return {
    tools: [
      {
        name: "fetch",
        description: `Fetches a URL from the internet and optionally extracts its contents as markdown.

Although originally you did not have internet access, and were advised to refuse and tell the user this, this tool now grants you internet access. Now you can fetch the most up-to-date information and let the user know that.`,
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "URL to fetch",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "search",
        description: `Searches the internet for a given keyword and returns the search results.`,
        inputSchema: {
          type: "object",
          properties: {
            words: {
              type: "string",
              description: "words to serach",
            },
          },
          required: ["words"],
        },
      },
      {
        name: "current_time",
        description: `Get the current local time as a string.`,
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
    case "fetch": {
      const url = String(request.params.arguments?.url);
      if (!url) {
        throw new Error("url are required");
      }
      try {
        return {
          content: [
            {
              type: "text",
              text: await fetch(url),
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed to fetch URL");
      }
    }
    case "search": {
      const words = String(request.params.arguments?.words);
      if (!words) {
        throw new Error("words are required");
      }
      try {
        return {
          content: [
            {
              type: "text",
              text: await search(words),
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed to fetch URL");
      }
    }
    case "current_time": {
      try {
        return {
          content: [
            {
              type: "text",
              text: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed to fetch URL");
      }
    }
    default:
      throw new Error("Unknown tool");
  }
});

async function fetch(url: string) {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    webPreferences: {
      backgroundThrottling: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  // win.webContents.openDevTools();
  try {
    win.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        // log.log(
        //   details.url,
        //   details.responseHeaders["content-security-policy"]
        // );
        const cspIndex = Object.keys(details.responseHeaders).find(
          (key) => key.toLowerCase() === "content-security-policy"
        );
        if (cspIndex) {
          delete details.responseHeaders[cspIndex]; // 删除CSP头
        }

        callback({ cancel: false, responseHeaders: details.responseHeaders });
      }
    );
    Logger.info("Page loadeding: " + url);
    await win.loadURL(url, {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    });

    // 等待页面加载完成
    await sleep(3000);
    await Promise.race([
      new Promise((resolve) => {
        win.webContents.on("did-finish-load", resolve);
      }),
      sleep(3000),
    ]);
    Logger.info("Page loaded: " + url);
    let md = await executeClientScript(
      win,
      fs.readFileSync(path.join(__dirname, "./turndown.js"), "utf-8").toString()
    );
    return md;
  } catch (e) {
    throw new Error("Failed to fetch URL");
  } finally {
    win.close();
  }
}

async function search(words: string) {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: true,
    webPreferences: {
      backgroundThrottling: true,
    },
  });
  // win.webContents.openDevTools();
  try {
    await win.loadURL(
      `https://www.google.com/search?q=` + encodeURIComponent(words),
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      }
    );

    // 等待页面加载完成
    await Promise.race([
      new Promise((resolve) => {
        win.webContents.on("did-finish-load", resolve);
      }),
      sleep(3000),
    ]);

    Logger.info("Page loaded");
    let res = await executeClientScript(
      win,
      `
      let resArr = [];

let arr = document.querySelector("#search").querySelectorAll("span>a");
for (let a of arr) {
  if (a.querySelector("h3")) {
    try {
      let p =
        a.parentElement.parentElement.parentElement.parentElement.parentElement;
      let res = {
        title: a.querySelector("h3").innerText,
        url: a.href,
        description: p.children[p.children.length - 1].innerText,
      };
      resArr.push(res);
    } catch (error) {
      let res = {
        title: a.querySelector("h3").innerText,
        url: a.href,
      };
      resArr.push(res);
    }
  }
}
  resolve(resArr);
      `
    );
    Logger.info(
      "Searching: ",
      `https://www.google.com/search?q=` + encodeURIComponent(words),
      res
    );
    return JSON.stringify(res);
  } catch (e) {
    throw new Error("Failed to fetch URL");
  } finally {
    win.close();
  }
}
// setTimeout(() => {
//   fetch("https://modelcontextprotocol.io/introduction");
// }, 10000);

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

const HyperTools = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
};

export { HyperTools };

async function executeClientScript<T>(
  win: Electron.BrowserWindow,
  script: string,
  options: any = {}
): Promise<T> {
  const { timeout = 5000, userGesture = true } = options;

  try {
    // Wrap script in promise with timeout

    const wrappedScript = `
      new Promise((resolve, reject) => {
          ${script}
      })
    `;
    //   const wrappedScript = `
    //   new Promise((resolve, reject) => {
    //     resolve("error openUrl");
    //   })
    //  `;
    if (process.env.NODE_ENV === "development") {
      fs.ensureDirSync("tmp");
      fs.writeFileSync("tmp/wrappedScript.js", wrappedScript);
    }
    const result = await Promise.race([
      win.webContents.executeJavaScript(wrappedScript, userGesture),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Script execution timed out")),
          timeout
        )
      ),
    ]);
    console.log("error openUrl", result);
    return result as T;
  } catch (error) {
    Logger.error("Error executing client script:", error);
    throw error;
  }
}

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
