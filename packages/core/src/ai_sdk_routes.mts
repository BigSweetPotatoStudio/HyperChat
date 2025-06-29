import { Router, Request, Response } from 'express';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { AI_MODELS } from "../../shared/data.mjs";
import { Logger } from "./polyfills/log.mjs";

/**
 * AI SDK 标准路由处理器
 * 提供符合 Vercel AI SDK 标准的 API 端点
 */
export function createAISDKRouter(): Router {
  const router = Router();

  // 测试路由
  router.get('/test', (req: Request, res: Response) => {
    Logger.info('AI SDK test route accessed');
    res.json({ message: 'AI SDK router is working', timestamp: Date.now() });
  });

  // 添加一个简单的 GET /ai-chat 用于测试
  router.get('/ai-chat', (req: Request, res: Response) => {
    Logger.info('GET /ai-chat accessed');
    res.json({ message: 'AI Chat endpoint is accessible', method: 'GET' });
  });

  // OPTIONS 预检请求处理
  router.options('/ai-chat', (req: Request, res: Response) => {
    Logger.info('OPTIONS /ai-chat accessed');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(200).end();
  });

  // POST /ai-chat - AI SDK 标准聊天端点
  router.post('/ai-chat', async (req: Request, res: Response): Promise<void> => {
    try {
      Logger.info('AI SDK Chat request received:', { 
        path: req.path, 
        body: req.body ? 'body present' : 'no body',
        headers: req.headers 
      });

      const { messages, modelKey, ...options } = req.body;

      if (!messages || !Array.isArray(messages)) {
        Logger.error('Invalid request: messages missing or not array');
        res.status(400).json({
          error: 'Messages array is required'
        });
        return;
      }

      if (!modelKey) {
        res.status(400).json({
          error: 'Model key is required'
        });
        return;
      }

      // 获取模型配置
      await AI_MODELS.init();
      const config = AI_MODELS.get().data.find(x => x.key === modelKey);
      
      if (!config) {
        res.status(404).json({
          error: `Model not found: ${modelKey}`
        });
        return;
      }

      Logger.info('AI SDK Chat request:', { 
        modelKey, 
        messageCount: messages.length,
        config: config.name 
      });

      // 创建 AI 实例
      let ai;
      if (config.provider === 'anthropic' || config.model.includes('claude')) {
        ai = createAnthropic({
          baseURL: config.baseURL,
          apiKey: config.apiKey,
        });
      } else {
        // 默认使用 OpenAI 兼容格式
        ai = createOpenAI({
          baseURL: config.baseURL,
          apiKey: config.apiKey,
        });
      }

      // 使用 AI SDK 进行流式处理
      const result = await streamText({
        model: ai(config.model),
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        ...options,
      });

      // AI SDK 需要特定的流式响应格式
      const response = result.toDataStreamResponse();
      
      // 设置响应头以匹配 AI SDK 期望的格式
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      // 将 AI SDK 的标准流式响应传输到 Express 响应
      if (response.body) {
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      
      res.end();

    } catch (error) {
      Logger.error('AI SDK Chat error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Internal server error'
        });
      }
    }
  });

  // GET /api/models - 获取可用模型列表
  router.get('/models', async (_req: Request, res: Response) => {
    try {
      await AI_MODELS.init();
      const models = AI_MODELS.get().data
        .filter(x => x.type === 'llm' || x.type == null)
        .map(model => ({
          id: model.key,
          name: model.name,
          provider: model.provider,
          supportImage: model.supportImage,
          supportTool: model.supportTool,
        }));

      res.json({
        models,
        total: models.length,
      });
    } catch (error) {
      Logger.error('Get models error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get models'
      });
    }
  });

  return router;
}