import * as path from "path";
import * as fs from "fs";
import { CONSTANTS } from "./constants.mjs";

// 简单的配置数据管理类
export class Data<T> {
  private data: T;
  private loaded = false;

  constructor(
    private fileName: string,
    private defaultData: T,
    private options: { sync?: boolean } = { sync: true }
  ) {
    this.data = defaultData;
  }

  async init(): Promise<T> {
    if (!this.loaded) {
      try {
        const globalConfigPath = path.join(CONSTANTS.GLOBAL_PATH, CONSTANTS.HYPERCHAT_DIR);
        const filePath = path.join(globalConfigPath, this.fileName);

        if (fs.existsSync(filePath)) {
          const content = await fs.promises.readFile(filePath, "utf-8");
          this.data = JSON.parse(content);
        }
      } catch (error) {
        console.warn(`加载配置文件 ${this.fileName} 失败:`, error);
      }
      this.loaded = true;
    }
    return this.data;
  }

  async save(): Promise<void> {
    try {
      const globalConfigPath = path.join(CONSTANTS.GLOBAL_PATH, CONSTANTS.HYPERCHAT_DIR);
      if (!fs.existsSync(globalConfigPath)) {
        await fs.promises.mkdir(globalConfigPath, { recursive: true });
      }

      const filePath = path.join(globalConfigPath, this.fileName);
      await fs.promises.writeFile(filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      console.warn(`保存配置文件 ${this.fileName} 失败:`, error);
    }
  }

  get(): T {
    return this.data;
  }

  set(data: T): void {
    this.data = data;
    if (this.options.sync) {
      this.save();
    }
  }
}