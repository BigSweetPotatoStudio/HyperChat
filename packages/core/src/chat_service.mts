import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateText, CoreMessage, CoreTool } from 'ai';
import { GPT_MODELS_TYPE, MyMessage } from "../../shared/data.mjs";
import { Logger } from "./polyfills/log.mjs";

/**
 * AI聊天服务，使用 Vercel AI SDK 处理LLM请求
 */
export class ChatService {
  private logger = Logger;

  /**
   * 根据模型配置创建AI实例
   */
  private createAIInstance(config: GPT_MODELS_TYPE) {
    const { provider, baseURL, apiKey, model } = config;
    
    if (provider === 'anthropic' || model.includes('claude')) {
      return createAnthropic({
        baseURL,
        apiKey,
      });
    } else {
      // 默认使用 OpenAI 兼容格式
      return createOpenAI({
        baseURL,
        apiKey,
      });
    }
  }

  /**
   * 将 MyMessage 转换为 CoreMessage
   */
  private convertToCoreMessages(messages: MyMessage[]): CoreMessage[] {
    return messages
      .filter(msg => msg.content_attached !== false) // 只包含附加的消息
      .map(msg => {
        const coreMessage: CoreMessage = {
          role: msg.role as any,
          content: '',
        };

        // 处理不同类型的内容
        if (typeof msg.content === 'string') {
          coreMessage.content = msg.content;
        } else if (Array.isArray(msg.content)) {
          // 处理多模态内容（文本+图片）
          coreMessage.content = msg.content.map(item => {
            if (item.type === 'text') {
              return {
                type: 'text',
                text: item.text || '',
              };
            } else if (item.type === 'image_url') {
              return {
                type: 'image',
                image: item.image_url?.url || '',
              };
            }
            return item;
          }) as any;
        }

        // 处理工具调用
        if (msg.tool_calls) {
          coreMessage.toolInvocations = msg.tool_calls.map(call => ({
            toolCallId: call.id,
            toolName: call.function.name,
            args: JSON.parse(call.function.arguments || '{}'),
          }));
        }

        return coreMessage;
      });
  }

  /**
   * 流式聊天
   */
  async streamChat(
    config: GPT_MODELS_TYPE,
    messages: MyMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      tools?: CoreTool[];
      onChunk?: (chunk: string) => void;
      onFinish?: (result: { text: string; usage?: any }) => void;
      onError?: (error: Error) => void;
    } = {}
  ) {
    try {
      const ai = this.createAIInstance(config);
      const coreMessages = this.convertToCoreMessages(messages);
      
      this.logger.info('开始流式聊天', { 
        model: config.model,
        messageCount: coreMessages.length 
      });

      const result = await streamText({
        model: ai(config.model),
        messages: coreMessages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        tools: options.tools,
      });

      let fullText = '';
      
      // 处理流式数据
      for await (const chunk of result.textStream) {
        fullText += chunk;
        options.onChunk?.(chunk);
      }

      const finalResult = await result.finishReason;
      const usage = await result.usage;
      
      options.onFinish?.({
        text: fullText,
        usage: usage,
      });

      return {
        text: fullText,
        usage: usage,
        finishReason: finalResult,
      };

    } catch (error) {
      this.logger.error('流式聊天错误:', error);
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * 非流式聊天
   */
  async generateChat(
    config: GPT_MODELS_TYPE,
    messages: MyMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      tools?: CoreTool[];
    } = {}
  ) {
    try {
      const ai = this.createAIInstance(config);
      const coreMessages = this.convertToCoreMessages(messages);
      
      this.logger.info('开始生成聊天', { 
        model: config.model,
        messageCount: coreMessages.length 
      });

      const result = await generateText({
        model: ai(config.model),
        messages: coreMessages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        tools: options.tools,
      });

      return {
        text: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      };

    } catch (error) {
      this.logger.error('生成聊天错误:', error);
      throw error;
    }
  }

  /**
   * 将AI SDK的工具调用转换为OpenAI格式
   */
  private convertToolCallsToOpenAI(toolCalls: any[]) {
    return toolCalls?.map(call => ({
      id: call.toolCallId,
      type: 'function' as const,
      function: {
        name: call.toolName,
        arguments: JSON.stringify(call.args),
      },
    })) || [];
  }

  /**
   * 创建助手消息，包含AI回复和可能的工具调用
   */
  createAssistantMessage(result: {
    text: string;
    usage?: any;
    toolCalls?: any[];
    finishReason?: string;
  }): MyMessage {
    const message: MyMessage = {
      role: 'assistant',
      content: result.text,
      content_date: Date.now(),
      content_status: 'success',
      content_usage: result.usage ? {
        prompt_tokens: result.usage.promptTokens || 0,
        completion_tokens: result.usage.completionTokens || 0,
        total_tokens: result.usage.totalTokens || 0,
      } : undefined,
    };

    // 如果有工具调用，添加到消息中
    if (result.toolCalls && result.toolCalls.length > 0) {
      message.tool_calls = this.convertToolCallsToOpenAI(result.toolCalls);
    }

    return message;
  }
}

// 导出单例实例
export const chatService = new ChatService();