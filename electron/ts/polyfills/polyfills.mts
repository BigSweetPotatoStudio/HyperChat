export class LoggerPolyfill {
  info(...args) {}
  warn(...args) {}
  error(...args) {}
  path = "";
}

export const Context = {
  Logger: {} as any,
  CONST: {} as {
    userDataPath: string;
    getVersion: string;
    appDataDir: string;
    dirName: string;
  },
  autoLauncher: {} as any,
  checkUpdate: {} as any,
};

export function Clone(a, b) {
  Object.assign(a, b);
  Object.setPrototypeOf(a, b);
}
export const Logger = Context.Logger as LoggerPolyfill;

import path from "path";
import os from "os";

import { zx } from "ts/es6.mjs";
const { fs } = zx;

export const dirName = "HyperChat";
export const appDataDir = path.join(os.homedir(), "Documents", dirName);
fs.ensureDirSync(appDataDir);

Context.CONST = {
  userDataPath: "",
  getVersion: "",
  appDataDir: appDataDir,
  dirName: dirName,
};

export const CONST = Context.CONST as typeof Context.CONST;

export class AutoLauncher {
  public autoLauncher;

  constructor() {}
  async enable() {
    throw new Error("Method not implemented.");
  }

  async disable() {
    throw new Error("Method not implemented.");
  }

  async isEnabled() {
    return Promise.resolve(false);
  }
}

export const autoLauncher = Context.autoLauncher as AutoLauncher;

////////////////////////////////////////

export class CheckUpdate {
  constructor() {}
  checkUpdate() {}
  // 退出并安装
  quitAndInstall() {}
  download() {}
  updaterEvent() {}
}
export let checkUpdate = Context.checkUpdate as CheckUpdate;
