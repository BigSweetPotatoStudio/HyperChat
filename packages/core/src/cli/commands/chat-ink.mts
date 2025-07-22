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
import { Command } from '../../command.mjs';
import { workspaceManager } from '../../workspace/index.mjs';
import {
  initializeAIEnvironment,
  createAIChannel,
  logAIConfig
} from '../../utils/aiConfigHelper.mjs';
import { getBuiltinPrompts } from '../../ai/hyperchat-builtin-prompts.mjs';
import { t } from '../../i18n.mjs';
import ChatUI from '../ui/ChatUI.js';
import type { MyMessage, HyperToolCall } from '@dadigua/hyperchat-shared/types';
import { v4 as uuidv4 } from 'uuid';

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

    logger.info(`🤖 ${t`Using model:`} ${env.effectiveConfig.modelKey}`);

    // 获取工作区的Agent数量
    const agentsSummary = await env.workspace.getAllAgentsSummary();
    const mcpClients = env.workspace.getMcpClients();
    const totalTools = mcpClients.flatMap((client: any) => client.tools || []).length;

    logger.info(`👥 ${t`Current workspace Agent count:`} ${agentsSummary.length}`);
    logger.info(`🔧 ${t`Current workspace available MCP clients:`} ${mcpClients.length}`);
    const agentConfig = env.agent.getConfig();

    logger.info(`🌐 ${t`Current Agent:`} ${agentConfig.name}`)
    logger.info(`🤖 ${t`Using model:`} ${env.effectiveConfig.modelKey}`);

    // 计算 agent 允许的工具信息
    let agentAllowedMCPs = 0;
    let agentAvailableTools = 0;
    let agentToolNames: string[] = [];

    if (agentConfig.allowMCPs && agentConfig.allowMCPs.length > 0) {
      agentAllowedMCPs = new Set(agentConfig.allowMCPs.map(x => x.split(" > ")[0])).size;
      const availableTools = env.mcpClients.flatMap((client: any) => client.tools || []);
      const matchedTools = availableTools.filter((tool: any) =>
        agentConfig.allowMCPs!.some(allowed =>
          tool.name === allowed ||
          tool.displayName === allowed ||
          tool.originalName === allowed ||
          tool.clientName === allowed
        )
      );
      agentAvailableTools = matchedTools.length;
      agentToolNames = matchedTools.map((tool: any) => tool.displayName || tool.name);
    }

    const workspaceInfo = {
      path: env.workspace.workspacePath,
      agentCount: agentsSummary.length,
      mcpClientsCount: mcpClients.length,
      totalToolsCount: totalTools,
      currentAgent: agentConfig.name,
      currentModel: env.effectiveConfig.modelKey,
      agentModelSource: (agentConfig.modelKey && agentConfig.modelKey === env.effectiveConfig.modelKey) ? 'agent' as const : 'inherited' as const,
      agentAllowedMCPs: agentAllowedMCPs,
      agentAvailableTools,
      agentToolNames
    };

    // 创建AI通道（提升到外部作用域）
    const aiChannel = createAIChannel();

    // 处理用户输入的函数
    const handleUserInput = async (userInput: string): Promise<void> => {
      const chatUI = (globalThis as any).__chatUI;
      if (!chatUI) return;

      // 生成聊天Key
      const chatKey = uuidv4();

      // 添加用户消息
      const userMessage: MyMessage = {
        role: 'user',
        content: userInput,
        content_date: Date.now()
      };
      aiChannel.addMessage(userMessage);



      // 强制刷新UI显示新消息
      if (chatUI && chatUI.forceRefresh) {
        chatUI.forceRefresh();
      }

      try {
        // 构建系统提示词
        const agentName = env.agent.getConfig().name || "";
        const systemPrompt = getBuiltinPrompts(
          env.workspace.workspacePath,
          env.effectiveConfig.prompt,
          agentName,
          env.workspace.getAgentScope(agentName) || "workspace",
        ).prompt;

        await aiChannel.completion({
          ...env.effectiveConfig,
          prompt: systemPrompt,
          onUpdate: async () => {
            // 显示新的工具结果

            // 强制刷新UI显示
            if (chatUI && chatUI.forceRefresh) {
              chatUI.forceRefresh();
            }


            // 每次更新时保存聊天历史（学习Web版模式）
            try {
              if (env.agent) {
                await env.agent.setChatLog({
                  key: chatKey,
                  label: getLabelByFirstUserContent(aiChannel.messages),
                  messages: aiChannel.messages,
                  agentName: env.agent.getConfig().name,
                  dateTime: Date.now(),
                  chatType: "user",
                  configOverrides: env.effectiveConfig,
                });
              }
            } catch (error) {
              // 静默处理聊天历史保存错误，不影响主要聊天流程
            }
          }
        });

        // 在completion完成后，添加最终的assistant消息（如果有最终内容的话）
        const finalMessage = aiChannel.lastMessage;
        if (finalMessage && finalMessage.role === 'assistant' && finalMessage.content) {
          // 如果最后一条消息有内容又有工具调用，说明需要添加独立的最终回复消息
          const hasToolCalls = finalMessage.content_tool_calls && finalMessage.content_tool_calls.length > 0;
          const hasContent = finalMessage.content && (finalMessage.content as string).trim();

          if (hasContent && hasToolCalls) {
            // 如果有工具调用又有最终内容，添加一个纯内容的assistant消息
            const finalContentMessage = {
              role: 'assistant' as const,
              content: finalMessage.content,
              reasoning_content: '',
              content_tool_calls: [],
              content_status: 'success' as const,
              content_attachment: [],
              content_usage: finalMessage.content_usage || {
                prompt_tokens: 0,
                completion_tokens: 0,
                total_tokens: 0,
              },
              content_date: Date.now(),
              content_attached: true
            };

            // 只添加到aiChannel中
            aiChannel.addMessage(finalContentMessage);

            // 强制刷新UI显示最终消息
            if (chatUI && chatUI.forceRefresh) {
              chatUI.forceRefresh();
            }
          }
        }

      } catch (error) {
        const errorMessage = {
          role: 'system' as const,
          content: `❌ ${t`Error:`} ${error instanceof Error ? error.message : String(error)}`,
          content_date: Date.now()
        };
        // 错误消息添加到aiChannel
        aiChannel.addMessage(errorMessage);

        // 强制刷新UI显示错误消息
        if (chatUI && chatUI.forceRefresh) {
          chatUI.forceRefresh();
        }
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
          messages: aiChannel.messages, // 传入aiChannel的消息
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
        messages: aiChannel.messages, // 传入aiChannel的消息
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