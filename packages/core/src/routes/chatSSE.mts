/**
 * Server-Sent Events 聊天路由
 * 处理 AI 流式聊天响应
 */
import { Router, Request, Response } from 'express';
import { SSEWriter } from '../sse/SSEWriter.mjs';
import { Logger } from '../log.mjs';
import { streamChatCompletion, handleToolConfirmResponse } from '../commands/chatCommands.mjs';
import { MyMessage } from '@dadigua/hyperchat-shared/types';
import { BaseAIConfig } from '@dadigua/hyperchat-shared';
import type { AiChannel } from '../ai/ai.mjs';
import { getBuiltinPrompts } from '../ai/hyperchat-builtin-prompts.mjs';

const router = Router();

// 分离管理 SSE 连接和 AI 通道
// sessionId -> SSEWriter 映射
const activeSseWriters = new Map<string, SSEWriter>();
// chatKey -> AiChannel 映射  
const activeAiChannels = new Map<string, AiChannel>();

/**
 * 建立 SSE 连接端点
 * GET 请求用于建立 SSE 连接
 */
router.get('/stream/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { chatKey } = req.query;

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  Logger.info(`New SSE connection for sessionId: ${sessionId}`);

  // 创建 SSE 写入器
  const sseWriter = new SSEWriter(res);

  // 存储 SSE 连接
  activeSseWriters.set(sessionId, sseWriter);

  // 监听客户端断开连接
  req.on('close', () => {
    Logger.info(`SSE connection closed for sessionId: ${sessionId}`);
    const sseWriter = activeSseWriters.get(sessionId);
    if (sseWriter) {
      activeSseWriters.delete(sessionId);
    }
    // 如果有 chatKey，清理对应的 AI 通道
    if (chatKey && typeof chatKey === 'string') {
      const aiChannel = activeAiChannels.get(chatKey);
      if (aiChannel) {
        aiChannel.cancel(); // 取消可能正在进行的请求
        activeAiChannels.delete(chatKey);
        Logger.debug(`AI channel cleaned up for chatKey: ${chatKey}`);
      }
    }
    sseWriter?.close();
  });

  // 监听连接错误
  req.on('error', (error) => {
    Logger.error(`SSE connection error for sessionId ${sessionId}:`, error);
    const sseWriter = activeSseWriters.get(sessionId);
    if (sseWriter) {
      activeSseWriters.delete(sessionId);
    }
    // 如果有 chatKey，清理对应的 AI 通道
    if (chatKey && typeof chatKey === 'string') {
      const aiChannel = activeAiChannels.get(chatKey);
      if (aiChannel) {
        aiChannel.cancel(); // 取消可能正在进行的请求
        activeAiChannels.delete(chatKey);
        Logger.debug(`AI channel cleaned up for chatKey: ${chatKey}`);
      }
    }
    sseWriter?.close();
  });
});

