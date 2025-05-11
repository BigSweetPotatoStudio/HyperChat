import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import os from "os";
import fs from "fs";
// import uuid from "uuid";

import * as pty from "node-pty";
import { z } from "zod";
import { shellPathSync, strip } from "ts/es6.mjs";
import { getConfig } from "./lib.mjs";
import { getMessageService } from "ts/message_service.mjs";
import { Logger } from "ts/polyfills/polyfills.mjs";

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

type Context = {
  terminal: pty.IPty;
  commamdOutput: string;
};
const terminalMap = new Map<number, Context>();


let lastTerminalID = 0;

let arr = new Array<string>();
let checkCount = 15;

function checkEnd(str: string) {
  if (str == "") {
    return false;
  }
  if (arr.length < checkCount) {
    arr.push(str);
    return false;
  } else {
    arr.shift();
    arr.push(str);
    if (arr.every((v) => v === str)) {
      return true;
    }
    return false;
  }
}

export async function GetTerminals() {
  for (let id of terminalMap.keys()) {
    lastTerminalID = id;
    // getMessageService().terminalMsg.emit("open-terminal", {
    //   terminalID: id,
    //   terminals: Array.from(terminalMap).map((x) => x[0]),
    // });
  }
  return Array.from(terminalMap.keys());
}
export async function CloseTerminal(TerminalID) {
  let terminal = terminalMap.get(TerminalID);
  if (terminal) {
    Logger.info("Terminal exited with code: ", terminal.terminal.pid);
    terminal.terminal.kill();
  }
}
export async function OpenTerminal() {

  if (os.platform() != "win32") {
    process.env.PATH = shellPathSync();
  }
  let lastTerminal = terminalMap.get(lastTerminalID);

  const terminal = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: lastTerminal?.terminal?.cols || 80,
    rows: lastTerminal?.terminal?.rows || 30,
    cwd: process.env.HOME,
    env: process.env,
    useConpty: os.platform() == "win32",
  });

  let c = {
    terminal: terminal,
    commamdOutput: "",
    lastIndex: 0,
  };
  let callback = (msg) => {
    if (msg.terminalID == terminal.pid) {
      if (msg.type == "resize") {
        // Logger.info("resize terminal: ", msg);
        c.terminal.resize(msg.data.cols, msg.data.rows);
      } else {
        c.terminal.write(msg.data);
      }
    }
  };
  terminal.onExit((code) => {
    Logger.info("Terminal exited with code: ", code);
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
    // Logger.info("terminal onData: ", data);
    getMessageService().terminalMsg.emit("terminal-send", {
      terminalID: terminal.pid,
      data: data,
    });

    c.commamdOutput += data;

  });

  // terminal.write(`clear\r`);
  while (1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (checkEnd(c.commamdOutput)) {
      break;
    }
  }
  getMessageService().addTerminalMsgListener(callback);

  terminalMap.set(terminal.pid, c);
  lastTerminalID = terminal.pid;

  return lastTerminalID;
}

export async function ActiveAITerminal(TerminalID) {
  lastTerminalID = TerminalID;
  return lastTerminalID;
}

