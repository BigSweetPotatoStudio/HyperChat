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
import { workspaceManager } from '../workspace/index.mjs';
// 获取包信息
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', '..', 'package.json');
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

// 简单的命令行参数解析
const args = process.argv.slice(2);

// 解析全局选项
const globalOptions = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  quiet: args.includes('--quiet') || args.includes('-q'),
  help: args.includes('--help') || args.includes('-h'),
  host: getOptionValue(args, '--host') || 'localhost',
  port: parseInt(getOptionValue(args, '--port') || '16102'),
  password: getOptionValue(args, '--password'),
  workspace: getOptionValue(args, '--workspace')
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
  --workspace <path>       使用指定工作区（覆盖自动检测）
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
  workspace current        显示当前工作区信息
  workspace create <path>  创建新工作区
  workspace info <path>    查看指定工作区信息
  agent list               列出所有代理
  config get <key>         获取配置值
  config set <key> <value> 设置配置值
  help                     显示帮助信息

示例:
  hyperchat "你好"                    # 直接聊天（自动检测工作区）
  hyperchat chat "帮我写代码"         # 聊天命令
  hyperchat chat --workspace /path   # 使用指定工作区聊天
  hyperchat server start            # 启动服务器
  hyperchat workspace current       # 显示当前工作区

欢迎使用 HyperChat CLI! 🎉
`);
}

// 处理命令
async function handleCommand(): Promise<{ shouldExit: boolean }> {
  const logger = new Logger(globalOptions.verbose, globalOptions.quiet);
  
  
  // 检测是否有非命令的消息 (直接聊天)
  const possibleMessage = cleanArgs.find(arg => !['chat', 'server', 'workspace', 'agent', 'config', 'help'].includes(arg));
  const isDirectMessage = cleanArgs.length > 0 && possibleMessage && !cleanArgs[0].match(/^(chat|server|workspace|agent|config|help)$/);
  
  if (isDirectMessage) {
    // 直接聊天模式: hyperchat "你好"
    const message = cleanArgs.join(' ');
    await startChat([message], logger);
    return { shouldExit: true };  // 聊天完成后应该退出
  }

  const cmd = cleanArgs[0] || 'help';
  
  switch (cmd) {
    case 'chat':
      const messages = cleanArgs.slice(1);
      await startChat(messages, logger);
      return { shouldExit: true };  // 聊天完成后应该退出
    
    case 'server':
      const subCommand = cleanArgs[1];
      const { startServer: serverStart, stopServer: serverStop, serverStatus: status } = await import('./commands/server.mjs');
      
      if (subCommand === 'start') {
        await serverStart({
          port: globalOptions.port,
          host: globalOptions.host,
          verbose: globalOptions.verbose,
          quiet: globalOptions.quiet
        });
        return { shouldExit: false };  // server start 需要保持进程运行
      } else if (subCommand === 'stop') {
        await serverStop({
          verbose: globalOptions.verbose,
          quiet: globalOptions.quiet
        });
        return { shouldExit: true };   // server stop 执行完应该退出
      } else if (subCommand === 'status') {
        await status({
          port: globalOptions.port,
          host: globalOptions.host,
          verbose: globalOptions.verbose,
          quiet: globalOptions.quiet
        });
        return { shouldExit: true };   // server status 查看完应该退出
      } else {
        logger.error('未知的服务器命令:', subCommand);
        logger.info('可用命令: start, stop, status');
        return { shouldExit: true };   // 错误信息显示完应该退出
      }
    
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
      } else if (workspaceSubCmd === 'info') {
        const workspacePath = cleanArgs[2];
        if (!workspacePath) {
          logger.error('请提供工作区路径');
          logger.info('使用方法: hyperchat workspace info <path>');
        } else {
          await showWorkspaceInfo(workspacePath, logger);
        }
      } else if (workspaceSubCmd === 'current') {
        await showCurrentWorkspace(logger);
      } else {
        logger.error('未知的工作区命令:', workspaceSubCmd);
        logger.info('可用命令: list, create, info, current');
      }
      return { shouldExit: true };  // 所有workspace命令执行完都应该退出
    
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
      return { shouldExit: true };  // 所有agent命令执行完都应该退出
    
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
      return { shouldExit: true };  // 所有config命令执行完都应该退出
    
    case 'help':
    default:
      showHelp();
      return { shouldExit: true };  // 帮助信息显示完应该退出
  }
}

// 聊天功能
async function startChat(messages: string[], logger: Logger) {
  try {
    const { startChat: chatStart } = await import('./commands/chat.mjs');
    
    const options = {
      verbose: globalOptions.verbose,
      quiet: globalOptions.quiet,
      workspace: globalOptions.workspace
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
    // 获取正确的core包路径（当前就在core包内）
    const corePackagePath = join(__dirname, '..', '..');
    logger.debug(`Core 包路径: ${corePackagePath}`);
    
    // 现在CLI在core包内，无需检查core包路径
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: corePackagePath,
      stdio: globalOptions.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        PORT: globalOptions.port.toString(),
        myEnv: 'dev'
      },
      shell: true
    });
    
    // 监听错误输出
    if (!globalOptions.verbose && serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        logger.debug('服务器错误:', data.toString());
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
    const maxAttempts = 10;
    let isServerRunning = false;
    
    while (attempts < maxAttempts && !isServerRunning) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      isServerRunning = await checkServerHealth(globalOptions.host, globalOptions.port);
      attempts++;
      if (!isServerRunning && attempts < maxAttempts) {
        logger.debug(`尝试连接服务器... (${attempts}/${maxAttempts})`);
      }
    }
    
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

async function showWorkspaceInfo(path: string, logger: Logger) {
  const { showWorkspaceInfo: showInfo } = await import('./commands/workspace.mjs');
  await showInfo(path);
}

async function showCurrentWorkspace(logger: Logger) {
  try {
    // 新架构：直接使用core模块获取当前工作区信息
    await workspaceManager.initialize();
    const workspace = workspaceManager.getCurrentWorkspace();
    const workspaceInfo = {
      path: workspaceManager.getCurrentWorkspacePath(),
      isGlobal: workspaceManager.isGlobalWorkspace(workspaceManager.getCurrentWorkspacePath()),
      config: workspace.getConfig()
    };
    
    console.log('\n📋 当前工作区信息:');
    console.log(`  名称: ${workspaceInfo.config.name}`);
    console.log(`  路径: ${workspaceInfo.path}`);
    console.log(`  类型: ${workspaceInfo.isGlobal ? '📁 项目工作区' : '🌐 全局工作区'}`);
    console.log(`  状态: 📖 只读模式（未启动服务）`);
    console.log(`  MCP: ⚪ 未启动（查看状态不启动服务）`);
    
  } catch (error) {
    logger.error('获取当前工作区信息失败:', error instanceof Error ? error.message : String(error));
  }
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


// 全局退出处理
let isExiting = false;

async function cleanup() {
  if (isExiting) return;
  isExiting = true;
  
  try {
    // 新架构下简化清理逻辑
    console.log('正在清理资源...');
  } catch (error) {
    console.error('清理过程中出现错误:', error);
  }
  
  process.exit(0);
}

// 监听进程退出信号
process.on('SIGINT', cleanup);  // Ctrl+C
process.on('SIGTERM', cleanup); // 终止信号
process.on('exit', cleanup);    // 正常退出

// 执行命令
handleCommand().then((result) => {
  // 根据命令类型决定是否退出
  if (result.shouldExit) {
    // 对于需要退出的命令，延迟一点时间确保所有异步操作完成
    setImmediate(() => {
      process.exit(0);
    });
  }
  // 对于需要保持运行的命令（如 server start），不执行 process.exit
}).catch(error => {
  console.error('❌ 命令执行失败:', error);
  process.exit(1);
});