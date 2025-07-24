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

// 第一步：立即解析CLI参数并设置环境变量，必须在任何其他模块导入之前
import process from 'process';
import { EnvManager } from '../data/managers/envManager.mjs';
import { parseCurrentArgs, GenericCliParser, CliArgsParser } from '../utils/cliArgsParser.mjs';

// 简单的命令行参数解析
const args = process.argv.slice(2);

// 解析 CLI 参数到环境变量
const cliEnvOverrides = parseCurrentArgs();

// 添加调试信息
if (args.includes('--verbose') || args.includes('-v')) {
  console.log('🔍 CLI Environment Overrides:', cliEnvOverrides);
}

// 创建带有 CLI 参数覆盖的环境管理器
const envManager = EnvManager.getInstance(undefined, cliEnvOverrides);

// 设置为全局默认实例，这样其他模块也能使用CLI参数覆盖
EnvManager.setGlobalDefault(envManager);

// 第二步：现在可以安全地导入其他模块
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './utils/logger.mjs';
// startChat 现在通过动态导入加载
import { startServer } from './commands/server.mjs';
import { startRun } from './commands/run.mjs';
import { createWorkspace, listWorkspaces, showCurrentWorkspace } from './commands/workspace.mjs';
import { listAgents, createAgent, checkAgentExists, showAgentMemory } from './commands/agent.mjs';
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
import { initCliI18n, t, setCurrLang, getCurrLang } from '../i18n.mjs';
import type { Language } from '@dadigua/hyperchat-shared';
// 获取包信息
const __dirname = dirname(fileURLToPath(import.meta.url));
const packagePath = join(__dirname, '..', '..', 'package.json');
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));

// 解析全局选项
const globalOptions = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  quiet: args.includes('--quiet') || args.includes('-q'),
  help: args.includes('--help') || args.includes('-h'),
  host: getOptionValue(args, '--host') || 'localhost',
  port: envManager.get('HyperChat_HTTP_PORT'),
  password: envManager.get('HyperChat_Web_Password'),
  workspace: getOptionValue(args, '--workspace'),
  language: envManager.get('HyperChat_Language'),
  ui: getOptionValue(args, '--ui') || 'ink' // 默认使用 ink UI
};

// 移除选项和选项值，保留命令和参数
function getCleanArgs(args: string[]): string[] {
  const cleanArgs: string[] = [];
  const optionsWithValues = [
    '--workspace', '--host', '--port', '--password', '--language', '--lang', '--ui',
    '--data-dir', '--app-data-dir', '--api-key', '--api-url', '--ai-provider', '--ai-model',
    '--log-level', '--web-password', '--env', '--my-env', '-p',
    '--agent', '-a', '--agent-path', '-A'
  ];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // 跳过选项
    if (arg.startsWith('--') || arg.startsWith('-')) {
      // 如果是有值的选项，也跳过下一个参数（选项值）
      if (optionsWithValues.includes(arg)) {
        i++; // 跳过选项值
      }
      continue;
    }
    
    // 保留非选项参数
    cleanArgs.push(arg);
  }
  
  return cleanArgs;
}

const cleanArgs = getCleanArgs(args);

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
  --language <lang>        ${t`Set language (zh/en, highest priority)`}
  --lang <lang>            ${t`Alias for --language`}
  --host <host>            ${t`Connect to specified server (default: localhost)`}
  --port <port>            ${t`Specify port (default: 16100)`}
  --password <password>    ${t`Server password`}
  --verbose, -v            ${t`Show verbose logs`}
  --quiet, -q              ${t`Silent mode`}
  --ui <style>             ${t`UI style: legacy|ink (default: ink)`}
  --help, -h               ${t`Show help information`}

