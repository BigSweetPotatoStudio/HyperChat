/**
 * Agent右侧面板组件
 * 显示Agent管理、MCP客户端管理、任务管理功能
 */

import React, { useState, useCallback } from 'react';
import { Card, Tabs, Button, Space, Typography, Badge, message } from 'antd';
import { 
  SettingOutlined, 
  ApiOutlined, 
  ScheduleOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import { AgentRightPanelProps } from '../types';
import AgentInfoPanel from './AgentInfoPanel';
import AgentMCPPanel from './AgentMCPPanel';
import AgentTaskPanel from './AgentTaskPanel';

const { Title } = Typography;

/**
 * Agent右侧面板组件
 */
const AgentRightPanel: React.FC<AgentRightPanelProps> = ({
  agentPath,
  agentName,
  agentInstance,
  mcpClients,
  tasks,
  agentManagementRef,
  mcpManagementRef,
  taskManagementRef,
  onRefreshAgent,
  onRefreshMCP,
  onRefreshTasks,
  onOpenChat
}) => {
  const [activeTabKey, setActiveTabKey] = useState<string>('agent');
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  /**
   * 设置加载状态
   */
  const setTabLoading = useCallback((tabKey: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [tabKey]: isLoading }));
  }, []);

  /**
   * 刷新Agent信息
   */
  const handleRefreshAgent = useCallback(async () => {
    try {
      setTabLoading('agent', true);
      await onRefreshAgent();
      message.success(t`Agent information refreshed`);
    } catch (error) {
      console.error('Refresh agent error:', error);
      message.error(t`Failed to refresh agent information`);
    } finally {
      setTabLoading('agent', false);
    }
  }, [onRefreshAgent, setTabLoading]);

  /**
   * 刷新MCP客户端
   */
  const handleRefreshMCP = useCallback(async () => {
    try {
      setTabLoading('mcp', true);
      await onRefreshMCP();
      message.success(t`MCP clients refreshed`);
    } catch (error) {
      console.error('Refresh MCP error:', error);
      message.error(t`Failed to refresh MCP clients`);
    } finally {
      setTabLoading('mcp', false);
    }
  }, [onRefreshMCP, setTabLoading]);

  /**
   * 刷新任务列表
   */
  const handleRefreshTasks = useCallback(async () => {
    try {
      setTabLoading('tasks', true);
      await onRefreshTasks();
      message.success(t`Tasks refreshed`);
    } catch (error) {
      console.error('Refresh tasks error:', error);
      message.error(t`Failed to refresh tasks`);
    } finally {
      setTabLoading('tasks', false);
    }
  }, [onRefreshTasks, setTabLoading]);

  /**
   * 获取刷新按钮
   */
  const getRefreshButton = (tabKey: string, onRefresh: () => void) => (
    <Button
      type="text"
      size="small"
      icon={<ReloadOutlined />}
      loading={loading[tabKey]}
      onClick={onRefresh}
      title={t`Refresh`}
    />
  );

  /**
   * 标签页配置
   */
  const tabItems = [
    {
      key: 'agent',
      label: (
        <Space>
          <SettingOutlined />
          <span>{t`Agent`}</span>
          <Badge 
            count={agentInstance.isRunning ? 1 : 0} 
            dot 
            status={agentInstance.isRunning ? 'success' : 'default'}
          />
        </Space>
      ),
      children: (
        <AgentInfoPanel
          ref={agentManagementRef}
          agentPath={agentPath}
          agentName={agentName}
          agentInstance={agentInstance}
          onRefresh={handleRefreshAgent}
          onOpenChat={onOpenChat}
        />
      ),
      extra: getRefreshButton('agent', handleRefreshAgent)
    },
    {
      key: 'mcp',
      label: (
        <Space>
          <ApiOutlined />
          <span>{t`MCP`}</span>
          <Badge count={mcpClients.length} size="small" />
        </Space>
      ),
      children: (
        <AgentMCPPanel
          ref={mcpManagementRef}
          agentPath={agentPath}
          agentName={agentName}
          mcpClients={mcpClients}
          onRefresh={handleRefreshMCP}
        />
      ),
      extra: getRefreshButton('mcp', handleRefreshMCP)
    },
    {
      key: 'tasks',
      label: (
        <Space>
          <ScheduleOutlined />
          <span>{t`Tasks`}</span>
          <Badge count={tasks.length} size="small" />
        </Space>
      ),
      children: (
        <AgentTaskPanel
          ref={taskManagementRef}
          agentPath={agentPath}
          agentName={agentName}
          tasks={tasks}
          onRefresh={handleRefreshTasks}
        />
      ),
      extra: getRefreshButton('tasks', handleRefreshTasks)
    }
  ];

  return (
    <Card 
      size="small"
      title={
        <Space>
          <SettingOutlined />
          <Title level={5} style={{ margin: 0 }}>
            {t`Agent Management`}
          </Title>
        </Space>
      }
      extra={
        <Space>
          <Button
            type={agentInstance.isRunning ? 'default' : 'primary'}
            size="small"
            icon={agentInstance.isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            disabled={loading.agent}
          >
            {agentInstance.isRunning ? t`Stop` : t`Start`}
          </Button>
        </Space>
      }
      bodyStyle={{ padding: 0, height: 'calc(100vh - 120px)', overflow: 'hidden' }}
      style={{ height: '100%', border: 'none' }}
    >
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        items={tabItems}
        size="small"
        style={{ height: '100%' }}
        tabBarStyle={{
          margin: '0 12px',
          paddingTop: '8px'
        }}
      />

      {/* 底部操作栏 */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '8px 12px',
        borderTop: '1px solid #f0f0f0',
        background: '#fafafa'
      }}>
        <Space size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '11px', color: '#666' }}>
            📍 {agentPath}
          </div>
          <Button
            type="link"
            size="small"
            onClick={() => onOpenChat()}
            style={{ padding: '0 4px', fontSize: '11px' }}
          >
            {t`New Chat`}
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default AgentRightPanel;