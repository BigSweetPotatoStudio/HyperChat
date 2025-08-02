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


    logger.info(`⏳ ${t`Waiting for server to start...`}`);
    
    // 1. 初始化工作区管理器
    const currentWorkingDirectory = process.cwd();

    await getWorkspaceManager().initialize(currentWorkingDirectory);
    let workspace = getWorkspaceManager().getCurrentWorkspace();
    await workspace.start();

    
    // 2. 启动 HTTP 服务
    await initHttp();

    logger.info(`🚀 ${t`Server started successfully...`}`);

  } catch (error) {
    logger.error(`${t`Startup failed:`} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}