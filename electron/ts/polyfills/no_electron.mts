import log4js from "log4js";
import dayjs from "dayjs";
log4js.configure({
  appenders: {
    log: {
      type: "file",
      filename: `${dayjs().format("YYYY-MM-DD")}.log`,
    },
  },
  categories: { default: { appenders: ["log"], level: "trace" } },
});
const logger = log4js.getLogger();
