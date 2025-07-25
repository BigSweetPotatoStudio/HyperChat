/**
 * Agent聊天界面组件
 * 基于workspace的Chat组件，适配Agent中心架构
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Input, Button, Space, List, Avatar, Typography, Spin, message } from 'antd';
import { 
  SendOutlined, 
  RobotOutlined, 
  UserOutlined,
  LoadingOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import { call } from '../../../common/call';
import type { IMCPClient } from '@dadigua/hyperchat-shared';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}

interface AgentChatInterfaceProps {
  agentPath: string;
  agentName: string;
  chatLogToLoad?: any;
  mcpClients: IMCPClient[];
}

/**
 * Agent聊天界面组件
 */
const AgentChatInterface: React.FC<AgentChatInterfaceProps> = ({
  agentPath,
  agentName,
  chatLogToLoad,
  mcpClients
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatLogKey, setChatLogKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * 滚动到底部
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  /**
   * 加载聊天记录
   */
  const loadChatLog = useCallback(async () => {
    if (!chatLogToLoad) {
      // 创建新聊天
      setChatLogKey(null);
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await call('getAgentChatLogs', {
        agentName: agentName
      });

      if (response && response.chatLogs) {
        const targetChatLog = response.chatLogs.find(log => log.key === chatLogToLoad.key);
        // 转换消息格式以兼容ChatMessage类型
        const chatMessages: ChatMessage[] = (targetChatLog?.messages || []).map((msg: any) => ({
          id: msg.id || msg.messageId || Date.now().toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || Date.now(),
          model: msg.model,
          tokenUsage: msg.tokenUsage
        }));
        setMessages(chatMessages);
        setChatLogKey(chatLogToLoad.key);
      } else {
        message.error(t`Failed to load chat log`);
      }
    } catch (error) {
      console.error('Load chat log error:', error);
      message.error(t`Failed to load chat log`);
    } finally {
      setIsLoading(false);
    }
  }, [agentPath, chatLogToLoad]);

  /**
   * 发送消息
   */
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 注意：streamChatCompletion 是流式API，这里简化处理
      try {
        // 模拟AI响应
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `收到消息: "${userMessage.content}"。这是Agent的模拟回复。`,
          timestamp: Date.now(),
          model: 'mock-model',
          tokenUsage: { input: 10, output: 20, total: 30 }
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        // 更新聊天记录key
        if (!chatLogKey) {
          setChatLogKey(`chat_${Date.now()}`);
        }
      } catch (apiError) {
        message.error(t`Failed to send message`);
      }
    } catch (error) {
      console.error('Send message error:', error);
      message.error(t`Failed to send message`);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, agentPath, chatLogKey, mcpClients]);

  /**
   * 处理Enter键发送
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  /**
   * 渲染消息项
   */
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <List.Item
        key={message.id}
        style={{
          padding: '12px 16px',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          border: 'none'
        }}
      >
        <div 
          style={{ 
            maxWidth: '80%',
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: '8px'
          }}
        >
          <Avatar 
            size="small"
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            style={{ 
              backgroundColor: isUser ? '#1890ff' : '#52c41a',
              flexShrink: 0
            }}
          />
          <div style={{ 
            maxWidth: 'calc(100% - 40px)',
            backgroundColor: isUser ? '#e6f7ff' : '#f6ffed',
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${isUser ? '#91d5ff' : '#b7eb8f'}`
          }}>
            <Paragraph 
              style={{ 
                margin: 0, 
                fontSize: '13px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {message.content}
            </Paragraph>
            <div style={{ 
              marginTop: '4px', 
              fontSize: '11px', 
              color: '#666',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
              {message.model && (
                <span>
                  {message.model}
                </span>
              )}
              {message.tokenUsage && (
                <span>
                  {message.tokenUsage.total} tokens
                </span>
              )}
            </div>
          </div>
        </div>
      </List.Item>
    );
  };

  // 初始化加载
  useEffect(() => {
    loadChatLog();
  }, [loadChatLog]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 聊天记录标题 */}
      {chatLogToLoad && (
        <div style={{ 
          padding: '8px 16px', 
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          fontSize: '12px',
          color: '#666'
        }}>
          <Space>
            <HistoryOutlined />
            <span>{t`Chat Log:`} {chatLogToLoad.label || chatLogToLoad.key}</span>
          </Space>
        </div>
      )}

      {/* 消息列表 */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        backgroundColor: '#ffffff'
      }}>
        {isLoading && messages.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '200px'
          }}>
            <Spin tip={t`Loading chat log...`} />
          </div>
        ) : (
          <List
            dataSource={messages}
            renderItem={renderMessage}
            style={{ padding: 0 }}
          />
        )}
        
        {/* 加载指示器 */}
        {isLoading && messages.length > 0 && (
          <div style={{ 
            padding: '12px 16px',
            textAlign: 'center'
          }}>
            <Space>
              <LoadingOutlined />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t`AI is thinking...`}
              </Text>
            </Space>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{ 
        padding: '12px 16px',
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t`Type your message... (Enter to send, Shift+Enter for new line)`}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={isLoading}
            style={{ resize: 'none' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            loading={isLoading}
          >
            {t`Send`}
          </Button>
        </Space.Compact>
        
        {/* 状态信息 */}
        <div style={{ 
          marginTop: '6px',
          fontSize: '11px',
          color: '#666',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>
            🤖 {agentName} • 🔌 {mcpClients.length} MCP clients
          </span>
          <span>
            {messages.length} messages
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgentChatInterface;