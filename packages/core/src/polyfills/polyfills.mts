
import { Logger } from "./log.mjs";
import p from "../../package.json" with { type: "json" };
export { Logger };

export const Context = {
  CONST: {} as {
    userDataPath: string;
    getVersion: string;
    appDataDir: string;
    dirName: string;
  },
  autoLauncher: {} as any,
  checkUpdate: {} as any,
};



import path from "path";
import os from "os";

import { zx } from "../es6.mjs";
const { fs, argv } = zx;

export const dirName = "HyperChat";
let appDataDir = path.join(os.homedir(), "Documents", dirName);

try {
  if (argv.appDataDir && typeof argv.appDataDir === "string") {
    // 如果命令行参数中指定了 appDataDir，则使用该路径
    appDataDir = argv.appDataDir
  }
} catch (e) {
  Logger.error("appDataDir set failed", e);
}


fs.ensureDirSync(appDataDir);
export { appDataDir };


export const CONST = {
  userDataPath: appDataDir,
  getVersion: p.version,
  appDataDir: appDataDir,
  dirName: dirName,
};

// export class AutoLauncher {
//   public autoLauncher: any;

//   constructor() { }
//   async enable() {
//     throw new Error("Method not implemented.");
//   }

//   async disable() {
//     throw new Error("Method not implemented.");
//   }

//   async isEnabled() {
//     return Promise.resolve(false);
//   }
// }

// export const autoLauncher = Context.autoLauncher as AutoLauncher;

// ////////////////////////////////////////

// export class CheckUpdate {
//   constructor() { }
//   checkUpdate() { }
//   // 退出并安装
//   quitAndInstall() { }
//   download() { }
//   updaterEvent() { }
// }
// export let checkUpdate = Context.checkUpdate as CheckUpdate;
