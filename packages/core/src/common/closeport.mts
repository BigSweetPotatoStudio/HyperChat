/**
 * 端口进程终止工具
 * 
 * 核心功能：
 * - 查找占用指定端口的进程
 * - 强制终止占用端口的进程
 * - 适用于 Windows 系统的端口清理
 * 
 * 依赖关系：
 * - child_process: Node.js 内置子进程模块

import { Logger } from "../log.mjs";
 * 
 * 工作原理：
 * 1. 使用 netstat 命令查找端口占用情况
 * 2. 解析输出获取进程 PID
 * 3. 使用 taskkill 命令强制终止进程
 * 
 * 注意事项：
 * - 当前实现仅支持 Windows 系统
 * - 强制终止进程可能导致数据丢失
 * - 需要足够的系统权限
 * 
 * 使用场景：
 * - 开发环境端口冲突解决
 * - 服务重启前的端口清理
 * - 僵尸进程清理
 */

import { exec } from 'child_process';
import { Logger } from '../log.mjs';

/**
 * 强制关闭占用指定端口的进程
 * 
 * 通过系统命令查找并终止占用端口的进程
 * 仅适用于 Windows 系统
 * 
 * @param port - 要清理的端口号
 * 
 * @example
 * ```typescript
 * // 清理端口 3000 上的进程
 * closePort(3000);
 * 
 * // 通常在服务重启前使用
 * closePort(8080);
 * Logger.info('端口已清理，可以重新启动服务');
 * ```
 * 
 * @warning 此函数会强制终止进程，可能导致数据丢失，请谨慎使用
 */
export function closePort(port: number) {

    // 查找占用端口的进程ID
    exec(`netstat -ano | findstr :${port}`, (err, stdout, stderr) => {
        if (err) {
            Logger.error(`查找端口失败: ${err.message}`);
            return;
        }

        if (stderr) {
            Logger.error(`查找端口时出现错误: ${stderr}`);
            return;
        }

        // 解析出进程ID (PID)
        const lines = stdout.trim().split('\n');
        const listeningLines = lines.filter(line => line.includes('LISTENING'));
        const pids = listeningLines.map(line => line.trim().split(/\s+/).pop()).filter(pid => pid && pid !== '0');

        if (pids.length === 0) {
            Logger.info(`端口 ${port} 上没有运行的进程。`);
            return;
        }
        Logger.debug(pids)
        // 终止进程
        pids.forEach(pid => {
            exec(`taskkill /PID ${pid} /F`, (err, _stdout, stderr) => {
                if (err) {
                    Logger.error(`终止进程失败: ${err.message}`);
                    return;
                }

                if (stderr) {
                    Logger.error(`终止进程时出现错误: ${stderr}`);
                    return;
                }

                Logger.info(`成功终止了PID为 ${pid} 的进程。`);
            });
        });
    });
}