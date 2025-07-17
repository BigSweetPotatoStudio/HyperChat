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

  // 初始化 WebSocket 连接
  useEffect(() => {
    const initSocket = async () => {
      try {
        const socket = await getWebSocket();
        socketRef.current = socket;

        // 监听聊天流事件
        socket.on('chat_stream_start', (data: any) => {
          setState(prev => ({
            ...prev,
            messages: data.messages || [],
            loading: true,
            error: null,
            chatKey: data.chatKey,
          }));
        });

        socket.on('chat_stream_delta', (r: {
          type: "chat_stream_delta",
          data: {
            chatKey: string,
            delta: TextStreamPart<ToolSet>,
          }
        }) => {
          if (state.chatKey == r.data.chatKey) {
            let revMessages = {
              role: 'assistant',
              content: r.data.delta.content,
            }
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, revMessages],
            }));
          }
        });

        socket.on('chat_stream_complete', (data: any) => {
          setState(prev => ({
            ...prev,
            messages: data.messages || prev.messages,
            loading: false,
          }));
        });

        socket.on('chat_stream_error', (data: any) => {
          setState(prev => ({
            ...prev,
            error: data.error,
            loading: false,
          }));
          message.error(data.error || t`An error occurred, please try again later`);
        });

        socket.on('chat_stream_cancelled', (data: any) => {
          setState(prev => ({
            ...prev,
            loading: false,
          }));
        });

        // 监听工具确认请求
        socket.on('tool_confirm_request', (data: any) => {
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