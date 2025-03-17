import ELogger from "electron-log";
import { Logger } from "./index.mjs";
import { app } from "electron";

Logger.info = function (...args) {
  ELogger.info(...args);
};
Logger.warn = function (...args) {
  ELogger.warn(...args);
};
Logger.error = function (...args) {
  ELogger.error(...args);
};
Logger.path = ELogger.transports.file.getFile().path;

// export const userDataPath = app.getPath("userData");

// CONST.userDataPath = userDataPath;
