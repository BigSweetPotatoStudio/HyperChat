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
import { startChat } from './commands/chat.mjs';
import { startServer } from './commands/server.mjs';
import { startRun, showRunStatus } from './commands/run.mjs';
import { createWorkspace } from './commands/workspace.mjs';
import { listAgents, createAgent, checkAgentExists } from './commands/agent.mjs';
import { 
  listTasks, 
  createTask, 
  showTask, 
  enableTask, 
  disableTask, 
  deleteTask, 
  editTask, 
  taskStats,
  triggerTask,
  showScheduler
} from './commands/task.mjs';
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
  --port <port>            指定端口 (默认: 16100)
  --password <password>    服务器密码
  --verbose, -v            显示详细日志
  --quiet, -q              静默模式
  --help, -h               显示帮助信息

命令:
  chat [message]           开始 AI 聊天会话 (默认命令)
  serve                    启动后端服务器 (包含 Web 界面)
  run                      启动核心服务 (不包含 Web 界面)
  workspace create         在当前目录创建工作区
  agent list               列出所有代理
  task list                列出所有任务
  task create <name>       创建新任务
  task show <name>         显示任务详情
  task edit <name>         编辑任务
  task enable <name>       启用任务
  task disable <name>      禁用任务
  task delete <name>       删除任务
  task trigger <name>      手动触发任务执行
  task scheduler           显示调度器状态
  task stats               显示任务统计
  help                     显示帮助信息

示例:
  hyperchat "你好"                    # 直接聊天（自动检测工作区）
  hyperchat chat "帮我写代码"         # 聊天命令
  hyperchat chat --workspace /path   # 使用指定工作区聊天
  hyperchat serve                   # 启动服务器 (包含 Web 界面)
  hyperchat run                     # 启动核心服务 (后台运行任务调度)
  hyperchat run --workspace /path   # 在指定工作区启动核心服务
  hyperchat workspace create        # 在当前目录创建工作区
  hyperchat [agent_name] "你好"       # 使用指定agent直接聊天
  hyperchat [agent_name] chat        # 使用指定agent交互式聊天

