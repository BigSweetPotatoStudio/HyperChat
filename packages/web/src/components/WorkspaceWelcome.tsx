import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Button,
  Typography,
  Empty,
  Space,
  Tag,
  Divider,
  Row,
  Col,
  Statistic,
  Avatar,
  Tooltip,
  Input,
  Tabs,
  Badge,
} from "antd";
import {
  MessageOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  RobotOutlined,
  PlusOutlined,
  HistoryOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";
import { getAgentRecentUsage, addAgentRecentUsage, getChatRecentUsage, addChatRecentUsage } from "../utils/storage";
import { AgentConfig, ChatHistoryItem } from "@hyperchat/shared/types.mjs";
import { Icon } from "./icon";
import { call } from "../common/call";

const { Title, Text, Paragraph } = Typography;

interface WorkspaceWelcomeProps {
  workspace: {
    path: string;
    name: string;
    isGlobal?: boolean;
  };
  agents: {
    config: AgentConfig;
    chatLogsCount: number;
    lastChatTime?: number;
    chatLogs?: ChatHistoryItem[];
  }[];
  onOpenAgentChat: (agent: any, chatLog?: ChatHistoryItem) => void;
  onCreateAgent?: () => void;
}

export const WorkspaceWelcome: React.FC<WorkspaceWelcomeProps> = ({
  workspace,
  agents,
  onOpenAgentChat,
  onCreateAgent,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [recentAgents, setRecentAgents] = useState<any[]>([]);
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'agents' | 'chats'>('chats');

  // 加载最近使用的 agents
  useEffect(() => {
    const recent = getAgentRecentUsage(workspace.path);
    // 将最近使用的记录与当前的 agents 匹配
    const matchedRecentAgents = recent
      .map(recentItem => {
        const agent = agents.find(a => a.config.key === recentItem.agentKey);
        return agent ? { ...agent, lastUsed: recentItem.lastUsed } : null;
      })
      .filter(Boolean)
      .slice(0, 6); // 只显示最近 6 个

    setRecentAgents(matchedRecentAgents);
  }, [workspace.path, agents]);

  // 加载最近使用的对话
  useEffect(() => {
    const loadRecentChats = async () => {
      const recentChatUsage = getChatRecentUsage(workspace.path);
      const matchedRecentChats: any[] = [];
      
      // 限制并发请求数量，只获取最近 8 个对话
      const limitedRecentUsage = recentChatUsage.slice(0, 8);
      
      for (const recentItem of limitedRecentUsage) {
        try {
          const agent = agents.find(a => a.config.key === recentItem.agentKey);
          if (!agent) continue;
          
          // 使用新的后端命令获取个别聊天记录
          const chatLog = await call("getAgentChatLog", {
            workspacePath: workspace.path,
            agentKey: recentItem.agentKey,
            chatLogKey: recentItem.chatKey
          });
          
          if (chatLog) {
            matchedRecentChats.push({
              workspacePath: recentItem.workspacePath,
              agentKey: recentItem.agentKey,
              agentName: recentItem.agentName,
              chatKey: recentItem.chatKey,
              chatLabel: recentItem.chatLabel,
              lastUsed: recentItem.lastUsed,
              usageCount: recentItem.usageCount,
              agent,
              chatLog
            });
          }
        } catch (error) {
          console.warn(`Failed to load chat log ${recentItem.chatKey} for agent ${recentItem.agentKey}:`, error);
          // 继续处理其他对话，不因单个失败而中断
        }
      }
      
      setRecentChats(matchedRecentChats);
    };
    
    loadRecentChats();
  }, [workspace.path, agents]);

  // 处理 agent 点击
  const handleAgentClick = (agent: any) => {
    // 记录使用
    addAgentRecentUsage(workspace.path, agent.config.key, agent.config.name || agent.config.key);
    // 打开聊天
    onOpenAgentChat(agent);
  };

  // 处理聊天对话点击
  const handleChatClick = (recentChatItem: any) => {
    const { agent, chatLog, agentName } = recentChatItem;
    
    // 记录使用
    addAgentRecentUsage(workspace.path, agent.config.key, agentName);
    addChatRecentUsage(
      workspace.path, 
      agent.config.key, 
      agentName, 
      chatLog.key, 
      chatLog.label || 'Untitled Chat'
    );
    
    // 打开特定的聊天对话
    onOpenAgentChat(agent, chatLog);
  };

  // 过滤 agents
  const filteredAgents = agents.filter(agent => {
    if (!searchTerm) return true;
    const name = agent.config.name || agent.config.key;
    const description = agent.config.description || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 按最近聊天时间排序
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const timeA = a.lastChatTime || 0;
    const timeB = b.lastChatTime || 0;
    return timeB - timeA;
  });

  // 渲染 Agent 卡片
  const renderAgentCard = (agent: any, showLastUsed = false) => {
    const name = agent.config.name || agent.config.key;
    const description = agent.config.description || t`No description`;
    const lastChatTime = agent.lastChatTime || agent.lastUsed;
    const chatCount = agent.chatLogsCount || 0;

    return (
      <Card
        key={agent.config.key}
        hoverable
        size="small"
        className="agent-card"
        onClick={() => handleAgentClick(agent)}
        style={{ marginBottom: 8 }}
      >
        <Card.Meta
          avatar={
            <Avatar
              icon={<RobotOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
          }
          title={
            <Space>
              <span>{name}</span>
              {chatCount > 0 && (
                <Tag color="green">{chatCount}</Tag>
              )}
            </Space>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {description}
              </Text>
              {lastChatTime && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {showLastUsed ? t`Last used` : t`Last chat`}: {' '}
                    {new Date(lastChatTime).toLocaleString()}
                  </Text>
                </div>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  // 渲染聊天对话卡片
  const renderChatCard = (recentChatItem: any) => {
    const { chatLabel, agentName, lastUsed, usageCount, chatLog } = recentChatItem;
    const messageCount = chatLog.messages?.length || 0;

    return (
      <Card
        key={`${recentChatItem.agentKey}-${recentChatItem.chatKey}`}
        hoverable
        size="small"
        className="chat-card"
        onClick={() => handleChatClick(recentChatItem)}
        style={{ marginBottom: 8 }}
      >
        <Card.Meta
          avatar={
            <Avatar
              icon={<MessageOutlined />}
              style={{ backgroundColor: '#52c41a' }}
            />
          }
          title={
            <Space>
              <span>{chatLabel}</span>
              <Tag color="blue">{usageCount}次</Tag>
              {messageCount > 0 && (
                <Tag color="green">{messageCount}条消息</Tag>
              )}
            </Space>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <RobotOutlined style={{ marginRight: 4 }} />
                Agent: {agentName}
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {t`Last used`}: {new Date(lastUsed).toLocaleString()}
                </Text>
              </div>
            </div>
          }
        />
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      {/* 欢迎标题 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Icon name="bx-bot" style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <Title level={2} style={{ margin: 0 }}>
          {workspace.isGlobal ? t`Welcome to Global Workspace` : t`Welcome to ${workspace.name}`}
        </Title>
        <Paragraph type="secondary" style={{ fontSize: '16px', marginTop: '8px' }}>
          {t`Select an agent to start a conversation`}
        </Paragraph>
      </div>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title={t`Total Agents`}
              value={agents.length}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={t`Total Conversations`}
              value={agents.reduce((sum, agent) => sum + (agent.chatLogsCount || 0), 0)}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        {/* <Col span={8}>
          <Card>
            <Statistic
              title={t`Active Agents`}
              value={agents.filter(agent => agent.chatLogsCount > 0).length}
              prefix={<StarOutlined />}
            />
          </Card>
        </Col> */}
      </Row>

      {/* 最近使用区域 */}
      {(recentChats.length > 0 || recentAgents.length > 0) && (
        <div style={{ marginBottom: '24px' }}>
          <Title level={4}>
            <HistoryOutlined style={{ marginRight: '8px' }} />
            {t`Recently Used`}
          </Title>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'agents' | 'chats')}
            items={[
              {
                key: 'chats',
                label: (
                  <Space>
                    <MessageOutlined />
                    {t`Recent Chats`}
                    {recentChats.length > 0 && <Badge count={recentChats.length} />}
                  </Space>
                ),
                children: recentChats.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {recentChats.map(chatItem => (
                      <div key={`${chatItem.agentKey}-${chatItem.chatKey}`} style={{ width: '220px' }}>
                        {renderChatCard(chatItem)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t`No recent chats`}
                  />
                )
              },
              {
                key: 'agents',
                label: (
                  <Space>
                    <RobotOutlined />
                    {t`Recent Agents`}
                    {recentAgents.length > 0 && <Badge count={recentAgents.length} />}
                  </Space>
                ),
                children: recentAgents.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    {recentAgents.map(agent => (
                      <div key={agent.config.key} style={{ width: '220px' }}>
                        {renderAgentCard(agent, true)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t`No recent agents`}
                  />
                )
              }
            ]}
          />
        </div>
      )}

      {/* 搜索栏 */}
      <div style={{ marginBottom: '16px' }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder={t`Search agents...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '300px' }}
        />
      </div>

      {/* 所有 Agents 列表 */}
      <div>
        <Title level={4} style={{ marginBottom: '16px' }}>
          <Space>
            <RobotOutlined />
            {t`All Agents`}
            <Tag color="green" >{sortedAgents.length}</Tag>
          </Space>
        </Title>

        {sortedAgents.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              agents.length === 0 ? (
                <div>
                  <p>{t`No agents available`}</p>
                  <p>{t`Create your first agent to get started`}</p>
                </div>
              ) : (
                <p>{t`No agents match your search`}</p>
              )
            }
          >
            {agents.length === 0 && onCreateAgent && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onCreateAgent}>
                {t`Create Agent`}
              </Button>
            )}
          </Empty>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {sortedAgents.map(agent => (
              <div key={agent.config.key} style={{ width: '220px' }}>
                {renderAgentCard(agent)}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};