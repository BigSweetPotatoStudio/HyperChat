import { Logger } from "ts/polyfills/index.mjs";
import {
  ChatHistory,
  ChatHistoryItem,
  GPT_MODELS,
  Agents,
  Task,
  TaskList,
} from "../../../common/data";
import cron from "node-cron";
import { Command } from "../command.mjs";
import { mcpClients } from "./config.mjs";
// global["window"] = {} as any;
global.ext = {
  invert: async (name, args) => {
    try {
      // const { Command } = await import(/* webpackIgnore: true */ "../command.mjs");
      let res;
      const [clientName, functionName, argumentsJSON] = args;
      if (
        name === "mcpCallTool" &&
        clientName == "hyper_agent" &&
        functionName.includes("call_agent")
      ) {
        let agent = Agents.initSync().data.find(
          (x) => x.label === argumentsJSON.agent_name
        );
        if (agent == null) {
          throw new Error(`Agent ${argumentsJSON.agent_name} not found`);
        }
        res = await callAgent({
          agentKey: agent.key,
          message: argumentsJSON.message,
          type: "isCalled",
        });
      } else {
        res = await Command[name](...args);
      }

      return {
        code: 0,
        success: true,
        data: res,
      };
    } catch (e) {
      Logger.error(name, args, e);
      return { success: false, code: 1, message: e.message };
    }
  },
  receive: () => {},
};

const { OpenAiChannel } = await import("../../../web/src/common/openai");
import { getToolsOnNode } from "../../../web/src/common/mcptool";
import { v4 } from "uuid";
import dayjs from "dayjs";

import { getMessageService } from "../message_service.mjs";
let tObj: {
  [s in string]: {
    key: string;
    cronT: any;
  };
} = {};

function trigger({ task, agent, result }) {
  getMessageService().sendAllToRenderer({
    type: "TaskResult",
    data: { task, agent, result },
  });
}
export async function callAgent(obj: {
  // name?: string;
  agentKey: string;
  message: string;
  type: "task" | "isCalled" | "call";
  taskKey?: string;
}) {
  try {
    let agent = Agents.initSync().data.find((x) => x.key === obj.agentKey);
    if (agent == null) {
      throw new Error(`Agent ${obj.agentKey} not found`);
    }
    Logger.info("Running callAgent", agent.label, obj.message, obj.agentKey);
    let config =
      GPT_MODELS.initSync().data.find((x) => x.key == agent.modelKey) ||
      GPT_MODELS.initSync().data[0];

    if (!config) {
      Logger.error("No model found");
      return;
    }
    global.tools = getToolsOnNode(
      mcpClients,
      (x) => agent.allowMCPs == null || agent.allowMCPs.includes(x.name)
    );

    let openai = new OpenAiChannel(
      { ...config, ...agent, allowMCPs: agent.allowMCPs },
      [
        {
          role: "system",
          content: agent.prompt,
          content_date: Date.now(),
        },
        { role: "user", content: obj.message, content_date: Date.now() },
      ]
    );
    await openai.completion();
    let res = openai.lastMessage.content;
    // console.log("openai.completion() done", openai.messages);
    const item: ChatHistoryItem = {
      label: obj.message,
      key: v4(),
      messages: openai.messages,
      modelKey: config.key,
      agentKey: agent.key,
      sended: true,
      requestType: "complete",
      allowMCPs: agent.allowMCPs,
      attachedDialogueCount: agent.attachedDialogueCount,
      dateTime: Date.now(),
      isCalled: obj.type === "isCalled",
      isTask: obj.type === "task",
      taskKey: obj.taskKey,
      confirm_call_tool: false,
    };
    ChatHistory.initSync().data.unshift(item);
    await ChatHistory.save();
    return res;
    // await onRequest(task.message);
  } catch (e) {
    console.error(" hyper_call_agent error: ", e);
    throw e;
  } finally {
  }
}
export async function runTask(task: Task) {
  Logger.info("Running task", task.name);
  try {
    let lastMessage = await callAgent({
      agentKey: task.agentKey,
      message: task.command,
      type: "task",
      taskKey: task.key,
    });
    let agent = Agents.initSync().data.find((x) => x.key === task.agentKey);

    await trigger({ task, agent, result: lastMessage });
    // await onRequest(task.message);
  } catch (e) {
    console.error(" task_call_agent error: ", e);
  } finally {
  }
}
export function startTask(taskkey?: string) {
  if (!taskkey) {
    Logger.info(`Starting tasks ${TaskList.initSync().data.length}`);
    for (let task of TaskList.initSync().data) {
      if (task.disabled) {
        return;
      }
      let cronT = cron.schedule(task.cron, runTask.bind(this, task));
      tObj[task.key] = {
        key: task.key,
        cronT,
      };
    }
  } else {
    Logger.info(`Starting task ${taskkey}`);
    let task = TaskList.initSync().data.find((x) => x.key === taskkey);

    try {
      const find = tObj[taskkey];
      if (find) {
        find.cronT.stop();
        tObj[taskkey] = undefined;
      }
    } catch (e) {
      Logger.info(`Stopping error ${e}`);
    }

    let cronT = cron.schedule(task.cron, runTask.bind(this, task));
    tObj[task.key] = {
      key: task.key,
      cronT,
    };
  }
}

export function stopTask(taskkey?: string) {
  if (!taskkey) {
    Logger.info(`Stopping tasks ${tObj.length}`);
    for (let key in tObj) {
      tObj[key].cronT.stop();
    }
    tObj = {};
  } else {
    Logger.info(`Stopping task ${taskkey}`);
    try {
      const find = tObj[taskkey];
      if (find) {
        find.cronT.stop();
        tObj[taskkey] = undefined;
      }
      Logger.info("stoped task", taskkey);
    } catch (e) {
      Logger.info(`Stopping error ${e}`);
    }
  }
}
