/**
 * Chat 命令实现
 * 
 * 提供交互式 AI 聊天功能，类似 Claude Code 的体验
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../command.mjs';
import { AiChannel } from '@dadigua/hyperchat-shared/ai';
import type { MyMessage } from '@dadigua/hyperchat-shared/types';
import { createReadline } from '../utils/readline.mjs';
import { workspaceManager } from '../../workspace/index.mjs';


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

    // 使用新的CLI会话管理器
    let workspacePath = options.workspace;
    let sessionConfig: any;


    // Chat需要完整服务（MCP工具、AI聊天）
    await workspaceManager.initialize(workspacePath, false);
    logger.info(`🎯 使用工作区: ${workspaceManager.getCurrentWorkspacePath()}`);
    
    await workspaceManager.start();
    let workspace = workspaceManager.getCurrentWorkspace();
    workspacePath = workspaceManager.getCurrentWorkspacePath();
    logger.info(`✅ 工作区服务已启动`);

    // 如果指定了agent，获取agent配置
    let agentConfig: any = null;
    if (options.agent) {
      const agents = await Command.getWorkspaceAgentsSummary();
      const agentSummary = agents.find(agent => {
        const config = agent.config as any;
        return config.key === options.agent || config.name === options.agent;
      });

      if (agentSummary) {
        agentConfig = agentSummary.config;
        logger.info(`🤖 使用Agent: ${agentConfig.name} (${agentConfig.key})`);
      } else {
        throw new Error(`未找到Agent: ${options.agent}`);
      }
    }

    logger.debug(`使用工作区: ${workspacePath}`);
    const appSettings = await Command.getAppSettings();
    const aiSettings = appSettings.ai;
    // 确定使用的模型（优先使用agent配置的模型）
    let modelKey = options.model;

    if (!modelKey && agentConfig?.modelKey) {
      // 优先使用agent配置的模型
      modelKey = agentConfig.modelKey;
      logger.info(`📋 使用Agent配置的AI模型: ${modelKey}`);
    } else if (!modelKey && sessionConfig?.aiModels && sessionConfig.aiModels.length > 0) {
      // 使用会话合并后的AI模型配置
      modelKey = sessionConfig.aiModels[0].key;
      logger.info(`📋 使用会话配置的AI模型: ${modelKey}`);
    } else if (!modelKey) {
      // 回退到应用设置
      if (aiSettings?.models && aiSettings.models.length > 0) {
        const firstModel = aiSettings.models[0];
        if (firstModel) {
          modelKey = firstModel.key;
          logger.info(`📋 使用应用设置的AI模型: ${modelKey}`);
        }
      }
    }

    if (!modelKey) {
      throw new Error('未找到可用的AI模型配置，请先配置AI模型');
    }

    logger.info(`🤖 使用模型: ${modelKey}`);

    // 获取工作区的Agent数量
    const agentsSummary = await workspace.getAllAgentsSummary();
    logger.info(`👥 当前工作区Agent数量: ${agentsSummary.length}`);

    // 获取工作区的MCP工具
    const mcpClients = await workspace.getMcpClients();
    const mcpTools = mcpClients.flatMap((client: any) => client.tools || []);

    logger.info(`🔧 可用MCP工具数量: ${mcpTools.length}`);

    // 初始化AI聊天频道
    const aiChannel = new AiChannel();

    // 创建全局扩展对象，让AI模块可以调用后端命令
    (globalThis as any).ext = {
      call: async (functionName: string, args: any, _options?: any) => {
        if (functionName === 'mcpCallToolWithWorkspace') {
          return await Command.mcpCallToolWithWorkspace(args);
        }
        throw new Error(`未知的命令: ${functionName}`);
      }
    };

    // 确保aiSettings符合AISettings类型的要求
    const normalizedAiSettings = {
      models: (aiSettings?.models || []).filter(model => 
        model.type && model.model && model.key && model.name && model.provider &&
        model.apiKey !== undefined && model.baseURL !== undefined
      ),
      customProviders: (aiSettings?.customProviders || []).filter(provider =>
        provider.key && provider.label && provider.baseURL !== undefined &&
        provider.hasApiKey !== undefined && provider.isBuiltIn !== undefined
      ),
      builtinApiKeys: Object.fromEntries(
        Object.entries(aiSettings?.builtinApiKeys || {}).filter(([_, value]) =>
          value && value.apiKey !== undefined && value.baseURL !== undefined
        ).map(([key, value]) => [key, { apiKey: value!.apiKey!, baseURL: value!.baseURL! }])
      ),
      defaultModel: aiSettings?.defaultModel
    };

    aiChannel.register({
      antdmessage: {
        warning: (msg: string) => logger.warn(msg)
      },
      mcpTools: mcpTools,
      platform: 'nodejs',
      getURL_PRE: () => '',
      aiSettings: normalizedAiSettings as any
    });

    // 添加系统消息
    let systemContent = `你是HyperChat CLI助手。当前工作区: ${workspacePath}。可用工具: ${mcpTools.length}个MCP工具。请用中文回复。`;

    // 如果使用了agent，添加agent的prompt
    if (agentConfig?.prompt) {
      systemContent = `${agentConfig.prompt}\n\n当前工作区: ${workspacePath}。可用工具: ${mcpTools.length}个MCP工具。`;
    }

    const systemMessage: MyMessage = {
      role: 'system',
      content: systemContent,
      content_date: Date.now()
    };
    aiChannel.addMessage(systemMessage);

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
        modelKey: modelKey!,
        prompt: agentConfig?.prompt || "",
        allowMCPs: agentConfig?.allowMCPs || mcpClients.map((c: any) => c.serverName),
        isConfirmCallTool: agentConfig?.isConfirmCallTool || false,
        temperature: agentConfig?.temperature,
        maxAttachedDialogs: agentConfig?.maxAttachedDialogs,
        maxTokens: agentConfig?.maxTokens || 4000,
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
        aiChannel.messages = [systemMessage]; // 重置为只包含系统消息
        console.log('✅ 对话历史已清空\n');
        continue;
      }

      if (input.trim() === '/model') {
        console.log(`\n🤖 当前模型: ${modelKey}\n`);
        continue;
      }

      if (input.trim() === '/tools') {
        console.log(`\n🔧 可用工具 (${mcpTools.length}个):`);
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
      console.log('\n🤖 AI: ');
      process.stdout.write('思考中...');

      try {
        // 流式输出
        let displayedContentLength = 0;
        let displayedReasoningLength = 0;
        let isFirstUpdate = true;
        let reasoningFinished = false;

        await aiChannel.completion({
          modelKey: modelKey!,
          prompt: agentConfig?.prompt || "",
          allowMCPs: agentConfig?.allowMCPs || mcpClients.map((c: any) => c.serverName),
          isConfirmCallTool: agentConfig?.isConfirmCallTool || false,
          temperature: agentConfig?.temperature,
          maxAttachedDialogs: agentConfig?.maxAttachedDialogs,
          maxTokens: agentConfig?.maxTokens || 4000,
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

