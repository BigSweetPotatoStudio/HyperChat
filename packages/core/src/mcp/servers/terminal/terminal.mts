import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import os from "os";
import path from "path";
import * as pty from "node-pty";
import { z } from "zod";
import { shellPathSync, strip } from "../../../es6.mjs";
import { getConfig } from "./lib.mjs";
import { getMessageService } from "../../../message_service.mjs";
import { Logger } from "../../../log.mjs";
import type { TerminalMessage } from "../../../shared/types.mjs";

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

interface TerminalContext {
  terminal: pty.IPty;
  commamdOutput: string;
  workingDirectory: string;
  createdAt: number;
}


const terminalMap = new Map<number, TerminalContext>();
let lastTerminalID = 0;
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

export async function GetTerminals(workingDirectory?: string): Promise<number[]> {
  const terminals = Array.from(terminalMap.entries());
  
  if (workingDirectory) {
    // 过滤出指定工作目录的终端
    const filteredTerminals = terminals.filter(([id, context]) => 
      context.workingDirectory === workingDirectory
    );
    return filteredTerminals.map(([id]) => id);
  }
  
  // 如果没有指定工作目录，返回所有终端
  for (const id of terminalMap.keys()) {
    lastTerminalID = id;
  }
  return Array.from(terminalMap.keys());
}

export async function CloseTerminal(terminalID: number): Promise<void> {
  const terminal = terminalMap.get(terminalID);
  if (terminal) {
    Logger.info(`Terminal ${terminalID} (PID: ${terminal.terminal.pid}) is being closed`);
    terminal.terminal.kill();
    terminalMap.delete(terminalID);
  } else {
    Logger.warn(`Terminal ${terminalID} not found`);
  }
}

export async function OpenTerminal(workingDirectory?: string): Promise<number> {
  if (os.platform() !== "win32") {
    process.env.PATH = shellPathSync();
  }
  
  const config = getConfig();
  const lastTerminal = terminalMap.get(lastTerminalID);
  const defaultCwd = config?.Terminal_Working_Directory || process.env.HOME || os.homedir();
  const cwd = workingDirectory ? path.resolve(workingDirectory) : defaultCwd;
  
  const terminal = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: lastTerminal?.terminal?.cols || 80,
    rows: lastTerminal?.terminal?.rows || 30,
    cwd,
    env: process.env,
    useConpty: os.platform() === "win32",
  });

  const terminalContext: TerminalContext = {
    terminal,
    commamdOutput: "",
    workingDirectory: cwd,
    createdAt: Date.now(),
  };
  
  const callback = (msg: TerminalMessage) => {
    if (msg.terminalID === terminal.pid) {
      if (msg.type === "resize") {
        const resizeData = msg.data as { cols: number; rows: number };
        terminalContext.terminal.resize(resizeData.cols, resizeData.rows);
      } else {
        terminalContext.terminal.write(msg.data as string);
      }
    }
  };

  terminal.onExit((code) => {
    Logger.info(`Terminal ${terminal.pid} exited with code: ${code}`);
    terminalMap.delete(terminal.pid);
    getMessageService().terminalMsg.emit("close-terminal", {
      terminalID: terminal.pid,
    });
    getMessageService().removeTerminalMsgListener(callback);
  });

  getMessageService().terminalMsg.emit("open-terminal", {
    terminalID: terminal.pid,
    terminals: Array.from(terminalMap).map((x) => x[0]),
  });

  terminal.onData((data) => {
    getMessageService().terminalMsg.emit("terminal-send", {
      terminalID: terminal.pid,
      data,
    });

    terminalContext.commamdOutput += data;
  });

  // Wait for terminal to be ready
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (checkEnd(terminalContext.commamdOutput)) {
      break;
    }
  }
  
  getMessageService().addTerminalMsgListener(callback);
  terminalMap.set(terminal.pid, terminalContext);
  lastTerminalID = terminal.pid;
  
  Logger.info(`Terminal ${terminal.pid} opened with working directory: ${cwd}`);
  return lastTerminalID;
}

