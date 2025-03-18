import log4js from "log4js";
import dayjs from "dayjs";
import { CONST, Context, Logger, LoggerPolyfill, AutoLauncher as IAutoLauncher } from "./polyfills.mjs";
import path from "path";
import p from "../../package.json";

let logpath = path.join(
  process.cwd(),
  `data/${dayjs().format("YYYY-MM-DD")}.log`
);
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
  info = logger.info;
  warn = logger.warn;
  error = logger.error;
  path = logpath;
}

Object.assign(Context.Logger, new LoggerC());
Object.setPrototypeOf(Context.Logger, new LoggerC());

Context.CONST.userDataPath = path.join(process.cwd(), "data/userData.json");
Context.CONST.getVersion = p.version;


export class AutoLauncher extends IAutoLauncher {
}

Object.assign(Context.autoLauncher, new AutoLauncher());
Object.setPrototypeOf(Context.autoLauncher, new AutoLauncher());