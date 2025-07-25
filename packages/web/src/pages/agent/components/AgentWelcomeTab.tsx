/**
 * Agent欢迎页面组件
 * 显示Agent概览信息和快速操作
 */

import React, { useState, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Statistic, 
  List, 
  Typography, 
  Tag, 
  Divider,
  Row,
  Col,
  Alert
} from 'antd';
import { 
  MessageOutlined, 
  RobotOutlined,
  ApiOutlined,
  ScheduleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  HistoryOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import type { IMCPClient } from '@dadigua/hyperchat-shared';
import { AgentInstanceInfo } from '../types';

const { Title, Paragraph, Text } = Typography;

interface AgentWelcomeTabProps {
  agentInstance: AgentInstanceInfo;
  mcpClients: IMCPClient[];
  onStartNewChat: () => void;
  onOpenChatLog: (chatLog?: { key: string; label?: string }) => void;
}

/**
 * Agent欢迎页面组件
 */
const AgentWelcomeTab: React.FC<AgentWelcomeTabProps> = ({
  agentInstance,
  mcpClients,
  onStartNewChat,
  onOpenChatLog
}) => {
  const [loading, setLoading] = useState(false);

  /**
   * 开始新对话
   */
  const handleStartNewChat = useCallback(() => {
    onStartNewChat();
  }, [onStartNewChat]);

  /**
   * 快速操作数据
   */
  const quickActions = [
    {
      key: 'new-chat',
      icon: <MessageOutlined />,
      title: t`Start New Chat`,
      description: t`Begin a conversation with this agent`,
      action: handleStartNewChat,
      type: 'primary' as const,
      disabled: !agentInstance.isRunning
    },
    {
      key: 'view-history',
      icon: <HistoryOutlined />,
      title: t`View Chat History`,
      description: t`Browse previous conversations`,
      action: () => onOpenChatLog(),
      type: 'default' as const,
      disabled: agentInstance.chatLogsCount === 0
    }
  ];

  /**
   * MCP客户端列表
   */
  const mcpClientList = mcpClients.map(client => ({
    title: client.serverName,
    description: client.config.command || client.serverName,
    status: client.status === 'connected' ? 'Connected' : 'Disconnected',
    avatar: <ApiOutlined style={{ color: client.status === 'connected' ? '#52c41a' : '#ff4d4f' }} />
  }));

  return (
    <div style={{ 
      height: '100%', 
      overflow: 'auto',
      padding: '20px 24px',
      backgroundColor: '#fafafa'
    }}>
      {/* Agent状态卡片 */}
      <Card size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Space>
                  <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {agentInstance.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {agentInstance.path}
                    </Text>
                  </div>
                </Space>
              </div>
              
              <Space wrap>
                <Tag 
                  color={agentInstance.isRunning ? 'success' : 'default'}
                  icon={agentInstance.isRunning ? <PlayCircleOutlined /> : undefined}
                >
                  {agentInstance.isRunning ? t`Running` : t`Stopped`}
                </Tag>
                {agentInstance.config.modelKey && (
                  <Tag color="blue">
                    {agentInstance.config.modelKey}
                  </Tag>
                )}
                {agentInstance.hasMCPConfig && (
                  <Tag color="purple" icon={<ApiOutlined />}>
                    MCP {t`Enabled`}
                  </Tag>
                )}
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计信息 */}
      <Card size="small" title={t`Statistics`} style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title={t`Chat Logs`}
              value={agentInstance.chatLogsCount}
              prefix={<MessageOutlined />}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={t`MCP Clients`}
              value={mcpClients.length}
              prefix={<ApiOutlined />}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={t`Tasks`}
              value={agentInstance.tasksCount}
              prefix={<ScheduleOutlined />}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Agent未运行提示 */}
      {!agentInstance.isRunning && (
        <Alert
          message={t`Agent is not running`}
          description={t`Start the agent to enable chat functionality`}
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
          action={
            <Button size="small" type="primary" icon={<PlayCircleOutlined />}>
              {t`Start Agent`}
            </Button>
          }
        />
      )}

      {/* 快速操作 */}
      <Card size="small" title={t`Quick Actions`} style={{ marginBottom: '16px' }}>
        <Row gutter={[12, 12]}>
          {quickActions.map(action => (
            <Col span={12} key={action.key}>
              <Card 
                size="small"
                hoverable={!action.disabled}
                style={{ 
                  textAlign: 'center',
                  opacity: action.disabled ? 0.6 : 1,
                  cursor: action.disabled ? 'not-allowed' : 'pointer'
                }}
                onClick={action.disabled ? undefined : action.action}
              >
                <Space direction="vertical" size={8}>
                  <div style={{ fontSize: '24px', color: action.type === 'primary' ? '#1890ff' : '#666' }}>
                    {action.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                      {action.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      {action.description}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* MCP客户端 */}
      {mcpClients.length > 0 && (
        <Card 
          size="small" 
          title={
            <Space>
              <ApiOutlined />
              {t`MCP Clients`}
            </Space>
          }
          style={{ marginBottom: '16px' }}
        >
          <List
            size="small"
            dataSource={mcpClientList}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={item.avatar}
                  title={<Text style={{ fontSize: '13px' }}>{item.title}</Text>}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {item.description}
                      </Text>
                      <Tag 
                        color={item.status === 'Connected' ? 'success' : 'error'}
                      >
                        {item.status}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {/* Agent配置信息 */}
      <Card 
        size="small" 
        title={
          <Space>
            <SettingOutlined />
            {t`Configuration`}
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {agentInstance.config.modelKey && (
            <div>
              <Text strong style={{ fontSize: '12px' }}>{t`AI Model:`}</Text>
              <div style={{ marginTop: '4px' }}>
                <Tag color="blue">
                  {agentInstance.config.modelKey}
                </Tag>
              </div>
            </div>
          )}
          
          {agentInstance.config.prompt && (
            <div>
              <Text strong style={{ fontSize: '12px' }}>{t`System Prompt:`}</Text>
              <Paragraph 
                style={{ 
                  fontSize: '11px', 
                  marginTop: '4px',
                  marginBottom: 0,
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px'
                }}
                ellipsis={{ rows: 3, expandable: true }}
              >
                {agentInstance.config.prompt}
              </Paragraph>
            </div>
          )}

          <div>
            <Text strong style={{ fontSize: '12px' }}>{t`Last Activity:`}</Text>
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#666' }}>
              {agentInstance.lastChatTime 
                ? new Date(agentInstance.lastChatTime).toLocaleString()
                : t`No recent activity`
              }
            </div>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default AgentWelcomeTab;