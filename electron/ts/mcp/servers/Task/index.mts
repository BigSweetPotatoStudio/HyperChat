import { BrowserWindow } from "electron";
import { Logger } from "ts/polyfills/index.mjs";
import { zx } from "../../../es6.mjs";
const { fs, path, sleep } = zx;
import dayjs from "dayjs";
import { Agents, KNOWLEDGE_BASE, TaskList } from "../../../../../common/data";

import { EVENT } from "../../../common/event";
import { v4 } from "uuid";
import cron from "node-cron";
import { startTask, stopTask } from "../../task.mjs";
import { getMessageService } from "../../../message_service.mjs";

// import { ListPromptsRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import {
  Server,
  SSEServerTransport,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "ts/es6.mjs";

/**
 * Type alias for a note object.
 */

const NAME = "hyper_agent";

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
  let agents = Agents.initSync({ force: true });
  let d = agents.data
    .filter((x) => x.callable)
    .map((x) => {
      return `${x.label} - ${x.description || ""}`;
    })
    .join("\n");
  if (agents.data.filter((x) => x.callable).length == 0) {
    d = "No agents found";
  } else {
    d = `Select agent:\n${d}`;
  }
  let d2 = agents.data
    .map((x) => {
      return `${x.label} - ${x.description || ""}`;
    })
    .join("\n");
  if (agents.data.length == 0) {
    d2 = "No agents found";
  } else {
    d2 = `Select agent:\n${d2}`;
  }
  return {
    tools: [
      agents.data.length > 0 && {
        name: "call_agent",
        description: `Call the Agent by sending a message and return the result.`,
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
      agents.data.length > 0 && {
        name: "add_task",
        description: `Schedule a task for the Agent to execute..`,
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "task name",
            },
            cron: {
              type: "string",
              description: "cron expression",
            },
            agent_name: {
              type: "string",
              enum: agents.data.map((x) => {
                return x.label;
              }),
              description: d2,
            },
            command: {
              type: "string",
              description:
                "This is a detailed command telling the Agent what to do.",
            },
            // description: {
            //   type: "string",
            //   description: "task description",
            // },
          },
          required: ["name", "cron", "agent_name", "command"],
        },
      },
      {
        name: "list_tasks",
        description: `List all scheduled tasks.`,
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "remove_task",
        description: `Remove a scheduled task by name or key.`,
        inputSchema: {
          type: "object",
          properties: {
            task_identifier: {
              type: "string",
              description: "Task name or key to remove",
            },
          },
          required: ["task_identifier"],
        },
      },
      // {
      //   name: "list_allowed_agents",
      //   description: `list all allow Agents`,
      //   inputSchema: {
      //     type: "object",
      //     properties: {},
      //     required: [],
      //   },
      // },
    ].filter((x) => x),
  };
});

