import { zx } from "../es6.mjs";
const { fs, path } = zx;
import { appDataDir } from "../const.mjs";
import crypto from "crypto";

/**
 * 文件操作相关命令
 * 包含文件读写、目录操作、路径处理等功能
 */
export const fileCommands = {

  /**
   * 生成处理后的文件路径
   * 在原文件名中添加 ".processed" 后缀，用于标识已处理的文件
   * @param filePath 原始文件路径
   * @returns 处理后的文件路径（例："file.txt" -> "file.processed.txt"）
   */
  async processedFilePath({
    filePath
  }: {
    filePath: string;
  }): Promise<string> {
    // 解析文件路径的各个组成部分
    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath);
    const extName = path.extname(baseName);
    const fileName = path.basename(baseName, extName);

    // 在文件名和扩展名之间添加 ".processed" 标识
    const newFileName = `${fileName}.processed${extName}`;

    // 返回完整的处理后路径
    return path.join(dirName, newFileName);
  },

  /**
   * 获取应用数据存储目录路径
   * @returns 应用数据目录的绝对路径
   */
  async getAppDataDir(): Promise<string> {
    return appDataDir;
  },

  /**
   * 读取指定目录下的所有文件和子目录名称
   * @param path 相对于 root 的目录路径
   * @param root 根目录，默认为应用数据目录
   * @returns 目录中所有项目的名称数组
   */
  async readDir({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string[]> {
    // 拼接完整路径并确保目录存在
    p = path.join(root, p);
    await fs.ensureDir(p);
    return await fs.readdir(p);
  },

  /**
   * 删除指定的文件或目录
   * @param path 相对于 root 的文件或目录路径
   * @param root 根目录，默认为应用数据目录
   */
  async removeFile({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<void> {
    // 拼接完整路径并执行删除操作
    p = path.join(root, p);
    return await fs.remove(p);
  },

  /**
   * 写入文本内容到指定文件
   * 如果目标文件不存在则创建，存在则覆盖
   * @param path 相对于 root 的文件路径
   * @param text 要写入的文本内容
   * @param root 根目录，默认为应用数据目录
   */
  async writeFile({
    path: p,
    text,
    root = appDataDir
  }: {
    path: string;
    text: string;
    root?: string;
  }): Promise<void> {
    // 拼接完整路径并写入文件
    let localPath = path.join(root, p);
    await fs.writeFile(localPath, text);
  },

  /**
   * 读取指定文件的文本内容
   * @param path 相对于 root 的文件路径
   * @param root 根目录，默认为应用数据目录
   * @returns 文件的UTF-8编码文本内容
   * @throws 如果文件不存在或无法读取
   */
  async readFile({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string> {
    // 拼接完整路径并读取文件内容
    p = path.join(root, p);
    try {
      let r = await fs.readFile(p, "utf-8");
      return r;
    } catch (e) {
      throw e;
    }
  },

  /**
   * 读取并解析JSON文件
   * @param path 相对于 root 的JSON文件路径
   * @param root 根目录，默认为应用数据目录
   * @returns 解析后的JavaScript对象
   * @throws 如果文件不存在、无法读取或JSON格式错误
   */
  async readJSON({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<Record<string, unknown>> {
    // 拼接完整路径并读取JSON文件
    p = path.join(root, p);
    try {
      let r = await fs.readJSON(p);
      return r;
    } catch (e) {
      throw e;
    }
  },

  /**
   * 将JavaScript对象序列化为JSON并写入文件
   * @param path 相对于 root 的JSON文件路径
   * @param obj 要序列化的JavaScript对象
   * @param root 根目录，默认为应用数据目录
   */
  async writeJSON({
    path: p,
    obj,
    root = appDataDir
  }: {
    path: string;
    obj: Record<string, unknown>;
    root?: string;
  }): Promise<void> {
    // 拼接完整路径并写入格式化的JSON文件
    p = path.join(root, p);
    try {
      await fs.writeJSON(p, obj, {
        spaces: 2,      // 2个空格缩进以便阅读
        encoding: "utf-8",
      });
    } catch (e) {
      throw e;
    }
  },

  /**
   * 检查指定路径的文件或目录是否存在
   * @param path 相对于 root 的文件或目录路径
   * @param root 根目录，默认为应用数据目录
   * @returns 如果路径存在返回true，否则返回false
   */
  async exists({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<boolean> {
    // 拼接完整路径并检查存在性
    p = path.join(root, p);
    return await fs.existsSync(p);
  },

  /**
   * 拼接路径并确保父目录存在
   * @param path 相对路径
   * @param root 根目录，默认为应用数据目录
   * @returns 拼接后的完整路径
   */
  async pathJoin({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string> {
    // 如果指定了根目录，则拼接路径
    if (root) {
      p = path.join(root, p);
    }
    // 确保父目录存在（递归创建）
    await fs.ensureDir(path.dirname(p));
    return p;
  },

  /**
   * 保存临时文件
   * @param txt 文件内容
   * @param ext 文件扩展名
   * @returns 文件名
   */
  async saveTempFile({ txt, ext }: { txt: string; ext: string }): Promise<string> {
    // 使用SHA256生成文件名哈希
    const hash = crypto
      .createHash("sha256")
      .update(txt)
      .digest("hex");
    let filename = hash + "." + ext;

    let filePath = path.join(appDataDir, "temp", filename);
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, txt);
    return filename;
  }

};