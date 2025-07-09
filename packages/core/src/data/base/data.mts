import type { DataOptions } from "../../shared/types.mjs";

// 全局数据实例列表，所有 Data 实例会自动加入此数组
export const DataList: Data<unknown>[] = [];

/**
 * 通用数据管理类，支持异步/同步初始化与保存，可自定义格式化方法
 * @template T 数据类型
 */
export class Data<T> {
  private inited = false;
  // 尽量使用异步初始化数据
  async init(): Promise<T> {
    this.inited = true;
    return this._init();
  }
  // 尽量使用异步保存数据
  async save() {
    return this._save();
  }
  async _init(): Promise<T> { // 内部使用
    throw new Error("Method not implemented.");
  }
  async _save() { // 内部使用
    throw new Error("Method not implemented.");
  }

  /**
   * 构造函数
   * @param KEY 数据唯一标识（文件名）
   * @param data 初始数据
   * @param options 配置项
   */
  constructor(
    public KEY: string,
    private data: T,
    public options: DataOptions = {
      sync: true,
    }
  ) {
    // 默认 sync 为 true
    this.options.sync = this.options.sync != null ? this.options.sync : true;
    // 初始化格式化函数
    this.options.formatInit = this.options.formatInit || ((x) => x);
    this.options.formatSave = this.options.formatSave || ((x) => x);
    // 自动注册到 DataList
    DataList.push(this);
  }
  // 获取数据（需先加载init）
  get(): T {
    return this.data;
  }
  // 设置数据 (需要保存save)
  set(data: T) {
    this.data = data;
  }

  /**
   * 动态重写 init/save 方法
   */
  public override({ init, save }: { init: () => Promise<T>; save: () => Promise<void>; }) {
    (this._init = init);
    (this._save = save);
  }
}