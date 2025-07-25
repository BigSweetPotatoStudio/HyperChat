import * as path from "path";
import * as fs from "fs";
import dayjs from "dayjs";
import { v4 } from "uuid";
import * as yaml from "js-yaml";
import { Logger } from "../log.mjs";

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
/**
 * LRU 缓存项
 */
interface CacheItem<T> {
  value: T;
  lastAccessed: number;
}

export class DataList<T extends { key: string }> {
  static FileFormat = FileFormat;
  
  // LRU 缓存，不再全量加载
  private cache: Map<string, CacheItem<T>> = new Map();
  private maxCacheSize: number = 100; // 默认最多缓存100个项目
  
  // 轻量级元数据
  private countLoaded = false;
  private count = 0;
  private keys: string[] = [];
  private keysLoaded = false;
  private lastModified = 0;
  
  // 并发控制
  private countLoadPromise?: Promise<void>;
  private keysLoadPromise?: Promise<void>;
  private logger = Logger;

  constructor(
    private dirPath: string,
    private defaultFormat: FileFormat = FileFormat.JSON,
    private generateKey: (item: T) => string = () => `${dayjs().format("YYMMDD-HHmmss")}-${v4().slice(0, 8)}`,
    private getItemKey: (item: T) => string = (item) => item.key,
    maxCacheSize: number = 100
  ) { 
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * LRU 缓存管理：添加项目到缓存
   */
  private addToCache(key: string, value: T): void {
    // 如果已存在，更新访问时间
    if (this.cache.has(key)) {
      const item = this.cache.get(key)!;
      item.lastAccessed = Date.now();
      return;
    }

    // 如果缓存已满，移除最久未访问的项目
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastRecentlyUsed();
    }

    // 添加新项目
    this.cache.set(key, {
      value,
      lastAccessed: Date.now()
    });
  }

  /**
   * LRU 缓存管理：移除最久未访问的项目
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * LRU 缓存管理：从缓存获取项目
   */
  private getFromCache(key: string): T | null {
    const item = this.cache.get(key);
    if (item) {
      item.lastAccessed = Date.now();
      return item.value;
    }
    return null;
  }

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
   * 仅加载数量（懒加载第一阶段）
   */
  async loadCount(): Promise<void> {
    // 避免并发加载
    if (this.countLoadPromise) {
      return this.countLoadPromise;
    }

    this.countLoadPromise = this._doLoadCount();
    await this.countLoadPromise;
    this.countLoadPromise = undefined;
  }

  /**
   * 实际执行数量加载的方法
   */
  private async _doLoadCount(): Promise<void> {
    if (!fs.existsSync(this.dirPath)) {
      this.count = 0;
      this.countLoaded = true;
      this.lastModified = Date.now();
      return;
    }

    try {
      const dirStat = await fs.promises.stat(this.dirPath);
      const currentModified = dirStat.mtime.getTime();

      // 如果数量已加载且目录没有修改，跳过
      if (this.countLoaded && currentModified <= this.lastModified) {
        return;
      }

      const files = await fs.promises.readdir(this.dirPath);
      const validFiles = files.filter(file => {
        const format = this.detectFileFormat(file);
        return format !== null;
      });

      // 只统计有效文件数量，不读取内容
      let validCount = 0;
      for (const file of validFiles) {
        const filePath = path.join(this.dirPath, file);
        try {
          const fileStat = await fs.promises.stat(filePath);
          if (fileStat.isFile()) {
            validCount++;
          }
        } catch (error) {
          // 忽略无法访问的文件
        }
      }

      this.count = validCount;
      this.lastModified = currentModified;
      this.countLoaded = true;
    } catch (error) {
      this.logger.warn(`读取目录 ${this.dirPath} 失败:`, error);
      this.count = 0;
      this.countLoaded = true;
    }
  }


