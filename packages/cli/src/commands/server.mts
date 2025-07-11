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
  const port = options.port || 16102;
  const host = options.host || 'localhost';
  
  try {
    logger.info('🚀 启动 HyperChat 服务器...');
    
    // 检查服务器是否已经在运行
    const isRunning = await checkServerHealth(host, port);
    if (isRunning) {
      logger.warn(`服务器已在 ${host}:${port} 上运行`);
      logger.info(`🌐 Web 界面: http://${host}:${port}`);
      return;
    }
    
    // 获取core包路径
    const corePackagePath = join(__dirname, '..', '..', '..', 'core');
    logger.debug(`Core 包路径: ${corePackagePath}`);
    
    // 检查core包是否存在
    if (!existsSync(corePackagePath)) {
      logger.error(`找不到core包目录: ${corePackagePath}`);
      logger.info('请确保在HyperChat项目中运行此命令');
      process.exit(1);
    }
    
    // 检查package.json是否存在
    const packageJsonPath = join(corePackagePath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      logger.error('找不到core包的package.json');
      process.exit(1);
    }
    
    // 启动服务器进程
    logger.debug('启动命令: npm run dev');
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: corePackagePath,
      stdio: options.verbose ? 'inherit' : ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: port.toString(),
        myEnv: 'dev',
        NODE_ENV: 'development'
      },
      shell: true
    });
    
    // 监听错误输出
    if (!options.verbose && serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Error') || error.includes('error')) {
          logger.error('服务器错误:', error.trim());
        } else {
          logger.debug('服务器消息:', error.trim());
        }
      });
    }
    
    // 监听标准输出
    if (!options.verbose && serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logger.debug('服务器输出:', output.trim());
      });
    }
    
    // 监听启动错误
    serverProcess.on('error', (error) => {
      logger.error('无法启动服务器进程:', error.message);
      process.exit(1);
    });
    
    // 等待服务器启动
    logger.info('⏳ 等待服务器启动...');
    
    // 多次尝试检查服务器状态
    let attempts = 0;
    const maxAttempts = 30; // 最多等待30秒
    let isServerRunning = false;
    
    while (attempts < maxAttempts && !isServerRunning) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      isServerRunning = await checkServerHealth(host, port);
      attempts++;
      
      if (!isServerRunning && attempts % 5 === 0) {
        logger.info(`等待服务器启动... (${attempts}秒)`);
      }
    }
    
    if (isServerRunning) {
      logger.success('✅ 服务器启动成功');
      logger.info(`🌐 Web 界面: http://${host}:${port}`);
      logger.info('📝 按 Ctrl+C 停止服务器');
      
      // 监听进程退出
      process.on('SIGINT', () => {
        logger.info('\n🛑 正在停止服务器...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
      });
      
      // 等待服务器进程
      serverProcess.on('exit', (code) => {
        logger.info(`服务器进程退出，代码: ${code || 0}`);
        process.exit(code || 0);
      });
      
      // 保持进程运行
      await new Promise(() => {}); // 永远等待
      
    } else {
      logger.error('❌ 服务器启动失败');
      logger.info('尝试使用 --verbose 选项查看详细日志');
      serverProcess.kill('SIGTERM');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('启动失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * 停止服务器
 */
export async function stopServer(options: ServerOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);
  logger.info('🛑 停止服务器功能开发中...');
  logger.info('💡 请使用 Ctrl+C 停止正在运行的服务器');
}

/**
 * 检查服务器状态
 */
export async function serverStatus(options: ServerOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);
  const port = options.port || 16102;
  const host = options.host || 'localhost';
  
  try {
    const isRunning = await checkServerHealth(host, port);
    
    logger.info('📊 服务器状态:');
    if (isRunning) {
      logger.info(`  状态: 🟢 运行中`);
      logger.info(`  地址: http://${host}:${port}`);
    } else {
      logger.info(`  状态: ⚪ 未运行`);
      logger.info(`  使用 hyperchat server start 启动服务器`);
    }
    
  } catch (error) {
    logger.info('📊 服务器状态:');
    logger.info(`  状态: ❓ 未知`);
    logger.debug('错误:', error instanceof Error ? error.message : String(error));
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