${t`Commands:`}
  # ${t`General chat`}
  chat [message]           ${t`Start AI chat session (default command)`}
  chat                     ${t`Interactive chat`}
  
  # Agent${t`related`}
  agent list               ${t`List all agents`}
  agent create <name>      ${t`Create new agent`}
  agent delete <name>      ${t`Delete agent`}
  agent memory <name>      ${t`Show agent memory`}
  agent <name> "message"    ${t`Quick chat with specified agent`}
  agent <name> chat        ${t`Interactive chat with specified agent`}
  
  # ${t`System management`}
  serve                    ${t`Start backend server (includes Web UI)`}
  run                      ${t`Start core service (no Web UI, Agent-centered)`}
  run --list-agents        ${t`List all available agents`}
  run --agent <name>       ${t`Start specific agent only`}
  run --agent-path <path>  ${t`Start agent from specific path`}
  workspace list           ${t`Show workspace information`}
  workspace current        ${t`Show current working directory and workspace`}
  workspace create         ${t`Create workspace in current directory`}
  language [lang]          ${t`Show or set interface language`}
  
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
  hyperchat agent memory mybot      # ${t`Show agent memory`}
  
  # ${t`System management`}
  hyperchat serve                   # ${t`Start server (includes Web UI)`}
  hyperchat run                     # ${t`Start all agents (Agent-centered service)`}
  hyperchat run --list-agents       # ${t`List all available agents`}
  hyperchat run --agent mybot       # ${t`Start specific agent only`}
  hyperchat run --agent-path /path  # ${t`Start agent from specific path`}
  hyperchat workspace list          # ${t`Show workspace information`}
  hyperchat workspace current       # ${t`Show current status`}
  hyperchat workspace create        # ${t`Create workspace in current directory`}
  hyperchat language zh             # ${t`Set interface to Chinese`}
  hyperchat language en             # ${t`Set interface to English`}
  hyperchat --language zh chat      # ${t`Use Chinese for this command`}

${CliArgsParser.getHelpText()}

