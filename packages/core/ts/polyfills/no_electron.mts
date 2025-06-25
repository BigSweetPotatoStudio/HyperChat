import log4js from "log4js";
import dayjs from "dayjs";
import {
  CONST,
  Context,
  Logger,
  LoggerPolyfill,
  AutoLauncher as IAutoLauncher,
  CheckUpdate as ICheckUpdate,
  Clone,
} from "./polyfills.mjs";
import path from "path";
import p from "../../package.json";
import { zx } from "ts/es6.mjs";

const { fs } = zx;

const logDir = path.join(Context.CONST.appDataDir, "log");
Context.CONST.getVersion = p.version;

/////////////////

fs.ensureDirSync(logDir);
let logpath = path.join(logDir, `${dayjs().format("YYYY-MM-DD")}.log`);
Logger.path = logpath;
log4js.configure({
  appenders: {
    log: {
      type: "file",
      filename: Logger.path,
    },
  },
  categories: { default: { appenders: ["log"], level: "trace" } },
});
const logger = log4js.getLogger();

class LoggerC extends LoggerPolyfill {
  info(...args) {
    let [msg, ...rest] = args;
    logger.info(msg, ...rest);
    console.log(...args);
  }
  warn(...args) {
    let [msg, ...rest] = args;
    logger.warn(msg, ...rest);
    console.log(...args);
  }
  error(...args) {
    let [msg, ...rest] = args;
    logger.error(msg, ...rest);
    console.log(...args);
  }
  path = logpath;
}

Clone(Context.Logger, new LoggerC());

export class AutoLauncher extends IAutoLauncher {}

Clone(Context.autoLauncher, new AutoLauncher());

export class CheckUpdate extends ICheckUpdate {}

Clone(Context.checkUpdate, new CheckUpdate());
