// src/AutoLauncher.ts
import { app } from "electron";
import AutoLaunch from "auto-launch";

export class AutoLauncher {
  private autoLauncher: AutoLaunch;

  constructor() {
    let path = app.getPath("exe");
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

export const autoLauncher = new AutoLauncher();
