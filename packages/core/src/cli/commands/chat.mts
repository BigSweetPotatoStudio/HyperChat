/**
 * Chat 命令实现
 * 
 * 提供交互式 AI 聊天功能，类似 Claude Code 的体验
 */

import process from 'process';
import * as path from 'path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.mjs';
import { getAppSettingsManager } from '../../data/appSettingsService.mjs';
import { AiChannel } from '../../ai/ai.mjs';
import type { MyMessage } from '@dadigua/hyperchat-shared/types';
import { createReadline } from '../utils/readline.mjs';
import { AgentInstance } from '../../workspace/index.mjs';
import {
  createAIChannel
} from '../../utils/aiConfigHelper.mjs';
import {
  DEFAULT_AGENT_NAME
} from '../utils/agentDiscovery.mjs';
import { getAgent } from '../agentManager.mjs';
import { getBuiltinPrompts } from '../../ai/hyperchat-builtin-prompts.mjs';
import { t } from '../../i18n.mjs';
import { getMyUuid } from '../utils/util.mjs';
import { CONST } from '../../const.mjs';
import type { Logger as CLILogger } from '../utils/logger.mjs';
import { TaskQueue } from '../../utils/taskQueue.mjs';

// 创建聊天日志保存队列，确保按顺序写入，避免YAML文件并发问题
const chatLogQueue = new TaskQueue({ concurrency: 1 });

/**
 * 选择Agent（Agent-centered架构 - 使用CliAgentManager）
 * 优先级：agentPath > workspace + agentName > 默认Agent发现（本地 > 全局 > 创建）
 */
async function selectAgent(options: ChatOptions): Promise<AgentInstance> {
  // 使用新的CliAgentManager来获取Agent
  try {
    const agent = await getAgent({
      agentName: options.agent,
      agentPath: options.agentPath,
      workspace: options.workspace,
    });
    return agent;
  } catch (error) {
    // 如果Agent未找到，提供友好的错误信息
    const agentName = options.agent || DEFAULT_AGENT_NAME;

    // 获取所有可用的Agent列表
    const { discoverAgents } = await import('../utils/agentDiscovery.mjs');
    const availableAgents = await discoverAgents({
      workspace: options.workspace
    });

    if (availableAgents.length === 0) {
      throw new Error(`${t`No agents found in the system`}\n${t`Create an agent first using:`} hyperchat agent create ${agentName}`);
    } else {
      const availableNames = availableAgents.map(a => a.name).join(', ');
      throw new Error(`${t`Agent not found:`} ${agentName}\n${t`Available agents:`} ${availableNames}\n${t`Use:`} hyperchat agent <name> chat`);
    }
  }
}

/**
 * 显示Agent启动详细信息
 */
async function showAgentStartupInfo(agent: AgentInstance, logger: CLILogger): Promise<void> {
  const config = agent.getConfig();

  // 显示Agent基本配置信息
  logger.info(`  📋 ${t`Agent configuration:`}`);
  logger.info(`    ├─ ${t`Model:`} ${config.modelKey || t`inherit from workspace`}`);
  logger.info(`    ├─ ${t`Temperature:`} ${config.temperature !== undefined ? config.temperature : t`default`}`);
  logger.info(`    ├─ ${t`Max tokens:`} ${config.maxTokens || t`default`}`);
  logger.info(`    └─ ${t`Prompt length:`} ${config.prompt ? config.prompt.length : 0} ${t`characters`}`);

  // 显示MCP客户端状态（已由CliAgentManager启动）
  logger.info(`  🔧 ${t`MCP clients status:`}`);
  try {
    const clients = agent.getMCPClients();

    if (clients.length === 0) {
      logger.info(`    └─ ${t`No MCP clients configured`}`);
    } else {
      logger.info(`    ├─ ${t`Total clients:`} ${clients.length}`);

      // 显示每个MCP客户端的详细状态
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        const isLast = i === clients.length - 1;
        const prefix = isLast ? '    └─' : '    ├─';

        const statusEmoji = client.status === 'connected' ? '✅' :
          client.status === 'connecting' ? '🔄' :
            client.status === 'disabled' ? '⏸️' : '❌';

        const toolCount = client.tools?.length || 0;

        // 显示具体的配置来源路径
        let sourceLabel = '';
        const config = (client as any).config;
        if (config && config._sourcePath) {
          sourceLabel = ` (${config._sourcePath})`;
        }

        logger.info(`${prefix} ${statusEmoji} ${client.serverName}: ${client.status} (${toolCount} ${t`tools`})${sourceLabel}`);

        // 显示版本信息（如果已连接）
        if (client.status === 'connected' && client.version) {
          logger.info(`${isLast ? '      ' : '    │   '}└─ ${t`Version:`} ${client.version}`);
        }

        // 显示错误信息（如果连接失败）
        if (client.status === 'disconnected' && (client as any).lastError) {
          logger.info(`${isLast ? '      ' : '    │   '}└─ ${t`Error:`} ${(client as any).lastError}`);
        }
      }
    }
  } catch (error) {
    logger.warn(`    └─ ${t`MCP status error:`} ${error instanceof Error ? error.message : String(error)}`);
  }

  // 显示聊天记录统计
  try {
    const summary = await agent.getSummary();
    if (summary.chatLogsCount > 0) {
      logger.info(`  💬 ${t`Chat history:`} ${summary.chatLogsCount} ${t`conversations`}`);
    }
  } catch (error) {
    // 静默处理聊天记录统计错误
  }
}

