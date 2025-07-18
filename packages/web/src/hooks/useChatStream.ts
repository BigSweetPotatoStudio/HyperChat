/**
 * 聊天流式处理 Hook
 * 用于处理后端 WebSocket 流式聊天响应
 */

import { useEffect, useRef, useCallback, useReducer } from 'react';
import { MyMessage, CommonContentItem, HyperToolCall } from "@dadigua/hyperchat-shared/types";
import { BaseAIConfig } from "@dadigua/hyperchat-shared";
import { call, getWebSocket } from '../common/call';
import { message } from 'antd';
import { t } from '../i18n';
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import type { TextStreamPart, ToolSet } from 'ai';

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
  /** 当前聊天 Key */
  chatKey: string | null;
}

export function useChatStream(params: ChatStreamParams) {
  // 使用 ref 存储状态，避免 setState 的异步问题
  const stateRef = useRef<ChatStreamState>({
    messages: [],
    loading: false,
    error: null,
    chatKey: null,
  });

  // 强制更新 hook
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const useForceUpdate = useCallback(() => forceUpdate(), []);

  const socketRef = useRef<any>(null);

  // 验证 chatKey 匹配的辅助函数
  const validateChatKey = useCallback((receivedChatKey: string, eventType: string) => {
    if (!stateRef.current.chatKey || stateRef.current.chatKey !== receivedChatKey) {
      console.warn(`Received ${eventType} with mismatched chatKey:`, receivedChatKey, 'expected:', stateRef.current.chatKey);
      return false;
    }
    return true;
  }, []);

  // 验证 chatKey 的辅助函数（ref 版本）
  const validateChatKeyInRef = useCallback((receivedChatKey: string, eventType: string) => {
    if (!stateRef.current.chatKey || stateRef.current.chatKey !== receivedChatKey) {
      console.warn(`State chatKey mismatch during ${eventType}:`, receivedChatKey, 'expected:', stateRef.current.chatKey);
      return false;
    }
    return true;
  }, []);

  // 初始化 WebSocket 连接
  useEffect(() => {
    const initSocket = async () => {
      try {
        const socket = await getWebSocket();
        socketRef.current = socket;

        // 监听消息创建事件
        socket.on('chat_message_create', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_create')) {
            return;
          }

          if (!validateChatKeyInRef(data.chatKey, 'message_create')) {
            return;
          }

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

        socket.on('chat_message_replace', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_replace')) {
            return;
          }

          if (!validateChatKeyInRef(data.chatKey, 'message_replace')) {
            return;
          }

          // 找到要更换的消息
          const messageIndex = stateRef.current.messages.findIndex(m => m.messageId === data.messageId);
          if (messageIndex === -1) {
            console.warn(`Message with ID ${data.messageId} not found for replace`);
            return;
          }

          stateRef.current.messages[messageIndex] = data.message;
          useForceUpdate();
        });

        socket.on('chat_message_update', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_update')) {
            return;
          }

          if (!validateChatKeyInRef(data.chatKey, 'message_update')) {
            return;
          }

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

            const toolIndex = message.content_tool_calls.length;
            message.content_tool_calls.push({
              index: toolIndex,
              id: delta.toolCallId,
              type: "function",
              function: {
                name: delta.toolName,
                args: delta.args || {},
              },
              origin_name: delta.toolName,
              restore_name: delta.toolName,
            });

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

        socket.on('chat_message_complete', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_complete')) {
            return;
          }

          if (!validateChatKeyInRef(data.chatKey, 'message_complete')) {
            return;
          }

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

        socket.on('chat_message_error', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_error')) {
            return;
          }

          if (!validateChatKeyInRef(data.chatKey, 'message_error')) {
            return;
          }

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
          message.error(data.error || t`An error occurred, please try again later`);
        });

        // 监听工具确认请求
        socket.on('tool_confirm_request', (data: any) => {
          // 验证 chatKey 匹配
          if (!validateChatKey(data.chatKey, 'tool_confirm_request')) {
            return;
          }

          if (params.onToolConfirm) {
            params.onToolConfirm(data.tool).then((result) => {
              // 发送确认响应
              socket.emit('tool_confirm_response', {
                chatKey: data.chatKey,
                confirmed: true,
                args: result,
              });
            }).catch((error) => {
              // 发送取消响应
              socket.emit('tool_confirm_response', {
                chatKey: data.chatKey,
                confirmed: false,
                error: error.message,
              });
            });
          }
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('chat_message_create');
        socketRef.current.off('chat_message_replace');
        socketRef.current.off('chat_message_update');
        socketRef.current.off('chat_message_complete');
        socketRef.current.off('chat_message_error');
        socketRef.current.off('tool_confirm_request');
      }
    };
  }, [params.onToolConfirm, validateChatKey, validateChatKeyInRef, useForceUpdate]);

  // 开始聊天流
  const startChatStream = useCallback(async (
    chatKey: string,
    messages: MyMessage[],
    /** 配置覆盖 */
    configOverrides: Partial<BaseAIConfig>,
    userMessage?: MyMessage,
  ) => {
    try {
      // messageId 由后端生成，前端不需要设置

      stateRef.current.loading = true;
      stateRef.current.error = null;
      stateRef.current.chatKey = chatKey;
      useForceUpdate();

      const result = await call('streamChatCompletion', {
        ...params,
        messages,
        userMessage,
        chatKey,
        agentName: params.agentName || 'default',
        agentScope: params.agentScope || 'workspace',
        configOverrides
      });

      // 不需要手动设置 chatKey，WebSocket 事件会处理
      return result;
    } catch (error) {
      stateRef.current.loading = false;
      stateRef.current.error = error instanceof Error ? error.message : String(error);
      useForceUpdate();
      throw error;
    }
  }, [params, useForceUpdate]);

  // 取消聊天流
  const cancelChatStream = useCallback(async () => {
    if (stateRef.current.chatKey) {
      try {
        await call('cancelChatCompletion', {
          chatKey: stateRef.current.chatKey,
        });
      } catch (error) {
        console.error('Failed to cancel chat stream:', error);
      }
    }

    stateRef.current.loading = false;
    useForceUpdate();
  }, [useForceUpdate]);

  // 重置聊天状态
  const resetChatStream = useCallback(() => {
    stateRef.current.messages = [];
    stateRef.current.loading = false;
    stateRef.current.error = null;
    stateRef.current.chatKey = null;
    useForceUpdate();
  }, [useForceUpdate]);

  // 设置消息
  const setMessages = useCallback((messages: MyMessage[]) => {
    stateRef.current.messages = messages;
    useForceUpdate();
  }, [useForceUpdate]);

  return {
    ...stateRef.current, // 展开当前状态
    startChatStream,
    cancelChatStream,
    resetChatStream,
    setMessages,
  };
}

export default useChatStream;