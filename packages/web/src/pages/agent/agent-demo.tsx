/**
 * Agent页面演示组件
 * 展示Agent中心架构的UI设计，使用模拟数据
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout, Splitter, message, Typography, Alert } from 'antd';
import { useParams, useSearchParams } from 'react-router-dom';
import { t } from '@dadigua/hyperchat-shared';
import { 
  AgentInstanceInfo, 
  AgentDetails, 
  AgentChatTab, 
  FileNode,
  PanelSizes 
} from './types';
import AgentLeftPanel from './components/AgentLeftPanel';
import AgentMiddlePanel from './components/AgentMiddlePanel';
import AgentRightPanel from './components/AgentRightPanel';

const { Content } = Layout;
const { Title } = Typography;

/**
 * 模拟数据
 */
const mockAgentInstance: AgentInstanceInfo = {
  path: '/home/user/.hyperchat/agents/Demo-Agent',
  name: 'Demo Agent',
  config: {
    name: 'Demo Agent',
    prompt: 'You are a helpful AI assistant for software development. You can help users with coding, debugging, and project management tasks.',
    isConfirmCallTool: false,
    allowMCPs: ['file-operations', 'git-tools'],
    maxTokens: 4000,
    modelKey: 'gpt-4',
    temperature: 0.7,
    tags: ['development', 'coding'],
    subAgents: [],
    version: 1
  },
  isRunning: true,
  chatLogsCount: 15,
  lastChatTime: Date.now() - 1000 * 60 * 30, // 30分钟前
  hasMCPConfig: true,
  tasksCount: 3
};

const mockFileTree: FileNode[] = [
  {
    name: 'agent.yaml',
    path: '/home/user/.hyperchat/agents/Demo-Agent/agent.yaml',
    type: 'file',
    modified: Date.now() - 1000 * 60 * 60,
    extension: 'yaml'
  },
  {
    name: 'memory.md',
    path: '/home/user/.hyperchat/agents/Demo-Agent/memory.md',
    type: 'file',
    modified: Date.now() - 1000 * 60 * 30,
    extension: 'md'
  },
  {
    name: 'chatlogs',
    path: '/home/user/.hyperchat/agents/Demo-Agent/chatlogs',
    type: 'directory',
    modified: Date.now() - 1000 * 60 * 10,
    children: [
      {
        name: 'chat-2024-01-20.yaml',
        path: '/home/user/.hyperchat/agents/Demo-Agent/chatlogs/chat-2024-01-20.yaml',
        type: 'file',
        modified: Date.now() - 1000 * 60 * 10,
        extension: 'yaml'
      }
    ]
  },
  {
    name: 'mcp.json',
    path: '/home/user/.hyperchat/agents/Demo-Agent/mcp.json',
    type: 'file',
    modified: Date.now() - 1000 * 60 * 60 * 2,
    extension: 'json'
  }
];

const mockMCPClients = [
  {
    serverName: 'file-operations',
    status: 'connected' as const,
    config: {
      command: 'node',
      args: ['/usr/local/lib/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js'],
      env: { NODE_ENV: 'production' }
    },
    mcpType: 'custom' as const,
    version: '1.0.0',
    workspacePath: mockAgentInstance.path,
    scope: 'workspace' as const,
    tools: [],
    prompts: [],
    resources: [],
    order: 1,
    ext: {}
  },
  {
    serverName: 'git-tools',
    status: 'disconnected' as const,
    config: {
      command: 'git-mcp-server',
      args: [],
      env: {}
    },
    mcpType: 'builtin' as const,
    version: '0.9.0',
    workspacePath: mockAgentInstance.path,
    scope: 'workspace' as const,
    tools: [],
    prompts: [],
    resources: [],
    order: 2,
    ext: {}
  }
];

