/**
 * Server-Sent Events 聊天路由
 * 处理 AI 流式聊天响应
 */
import { Router, Request, Response } from 'express';
import { SSEWriter } from '../sse/SSEWriter.mjs';
import { Logger } from '../log.mjs';
import { streamChatCompletion } from '../commands/chatCommands.mjs';
import { MyMessage } from '@dadigua/hyperchat-shared/types';
import { BaseAIConfig } from '@dadigua/hyperchat-shared';

const router = Router();

// 存储活动的 SSE 连接
const activeConnections = new Map<string, SSEWriter>();

/**
 * 获取指定 chatKey 的 SSE 连接
 */
export function getSSEConnection(chatKey: string): SSEWriter | null {
  return activeConnections.get(chatKey) || null;
}

/**
 * SSE 流式连接端点
 */
router.get('/stream/:chatKey', (req: Request, res: Response) => {
  const { chatKey } = req.params;
  
  if (!chatKey) {
    res.status(400).json({ error: 'chatKey is required' });
    return;
  }

  Logger.info(`New SSE connection for chatKey: ${chatKey}`);

  // 创建 SSE 写入器
  const sseWriter = new SSEWriter(res, chatKey);
  
  // 存储连接
  activeConnections.set(chatKey, sseWriter);

  // 监听客户端断开连接
  req.on('close', () => {
    Logger.info(`SSE connection closed for chatKey: ${chatKey}`);
    activeConnections.delete(chatKey);
    sseWriter.close();
  });

  // 监听连接错误
  req.on('error', (error) => {
    Logger.error(`SSE connection error for chatKey ${chatKey}:`, error);
    activeConnections.delete(chatKey);
    sseWriter.close();
  });
});

/**
 * 开始聊天流式响应
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const {
      chatKey,
      messages,
      userMessage,
      agentName,
      agentScope = 'workspace',
      configOverrides = {}
    }: {
      chatKey: string;
      messages: MyMessage[];
      userMessage?: MyMessage;
      agentName: string;
      agentScope?: 'global' | 'workspace';
      configOverrides?: Partial<BaseAIConfig>;
    } = req.body;

    if (!chatKey) {
      res.status(400).json({ error: 'chatKey is required' });
      return;
    }

    if (!agentName) {
      res.status(400).json({ error: 'agentName is required' });
      return;
    }

    // 获取对应的 SSE 连接
    const sseWriter = getSSEConnection(chatKey);
    if (!sseWriter) {
      res.status(404).json({ error: 'SSE connection not found. Please connect to /stream/:chatKey first.' });
      return;
    }

    // 响应请求已接收
    res.json({ success: true, chatKey });

    // 异步处理聊天完成
    Logger.info(`Starting chat completion for chatKey: ${chatKey}, agent: ${agentName}`);
    
    streamChatCompletion({
      chatKey,
      messages,
      userMessage,
      agentName,
      agentScope,
      configOverrides,
      sseWriter, // 传递 SSE 写入器
    }).catch((error) => {
      Logger.error(`Chat completion error for chatKey ${chatKey}:`, error);
      
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
    const { chatKey } = req.body;

    if (!chatKey) {
      res.status(400).json({ error: 'chatKey is required' });
      return;
    }

    const sseWriter = getSSEConnection(chatKey);
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

export default router;