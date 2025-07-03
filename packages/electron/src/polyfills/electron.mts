import AutoLaunch from "auto-launch";
import { app } from "electron";





///////////////////////////


export class AutoLauncher {
  autoLauncher: AutoLaunch = new AutoLaunch({
    name: app.getName(),
    path: app.getPath("exe"),
  });

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