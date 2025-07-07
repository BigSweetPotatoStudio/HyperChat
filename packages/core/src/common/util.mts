/**
 * 通用工具函数集合
 * 
 * 核心功能：
 * - 网络接口获取（获取本机 IP 地址）
 * - 文件名安全化处理（Windows 兼容性）
 * - 跨平台进程执行（带输出捕获）
 * - 异步延时工具
 * 
 * 依赖关系：
 * - os: Node.js 内置模块，用于系统信息获取
 * - cross-spawn: 跨平台进程执行库
 * 
 * 使用场景：
 * - HTTP 服务器需要获取本机 IP 进行服务绑定
 * - 文件操作时确保文件名合法性
 * - 执行外部命令并获取完整输出
 */

import os from "os";
import { Logger } from "../log.mjs";

/**
 * 获取本机所有可用的 IPv4 地址
 * 
 * 遍历所有网络接口，过滤出非内部的 IPv4 地址
 * 主要用于 HTTP 服务器绑定和网络配置显示
 * 
 * @returns 包含所有可用 IPv4 地址的字符串数组
 * 
 * @example
 * ```typescript
 * const ips = getLocalIP();
 * Logger.debug(ips); // ['192.168.1.100', '10.0.0.50']
 * ```
 */
export function getLocalIP(): string[] {
  const interfaces = os.networkInterfaces();
  let ips: string[] = [];
  for (const devName in interfaces) {
    const iface = interfaces[devName];

    if (iface) {
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (alias && alias.family === "IPv4" && !alias.internal) {
          // 返回第一个找到的非内部的IPv4地址
          ips.push(alias?.address || '');
          // return alias.address;
        }
      }
    }
  }
  return ips;
}

/**
 * Windows 系统保留文件名列表
 * 这些名称在 Windows 系统中不能用作文件名，需要特殊处理
 */
const WINDOWS_RESERVED_NAMES = [
  "CON",
  "PRN",
  "AUX",
  "NUL",
  "COM1",
  "COM2",
  "COM3",
  "COM4",
  "COM5",
  "COM6",
  "COM7",
  "COM8",
  "COM9",
  "LPT1",
  "LPT2",
  "LPT3",
  "LPT4",
  "LPT5",
  "LPT6",
  "LPT7",
  "LPT8",
  "LPT9",
];


/**
 * 安全化文件名函数（仅处理文件名，不包含扩展名）
 * 
 * 确保文件名在各种操作系统上都是合法的，主要处理：
 * - 移除或替换非法字符（< > : " | ? * \ /）
 * - 处理 Windows 保留名称（CON, PRN, AUX 等）
 * - 移除首尾空白字符和点号
 * - 限制文件名长度，防止过长
 * - 确保非空结果
 * 
 * @param fileName - 原始文件名（不应包含扩展名）
 * @param maxLength - 最大长度限制，默认 100 字符
 * @returns 安全的文件名
 * 
 * @example
 * ```typescript
 * // 基本字符替换
 * sanitizeFileName("My File<>:*?|");     // "My_File_"
 * sanitizeFileName("project/name\\test"); // "project_name_test"
 * 
 * // Windows 保留名称处理
 * sanitizeFileName("CON");               // "CON_"
 * sanitizeFileName("aux");               // "aux_"
 * sanitizeFileName("LPT1");              // "LPT1_"
 * 
 * // 空白和特殊字符处理
 * sanitizeFileName("  test  ");          // "test"
 * sanitizeFileName("file   name");       // "file_name"
 * sanitizeFileName("...file...");        // "file"
 * 
 * // 边界情况
 * sanitizeFileName("");                  // "unnamed"
 * sanitizeFileName("   ");               // "unnamed"
 * sanitizeFileName("...");               // "unnamed"
 * 
 * // 长度限制
 * sanitizeFileName("a".repeat(150), 50); // "a".repeat(50)
 * ```
 */