  /**
   * @deprecated 废弃方法，请使用 getPage() 或 getMany() 替代
   * 获取所有项目（废弃：性能问题）
   */
  async getAll(): Promise<T[]> {
    this.logger.warn('getAll() 方法已废弃，请使用 getPage() 或 getMany() 替代');
    await this.ensureKeysLoaded();
    return await this.getMany(this.keys);
  }

  /**
   * 分页获取项目
   */
  async getPage(offset: number = 0, limit: number = 10): Promise<{ items: T[]; total: number; hasMore: boolean }> {
    await this.ensureKeysLoaded();
    
    const startIndex = Math.max(0, offset);
    const endIndex = Math.min(startIndex + limit, this.keys.length);
    const pageKeys = this.keys.slice(startIndex, endIndex);
    
    const items = await this.getMany(pageKeys);
    
    return {
      items,
      total: this.count,
      hasMore: endIndex < this.keys.length
    };
  }

  /**
   * 批量获取指定键的项目
   */
  async getMany(keys: string[]): Promise<T[]> {
    const results: T[] = [];
    
    for (const key of keys) {
      const item = await this.get(key);
      if (item) {
        results.push(item);
      }
    }
    
    return results;
  }

  /**
   * 迭代器模式：逐个处理每个项目（避免内存压力）
   */
  async forEach(callback: (item: T, key: string, index: number) => Promise<void> | void): Promise<void> {
    await this.ensureKeysLoaded();
    
    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];
      const item = await this.get(key);
      if (item) {
        await callback(item, key, i);
      }
    }
  }

  /**
   * 异步生成器：流式处理项目
   */
  async* stream(): AsyncGenerator<T, void, unknown> {
    await this.ensureKeysLoaded();
    
    for (const key of this.keys) {
      const item = await this.get(key);
      if (item) {
        yield item;
      }
    }
  }

  /**
   * 获取轻量级统计信息（避免加载完整内容）
   */
  async getStats(): Promise<{ count: number; lastModified?: number }> {
    await this.ensureKeysLoaded();
    return {
      count: this.count,
      lastModified: this.lastModified > 0 ? this.lastModified : undefined
    };
  }

  /**
   * 加载键列表（不加载内容）
   */
  async loadKeys(): Promise<void> {
    // 避免并发加载
    if (this.keysLoadPromise) {
      return this.keysLoadPromise;
    }

    this.keysLoadPromise = this._doLoadKeys();
    await this.keysLoadPromise;
    this.keysLoadPromise = undefined;
  }

  /**
   * 实际执行键列表加载的方法
   */
  private async _doLoadKeys(): Promise<void> {
    if (!fs.existsSync(this.dirPath)) {
      this.keys = [];
      this.count = 0;
      this.keysLoaded = true;
      this.countLoaded = true;
      this.lastModified = Date.now();
      return;
    }

    try {
      const dirStat = await fs.promises.stat(this.dirPath);
      const currentModified = dirStat.mtime.getTime();

      // 如果键列表已加载且目录没有修改，跳过
      if (this.keysLoaded && currentModified <= this.lastModified) {
        return;
      }

      const files = await fs.promises.readdir(this.dirPath);
      const keys: string[] = [];
      
      for (const file of files) {
        const format = this.detectFileFormat(file);
        if (format !== null) {
          const filePath = path.join(this.dirPath, file);
          try {
            const fileStat = await fs.promises.stat(filePath);
            if (fileStat.isFile()) {
              const key = path.basename(file, path.extname(file));
              keys.push(key);
            }
          } catch (error) {
            // 忽略无法访问的文件
          }
        }
      }

      this.keys = keys.sort();
      this.count = keys.length;
      this.lastModified = currentModified;
      this.keysLoaded = true;
      this.countLoaded = true;
    } catch (error) {
      this.logger.warn(`读取目录 ${this.dirPath} 失败:`, error);
      this.keys = [];
      this.count = 0;
      this.keysLoaded = true;
      this.countLoaded = true;
    }
  }

  /**
   * 确保已加载键列表
   */
  private async ensureKeysLoaded(): Promise<void> {
    if (!this.keysLoaded) {
      await this.loadKeys();
      return;
    }

    // 检查目录是否有更新
    if (fs.existsSync(this.dirPath)) {
      try {
        const dirStat = await fs.promises.stat(this.dirPath);
        if (dirStat.mtime.getTime() > this.lastModified) {
          await this.loadKeys();
        }
      } catch (error) {
        // 如果无法获取状态，重新加载
        await this.loadKeys();
      }
    }
  }

  /**
   * 获取文件键列表（不加载内容）
   */
  async getKeys(): Promise<string[]> {
    await this.ensureKeysLoaded();
    return [...this.keys];
  }

  /**
   * 获取单个项目（使用 LRU 缓存）
   */
  async get(key: string): Promise<T | null> {
    // 先检查缓存
    const cached = this.getFromCache(key);
    if (cached) {
      return cached;
    }

    // 检查键是否存在
    await this.ensureKeysLoaded();
    if (!this.keys.includes(key)) {
      return null;
    }

    // 从文件加载
    const item = await this.loadSingleItem(key);
    if (item) {
      this.addToCache(key, item);
    }
    
    return item;
  }

  /**
   * 从文件加载单个项目
   */
  private async loadSingleItem(key: string): Promise<T | null> {
    const formats = [this.defaultFormat, ...Object.values(FileFormat).filter(f => f !== this.defaultFormat)];
    
    for (const format of formats) {
      const filename = this.getFileName(key, format);
      const filePath = path.join(this.dirPath, filename);
      
      try {
        if (fs.existsSync(filePath)) {
          const content = await fs.promises.readFile(filePath, "utf-8");
          let item = this.parseFileContent(content, format);
          
          // 确保对象的 key 与文件名保持一致
          item.key = key;
          
          return item;
        }
      } catch (error) {
        this.logger.warn(`加载文件 ${filename} 失败:`, error);
      }
    }
    
    return null;
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

      // 更新缓存
      this.addToCache(key, item);

      // 重置状态，强制重新加载
      this.keysLoaded = false;
      this.countLoaded = false;

      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`保存文件 ${this.getFileName(this.getItemKey(item))} 失败:`, errorMsg);
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
        this.logger.warn(`删除文件 ${filename} 失败: ${errorMsg}`);
      }
    }

    if (deleted) {
      // 从缓存中删除
      this.cache.delete(key);

      // 重置状态，强制重新加载
      this.keysLoaded = false;
      this.countLoaded = false;
    }

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
      this.logger.warn(`读取目录失败:`, error);
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
        this.logger.warn(`保存文件 ${filename} 失败:`, error);
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
          this.logger.warn(`删除旧文件 ${existingFile} 失败:`, error);
        }
      });

    await Promise.all(deletePromises);

    // 清空缓存，重置状态
    this.cache.clear();
    this.keysLoaded = false;
    this.countLoaded = false;

    return success;
  }

  /**
   * 检查项目是否存在
   */
  async has(key: string): Promise<boolean> {
    await this.ensureKeysLoaded();
    return this.keys.includes(key);
  }

  /**
   * 获取项目数量（使用轻量级加载）
   */
  async size(): Promise<number> {
    await this.ensureKeysLoaded();
    return this.count;
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

      // 清空缓存，重置状态
      this.cache.clear();
      this.keysLoaded = false;
      this.countLoaded = false;
      
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`清空目录失败: ${errorMsg}`);
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
    await this.ensureKeysLoaded();

    if (this.keys.length === 0) {
      this.defaultFormat = targetFormat;
      return true;
    }

    // 获取所有现有数据
    const allItems = await this.getMany(this.keys);
    if (allItems.length === 0) {
      this.defaultFormat = targetFormat;
      return true;
    }

    // 读取所有现有文件
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
      this.logger.warn('读取现有文件失败:', error);
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
            this.logger.warn(`删除旧文件 ${file} 失败:`, error);
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