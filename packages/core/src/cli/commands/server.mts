/**
 * Server 命令实现
 * 
 * 启动和管理 HyperChat 服务器
 */

import process from 'process';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { Logger } from '../utils/logger.mjs';
import "../../first.mjs";
import { initHttp } from "../../http.mjs";
import { getWorkspaceManager } from "../../workspace/index.mjs";
import { t } from '../../i18n.mjs';
import { EnvManager } from '../../data/managers/envManager.mjs';
import { parseOptionsToEnv } from '../../utils/cliArgsParser.mjs';



const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ServerOptions {
  port?: number;
  host?: string;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * 启动核心服务器
 */
export async function startServer(options: ServerOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);
  
  // 解析 CLI 参数为环境配置
  const cliArgs = parseOptionsToEnv(options);
  
  // 获取环境管理器（包含 CLI 参数覆盖）
  const envManager = EnvManager.getInstance(process.cwd(), cliArgs);
  const config = envManager.getConfig();
  
  const port = config.HyperChat_HTTP_PORT;
  const host = options.host || 'localhost';

  try {
    logger.info(`🚀 ${t`Starting HyperChat server...`}`);

    // // 检查服务器是否已经在运行
    // const isRunning = await checkServerHealth(host, port);
    // if (isRunning) {
    //   logger.warn(`服务器已在 ${host}:${port} 上运行`);
    //   logger.info(`🌐 Web 界面: http://${host}:${port}`);
    //   return;
    // }

    logger.info(`⏳ ${t`Waiting for server to start...`}`);
    // HTTP 服务器只需要基本配置，不需要完整服务
    const currentWorkingDirectory = process.cwd();
    await getWorkspaceManager().initialize(currentWorkingDirectory);
    await getWorkspaceManager().start();
    // 启动 HTTP 服务，捕获并记录异常
    await initHttp();

    logger.info(`🚀 ${t`Server started successfully...`}`);



  } catch (error) {
    logger.error(`${t`Startup failed:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/**
 * 检查服务器健康状态
 */
async function checkServerHealth(host: string, port: number): Promise<boolean> {
  const http = await import('http');

  return new Promise((resolve) => {
    const req = http.request({
      hostname: host,
      port: port,
      path: '/',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      // 任何响应都表示服务器在运行
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}