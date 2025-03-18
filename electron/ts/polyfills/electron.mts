import ELogger from "electron-log";
import {
  Context,
  LoggerPolyfill,
  AutoLauncher as IAutoLaunch,
  CheckUpdate as ICheckUpdate,
  Clone,
} from "./polyfills.mjs";
import { app } from "electron";

class LoggerC extends LoggerPolyfill {
  info(...args: any[]) {
    ELogger.info(...args);
  }
  warn(...args: any[]) {
    ELogger.warn(...args);
  }
  error(...args: any[]) {
    ELogger.error(...args);
  }
  path = ELogger.transports.file.getFile().path;
}

Clone(Context.Logger, new LoggerC());


/////////////////////////////
export const userDataPath = app.getPath("userData");

Context.CONST.userDataPath = userDataPath;
Context.CONST.getVersion = app.getVersion();

///////////////////////////

// src/AutoLauncher.ts
import AutoLaunch from "auto-launch";

export class AutoLauncher extends IAutoLaunch {
  declare autoLauncher: AutoLaunch;

  constructor() {
    super();
    // let path = app.getPath("exe");
    // console.log("path: ", path);
    this.autoLauncher = new AutoLaunch({
      name: app.getName(),
      path: app.getPath("exe"),
    });
  }
  async enable() {
    if (!(await this.autoLauncher.isEnabled())) {
      return this.autoLauncher.enable();
    }
  }

  async disable() {
    if (await this.autoLauncher.isEnabled()) {
      await this.autoLauncher.disable();
    }
  }

  async isEnabled() {
    return this.autoLauncher.isEnabled();
  }
}
Clone(Context.autoLauncher, new AutoLauncher());

///////////////////////////


