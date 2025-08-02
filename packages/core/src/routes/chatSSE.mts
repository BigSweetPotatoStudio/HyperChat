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

const router = Router();

// 存储活动的 SSE 连接，使用 sessionId 作为 key
const activeConnections = new Map<string, SSEWriter>();

/**
 * 建立 SSE 连接端点
 * GET 请求用于建立 SSE 连接
 */
router.get('/stream/:sessionId', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  
  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  Logger.info(`New SSE connection for sessionId: ${sessionId}`);

  // 创建 SSE 写入器
  const sseWriter = new SSEWriter(res);
  
  // 存储连接
  activeConnections.set(sessionId, sseWriter);

  // 监听客户端断开连接
  req.on('close', () => {
    Logger.info(`SSE connection closed for sessionId: ${sessionId}`);
    activeConnections.delete(sessionId);
    sseWriter.close();
  });

  // 监听连接错误
  req.on('error', (error) => {
    Logger.error(`SSE connection error for sessionId ${sessionId}:`, error);
    activeConnections.delete(sessionId);
    sseWriter.close();
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
    const sseWriter = activeConnections.get(sessionId);
    if (!sseWriter) {
      res.status(404).json({ error: 'SSE connection not found. Please connect with GET request first.' });
      return;
    }

    // 响应请求已接收
    res.json({ success: true, sessionId, chatKey });

    // 异步处理聊天完成
    Logger.info(`Starting chat completion for sessionId: ${sessionId}, chatKey: ${chatKey}, agent: ${agentName}`);
    
    streamChatCompletion({
      sessionId,
      chatKey,
      messages,
      userMessage,
      agentName,
      agentScope,
      configOverrides,
      sseWriter, // 传递 SSE 写入器
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

    const sseWriter = activeConnections.get(sessionId);
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
    const { sessionId, agentName, agentScope = 'workspace', config } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    if (!agentName) {
      res.status(400).json({ error: 'agentName is required' });
      return;
    }

    if (!config) {
      res.status(400).json({ error: 'config is required' });
      return;
    }

    Logger.info(`Manual memory compression requested for sessionId: ${sessionId}, agent: ${agentName}`);

    // 获取对应的 SSE 连接
    const sseWriter = activeConnections.get(sessionId);
    
    // 获取工作区和 Agent
    const { getWorkspaceManager } = await import('../workspace/index.mjs');
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getCurrentWorkspace();

    if (!workspace) {
      res.status(404).json({ error: 'No workspace available' });
      return;
    }

    const agent = await workspace.getAgentInstance(agentName);
    if (!agent) {
      res.status(404).json({ error: `Agent not found: ${agentName}` });
      return;
    }

    // 获取当前聊天历史（这里简化处理，实际应该从agent获取当前会话的消息）
    const chatLogs = await agent.getChatLogs();
    let currentMessages: MyMessage[] = [];
    
    if (chatLogs.length > 0) {
      // 获取最新的聊天记录
      const latestChatLog = chatLogs[0];
      currentMessages = latestChatLog.messages || [];
    }

    if (currentMessages.length === 0) {
      res.status(400).json({ error: 'No messages to compress' });
      return;
    }

    // 创建临时 AiChannel 进行压缩
    const { AiChannel } = await import('../ai/ai.mjs');
    const aiChannel = new AiChannel({}, [...currentMessages]);
    aiChannel.register();

    // 执行压缩
    const compressedMessage = await aiChannel.compressMemory(
      config.modelKey,
      undefined, // onUpdate
      sseWriter   // sseWriter
    );

    // 更新token使用信息
    aiChannel.updateTokenUsage(config);

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