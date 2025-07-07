import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import * as yaml from "js-yaml";

/**
 * 文件格式枚举
 */
export enum FileFormat {
  JSON = 'json',
  YAML = 'yaml'
}

/**
 * 文件夹数据列表管理类
 * 专门处理一个文件夹中全部是同一种类型文件的情况
 * 支持 JSON 和 YAML 格式
 */
export class DataList<T extends { key: string }> {
  static FileFormat = FileFormat;
  private items: Map<string, T> = new Map();
  private loaded = false;
  private lastModified = 0;
  private loadPromise?: Promise<void>;

  constructor(
    private dirPath: string,
    private defaultFormat: FileFormat = FileFormat.JSON,
    private generateKey: (item: T) => string = () => `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`,
    private getItemKey: (item: T) => string = (item) => item.key,
  ) { }

  /**
   * 获取文件名（基于 key 和格式）
   */
  private getFileName(key: string, format: FileFormat = this.defaultFormat): string {
    return `${key}.${format}`;
  }

  /**
   * 检测文件格式
   */
  private detectFileFormat(filename: string): FileFormat | null {
    if (filename.endsWith('.json')) {
      return FileFormat.JSON;
    } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      return FileFormat.YAML;
    }
    return null;
  }

  /**
   * 解析文件内容
   */
  private parseFileContent(content: string, format: FileFormat): T {
    switch (format) {
      case FileFormat.JSON:
        return JSON.parse(content) as T;
      case FileFormat.YAML:
        return yaml.load(content) as T;
      default:
        throw new Error(`不支持的文件格式: ${format}`);
    }
  }

  /**
   * 序列化内容
   */
  private serializeContent(item: T, format: FileFormat): string {
    switch (format) {
      case FileFormat.JSON:
        return JSON.stringify(item, null, 2);
      case FileFormat.YAML:
        return yaml.dump(item, { indent: 2 });
      default:
        throw new Error(`不支持的文件格式: ${format}`);
    }
  }

  /**
   * 加载所有文件
   */
  async load(): Promise<void> {
    // 避免并发加载
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._doLoad();
    await this.loadPromise;
    this.loadPromise = undefined;
  }

  /**
   * 实际执行加载的方法
   */
  private async _doLoad(): Promise<void> {
    this.items.clear();

    if (!fs.existsSync(this.dirPath)) {
      this.loaded = true;
      this.lastModified = Date.now();
      return;
    }

    try {
      const dirStat = await fs.promises.stat(this.dirPath);
      const currentModified = dirStat.mtime.getTime();

      // 如果目录没有修改且已加载，跳过
      if (this.loaded && currentModified <= this.lastModified) {
        return;
      }

      const files = await fs.promises.readdir(this.dirPath);
      const loadPromises = files
        .filter(file => {
          // 支持 JSON 和 YAML 文件
          const format = this.detectFileFormat(file);
          return format !== null;
        })
        .map(async (file) => {
          const filePath = path.join(this.dirPath, file);
          try {
            // 检查文件是否为普通文件（不是目录、符号链接等）
            const fileStat = await fs.promises.stat(filePath);
            if (!fileStat.isFile()) {
              console.warn(`跳过非文件项: ${file}`);
              return null;
            }

            const content = await fs.promises.readFile(filePath, "utf-8");
            const format = this.detectFileFormat(file);

            if (!format) {
              console.warn(`不支持的文件格式: ${file}`);
              return null;
            }

            let item: T;
            try {
              item = this.parseFileContent(content, format);
            } catch (parseError) {
              console.warn(`${file} 解析失败 (${format}):`, parseError);
              return null;
            }

            // 验证解析结果
            if (!item || typeof item !== 'object') {
              console.warn(`文件 ${file} 解析结果不是对象`);
              return null;
            }

            // 从文件名获取 key（去掉扩展名）
            const fileKey = path.basename(file, path.extname(file));

            // 确保对象的 key 与文件名保持一致
            if (item.key && item.key !== fileKey) {
              console.warn(`文件 ${file} 中的 key (${item.key}) 与文件名不匹配，使用文件名作为 key: ${fileKey}`);
            }
            item.key = fileKey;

            return { key: fileKey, item };
          } catch (error) {
            // 提供更详细的文件处理错误信息
            if (error instanceof Error) {
              if (error.message.includes('ENOENT')) {
                console.warn(`文件不存在: ${file}`);
              } else if (error.message.includes('EACCES')) {
                console.warn(`无权限访问文件: ${file}`);
              } else {
                console.warn(`加载文件 ${file} 失败: ${error.message}`);
              }
            } else {
              console.warn(`加载文件 ${file} 失败:`, error);
            }
            return null;
          }
        });

      const results = await Promise.all(loadPromises);

      results.filter(x => x != null).forEach(result => {
        if (result) {
          this.items.set(result.key, result.item);
        }
      });

      this.lastModified = currentModified;
    } catch (error) {
      console.warn(`读取目录 ${this.dirPath} 失败:`, error);
    }

    this.loaded = true;
  }

  /**
   * 确保已加载数据
   */
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      await this.load();
      return;
    }

    // 检查目录是否有更新
    if (fs.existsSync(this.dirPath)) {
      try {
        const dirStat = await fs.promises.stat(this.dirPath);
        if (dirStat.mtime.getTime() > this.lastModified) {
          await this.load();
        }
      } catch (error) {
        // 如果无法获取状态，重新加载
        await this.load();
      }
    }
  }

  /**
   * 获取所有项目
   */
  async getAll(): Promise<T[]> {
    await this.ensureLoaded();
    return Array.from(this.items.values());
  }

  /**
   * 获取单个项目
   */
  async get(key: string): Promise<T | null> {
    await this.ensureLoaded();
    return this.items.get(key) || null;
  }

  /**
   * 添加或更新单个项目
   */
  async set(item: T): Promise<boolean> {
    try {
      // 确保目录存在
      if (!fs.existsSync(this.dirPath)) {
        await fs.promises.mkdir(this.dirPath, { recursive: true });
      }

      // 如果没有 key，生成新的 key
      if (!item.key) {
        item.key = this.generateKey(item);
      }

      const key = this.getItemKey(item);

      const filename = this.getFileName(key, this.defaultFormat);
      const filePath = path.join(this.dirPath, filename);
      const content = this.serializeContent(item, this.defaultFormat);

      await fs.promises.writeFile(filePath, content, "utf-8");

      // 更新内存中的数据
      await this.ensureLoaded();
      this.items.set(key, item);

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`保存文件 ${this.getFileName(this.getItemKey(item))} 失败:`, errorMsg);
      return false;
    }
  }

  /**
   * 删除单个项目
   */
  async delete(key: string): Promise<boolean> {
    // 尝试删除所有可能的格式文件
    const formats = [FileFormat.JSON, FileFormat.YAML];
    let deleted = false;

    for (const format of formats) {
      const filename = this.getFileName(key, format);
      const filePath = path.join(this.dirPath, filename);

      try {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          deleted = true;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`删除文件 ${filename} 失败: ${errorMsg}`);
      }
    }

    // 从内存中删除
    await this.ensureLoaded();
    this.items.delete(key);

    return deleted;
  }

  /**
   * 保存整个列表（批量保存）
   */
  async saveAll(items: T[]): Promise<boolean> {
    // 确保目录存在
    if (!fs.existsSync(this.dirPath)) {
      await fs.promises.mkdir(this.dirPath, { recursive: true });
    }

    // 获取现有文件
    const existingFiles = new Set<string>();
    try {
      if (fs.existsSync(this.dirPath)) {
        const files = await fs.promises.readdir(this.dirPath);
        for (const file of files) {
          const format = this.detectFileFormat(file);
          if (format && !file.startsWith('.')) {
            existingFiles.add(file);
          }
        }
      }
    } catch (error) {
      console.warn(`读取目录失败:`, error);
    }

    // 为没有 key 的项目生成 key
    const itemsWithKeys = items.map(item => {
      if (!item.key) {
        item.key = this.generateKey(item);
      }
      return item;
    });

    // 并行保存所有文件
    const currentFiles = new Set<string>();
    const savePromises = itemsWithKeys.map(async (item) => {
      const key = this.getItemKey(item);
      const filename = this.getFileName(key, this.defaultFormat);
      currentFiles.add(filename);

      const filePath = path.join(this.dirPath, filename);
      try {
        const content = this.serializeContent(item, this.defaultFormat);
        await fs.promises.writeFile(filePath, content, "utf-8");
        return { success: true, filename };
      } catch (error) {
        console.warn(`保存文件 ${filename} 失败:`, error);
        return { success: false, filename, error };
      }
    });

    const saveResults = await Promise.all(savePromises);
    const success = saveResults.every(result => result.success);

    // 并行删除不再存在的文件
    const deletePromises = Array.from(existingFiles)
      .filter(file => !currentFiles.has(file))
      .map(async (existingFile) => {
        const filePath = path.join(this.dirPath, existingFile);
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.warn(`删除旧文件 ${existingFile} 失败:`, error);
        }
      });

    await Promise.all(deletePromises);

    // 重新加载数据到内存
    await this.load();

    return success;
  }

  /**
   * 检查项目是否存在
   */
  async has(key: string): Promise<boolean> {
    await this.ensureLoaded();
    return this.items.has(key);
  }

  /**
   * 获取项目数量
   */
  async size(): Promise<number> {
    await this.ensureLoaded();
    return this.items.size;
  }

  /**
   * 清空所有项目
   */
  async clear(): Promise<boolean> {
    try {
      if (fs.existsSync(this.dirPath)) {
        const files = await fs.promises.readdir(this.dirPath);
        const deletePromises = files
          .filter(file => {
            const format = this.detectFileFormat(file);
            return format && !file.startsWith('.');
          })
          .map(file => fs.promises.unlink(path.join(this.dirPath, file)));

        await Promise.all(deletePromises);
      }

      this.items.clear();
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`清空目录失败: ${errorMsg}`);
      return false;
    }
  }

  /**
   * 设置默认文件格式
   */
  setDefaultFormat(format: FileFormat): void {
    this.defaultFormat = format;
  }

  /**
   * 获取当前默认文件格式
   */
  getDefaultFormat(): FileFormat {
    return this.defaultFormat;
  }

  /**
   * 将所有文件迁移到指定格式
   */
  async migrateToFormat(targetFormat: FileFormat): Promise<boolean> {
    await this.ensureLoaded();

    const allItems = Array.from(this.items.values());
    if (allItems.length === 0) {
      this.defaultFormat = targetFormat;
      return true;
    }

    // 读取所有现有文件并删除
    const existingFiles: string[] = [];
    try {
      if (fs.existsSync(this.dirPath)) {
        const files = await fs.promises.readdir(this.dirPath);
        for (const file of files) {
          const format = this.detectFileFormat(file);
          if (format && !file.startsWith('.')) {
            existingFiles.push(file);
          }
        }
      }
    } catch (error) {
      console.warn('读取现有文件失败:', error);
      return false;
    }

    // 更新默认格式
    this.defaultFormat = targetFormat;

    // 重新保存所有项目到新格式
    const success = await this.saveAll(allItems);

    if (success) {
      // 删除旧格式的文件
      const deletePromises = existingFiles
        .filter(file => !this.detectFileFormat(file) || this.detectFileFormat(file) !== targetFormat)
        .map(async (file) => {
          const filePath = path.join(this.dirPath, file);
          try {
            await fs.promises.unlink(filePath);
          } catch (error) {
            console.warn(`删除旧文件 ${file} 失败:`, error);
          }
        });

      await Promise.all(deletePromises);
    }

    return success;
  }

  /**
   * 检查是否支持指定格式
   */
  static isSupportedFormat(format: string): format is FileFormat {
    return Object.values(FileFormat).includes(format as FileFormat);
  }
}