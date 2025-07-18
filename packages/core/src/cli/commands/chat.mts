/**
 * Chat 命令实现
 * 
 * 提供交互式 AI 聊天功能，类似 Claude Code 的体验
 */

import process from 'process';
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
  addSystemMessage,
  logAIConfig
} from '../../utils/aiConfigHelper.mjs';
import { t } from '../../i18n.mjs';


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
    logger.info(`🔍 ${t`Initializing HyperChat CLI...`}`);

    // Chat需要完整服务（MCP工具、AI聊天）
    const currentWorkingDirectory = options.workspace || process.cwd();
    await workspaceManager.initialize(currentWorkingDirectory);
    
    const currentWorkspacePath = workspaceManager.getCurrentWorkspacePath();
    
    logger.info(`📍 ${t`Working directory:`} ${currentWorkingDirectory}`);
    logger.info(`🎯 ${t`Using workspace:`} ${currentWorkspacePath}`);
    if (currentWorkingDirectory !== currentWorkspacePath) {
      logger.info(`💡 ${t`Configuration loaded from workspace above`}`);
    }

    await workspaceManager.start();
    logger.info(`✅ ${t`Workspace services started`}`);

    // 初始化 AI 环境
    const env = await initializeAIEnvironment({
      agentName: options.agent,
      workspacePath: workspaceManager.getCurrentWorkspacePath(),
      needMCP: true
    });

    // 如果命令行指定了模型，覆盖配置
    if (options.model) {
      const availableModels = env.aiSettings?.models || [];
      const isModelAvailable = availableModels.some(m => m.key === options.model);

      if (isModelAvailable) {
        env.effectiveConfig.modelKey = options.model;
        logger.info(`📋 ${t`Using AI model specified from command line:`} ${options.model}`);
      } else {
        logger.warn(`⚠️  ${t`Specified model`} '${options.model}' ${t`is not available, using default model`}`);
      }
    }

    // 记录配置信息  
    logAIConfig(LoggerClass, env, 'CLI Chat');

    // 获取有效配置的帮助函数
    const getEffectiveConfig = () => {
      // 如果命令行指定了模型，需要更新 allowMCPs
      let allowMCPs = env.effectiveConfig.allowMCPs;
      if (allowMCPs.length === 0) {
        allowMCPs = env.mcpClients.map((c: any) => c.serverName);
      }

      return {
        ...env.effectiveConfig,
        allowMCPs
      };
    };
    const effectiveConfig = getEffectiveConfig();
    logger.info(`🤖 ${t`Using model:`} ${effectiveConfig.modelKey}`);
    // 获取工作区的Agent数量
    const agentsSummary = await env.workspace.getAllAgentsSummary();

    logger.info(`👥 ${t`Current workspace Agent count:`} ${agentsSummary.length}`);
    logger.info(`🔧 ${t`Current workspace available MCP tools count:`} ${env.workspace.getMcpClients().length}`);
    if (env.agentConfig?.name) {
      logger.info(`🌐 ${t`Current Agent:`} ${env.agentConfig?.name}`);
    }
    // 创建AI通道
    const aiChannel = createAIChannel(env);

    // 添加系统消息
    const mcpToolCount = env.mcpClients.flatMap((client: any) => client.tools || []).length;
    addSystemMessage(aiChannel, env, `你是HyperChat CLI助手。当前工作区: ${env.workspace.workspacePath}。可用工具: ${mcpToolCount}个MCP工具。请用中文回复。`);

    // 如果有初始消息，处理并退出
    if (initialMessage) {
      logger.info(`💬 ${t`Processing message:`} ${initialMessage}`);

      const userMessage: MyMessage = {
        role: 'user',
        content: initialMessage,
        content_date: Date.now()
      };
      aiChannel.addMessage(userMessage);

      console.log(`\n🤖 ${t`AI reply:`}`);


      // 流式输出
      let displayedContentLength = 0;
      let displayedReasoningLength = 0;
      let reasoningFinished = false;

      await aiChannel.completion({
        modelKey: effectiveConfig.modelKey,
        prompt: effectiveConfig.prompt,
        allowMCPs: effectiveConfig.allowMCPs,
        isConfirmCallTool: effectiveConfig.isConfirmCallTool,
        temperature: effectiveConfig.temperature,
        maxAttachedDialogs: effectiveConfig.maxAttachedDialogs,
        maxTokens: effectiveConfig.maxTokens,
        onUpdate: () => {
          const lastMsg = aiChannel.lastMessage;
          if (lastMsg.role === 'assistant') {
            // 显示reasoning_content（浅灰色）
            const reasoningContent = lastMsg.reasoning_content as string || '';
            if (reasoningContent.length > displayedReasoningLength) {
              const newReasoningPart = reasoningContent.slice(displayedReasoningLength);
              process.stdout.write('\x1b[90m' + newReasoningPart + '\x1b[0m'); // 浅灰色
              displayedReasoningLength = reasoningContent.length;
            }

            // 显示主要content（正常颜色）
            const content = lastMsg.content as string;
            if (content.length > displayedContentLength) {
              // 如果reasoning_content存在且还没有添加分隔符，先添加换行
              if (reasoningContent.length > 0 && !reasoningFinished) {
                process.stdout.write('\n');
                reasoningFinished = true;
              }
              const newContentPart = content.slice(displayedContentLength);
              process.stdout.write(newContentPart);
              displayedContentLength = content.length;
            }
          }
        }
      });

      console.log('\n'); // 换行
      return;
    }

    // 交互式聊天模式
    logger.info(`💬 ${t`Starting interactive chat...`}`);
    logger.info(`💡 ${t`Type /exit to exit, /help for help, /clear to clear chat history`}`);
    console.log();

    const rl = createReadline();

    while (true) {
      const input = await rl.question(`🧑 ${t`You:`} `);

      if (input.trim() === '/exit') {
        logger.info(`👋 ${t`Goodbye!`}`);
        break;
      }

      if (input.trim() === '/help') {
        console.log(`\n📋 ${t`Chat commands:`}`);
        console.log(`  /exit   - ${t`Exit chat`}`);
        console.log(`  /help   - ${t`Show help`}`);
        console.log(`  /clear  - ${t`Clear chat history`}`);
        console.log(`  /model  - ${t`Show current model`}`);
        console.log(`  /tools  - ${t`Show available MCP tools`}`);
        console.log();
        continue;
      }

      if (input.trim() === '/clear') {
        // 重新创建AI通道并添加系统消息
        const newAiChannel = createAIChannel(env);
        const mcpToolCount = env.mcpClients.flatMap((client: any) => client.tools || []).length;
        addSystemMessage(newAiChannel, env, `你是HyperChat CLI助手。当前工作区: ${env.workspace.workspacePath}。可用工具: ${mcpToolCount}个MCP工具。请用中文回复。`);
        // 替换当前通道
        Object.assign(aiChannel, newAiChannel);
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
        mcpTools.forEach((tool: any) => {
          console.log(`  - ${tool.name}: ${tool.description}`);
        });
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
        // 流式输出
        let displayedContentLength = 0;
        let displayedReasoningLength = 0;
        let isFirstUpdate = true;
        let reasoningFinished = false;


        const effectiveConfig = getEffectiveConfig();
        await aiChannel.completion({
          modelKey: effectiveConfig.modelKey,
          prompt: effectiveConfig.prompt,
          allowMCPs: effectiveConfig.allowMCPs,
          isConfirmCallTool: effectiveConfig.isConfirmCallTool,
          temperature: effectiveConfig.temperature,
          maxAttachedDialogs: effectiveConfig.maxAttachedDialogs,
          maxTokens: effectiveConfig.maxTokens,
          onUpdate: () => {
            const lastMsg = aiChannel.lastMessage;
            if (lastMsg.role === 'assistant') {
              // 第一次更新时清除"思考中..."
              if (isFirstUpdate) {
                process.stdout.write('\r' + ' '.repeat(20) + '\r');
                isFirstUpdate = false;
              }

              // 显示reasoning_content（浅灰色）
              const reasoningContent = lastMsg.reasoning_content as string || '';
              if (reasoningContent.length > displayedReasoningLength) {
                const newReasoningPart = reasoningContent.slice(displayedReasoningLength);
                process.stdout.write('\x1b[90m' + newReasoningPart + '\x1b[0m'); // 浅灰色
                displayedReasoningLength = reasoningContent.length;
              }

              // 显示主要content（正常颜色）
              const content = lastMsg.content as string;
              if (content.length > displayedContentLength) {
                // 如果reasoning_content存在且还没有添加分隔符，先添加换行
                if (reasoningContent.length > 0 && !reasoningFinished) {
                  process.stdout.write('\n');
                  reasoningFinished = true;
                }
                const newContentPart = content.slice(displayedContentLength);
                process.stdout.write(newContentPart);
                displayedContentLength = content.length;
              }
            }
          }
        });

        console.log('\n'); // 换行
      } catch (error) {
        console.log(`\n❌ ${t`Error:`}`, error instanceof Error ? error.message : String(error));
        console.log();
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

