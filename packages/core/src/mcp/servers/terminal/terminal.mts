import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { strip } from "../../../es6.mjs";
import { getConfig } from "./lib.mjs";
import { getMessageService } from "../../../message_service.mjs";
import { Logger } from "../../../log.mjs";
import { getWorkspaceTerminal } from "../../../workspace/tools/terminal.mjs";
import { workspaceManager } from "../../../lib.mjs";

let outputCheckArray: string[] = [];
let checkCount = 15;

function checkEnd(str: string): boolean {
  if (str === "") {
    return false;
  }
  if (outputCheckArray.length < checkCount) {
    outputCheckArray.push(str);
    return false;
  } else {
    outputCheckArray.shift();
    outputCheckArray.push(str);
    return outputCheckArray.every((v) => v === str);
  }
}


export function registerTool(server: McpServer): void {
  const config = getConfig();
  checkCount = config?.Terminal_End_CheckCount || 15;
  const maxToken = config?.Terminal_Output_MaxToken || 10000;
  const timeout = config?.Terminal_Timeout || 5 * 60 * 1000;

  server.tool(
    "execute-command",
    `Execute a command in the terminal. If no terminal exists, one will be created automatically using the configured working directory.`,
    {
      command: z.string({
        description: "The command to execute",
      }),
    },
    async ({ command }) => {
      let workspace = workspaceManager.getCurrentWorkspace();
      let workspacePath = workspace.workspacePath;
      // 获取工作区终端管理器
      const workspaceTerminal = getWorkspaceTerminal(workspacePath);

      // 获取活动终端，如果没有则创建一个
      let activeTerminal = workspaceTerminal.getActiveTerminal();
      if (!activeTerminal) {
        activeTerminal = await workspaceTerminal.createTerminal(workspacePath);
      }

      Logger.info(`Executing command in terminal ${activeTerminal.id}: ${command}`);

      // 发送执行状态变更消息
      getMessageService().terminalMsg.emit("terminal-send", {
        type: "execute-status-change",
        terminalID: activeTerminal.id,
        data: {
          status: 1,
        }
      });

      // 清空输出并执行命令
      const initialOutputLength = activeTerminal.output.length;
      activeTerminal.terminal.write(`${command}\r`);

      let commandCompleted = false;
      const startTime = Date.now();

      while (true) {
        // 获取新的输出
        const currentOutput = activeTerminal.output.slice(initialOutputLength);

        if (commandCompleted) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (strip(currentOutput).match(/(\n|\r)done(\n|\r)/)) {
            break;
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (checkEnd(currentOutput)) {
            activeTerminal.terminal.write(`                  echo done\r`);
            commandCompleted = true;
          }
        }

        // Check for timeout
        if (Date.now() - startTime > timeout) {
          Logger.warn(`Command execution timed out after ${timeout}ms`);
          break;
        }
      }

      // 发送执行完成状态
      getMessageService().terminalMsg.emit("terminal-send", {
        type: "execute-status-change",
        terminalID: activeTerminal.id,
        data: {
          status: 0,
        }
      });

      const output = strip(activeTerminal.output.slice(initialOutputLength)).slice(-maxToken);
      Logger.info(`Command completed in terminal ${activeTerminal.id}`);

      return {
        content: [
          { type: "text", text: output },
        ],
      };
    }
  );
}