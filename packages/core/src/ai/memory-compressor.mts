import type { MyMessage, BaseAIConfig, AISettings } from "@dadigua/hyperchat-shared";
import { z, ZodSchema } from "zod";
import { Logger } from "../log.mjs";
import { SSEWriter } from "../sse/SSEWriter.mjs";
import { Command } from "../command.mjs";

/**
 * Token 计算工具类
 */
export class TokenCalculator {

  // 估算消息token数量
  static estimateTokenCount(message: MyMessage): number {
    // 如果消息有实际的token使用统计，优先使用

    let content = '';
    if (typeof message.content === 'string') {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      content = message.content.map(c => {
        if (c.type === 'text') return c.text;
        if (c.type === 'image_url') return '[image]';
        return '';
      }).join('');
    }

    return TokenCalculator.estimatePromptTokenCount(content);
  }


  // 计算消息token总数并返回是否包含真实数据
  static calculateMessagesTokenCountWithType(messages: MyMessage[], prompt: string, fromIndex: number = 0): { totalTokens: number; hasActualTokens: boolean } {
    let totalTokens = 0;
    let hasActualTokens = false;


    for (let i = fromIndex; i < messages.length; i++) {
      const message = messages[i];
      if (message.content_usage?.total_tokens) {
        totalTokens = message.content_usage.total_tokens;
        hasActualTokens = true; // 如果有实际的token使用统计，则标记为true
      } else {
        totalTokens += TokenCalculator.estimateTokenCount(message);
      }
    }
    const promptTokens = hasActualTokens ? 0 : TokenCalculator.estimatePromptTokenCount(prompt || '');
    return { totalTokens: promptTokens + totalTokens, hasActualTokens };
  }

  // 估算prompt的token数量
  static estimatePromptTokenCount(prompt: string): number {
    return Math.ceil(prompt.length / 4);
  }
}


/**
 * 记忆摘要结构
 */
export interface MemorySummary {
  title: string;
  summary: string;
  key_points: string[];
  important_context: string;
}

/**
 * 记忆压缩检查结果
 */
export interface MemoryCompressionCheck {
  shouldCompress: boolean;
  current: number;
  max: number;
  percentage: number;
  strategy: 'tokens';
  type: 'estimated' | 'actual'; // 添加类型字段：estimated（估计）或 actual（真实）
}

/**
 * 记忆压缩器类
 * 负责处理聊天记录的记忆压缩逻辑
 */
export class MemoryCompressor {
  constructor(
    private generateSummaryFn: (messages: MyMessage[], modelKey: string) => Promise<MemorySummary>
  ) { }


  /**
   * 检查是否需要压缩记忆（返回详细信息）
   */
  shouldCompressMemory(messages: MyMessage[], params: Pick<BaseAIConfig, "compressionStrategy" | "maxContextTokens" | "prompt">): MemoryCompressionCheck {
    const lastMemoryIndex = messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");
    const startIndex = lastMemoryIndex === -1 ? 0 : lastMemoryIndex + 1;

    // 只使用基于token数量的压缩策略
    return this.checkCompressByTokens(messages, params, startIndex);
  }

  /**
   * 基于token数量的压缩检查（返回详细信息）
   */
  private checkCompressByTokens(messages: MyMessage[], params: Pick<BaseAIConfig, "maxContextTokens" | "prompt">, startIndex: number): MemoryCompressionCheck {
    const maxTokens = params.maxContextTokens || 32000;

    // 计算消息token并检查是否有真实统计
    const { totalTokens: messageTokens, hasActualTokens } = TokenCalculator.calculateMessagesTokenCountWithType(messages, params.prompt, startIndex);
    const currentTokens = messageTokens;
    const percentage = Math.round((currentTokens / maxTokens) * 100);
    const shouldCompress = currentTokens >= maxTokens;

    // 确定数据类型：如果消息包含真实token统计且prompt使用估计，则为混合（标记为estimated）
    // 只有当所有数据都是真实的时候才标记为actual
    const type: 'estimated' | 'actual' = hasActualTokens ? 'actual' : 'estimated';

    Logger.debug(`Token usage: (estimated), messages=${messageTokens}(${hasActualTokens ? 'actual' : 'estimated'}), total=${currentTokens}, limit=${maxTokens}, type=${type}`);

    return {
      shouldCompress,
      current: currentTokens,
      max: maxTokens,
      percentage,
      strategy: 'tokens',
      type
    };
  }



