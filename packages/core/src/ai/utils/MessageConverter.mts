import type { CoreMessage, TextPart, ImagePart, ToolCallPart } from 'ai';
import type { MyMessage } from "@dadigua/hyperchat-shared";
import { v4 } from "uuid";

/**
 * 消息转换工具类
 * 负责在不同消息格式之间进行转换
 */
export class MessageConverter {
  /**
   * 将 MyMessage 数组转换为 CoreMessage 数组
   * 支持记忆压缩和多种消息类型
   */
  static convertToCoreMessages(messages: MyMessage[]): CoreMessage[] {
    const results: CoreMessage[] = [];

    // 查找最后一个成功的记忆消息索引
    const lastMemoryIndex = messages.findLastIndex(m => m.role === "hyper_memory" && m.content_status === "success");

    for (let i = 0; i < messages.length; i++) {
      // 跳过记忆消息之前的消息
      if (i < lastMemoryIndex) {
        continue;
      }

      const message = messages[i]!;
      if (message.content_status != "success" && message.role === "assistant") {
        continue;
      }
      const convertedMessage = this.convertSingleMessage(message);
      if (convertedMessage) {
        results.push(convertedMessage);
      }
    }

    return results;
  }

  /**
   * 转换单个消息
   */
  private static convertSingleMessage(message: MyMessage): CoreMessage | null {
    switch (message.role) {
      case 'tool':
        return this.convertToolMessage(message);
      case 'hyper_memory':
        return this.convertMemoryMessage(message);
      case 'system':
        return this.convertSystemMessage(message);
      case 'user':
        return this.convertUserMessage(message);
      case 'assistant':
        return this.convertAssistantMessage(message);
      default:
        console.error(new Error(`Unsupported message role: ${(message as any).role}`));
        return null;
    }
  }

  /**
   * 转换工具消息
   */
  private static convertToolMessage(message: MyMessage): CoreMessage {
    return {
      role: 'tool',
      content: [
        {
          type: 'tool-result',
          toolCallId: message.tool_call_id || "",
          toolName: message.tool_call_name || "",
          result: message.content as string,
        },
      ],
    };
  }

  /**
   * 转换记忆消息为用户消息
   */
  private static convertMemoryMessage(message: MyMessage): CoreMessage {
    const memoryMessage = message as MyMessage & { memory_key_points?: string[] };
    const memoryContent = `[Memory Summary]: ${message.content}${memoryMessage.memory_key_points ? '\n[Key Points]: ' + memoryMessage.memory_key_points.join(', ') : ''
      }`;

    return {
      role: 'user',
      content: memoryContent,
    };
  }

  /**
   * 转换系统消息
   */
  private static convertSystemMessage(message: MyMessage): CoreMessage {
    return {
      role: 'system',
      content: message.content as string,
    };
  }

  /**
   * 转换用户消息
   */
  private static convertUserMessage(message: MyMessage): CoreMessage {
    const content: Array<TextPart | ImagePart> = [];

    if (typeof message.content === 'string') {
      content.push({ type: 'text', text: message.content });
    } else if (Array.isArray(message.content)) {
      for (const contentItem of message.content) {
        if (contentItem.type === 'text') {
          content.push({ type: 'text', text: contentItem.text });
        } else if (contentItem.type === 'image_url') {
          content.push({
            type: 'image',
            image: contentItem.image_url.url,
          });
        } else {
          console.error(new Error(`Unsupported user content type: ${contentItem}`));
        }
      }
    } else {
      throw new Error(`Unsupported user content type: ${typeof message.content}`);
    }

    return {
      role: 'user',
      content: content,
    };
  }

  /**
   * 转换助手消息
   */
  private static convertAssistantMessage(message: MyMessage): CoreMessage {
    const content: Array<TextPart | ToolCallPart> = [];

    // 处理文本内容
    if (typeof message.content === 'string') {
      content.push({ type: 'text', text: message.content });
    } else if (Array.isArray(message.content)) {
      for (const contentItem of message.content) {
        if (contentItem.type === 'text') {
          content.push({ type: 'text', text: contentItem.text });
        } else {
          console.error(new Error(`Unsupported assistant content type: ${contentItem}`));
        }
      }
    } else {
      throw new Error(`Unsupported assistant content type: ${typeof message.content}`);
    }

    // 处理工具调用
    if (message.content_tool_calls && message.content_tool_calls.length > 0) {
      for (const toolCall of message.content_tool_calls) {
        const toolCallId = toolCall.id || v4();
        content.push({
          args: toolCall.function.args || {},
          toolCallId: toolCallId,
          toolName: toolCall.function.name,
          type: "tool-call",
        });
      }
    }

    return {
      role: 'assistant',
      content: content
    };
  }

  /**
   * 生成消息ID
   */
  static generateMessageId(role: string, messageIndex: number): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `${role}_${messageIndex}_${timestamp}`;
  }

  /**
   * 生成工具消息ID
   */
  static generateToolMessageId(messageIndex: number): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `tool_${messageIndex}_${timestamp}`;
  }
}