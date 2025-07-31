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
import { getWebAgentManager } from "../webAgentManager.mjs";
import { findAgent, DEFAULT_AGENT_NAME } from "../utils/agentDiscovery.mjs";
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
  const envManager = EnvManager.getInstance();
  envManager.initBase(process.cwd(), cliArgs);
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
    
    // 1. 初始化工作区管理器
    const currentWorkingDirectory = process.cwd();
    await getWorkspaceManager().initialize(currentWorkingDirectory);
    
    // 2. 启动默认的全局Hyper Agent
    // logger.info(`🤖 ${t`Starting default global agent...`}`);
    // try {
    //   const webAgentManager = getWebAgentManager();
      
    //   // 查找全局Hyper Agent
    //   const foundAgent = await findAgent(DEFAULT_AGENT_NAME);
    //   if (foundAgent) {
    //     await webAgentManager.startAgent(foundAgent.path, {
    //       enableMCP: true,           // Web环境启用MCP
    //       enableTaskScheduler: false // Web环境默认不启用任务调度器
    //     });
    //     logger.info(`✅ ${t`Default agent started successfully:`} ${foundAgent.name}`);
    //   } else {
    //     logger.warn(`⚠️  ${t`Default agent not found:`} ${DEFAULT_AGENT_NAME}`);
    //     logger.info(`💡 ${t`Create it using:`} hyperchat agent create ${DEFAULT_AGENT_NAME}`);
    //   }
    // } catch (error) {
    //   logger.warn(`⚠️  ${t`Failed to start default agent:`} ${error instanceof Error ? error.message : String(error)}`);
    //   logger.info(`💡 ${t`Server will continue without default agent`}`);
    // }
    
    // 3. 启动 HTTP 服务
    await initHttp();

    logger.info(`🚀 ${t`Server started successfully...`}`);
    
    // 4. 显示启动状态信息
    const webAgentManager = getWebAgentManager();
    const stats = await webAgentManager.getAgentManagerStats();
    
    logger.info(`\n📊 ${t`Service Status:`}`);
    logger.info(`   🌐 Web Interface: http://${host}:${port}`);
    logger.info(`   🤖 Loaded Agents: ${stats.totalAgents}`);
    
    if (stats.totalAgents > 0) {
      const summaries = await webAgentManager.getAgentSummaries();
      logger.info(`\n🤖 ${t`Active Agents:`}`);
      for (const summary of summaries) {
        const mcpStatus = summary.hasMCPConfig ? '🔌' : '❌';
        const tasksStatus = summary.tasksCount > 0 ? `📋${summary.tasksCount}` : '❌';
        logger.info(`   • ${summary.config.name} ${mcpStatus} ${tasksStatus}`);
        logger.info(`     📍 ${summary.path}`);
      }
    }
    
    logger.info(`\n💡 ${t`Usage:`}`);
    logger.info(`   ${t`Open your browser and visit:`}`);
    logger.info(`   ${t`→`} http://${host}:${port}`);
    logger.info(``);



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