import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import os from "os";
import fs from "fs";
// import uuid from "uuid";
import strip from "strip-ansi";
import * as pty from "node-pty";
import { z } from "zod";
import { shellPathSync } from "ts/es6.mjs";
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

type Context = {
  terminal: pty.IPty;
  stdout: string;
  commamdOutput: string;
  lastIndex: number;
  timer: NodeJS.Timeout;
};

export function registerTool(server: McpServer) {
  const terminalMap = new Map<number, Context>();

  let lastTerminalID = 0;

  // const promptPattern = /\$\s*$|\>\s*$|#\s*$/m;
  const checkCount = parseInt(process.env.Terminal_End_CheckCount) || 15;
  const maxToken = parseInt(process.env.Terminal_Output_MaxToken) || 10000;
  const timeout = parseInt(process.env.Terminal_Timeout) || 5 * 60 * 1000;

  let arr = new Array<string>();

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
  // Add an addition tool
  server.tool(
    "open-terminal",
    `open-terminal on ${os.platform} OS.`,
    {},
    async ({}) => {
      if (os.platform() != "win32") {
        process.env.PATH = shellPathSync();
      }
      const terminal = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
      });

      let c = {
        terminal: terminal,
        commamdOutput: "",
        stdout: "",
        lastIndex: 0,
        timer: setTimeout(() => {
          terminal.kill();
          terminalMap.delete(c.terminal.pid);
        }, timeout),
      };
      terminal.onData((data) => {
        c.stdout += data;
        c.commamdOutput += data;
        fs.writeFileSync("terminal.log", c.stdout);
      });
      // terminal.write(`ssh ldh@ubuntu\r`);
      while (1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (checkEnd(c.stdout)) {
          break;
        }
      }

      terminalMap.set(terminal.pid, c);
      lastTerminalID = terminal.pid;
      c.lastIndex = c.stdout.length;
      return {
        content: [
          {
            type: "text",
            text: `success created terminalID: ${terminal.pid}\n${strip(
              c.stdout
            ).slice(-maxToken)}`,
          },
        ],
      };
    }
  );

  server.tool(
    "execute-command",
    `execute-command on terminal.`,
    {
      terminalID: z.number({ description: "terminalID" }),
      command: z.string({
        description: "The command to execute",
      }),
    },
    async ({ terminalID, command }) => {
      if (terminalID === -1) {
        terminalID = lastTerminalID;
      }
      let c = terminalMap.get(terminalID);
      if (c == null) {
        throw new Error("terminalID not found, please create terminal first");
      }
      // logger.info(`execute-command: ${command}`);

      c.commamdOutput = "";
      c.terminal.write(`${command}\r`);

      c.timer && clearTimeout(c.timer);
      c.timer = setTimeout(() => {
        c.terminal.kill();
        terminalMap.delete(c.terminal.pid);
      }, timeout);
      let a = false;
      while (1) {
        if (a) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (c.commamdOutput.includes(`done-${terminalID}`)) {
            break;
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
          if (checkEnd(c.commamdOutput)) {
            c.terminal.write(`         echo done-${terminalID}\r`);
            a = true;
          }
        }
      }
      c.lastIndex = c.stdout.length;
      return {
        content: [
          { type: "text", text: strip(c.commamdOutput).slice(-maxToken) },
        ],
      };
    }
  );

  server.tool(
    "view-terminal-latest-output",
    `View the current terminal latest output(manual call)`,
    {
      terminalID: z.number({ description: "terminalID" }),
    },
    async ({ terminalID }) => {
      if (terminalID === -1) {
        terminalID = lastTerminalID;
      }
      let c = terminalMap.get(terminalID);
      if (c == null) {
        throw new Error("terminalID not found, please create terminal first");
      }

      return {
        content: [
          {
            type: "text",
            text: strip(c.stdout.slice(c.lastIndex)).slice(-maxToken),
          },
        ],
      };
    }
  );

  server.tool(
    "sigint-current-command",
    `sigint the current command. Ctrl+C`,
    {
      terminalID: z.number({ description: "terminalID" }),
    },
    async ({ terminalID }) => {
      if (terminalID === -1) {
        terminalID = lastTerminalID;
      }
      let c = terminalMap.get(terminalID);
      if (c == null) {
        throw new Error("terminalID not found, please create terminal first");
      }

      c.commamdOutput = "";
      c.terminal.write(``);

      while (1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (checkEnd(c.commamdOutput)) {
          break;
        }
      }

      return {
        content: [
          { type: "text", text: strip(c.commamdOutput).slice(-maxToken) },
        ],
      };
    }
  );
}
