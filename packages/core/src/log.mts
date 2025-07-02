/**
 * Logger 模块
 * 
 * 提供统一的日志记录接口，支持不同环境的日志实现
 */

import { fs } from "zx";
import path from "path";
import dayjs from "dayjs";
import log4js from "log4js";
import os from "os";
import { CONST } from "./const.mjs";

const logDir = path.join(CONST.appDataDir, ".logs");
fs.ensureDirSync(logDir);
let logpath = path.join(logDir, `${dayjs().format("YYYY-MM-DD")}.log`);

// 根据环境变量设置日志级别
const isDevMode = process.env.myEnv === 'dev';
const logLevel = isDevMode ? 'debug' : 'info';

log4js.configure({
  appenders: {
    file: {
      type: "file",
      filename: logpath,
    },
    console: {
      type: "console",
    },
  },
  categories: {
    default: {
      appenders: isDevMode ? ["file", "console"] : ["file"],
      level: logLevel
    }
  },
});
const logger = log4js.getLogger();

export class LoggerLog4 {
  debug(...args: any[]) {
    let [msg, ...rest] = args;
    logger.debug(msg, ...rest);
  }
  info(...args: any[]) {
    let [msg, ...rest] = args;
    logger.info(msg, ...rest);
  }
  warn(...args: any[]) {
    let [msg, ...rest] = args;
    logger.warn(msg, ...rest);
  }
  error(...args: any[]) {
    let [msg, ...rest] = args;

    if (isDevMode) {
      // 在开发模式下，额外输出错误堆栈信息
      console.error(`[ERROR] ${msg}`, ...rest);
    } else {
      // 在生产模式下，记录简洁的错误信息
      logger.error(msg);
    }
  }

  // 添加一些实用方法
  get isDevMode() {
    return isDevMode;
  }

  get logLevel() {
    return logLevel;
  }

  // 添加日志环境信息
  logEnvironmentInfo() {
    this.info("=== Logger Environment Info ===");
    this.info("Development Mode:", isDevMode);
    this.info("Log Level:", logLevel);
    this.info("NODE_ENV:", process.env.NODE_ENV);
    this.info("myEnv:", process.env.myEnv);
    this.info("Log File Path:", logpath);
    this.info("================================");
  }

  // 设置不同级别的演示方法
  testAllLogLevels() {
    this.debug("This is a debug message - only visible in development mode");
    this.info("This is an info message");
    this.warn("This is a warning message");
    this.error("This is an error message");
  }

  path = logpath;
}

export const Logger = new LoggerLog4();




