import React, { useEffect, useState, useRef, useContext } from 'react';
import { useChat } from 'ai/react';
import {
  Button,
  Card,
  Input,
  Layout,
  List,
  Select,
  Space,
  Typography,
  message,
  Spin,
  Avatar,
  Tag,
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { GPT_MODELS, AppSetting } from '../../../../shared/data.mjs';
import { t } from '../../i18n';
import { HeaderContext } from '../../common/context';
import { getURL_PRE } from '../../common/call';

const { Content, Header } = Layout;
const { TextArea } = Input;
const { Text, Title } = Typography;

export const Chat2: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<any[]>([]);
  const { globalState } = useContext(HeaderContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 使用标准的 useChat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    error,
  } = useChat({
    api: `${getURL_PRE()}api/ai-chat`, // 使用我们创建的 AI SDK 标准端点
    body: {
      modelKey: selectedModel,
    },
    onError: (error) => {
      console.error('Chat error:', error);
      message.error(error.message || '聊天请求失败');
    },
    onFinish: (message) => {
      console.log('Chat finished:', message);
    },
  });

  // 加载模型列表
  useEffect(() => {
    loadModels();
  }, []);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadModels = async () => {
    try {
      await GPT_MODELS.init();
      await AppSetting.init();
      
      const modelList = GPT_MODELS.get().data.filter(
        (x) => x.type === 'llm' || x.type == null
      );
      setModels(modelList);
      
      // 设置默认模型
      if (modelList.length > 0 && !selectedModel) {
        const defaultModel = modelList.find(m => m.isDefault) || modelList[0];
        setSelectedModel(defaultModel.key);
      }
    } catch (error) {
      console.error('加载模型失败:', error);
      message.error('加载模型列表失败');
    }
  };

  // 处理表单提交
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) {
      message.warning('请先选择一个模型');
      return;
    }
    if (input.trim() && !isLoading) {
      handleSubmit(e);
    }
  };

  // 清空聊天记录
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t`Chat2 (AI SDK)`}
          </Title>
          <Text type="secondary">使用 Vercel AI SDK 的完整解决方案</Text>
        </div>
        
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="选择模型"
            value={selectedModel}
            onChange={setSelectedModel}
            options={models.map(model => ({
              label: model.name,
              value: model.key,
            }))}
          />
          <Button 
            icon={<ClearOutlined />}
            onClick={clearChat}
            disabled={messages.length === 0 || isLoading}
          >
            清空
          </Button>
        </Space>
      </Header>

      <Content style={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        padding: 0 
      }}>
        {/* 消息列表区域 */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '16px',
          background: '#fafafa'
        }}>
          {messages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '50px',
              color: '#999'
            }}>
              <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>开始新的对话吧！使用 Vercel AI SDK 技术栈</div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                前端: useChat hook | 后端: streamText API
              </div>
            </div>
          ) : (
            <>
              <List
                dataSource={messages}
                renderItem={(message, index) => (
                  <List.Item 
                    key={message.id}
                    style={{ 
                      border: 'none',
                      padding: '8px 0',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Card
                      size="small"
                      style={{
                        maxWidth: '70%',
                        marginLeft: message.role === 'user' ? 'auto' : 0,
                        marginRight: message.role === 'assistant' ? 'auto' : 0,
                        background: message.role === 'user' ? '#1890ff' : '#fff',
                        color: message.role === 'user' ? '#fff' : '#000',
                      }}
                      bodyStyle={{ padding: '12px 16px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <Avatar 
                          size="small"
                          icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                          style={{
                            background: message.role === 'user' ? '#fff' : '#1890ff',
                            color: message.role === 'user' ? '#1890ff' : '#fff',
                          }}
                        />
                        <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                          {message.content || (message.role === 'assistant' && isLoading && index === messages.length - 1 ? '正在思考...' : '')}
                          {message.role === 'assistant' && isLoading && index === messages.length - 1 && (
                            <Spin size="small" style={{ marginLeft: '8px' }} />
                          )}
                        </div>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 错误显示 */}
        {error && (
          <div style={{ 
            padding: '8px 16px', 
            background: '#fff2f0', 
            borderTop: '1px solid #ffccc7',
            color: '#cf1322'
          }}>
            错误: {error.message}
          </div>
        )}

        {/* 输入区域 */}
        <div style={{ 
          padding: '16px', 
          background: '#fff',
          borderTop: '1px solid #f0f0f0'
        }}>
          <form onSubmit={onSubmit}>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                value={input}
                onChange={handleInputChange}
                placeholder="输入消息..."
                autoSize={{ minRows: 1, maxRows: 4 }}
                disabled={isLoading}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    onSubmit(e);
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={isLoading}
                disabled={!input.trim() || !selectedModel || isLoading}
                style={{ height: 'auto' }}
              >
                发送
              </Button>
            </Space.Compact>
          </form>
          
          <div style={{ 
            marginTop: '8px', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              按 Enter 发送，Shift + Enter 换行 | 使用 AI SDK 标准流程
            </Text>
            <div>
              {selectedModel && (
                <Tag color="blue" style={{ fontSize: '12px' }}>
                  {models.find(m => m.key === selectedModel)?.name || selectedModel}
                </Tag>
              )}
              {isLoading && (
                <Tag color="orange" style={{ fontSize: '12px' }}>
                  AI SDK 流式生成中...
                </Tag>
              )}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};