// 获取聊天标签（基于第一个用户消息）
function getLabelByFirstUserContent(messages: Array<MyMessage>): string {
  let label = "";
  let firstUser = messages.find(
    (x) => x.role == "user",
  );
  let firstUserContent = (firstUser as any)?.content;
  if (typeof firstUserContent == "string") {
    label = firstUserContent;
  } else if (Array.isArray(firstUserContent)) {
    label = firstUserContent.find((x) => x.type == "text")?.text || "";
  }
  return label;
}

// 流式聊天处理器类
class StreamChatHandler {
  private displayedContentLength = 0;
  private displayedReasoningLength = 0;
  private reasoningFinished = false;
  private lastDisplayedToolCallsCount = 0;
  private lastDisplayedToolResultsCount = 0;
  private isFirstUpdate = true;
  private lastAssistantMessageId: string | undefined = undefined;

  constructor(private isInteractive: boolean = false) { }

  reset() {
    this.displayedContentLength = 0;
    this.displayedReasoningLength = 0;
    this.reasoningFinished = false;
    this.lastDisplayedToolCallsCount = 0;
    this.lastDisplayedToolResultsCount = 0;
    this.isFirstUpdate = true;
    this.lastAssistantMessageId = undefined;
  }

  // 重置当前assistant消息的显示状态
  private resetCurrentMessage() {
    this.displayedContentLength = 0;
    this.displayedReasoningLength = 0;
    this.reasoningFinished = false;
    this.isFirstUpdate = true;
  }

  // 重置新的对话轮次（工具计数器也重置）
  resetForNewRound() {
    this.resetCurrentMessage();
    this.lastDisplayedToolCallsCount = 0;
    this.lastDisplayedToolResultsCount = 0;
    this.lastAssistantMessageId = undefined;
  }

  async handleUpdate(aiChannel: AiChannel, env: any, chatKey: string) {
    // 保存聊天历史（使用队列确保顺序写入）
    try {
      if (env.agent) {
        chatLogQueue.add(async () => {
          await env.agent.setChatLog({
            key: chatKey,
            label: getLabelByFirstUserContent(aiChannel.messages),
            messages: aiChannel.messages,
            agentName: env.agent.getConfig().name || 'default',
            dateTime: Date.now(),
            chatType: "user",
            configOverrides: env.effectiveConfig,
          });
        });
      }
    } catch (error) {
      // 静默处理聊天历史保存错误
    }

    // 处理工具状态变化
    this.handleToolUpdates(aiChannel);

    // 处理AI消息流式显示
    this.handleAssistantMessage(aiChannel);
  }

