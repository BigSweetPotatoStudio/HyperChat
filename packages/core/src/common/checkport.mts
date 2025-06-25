/**
 * 端口占用检测工具
 * 
 * 核心功能：
 * - 检测指定端口是否已被其他进程占用
 * - 基于 TCP 连接尝试进行检测
 * - 提供异步的端口可用性检查
 * 
 * 依赖关系：
 * - net: Node.js 内置网络模块
 * 
 * 检测原理：
 * - 尝试在指定端口创建 TCP 服务器
 * - 如果成功监听则端口可用，立即关闭服务器
 * - 如果出现 EADDRINUSE 错误则端口已被占用
 * 
 * 使用场景：
 * - 应用启动前检查端口冲突
 * - 动态端口分配
 * - 服务健康检查
 */

import net from "net";

/**
 * 检测端口是否被占用
 * 
 * 通过尝试创建 TCP 服务器来检测端口是否可用
 * 这是一种可靠的跨平台端口检测方法
 * 
 * @param port - 要检测的端口号
 * @returns Promise<boolean> - true 表示端口已被占用，false 表示端口可用
 * 
 * @example
 * ```typescript
 * // 检查 HTTP 默认端口
 * const httpPortInUse = await isPortUse(80);
 * if (httpPortInUse) {
 *   console.log('端口 80 已被占用');
 * }
 * 
 * // 检查应用端口
 * const appPortInUse = await isPortUse(3000);
 * if (!appPortInUse) {
 *   console.log('端口 3000 可用，可以启动服务');
 * }
 * ```
 */
export async function isPortUse(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        // 端口已经被使用
        console.log(`Port ${port} is already in use.`);
        resolve(true);
      } else {
        console.log(err);
        reject(err);
      }
    });

    server.once("listening", () => {
      // 端口未被使用
      // console.log(`Port ${port} is available.`);
      server.close();
      resolve(false);
    });

    try {
      server.listen(port);
    } catch (e) {
      console.log(e);
    }
  });
}
