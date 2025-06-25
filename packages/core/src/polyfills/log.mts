/**
 * Logger 模块
 * 
 * 提供统一的日志记录接口，支持不同环境的日志实现
 */

import fs from "fs-extra";
import path from "path";
import dayjs from "dayjs";
import log4js from "log4js";
import os from "os";

const logDir = path.join(os.homedir(), ".hyperchat", "logs");
fs.ensureDirSync(logDir);
let logpath = path.join(logDir, `${dayjs().format("YYYY-MM-DD")}.log`);
log4js.configure({
  appenders: {
    log: {
      type: "file",
      filename: logpath,
    },
  },
  categories: { default: { appenders: ["log"], level: "trace" } },
});
const logger = log4js.getLogger();




export class LoggerLog4 {
  info(...args: any[]) {
    let [msg, ...rest] = args;
    logger.info(msg, ...rest);
    console.log(...args);
  }
  warn(...args: any[]) {
    let [msg, ...rest] = args;
    logger.warn(msg, ...rest);
    console.log(...args);
  }
  error(...args: any[]) {
    let [msg, ...rest] = args;
    logger.error(msg, ...rest);
    console.log(...args);
  }
  path = logpath;
}

export const Logger = new LoggerLog4();