  toolName2DisplayNameMap: { [name: string]: string } = {};
  private handleToolUpdates(aiChannel: AiChannel) {
    const lastMsg = aiChannel.lastMessage;

    // 只处理当前assistant消息的工具调用
    if (lastMsg.role === 'assistant') {
      const currentToolCalls = lastMsg.content_tool_calls || [];

      // 显示新的工具调用（所有工具调用都应该被显示）
      const pendingToolCalls = currentToolCalls;
      if (pendingToolCalls.length > this.lastDisplayedToolCallsCount) {
        for (let i = this.lastDisplayedToolCallsCount; i < pendingToolCalls.length; i++) {
          const tool = pendingToolCalls[i];
          const toolResult = aiChannel.messages.find(m => m.role === 'tool' && m.tool_call_id === tool.id);
          this.toolName2DisplayNameMap[tool.function.name] = tool.displayName || tool.originalName || tool.function.name;
          if (tool) {
            // 分离 reason 和其他参数
            const { reason, ...argsShow } = (tool.function.args || {}) as any;

            // 显示工具调用和 reason
            let toolDisplay = `🔧 ${t`Calling tool:`} ${tool.displayName || tool.originalName}`;
            if (reason) {
              toolDisplay += ` ${chalk.greenBright(reason)}`;
            }
            process.stdout.write('\n' + chalk.cyan(toolDisplay));
            process.stdout.write('\n');

            // 显示其他工具参数（排除 reason）
            if (Object.keys(argsShow).length > 0) {
              const argsStr = JSON.stringify(argsShow, null, 0).replace(/\n\s*/g, ' ');
              // 如果参数太长，截断显示
              const shortArgsStr = argsStr.length > 200 ? argsStr.substring(0, 200) + '...' : argsStr;
              process.stdout.write(chalk.gray(`  ${shortArgsStr}`));
            }
            process.stdout.write('\n');
          }
        }
        this.lastDisplayedToolCallsCount = pendingToolCalls.length;
      }
    }

    // 查找与当前助手消息相关的工具结果
    // 我们需要找到messageId大于lastAssistantMessageId的tool消息
    const allMessages = aiChannel.messages || [];
    const currentAssistantIndex = allMessages.findLastIndex(msg =>
      msg.role === 'assistant' && msg.messageId === this.lastAssistantMessageId
    );

    if (currentAssistantIndex >= 0) {
      // 只处理当前assistant消息之后的tool消息
      const recentToolMessages = allMessages.slice(currentAssistantIndex + 1).filter(msg => msg.role === 'tool');
      const completedToolMessages = recentToolMessages.filter(msg =>
        ((msg as any).content_status === 'success' ||
          (msg as any).content_status === 'error' ||
          (!(msg as any).content_status && (msg.content && (msg.content as any).length > 0))) &&
        (msg.content && Array.isArray(msg.content) && msg.content.length > 0)
      );

      if (completedToolMessages.length > this.lastDisplayedToolResultsCount) {
        for (let i = this.lastDisplayedToolResultsCount; i < completedToolMessages.length; i++) {
          const toolMsg = completedToolMessages[i];

          const toolName = this.toolName2DisplayNameMap[toolMsg.tool_call_name!] || 'Unknown Tool';

          if ((toolMsg as any).content_status === 'error') {
            process.stdout.write(chalk.red(`❌ ${t`Tool error:`} ${toolName}\n`));
          } else {
            process.stdout.write(chalk.green(`✅ ${t`Tool result:`} ${toolName}\n`));
          }

          // 显示工具结果内容
          const content = toolMsg.content;
          let contentStr = '';
          if (typeof content === 'string') {
            contentStr = content;
          } else if (Array.isArray(content)) {
            contentStr = content.map(item =>
              item.type === 'text' ? item.text : '[' + item.type + ']'
            ).join(' ');
          } else if (content && typeof content === 'object') {
            if ((content as any).text) {
              contentStr = (content as any).text;
            } else {
              contentStr = JSON.stringify(content);
            }
          }

          if (contentStr && contentStr.length > 0) {
            const shortContent = contentStr.length > 200 ? contentStr.substring(0, 200) + '...' : contentStr;
            process.stdout.write(chalk.gray(shortContent) + '\n');
          }
        }
        this.lastDisplayedToolResultsCount = completedToolMessages.length;
      }
    }
  }