/**
 * 开始聊天端点
 * POST 请求用于开始聊天流式响应
 */
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      chatKey,
      messages,
      userMessage,
      agentName,
      agentScope = 'workspace',
      configOverrides = {}
    }: {
      sessionId: string;
      chatKey: string;
      messages: MyMessage[];
      userMessage?: MyMessage;
      agentName: string;
      agentScope?: 'global' | 'workspace';
      configOverrides?: Partial<BaseAIConfig>;
    } = req.body;

    if (!agentName) {
      res.status(400).json({ error: 'agentName is required' });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    if (!chatKey) {
      res.status(400).json({ error: 'chatKey is required' });
      return;
    }

    // 获取对应的 SSE 连接
    const sseWriter = activeSseWriters.get(sessionId);
    if (!sseWriter) {
      res.status(404).json({ error: 'SSE connection not found. Please connect with GET request first.' });
      return;
    }

    // 响应请求已接收
    res.json({ success: true, sessionId, chatKey });

    // 异步处理聊天完成
    Logger.info(`Starting chat completion for sessionId: ${sessionId}, chatKey: ${chatKey}, agent: ${agentName}`);

    // 获取缓存的 aiChannel（如果存在）
    const existingAiChannel = activeAiChannels.get(chatKey);

    streamChatCompletion({
      sessionId,
      chatKey,
      messages,
      userMessage,
      agentName,
      agentScope,
      configOverrides,
      sseWriter, // 传递 SSE 写入器
      aiChannel: existingAiChannel, // 传递缓存的 aiChannel
    }).then((aiChannel) => {
      // 缓存返回的 aiChannel
      if (!existingAiChannel && aiChannel) {
        activeAiChannels.set(chatKey, aiChannel);
        Logger.debug(`AI channel cached for chatKey: ${chatKey}`);
      }
    }).catch((error) => {
      Logger.error(`Chat completion error for sessionId ${sessionId}, chatKey ${chatKey}:`, error);

      // 发送错误到客户端
      if (!sseWriter.isClosed()) {
        sseWriter.write({
          type: 'chat_message_error',
          data: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    });

  } catch (error) {
    Logger.error('Start chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 取消聊天流式响应
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const sseWriter = activeSseWriters.get(sessionId);
    if (sseWriter && !sseWriter.isClosed()) {
      sseWriter.write({
        type: 'chat_message_error',
        data: {
          error: 'Chat cancelled by user',
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    Logger.error('Cancel chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 工具确认响应端点
 */
router.post('/tool-confirm', async (req: Request, res: Response) => {
  try {
    const { confirmId, confirmed, args } = req.body;

    if (!confirmId) {
      res.status(400).json({ error: 'confirmId is required' });
      return;
    }

    Logger.debug(`Received tool confirmation: ${confirmId}, confirmed: ${confirmed}`);

    // 处理工具确认响应
    handleToolConfirmResponse(confirmId, confirmed, args);

    res.json({ success: true });
  } catch (error) {
    Logger.error('Tool confirm error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * 手动压缩记忆端点
 */
router.post('/compress-memory', async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      modelKey,
      maxContextTokens = 32000,
      prompt = '',
      chatKey
    } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    if (!modelKey) {
      res.status(400).json({ error: 'modelKey is required' });
      return;
    }

    Logger.info(`Manual memory compression requested for sessionId: ${sessionId}, modelKey: ${modelKey}, strategy: tokens`);

    // 获取对应的 SSE 连接
    const sseWriter = activeSseWriters.get(sessionId);
    if (!sseWriter) {
      res.status(404).json({ error: 'SSE connection not found. Please establish SSE connection first.' });
      return;
    }


    // 使用第一个可用的 aiChannel
    const aiChannel = activeAiChannels.get(chatKey);
    if (!aiChannel) {
      res.status(404).json({ error: 'No active AI channel found. Please start a conversation first.' });
      return;
    }

    Logger.debug(`Using aiChannel for chatKey: ${chatKey} for memory compression`);

    // 检查是否有足够的消息进行压缩
    if (!aiChannel.messages || aiChannel.messages.length === 0) {
      res.status(400).json({ error: 'No messages to compress in current session' });
      return;
    }

    // 执行压缩
    const compressedMessage = await aiChannel.compressMemory(
      modelKey,
      undefined, // onUpdate
      sseWriter   // sseWriter
    );
    const systemPrompt = getBuiltinPrompts(
      prompt,
      undefined,
      undefined
    ).prompt;
    // 创建压缩配置
    const compressionConfig: Pick<BaseAIConfig, "compressionStrategy" | "maxContextTokens" | "prompt"> = {
      compressionStrategy: 'tokens',
      maxContextTokens,
      prompt: systemPrompt
    };

    // 更新token使用信息
    aiChannel.updateTokenUsage(compressionConfig);

    // 发送压缩完成的token使用信息
    if (sseWriter && aiChannel.tokenUsage) {
      sseWriter.write({
        type: 'token_usage_update',
        data: {
          tokenUsage: aiChannel.tokenUsage
        }
      });
    }

    res.json({
      success: true,
      messages: aiChannel.messages,
      tokenUsage: aiChannel.tokenUsage,
      compressedMessage: compressedMessage
    });

  } catch (error) {
    Logger.error('Memory compression error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;