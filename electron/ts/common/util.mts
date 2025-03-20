import os from "os";

export function getLocalIP(): string[] {
  const interfaces = os.networkInterfaces();
  let ips = [];
  for (const devName in interfaces) {
    const iface = interfaces[devName];

    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === "IPv4" && !alias.internal) {
        // 返回第一个找到的非内部的IPv4地址
        ips.push(alias.address);
        // return alias.address;
      }
    }
  }
  return ips;
}

// // windows 文件名格式合法
// export function sanitizeFileName(fileName: string): string {
//   return fileName.trim().replace(/[<>:"/\\|?*\n\r;]+/g, "_");
// }

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

export function sanitizeFileName(fileName: string): string {
  // 去除首尾空格
  let sanitized = fileName.trim();

  sanitized = sanitized.replace(/[\n\r]+/g, " ");

  // 替换非法字符
  sanitized = sanitized.replace(/[<>:"\/\\|?*\x00-\x1F]+/g, "_");

  // 处理以点结尾的情况
  sanitized = sanitized.replace(/\.+$/, "");

  // 检查是否是保留名称
  const nameWithoutExt = sanitized.split(".")[0].toUpperCase();
  if (WINDOWS_RESERVED_NAMES.includes(nameWithoutExt)) {
    sanitized = "_" + sanitized;
  }

  // 限制长度
  if (sanitized.length > 128) {
    sanitized = sanitized.substring(0, 128);
  }

  // 确保文件名不为空
  if (!sanitized) {
    sanitized = "_";
  }

  return sanitized;
}

import spawn from "cross-spawn";
export const spawnWithOutput = (
  ...args: Parameters<typeof spawn>
): any => {
  return new Promise((resolve, reject) => {
    const proc = spawn(...args);
    let stdout = "";
    let stderr = "";

    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      // console.log(data.toString()); // 实时输出
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      // console.error(data.toString()); // 实时输出错误
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
