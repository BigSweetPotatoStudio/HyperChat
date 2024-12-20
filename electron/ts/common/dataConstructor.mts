import { fs, path } from "zx";
import { Command } from "../command.mjs";
import { app } from "electron";
import { appDataDir } from "../const.mjs";

export class Data<T> {
  private localStorage = null;
  async init() {
    this.localStorage = await this.inget();
    this.data = Object.assign(
      {},
      this.data,
      this.localStorage ? JSON.parse(this.localStorage) : {}
    );
    return this.data;
  }
  constructor(private KEY: string, private data: T) {}
  get(): T {
    return this.data;
  }

  async save() {
    this.insave();
  }
  private async inget() {
    if (fs.existsSync(path.join(appDataDir, this.KEY))) {
      return fs.readFile(path.join(appDataDir, this.KEY));
    } else {
      return "";
    }
  }
  private async insave() {
    return fs.writeFile(
      path.join(appDataDir, this.KEY),
      JSON.stringify(this.data, null, 4)
    );
  }
}