欢迎使用 HyperChat CLI! 🎉
`);
}

// 处理命令
async function handleCommand(): Promise<{ shouldExit: boolean }> {
  const logger = new Logger(globalOptions.verbose, globalOptions.quiet);

  // 检测是否使用agent进行聊天: hyperchat [agent_name] "message" 或 hyperchat [agent_name] chat
  if (cleanArgs.length > 0) {
    const potentialAgentName = cleanArgs[0];
    
    // 检查第一个参数是否是agent名称
    if (potentialAgentName && !['chat', 'serve', 'run', 'workspace', 'agent', 'task', 'help'].includes(potentialAgentName)) {
      const agentCheck = await checkAgentExists(potentialAgentName);
      
      if (agentCheck.exists) {
        // 这是一个agent命令
        const remainingArgs = cleanArgs.slice(1);
        
        if (remainingArgs.length === 0 || remainingArgs[0] === 'chat') {
          // hyperchat [agent_name] 或 hyperchat [agent_name] chat - 交互式模式
          await startChatWrapper([], logger, potentialAgentName);
          return { shouldExit: true };
        } else if (remainingArgs[0] !== 'chat') {
          // hyperchat [agent_name] "message" - 直接消息模式
          const message = remainingArgs.join(' ');
          await startChatWrapper([message], logger, potentialAgentName);
          return { shouldExit: true };
        }
      }
    }
  }

  // 检测是否有非命令的消息 (直接聊天)
  const possibleMessage = cleanArgs.find(arg => !['chat', 'serve', 'run', 'workspace', 'agent', 'task', 'help'].includes(arg));
  const firstArg = cleanArgs[0];
  const isDirectMessage = cleanArgs.length > 0 && possibleMessage && firstArg && !firstArg.match(/^(chat|serve|run|workspace|agent|task|help)$/);

  if (isDirectMessage) {
    // 直接聊天模式: hyperchat "你好"
    const message = cleanArgs.join(' ');
    await startChatWrapper([message], logger);
    return { shouldExit: true };  // 聊天完成后应该退出
  }

  const cmd = cleanArgs[0] || 'help';

  switch (cmd) {
    case 'chat':
      const messages = cleanArgs.slice(1);
      await startChatWrapper(messages, logger);
      return { shouldExit: true };  // 聊天完成后应该退出

    case 'serve':
      await startServer({
        port: globalOptions.port,
        host: globalOptions.host,
        verbose: globalOptions.verbose,
        quiet: globalOptions.quiet
      });
      return { shouldExit: false };  // serve 需要保持进程运行

    case 'run':
      await startRun({
        verbose: globalOptions.verbose,
        quiet: globalOptions.quiet,
        workspace: globalOptions.workspace
      });
      return { shouldExit: false };  // run 需要保持进程运行

    case 'workspace':
      const workspaceSubCmd = cleanArgs[1];
      if (workspaceSubCmd === 'create') {
        // 在当前目录创建工作区
        await createWorkspace(process.cwd());
      } else {
        logger.error('未知的工作区命令:', workspaceSubCmd);
        logger.info('可用命令: create');
      }
      return { shouldExit: true };  // workspace命令执行完都应该退出

    case 'agent':
      const agentSubCmd = cleanArgs[1];
      if (agentSubCmd === 'list') {
        await listAgentsWrapper(logger);
      } else if (agentSubCmd === 'create') {
        const agentName = cleanArgs[2];
        if (!agentName) {
          logger.error('请提供代理名称');
          logger.info('使用方法: hyperchat agent create <name>');
        } else {
          await createAgentWrapper(agentName, logger);
        }
      } else {
        logger.error('未知的代理命令:', agentSubCmd);
        logger.info('可用命令: list, create');
      }
      return { shouldExit: true };  // 所有agent命令执行完都应该退出

    case 'task':
      const taskSubCmd = cleanArgs[1];
      await handleTaskCommand(taskSubCmd, cleanArgs.slice(2), logger);
      return { shouldExit: true };  // 所有task命令执行完都应该退出

    case 'help':
    default:
      showHelp();
      return { shouldExit: true };  // 帮助信息显示完应该退出
  }


}

// 聊天功能
async function startChatWrapper(messages: string[], logger: Logger, agentName?: string) {
  try {
    const options = {
      verbose: globalOptions.verbose,
      quiet: globalOptions.quiet,
      workspace: globalOptions.workspace,
      agent: agentName
    };

    if (messages.length > 0) {
      const message = messages.join(' ');
      await startChat(message, options);
    } else {
      await startChat(undefined, options);
    }

  } catch (error) {
    logger.error('聊天功能失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}


// 工作区管理功能（仅保留create）

// 代理管理功能
async function listAgentsWrapper(_logger: Logger) {
  await listAgents();
}

async function createAgentWrapper(name: string, _logger: Logger) {
  await createAgent(name);
}

// 任务管理功能
async function handleTaskCommand(subCmd: string, args: string[], logger: Logger) {
  // 解析选项
  function getOption(optionName: string): string | undefined {
    const index = args.indexOf(optionName);
    return index >= 0 && index + 1 < args.length ? args[index + 1] : undefined;
  }

  function hasFlag(flagName: string): boolean {
    return args.includes(flagName);
  }

  // 移除选项，保留位置参数
  const positionalArgs = args.filter(arg => !arg.startsWith('-'));

  switch (subCmd) {
    case 'list':
    case undefined:
      await listTasks();
      break;

    case 'create':
      const taskName = positionalArgs[0];
      if (!taskName) {
        logger.error('请提供任务名称');
        logger.info('使用方法: hyperchat task create <name> --description "描述" --agent <agent_key> [--cron "0 0 * * *"] [--disabled]');
        break;
      }

      const createOptions = {
        description: getOption('--description'),
        agent: getOption('--agent'),
        cron: getOption('--cron'),
        disabled: hasFlag('--disabled'),
      };

      await createTask(taskName, createOptions);
      break;

    case 'show':
      const showTaskName = positionalArgs[0];
      if (!showTaskName) {
        logger.error('请提供任务名称');
        logger.info('使用方法: hyperchat task show <name>');
        break;
      }
      await showTask(showTaskName);
      break;

    case 'enable':
      const enableTaskName = positionalArgs[0];
      if (!enableTaskName) {
        logger.error('请提供任务名称');
        logger.info('使用方法: hyperchat task enable <name>');
        break;
      }
      await enableTask(enableTaskName);
      break;

    case 'disable':
      const disableTaskName = positionalArgs[0];
      if (!disableTaskName) {
        logger.error('请提供任务名称');
        logger.info('使用方法: hyperchat task disable <name>');
        break;
      }
      await disableTask(disableTaskName);
      break;

    case 'delete':
      const deleteTaskName = positionalArgs[0];
      if (!deleteTaskName) {
        logger.error('请提供任务名称');
        logger.info('使用方法: hyperchat task delete <name> [--force]');
        break;
      }
      await deleteTask(deleteTaskName, { force: hasFlag('--force') });
      break;

    case 'edit':
      const editTaskName = positionalArgs[0];
      if (!editTaskName) {
        logger.error('请提供任务名称');
        logger.info('使用方法: hyperchat task edit <name> [--description "新描述"] [--agent <agent_key>] [--cron "新调度"] [--enable|--disable]');
        break;
      }

      const editOptions = {
        description: getOption('--description'),
        agent: getOption('--agent'),
        cron: getOption('--cron'),
        enable: hasFlag('--enable'),
        disable: hasFlag('--disable'),
      };

      await editTask(editTaskName, editOptions);
      break;


    case 'trigger':
      const triggerTaskName = positionalArgs[0];
      if (!triggerTaskName) {
        logger.error('请提供任务名称');
        logger.info('使用方法: hyperchat task trigger <name>');
        break;
      }
      await triggerTask(triggerTaskName);
      break;

    case 'scheduler':
      await showScheduler();
      break;

    case 'stats':
      await taskStats();
      break;

    default:
      logger.error('未知的任务命令:', subCmd);
      logger.info('可用命令: list, create, show, enable, disable, delete, edit, trigger, scheduler, stats');
      break;
  }
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
handleCommand().then(async (result) => {
  // 根据命令类型决定是否退出
  if (result.shouldExit) {
    await workspaceManager.uninitialize(); // 清理工作区管理器
  }
  // 对于需要保持运行的命令（如 serve），不执行 process.exit
}).catch(error => {
  console.error('❌ 命令执行失败:', error);
  process.exit(1);
});