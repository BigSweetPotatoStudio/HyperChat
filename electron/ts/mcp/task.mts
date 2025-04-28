import { Logger } from "ts/polyfills/index.mjs";
import {
  ChatHistory,
  ChatHistoryItem,
  GPT_MODELS,
  Agents,
  Task,
  TaskList,
  IMCPClient,
  electronData,
  VarList,
} from "../../../common/data";
import cron from "node-cron";
import { Command } from "../command.mjs";
import { mcpClients } from "./config.mjs";
// global["window"] = {} as any;
global.ext2 = {
  invert: async (name, args) => {
    try {
      // const { Command } = await import(/* webpackIgnore: true */ "../command.mjs");
      let res;
      const [clientName, functionName, argumentsObj] = args;
      if (
        name === "mcpCallTool" &&
        clientName == "hyper_agent" &&
        functionName.includes("call_agent")
      ) {
        let agent = Agents.initSync().data.find(
          (x) => x.label === argumentsObj.agent_name
        );
        if (agent == null) {
          throw new Error(`Agent ${argumentsObj.agent_name} not found`);
        }
        res = await callAgent({
          agentKey: agent.key,
          message: argumentsObj.message,
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
  async call(command, args, options) {
    try {
      // console.log(`command ${command}`, args);
      let res = await global.ext2.invert(command, args, options);
      if (res.success) {
        return res.data;
      } else {
        throw new Error(res.message);
      }
    } catch (e) {
      console.error(command, args, e);

      throw e;
    }
  },
  receive: () => { },
};

import { OpenAiChannel } from "../../../web/src/common/openai";
import { Agent } from "../../../web/src/common/agent";
import { getDefaultModelConfigSync } from "../../../web/src/components/ai";
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

  let agent = Agents.initSync().data.find((x) => x.key === obj.agentKey);
  if (agent == null) {
    throw new Error(`Agent ${obj.agentKey} not found`);
  }
  Logger.info("Running callAgent", agent.label, obj.message, obj.agentKey);

  async function runByKey(modelKey: string) {
    let agentInstance = new Agent(agent);
    await agentInstance.init();
    try {

      global.getTools = (allowMCPs) => {
        let tools: IMCPClient["tools"] = [];

        mcpClients.forEach((v) => {
          tools = tools.concat(
            v.tools.filter((t) => {
              if (!allowMCPs) return true;
              return (
                allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
              );
            }),
          );
        });
        return tools;
      }

      let relayMessage = await agentInstance.receiveMessage({
        role: "user",
        content_template: obj.message,
        content: "",
        content_date: Date.now(),
      });
      console.log("relayMessage: ", relayMessage.content);
      const item: ChatHistoryItem = {
        label: obj.message,
        key: v4(),
        messages: agentInstance.channel.messages,
        modelKey: agentInstance.gptModelData.key,
        agentKey: agent.key,
        sended: true,
        requestType: "stream",
        allowMCPs: agent.allowMCPs,
        attachedDialogueCount: agent.attachedDialogueCount,
        dateTime: Date.now(),
        isCalled: obj.type === "isCalled",
        isTask: obj.type === "task",
        taskKey: obj.taskKey,
        confirm_call_tool: false,
        lastMessage: relayMessage,
      };
      Command.addChatHistory(item);
      return relayMessage;
    } catch (e) {
      console.error(" hyper_call_agent error: ", e);
      agentInstance.channel.lastMessage.content_error = e.message;
      agentInstance.channel.lastMessage.content_status = "error";
      const item: ChatHistoryItem = {
        label: obj.message,
        key: v4(),
        messages: agentInstance.channel.messages,
        modelKey: agentInstance.gptModelData.key,
        agentKey: agent.key,
        sended: true,
        requestType: "stream",
        allowMCPs: agent.allowMCPs,
        attachedDialogueCount: agent.attachedDialogueCount,
        dateTime: Date.now(),
        isCalled: obj.type === "isCalled",
        isTask: obj.type === "task",
        taskKey: obj.taskKey,
        confirm_call_tool: false,
      };
      Command.addChatHistory(item);
      throw new Error(e.message);
    }

    // GPT_MODELS.initSync();
    // let config = GPT_MODELS.get().data.find((x) => x.key == modelKey) || getDefaultModelConfigSync(GPT_MODELS);

    // if (!config) {
    //   Logger.error("No model found");
    //   throw new Error("No model found");
    // }

    // let openai = new OpenAiChannel(
    //   {
    //     ...config, ...agent, allowMCPs: agent.allowMCPs, requestType: "stream",
    //     messages_format_callback: async (message) => {
    //       if (message.role == "user" || message.role == "system") {
    //         if (!message.content_sended) {
    //           let varList = [...VarList.initSync().data?.map((v) => {
    //             let varName = v.scope + "." + v.name;
    //             return {
    //               ...v,
    //               varName: varName,
    //             }
    //           })];
    //           async function renderTemplate(template: string) {
    //             let reg = /{{(.*?)}}/g;
    //             let matchs = template.match(reg);
    //             let subResults = [];
    //             for (let match of matchs || []) {
    //               let varName = match.slice(2, -2).trim();
    //               let v = varList.find((x) => x.varName == varName);
    //               let value = varName;
    //               if (v) {
    //                 if (v.variableType == "js") {
    //                   value = await global.ext2.call("runCode", [{ code: v.code }]).catch(e => {
    //                     throw new Error(`${varName} var runCode Error:\n${e.message}`);
    //                   });
    //                 } else if (v.variableType == "webjs") {
    //                   value = await global.ext2.call("runCode", [{ code: v.code }]).catch(e => {
    //                     throw new Error(`${varName} var runCode Error: task is running in the nodejs environment, does not support webjs.\n${e.message}`);
    //                   });
    //                   // let code = `
    //                   // (async () => {
    //                   //     ${v.code}
    //                   //    return await get()
    //                   // })()
    //                   // `;
    //                   // // console.log(code);
    //                   // value = await eval(code);
    //                 } else {
    //                   value = v.value;
    //                 }
    //               }
    //               subResults.push({ value, varName });
    //             }
    //             let result = template.replace(reg, (match, p1) => {
    //               return subResults.find((x) => x.varName === p1.trim())?.value || match;
    //             });
    //             return result;
    //           }
    //           if (message.content_template) {
    //             if (typeof message.content == "string") {
    //               message.content = await renderTemplate(message.content_template);
    //             }
    //             else if (Array.isArray(message.content) && message.content.length >= 1) {
    //               if (message.content[0].type == "text") {
    //                 message.content[0].text = await renderTemplate(message.content_template);
    //               }
    //             }

    //           }
    //           message.content_sended = true;
    //         }
    //       }
    //     },
    //   },
    //   [
    //     {
    //       role: "system",
    //       content_template: agent.prompt,
    //       content: "",
    //       content_date: Date.now(),
    //     },
    //     { role: "user", content: "", content_template: obj.message, content_date: Date.now() },
    //   ]
    // );
    // try {

    //   global.getTools = (allowMCPs) => {
    //     let tools: IMCPClient["tools"] = [];

    //     mcpClients.forEach((v) => {
    //       tools = tools.concat(
    //         v.tools.filter((t) => {
    //           if (!allowMCPs) return true;
    //           return (
    //             allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
    //           );
    //         }),
    //       );
    //     });
    //     return tools;
    //   }

    //   await openai.completion();

    //   // console.log("openai.completion() done", openai.messages);
    //   const item: ChatHistoryItem = {
    //     label: obj.message,
    //     key: v4(),
    //     messages: openai.messages,
    //     modelKey: config.key,
    //     agentKey: agent.key,
    //     sended: true,
    //     requestType: "stream",
    //     allowMCPs: agent.allowMCPs,
    //     attachedDialogueCount: agent.attachedDialogueCount,
    //     dateTime: Date.now(),
    //     isCalled: obj.type === "isCalled",
    //     isTask: obj.type === "task",
    //     taskKey: obj.taskKey,
    //     confirm_call_tool: false,
    //   };
    //   Command.addChatHistory(item);

    //   return openai.lastMessage;

    // } catch (e) {
    //   console.error(" hyper_call_agent error: ", e);
    //   openai.lastMessage.content_error = e.message;
    //   openai.lastMessage.content_status = "error";
    //   const item: ChatHistoryItem = {
    //     label: obj.message,
    //     key: v4(),
    //     messages: openai.messages,
    //     modelKey: config.key,
    //     agentKey: agent.key,
    //     sended: true,
    //     requestType: "stream",
    //     allowMCPs: agent.allowMCPs,
    //     attachedDialogueCount: agent.attachedDialogueCount,
    //     dateTime: Date.now(),
    //     isCalled: obj.type === "isCalled",
    //     isTask: obj.type === "task",
    //     taskKey: obj.taskKey,
    //     confirm_call_tool: false,
    //   };
    //   Command.addChatHistory(item);
    //   throw new Error(e.message);
    // }
  }

  return await runByKey(agent.modelKey).catch(async (e) => {
    try {
      if (agent.fallbackModelKey) {
        return await runByKey(agent.fallbackModelKey);
      }
    } catch { }
    throw e;
  })
}
export async function runTask(taskKey: string, { force = false }) {
  let task = TaskList.initSync().data.find((x) => x.key === taskKey);
  if (task == null) {
    throw new Error(`Task ${taskKey} not found`);
  }
  if (force) {

  } else {
    if (task.disabled) {
      return;
    }
  }

  Logger.info("Running task", task.name);
  let agent = Agents.initSync().data.find((x) => x.key === task.agentKey);
  if (agent == null) {
    throw new Error(`Agent ${task.agentKey} not found`);
  }
  try {
    let lastMessage = await callAgent({
      agentKey: task.agentKey,
      message: task.command,
      type: "task",
      taskKey: task.key,
    });

    // throw new Error("test error");
    await trigger({ task, agent, result: lastMessage.content.toString() });
    // await onRequest(task.message);
  } catch (e) {
    Logger.error(" task_call_agent error: ", e);
    await trigger({ task, agent, result: e.message });
  } finally {
  }
}
export function startTask(taskkey?: string) {
  if (!taskkey) {
    Logger.info(`enable tasks ${TaskList.initSync().data.length}`);
    for (let task of TaskList.initSync().data) {
      if (task.disabled) {
        continue;
      }
      let cronT = cron.schedule(task.cron, () => {
        if (electronData.initSync().runTask == true) {
          runTask(task.key, { force: false }).then((res) => {
            Logger.info("task result", res);
          });
        }
      });
      tObj[task.key] = {
        key: task.key,
        cronT,
      };
    }
  } else {
    Logger.info(`enable task ${taskkey}`);
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
    // console.log("task", task);
    let cronT = cron.schedule(task.cron, () => {
      if (electronData.initSync().runTask == true) {
        runTask(task.key, { force: false }).then((res) => {
          Logger.info("task result", res);
        });
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
