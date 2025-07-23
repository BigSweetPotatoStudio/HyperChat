/**
 * Logger 模块
 * 
 * 提供统一的日志记录接口，支持不同环境的日志实现
 */

import { fs } from "zx";
import path from "path";
import dayjs from "dayjs";
import log4js from "log4js";
import { os } from "zx";

// 延迟初始化日志目录，避免循环依赖
let logDir: string | undefined;
let logpath: string | undefined;

function ensureLogDir(): string {
  if (!logDir) {
    // 使用默认路径，避免依赖 CONST
    const defaultAppDataDir = path.join(os.homedir(), "Documents", "HyperChat");
    logDir = path.join(defaultAppDataDir, ".logs");
    fs.ensureDirSync(logDir);
    logpath = path.join(logDir, `${dayjs().format("YYYY-MM-DD")}.log`);
  }
  return logDir;
}

// 根据环境变量设置日志级别
const isDevMode = process.env.myEnv === 'dev';
const logLevel = isDevMode ? 'debug' : 'info';

// 延迟初始化 log4js
let logger: log4js.Logger | undefined;

function getLogger(): log4js.Logger {
  if (!logger) {
    ensureLogDir(); // 确保日志目录存在
    
    log4js.configure({
      appenders: {
        file: {
          type: "file",
          filename: logpath!,
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
    
    logger = log4js.getLogger();
  }
  
  return logger;
}

export class LoggerLog4 {
  debug(...args: unknown[]) {
    let [msg, ...rest] = args;
    getLogger().debug(msg, ...rest);
  }
  info(...args: unknown[]) {
    let [msg, ...rest] = args;
    getLogger().info(msg, ...rest);
  }
  warn(...args: unknown[]) {
    let [msg, ...rest] = args;
    getLogger().warn(msg, ...rest);
  }
  error(...args: unknown[]) {
    let [msg, ...rest] = args;

    if (isDevMode) {
      // 在开发模式下，额外输出错误堆栈信息
      console.error(`[ERROR] ${msg}`, ...rest);
    } else {
      // 在生产模式下，记录简洁的错误信息
      getLogger().error(msg);
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




