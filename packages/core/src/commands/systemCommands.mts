import { zx } from "../es6.mjs";
const { fs, os, path } = zx;
import { getLocalIP } from "../common/util.mjs";
import { isPortUse } from "../common/checkport.mjs";
import { EVENT } from "../common/event.mjs";
import type { Task } from "@dadigua/hyperchat-shared";
import * as cron from "node-cron";
import * as vm from "node:vm";
import { createRequire } from "module";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const { createRequire: createRequireFromModule } = await import(
  /* webpackIgnore: true */ "module"
);

/**
 * 系统工具相关命令
 * 包含网络、端口、代码执行等系统级功能
 */
export const systemCommands = {

  /**
   * 获取本地IP地址
   * @returns IP地址列表
   */
  async getLocalIP(): Promise<string[]> {
    return getLocalIP();
  },

  /**
   * 检查端口是否被占用
   * @param port 端口号
   * @returns 是否被占用
   */
  async isPortUse({
    port
  }: {
    port: number;
  }): Promise<boolean> {
    return isPortUse(port);
  },

  /**
   * 调用Agent响应
   * @param uid 唯一标识符
   * @param data 响应数据
   * @param error 错误信息
   */
  async call_agent_res({
    uid,
    data,
    error
  }: {
    uid: string;
    data: unknown;
    error: unknown;
  }) {
    EVENT.fire("call_agent_res_" + uid, { uid, data, error });
  },

  /**
   * 检查任务配置
   * @param task 任务配置
   */
  async checkTask({
    task
  }: {
    task?: Task;
  }) {
    if (task && cron.validate(task.cron)) {
    } else {
      throw new Error("cron Error");
    }
  },

  /**
   * 运行代码
   * @param code 要执行的代码
   * @returns 执行结果
   */
  async runCode({ code }: { code: string }) {
    // 1. 构造一个完整的 require（ESM 下使用 import.meta.url）
    const nativeRequire = createRequire(__filename);

    const context = {
      console,
      require: nativeRequire,
      module: { exports: {} },
      exports: {},
      process,
      Buffer,
      fetch,
      resultContainer: { value: undefined, error: undefined, done: false },
      setTimeout,
      setInterval,
    };
    vm.createContext(context); // 将普通对象转换为 vm.Context 对象
    // 在 VM 中使用动态导入
    vm.runInContext(`
  (async () => {
       try {
        ${code}
        resultContainer.value = await get();
        resultContainer.done = true;
      } catch (err) {
        resultContainer.error = err.message;
        resultContainer.done = true;
      }
  })();
`, context,
      { filename: __filename, });
    // 轮询等待结果
    while (!context.resultContainer.done) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 检查是否有错误
    if (context.resultContainer.error) {
      throw new Error(context.resultContainer.error);
    }

    return context.resultContainer.value;
  },

  /**
   * 列出服务器上的目录内容
   */
  async listServerDirectory({
    path: dirPath = "~"
  }: {
    path?: string;
  }): Promise<unknown[]> {
    const { fs, os, path } = zx;

    try {
      // 处理特殊路径
      let resolvedPath = dirPath;
      if (dirPath === "~") {
        resolvedPath = os.homedir();
      } else if (dirPath.startsWith("~/")) {
        resolvedPath = path.join(os.homedir(), dirPath.slice(2));
      }

      // 安全检查：确保路径是绝对路径
      resolvedPath = path.resolve(resolvedPath);

      // 检查路径是否存在且是目录
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`路径不存在: ${resolvedPath}`);
      }

      const stats = await fs.promises.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error(`路径不是目录: ${resolvedPath}`);
      }

      // 读取目录内容
      const entries = await fs.promises.readdir(resolvedPath, { withFileTypes: true });

      interface DirectoryItem {
        name: string;
        path: string;
        type: "directory" | "file";
        size?: number;
        modified: number;
      }

      const result: DirectoryItem[] = [];
      for (const entry of entries) {
        // 跳过隐藏文件（以 . 开头的文件）
        if (entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(resolvedPath, entry.name);
        const itemStats = await fs.promises.stat(fullPath).catch(() => null);

        if (itemStats) {
          result.push({
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? "directory" : "file",
            size: entry.isFile() ? itemStats.size : undefined,
            modified: itemStats.mtime.getTime(),
          });
        }
      }

      // 排序：目录在前，文件在后，然后按名称排序
      result.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return result;
    } catch (error: unknown) {
      console.error("Failed to list directory:", error);
      throw new Error(`无法读取目录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  /**
   * 获取服务器上的当前工作目录
   */
  async getServerCurrentDirectory(): Promise<string> {
    return process.cwd();
  },

  /**
   * 获取服务器路径的父目录
   */
  async getServerParentDirectory({
    path: targetPath
  }: {
    path: string;
  }): Promise<string> {
    const { fs, os, path } = zx;

    try {
      // 处理特殊路径
      let resolvedPath = targetPath;
      if (targetPath === "~") {
        resolvedPath = os.homedir();
      } else if (targetPath.startsWith("~/")) {
        resolvedPath = path.join(os.homedir(), targetPath.slice(2));
      }

      // 解析为绝对路径
      resolvedPath = path.resolve(resolvedPath);

      // 获取父目录
      const parentPath = path.dirname(resolvedPath);

      // 如果已经是根目录，返回自身
      if (parentPath === resolvedPath) {
        return resolvedPath;
      }

      return parentPath;
    } catch (error: unknown) {
      console.error("Failed to get parent directory:", error);
      throw new Error(`无法获取父目录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  /**
   * 检查服务器路径是否存在
   */
  async checkServerPath({
    path: targetPath
  }: {
    path: string;
  }): Promise<{ exists: boolean; isDirectory: boolean; readable: boolean }> {
    const { fs, path } = zx;

    try {
      const resolvedPath = path.resolve(targetPath);
      const exists = fs.existsSync(resolvedPath);

      if (!exists) {
        return { exists: false, isDirectory: false, readable: false };
      }

      const stats = await fs.promises.stat(resolvedPath);
      const isDirectory = stats.isDirectory();

      // 检查是否可读
      let readable = true;
      try {
        await fs.promises.access(resolvedPath, fs.constants.R_OK);
      } catch {
        readable = false;
      }

      return { exists, isDirectory, readable };
    } catch (error) {
      return { exists: false, isDirectory: false, readable: false };
    }
  }

};