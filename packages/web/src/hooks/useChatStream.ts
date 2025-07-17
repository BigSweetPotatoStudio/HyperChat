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

        // 监听聊天流事件
        socket.on('chat_stream_start', (data: any) => {
          // 对于 start 事件，允许设置新的 chatKey
          setState(prev => ({
            ...prev,
            messages: data.messages || [],
            loading: true,
            error: null,
            chatKey: data.chatKey,
          }));
        });

        socket.on('chat_stream_delta', (r: {

          chatKey: string,
          delta: TextStreamPart<ToolSet>,

        }) => {
          // 验证 chatKey 匹配
          if (!validateChatKey(r.chatKey, 'chat_stream_delta')) {
            return;
          }

          setState(prev => {
            // 再次验证 chatKey 匹配
            if (!validateChatKeyInState(prev, r.chatKey, 'delta update')) {
              return prev;
            }

            // 处理不同类型的流式响应
            if (r.delta.type === 'text-delta') {
              // 更新最后一条助手消息的内容
              const textDelta = (r.delta).textDelta || '';
              const newMessages = [...prev.messages];
              const lastMessage = newMessages[newMessages.length - 1];

              if (lastMessage && lastMessage.role === 'assistant') {
                // 更新现有助手消息
                lastMessage.content = (lastMessage.content || '') + textDelta;
                lastMessage.content_date = Date.now();
              } else {
                // 创建新的助手消息
                newMessages.push({
                  role: 'assistant',
                  content: textDelta,
                  content_date: Date.now(),
                  content_status: 'loading',
                  content_tool_calls: [],
                  content_attachment: [],
                  content_usage: {
                    prompt_tokens: 0,
                    completion_tokens: 0,
                    total_tokens: 0,
                  },
                } as MyMessage);
              }

              return {
                ...prev,
                messages: newMessages,
              };
            }

            return prev;
          });
        });

        socket.on('chat_stream_complete', (data: any) => {
          // 验证 chatKey 匹配
          if (!validateChatKey(data.chatKey, 'chat_stream_complete')) {
            return;
          }

          setState(prev => {
            // 再次验证 chatKey 匹配
            if (!validateChatKeyInState(prev, data.chatKey, 'complete')) {
              return prev;
            }

            return {
              ...prev,
              messages: data.messages || prev.messages,
              loading: false,
            };
          });

          // 确保最后一条助手消息标记为完成
          setState(prev => {
            if (!validateChatKeyInState(prev, data.chatKey, 'complete status update')) {
              return prev;
            }

            const newMessages = [...prev.messages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content_status = 'success';
            }
            return {
              ...prev,
              messages: newMessages,
            };
          });
        });

        socket.on('chat_stream_error', (data: any) => {
          // 验证 chatKey 匹配
          if (!validateChatKey(data.chatKey, 'chat_stream_error')) {
            return;
          }

          setState(prev => {
            // 再次验证 chatKey 匹配
            if (!validateChatKeyInState(prev, data.chatKey, 'error')) {
              return prev;
            }

            return {
              ...prev,
              error: data.error,
              loading: false,
            };
          });

          message.error(data.error || t`An error occurred, please try again later`);
        });

        socket.on('chat_stream_cancelled', (data: any) => {
          // 验证 chatKey 匹配
          if (!validateChatKey(data.chatKey, 'chat_stream_cancelled')) {
            return;
          }

          setState(prev => {
            // 再次验证 chatKey 匹配
            if (!validateChatKeyInState(prev, data.chatKey, 'cancelled')) {
              return prev;
            }

            return {
              ...prev,
              loading: false,
            };
          });
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
        socketRef.current.off('chat_stream_start');
        socketRef.current.off('chat_stream_delta');
        socketRef.current.off('chat_stream_complete');
        socketRef.current.off('chat_stream_error');
        socketRef.current.off('chat_stream_cancelled');
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