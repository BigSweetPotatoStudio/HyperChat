/**
 * Agent页面主组件
 * Agent中心架构的核心页面，支持单Agent管理
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Layout, Splitter, message, Spin, Alert, Typography } from 'antd';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { call } from '../../common/call';
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
 * Agent页面主组件
 */
const AgentPage: React.FC = () => {
  const { agentName } = useParams<{ agentName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentDetails, setAgentDetails] = useState<AgentDetails | null>(null);
  const [chatTabs, setChatTabs] = useState<AgentChatTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>('welcome');
  const [showHidden, setShowHidden] = useState(false);
  
  // 面板尺寸状态
  const [panelSizes, setPanelSizes] = useState<PanelSizes>({
    left: '20%',
    middle: '50%', 
    right: '30%'
  });

  // Refs for child component methods
  const agentManagementRef = useRef<any>(null);
  const mcpManagementRef = useRef<any>(null);
  const taskManagementRef = useRef<any>(null);

  // 从URL参数获取agentPath
  const agentPath = searchParams.get('path');
  const actualAgentName = agentName || searchParams.get('name') || 'Unknown';

  /**
   * 加载Agent详情
   */
  const loadAgentDetails = useCallback(async () => {
    if (!agentPath && !agentName) {
      setError(t`Agent path or name is required`);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 使用现有API获取Agent信息
      const response = await call('getWorkspaceAgentsSummary');

      if (response && Array.isArray(response)) {
        // 同时加载MCP客户端数据
        let mcpClientsObj: Record<string, any> = {};
        try {
          const mcpClientsData = await call('getMcpClientsByAgent', actualAgentName);
          if (Array.isArray(mcpClientsData)) {
            mcpClientsData.forEach((client: any) => {
              if (client.serverName) {
                mcpClientsObj[client.serverName] = client;
              }
            });
          }
        } catch (error) {
          console.warn('Failed to load MCP clients:', error);
        }

        // 构建Agent详情数据结构
        const mockAgentDetails: AgentDetails = {
          instanceInfo: {
            path: agentPath || '/mock/agent/path',
            name: actualAgentName,
            config: response[0]?.config || {
              name: actualAgentName,
              prompt: 'Default prompt',
              isConfirmCallTool: false,
              allowMCPs: [],
              maxTokens: 4000,
              tags: [],
              subAgents: [],
              version: 1
            },
            isRunning: true,
            chatLogsCount: response[0]?.chatLogsCount || 0,
            lastChatTime: response[0]?.lastChatTime,
            hasMCPConfig: Object.keys(mcpClientsObj).length > 0,
            tasksCount: 0
          },
          fileTreeData: [],
          mcpClients: mcpClientsObj,
          tasks: [],
          chatLogs: []
        };
        setAgentDetails(mockAgentDetails);
        
        // 初始化欢迎标签页
        const welcomeTab: AgentChatTab = {
          key: 'welcome',
          title: t`Welcome`,
          type: 'welcome',
          agentPath: mockAgentDetails.instanceInfo.path,
          agentName: mockAgentDetails.instanceInfo.name,
          closable: false
        };
        
        setChatTabs([welcomeTab]);
        setActiveTabKey('welcome');
      } else {
        setError(t`Failed to load agent details`);
      }
    } catch (err) {
      console.error('Load agent details error:', err);
      setError(err instanceof Error ? err.message : t`Unknown error`);
    } finally {
      setLoading(false);
    }
  }, [agentPath, agentName, actualAgentName]);

  /**
   * 刷新Agent信息
   */
  const refreshAgent = useCallback(async () => {
    if (!agentDetails) return;
    
    try {
      // 模拟刷新操作
      console.log('刷新Agent信息:', agentDetails.instanceInfo.path);
    } catch (error) {
      console.error('Refresh agent error:', error);
      message.error(t`Failed to refresh agent information`);
    }
  }, [agentDetails]);

  /**
   * 刷新文件树
   */
  const refreshFileTree = useCallback(async () => {
    if (!agentDetails) return;
    
    try {
      // 模拟刷新文件树
      console.log('刷新文件树:', agentDetails.instanceInfo.path, '显示隐藏文件:', showHidden);
    } catch (error) {
      console.error('Refresh file tree error:', error);
      message.error(t`Failed to refresh file tree`);
    }
  }, [agentDetails, showHidden]);

  /**
   * 刷新MCP客户端
   */
  const refreshMCP = useCallback(async () => {
    if (!agentDetails) return;
    
    try {
      // 使用Agent级别的MCP API获取客户端数据
      const mcpClientsData = await call('getMcpClientsByAgent', actualAgentName);
      
      // 将数组转换为对象格式以保持向后兼容
      const mcpClientsObj: Record<string, any> = {};
      if (Array.isArray(mcpClientsData)) {
        mcpClientsData.forEach((client: any) => {
          if (client.serverName) {
            mcpClientsObj[client.serverName] = client;
          }
        });
      }
      
      // 更新agentDetails中的MCP客户端数据
      setAgentDetails(prev => prev ? {
        ...prev,
        mcpClients: mcpClientsObj
      } : prev);
      
    } catch (error) {
      console.error('Refresh MCP error:', error);
      message.error(t`Failed to refresh MCP clients`);
    }
  }, [agentDetails, actualAgentName]);

  /**
   * 刷新任务列表
   */
  const refreshTasks = useCallback(async () => {
    if (!agentDetails) return;
    
    try {
      // 模拟任务列表刷新
      console.log('刷新任务列表:', agentDetails.instanceInfo.path);
    } catch (error) {
      console.error('Refresh tasks error:', error);
      message.error(t`Failed to refresh tasks`);
    }
  }, [agentDetails]);

  /**
   * 文件选择处理
   */
  const handleFileSelect = useCallback((filePath: string, fileName: string) => {
    if (!agentDetails) return;
    
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
    if (!agentDetails) return;
    
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

  // 初始化加载
  useEffect(() => {
    loadAgentDetails();
  }, [loadAgentDetails]);

  // 文件树自动刷新
  useEffect(() => {
    if (agentDetails) {
      refreshFileTree();
    }
  }, [showHidden, agentDetails?.instanceInfo.path]);

  // 渲染加载状态
  if (loading) {
    return (
      <Layout style={{ height: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" tip={t`Loading agent...`} />
        </Content>
      </Layout>
    );
  }

  // 渲染错误状态
  if (error || !agentDetails) {
    return (
      <Layout style={{ height: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <Alert
            message={t`Agent Loading Failed`}
            description={error || t`Agent not found`}
            type="error"
            showIcon
            action={
              <a onClick={() => navigate('/agents')}>{t`Back to Agent List`}</a>
            }
          />
        </Content>
      </Layout>
    );
  }

  const mcpClientArray = Object.values(agentDetails.mcpClients);

  return (
    <Layout style={{ height: '100vh' }}>
      <Content style={{ padding: 0, overflow: 'hidden' }}>
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
        <Splitter style={{ height: 'calc(100vh - 64px)' }}>
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

export default AgentPage;