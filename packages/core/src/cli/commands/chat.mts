/**
 * Chat 命令实现
 * 
 * 提供交互式 AI 聊天功能，类似 Claude Code 的体验
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Logger as LoggerClass } from '../../log.mjs';
import { Command } from '../../command.mjs';
import { AiChannel } from '@dadigua/hyperchat-shared/ai';
import type { MyMessage } from '@dadigua/hyperchat-shared/types';
import { createReadline } from '../utils/readline.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import {
  initializeAIEnvironment,
  createAIChannel,
  addSystemMessage,
  logAIConfig
} from '../../utils/aiConfigHelper.mjs';


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
    logger.info('🔍 初始化 HyperChat CLI...');

    // Chat需要完整服务（MCP工具、AI聊天）
    await workspaceManager.initialize(options.workspace, false);
    logger.info(`🎯 使用工作区: ${workspaceManager.getCurrentWorkspacePath()}`);

    await workspaceManager.start();
    logger.info(`✅ 工作区服务已启动`);

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
        logger.info(`📋 使用命令行指定的AI模型: ${options.model}`);
      } else {
        logger.warn(`⚠️  指定的模型 '${options.model}' 不可用，使用默认模型`);
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
    logger.info(`🤖 使用模型: ${effectiveConfig.modelKey}`);
    // 获取工作区的Agent数量
    const agentsSummary = await env.workspace.getAllAgentsSummary();

    logger.info(`👥 当前工作区Agent数量: ${agentsSummary.length}`);
    logger.info(`🔧 当前工作区可用MCP工具数量: ${env.workspace.getAllMcpClients().length}`);
    if (env.agentConfig?.name) {
      logger.info(`🌐 当前Agent: ${env.agentConfig?.name}`);
    }
    // 创建AI通道
    const aiChannel = createAIChannel(env);

    // 添加系统消息
    addSystemMessage(aiChannel, env, `你是HyperChat CLI助手。当前工作区: ${env.workspace.workspacePath}。可用工具: ${env.mcpTools.length}个MCP工具。请用中文回复。`);

    // 如果有初始消息，处理并退出
    if (initialMessage) {
      logger.info(`💬 处理消息: ${initialMessage}`);

      const userMessage: MyMessage = {
        role: 'user',
        content: initialMessage,
        content_date: Date.now()
      };
      aiChannel.addMessage(userMessage);

      console.log('\n🤖 AI 回复:');


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
    logger.info('💬 开始交互式聊天...');
    logger.info('💡 输入 /exit 退出，/help 查看帮助，/clear 清空对话历史');
    console.log();

    const rl = createReadline();

    while (true) {
      const input = await rl.question('🧑 你: ');

      if (input.trim() === '/exit') {
        logger.info('👋 再见！');
        break;
      }

      if (input.trim() === '/help') {
        console.log('\n📋 聊天命令:');
        console.log('  /exit   - 退出聊天');
        console.log('  /help   - 显示帮助');
        console.log('  /clear  - 清空对话历史');
        console.log('  /model  - 显示当前使用的模型');
        console.log('  /tools  - 显示可用的MCP工具');
        console.log();
        continue;
      }

      if (input.trim() === '/clear') {
        // 重新创建AI通道并添加系统消息
        const newAiChannel = createAIChannel(env);
        addSystemMessage(newAiChannel, env, `你是HyperChat CLI助手。当前工作区: ${env.workspace.workspacePath}。可用工具: ${env.mcpTools.length}个MCP工具。请用中文回复。`);
        // 替换当前通道
        Object.assign(aiChannel, newAiChannel);
        console.log('✅ 对话历史已清空\n');
        continue;
      }

      if (input.trim() === '/model') {
        console.log(`\n🤖 当前模型: ${env.effectiveConfig.modelKey}\n`);
        continue;
      }

      if (input.trim() === '/tools') {
        console.log(`\n🔧 可用工具 (${env.mcpTools.length}个):`);
        env.mcpTools.forEach((tool: any) => {
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
      console.log('\n🤖 AI: ');
      process.stdout.write('思考中...');

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
        console.log('\n❌ 错误:', error instanceof Error ? error.message : String(error));
        console.log();
      }
    }

    rl.close();

  } catch (error) {
    logger.error('聊天初始化失败:', error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.message.includes('未找到可用的AI模型配置')) {
      logger.info('\n💡 请先运行以下命令配置AI模型:');
    }

    process.exit(1);
  }
}