export function sanitizeFileName(fileName: string, maxLength: number = 50, defaultName: string = 'unnamed'): string {
  if (!fileName || typeof fileName !== 'string') {
    return defaultName;
  }

  // 移除首尾空白字符
  let sanitized = fileName.trim();

  // 如果为空，返回默认名称
  if (!sanitized) {
    return defaultName;
  }

  // 替换非法字符为下划线
  // Windows 和其他系统都不允许的字符: < > : " | ? * \ /
  sanitized = sanitized.replace(/[<>:"|?*\\/]/g, '_');

  // 替换其他可能有问题的字符
  sanitized = sanitized
    .replace(/[\x00-\x1f\x7f]/g, '_')     // 控制字符
    .replace(/[\r\n\t]/g, '_')           // 换行、回车、制表符
    .replace(/\s+/g, '_')                // 连续空白字符替换为单个下划线
    .replace(/_+/g, '_');                // 连续下划线合并为单个

  // 移除首尾的点号和下划线
  sanitized = sanitized.replace(/^[._]+|[._]+$/g, '');

  // 如果处理后为空，返回默认名称
  if (!sanitized) {
    return defaultName;
  }

  // 检查 Windows 保留名称（不区分大小写）
  const upperName = sanitized.toUpperCase();
  if (WINDOWS_RESERVED_NAMES.includes(upperName)) {
    sanitized = sanitized + '_';
  }

  // 限制长度
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    // 确保截断后不以点号或下划线结尾
    sanitized = sanitized.replace(/[._]+$/, '');
  }

  // 最终检查，确保非空
  if (!sanitized) {
    return defaultName;
  }

  return sanitized;
}

import spawn from "cross-spawn";

/**
 * 带输出捕获的跨平台进程执行函数
 * 
 * 基于 cross-spawn 库，提供跨平台的进程执行能力
 * 与普通 spawn 的区别：
 * - 自动捕获 stdout 和 stderr 输出
 * - 同时将输出实时转发到父进程
 * - 返回 Promise，便于异步处理
 * - 统一的错误处理机制
 * 
 * @param args - 与 cross-spawn 相同的参数列表 [command, args[], options]
 * @returns Promise，成功时返回 {stdout, stderr, code}，失败时抛出错误
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await spawnWithOutput('node', ['--version']);
 *   Logger.info('Node version:', result.stdout);
 * } catch (error) {
 *   Logger.error('Command failed:', error.message);
 * }
 * ```
 */
export const spawnWithOutput = (
  ...args: Parameters<typeof spawn>
): any => {
  return new Promise((resolve, reject) => {
    const proc = spawn(...args);
    let stdout = "";
    let stderr = "";

    proc.stdout?.pipe(process.stdout);
    proc.stderr?.pipe(process.stderr);

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
      // Logger.debug(data.toString()); // 实时输出
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
      // Logger.error(data.toString()); // 实时输出错误
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}\n${stderr}`));
      } else {
        resolve({
          stdout,
          stderr,
          code,
        });
      }
    });

    proc.on("error", (err) => {
      reject({ error: err, stderr, stdout });
    });
  });
};

/**
 * 异步延时工具函数
 * 
 * 提供基于 Promise 的延时功能，常用于：
 * - 控制请求频率，避免过于频繁的 API 调用
 * - 在重试逻辑中添加等待时间
 * - 模拟异步操作的延迟
 * - 在测试中控制执行时序
 * 
 * @param t - 延时时间，单位为毫秒
 * @returns Promise，在指定时间后 resolve
 * 
 * @example
 * ```typescript
 * // 等待 1 秒
 * await sleep(1000);
 * 
 * // 在重试逻辑中使用
 * for (let i = 0; i < 3; i++) {
 *   try {
 *     return await apiCall();
 *   } catch (error) {
 *     if (i < 2) await sleep(1000 * (i + 1)); // 递增延时
 *   }
 * }
 * ```
 */
export async function sleep(t: number) {
  return new Promise(resolve => setTimeout(resolve, t));
}