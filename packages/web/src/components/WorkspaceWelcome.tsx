import React, { useState, useEffect } from "react";
import {
  Card,
  List,
  Button,
  Typography,
  Empty,
  Space,
  Badge,
  Tag,
  Divider,
  Row,
  Col,
  Statistic,
  Avatar,
  Tooltip,
  Input,
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
import { getAgentRecentUsage, addAgentRecentUsage } from "../utils/storage";
import { AgentConfig } from "@hyperchat/shared/types.mjs";
import { Icon } from "./icon";

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
  }[];
  onOpenAgentChat: (agent: any) => void;
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

  // 处理 agent 点击
  const handleAgentClick = (agent: any) => {
    // 记录使用
    addAgentRecentUsage(workspace.path, agent.config.key, agent.config.name || agent.config.key);
    // 打开聊天
    onOpenAgentChat(agent);
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
                <Badge count={chatCount} size="small" />
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

      {/* 最近使用的 Agents */}
      {recentAgents.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <Title level={4}>
            <HistoryOutlined style={{ marginRight: '8px' }} />
            {t`Recently Used`}
          </Title>
          <Row gutter={4}>
            {recentAgents.map(agent => (
              <Col span={4} key={agent.config.key}>
                {renderAgentCard(agent, true)}
              </Col>
            ))}
          </Row>
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
            <Badge count={sortedAgents.length} size="small" />
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
          <Row gutter={4}>
            {sortedAgents.map(agent => (
              <Col span={4} key={agent.config.key}>
                {renderAgentCard(agent)}
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* 创建新 Agent 的快捷按钮 */}
      {/* {agents.length > 0 && onCreateAgent && (
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            size="large"
            onClick={onCreateAgent}
            style={{ minWidth: '200px' }}
          >
            {t`Create New Agent`}
          </Button>
        </div>
      )} */}
    </div>
  );
};