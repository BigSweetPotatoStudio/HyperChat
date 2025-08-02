import type { MyMessage, BaseAIConfig, AISettings } from "@dadigua/hyperchat-shared";
import { z, ZodSchema } from "zod";
import { Logger } from "../log.mjs";
import { SSEWriter } from "../sse/SSEWriter.mjs";
import { Command } from "../command.mjs";

/**
 * Token 计算工具类
 */
export class TokenCalculator {
  private static tokenCache = new Map<string, number>();
  private static readonly CACHE_MAX_SIZE = 1000;

  // 清空缓存
  static clearCache(): void {
    this.tokenCache.clear();
  }

  // 获取缓存大小
  static getCacheSize(): number {
    return this.tokenCache.size;
  }

  // 生成消息的缓存键
  private static generateCacheKey(message: MyMessage): string {
    let content = '';
    if (typeof message.content === 'string') {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      content = JSON.stringify(message.content);
    }
    return `${message.role}:${content.substring(0, 100)}:${message.content_usage?.total_tokens || 0}`;
  }

  // 估算消息token数量
  static estimateTokenCount(message: MyMessage): number {
    // 如果消息有实际的token使用统计，优先使用
    if (message.content_usage?.total_tokens) {
      return message.content_usage.total_tokens;
    }

    // 检查缓存
    const cacheKey = this.generateCacheKey(message);
    const cachedCount = this.tokenCache.get(cacheKey);
    if (cachedCount !== undefined) {
      return cachedCount;
    }

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

    // 简单估算：1 token ≈ 4 字符（对英文），1 token ≈ 1.5 字符（对中文）
    // 取平均值：1 token ≈ 2.5 字符
    const tokenCount = Math.ceil(content.length / 2.5);

    // 缓存结果，但限制缓存大小
    if (this.tokenCache.size >= this.CACHE_MAX_SIZE) {
      // 删除最早的缓存条目（简单的LRU策略）
      const firstKey = this.tokenCache.keys().next().value;
      if (firstKey) {
        this.tokenCache.delete(firstKey);
      }
    }
    this.tokenCache.set(cacheKey, tokenCount);

    return tokenCount;
  }

  // 计算从指定索引到最后的消息token总数
  static calculateMessagesTokenCount(messages: MyMessage[], fromIndex: number = 0): number {
    let totalTokens = 0;
    for (let i = fromIndex; i < messages.length; i++) {
      const message = messages[i]!;
      totalTokens += this.estimateTokenCount(message);
    }
    return totalTokens;
  }

  // 估算prompt的token数量
  static estimatePromptTokenCount(prompt: string): number {
    const cacheKey = `prompt:${prompt.substring(0, 100)}`;
    const cachedCount = this.tokenCache.get(cacheKey);
    if (cachedCount !== undefined) {
      return cachedCount;
    }

    const tokenCount = Math.ceil(prompt.length / 2.5);

    // 缓存结果
    if (this.tokenCache.size >= this.CACHE_MAX_SIZE) {
      const firstKey = this.tokenCache.keys().next().value;
      if (firstKey) {
        this.tokenCache.delete(firstKey);
      }
    }
    this.tokenCache.set(cacheKey, tokenCount);

    return tokenCount;
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
  strategy: 'tokens' | 'dialogs';
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
   * 获取当前AI设置配置
   */
  private async getAISettings(): Promise<AISettings> {
    const appSettings = await Command.getAppSettings();
    if (!appSettings.ai) {
      throw new Error('AI配置未找到');
    }
    return appSettings.ai;
  }

  /**
   * 检查是否需要压缩记忆（返回详细信息）
   */
  shouldCompressMemory(messages: MyMessage[], params: BaseAIConfig): MemoryCompressionCheck {
    const strategy = params.compressionStrategy || "tokens";
    const lastMemoryIndex = messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");
    const startIndex = lastMemoryIndex === -1 ? 0 : lastMemoryIndex + 1;

    // 基于token数量的压缩策略
    if (strategy === "tokens") {
      return this.checkCompressByTokens(messages, params, startIndex);
    }

    // 基于对话轮数的压缩策略（原有逻辑）
    return this.checkCompressByDialogs(messages, params, startIndex);
  }

  /**
   * 基于token数量的压缩检查（返回详细信息）
   */
  private checkCompressByTokens(messages: MyMessage[], params: BaseAIConfig, startIndex: number): MemoryCompressionCheck {
    const maxTokens = params.maxContextTokens || 36000;
    const promptTokens = TokenCalculator.estimatePromptTokenCount(params.prompt || '');
    const messageTokens = TokenCalculator.calculateMessagesTokenCount(messages, startIndex);
    const currentTokens = promptTokens + messageTokens;
    const percentage = Math.round((currentTokens / maxTokens) * 100);
    const shouldCompress = currentTokens >= maxTokens;

    Logger.debug(`Token usage: prompt=${promptTokens}, messages=${messageTokens}, total=${currentTokens}, limit=${maxTokens}`);
    
    return {
      shouldCompress,
      current: currentTokens,
      max: maxTokens,
      percentage,
      strategy: 'tokens'
    };
  }

  /**
   * 基于token数量的压缩判断（向后兼容）
   */
  private shouldCompressMemoryByTokens(messages: MyMessage[], params: BaseAIConfig, startIndex: number): boolean {
    return this.checkCompressByTokens(messages, params, startIndex).shouldCompress;
  }

  /**
   * 基于对话轮数的压缩检查（返回详细信息）
   */
  private checkCompressByDialogs(messages: MyMessage[], params: BaseAIConfig, startIndex: number): MemoryCompressionCheck {
    let userMessageCount = 0;
    for (let i = startIndex; i < messages.length; i++) {
      if (messages[i]!.role === "user") {
        userMessageCount++;
      }
    }
    const maxDialogs = params.maxAttachedDialogs || 5;
    const shouldCompress = userMessageCount >= maxDialogs;
    const percentage = Math.round((userMessageCount / maxDialogs) * 100);

    return {
      shouldCompress,
      current: userMessageCount,
      max: maxDialogs,
      percentage,
      strategy: 'dialogs'
    };
  }

  /**
   * 基于对话轮数的压缩判断（向后兼容）
   */
  private shouldCompressMemoryByDialogs(messages: MyMessage[], params: BaseAIConfig, startIndex: number): boolean {
    return this.checkCompressByDialogs(messages, params, startIndex).shouldCompress;
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