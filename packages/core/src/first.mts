import { appDataDir } from "./const.mjs";
import { Logger } from "./log.mjs";
import { zx } from "./es6.mjs";
const { fs, path } = zx;
import "./data/index.mjs";

import "./workspace/index.mjs";




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
Logger.info("Application started.");
// 兼容ESM环境下的__dirname
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
Logger.info("__dirname", __dirname);
Logger.info("process.cwd()", process.cwd());
Logger.info("execPath: ", process.execPath);
Logger.info("NODE_ENV: ", process.env.NODE_ENV);
Logger.info("myEnv: ", process.env.myEnv);


Logger.info("appDataDir: ", appDataDir);
fs.ensureDirSync(path.join(appDataDir, "messages"));




// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  Logger.error('Uncaught Exception:', error);
  // process.exit(1);  
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 对于Promise错误，可以选择不终止应用
});