/**
 * Agent中间面板组件
 * 主要聊天交互区域，支持多标签页管理
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, Tabs, Button, Space, Typography, Tag, Empty } from 'antd';
import { 
  MessageOutlined, 
  FileOutlined, 
  HomeOutlined, 
  PlusOutlined,
  CloseOutlined 
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import { AgentMiddlePanelProps, AgentChatTab } from '../types';
import AgentChatInterface from './AgentChatInterface';
import AgentFileViewer from './AgentFileViewer';
import AgentWelcomeTab from './AgentWelcomeTab';

const { Title, Text } = Typography;

/**
 * Agent中间面板组件
 */
const AgentMiddlePanel: React.FC<AgentMiddlePanelProps> = ({
  agentPath,
  agentName,
  chatTabs,
  activeTabKey,
  agentInstance,
  mcpClients,
  onTabChange,
  onTabRemove,
  onOpenChatLog,
  onFileClose
}) => {

  /**
   * 创建新聊天
   */
  const handleNewChat = useCallback(() => {
    onOpenChatLog(undefined); // 不传参数表示新建聊天
  }, [onOpenChatLog]);

  /**
   * 渲染标签页图标
   */
  const getTabIcon = (type: AgentChatTab['type']) => {
    switch (type) {
      case 'chat':
        return <MessageOutlined />;
      case 'file':
        return <FileOutlined />;
      case 'welcome':
        return <HomeOutlined />;
      default:
        return <MessageOutlined />;
    }
  };

  /**
   * 渲染标签页标题
   */
  const renderTabLabel = (tab: AgentChatTab) => {
    return (
      <Space size={4}>
        {getTabIcon(tab.type)}
        <span>{tab.title}</span>
        {tab.type === 'chat' && (
          <Tag color="blue">Chat</Tag>
        )}
        {tab.type === 'file' && (
          <Tag color="green">File</Tag>
        )}
      </Space>
    );
  };

  /**
   * 渲染标签页内容
   */
  const renderTabContent = (tab: AgentChatTab) => {
    switch (tab.type) {
      case 'welcome':
        return (
          <AgentWelcomeTab
            agentInstance={agentInstance}
            mcpClients={mcpClients}
            onStartNewChat={handleNewChat}
            onOpenChatLog={(chatLog) => onOpenChatLog(chatLog)}
          />
        );
      
      case 'chat':
        return (
          <AgentChatInterface
            agentPath={agentPath}
            agentName={agentName}
            chatLogToLoad={tab.chatLogToLoad}
            mcpClients={mcpClients}
          />
        );
      
      case 'file':
        return (
          <AgentFileViewer
            filePath={tab.filePath || ''}
            fileName={tab.fileName || ''}
            agentPath={agentPath}
          />
        );
      
      default:
        return (
          <Empty
            description={t`Unknown tab type`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        );
    }
  };

  /**
   * 转换为Ant Design Tabs所需的items格式
   */
  const tabItems = useMemo(() => {
    return chatTabs.map(tab => ({
      key: tab.key,
      label: renderTabLabel(tab),
      children: renderTabContent(tab),
      closable: tab.closable
    }));
  }, [chatTabs, agentInstance, mcpClients, agentPath, agentName]);

  return (
    <Card 
      size="small"
      title={
        <Space>
          <MessageOutlined />
          <Title level={5} style={{ margin: 0 }}>
            {agentName}
          </Title>
          <Tag color={agentInstance.isRunning ? 'success' : 'default'}>
            {agentInstance.isRunning ? t`Running` : t`Stopped`}
          </Tag>
        </Space>
      }
      extra={
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleNewChat}
          disabled={!agentInstance.isRunning}
        >
          {t`New Chat`}
        </Button>
      }
      bodyStyle={{ padding: 0, height: 'calc(100vh - 120px)', overflow: 'hidden' }}
      style={{ height: '100%', border: 'none' }}
    >
      <Tabs
        type="editable-card"
        activeKey={activeTabKey}
        onChange={onTabChange}
        onEdit={(targetKey, action) => {
          if (action === 'remove') {
            onTabRemove(targetKey as string);
          }
        }}
        items={tabItems}
        style={{ height: '100%' }}
        tabBarStyle={{
          margin: '0 16px',
          paddingTop: '8px'
        }}
        size="small"
        hideAdd // 隐藏默认的添加按钮，使用自定义按钮
      />

      {/* 底部状态栏 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '4px 16px',
        borderTop: '1px solid #f0f0f0',
        background: '#fafafa',
        fontSize: '11px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space size={16}>
          <span>📊 {t`Chat logs:`} {agentInstance.chatLogsCount}</span>
          <span>🔌 {t`MCP clients:`} {mcpClients.length}</span>
          <span>📋 {t`Tasks:`} {agentInstance.tasksCount}</span>
        </Space>
        <span>
          {agentInstance.lastChatTime && (
            <>
              {t`Last activity:`} {new Date(agentInstance.lastChatTime).toLocaleString()}
            </>
          )}
        </span>
      </div>
    </Card>
  );
};

export default AgentMiddlePanel;