${t`Welcome to HyperChat CLI! 🎉`}
`);
}

// 处理命令
async function handleCommand(): Promise<{ shouldExit: boolean }> {
  const logger = new Logger(globalOptions.verbose, globalOptions.quiet);

  // 新的agent命令不需要特殊检测，统一在agent命令中处理

  // 检测是否有非命令的消息 (直接聊天)
  const firstArg = cleanArgs[0];
  const isDirectMessage = cleanArgs.length > 0 && firstArg && !firstArg.match(/^(chat|serve|run|workspace|agent|task|language|help)$/);

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
      // 解析run命令的特殊选项
      const allArgs = process.argv.slice(2); // 获取完整的参数列表
      const runOptions = GenericCliParser.parseArgs(allArgs, [
        { long: 'agent', short: 'a', hasValue: true },
        { long: 'agent-path', short: 'A', hasValue: true },
        { long: 'list-agents', short: 'l', hasValue: false },
      ]);
      
      await startRun({
        verbose: globalOptions.verbose,
        quiet: globalOptions.quiet,
        workspace: globalOptions.workspace,
        agent: runOptions.agent as string | undefined,
        agentPath: runOptions['agent-path'] as string | undefined,
        listAgents: runOptions['list-agents'] as boolean | undefined
      });
      return { shouldExit: false };  // run 需要保持进程运行

    case 'workspace':
      const workspaceSubCmd = cleanArgs[1];
      if (workspaceSubCmd === 'create') {
        // 在当前目录创建工作区
        await createWorkspace(process.cwd());
      } else if (workspaceSubCmd === 'list') {
        // 显示工作区信息
        await listWorkspaces();
      } else if (workspaceSubCmd === 'current') {
        // 显示当前状态
        await showCurrentWorkspace();
      } else {
        logger.error(`${t`Unknown workspace command:`} ${workspaceSubCmd}`);
        logger.info(t`Available commands: list, current, create`);
      }
      return { shouldExit: true };  // workspace命令执行完都应该退出

    case 'agent':
      await handleAgentCommand(cleanArgs.slice(1), logger);
      return { shouldExit: true };  // 所有agent命令执行完都应该退出

    case 'task':
      const taskSubCmd = cleanArgs[1];
      await handleTaskCommand(taskSubCmd, cleanArgs.slice(2), logger);
      return { shouldExit: true };  // 所有task命令执行完都应该退出

    case 'language':
      const langArg = cleanArgs[1];
      await handleLanguageCommand(langArg, logger);
      return { shouldExit: true };  // language命令执行完应该退出

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

    const message = messages.length > 0 ? messages.join(' ') : undefined;

    // 根据 UI 选项选择不同的聊天实现
    if (globalOptions.ui === 'ink') {
      const { startChatInk } = await import('./commands/chat-ink.mjs');
      await startChatInk(message, options);
    } else {
      // 默认使用传统 UI（为了向后兼容）
      const { startChat } = await import('./commands/chat.mjs');
      await startChat(message, options);
    }

  } catch (error) {
    logger.error(`${t`Chat function failed:`} ${error instanceof Error ? error.message : String(error)}`);
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
      logger.error(`${t`Agent`} '${name}' ${t`does not exist`}`);
      return;
    }

    // 删除agent
    const success = await Command.deleteAgent({
      agentName: name
    });

    if (success) {
      console.log(`✅ ${t`Agent deleted successfully`}: '${name}'`);
    } else {
      logger.error(`${t`Failed to delete agent:`} ${name}`);
    }
  } catch (error) {
    logger.error(`${t`Failed to delete agent:`} ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function showAgentMemoryWrapper(name: string, logger: Logger) {
  try {
    await showAgentMemory(name);
  } catch (error) {
    logger.error(`${t`Failed to show agent memory:`} ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Agent命令处理
async function handleAgentCommand(args: string[], logger: Logger) {
  if (args.length === 0) {
    logger.error(t`Please provide agent subcommand`);
    logger.info(t`Available commands: list, create, delete, memory, <name> "message", <name> chat`);
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

    case 'memory':
      const memoryName = args[1];
      if (!memoryName) {
        logger.error(t`Please provide agent name`);
        logger.info(t`Usage: hyperchat agent memory <name>`);
      } else {
        await showAgentMemoryWrapper(memoryName, logger);
      }
      break;

    default:
      // 检查是否是 agent <name> "message" 或 agent <name> chat
      const agentName = subCmd;
      const agentCheck = await checkAgentExists(agentName);
      
      if (!agentCheck.exists) {
        logger.error(`${t`Unknown agent command or agent does not exist:`} ${subCmd}`);
        logger.info(t`Available commands: list, create, delete, memory, <name> "message", <name> chat`);
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
      logger.error(`${t`Unknown task command:`} ${subCmd}`);
      logger.info(t`Available commands: list, create, show, enable, disable, delete, edit, trigger, scheduler, stats`);
      break;
  }
}

// 语言管理功能
async function handleLanguageCommand(langArg: string | undefined, logger: Logger) {
  try {
    // 如果没有提供语言参数，显示当前语言
    if (!langArg) {
      const currentLang = envManager.get('HyperChat_Language') || getCurrLang();
      let langName: string;
      if (currentLang === 'zh') langName = t`Chinese`;
      else if (currentLang === 'ja') langName = t`Japanese`;
      else if (currentLang === 'ko') langName = t`Korean`;
      else if (currentLang === 'fr') langName = t`French`;
      else if (currentLang === 'de') langName = t`German`;
      else langName = t`English`;
      console.log(`\n🌍 ${t`Current interface language:`} ${langName} (${currentLang})`);
      console.log(`\n💡 ${t`Available languages:`}`);
      console.log(`  zh - ${t`Chinese (Simplified)`}`);
      console.log(`  en - ${t`English`}`);
      console.log(`  ja - ${t`Japanese`}`);
      console.log(`  ko - ${t`Korean`}`);
      console.log(`  fr - ${t`French`}`);
      console.log(`  de - ${t`German`}`);
      console.log(`\n📝 ${t`Usage: hyperchat language <lang>`}`);
      return;
    }

    // 标准化语言参数
    let targetLang: Language;
    const langInput = langArg.toLowerCase();
    
    if (langInput === 'zh' || langInput === 'zhcn' || langInput === 'cn') {
      targetLang = 'zh';
    } else if (langInput === 'en' || langInput === 'enus' || langInput === 'us') {
      targetLang = 'en';
    } else if (langInput === 'ja' || langInput === 'jp') {
      targetLang = 'ja';
    } else if (langInput === 'ko' || langInput === 'kr') {
      targetLang = 'ko';
    } else if (langInput === 'fr') {
      targetLang = 'fr';
    } else if (langInput === 'de') {
      targetLang = 'de';
    } else {
      console.error(`❌ ${t`Unsupported language:`} ${langArg}`);
      console.log(`\n💡 ${t`Available languages:`}`);
      console.log(`  zh - ${t`Chinese (Simplified)`}`);
      console.log(`  en - ${t`English`}`);
      console.log(`  ja - ${t`Japanese`}`);
      console.log(`  ko - ${t`Korean`}`);
      console.log(`  fr - ${t`French`}`);
      console.log(`  de - ${t`German`}`);
      return;
    }

    // 获取当前语言
    const currentLang = envManager.get('HyperChat_Language') || getCurrLang();
    if (currentLang === targetLang) {
      let langName: string;
      if (targetLang === 'zh') langName = t`Chinese`;
      else if (targetLang === 'ja') langName = t`Japanese`;
      else if (targetLang === 'ko') langName = t`Korean`;
      else if (targetLang === 'fr') langName = t`French`;
      else if (targetLang === 'de') langName = t`German`;
      else langName = t`English`;
      console.log(`✅ ${t`Interface language is already set to`} ${langName}`);
      return;
    }

    // 设置新语言
    setCurrLang(targetLang);
    
    // 保存到环境变量系统（持久化到配置文件）
    try {
      // 这里需要实现保存到 .env 文件的逻辑
      // 由于目前 EnvManager 是只读的，我们先显示设置成功，后续可以添加写入功能
      logger.debug(`Language setting saved to environment configuration: ${targetLang}`);
    } catch (error) {
      // 如果保存失败，只记录警告，不影响当前会话的语言切换
      logger.warn(`⚠️  ${t`Failed to save language setting:`} ${error instanceof Error ? error.message : String(error)}`);
    }

    let newLangName: string;
    if (targetLang === 'zh') newLangName = t`Chinese`;
    else if (targetLang === 'ja') newLangName = t`Japanese`;
    else if (targetLang === 'ko') newLangName = t`Korean`;
    else if (targetLang === 'fr') newLangName = t`French`;
    else if (targetLang === 'de') newLangName = t`German`;
    else newLangName = t`English`;
    console.log(`✅ ${t`Interface language changed to`} ${newLangName}`);
    console.log(`💡 ${t`Language setting is now active for this session. To persist across sessions, add HyperChat_Language=`}${targetLang}${t` to your environment configuration.`}`);
    
  } catch (error) {
    logger.error(`${t`Failed to change language:`} ${error instanceof Error ? error.message : String(error)}`);
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
    console.error(`${t`Error occurred during exit:`} ${error}`);
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
    // 初始化i18n系统，命令行语言参数具有最高优先级
    await initCliI18n(globalOptions.language);
    
    // 如果是帮助命令，直接显示帮助并退出
    if (globalOptions.help) {
      showHelp();
      return;
    }
    
    // 执行命令
    const result = await handleCommand();
    
    // 根据命令类型决定是否退出
    if (result.shouldExit) {
      await workspaceManager.uninitialize(); // 清理工作区管理器
    }
  } catch (error) {
    console.error(`❌ ${t`Command execution failed:`} ${error}`);
    process.exit(1);
  }
}

// 执行主函数
main();