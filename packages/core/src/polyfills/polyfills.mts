


import { Logger } from "./log.mjs";
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


import { CONST } from "../const.mjs";
export const appDataDir = CONST.appDataDir;


// export const CONST = {
//   getVersion: p.version,
//   appDataDir: appDataDir,
//   dirName: dirName,
// };

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
