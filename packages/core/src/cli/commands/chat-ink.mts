/**
 * Chat 命令实现 - 使用 Ink UI 库
 * 
 * 提供基于 React 组件的现代化终端 UI 体验
 */

import React from 'react';
import { render } from 'ink';
import process from 'process';
import path from 'path';
import { Logger } from '../utils/logger.mjs';
import { Logger as LoggerClass } from '../../log.mjs';
import { Command } from '../../command.mjs';
import { AgentInstance } from '../../workspace/index.mjs';
import {
  initializeAIEnvironment,
  createAIChannel,
  logAIConfig
} from '../../utils/aiConfigHelper.mjs';
import { getAgent } from '../agentManager.mjs';
import {
  findAgent,
  DEFAULT_AGENT_NAME,
  type DiscoveredAgent
} from '../utils/agentDiscovery.mjs';
import { getBuiltinPrompts } from '../../ai/hyperchat-builtin-prompts.mjs';
import { t } from '../../i18n.mjs';
import ChatUI from '../ui/ChatUI.js';
import type { MyMessage, HyperToolCall } from '@dadigua/hyperchat-shared/types';
import { getMyUuid } from '../utils/util.mjs';
import { TaskQueue } from '../../utils/taskQueue.mjs';
import { CONST } from '../../const.mjs';

// 创建聊天日志保存队列，确保按顺序写入，避免YAML文件并发问题
const chatLogQueue = new TaskQueue({ concurrency: 1 });

/**
 * 选择Agent（Agent-centered架构 - 使用CliAgentManager）
 * 优先级：agentPath > workspace + agentName
 */
