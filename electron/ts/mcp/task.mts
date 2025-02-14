import Logger from "electron-log";
import {
  ChatHistory,
  ChatHistoryItem,
  GPT_MODELS,
  GPTS,
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
        let agent = GPTS.initSync().data.find(
          (x) => x.label === argumentsJSON.agent_name
        );
        if (agent == null) {
          throw new Error(`Agent ${argumentsJSON.agent_name} not found`);
        }
        res = await callAgent({
          name: agent.label,
          agentKey: agent.key,
          message: argumentsJSON.message,
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
// import { OpenAiChannel } from "../../../web/src/common/openai";
const { OpenAiChannel } = await import("../../../web/src/common/openai");
import { getToolsOnNode } from "../../../web/src/common/mcptool";
import { v4 } from "uuid";
import dayjs from "dayjs";
import { getMessageService } from "../mianWindow.mjs";
let tObj: {
  [s in string]: {
    key: string;
    cronT: any;
  };
} = {};

function trigger() {
  getMessageService().sendToRenderer({
    type: "ChatHistoryUpdate",
    data: {},
  });
}
export async function callAgent(obj: {
  name?: string;
  agentKey: string;
  message: string;
}) {
  Logger.log("Running callAgent", obj.name, obj.message, obj.agentKey);
  try {
    let agent = GPTS.initSync().data.find((x) => x.key === obj.agentKey);
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
      { ...config, allowMCPs: agent.allowMCPs },
      [
        {
          role: "system",
          content: agent.prompt,
        },
        { role: "user", content: obj.message },
      ],
      false
    );
    await openai.completion();
    let res = openai.lastMessage.content;
    // console.log("openai.completion() done", openai.messages);
    const item: ChatHistoryItem = {
      label: obj.message,
      key: v4(),
      messages: openai.messages,
      modelKey: config.key,
      gptsKey: agent.key,
      sended: true,
      requestType: "complete",
      allowMCPs: agent.allowMCPs,
      attachedDialogueCount: undefined,
      dateTime: Date.now(),
      isCalled: true,
      isTask: false,
      taskKey: undefined,
    };
    ChatHistory.initSync().data.unshift(item);
    await ChatHistory.save();
    return res;
    // await onRequest(task.message);
  } catch (e) {
    console.error(" hyper_call_agent error: ", e);
    throw e;
  } finally {
    trigger();
  }
}
export async function runTask(task: Task) {
  Logger.log("Running task", task.name);
  try {
    let agent = GPTS.initSync().data.find((x) => x.key === task.agentKey);
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
    // console.log("tools", global.tools);
    let openai = new OpenAiChannel(
      { ...config, allowMCPs: agent.allowMCPs },
      [
        {
          role: "system",
          content: agent.prompt,
        },
        { role: "user", content: task.message },
      ],
      false
    );
    await openai.completion();
    // console.log("openai.completion() done", openai.messages);
    const item: ChatHistoryItem = {
      label: task.name + " - " + dayjs().format("YYYY-MM-DDTHH:mm:ss"),
      key: v4(),
      messages: openai.messages,
      modelKey: config.key,
      gptsKey: agent.key,
      sended: true,
      requestType: "complete",
      allowMCPs: agent.allowMCPs,
      attachedDialogueCount: undefined,
      dateTime: Date.now(),
      isCalled: false,
      isTask: true,
      taskKey: task.key,
    };
    ChatHistory.initSync().data.unshift(item);
    await ChatHistory.save();
    // await onRequest(task.message);
  } catch (e) {
    console.error(" task_call_agent error: ", e);
  } finally {
    trigger();
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

    const find = tObj[taskkey];
    if (find) {
      find.cronT.stop();
      tObj[taskkey] = undefined;
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
    const find = tObj[taskkey];
    if (find) {
      find.cronT.stop();
      tObj[taskkey] = undefined;
    }
  }
}