  private handleAssistantMessage(aiChannel: AiChannel) {
    const lastMsg = aiChannel.lastMessage;

    if (lastMsg.role === 'assistant') {
      // 检测是否是新的assistant消息，如果是则重置显示状态
      if (lastMsg.messageId !== this.lastAssistantMessageId) {
        this.resetCurrentMessage();
        this.lastAssistantMessageId = lastMsg.messageId;
      }

      // 交互式模式：第一次更新时清除"思考中..."
      if (this.isInteractive && this.isFirstUpdate) {
        process.stdout.write('\r' + ' '.repeat(20) + '\r');
        this.isFirstUpdate = false;
      }

      // 流式显示thinking过程
      const reasoningContent = lastMsg.reasoning_content as string || '';
      if (reasoningContent.length > this.displayedReasoningLength) {
        const newReasoningPart = reasoningContent.slice(this.displayedReasoningLength);
        process.stdout.write(chalk.gray(newReasoningPart));
        this.displayedReasoningLength = reasoningContent.length;
      }

      // 流式显示主要回复内容
      const content = lastMsg.content as string;
      if (content.length > this.displayedContentLength) {
        // 计算是否有工具操作
        const allMessages = aiChannel.messages || [];
        const assistantMessages = allMessages.filter(msg => msg.role === 'assistant');
        const allToolCalls: any[] = [];
        assistantMessages.forEach(msg => {
          const toolCalls = msg.content_tool_calls || [];
          allToolCalls.push(...toolCalls);
        });

        const hasTools = allToolCalls.length > 0;
        if ((reasoningContent.length > 0 || hasTools) && !this.reasoningFinished) {
          process.stdout.write('\n\n');
          this.reasoningFinished = true;
        }
        const newContentPart = content.slice(this.displayedContentLength);
        process.stdout.write(newContentPart);
        this.displayedContentLength = content.length;
      }
    }
  }
}

export interface ChatOptions {
  agent?: string;
  workspace?: string;
  agentPath?: string;  // Agent路径，最高优先级
  model?: string;
  verbose?: boolean;
  quiet?: boolean;
  host?: string;
  port?: string;
  password?: string;
}

