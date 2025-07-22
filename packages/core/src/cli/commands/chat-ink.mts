/**
 * Chat 命令实现 - 使用 Ink UI 库
 * 
 * 提供基于 React 组件的现代化终端 UI 体验
 */

import React from 'react';
import { render } from 'ink';
import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Logger as LoggerClass } from '../../log.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import {
  initializeAIEnvironment,
  createAIChannel,
  addSystemMessage,
  logAIConfig
} from '../../utils/aiConfigHelper.mjs';
import { t } from '../../i18n.mjs';
import ChatUI from '../ui/ChatUI.js';
import type { MyMessage, HyperToolCall } from '@dadigua/hyperchat-shared/types';

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

export async function startChatInk(initialMessage?: string, options: ChatOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);

  // 检查是否支持 raw mode（检测 stdin 是否是 TTY）
  if (!process.stdin.isTTY) {
    logger.info(`💡 ${t`Raw mode not supported (non-TTY input), falling back to legacy UI`}`);
    const { startChat } = await import('./chat.mjs');
    return await startChat(initialMessage, options);
  }

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
    const mcpClients = env.workspace.getMcpClients();
    const totalTools = mcpClients.flatMap((client: any) => client.tools || []).length;

    logger.info(`👥 ${t`Current workspace Agent count:`} ${agentsSummary.length}`);
    logger.info(`🔧 ${t`Current workspace available MCP clients:`} ${mcpClients.length}`);
    logger.info(`🛠️  ${t`Total available MCP tools:`} ${totalTools}`);
    if (env.agentConfig?.name) {
      logger.info(`🌐 ${t`Current Agent:`} ${env.agentConfig?.name}`);
    }

    // 准备工作区信息
    const workspaceInfo = {
      path: env.workspace.workspacePath,
      agentCount: agentsSummary.length,
      mcpClientsCount: mcpClients.length,
      totalToolsCount: totalTools,
      currentAgent: env.agentConfig?.name,
      currentModel: effectiveConfig.modelKey
    };

    // 处理用户输入的函数
    const handleUserInput = async (userInput: string): Promise<void> => {
      const chatUI = (globalThis as any).__chatUI;
      if (!chatUI) return;

      // 创建AI通道
      const aiChannel = createAIChannel(env);
      
      // 添加系统消息
      const mcpToolCount = env.mcpClients.flatMap((client: any) => client.tools || []).length;
      addSystemMessage(aiChannel, env, `你是HyperChat CLI助手。当前工作区: ${env.workspace.workspacePath}。可用工具: ${mcpToolCount}个MCP工具。请用中文回复。`);

      // 添加用户消息
      const userMessage: MyMessage = {
        role: 'user',
        content: userInput,
        content_date: Date.now()
      };
      aiChannel.addMessage(userMessage);

      // 添加 AI 响应消息
      const aiMessage = {
        role: 'assistant' as const,
        content: '',
        reasoning_content: '',
        content_tool_calls: [],
        content_status: 'dataLoading' as const,
        content_date: Date.now()
      };
      chatUI.addMessage(aiMessage);

      // 流式更新状态
      let displayedReasoningLength = 0;
      let displayedContentLength = 0;
      let displayedToolCallsCount = 0;
      let displayedToolResultsCount = 0;

      try {
        await aiChannel.completion({
          modelKey: effectiveConfig.modelKey,
          prompt: effectiveConfig.prompt,
          allowMCPs: effectiveConfig.allowMCPs,
          isConfirmCallTool: effectiveConfig.isConfirmCallTool,
          temperature: effectiveConfig.temperature,
          maxAttachedDialogs: effectiveConfig.maxAttachedDialogs,
          maxTokens: effectiveConfig.maxTokens,
          onUpdate: () => {
            // 显示新的工具结果
            const allMessages = aiChannel.messages || [];
            const toolMessages = allMessages.filter(msg => msg.role === 'tool');
            
            if (toolMessages.length > displayedToolResultsCount) {
              for (let i = displayedToolResultsCount; i < toolMessages.length; i++) {
                const toolMsg = toolMessages[i];
                let contentStr = '';
                if (typeof toolMsg.content === 'string') {
                  contentStr = toolMsg.content;
                } else if (Array.isArray(toolMsg.content)) {
                  contentStr = toolMsg.content.map(item => 
                    item.type === 'text' ? item.text : '[' + item.type + ']'
                  ).join(' ');
                }
                
                const toolMessage = {
                  role: 'tool' as const,
                  content: contentStr,
                  tool_call_name: toolMsg.tool_call_name,
                  content_status: toolMsg.content_status || 'success' as const,
                  tool_call_id: toolMsg.tool_call_id,
                  content_date: Date.now()
                };
                chatUI.addMessage(toolMessage);
              }
              displayedToolResultsCount = toolMessages.length;
            }

            const lastMsg = aiChannel.lastMessage;
            if (lastMsg.role === 'assistant') {
              // 更新推理内容
              const reasoningContent = lastMsg.reasoning_content as string || '';
              
              // 更新工具调用
              const toolCalls = lastMsg.content_tool_calls || [];
              
              // 更新主要内容
              const content = lastMsg.content as string || '';
              
              // 更新 AI 消息
              chatUI.updateLastMessage({
                content,
                reasoning_content: reasoningContent,
                content_tool_calls: toolCalls.slice(displayedToolCallsCount),
                content_status: lastMsg.content_status || 'dataLoading'
              });
              
              displayedToolCallsCount = toolCalls.length;
              displayedReasoningLength = reasoningContent.length;
              displayedContentLength = content.length;
            }
          }
        });
      } catch (error) {
        const errorMessage = {
          role: 'system' as const,
          content: `❌ ${t`Error:`} ${error instanceof Error ? error.message : String(error)}`,
          content_date: Date.now()
        };
        chatUI.addMessage(errorMessage);
      }
    };

    // 处理退出
    const handleExit = () => {
      logger.info(`👋 ${t`Goodbye!`}`);
      process.exit(0);
    };

    // 如果有初始消息，直接处理
    if (initialMessage) {
      logger.info(`💬 ${t`Processing message:`} ${initialMessage}`);
      
      // 渲染 UI 并处理初始消息
      const { waitUntilExit } = render(
        React.createElement(ChatUI, {
          onUserInput: handleUserInput,
          onExit: handleExit,
          workspaceInfo
        })
      );

      // 等待一点时间让 UI 渲染完成，然后发送初始消息
      setTimeout(async () => {
        await handleUserInput(initialMessage);
        // 处理完初始消息后自动退出
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      }, 100);

      await waitUntilExit();
      return;
    }

    // 交互式聊天模式
    logger.info(`💬 ${t`Starting interactive chat...`}`);

    const { waitUntilExit } = render(
      React.createElement(ChatUI, {
        onUserInput: handleUserInput,
        onExit: handleExit,
        workspaceInfo
      })
    );

    await waitUntilExit();

  } catch (error) {
    logger.error(`${t`Chat initialization failed:`} ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error && error.message.includes('未找到可用的AI模型配置')) {
      logger.info(`\n💡 ${t`Please run the following command to configure AI model first:`}`);
    }

    process.exit(1);
  }
}