export async function ActiveAITerminal(terminalID: number): Promise<number> {
  if (terminalMap.has(terminalID)) {
    lastTerminalID = terminalID;
    Logger.info(`Activated terminal ${terminalID}`);
    return lastTerminalID;
  } else {
    throw new Error(`Terminal ${terminalID} not found`);
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
      if (lastTerminalID === 0 || !terminalMap.has(lastTerminalID)) {
        await OpenTerminal();
      }
      const terminalContext = terminalMap.get(lastTerminalID);
      if (!terminalContext) {
        throw new Error("Failed to create or find terminal");
      }

      Logger.info(`Executing command in terminal ${lastTerminalID}: ${command}`);
      getMessageService().terminalMsg.emit("terminal-send", {
        type: "execute-status-change",
        terminalID: lastTerminalID,
        data: {
          status: 1,
        }
      });
      terminalContext.commamdOutput = "";
      terminalContext.terminal.write(`${command}\r`);

      let commandCompleted = false;
      const startTime = Date.now();
      
      while (true) {
        if (commandCompleted) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (strip(terminalContext.commamdOutput).match(/(\n|\r)done(\n|\r)/)) {
            break;
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (checkEnd(terminalContext.commamdOutput)) {
            terminalContext.terminal.write(`                  echo done\r`);
            commandCompleted = true;
          }
        }
        
        // Check for timeout
        if (Date.now() - startTime > timeout) {
          Logger.warn(`Command execution timed out after ${timeout}ms`);
          break;
        }
      }

      getMessageService().terminalMsg.emit("terminal-send", {
        type: "execute-status-change",
        terminalID: lastTerminalID,
        data: {
          status: 0,
        }
      });
      
      const output = strip(terminalContext.commamdOutput).slice(-maxToken);
      Logger.info(`Command completed in terminal ${lastTerminalID}`);
      
      return {
        content: [
          { type: "text", text: output },
        ],
      };
    }
  );

  // Add tool to open terminal with specific working directory
  server.tool(
    "open-terminal",
    `Open a new terminal with optional working directory.`,
    {
      path: z.string({
        description: "Working directory for the new terminal (optional)",
      }).optional(),
    },
    async ({ path: workingPath }) => {
      const terminalID = await OpenTerminal(workingPath);
      const terminalContext = terminalMap.get(terminalID);
      
      return {
        content: [
          { 
            type: "text", 
            text: `Terminal ${terminalID} opened successfully.\nWorking directory: ${terminalContext?.workingDirectory || 'default'}` 
          },
        ],
      };
    }
  );
  
  // Add tool to get terminal info
  server.tool(
    "get-terminal-info",
    `Get information about active terminals.`,
    {},
    async () => {
      const terminals = await GetTerminals();
      const terminalInfos = terminals.map(id => {
        const context = terminalMap.get(id);
        return {
          id,
          workingDirectory: context?.workingDirectory || 'unknown',
          createdAt: context?.createdAt || 0,
          isActive: id === lastTerminalID
        };
      });
      
      return {
        content: [
          { 
            type: "text", 
            text: `Active terminals: ${terminals.length}\n` +
                  `Current terminal: ${lastTerminalID}\n` +
                  `Terminal details:\n${JSON.stringify(terminalInfos, null, 2)}` 
          },
        ],
      };
    }
  );
  
  // Add tool to close terminal
  server.tool(
    "close-terminal",
    `Close a specific terminal.`,
    {
      terminalID: z.number({
        description: "ID of the terminal to close",
      }),
    },
    async ({ terminalID }) => {
      await CloseTerminal(terminalID);
      
      return {
        content: [
          { 
            type: "text", 
            text: `Terminal ${terminalID} closed successfully.` 
          },
        ],
      };
    }
  );
}