export async function startChat(initialMessage?: string, options: ChatOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);

  try {
    // 初始化CLI聊天环境
    logger.info(`🔍 ${t`Initializing HyperChat CLI...`} ${CONST.getVersion}`);

    // Agent-centered架构：智能选择和启动Agent
    logger.info(`🚀 ${t`Initializing Agent-centered chat environment...`}`);

    const currentWorkingDirectory = options.workspace ? path.resolve(options.workspace) : process.cwd();
    logger.info(`📍 ${t`Working directory:`} ${currentWorkingDirectory}`);

    // 智能选择Agent
    const agent = await selectAgent(options);
    const agentConfig = agent.getConfig();

    logger.info(`✅ ${t`Agent selected:`} ${agentConfig.name}`);

    // 显示Agent启动详细信息
    await showAgentStartupInfo(agent, logger);

    // 创建AI环境对象（Agent-centered版本）
    const appSettingsManager = getAppSettingsManager();
    const aiSettings = appSettingsManager.getAI();

    // 构建有效配置
    let effectiveConfig = {
      modelKey: agentConfig.modelKey || aiSettings?.models?.[0]?.key || 'default-model',
      allowMCPs: agentConfig.allowMCPs || [],
      blockMCPTools: agentConfig.blockMCPTools || [],
      isConfirmCallTool: agentConfig.isConfirmCallTool ?? false,
      temperature: agentConfig.temperature,
      maxTokens: agentConfig.maxTokens ?? 4000,
      prompt: agentConfig.prompt || '',
      maxContextTokens: agentConfig.maxContextTokens,
    };

    // 如果命令行指定了模型，覆盖配置
    if (options.model) {
      const availableModels = aiSettings?.models || [];
      const isModelAvailable = availableModels.some((m: any) => m.key === options.model);

      if (isModelAvailable) {
        effectiveConfig.modelKey = options.model;
        logger.info(`📋 ${t`Using AI model specified from command line:`} ${options.model}`);
      } else {
        logger.warn(`⚠️  ${t`Specified model`} '${options.model}' ${t`is not available, using default model`}`);
      }
    }

    // 显示最终使用的模型信息
    logger.info(`🤖 ${t`Model:`} ${effectiveConfig.modelKey}${agentConfig.modelKey && agentConfig.modelKey !== effectiveConfig.modelKey ? ` (${t`agent default:`} ${agentConfig.modelKey})` : ''}`);

    // 获取Agent的MCP客户端
    const mcpClients = agent.getMCPClients();

    // 显示 Agent 允许的 MCP 工具（使用封装的方法）
    const mcpToolsInfo = agent.getMCPTools();

    logger.info(`🛠️ ${t`Agent allowed tools:`} ${mcpToolsInfo.availableTools.length} ${t`available`} (${mcpToolsInfo.allowedMCPsCount} ${t`mcp`})`);
    if (mcpToolsInfo.availableTools.length > 0) {
      const toolNames = mcpToolsInfo.availableTools.map((tool: any) => tool.displayName || tool.name).slice(0, 3);
      const more = mcpToolsInfo.availableTools.length > 3 ? ` (+${mcpToolsInfo.availableTools.length - 3} more)` : '';
      logger.info(`    📋 ${toolNames.join(', ')}${more}`);

    }

    // 创建AI通道
    const aiChannel = createAIChannel();

    // 创建环境对象（模拟AIEnvironment）
    const env = {
      agent,
      mcpClients: mcpClients.map(client => client.toJSON()),
      effectiveConfig,
      workspace: undefined // Agent-centered架构不依赖workspace
    };



    // 如果有初始消息，处理并退出
    if (initialMessage) {
      logger.info(`💬 ${t`Processing message:`} ${initialMessage}`);

      const userMessage: MyMessage = {
        role: 'user',
        content: initialMessage,
        content_date: Date.now()
      };
      aiChannel.addMessage(userMessage);

      // 生成聊天Key
      const chatKey = getMyUuid();

      console.log(`\n🤖 ${t`AI reply:`}`);


      // 构建系统提示词
      const workspacePath = process.cwd();
      const systemPrompt = getBuiltinPrompts(
        env.effectiveConfig.prompt,
        workspacePath,
        env.agent.getAgentPath()
      ).prompt;

      // 创建流式聊天处理器
      const chatHandler = new StreamChatHandler(false); // 非交互式模式

      await aiChannel.completion({
        maxContextTokens: env.effectiveConfig.maxContextTokens,
        modelKey: env.effectiveConfig.modelKey,
        prompt: systemPrompt,
        allowMCPs: env.effectiveConfig.allowMCPs,
        blockMCPTools: env.effectiveConfig.blockMCPTools,
        isConfirmCallTool: env.effectiveConfig.isConfirmCallTool,
        temperature: env.effectiveConfig.temperature,
        maxTokens: env.effectiveConfig.maxTokens,
        agentInstance: env.agent, // 直接传递AgentInstance对象
        onUpdate: () => {
          chatHandler.handleUpdate(aiChannel, env, chatKey);
        }
      });

      console.log('\n'); // 换行
      return;
    }

    // 检查是否为管道输入或非交互式环境
    if (!process.stdin.isTTY) {
      logger.info(`💡 ${t`Non-interactive environment detected, exiting after processing`}`);
      return;
    }

    // 交互式聊天模式
    logger.info(`💬 ${t`Starting interactive chat...`}`);
    logger.info(`💡 ${t`Type /exit to exit, /help for help, /clear to clear chat history`}`);
    console.log();

    const rl = createReadline();

    // 为交互式聊天生成chatKey
    let interactiveChatKey = getMyUuid();

    try {
      while (true) {
        const input = await rl.question(`🧑 ${t`You:`} `);

        if (input.trim() === '/exit') {
          logger.info(`👋 ${t`Goodbye!`}`);
          break;
        }

        if (input.trim() === '/help') {
          console.log(`\n📋 ${t`Chat commands:`}`);
          console.log(`  /exit             - ${t`Exit chat`}`);
          console.log(`  /help             - ${t`Show help`}`);
          console.log(`  /clear            - ${t`Clear chat history`}`);
          console.log(`  /model            - ${t`Show current model`}`);
          console.log(`  /tools            - ${t`Show available MCP tools`}`);
          console.log(`  /toolinfo <name>  - ${t`Show detailed info for a specific tool`}`);
          console.log();
          continue;
        }

        if (input.trim() === '/clear') {
          // 重新创建AI通道并添加系统消息
          const newAiChannel = createAIChannel();
          // 替换当前通道
          Object.assign(aiChannel, newAiChannel);
          // 重新生成chatKey用于新的对话
          interactiveChatKey = getMyUuid();
          console.log(`✅ ${t`Chat history cleared`}\n`);
          continue;
        }

        if (input.trim() === '/model') {
          console.log(`\n🤖 ${t`Current model:`} ${env.effectiveConfig.modelKey}\n`);
          continue;
        }

        if (input.trim() === '/tools') {
          const mcpTools = mcpClients.flatMap((client: any) => client.tools || []);
          console.log(`\n🔧 ${t`Available tools`} (${mcpTools.length} ${t`items`}):`);

          if (mcpTools.length === 0) {
            console.log(`  ${t`No tools available`}`);
          } else {
            // 按 client 分组显示工具
            const toolsByClient: { [clientName: string]: any[] } = {};
            mcpTools.forEach((tool: any) => {
              if (!toolsByClient[tool.clientName]) {
                toolsByClient[tool.clientName] = [];
              }
              toolsByClient[tool.clientName].push(tool);
            });

            Object.entries(toolsByClient).forEach(([clientName, tools]) => {
              console.log(`\n  📦 ${clientName} (${tools.length} ${t`tools`}):`);
              tools.forEach((tool) => {
                console.log(`    • ${tool.name}`);
                console.log(`      ${tool.description || t`No description`}`);

                // 显示输入参数（如果有）
                if (tool.inputSchema?.properties) {
                  const params = Object.keys(tool.inputSchema.properties);
                  if (params.length > 0) {
                    console.log(`      ${t`Parameters:`} ${params.join(', ')}`);
                  }
                }
                console.log();
              });
            });
          }

          console.log();
          continue;
        }

        // 处理 /toolinfo 命令
        if (input.trim().startsWith('/toolinfo')) {
          const parts = input.trim().split(/\s+/);
          if (parts.length < 2) {
            console.log(`\n❌ ${t`Please specify tool name:`} /toolinfo <tool_name>`);
            console.log();
            continue;
          }

          const toolName = parts[1];

          const mcpTools = mcpClients.flatMap((client) => client.tools || []);
          const tool = mcpTools.find((t: any) =>
            t.name === toolName ||
            t.displayName === toolName ||
            t.originalName === toolName
          );

          if (!tool) {
            console.log(`\n❌ ${t`Tool not found:`} ${toolName}`);
            console.log(`💡 ${t`Use /tools to see all available tools`}`);
            console.log();
            continue;
          }

          console.log(`\n🔍 ${t`Tool Details:`}`);
          console.log(`  📦 ${t`Client:`} ${tool.clientName}`);
          console.log(`  🏷️  ${t`Name:`} ${tool.displayName || tool.name}`);
          console.log(`  📝 ${t`Description:`} ${tool.description || t`No description`}`);

          if (tool.inputSchema?.properties) {
            console.log(`  📋 ${t`Input Schema:`}`);
            const properties = tool.inputSchema.properties;
            Object.entries(properties).forEach(([paramName, paramSchema]: [string, any]) => {
              const required = (tool as any).inputSchema.required?.includes(paramName) ? ' (required)' : '';
              const type = paramSchema.type || 'unknown';
              const description = paramSchema.description || '';
              console.log(`    • ${paramName} (${type})${required}`);
              if (description) {
                console.log(`      ${description}`);
              }
            });
          }

          console.log(`  🛠️  ${t`Full Name:`} ${tool.name}`);
          console.log(`  📂 ${t`Workspace:`} ${tool.workspacePath}`);
          console.log();
          continue;
        }

        if (!input.trim()) {
          continue;
        }

        // 添加用户消息
        const userMessage: MyMessage = {
          role: 'user',
          content: input.trim(),
          content_date: Date.now()
        };
        aiChannel.addMessage(userMessage);

        // 显示AI回复
        console.log(`\n🤖 ${t`AI:`} `);
        process.stdout.write(t`Thinking...`);

        try {
          // 构建系统提示词
          const workspacePath = process.cwd();
          const systemPrompt = getBuiltinPrompts(
            env.effectiveConfig.prompt,
            workspacePath,
            env.agent.getAgentPath()
          ).prompt;

          // 创建交互式聊天处理器
          const chatHandler = new StreamChatHandler(true); // 交互式模式

          await aiChannel.completion({
            ...env.effectiveConfig,
            prompt: systemPrompt,
            agentInstance: env.agent, // 直接传递AgentInstance对象
            onUpdate: () => {
              chatHandler.handleUpdate(aiChannel, env, interactiveChatKey);
            }
          });

          console.log('\n'); // 换行
        } catch (error) {
          console.log(`\n❌ ${t`Error:`}`, error instanceof Error ? error.message : String(error));
          console.log();
        }
      }
    } catch (readlineError) {
      // 处理 readline 相关错误
      if (readlineError instanceof Error && readlineError.message.includes('closed')) {
        logger.info(`💡 ${t`Input stream closed, exiting chat`}`);
      } else {
        logger.error(`${t`Chat input error:`} ${readlineError instanceof Error ? readlineError.message : String(readlineError)}`);
      }
    }

    rl.close();

  } catch (error) {
    logger.error(`${t`Chat initialization failed:`} ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error && error.message.includes('未找到可用的AI模型配置')) {
      logger.info(`\n💡 ${t`Please run the following command to configure AI model first:`}`);
    }

    process.exit(1);
  }
}

