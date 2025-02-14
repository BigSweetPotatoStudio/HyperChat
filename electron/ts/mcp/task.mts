import Logger from "electron-log";
import { ChatHistory, GPT_MODELS, GPTS, TaskList } from "../../../common/data";
import cron from "node-cron";
import { Command } from "../command.mjs";
import { mcpClients } from "./config.mjs";
// global["window"] = {} as any;
global.ext = {
  invert: async (name, args) => {
    try {
      // const { Command } = await import(/* webpackIgnore: true */ "../command.mjs");
      let res = await Command[name](...args);
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

export function startTask(taskkey?: string) {
  if (!taskkey) {
    Logger.info(`Starting tasks ${TaskList.initSync().data.length}`);
    for (let task of TaskList.initSync().data) {
      let cronT = cron.schedule(task.cron, async () => {
        if (task.disabled) {
          return;
        }
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
          console.log("openai.completion() done", openai.messages);
          const item = {
            label: task.name + " - " + dayjs().format("YYYY-MM-DDTHH:mm:ss"),
            key: v4(),
            messages: openai.messages,
            modelKey: config.key,
            gptsKey: agent.key,
            sended: true,
            requestType: "stream",
            allowMCPs: agent.allowMCPs,
            attachedDialogueCount: undefined,
            dateTime: Date.now(),
            isCalled: false,
            isTask: true,
          };
          ChatHistory.initSync().data.unshift(item);
          ChatHistory.save();
          // await onRequest(task.message);
        } catch (e) {
          console.error(" hyper_call_agent error: ", e);
        } finally {
          trigger();
        }
      });
      tObj[task.key] = {
        key: task.key,
        cronT,
      };
    }
  } else {
    Logger.info(`Starting task ${taskkey}`);
    let task = TaskList.initSync().data.find((x) => x.key === taskkey);

    let find = tObj[taskkey];
    if (find) {
      find.cronT.stop();
    }
    let cronT = cron.schedule(task.cron, async () => {
      if (task.disabled) {
        return;
      }
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
        console.log("openai.completion() done", openai.messages);
        const item = {
          label: task.name + " - " + dayjs().format("YYYY-MM-DDTHH:mm:ss"),
          key: v4(),
          messages: openai.messages,
          modelKey: config.key,
          gptsKey: agent.key,
          sended: true,
          requestType: "stream",
          allowMCPs: agent.allowMCPs,
          attachedDialogueCount: undefined,
          dateTime: Date.now(),
          isCalled: false,
          isTask: true,
        };
        ChatHistory.initSync().data.unshift(item);
        ChatHistory.save();
        // await onRequest(task.message);
      } catch (e) {
        console.error(" hyper_call_agent error: ", e);
      } finally {
        trigger();
      }
    });
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
    }
    tObj[taskkey] = undefined;
  }
}
