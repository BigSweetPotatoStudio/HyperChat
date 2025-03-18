import log4js from "log4js";
import dayjs from "dayjs";
import {
  CONST,
  Context,
  Logger,
  LoggerPolyfill,
  AutoLauncher as IAutoLauncher,
  CheckUpdate as ICheckUpdate
} from "./polyfills.mjs";
import path from "path";
import p from "../../package.json";
import { zx } from "ts/es6.mjs";

const { fs } = zx;

Context.CONST.userDataPath = path.join(process.cwd(), "data");
Context.CONST.getVersion = p.version;

/////////////////

fs.ensureDirSync(Context.CONST.userDataPath);
let logpath = path.join(
  Context.CONST.userDataPath,
  `${dayjs().format("YYYY-MM-DD")}.log`
);
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
  }
  warn(...args) {
    let [msg, ...rest] = args;
    logger.warn(msg, ...rest);
  }
  error(...args) {
    let [msg, ...rest] = args;
    logger.error(msg, ...rest);
  }
  path = logpath;
}

Object.assign(Context.Logger, new LoggerC());
Object.setPrototypeOf(Context.Logger, new LoggerC());

export class AutoLauncher extends IAutoLauncher {

}

Object.assign(Context.autoLauncher, new AutoLauncher());
Object.setPrototypeOf(Context.autoLauncher, new AutoLauncher());

export class CheckUpdate extends ICheckUpdate {

}

Object.assign(Context.checkUpdate, new CheckUpdate());
Object.setPrototypeOf(Context.checkUpdate, new CheckUpdate());
