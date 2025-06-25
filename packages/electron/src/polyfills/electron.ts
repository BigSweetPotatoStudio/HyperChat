import ELogger from "electron-log";
import AutoLaunch from "auto-launch";
import {
  Context,
  AutoLauncher as IAutoLaunch,
} from "@hyperchat/core/polyfills/polyfills.mjs";

import { app } from "electron";



/////////////////////////////
export const userDataPath = app.getPath("userData");

Context.CONST.userDataPath = userDataPath;
Context.CONST.getVersion = app.getVersion();

///////////////////////////


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
  override async enable() {
    if (!(await this.autoLauncher.isEnabled())) {
      return this.autoLauncher.enable();
    }
  }

  override async disable() {
    if (await this.autoLauncher.isEnabled()) {
      await this.autoLauncher.disable();
    }
  }

  override async isEnabled() {
    return this.autoLauncher.isEnabled();
  }
}


///////////////////////////