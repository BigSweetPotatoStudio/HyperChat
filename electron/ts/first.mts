import { Logger } from "ts/polyfills/index.mjs";
import { zx } from "./es6.mjs";
const { $, fs, cd, fetch, sleep, path } = zx;
import { electronData } from "../../common/data";
import "./common/data.mjs";
import { appDataDir } from "ts/polyfills/index.mjs";

// global.ext = {
//   invert: async (name, args) => {
//     // try {
//     //   // const { Command } = await import(/* webpackIgnore: true */ "../command.mjs");
//     //   let res = await Command[name](...args);
//     //   return {
//     //     code: 0,
//     //     success: true,
//     //     data: res,
//     //   };
//     // } catch (e) {
//     //   Logger.error(name, args, e);
//     //   return { success: false, code: 1, message: e.message };
//     // }
//   },
//   receive: () => {},
// };
// 获取日志文件路径
const logFilePath = Logger.path;
// 清空日志文件
fs.writeFileSync(logFilePath, "");

// 记录新的启动日志
Logger.info("Application started. Previous logs cleared.");
Logger.info("__dirname", __dirname);
Logger.info("process.cwd()", process.cwd());
Logger.info("execPath: ", process.execPath);
Logger.info("NODE_ENV: ", process.env.NODE_ENV);
Logger.info("myEnv: ", process.env.myEnv);

Logger.info(
  path.join(__dirname, "../web-build/assets/favicon.png"),
  fs.existsSync(path.join(__dirname, "../web-build/assets/favicon.png"))
);

Logger.info("appDataDir: ", appDataDir);

electronData.get().appDataDir = appDataDir;
electronData.get().logFilePath = logFilePath;
electronData.save();
