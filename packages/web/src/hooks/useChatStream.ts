/**
 * 聊天流式处理 Hook - SSE 版本
 * 使用 Server-Sent Events 处理 AI 流式响应
 */

import { useRef, useCallback, useReducer, useEffect } from 'react';
import { MyMessage, HyperToolCall } from "@dadigua/hyperchat-shared/types";
import { BaseAIConfig } from "@dadigua/hyperchat-shared";
// import { message } from 'antd';
// import { t } from '../i18n';
import { getURL_PRE } from '../common/call';

interface ChatStreamParams {
  /** Agent 名称 */
  agentName?: string;
  /** Agent 作用域 */
  agentScope?: "global" | "workspace";
  /** 工具确认回调 */
  onToolConfirm?: (tool: HyperToolCall) => Promise<any>;
}

interface ChatStreamState {
  /** 当前聊天消息 */
  messages: MyMessage[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** Token使用信息 */
  tokenUsage?: {
    current: number;
    max: number;
    percentage: number;
    strategy: 'tokens' | 'dialogs';
  };
}

export function useChatStream(params: ChatStreamParams) {
  // 使用 ref 存储状态，避免 setState 的异步问题
  const stateRef = useRef<ChatStreamState>({
    messages: [],
    loading: false,
    error: null,
    tokenUsage: undefined,
  });

  // 强制更新 hook
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const useForceUpdate = useCallback(() => forceUpdate(), []);

  const eventSourceRef = useRef<EventSource | null>(null);

  // 连接 SSE
  const connectSSE = useCallback((sessionId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 关闭现有连接
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      console.log(`Connecting to SSE for sessionId: ${sessionId}`);
      
      const urlPrefix = getURL_PRE();
      const eventSource = new EventSource(`${urlPrefix}/api/chat/stream/${sessionId}`);
      eventSourceRef.current = eventSource;

      // 设置连接超时
      const timeout = setTimeout(() => {
        reject(new Error('SSE connection timeout'));
      }, 5000); // 5秒超时

      // 连接成功
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('SSE connected:', data);
        clearTimeout(timeout);
        resolve(); // 连接成功，解析 Promise
      });

    // 心跳检测
    eventSource.addEventListener('ping', (event) => {
      // 静默处理心跳
    });

    // 处理消息创建事件
    eventSource.addEventListener('chat_message_create', (event) => {
      const data = JSON.parse(event.data);
      
      // 直接操作 ref
      const existingIndex = stateRef.current.messages.findIndex(m => m.messageId === data.messageId);
      if (existingIndex !== -1) {
        // 更新现有消息
        stateRef.current.messages[existingIndex] = data.message;
      } else {
        // 添加新消息
        stateRef.current.messages.push(data.message);
      }

      stateRef.current.loading = data.message.role === 'assistant';
      stateRef.current.error = null;

      useForceUpdate();
    });

    // 处理消息替换事件
    eventSource.addEventListener('chat_message_replace', (event) => {
      const data = JSON.parse(event.data);
      
      // 找到要更换的消息
      const messageIndex = stateRef.current.messages.findIndex(m => m.messageId === data.messageId);
      if (messageIndex === -1) {
        console.warn(`Message with ID ${data.messageId} not found for replace`);
        return;
      }

      stateRef.current.messages[messageIndex] = data.message;
      useForceUpdate();
    });

    // 处理消息更新事件 (delta)
    eventSource.addEventListener('chat_message_update', (event) => {
      const data = JSON.parse(event.data);
      
      // 直接处理 delta，实时更新
      const messageIndex = stateRef.current.messages.findIndex(m => m.messageId === data.messageId);
      if (messageIndex === -1) {
        console.warn(`Message with ID ${data.messageId} not found for update`);
        return;
      }

      const message = stateRef.current.messages[messageIndex];
      const delta = data.delta;

      // 处理不同类型的流式响应
      if (delta.type === 'text-delta') {
        const textDelta = delta.textDelta || '';
        message.content = (message.content || '') + textDelta;
        message.content_date = Date.now();
      } else if (delta.type === 'reasoning') {
        message.reasoning_content = (message.reasoning_content || '') + (delta.textDelta || '');
        message.content_date = Date.now();
      } else if (delta.type === 'tool-call') {
        if (!message.content_tool_calls) {
          message.content_tool_calls = [];
        }
        // const toolIndex = message.content_tool_calls.length;
        message.content_tool_calls.push(delta.hypertool);
        message.content_date = Date.now();
      } else if (delta.type === 'step-finish') {
        if (delta.usage) {
          message.content_usage = {
            prompt_tokens: delta.usage.promptTokens || 0,
            completion_tokens: delta.usage.completionTokens || 0,
            total_tokens: delta.usage.totalTokens || 0,
          };
        }
      }

      useForceUpdate();
    });

    // 处理消息完成事件
    eventSource.addEventListener('chat_message_complete', (event) => {
      const data = JSON.parse(event.data);
      
      // 找到最后一条助手消息并标记为完成
      const lastAssistantIndex = stateRef.current.messages.findLastIndex(m => m.role === 'assistant');

      if (lastAssistantIndex !== -1) {
        stateRef.current.messages[lastAssistantIndex] = {
          ...stateRef.current.messages[lastAssistantIndex],
          content_status: 'success',
        };
      }

      stateRef.current.loading = false;
      useForceUpdate();
    });

    // 处理token使用信息事件
    eventSource.addEventListener('token_usage_update', (event) => {
      const data = JSON.parse(event.data);
      
      // 更新token使用信息
      stateRef.current.tokenUsage = data.tokenUsage;
      useForceUpdate();
    });

    // 处理消息错误事件
    eventSource.addEventListener('chat_message_error', (event) => {
      const data = JSON.parse(event.data);
      
      // 找到最后一条助手消息并标记为错误
      const lastAssistantIndex = stateRef.current.messages.findLastIndex(m => m.role === 'assistant');

      if (lastAssistantIndex !== -1) {
        stateRef.current.messages[lastAssistantIndex] = {
          ...stateRef.current.messages[lastAssistantIndex],
          content_status: 'error',
          content_error: data.error,
        };
      }

      stateRef.current.error = data.error;
      stateRef.current.loading = false;

      useForceUpdate();
    });

    // 监听工具确认请求
    eventSource.addEventListener('tool_confirm_request', (event) => {
      const data = JSON.parse(event.data);
      
      if (params.onToolConfirm) {
        params.onToolConfirm(data.tool).then((result) => {
          // 发送确认响应
          const urlPrefix = getURL_PRE();
          fetch(`${urlPrefix}/api/chat/tool-confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              confirmId: data.confirmId,
              confirmed: true,
              args: result,
            }),
          });
        }).catch((error) => {
          // 发送取消响应
          const urlPrefix = getURL_PRE();
          fetch(`${urlPrefix}/api/chat/tool-confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              confirmId: data.confirmId,
              confirmed: false,
              error: error instanceof Error ? error.message : String(error),
            }),
          });
        });
      }
    });

      // 处理连接错误
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        clearTimeout(timeout);
        reject(new Error('SSE connection failed'));
        
        // 设置错误状态
        stateRef.current.error = 'Connection lost';
        stateRef.current.loading = false;
        useForceUpdate();
        
        // 尝试重连 (浏览器会自动重连，这里只是记录)
        console.log('SSE will automatically reconnect...');
      };

      // 监听连接状态变化
      eventSource.addEventListener('open', () => {
        console.log('SSE connection opened');
        stateRef.current.error = null;
        useForceUpdate();
      });
    });

  }, [useForceUpdate, params.onToolConfirm]);

  // 清理 SSE 连接
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      console.log('SSE connection closed');
    }
  }, []);

  // 开始聊天流
  const startChatStream = useCallback(async (
    chatKey: string,
    messages: MyMessage[],
    configOverrides: Partial<BaseAIConfig>,
    userMessage?: MyMessage,
  ) => {
    try {
      // 1. 设置状态
      stateRef.current.loading = true;
      stateRef.current.error = null;
      useForceUpdate();

      // 2. 生成 sessionId
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 3. 连接 SSE，等待连接完成
      await connectSSE(sessionId);

      // 4. 发送开始聊天请求
      const urlPrefix = getURL_PRE();
      const response = await fetch(`${urlPrefix}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          chatKey,
          messages,
          userMessage,
          agentName: params.agentName || 'default',
          agentScope: params.agentScope || 'workspace',
          configOverrides
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start chat: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      stateRef.current.loading = false;
      stateRef.current.error = error instanceof Error ? error.message : String(error);
      useForceUpdate();
      throw error;
    }
  }, [connectSSE, params.agentName, params.agentScope, useForceUpdate]);


  // 取消聊天流
  const cancelChatStream = useCallback(async (sessionId: string) => {
    try {
      const urlPrefix = getURL_PRE();
      await fetch(`${urlPrefix}/api/chat/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (error) {
      console.error('Failed to cancel chat stream:', error);
    }

    stateRef.current.loading = false;
    useForceUpdate();
  }, [useForceUpdate]);

  // 重置聊天状态
  const resetChatStream = useCallback(() => {
    disconnectSSE();
    stateRef.current.messages = [];
    stateRef.current.loading = false;
    stateRef.current.error = null;
    useForceUpdate();
  }, [disconnectSSE, useForceUpdate]);

  // 设置消息
  const setMessages = useCallback((messages: MyMessage[]) => {
    stateRef.current.messages = messages;
    useForceUpdate();
  }, [useForceUpdate]);


  // 手动压缩记忆
  const compressMemory = useCallback(async (
    sessionId: string, 
    modelKey: string,
    compressionStrategy?: 'tokens' | 'dialogs',
    maxContextTokens?: number,
    maxAttachedDialogs?: number,
    prompt?: string
  ) => {
    try {
      const urlPrefix = getURL_PRE();
      const response = await fetch(`${urlPrefix}/api/chat/compress-memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId,
          modelKey,
          compressionStrategy,
          maxContextTokens,
          maxAttachedDialogs,
          prompt
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to compress memory: ${response.statusText}`);
      }

      const result = await response.json();
      
      // 压缩成功后更新消息列表
      if (result.messages) {
        stateRef.current.messages = result.messages;
      }
      
      // 更新token使用信息
      if (result.tokenUsage) {
        stateRef.current.tokenUsage = result.tokenUsage;
      }
      
      useForceUpdate();
      return result;
    } catch (error) {
      console.error('Failed to compress memory:', error);
      throw error;
    }
  }, [useForceUpdate]);

  // 清理
  useEffect(() => {
    return () => {
      disconnectSSE();
    };
  }, [disconnectSSE]);

  return {
    ...stateRef.current, // 展开当前状态
    startChatStream,
    cancelChatStream,
    resetChatStream,
    setMessages,
    compressMemory,
  };
}

export default useChatStream;