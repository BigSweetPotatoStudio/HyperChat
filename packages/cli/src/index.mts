#!/usr/bin/env node

/**
 * HyperChat CLI - 命令行界面
 * 
 * 提供类似 Claude Code 的命令行体验：
 * - 交互式 AI 聊天
 * - 文件和工作区操作
 * - MCP 工具集成
 * - 本地和远程核心服务连接
 */

import process from 'process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './utils/logger.mjs';

// 获取包信息
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', 'package.json');
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

// 简单的命令行参数解析
const args = process.argv.slice(2);

// 解析全局选项
const globalOptions = {
  web: args.includes('--web'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  quiet: args.includes('--quiet') || args.includes('-q'),
  help: args.includes('--help') || args.includes('-h'),
  host: getOptionValue(args, '--host') || 'localhost',
  port: parseInt(getOptionValue(args, '--port') || '16102'),
  password: getOptionValue(args, '--password')
};

// 移除选项，保留命令和参数
const cleanArgs = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('-'));

// 获取选项值
function getOptionValue(args: string[], option: string): string | undefined {
  const index = args.indexOf(option);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : undefined;
}

// 简单的帮助函数
function showHelp() {
  console.log(`
🚀 HyperChat CLI v${pkg.version}
强大的 AI 助手命令行工具

使用方法:
  hyperchat [message] [options]

全局选项:
  --web                    启动后端服务器 (供浏览器访问)
  --host <host>            连接到指定服务器 (默认: localhost)
  --port <port>            指定端口 (默认: 16102)
  --password <password>    服务器密码
  --verbose, -v            显示详细日志
  --quiet, -q              静默模式
  --help, -h               显示帮助信息

命令:
  chat [message]           开始 AI 聊天会话 (默认命令)
  server start             启动后端服务器
  server stop              停止后端服务器
  server status            查看服务器状态
  workspace list           列出所有工作区
  agent list               列出所有代理
  config get <key>         获取配置值
  config set <key> <value> 设置配置值
  help                     显示帮助信息

示例:
  hyperchat "你好"                    # 直接聊天
  hyperchat chat "帮我写代码"         # 聊天命令
  hyperchat --web                     # 启动服务器
  hyperchat --host remote --port 8080 # 连接远程服务器
  hyperchat server status             # 查看服务器状态

欢迎使用 HyperChat CLI! 🎉
`);
}

// 处理命令
async function handleCommand() {
  const logger = new Logger(globalOptions.verbose, globalOptions.quiet);
  
  // 如果有 --web 选项，启动服务器
  if (globalOptions.web) {
    await startServer(logger);
    return;
  }
  
  // 检测是否有非命令的消息 (直接聊天)
  const possibleMessage = cleanArgs.find(arg => !['chat', 'server', 'workspace', 'agent', 'config', 'help'].includes(arg));
  const isDirectMessage = cleanArgs.length > 0 && possibleMessage && !cleanArgs[0].match(/^(chat|server|workspace|agent|config|help)$/);
  
  if (isDirectMessage) {
    // 直接聊天模式: hyperchat "你好"
    const message = cleanArgs.join(' ');
    await startChat([message], logger);
    return;
  }

  const cmd = cleanArgs[0] || 'help';
  
  switch (cmd) {
    case 'chat':
      const messages = cleanArgs.slice(1);
      await startChat(messages, logger);
      break;
    
    case 'server':
      const subCommand = cleanArgs[1];
      if (subCommand === 'start') {
        await startServer(logger);
      } else if (subCommand === 'stop') {
        await stopServer(logger);
      } else if (subCommand === 'status') {
        await serverStatus(logger);
      } else {
        logger.error('未知的服务器命令:', subCommand);
        logger.info('可用命令: start, stop, status');
      }
      break;
    
    case 'workspace':
      const workspaceSubCmd = cleanArgs[1];
      if (workspaceSubCmd === 'list') {
        await listWorkspaces(logger);
      } else if (workspaceSubCmd === 'create') {
        const workspacePath = cleanArgs[2];
        if (!workspacePath) {
          logger.error('请提供工作区路径');
          logger.info('使用方法: hyperchat workspace create <path>');
        } else {
          await createWorkspace(workspacePath, logger);
        }
      } else if (workspaceSubCmd === 'switch') {
        const workspacePath = cleanArgs[2];
        if (!workspacePath) {
          logger.error('请提供工作区路径');
          logger.info('使用方法: hyperchat workspace switch <path>');
        } else {
          await switchWorkspace(workspacePath, logger);
        }
      } else {
        logger.error('未知的工作区命令:', workspaceSubCmd);
        logger.info('可用命令: list, create, switch');
      }
      break;
    
    case 'agent':
      const agentSubCmd = cleanArgs[1];
      if (agentSubCmd === 'list') {
        await listAgents(logger);
      } else if (agentSubCmd === 'create') {
        const agentName = cleanArgs[2];
        if (!agentName) {
          logger.error('请提供代理名称');
          logger.info('使用方法: hyperchat agent create <name>');
        } else {
          await createAgent(agentName, logger);
        }
      } else {
        logger.error('未知的代理命令:', agentSubCmd);
        logger.info('可用命令: list, create');
      }
      break;
    
    case 'config':
      const configSubCmd = cleanArgs[1];
      if (configSubCmd === 'get') {
        const configKey = cleanArgs[2];
        if (!configKey) {
          logger.error('请提供配置键名');
          logger.info('使用方法: hyperchat config get <key>');
        } else {
          await getConfig(configKey, logger);
        }
      } else if (configSubCmd === 'set') {
        const configKey = cleanArgs[2];
        const configValue = cleanArgs[3];
        if (!configKey || configValue === undefined) {
          logger.error('请提供配置键名和值');
          logger.info('使用方法: hyperchat config set <key> <value>');
        } else {
          await setConfig(configKey, configValue, logger);
        }
      } else {
        logger.error('未知的配置命令:', configSubCmd);
        logger.info('可用命令: get, set');
      }
      break;
    
    case 'help':
    default:
      showHelp();
      break;
  }
}

