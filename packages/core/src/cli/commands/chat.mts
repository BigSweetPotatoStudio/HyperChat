/**
 * Chat 命令实现
 * 
 * 提供交互式 AI 聊天功能，类似 Claude Code 的体验
 */

import process from 'process';
import path from 'path';
import chalk from 'chalk';
import { Logger } from '../utils/logger.mjs';
import { Logger as LoggerClass } from '../../log.mjs';
import { Command } from '../../command.mjs';
import { AiChannel } from '../../ai/ai.mjs';
import type { MyMessage } from '@dadigua/hyperchat-shared/types';
import { createReadline } from '../utils/readline.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import {
  initializeAIEnvironment,
  createAIChannel,
  // addSystemMessage,
  logAIConfig
} from '../../utils/aiConfigHelper.mjs';
import { getBuiltinPrompts } from '../../ai/hyperchat-builtin-prompts.mjs';
import { t } from '../../i18n.mjs';
import { getMyUuid } from '../utils/util.mjs';
import { CONST } from '../../const.mjs';


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
    // 保存聊天历史
    try {
      if (env.agent) {
        const saveAction = env.agent.setChatLog({
          key: chatKey,
          label: getLabelByFirstUserContent(aiChannel.messages),
          messages: aiChannel.messages,
          agentName: env.agent.getConfig().name || 'default',
          dateTime: Date.now(),
          chatType: "user",
          configOverrides: env.effectiveConfig,
        });
        // 非交互式模式使用await，交互式模式不await
        if (!this.isInteractive) {
          await saveAction;
        }
      }
    } catch (error) {
      // 静默处理聊天历史保存错误
    }

    // 处理工具状态变化
    this.handleToolUpdates(aiChannel);

    // 处理AI消息流式显示
    this.handleAssistantMessage(aiChannel);
  }

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
          if (tool) {
            process.stdout.write('\n' + chalk.cyan(`🔧 ${t`Calling tool:`} ${tool.displayName || tool.originalName}`));
            process.stdout.write('\n');
            // 显示工具参数
            const args = tool.function.args;
            if (args && Object.keys(args).length > 0) {
              const argsStr = JSON.stringify(args, null, 2);
              // const shortArgsStr = argsStr.length > 100 ? argsStr.substring(0, 100) + '...' : argsStr;
              process.stdout.write(chalk.gray(`${argsStr}`));
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

          // 找到对应的工具调用信息
          const currentToolCalls = lastMsg.role === 'assistant' ? (lastMsg.content_tool_calls || []) : [];
          const correspondingTool = currentToolCalls.find(tool =>
            tool.id === toolMsg.tool_call_id ||
            tool.function?.name === toolMsg.tool_call_name
          );

          const toolName = correspondingTool?.displayName ||
            correspondingTool?.originalName ||
            toolMsg.tool_call_name ||
            'Unknown Tool';

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
            // const shortContent = contentStr.length > 200 ? contentStr.substring(0, 200) + '...' : contentStr;
            process.stdout.write(chalk.gray(contentStr) + '\n');
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

    // Chat需要完整服务（MCP工具、AI聊天）
    const currentWorkingDirectory = options.workspace ? path.resolve(options.workspace) : process.cwd();
    await workspaceManager.initialize(currentWorkingDirectory);

    const currentWorkspacePath = workspaceManager.getCurrentWorkspacePath();

    logger.info(`📍 ${t`Working directory:`} ${currentWorkingDirectory}`);

    if (currentWorkingDirectory !== currentWorkspacePath) {
      logger.info(`💡 ${t`Configuration loaded from workspace above`}`);
    }

    await workspaceManager.start();
    logger.info(`✅ ${t`Workspace services started`}`);

    // 初始化 AI 环境
    const env = await initializeAIEnvironment({
      agentName: options.agent,
      workspacePath: workspaceManager.getCurrentWorkspacePath(),
    });

    // 如果命令行指定了模型，覆盖配置
    if (options.model) {
      const appSettings = await Command.getAppSettings();
      const availableModels = appSettings.ai?.models || [];
      const isModelAvailable = availableModels.some((m: any) => m.key === options.model);

      if (isModelAvailable) {
        env.effectiveConfig.modelKey = options.model;
        logger.info(`📋 ${t`Using AI model specified from command line:`} ${options.model}`);
      } else {
        logger.warn(`⚠️  ${t`Specified model`} '${options.model}' ${t`is not available, using default model`}`);
      }
    }

    // 记录配置信息  
    logAIConfig(LoggerClass, env);

    // 获取工作区的Agent数量
    const agentsSummary = await env.workspace.getAllAgentsSummary();

    logger.info(`👥 ${t`Current workspace Agent count:`} ${agentsSummary.length}`);

    // 显示详细的 MCP 工具统计
    const mcpClients = env.workspace.getMcpClients();
    logger.info(`🔧 ${t`Current workspace available MCP clients:`} ${mcpClients.length}`);

    const agentConfig = env.agent.getConfig();

    // 显示详细的 Agent 信息
    logger.info(`🌐 ${t`Current Agent:`} ${agentConfig.name}`);

    // 显示 Agent 使用的模型（区分是 Agent 配置的还是继承的）
    if (agentConfig.modelKey && agentConfig.modelKey === env.effectiveConfig.modelKey) {
      logger.info(`🤖 ${t`Model:`} ${env.effectiveConfig.modelKey} (${t`from agent config`})`);
    } else {
      logger.info(`🤖 ${t`Model:`} ${env.effectiveConfig.modelKey}${agentConfig.modelKey ? ` (${t`agent default:`} ${agentConfig.modelKey})` : ''}`);
    }

    // 显示 Agent 允许的 MCP 工具
    let agentAllowedMCPs = new Set(agentConfig.allowMCPs.map(x => x.split(" > ")[0])).size;
    if (agentConfig.allowMCPs && agentConfig.allowMCPs.length > 0) {
      const allowedMCPs = agentConfig.allowMCPs;
      const availableTools = env.mcpClients.flatMap((client: any) => client.tools || []);
      const matchedTools = availableTools.filter((tool: any) =>
        allowedMCPs.some(allowed =>
          tool.name === allowed ||
          tool.displayName === allowed ||
          tool.originalName === allowed ||
          tool.clientName === allowed
        )
      );
      logger.info(`🛠️ ${t`Agent allowed tools:`} ${agentAllowedMCPs} ${t`configured`}, ${matchedTools.length} ${t`available`}`);
      if (matchedTools.length > 0) {
        const toolNames = matchedTools.map((tool: any) => tool.displayName || tool.name).slice(0, 3);
        const more = matchedTools.length > 3 ? ` (+${matchedTools.length - 3} more)` : '';
        logger.info(`    📋 ${toolNames.join(', ')}${more}`);
      }
    } else {
      logger.info(`🛠️ ${t`Agent allowed tools:`} ${t`All available tools`} (${env.mcpClients.flatMap((client: any) => client.tools || []).length})`);
    }
    // 创建AI通道
    const aiChannel = createAIChannel();



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
      const agentName = env.agent.getConfig().name || "";
      const systemPrompt = getBuiltinPrompts(
        env.workspace.workspacePath,
        env.effectiveConfig.prompt,
        agentName,
        env.workspace.getAgentScope(agentName) || "workspace",
      ).prompt;

      // 创建流式聊天处理器
      const chatHandler = new StreamChatHandler(false); // 非交互式模式

      await aiChannel.completion({
        modelKey: env.effectiveConfig.modelKey,
        prompt: systemPrompt,
        allowMCPs: env.effectiveConfig.allowMCPs,
        isConfirmCallTool: env.effectiveConfig.isConfirmCallTool,
        temperature: env.effectiveConfig.temperature,
        maxAttachedDialogs: env.effectiveConfig.maxAttachedDialogs,
        maxTokens: env.effectiveConfig.maxTokens,
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
          const mcpTools = env.mcpClients.flatMap((client: any) => client.tools || []);
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

          const mcpTools = env.mcpClients.flatMap((client) => client.tools || []);
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
          const agentName = env.agent.getConfig().name || "";
          const systemPrompt = getBuiltinPrompts(
            env.workspace.workspacePath,
            env.effectiveConfig.prompt,
            agentName,
            env.workspace.getAgentScope(agentName) || "workspace"
          ).prompt;

          // 创建交互式聊天处理器
          const chatHandler = new StreamChatHandler(true); // 交互式模式

          await aiChannel.completion({
            ...env.effectiveConfig,
            prompt: systemPrompt,
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