async function selectAgent(options: ChatOptions): Promise<AgentInstance> {
  // 使用新的CliAgentManager来获取Agent
  try {
    const agent = await getAgent({
      agentName: options.agent,
      agentPath: options.agentPath,
      workspace: options.workspace,
      enableTaskScheduler: options.enableTaskScheduler ?? false // chat-ink命令默认禁用任务调度器
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
 * 显示Agent启动详细信息 (Ink版本)
 */
async function showAgentStartupInfo(agent: AgentInstance, logger: Logger, enableTaskScheduler: boolean = true): Promise<void> {
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

  // 显示任务调度器状态（已由CliAgentManager管理）
  logger.info(`  ⏰ ${t`Task scheduler status:`}`);
  try {
    const taskStats = agent.getTaskSchedulerStats();
    
    if (taskStats.running) {
      logger.info(`    ├─ ✅ ${t`Scheduler running`}`);
      logger.info(`    └─ 📋 ${t`Scheduled tasks:`} ${taskStats.scheduledTasksCount}`);
      
      if (taskStats.scheduledTasks.length > 0) {
        const taskNames = taskStats.scheduledTasks.slice(0, 3);
        const more = taskStats.scheduledTasks.length > 3 ? ` (+${taskStats.scheduledTasks.length - 3} more)` : '';
        logger.info(`        └─ ${taskNames.join(', ')}${more}`);
      }
    } else {
      if (enableTaskScheduler) {
        logger.info(`    └─ ⏸️ ${t`Scheduler stopped`}`);
      } else {
        logger.info(`    └─ ⏸️ ${t`Scheduler disabled for this session`}`);
      }
    }
  } catch (error) {
    logger.warn(`    └─ ${t`Task scheduler error:`} ${error instanceof Error ? error.message : String(error)}`);
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
  enableTaskScheduler?: boolean; // 是否启用任务调度器，默认true
}

export async function startChatInk(initialMessage?: string, options: ChatOptions = {}) {
  const logger = new Logger(options.verbose, options.quiet);

  // 检查是否支持 raw mode（检测 stdin 是否是 TTY）
  if (!process.stdin.isTTY) {
    logger.info(`💡 ${t`Raw mode not supported (non-TTY input), falling back to legacy UI`}`);
    // 使用静态导入方式调用legacy chat
    const { startChat } = await import('./chat.mjs');
    return await startChat(initialMessage, options);
  }

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
    const enableTaskScheduler = options.enableTaskScheduler ?? false; // chat-ink命令默认为false
    await showAgentStartupInfo(agent, logger, enableTaskScheduler);

    // 创建AI环境对象（Agent-centered版本）
    const appSettings = await Command.getAppSettings();
    const aiSettings = appSettings.ai;

    // 构建有效配置
    let effectiveConfig = {
      modelKey: agentConfig.modelKey || aiSettings?.models?.[0]?.key || 'default-model',
      allowMCPs: agentConfig.allowMCPs || [],
      blockMCPTools: agentConfig.blockMCPTools || [],
      isConfirmCallTool: agentConfig.isConfirmCallTool ?? false,
      temperature: agentConfig.temperature,
      maxAttachedDialogs: agentConfig.maxAttachedDialogs ?? 5,
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
    
    if (agentConfig.allowMCPs && agentConfig.allowMCPs.length > 0) {
      logger.info(`🛠️ ${t`Agent allowed tools:`} ${mcpToolsInfo.allowedMCPsCount} ${t`configured`}, ${mcpToolsInfo.matchedTools.length} ${t`available`}`);
      if (mcpToolsInfo.matchedTools.length > 0) {
        const toolNames = mcpToolsInfo.matchedTools.map((tool: any) => tool.displayName || tool.name).slice(0, 3);
        const more = mcpToolsInfo.matchedTools.length > 3 ? ` (+${mcpToolsInfo.matchedTools.length - 3} more)` : '';
        logger.info(`    📋 ${toolNames.join(', ')}${more}`);
      }
    } else {
      logger.info(`🛠️ ${t`Agent allowed tools:`} ${t`All available tools`} (${mcpToolsInfo.totalTools})`);
    }

    // 以Agent为中心的信息显示 (用于UI)
    const agentToolNames = mcpToolsInfo.matchedTools.map((tool: any) => tool.displayName || tool.name);

    const workspaceInfo = {
      path: currentWorkingDirectory,
      agentCount: 1, // 当前Agent
      mcpClientsCount: mcpClients.length,
      totalToolsCount: mcpToolsInfo.totalTools,
      currentAgent: agentConfig.name,
      currentModel: effectiveConfig.modelKey,
      agentAllowedMCPs: mcpToolsInfo.allowedMCPsCount,
      agentAvailableTools: mcpToolsInfo.matchedTools.length,
      agentToolNames
    };

    // 创建AI通道（提升到外部作用域）
    const aiChannel = createAIChannel();

    // 处理用户输入的函数
    const handleUserInput = async (userInput: string): Promise<void> => {
      const chatUI = (globalThis as any).__chatUI;
      if (!chatUI) return;

      // 生成聊天Key
      const chatKey = getMyUuid();

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
        const systemPrompt = getBuiltinPrompts(
          effectiveConfig.prompt,
          currentWorkingDirectory,
          agent.getAgentPath()
        ).prompt;

        await aiChannel.completion({
          ...effectiveConfig,
          prompt: systemPrompt,
          agentInstance: agent, // 直接传递AgentInstance对象
          onUpdate: async () => {
            // 显示新的工具结果

            // 强制刷新UI显示
            if (chatUI && chatUI.forceRefresh) {
              chatUI.forceRefresh();
            }


            // 每次更新时保存聊天历史（使用队列确保顺序写入）
            try {
              chatLogQueue.add(async () => {
                await agent.setChatLog({
                  key: chatKey,
                  label: getLabelByFirstUserContent(aiChannel.messages),
                  messages: aiChannel.messages,
                  agentName: agent.getConfig().name,
                  dateTime: Date.now(),
                  chatType: "user",
                  configOverrides: effectiveConfig,
                });
              });
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
        // const errorMessage = {
        //   role: 'system' as const,
        //   content: `❌ ${t`Error:`} ${error instanceof Error ? error.message : String(error)}`,
        //   content_date: Date.now()
        // };
        // // 错误消息添加到aiChannel
        // aiChannel.addMessage(errorMessage);

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

    // 处理取消 AI 请求
    const handleCancel = async () => {
      try {
        if (aiChannel && aiChannel.cancel) {
          await aiChannel.cancel();
          logger.info(`🚫 ${t`AI request cancelled by user`}`);
        }
      } catch (error) {
        // 取消操作失败也不需要显示错误，因为可能请求已经完成
      }
    };

    // 获取聊天记录
    const getChatLogs = async (agentName: string) => {
      try {
        const { agentCommands } = await import('../../commands/agentCommands.mjs');
        return await agentCommands.getAgentChatLogs({ agentName });
      } catch (error) {
        throw new Error(`${t`Failed to get chat logs:`} ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    // 处理聊天记录选择
    const handleChatLogSelect = async (chatLogKey: string) => {
      try {
        const { agentCommands } = await import('../../commands/agentCommands.mjs');
        const chatLog = await agentCommands.getAgentChatLog({
          agentName: agent.getConfig().name,
          chatLogKey
        });

        if (chatLog) {
          // 清空当前消息
          aiChannel.messages = [];
          
          // 加载聊天记录中的消息
          if (chatLog.messages && chatLog.messages.length > 0) {
            chatLog.messages.forEach((message: any) => {
              aiChannel.addMessage(message);
            });
          }
          
          logger.info(`✅ ${t`Loaded chat log:`} ${chatLog.label} (${chatLog.messages?.length || 0} ${t`messages`})`);
        } else {
          throw new Error(`${t`Chat log not found:`} ${chatLogKey}`);
        }
      } catch (error) {
        throw new Error(`${t`Failed to load chat log:`} ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    // 暴露获取聊天记录的方法给UI组件
    (globalThis as any).__getChatLogs = getChatLogs;

    // 如果有初始消息，直接处理
    if (initialMessage) {
      logger.info(`💬 ${t`Processing message:`} ${initialMessage}`);

      // 渲染 UI 并处理初始消息
      const { waitUntilExit } = render(
        React.createElement(ChatUI, {
          onUserInput: handleUserInput,
          onExit: handleExit,
          onCancel: handleCancel,
          onChatLogSelect: handleChatLogSelect,
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
        onCancel: handleCancel,
        onChatLogSelect: handleChatLogSelect,
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