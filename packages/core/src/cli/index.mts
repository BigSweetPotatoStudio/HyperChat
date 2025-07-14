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
${t`Powerful AI assistant command line tool`}

${t`Usage:`}
  hyperchat [message] [options]

${t`Global options:`}
  --workspace <path>       ${t`Use specified workspace (override auto-detection)`}
  --host <host>            ${t`Connect to specified server (default: localhost)`}
  --port <port>            ${t`Specify port (default: 16100)`}
  --password <password>    ${t`Server password`}
  --verbose, -v            ${t`Show verbose logs`}
  --quiet, -q              ${t`Silent mode`}
  --help, -h               ${t`Show help information`}

${t`Commands:`}
  # ${t`General chat`}
  chat [message]           ${t`Start AI chat session (default command)`}
  chat                     ${t`Interactive chat`}
  
  # Agent${t`related`}
  agent list               ${t`List all agents`}
  agent create <name>      ${t`Create new agent`}
  agent delete <name>      ${t`Delete agent`}
  agent <name> "message"    ${t`Quick chat with specified agent`}
  agent <name> chat        ${t`Interactive chat with specified agent`}
  
  # ${t`System management`}
  serve                    ${t`Start backend server (includes Web UI)`}
  run                      ${t`Start core service (no Web UI)`}
  workspace create         ${t`Create workspace in current directory`}
  
  # ${t`Task management`}
  task list                ${t`List all tasks`}
  task create <name>       ${t`Create new task`}
  task show <name>         ${t`Show task details`}
  task edit <name>         ${t`Edit task`}
  task enable <name>       ${t`Enable task`}
  task disable <name>      ${t`Disable task`}
  task delete <name>       ${t`Delete task`}
  task trigger <name>      ${t`Manually trigger task execution`}
  task scheduler           ${t`Show scheduler status`}
  task stats               ${t`Show task statistics`}
  
  help                     ${t`Show help information`}

${t`Examples:`}
  # ${t`General chat`}
  hyperchat "${t`Hello`}"                    # ${t`Direct chat (auto-detect workspace)`}
  hyperchat chat "${t`Help me write code`}"         # ${t`Chat command`}
  hyperchat chat --workspace /path   # ${t`Chat with specified workspace`}
  
  # Agent${t`chat`}
  hyperchat agent mybot "${t`Hello`}"        # ${t`Direct chat with specified agent`}
  hyperchat agent mybot chat         # ${t`Interactive chat with specified agent`}
  hyperchat agent list              # ${t`List all agents`}
  hyperchat agent create mybot      # ${t`Create new agent`}
  
  # ${t`System management`}
  hyperchat serve                   # ${t`Start server (includes Web UI)`}
  hyperchat run                     # ${t`Start core service (background task scheduling)`}
  hyperchat workspace create        # ${t`Create workspace in current directory`}

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
    logger.error(t`Chat function failed: ${error instanceof Error ? error.message : String(error)}`);
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
      logger.error(t`Agent '${name}' does not exist`);
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
        logger.error(t`Please provide agent name`);
        logger.info(t`Usage: hyperchat agent create <name>`);
      } else {
        await createAgentWrapper(createName, logger);
      }
      break;

    case 'delete':
      const deleteName = args[1];
      if (!deleteName) {
        logger.error(t`Please provide agent name`);
        logger.info(t`Usage: hyperchat agent delete <name>`);
      } else {
        await deleteAgentWrapper(deleteName, logger);
      }
      break;

    default:
      // 检查是否是 agent <name> "message" 或 agent <name> chat
      const agentName = subCmd;
      const agentCheck = await checkAgentExists(agentName);
      
      if (!agentCheck.exists) {
        logger.error(t`Unknown agent command or agent does not exist: ${subCmd}`);
        logger.info(t`Available commands: list, create, delete, <name> "message", <name> chat`);
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
        logger.error(t`Please provide task name`);
        logger.info(t`Usage: hyperchat task create <name> --description "description" --agent <agent_key> [--cron "0 0 * * *"] [--disabled]`);
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
        logger.error(t`Please provide task name`);
        logger.info(t`Usage: hyperchat task show <name>`);
        break;
      }
      await showTask(showTaskName);
      break;

    case 'enable':
      const enableTaskName = positionalArgs[0];
      if (!enableTaskName) {
        logger.error(t`Please provide task name`);
        logger.info(t`Usage: hyperchat task enable <name>`);
        break;
      }
      await enableTask(enableTaskName);
      break;

    case 'disable':
      const disableTaskName = positionalArgs[0];
      if (!disableTaskName) {
        logger.error(t`Please provide task name`);
        logger.info(t`Usage: hyperchat task disable <name>`);
        break;
      }
      await disableTask(disableTaskName);
      break;

    case 'delete':
      const deleteTaskName = positionalArgs[0];
      if (!deleteTaskName) {
        logger.error(t`Please provide task name`);
        logger.info(t`Usage: hyperchat task delete <name> [--force]`);
        break;
      }
      await deleteTask(deleteTaskName, { force: hasFlag('--force') });
      break;

    case 'edit':
      const editTaskName = positionalArgs[0];
      if (!editTaskName) {
        logger.error(t`Please provide task name`);
        logger.info(t`Usage: hyperchat task edit <name> [--description "new description"] [--agent <agent_key>] [--cron "new schedule"] [--enable|--disable]`);
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
        logger.error(t`Please provide task name`);
        logger.info(t`Usage: hyperchat task trigger <name>`);
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
      logger.error(t`Unknown task command: ${subCmd}`);
      logger.info(t`Available commands: list, create, show, enable, disable, delete, edit, trigger, scheduler, stats`);
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
    console.log(t`Exiting...`);
  } catch (error) {
    console.error(t`Error occurred during exit: ${error}`);
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
    console.error(t`❌ Command execution failed: ${error}`);
    process.exit(1);
  }
}

// 执行主函数
main();