// 聊天功能
async function startChat(messages: string[], logger: Logger) {
  try {
    const { startChat: chatStart } = await import('./commands/chat.mjs');
    
    const options = {
      verbose: globalOptions.verbose,
      quiet: globalOptions.quiet
    };
    
    if (messages.length > 0) {
      const message = messages.join(' ');
      await chatStart(message, options);
    } else {
      await chatStart(undefined, options);
    }
    
  } catch (error) {
    logger.error('聊天功能失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 启动服务器
async function startServer(logger: Logger) {
  logger.info('🚀 启动 HyperChat 服务器...');
  
  const { spawn } = await import('child_process');
  const { join } = await import('path');
  
  try {
    // 检查服务器是否已经在运行
    try {
      const isRunning = await checkServerHealth(globalOptions.host, globalOptions.port);
      if (isRunning) {
        logger.warn(`服务器已在 ${globalOptions.host}:${globalOptions.port} 上运行`);
        logger.info(`🌐 Web 界面: http://${globalOptions.host}:${globalOptions.port}`);
        return;
      }
    } catch (error) {
      // 服务器未运行，继续启动
    }
    
    // 启动 Core 服务器
    const corePackagePath = join(process.cwd(), '..', 'core');
    logger.debug(`Core 包路径: ${corePackagePath}`);
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: corePackagePath,
      stdio: globalOptions.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        PORT: globalOptions.port.toString()
      }
    });

    // 等待服务器启动
    logger.info('⏳ 等待服务器启动...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 检查服务器是否启动成功
    const isServerRunning = await checkServerHealth(globalOptions.host, globalOptions.port);
    if (isServerRunning) {
      logger.success('服务器启动成功');
      logger.info(`🌐 Web 界面: http://${globalOptions.host}:${globalOptions.port}`);
      logger.info('📝 按 Ctrl+C 停止服务器');
      
      // 监听进程退出
      process.on('SIGINT', () => {
        logger.info('\\n🛑 正在停止服务器...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
      });
      
      // 等待服务器进程
      serverProcess.on('exit', (code) => {
        logger.info(`服务器进程退出，代码: ${code || 0}`);
        process.exit(code || 0);
      });
      
    } else {
      logger.error('服务器启动失败');
      serverProcess.kill('SIGTERM');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('启动失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// 停止服务器
async function stopServer(logger: Logger) {
  logger.info('🛑 停止服务器功能开发中...');
  logger.info('💡 请使用 Ctrl+C 停止正在运行的服务器');
}

// 检查服务器状态
async function serverStatus(logger: Logger) {
  try {
    const isServerRunning = await checkServerHealth(globalOptions.host, globalOptions.port);
    
    logger.info('📊 服务器状态:');
    if (isServerRunning) {
      logger.info(`  状态: 运行中`);
      logger.info(`  地址: http://${globalOptions.host}:${globalOptions.port}`);
    } else {
      logger.info(`  状态: 未运行`);
    }
    
  } catch (error) {
    logger.info('📊 服务器状态:');
    logger.info(`  状态: 未知`);
    logger.debug('错误:', error instanceof Error ? error.message : String(error));
  }
}

// 检查服务器健康状态
async function checkServerHealth(host: string, port: number): Promise<boolean> {
  const { request } = await import('http');
  
  return new Promise((resolve) => {
    const req = request({
      hostname: host,
      port: port,
      path: '/',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404); // 404 也算服务器在运行
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

// 工作区管理功能
async function listWorkspaces(logger: Logger) {
  const { listWorkspaces: listWs } = await import('./commands/workspace.mjs');
  await listWs();
}

async function createWorkspace(path: string, logger: Logger) {
  const { createWorkspace: createWs } = await import('./commands/workspace.mjs');
  await createWs(path);
}

async function switchWorkspace(path: string, logger: Logger) {
  const { switchWorkspace: switchWs } = await import('./commands/workspace.mjs');
  await switchWs(path);
}

// 代理管理功能
async function listAgents(logger: Logger) {
  const { listAgents: listAg } = await import('./commands/agent.mjs');
  await listAg();
}

async function createAgent(name: string, logger: Logger) {
  const { createAgent: createAg } = await import('./commands/agent.mjs');
  await createAg(name);
}

// 配置管理功能
async function getConfig(key: string, logger: Logger) {
  const { getConfig: getCfg } = await import('./commands/config.mjs');
  await getCfg(key);
}

async function setConfig(key: string, value: string, logger: Logger) {
  const { setConfig: setCfg } = await import('./commands/config.mjs');
  await setCfg(key, value);
}


// 执行命令
handleCommand().catch(error => {
  console.error('❌ 命令执行失败:', error);
  process.exit(1);
});