const mockTasks = [
  {
    id: 'task-1',
    name: 'Daily Code Review',
    description: 'Review recent commits and provide feedback',
    prompt: 'Please review the recent commits in this repository and provide feedback on code quality, potential issues, and improvements.',
    schedule: '0 9 * * 1-5',
    enabled: true,
    created: Date.now() - 1000 * 60 * 60 * 24 * 7,
    lastRun: Date.now() - 1000 * 60 * 60 * 24,
    nextRun: Date.now() + 1000 * 60 * 60 * 15,
    runCount: 12
  },
  {
    id: 'task-2',
    name: 'Weekly Progress Summary',
    description: 'Generate a summary of weekly development progress',
    prompt: 'Create a summary of this week\'s development progress including completed features, bugs fixed, and upcoming priorities.',
    schedule: '0 17 * * 5',
    enabled: true,
    created: Date.now() - 1000 * 60 * 60 * 24 * 14,
    lastRun: Date.now() - 1000 * 60 * 60 * 24 * 7,
    nextRun: Date.now() + 1000 * 60 * 60 * 24 * 3,
    runCount: 3
  },
  {
    id: 'task-3',
    name: 'Backup Agent Memory',
    description: 'Create a backup of agent memory and important conversations',
    prompt: 'Create a backup of important conversations and learned information for disaster recovery.',
    schedule: '0 2 * * 0',
    enabled: false,
    created: Date.now() - 1000 * 60 * 60 * 24 * 3,
    runCount: 0
  }
];

/**
 * Agent页面演示组件
 */