export function registerTool(server: McpServer) {
  const config = getConfig();
  // const promptPattern = /\$\s*$|\>\s*$|#\s*$/m;
  checkCount = config.Terminal_End_CheckCount || 15;
  const maxToken = config.Terminal_Output_MaxToken || 10000;
  // console.log("checkCount: ", checkCount);

  // Add an addition tool
  // server.tool(
  //   "open-terminal",
  //   `open-terminal on ${os.platform} OS.`,
  //   {},
  //   async ({ }) => {
  //     if (os.platform() != "win32") {
  //       process.env.PATH = shellPathSync();
  //     }
  //     const terminal = pty.spawn(shell, [], {
  //       name: "xterm-color",
  //       cols: 80,
  //       rows: 30,
  //       cwd: process.env.HOME,
  //       env: process.env,
  //       useConpty: os.platform() == "win32",
  //     });

  //     let c = {
  //       terminal: terminal,
  //       commamdOutput: "",
  //       stdout: "",
  //       lastIndex: 0,
  //       timer: setTimeout(() => {
  //         try {
  //           terminal.kill();
  //         } catch (error) {
  //           console.error("Error killing terminal:", error);
  //         }
  //         terminalMap.delete(c.terminal.pid);
  //       }, timeout),
  //     };
  //     let callback = (msg) => {
  //       if (msg.terminalID == terminal.pid) {
  //         c.terminal.write(msg.data);
  //       }
  //     };
  //     terminal.onExit((code) => {
  //       clearTimeout(c.timer);
  //       terminalMap.delete(terminal.pid);
  //       getMessageService().terminalMsg.emit("close-terminal", {
  //         terminalID: terminal.pid,
  //       });
  //       getMessageService().removeTerminalMsgListener(callback);
  //     });
  //     getMessageService().terminalMsg.emit("open-terminal", {
  //       terminalID: terminal.pid,
  //       terminals: Array.from(terminalMap).map((x) => x[0]),
  //     });

  //     terminal.onData((data) => {
  //       c.timer && clearTimeout(c.timer);
  //       c.timer = setTimeout(() => {
  //         try {
  //           c.terminal.kill();
  //         } catch (error) {
  //           console.error("Error killing terminal:", error);
  //         }
  //         terminalMap.delete(c.terminal.pid);
  //       }, timeout);

  //       getMessageService().terminalMsg.emit("terminal-send", {
  //         terminalID: terminal.pid,
  //         data: data,
  //       });
  //       c.stdout += data;
  //       c.commamdOutput += data;
  //       // fs.writeFileSync("terminal.log", c.stdout);
  //     });

  //     getMessageService().addTerminalMsgListener(callback);
  //     // terminal.write(`ssh ldh@ubuntu\r`);
  //     while (1) {
  //       await new Promise((resolve) => setTimeout(resolve, 100));
  //       if (checkEnd(c.stdout)) {
  //         break;
  //       }
  //     }

  //     terminalMap.set(terminal.pid, c);
  //     lastTerminalID = terminal.pid;
  //     c.lastIndex = c.stdout.length;

  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: `success created terminalID: ${terminal.pid}\n${strip(
  //             c.stdout
  //           ).slice(-maxToken)}`,
  //         },
  //       ],
  //     };
  //   }
  // );

  server.tool(
    "execute-command",
    `execute-command on terminal.`,
    {
      // terminalID: z.number({ description: "terminalID" }),
      command: z.string({
        description: "The command to execute",
      }),
    },
    async ({ command }) => {
      if (lastTerminalID === 0 || !terminalMap.has(lastTerminalID)) {
        await OpenTerminal();
      }
      let c = terminalMap.get(lastTerminalID);
      if (c == null) {
        throw new Error("terminalID not found, please create terminal first");
      }
      Logger.info(`execute-command ${lastTerminalID}: ${command}`);
      getMessageService().terminalMsg.emit("terminal-send", {
        type: "execute-status-change",
        terminalID: lastTerminalID,
        data: {
          status: 1,
        }
      });
      c.commamdOutput = "";
      c.terminal.write(`${command}\r`);

      // c.timer && clearTimeout(c.timer);
      // c.timer = setTimeout(() => {
      //   try {
      //     c.terminal.kill();
      //   } catch (error) {
      //     console.error("Error killing terminal:", error);
      //   }
      //   terminalMap.delete(c.terminal.pid);
      // }, timeout);
      let a = false;

      while (1) {
        if (a) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          // console.log(c.commamdOutput)
          if (strip(c.commamdOutput).match(/(\n|\r)done(\n|\r)/)) {
            break;
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (checkEnd(c.commamdOutput)) {
            c.terminal.write(`                  echo done\r`);
            a = true;
          }
        }
      }
      getMessageService().terminalMsg.emit("terminal-send", {
        type: "execute-status-change",
        terminalID: lastTerminalID,
        data: {
          status: 0,
        }
      });
      // fs.writeFileSync("terminal.log", strip(c.commamdOutput));
      return {
        content: [
          { type: "text", text: strip(c.commamdOutput).slice(-maxToken) },
        ],
      };
    }
  );

  // server.tool(
  //   "view-terminal-latest-output",
  //   `View the current terminal latest output, after sigint the current command`,
  //   {
  //     terminalID: z.number({ description: "terminalID" }),
  //   },
  //   async ({ terminalID }) => {
  //     if (terminalID === -1) {
  //       terminalID = lastTerminalID;
  //     }
  //     let c = terminalMap.get(terminalID);
  //     if (c == null) {
  //       throw new Error("terminalID not found, please create terminal first");
  //     }

  //     return {
  //       content: [
  //         {
  //           type: "text",
  //           text: strip(c.stdout.slice(c.lastIndex)).slice(-maxToken),
  //         },
  //       ],
  //     };
  //   }
  // );

  // server.tool(
  //   "sigint-current-command",
  //   `sigint the current command. Ctrl+C`,
  //   {

  //   },
  //   async ({ }) => {
  //     let c = terminalMap.get(lastTerminalID);
  //     if (c == null) {
  //       throw new Error("terminalID not found, please create terminal first");
  //     }

  //     c.commamdOutput = "";
  //     c.terminal.write(``);

  //     while (1) {
  //       await new Promise((resolve) => setTimeout(resolve, 100));
  //       if (checkEnd(c.commamdOutput)) {
  //         break;
  //       }
  //     }

  //     return {
  //       content: [
  //         { type: "text", text: strip(c.commamdOutput).slice(-maxToken) },
  //       ],
  //     };
  //   }
  // );
}
