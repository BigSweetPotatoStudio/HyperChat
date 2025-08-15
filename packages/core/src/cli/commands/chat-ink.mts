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
import { getAppSettingsManager } from '../../data/appSettingsService.mjs';
import { AgentInstance } from '../../workspace/index.mjs';
import {
  initializeAIEnvironment,
  logAIConfig,
  buildEffectiveConfig
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
import { CONST } from '../../const.mjs';
import type { BaseAIConfig } from '@dadigua/hyperchat-shared';

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
      // chat-ink命令不启用任务调度器
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
async function showAgentStartupInfo(agent: AgentInstance, logger: Logger): Promise<void> {
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
    await showAgentStartupInfo(agent, logger);

    // 创建AI环境对象（Agent-centered版本）
    const appSettingsManager = getAppSettingsManager();
    const aiSettings = appSettingsManager.getAI();

    // 构建命令行覆盖配置
    const overrides: Partial<BaseAIConfig> = {};
    if (options.model) {
      overrides.modelKey = options.model;
      logger.info(`📋 ${t`Using AI model specified from command line:`} ${options.model}`);
    }

    // 使用 buildEffectiveConfig 构建有效配置
    const effectiveConfig = buildEffectiveConfig(overrides, agentConfig, aiSettings);

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
    // 以Agent为中心的信息显示 (用于UI)
    const agentToolNames = mcpToolsInfo.availableTools.map((tool) => tool.displayName || tool.name);

    const workspaceInfo = {
      path: currentWorkingDirectory,
      agentCount: 1, // 当前Agent
      mcpClientsCount: mcpClients.length,
      currentAgent: agentConfig.name,
      currentModel: effectiveConfig.modelKey,
      agentAllowedMCPs: mcpToolsInfo.allowedMCPsCount,
      agentAvailableTools: mcpToolsInfo.availableTools.length,
      agentToolNames,
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
          onExit: handleExit,
          agent: agent,
          logger: logger,
          workspaceInfo,
          effectiveConfig,
          initialMessage
        })
      );

      await waitUntilExit();
      return;
    }

    // 交互式聊天模式
    logger.info(`💬 ${t`Starting interactive chat...`}`);

    const { waitUntilExit } = render(
      React.createElement(ChatUI, {
        onExit: handleExit,
        agent: agent,
        workspaceInfo,
        logger: logger,
        effectiveConfig
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