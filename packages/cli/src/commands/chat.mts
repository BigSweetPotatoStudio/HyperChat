/**
 * Chat 命令实现
 * 
 * 提供交互式 AI 聊天功能，类似 Claude Code 的体验
 */

import process from 'process';
import { Logger } from '../utils/logger.mjs';
import { Command } from '../../../core/src/command.mjs';
import { AiChannel } from '@hyperchat/shared/ai';
import type { MyMessage } from '@hyperchat/shared/types';
import { createReadline } from '../utils/readline.mjs';

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
    
    // 智能工作区选择：优先使用当前目录，如果没有.hyperchat则使用全局工作区
    let workspacePath = options.workspace;
    if (!workspacePath) {
      const currentDir = process.cwd();
      const { existsSync } = await import('fs');
      const { join } = await import('path');
      
      // 检查当前目录是否有.hyperchat文件夹
      if (existsSync(join(currentDir, '.hyperchat'))) {
        workspacePath = currentDir;
        logger.info(`🎯 使用当前目录工作区: ${workspacePath}`);
      } else {
        const globalWorkspace = await Command.getGlobalWorkspace();
        workspacePath = globalWorkspace.path;
        logger.info(`🌐 使用全局工作区: ${workspacePath}`);
      }
    }
    
    logger.debug(`使用工作区: ${workspacePath}`);
    
    // 获取应用设置
    const appSettings = await Command.getAppSettings();
    const aiSettings = appSettings.ai;
    
    // 确定使用的模型
    let modelKey = options.model;
    if (!modelKey && aiSettings?.models && aiSettings.models.length > 0) {
      modelKey = aiSettings.models[0].key;
    }
    if (!modelKey) {
      throw new Error('未找到可用的AI模型配置，请先在Web界面中配置AI模型');
    }
    
    logger.info(`🤖 使用模型: ${modelKey}`);
    
    // 获取工作区的MCP工具
    const mcpClients = await Command.getWorkspaceMcpClients({ workspacePath });
    const mcpTools = mcpClients.flatMap((client: any) => 
      client.tools?.map((tool: any) => ({
        name: `${client.serverName}_${tool.name}`,
        origin_name: tool.name,
        restore_name: tool.name,
        clientName: client.serverName,
        workspacePath: workspacePath,
        description: tool.description || '',
        inputSchema: tool.inputSchema
      })) || []
    );
    
    logger.debug(`加载了 ${mcpTools.length} 个MCP工具`);
    
    // 初始化AI聊天频道
    const aiChannel = new AiChannel();
    
    // 创建全局扩展对象，让AI模块可以调用后端命令
    (globalThis as any).ext = {
      call: async (functionName: string, args: any, options?: any) => {
        if (functionName === 'mcpCallToolWithWorkspace') {
          return await Command.mcpCallToolWithWorkspace(args);
        }
        throw new Error(`未知的命令: ${functionName}`);
      }
    };
    
    aiChannel.register({
      antdmessage: {
        warning: (msg: string) => logger.warn(msg)
      },
      mcpTools: mcpTools,
      platform: 'nodejs',
      getURL_PRE: () => '',
      aiSettings: aiSettings || { models: [], customProviders: [], builtinApiKeys: {} }
    });
    
    // 添加系统消息
    const systemMessage: MyMessage = {
      role: 'system',
      content: `你是HyperChat CLI助手。当前工作区: ${workspacePath}。可用工具: ${mcpTools.length}个MCP工具。请用中文回复。`,
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
      
      // 简化输出，完成后一次性显示
      await aiChannel.completion({
        modelKey: modelKey!,
        allowMCPs: mcpClients.map((c: any) => c.serverName)
      });
      
      // 显示最终回复
      const lastMsg = aiChannel.lastMessage;
      if (lastMsg.role === 'assistant') {
        console.log(lastMsg.content as string);
      }
      
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
        // 简化输出，完成后一次性显示
        await aiChannel.completion({
          modelKey: modelKey!,
          allowMCPs: mcpClients.map((c: any) => c.serverName)
        });
        
        // 清除"思考中..."并显示最终回复
        process.stdout.write('\r' + ' '.repeat(20) + '\r');
        const lastMsg = aiChannel.lastMessage;
        if (lastMsg.role === 'assistant') {
          console.log(lastMsg.content as string);
        }
        
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
      logger.info('\n💡 请先运行以下命令配置AI模型:');    }
    
    process.exit(1);
  }
}

