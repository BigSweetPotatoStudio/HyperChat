/**
 * 聊天流式处理 Hook
 * 用于处理后端 WebSocket 流式聊天响应
 */

import { useEffect, useRef, useState, useCallback } from 'react';
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
  /** 配置覆盖 */
  configOverrides?: Partial<BaseAIConfig>;
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
  const [state, setState] = useState<ChatStreamState>({
    messages: [],
    loading: false,
    error: null,
    chatKey: null,
  });

  const socketRef = useRef<any>(null);
  // const toolConfirmCallbacksRef = useRef<Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>>(new Map());

  // 验证 chatKey 匹配的辅助函数
  const validateChatKey = useCallback((receivedChatKey: string, eventType: string) => {
    if (!state.chatKey || state.chatKey !== receivedChatKey) {
      console.warn(`Received ${eventType} with mismatched chatKey:`, receivedChatKey, 'expected:', state.chatKey);
      return false;
    }
    return true;
  }, [state.chatKey]);

  // 在 setState 中验证 chatKey 的辅助函数
  const validateChatKeyInState = useCallback((prevState: ChatStreamState, receivedChatKey: string, eventType: string) => {
    if (!prevState.chatKey || prevState.chatKey !== receivedChatKey) {
      console.warn(`State chatKey mismatch during ${eventType}:`, receivedChatKey, 'expected:', prevState.chatKey);
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

          setState(prev => {
            if (!validateChatKeyInState(prev, data.chatKey, 'message_create')) {
              return prev;
            }

            // 检查消息是否已存在
            const existingIndex = prev.messages.findIndex(m => m.messageId === data.messageId);
            if (existingIndex !== -1) {
              // 更新现有消息
              const newMessages = [...prev.messages];
              newMessages[existingIndex] = data.message;
              return {
                ...prev,
                messages: newMessages,
                loading: data.message.role === 'assistant',
                error: null,
              };
            } else {
              // 添加新消息
              return {
                ...prev,
                messages: [...prev.messages, data.message],
                loading: data.message.role === 'assistant',
                error: null,
              };
            }
          });
        });

        socket.on('chat_message_update', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_update')) {
            return;
          }

          setState(prev => {
            if (!validateChatKeyInState(prev, data.chatKey, 'message_update')) {
              return prev;
            }

            // 找到要更新的消息
            const messageIndex = prev.messages.findIndex(m => m.messageId === data.messageId);
            if (messageIndex === -1) {
              console.warn(`Message with ID ${data.messageId} not found for update`);
              return prev;
            }

            const newMessages = [...prev.messages];
            const message = newMessages[messageIndex];
            const delta = data.delta;

            // 处理不同类型的流式响应
            if (delta.type === 'text-delta') {
              // 更新文本内容
              const textDelta = delta.textDelta || '';
              message.content = (message.content || '') + textDelta;
              message.content_date = Date.now();
            } else if (delta.type === 'reasoning') {
              // 更新推理内容
              message.reasoning_content = (message.reasoning_content || '') + (delta.textDelta || '');
              message.content_date = Date.now();
            } else if (delta.type === 'tool-call') {
              // 处理工具调用
              if (!message.content_tool_calls) {
                message.content_tool_calls = [];
              }
              // 这里需要根据具体的工具调用逻辑进行处理
              // 由于这是增量更新，可能需要更复杂的逻辑
            } else if (delta.type === 'step-finish') {
              // 处理步骤完成
              if (delta.usage) {
                message.content_usage = {
                  prompt_tokens: delta.usage.promptTokens || 0,
                  completion_tokens: delta.usage.completionTokens || 0,
                  total_tokens: delta.usage.totalTokens || 0,
                };
              }
            }

            return {
              ...prev,
              messages: newMessages,
            };
          });
        });

        socket.on('chat_message_complete', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_complete')) {
            return;
          }

          setState(prev => {
            if (!validateChatKeyInState(prev, data.chatKey, 'message_complete')) {
              return prev;
            }

            // 找到最后一条助手消息并标记为完成
            const newMessages = [...prev.messages];
            const lastAssistantIndex = newMessages.findLastIndex(m => m.role === 'assistant');
            
            if (lastAssistantIndex !== -1) {
              newMessages[lastAssistantIndex] = {
                ...newMessages[lastAssistantIndex],
                content_status: 'success',
              };
            }

            return {
              ...prev,
              messages: newMessages,
              loading: false,
            };
          });
        });

        socket.on('chat_message_error', (data: any) => {
          if (!validateChatKey(data.chatKey, 'chat_message_error')) {
            return;
          }

          setState(prev => {
            if (!validateChatKeyInState(prev, data.chatKey, 'message_error')) {
              return prev;
            }

            // 找到最后一条助手消息并标记为错误
            const newMessages = [...prev.messages];
            const lastAssistantIndex = newMessages.findLastIndex(m => m.role === 'assistant');
            
            if (lastAssistantIndex !== -1) {
              newMessages[lastAssistantIndex] = {
                ...newMessages[lastAssistantIndex],
                content_status: 'error',
                content_error: data.error,
              };
            }

            return {
              ...prev,
              messages: newMessages,
              error: data.error,
              loading: false,
            };
          });

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
        socketRef.current.off('chat_message_update');
        socketRef.current.off('chat_message_complete');
        socketRef.current.off('chat_message_error');
        socketRef.current.off('tool_confirm_request');
      }
    };
  }, [params.onToolConfirm]);

  // 开始聊天流
  const startChatStream = useCallback(async (
    messages: MyMessage[],
    userMessage: MyMessage,
    chatKey: string
  ) => {
    try {
      // 确保用户消息有 messageId
      if (!userMessage.messageId) {
        userMessage.messageId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      }

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        chatKey: chatKey,
      }));

      const result = await call('streamChatCompletion', {
        ...params,
        messages,
        userMessage,
        chatKey,
        agentName: params.agentName || 'default',
        agentScope: params.agentScope || 'workspace',
      });

      // 不需要手动设置 chatKey，WebSocket 事件会处理
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
      throw error;
    }
  }, [params]);

  // 取消聊天流
  const cancelChatStream = useCallback(async () => {
    if (state.chatKey) {
      try {
        await call('cancelChatCompletion', {
          chatKey: state.chatKey,
        });
      } catch (error) {
        console.error('Failed to cancel chat stream:', error);
      }
    }

    setState(prev => ({
      ...prev,
      loading: false,
    }));
  }, [state.chatKey]);

  // 重置聊天状态
  const resetChatStream = useCallback(() => {
    setState({
      messages: [],
      loading: false,
      error: null,
      chatKey: null,
    });
  }, []);

  // 设置消息
  const setMessages = useCallback((messages: MyMessage[]) => {
    setState(prev => ({
      ...prev,
      messages,
    }));
  }, []);

  return {
    ...state,
    startChatStream,
    cancelChatStream,
    resetChatStream,
    setMessages,
  };
}

export default useChatStream;