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
import { Command } from '../command.mjs';
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
import { initCliI18n, addCliTranslations, t } from '../i18n.mjs';
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
  # 通用聊天
  chat [message]           开始 AI 聊天会话 (默认命令)
  chat                     交互式聊天
  
  # Agent相关
  agent list               列出所有代理
  agent create <name>      创建新代理
  agent delete <name>      删除代理
  agent <name> "message"    使用指定agent快速对话
  agent <name> chat        使用指定agent交互式聊天
  
  # 系统管理
  serve                    启动后端服务器 (包含 Web 界面)
  run                      启动核心服务 (不包含 Web 界面)
  workspace create         在当前目录创建工作区
  
  # 任务管理
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
  # 通用聊天
  hyperchat "你好"                    # 直接聊天（自动检测工作区）
  hyperchat chat "帮我写代码"         # 聊天命令
  hyperchat chat --workspace /path   # 使用指定工作区聊天
  
  # Agent聊天
  hyperchat agent mybot "你好"        # 使用指定agent直接聊天
  hyperchat agent mybot chat         # 使用指定agent交互式聊天
  hyperchat agent list              # 列出所有agents
  hyperchat agent create mybot      # 创建新agent
  
  # 系统管理
  hyperchat serve                   # 启动服务器 (包含 Web 界面)
  hyperchat run                     # 启动核心服务 (后台运行任务调度)
  hyperchat workspace create        # 在当前目录创建工作区

${t`Welcome to HyperChat CLI! 🎉`}
`);
}

// 处理命令
async function handleCommand(): Promise<{ shouldExit: boolean }> {
  const logger = new Logger(globalOptions.verbose, globalOptions.quiet);

  // 新的agent命令不需要特殊检测，统一在agent命令中处理

  // 检测是否有非命令的消息 (直接聊天)
  const firstArg = cleanArgs[0];
  const isDirectMessage = cleanArgs.length > 0 && firstArg && !firstArg.match(/^(chat|serve|run|workspace|agent|task|help)$/);

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
        logger.error(t`Unknown workspace command: ${workspaceSubCmd}`);
        logger.info(t`Available commands: create`);
      }
      return { shouldExit: true };  // workspace命令执行完都应该退出

    case 'agent':
      await handleAgentCommand(cleanArgs.slice(1), logger);
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

async function deleteAgentWrapper(name: string, logger: Logger) {
  try {
    // 检查agent是否存在
    const agentCheck = await checkAgentExists(name);
    if (!agentCheck.exists) {
      logger.error(`代理 '${name}' 不存在`);
      return;
    }

    // 删除agent
    const success = await Command.deleteAgent({
      workspacePath: '', // workspacePath 会被忽略，使用当前工作区
      agentName: name
    });

    if (success) {
      console.log(`✅ ${t`Agent deleted successfully`}: '${name}'`);
    } else {
      logger.error(t`Failed to delete agent: ${name}`);
    }
  } catch (error) {
    logger.error(t`Failed to delete agent: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Agent命令处理
async function handleAgentCommand(args: string[], logger: Logger) {
  if (args.length === 0) {
    logger.error(t`Please provide agent subcommand`);
    logger.info(t`Available commands: list, create, delete, <name> "message", <name> chat`);
    return;
  }

  const subCmd = args[0];

  switch (subCmd) {
    case 'list':
      await listAgentsWrapper(logger);
      break;

    case 'create':
      const createName = args[1];
      if (!createName) {
        logger.error('请提供代理名称');
        logger.info('使用方法: hyperchat agent create <name>');
      } else {
        await createAgentWrapper(createName, logger);
      }
      break;

    case 'delete':
      const deleteName = args[1];
      if (!deleteName) {
        logger.error('请提供代理名称');
        logger.info('使用方法: hyperchat agent delete <name>');
      } else {
        await deleteAgentWrapper(deleteName, logger);
      }
      break;

    default:
      // 检查是否是 agent <name> "message" 或 agent <name> chat
      const agentName = subCmd;
      const agentCheck = await checkAgentExists(agentName);
      
      if (!agentCheck.exists) {
        logger.error(`未知的agent命令或agent不存在: ${subCmd}`);
        logger.info('可用命令: list, create, delete, <name> "message", <name> chat');
        return;
      }

      // 这是一个有效的agent名称
      const remainingArgs = args.slice(1);
      
      if (remainingArgs.length === 0 || remainingArgs[0] === 'chat') {
        // hyperchat agent <name> 或 hyperchat agent <name> chat - 交互式模式
        await startChatWrapper([], logger, agentName);
      } else {
        // hyperchat agent <name> "message" - 直接消息模式
        const message = remainingArgs.join(' ');
        await startChatWrapper([message], logger, agentName);
      }
      break;
  }
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
    console.log('正在退出...');
  } catch (error) {
    console.error('正在退出过程中出现错误:', error);
  }

  process.exit(0);
}

// 监听进程退出信号
process.on('SIGINT', cleanup);  // Ctrl+C
process.on('SIGTERM', cleanup); // 终止信号
process.on('exit', cleanup);    // 正常退出

// 初始化i18n系统然后执行命令
async function main() {
  try {
    // 初始化i18n系统
    await initCliI18n();
    addCliTranslations();
    
    // 执行命令
    const result = await handleCommand();
    
    // 根据命令类型决定是否退出
    if (result.shouldExit) {
      await workspaceManager.uninitialize(); // 清理工作区管理器
    }
  } catch (error) {
    console.error('❌ 命令执行失败:', error);
    process.exit(1);
  }
}

// 执行主函数
main();