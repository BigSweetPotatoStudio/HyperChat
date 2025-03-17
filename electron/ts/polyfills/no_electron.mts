import log4js from "log4js";
import dayjs from "dayjs";
import { Logger, LoggerPolyfill } from "./index.mjs";
import path from "path";

Logger.path = path.join(
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

Logger.info = function (...args) {
  let [m, ...a] = args;
  logger.info(m, a);
};
Logger.warn = function (...args) {
  let [m, ...a] = args;
  logger.warn(m, a);
};
Logger.error = function (...args) {
  let [m, ...a] = args;
  logger.error(m, a);
};

// CONST.userDataPath = path.join(process.cwd(), "data/userData.json");