const AgentDemoPage: React.FC = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const [searchParams] = useSearchParams();
  
  // 状态管理
  const [agentDetails] = useState<AgentDetails>({
    instanceInfo: mockAgentInstance,
    fileTreeData: mockFileTree,
    mcpClients: Object.fromEntries(mockMCPClients.map(client => [client.serverName, client as any])),
    tasks: mockTasks as any,
    chatLogs: [
      { key: 'chat-1', label: 'Project Discussion', created: Date.now() - 1000 * 60 * 60, lastModified: Date.now() - 1000 * 60 * 30 },
      { key: 'chat-2', label: 'Code Review Session', created: Date.now() - 1000 * 60 * 60 * 2, lastModified: Date.now() - 1000 * 60 * 60 }
    ]
  });
  
  const [chatTabs, setChatTabs] = useState<AgentChatTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('welcome');
  const [showHidden, setShowHidden] = useState(false);
  
  // 面板尺寸状态
  const [panelSizes] = useState<PanelSizes>({
    left: '20%',
    middle: '50%', 
    right: '30%'
  });

  // Refs for child component methods
  const agentManagementRef = useRef<any>(null);
  const mcpManagementRef = useRef<any>(null);
  const taskManagementRef = useRef<any>(null);

  /**
   * 模拟刷新函数
   */
  const refreshAgent = useCallback(async () => {
    message.success(t`Agent information refreshed`);
  }, []);

  const refreshFileTree = useCallback(async () => {
    message.success(t`File tree refreshed`);
  }, []);

  const refreshMCP = useCallback(async () => {
    message.success(t`MCP clients refreshed`);
  }, []);

  const refreshTasks = useCallback(async () => {
    message.success(t`Tasks refreshed`);
  }, []);

  /**
   * 文件选择处理
   */
  const handleFileSelect = useCallback((filePath: string, fileName: string) => {
    const tabKey = `file_${filePath}`;
    const existingTab = chatTabs.find(tab => tab.key === tabKey);
    
    if (existingTab) {
      setActiveTabKey(tabKey);
      return;
    }
    
    const newTab: AgentChatTab = {
      key: tabKey,
      title: fileName,
      type: 'file',
      agentPath: agentDetails.instanceInfo.path,
      agentName: agentDetails.instanceInfo.name,
      filePath,
      fileName,
      closable: true
    };
    
    setChatTabs(prev => [...prev, newTab]);
    setActiveTabKey(tabKey);
  }, [agentDetails, chatTabs]);

  /**
   * 打开聊天标签页
   */
  const handleOpenChatLog = useCallback((chatLog?: { key: string; label?: string }) => {
    const tabKey = chatLog ? `chat_${chatLog.key}` : 'new_chat';
    const existingTab = chatTabs.find(tab => tab.key === tabKey);
    
    if (existingTab) {
      setActiveTabKey(tabKey);
      return;
    }
    
    const newTab: AgentChatTab = {
      key: tabKey,
      title: chatLog?.label || t`New Chat`,
      type: 'chat',
      agentPath: agentDetails.instanceInfo.path,
      agentName: agentDetails.instanceInfo.name,
      closable: true,
      chatLogToLoad: chatLog
    };
    
    setChatTabs(prev => [...prev, newTab]);
    setActiveTabKey(tabKey);
  }, [agentDetails, chatTabs]);

  /**
   * 标签页变更处理
   */
  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTabKey(tabKey);
  }, []);

  /**
   * 关闭标签页
   */
  const handleTabRemove = useCallback((targetKey: string) => {
    const newTabs = chatTabs.filter(tab => tab.key !== targetKey);
    setChatTabs(newTabs);
    
    if (activeTabKey === targetKey) {
      const newActiveKey = newTabs.length > 0 ? newTabs[newTabs.length - 1].key : 'welcome';
      setActiveTabKey(newActiveKey);
    }
  }, [chatTabs, activeTabKey]);

  // 初始化欢迎标签页
  useEffect(() => {
    const welcomeTab: AgentChatTab = {
      key: 'welcome',
      title: t`Welcome`,
      type: 'welcome',
      agentPath: agentDetails.instanceInfo.path,
      agentName: agentDetails.instanceInfo.name,
      closable: false
    };
    
    setChatTabs([welcomeTab]);
    setActiveTabKey('welcome');
  }, [agentDetails]);

  const mcpClientArray = Object.values(agentDetails.mcpClients);

  return (
    <Layout style={{ height: '100vh' }}>
      <Content style={{ padding: 0, overflow: 'hidden' }}>
        {/* 演示提示 */}
        <Alert
          message={t`Demo Mode`}
          description={t`This is a demonstration of the Agent-centered architecture. All data shown is simulated.`}
          type="info"
          showIcon
          style={{ margin: '8px 16px' }}
        />
        
        {/* 标题栏 */}
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa'
        }}>
          <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
            🤖 {agentDetails.instanceInfo.name}
            <span style={{ 
              marginLeft: '12px', 
              fontSize: '12px', 
              color: '#666',
              fontWeight: 'normal'
            }}>
              {agentDetails.instanceInfo.isRunning ? '🟢 运行中' : '🔴 已停止'}
            </span>
          </Title>
        </div>

        {/* 三栏布局 */}
        <Splitter style={{ height: 'calc(100vh - 120px)' }}>
          {/* 左侧面板 - 文件树 */}
          <Splitter.Panel 
            defaultSize={panelSizes.left}
            min="15%"
            max="40%"
          >
            <AgentLeftPanel
              agentPath={agentDetails.instanceInfo.path}
              agentName={agentDetails.instanceInfo.name}
              fileTreeData={agentDetails.fileTreeData}
              showHidden={showHidden}
              onShowHiddenChange={setShowHidden}
              onRefreshFileTree={refreshFileTree}
              onFileSelect={handleFileSelect}
            />
          </Splitter.Panel>

          {/* 中间面板 - 聊天区域 */}
          <Splitter.Panel 
            defaultSize={panelSizes.middle}
            min="30%"
            max="70%"
          >
            <AgentMiddlePanel
              agentPath={agentDetails.instanceInfo.path}
              agentName={agentDetails.instanceInfo.name}
              chatTabs={chatTabs}
              activeTabKey={activeTabKey}
              agentInstance={agentDetails.instanceInfo}
              mcpClients={mcpClientArray}
              onTabChange={handleTabChange}
              onTabRemove={handleTabRemove}
              onOpenChatLog={handleOpenChatLog}
              onFileClose={handleTabRemove}
            />
          </Splitter.Panel>

          {/* 右侧面板 - 管理功能 */}
          <Splitter.Panel 
            defaultSize={panelSizes.right}
            min="20%"
            max="50%"
          >
            <AgentRightPanel
              agentPath={agentDetails.instanceInfo.path}
              agentName={agentDetails.instanceInfo.name}
              agentInstance={agentDetails.instanceInfo}
              mcpClients={mcpClientArray}
              tasks={agentDetails.tasks}
              agentManagementRef={agentManagementRef}
              mcpManagementRef={mcpManagementRef}
              taskManagementRef={taskManagementRef}
              onRefreshAgent={refreshAgent}
              onRefreshMCP={refreshMCP}
              onRefreshTasks={refreshTasks}
              onOpenChat={handleOpenChatLog}
            />
          </Splitter.Panel>
        </Splitter>
      </Content>
    </Layout>
  );
};

export default AgentDemoPage;