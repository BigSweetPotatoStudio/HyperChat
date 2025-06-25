import { Logger, appDataDir } from "src/polyfills/index.mjs";
import { zx } from "../es6.mjs";
const { fs, path } = zx;
export class Data<T> {
  private localStorage: string | null = null;
  async init(_isCatch = true) {
    let localData = {};
    try {
      this.localStorage = await this.inget();
      if (this.localStorage) {
        localData = JSON.parse(this.localStorage);
      }
    } catch (e) {
      Logger.error(e);
      localData = {};
    }
    this.data = Object.assign({}, this.data, localData);
    return this.data;
  }
  initSync(_isCatch = true) {
    let localData = {};
    try {
      this.localStorage = this.ingetSync();
      if (this.localStorage) {
        localData = JSON.parse(this.localStorage);
      }
    } catch (e) {
      Logger.error(e);
      localData = {};
    }
    this.data = Object.assign({}, this.data, localData);
    return this.data;
  }
  constructor(private KEY: string, private data: T) {}
  get(): T {
    return this.data;
  }

  async save() {
    this.insave();
  }
  private async inget(): Promise<string> {
    if (await fs.exists(path.join(appDataDir, this.KEY))) {
      return await fs.readFile(path.join(appDataDir, this.KEY), 'utf-8');
    } else {
      return "";
    }
  }
  private ingetSync(): string {
    if (fs.existsSync(path.join(appDataDir, this.KEY))) {
      return fs.readFileSync(path.join(appDataDir, this.KEY), 'utf-8');
    } else {
      return "";
    }
  }
  private async insave() {
    return fs.writeFile(
      path.join(appDataDir, this.KEY),
      JSON.stringify(this.data, null, 2)
    );
  }
}