/**
 * Handler for the create_note tool.
 * Creates a new note with the provided title and content, and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "call_agent": {
      if (!request.params.arguments?.agent_name) {
        throw new Error("agent_name are required");
      }

      if (!request.params.arguments?.message) {
        throw new Error("message are required");
      }
      try {
        return {
          content: [
            {
              type: "text",
              text: await call_agent(request.params.arguments as any),
            },
          ],
        };
      } catch (e) {
        throw new Error("Failed");
      }
    }
    case "list_allowed_agents": {
      const agents = Agents.initSync({ force: true });
      return {
        content: [
          {
            type: "text",
            text: agents.data
              .filter((x) => x.callable)
              .map((x) => {
                return `${x.label} - ${x.description || ""}`;
              })
              .join("\n"),
          },
        ],
      };
    }
    case "add_task": {
      if (!request.params.arguments?.name) {
        throw new Error("name are required");
      }

      if (!request.params.arguments?.cron) {
        throw new Error("cron are required");
      } else if (!cron.validate(request.params.arguments?.cron)) {
        throw new Error("cron is not valid");
      }

      if (!request.params.arguments?.agent_name) {
        throw new Error("agent_name are required");
      }

      if (!request.params.arguments?.command) {
        throw new Error("command are required");
      }
      return {
        content: [
          {
            type: "text",
            text: await add_task(request.params.arguments as any),
          },
        ],
      };
    }
    case "list_tasks": {
      return {
        content: [
          {
            type: "text",
            text: await list_tasks(),
          },
        ],
      };
    }
    case "remove_task": {
      if (!request.params.arguments?.task_identifier) {
        throw new Error("task_identifier is required");
      }
      return {
        content: [
          {
            type: "text",
            text: await remove_task(request.params.arguments.task_identifier),
          },
        ],
      };
    }
    default:
      throw new Error("Unknown tool");
  }
});

async function call_agent({
  agent_name,
  message,
}: {
  agent_name: string;
  message: string;
}) {
  let agents = Agents.initSync({ force: true });
  if (agents.data.find((x) => x.label == agent_name) == null) {
    throw new Error(`Agent ${agent_name} not found`);
  }
  let uid = v4();
  if (process.env.myEnv == "dev") {
    Logger.info(Object.keys(EVENT.callbacks), uid);
  }
  return new Promise((resolve, reject) => {
    let callback = (m) => {
      // console.log("============================");
      // console.log("call_agent", m.uid, m.data);

      if (m.error != undefined) {
        reject(m.error);
      } else {
        resolve(m.data);
      }

      // EVENT.clear("call_agent_res_" + uid);
    };
    EVENT.on("call_agent_res_" + uid, callback);
    getMessageService().sendToRenderer({
      type: "call_agent",
      data: {
        agent_name: agent_name,
        message: message,
        uid,
      },
    });
  });
}

async function add_task({
  name,
  cron,
  agent_name,
  command,
  description,
}: {
  name: string;
  cron: string;
  agent_name: string;
  command: string;
  description?: string;
}) {
  // console.log("add_task", name, cron, agent_name, command, description);
  const agents = Agents.initSync({ force: true });
  const agent = agents.data.find((x) => x.label == agent_name);
  if (agent == null) {
    throw new Error(`Agent ${agent_name} not found`);
  }
  let key = v4();
  TaskList.initSync().data.push({
    key: key,
    name,
    command: command,
    agentKey: agent.key,
    description: description || "",
    cron,
    disabled: false,
  });
  await TaskList.save();
  startTask(key);
  return "Task added";
}

/**
 * List all scheduled tasks with their details.
 * @returns A formatted string with all tasks information
 */
async function list_tasks(): Promise<string> {
  const taskList = TaskList.initSync({ force: true });
  const agents = Agents.initSync({ force: true });

  if (taskList.data.length === 0) {
    return "No tasks found.";
  }

  const taskDetails = taskList.data.map(task => {
    const agent = agents.data.find(a => a.key === task.agentKey);
    const agentName = agent ? agent.label : 'Unknown agent';
    const status = task.disabled ? 'Disabled' : 'Enabled';

    return `- Task: ${task.name}
  Key: ${task.key}
  Agent: ${agentName}
  Cron: ${task.cron}
  Status: ${status}
  Command: ${task.command}`;
  }).join('\n\n');

  return `Found ${taskList.data.length} task(s):\n\n${taskDetails}`;
}

/**
 * Remove a task by its name or key.
 * @param taskIdentifier The name or key of the task to remove
 * @returns A message indicating the result of the operation
 */
async function remove_task(taskIdentifier: string): Promise<string> {
  const taskList = TaskList.initSync({ force: true });

  // First try to find by key
  let taskIndex = taskList.data.findIndex(task => task.key === taskIdentifier);

  // If not found by key, try by name
  if (taskIndex === -1) {
    taskIndex = taskList.data.findIndex(task => task.name === taskIdentifier);
  }

  if (taskIndex === -1) {
    return `Task with identifier "${taskIdentifier}" not found.`;
  }

  const task = taskList.data[taskIndex];

  // Stop the task before removing it
  stopTask(task.key);

  // Remove the task from the list
  taskList.data.splice(taskIndex, 1);
  await TaskList.save();

  return `Task "${task.name}" (${task.key}) has been removed.`;
}

let transport;
/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */

async function createServer(endpoint: string, response) {
  //   console.log("Received connection");
  // transport = new SSEServerTransport(endpoint, response);
  // await server.connect(transport);
  // server.onclose = async () => {
  //   await server.close();
  //   // process.exit(0);
  // };
  return server;
}

async function handlePostMessage(req, res) {
  //   console.log("Received message");
  await transport.handlePostMessage(req, res);
}

export const HyperAgent = {
  createServer,
  handlePostMessage,
  name: NAME,
  url: ``,
  // type: "streamableHttp",
};