  /**
   * 执行记忆压缩
   */
  async compressMemory(
    messages: MyMessage[],
    modelKey: string,
    onUpdate?: (r?: any) => void,
    sseWriter?: SSEWriter
  ): Promise<MyMessage> {
    const lastMemoryMessageIndex = messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");
    const startIndex = lastMemoryMessageIndex === -1 ? 0 : lastMemoryMessageIndex;
    let lastMessageIndex = messages.length;
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      lastMessageIndex -= 1; // 如果最后一条消息是用户消息，则不参与压缩
    }
    const compressMessagesCount = lastMessageIndex - lastMemoryMessageIndex - 1;

    // 生成内存消息的 messageId
    const timestamp = Math.floor(Date.now() / 1000);
    const messageId = `memory_${messages.length}_${timestamp}`;

    const memoryMessage: MyMessage = {
      role: "hyper_memory",
      content: "compressing...",
      memory_key_points: [],
      memory_original_count: compressMessagesCount,
      content_date: Date.now(),
      content_status: "loading",
      messageId: messageId,
    };
    messages.push(memoryMessage);
    // 发送内存消息创建事件
    this.sendSSEMessage(sseWriter, "chat_message_create", {
      messageId: messageId,
      message: memoryMessage,
    });

    onUpdate && onUpdate();

    try {
      const useModelKey = modelKey;

      if (!useModelKey) {
        throw new Error('未找到可用的AI模型');
      }

      const summary = await this.generateSummaryFn(
        messages.slice(startIndex, lastMessageIndex),
        useModelKey
      );

      memoryMessage.content = summary.summary;
      memoryMessage.memory_key_points = summary.key_points;
      memoryMessage.memory_original_count = compressMessagesCount;
      memoryMessage.content_date = Date.now();
      memoryMessage.content_status = "success";

      // 发送内存消息更新事件
      this.sendSSEMessage(sseWriter, "chat_message_replace", {
        messageId: messageId,
        message: memoryMessage,
      });

      onUpdate && onUpdate({ type: "compress", data: summary });
      Logger.info(`Memory compressed: ${compressMessagesCount} messages → 1 memory message`);

      return memoryMessage;
    } catch (error) {
      memoryMessage.content_status = "error";
      memoryMessage.content = "记忆压缩失败，继续使用完整对话历史";
      memoryMessage.content_date = Date.now();

      // 发送内存消息错误事件
      this.sendSSEMessage(sseWriter, "chat_message_replace", {
        messageId: messageId,
        message: memoryMessage,
      });

      onUpdate && onUpdate({ type: "compress_error", error });
      Logger.error("Memory compression failed:", error);
      Logger.warn("记忆压缩失败，继续使用完整对话历史");

      return memoryMessage;
    }
  }

  /**
   * 发送SSE消息的辅助方法
   */
  private sendSSEMessage(sseWriter: SSEWriter | undefined, type: string, data: any) {
    if (sseWriter && !sseWriter.isClosed()) {
      sseWriter.write({ type, data });
    }
  }

}

/**
 * 默认的记忆摘要生成函数
 */
export function createDefaultMemorySummaryGenerator(
  completionParseFn: (params: { modelKey: string }, schema: ZodSchema, prompt: string) => Promise<any>
) {
  return async (messages: MyMessage[], modelKey: string): Promise<MemorySummary> => {
    const conversationText = messages.map(m => {
      if (m.role === "user") return `用户: ${m.content}`;
      if (m.role === "assistant") return `助手: ${m.content}`;
      // if (m.role === "system") return `系统: ${m.content}`;
      // if (m.role === "tool") return `工具结果: ${m.content}`;
      return "";
    }).filter(Boolean).join("\n");

    const memoryPrompt = `请总结以下对话的关键信息，保留重要的上下文和决策点：

${conversationText}

请用JSON格式返回：
- title: 对话的简短标题，3-10个字
- summary: 对话的简洁摘要
- key_points: 重要观点和决策的数组
- important_context: 需要保留的重要上下文信息`;

    return await completionParseFn(
      { modelKey },
      z.object({
        title: z.string(),
        summary: z.string(),
        key_points: z.array(z.string()),
        important_context: z.string()
      }),
      memoryPrompt
    );
  };
}