import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Modal,
  Form,
  message,
  Tabs,
  Space,
  Empty,
  Tag,
  Splitter,
  Drawer,
} from "antd";
import {
  FolderOpenOutlined,
  SettingOutlined,
  GlobalOutlined,
  SwapOutlined, // 新增切换图标
} from "@ant-design/icons";
import { call, msg_receive } from "../../common/call";
import { useForceUpdate } from "../../hooks/useForceUpdate";
import { t } from "../../i18n";
import { ServerDirectoryBrowser } from "../../components/ServerDirectoryBrowser";
import { MCPManagementRef } from "../../components/MCPManagement";
import { AgentManagementRef } from "../../components/AgentManagement";
// WorkspaceLeftPanel removed in simplified layout
import { WorkspaceMiddlePanel } from "./WorkspaceMiddlePanel";
import { WorkspaceRightPanel } from "./WorkspaceRightPanel";
import { WorkspaceOpenModal } from "./WorkspaceOpenForm";
import {
  WorkspaceInfo,
  CurrentWorkspaceDetails,
  ChatTab,
  WorkspaceHistoryItem,
  type PanelSizes,
} from "./types";
import { getPanelSizes, savePanelSizes, getWorkspaceHistory, addToWorkspaceHistory, removeFromWorkspaceHistory, addAgentRecentUsage } from "../../utils/storage";
import { AgentConfig, MessageData, MessageDataMap } from "@dadigua/hyperchat-shared";
import { AppSettingsSchema, MCPGatewaySchema } from "@dadigua/hyperchat-shared";
import type { z } from "zod";
import { ProviderSettings } from "../../components/ProviderSettings";
import { AppHeader } from "../../components/AppHeader";
import { AppActions } from "../../components/AppActions";
import { AppSettings } from "../../components/AppSettings";
import { MCPGatewaysSettings } from "../../components/MCPGatewaysSettings";


// 类型定义已移至 ./types.ts

// 重新导出常用类型供其他组件使用
export type { WorkspaceInfo, CurrentWorkspaceDetails, ChatTab } from "./types";

export function Workspace() {
  const refresh = useForceUpdate();

  // 通用错误处理函数
  const handleError = (error: unknown, errorMessage: string) => {
    console.error(errorMessage, error);
    message.error(errorMessage);
  };

  // 只从context获取真正需要在Layout中管理的状态


  // 抽屉状态管理 - 合并为一个对象
  const [drawerStates, setDrawerStates] = useState({
    modelConfig: false,
    appSettings: false,
    mcpGateways: false,
  });


  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<string>("");

  // 当前工作区状态
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceInfo | null>(null);
  const [currentWorkspaceDetails, setCurrentWorkspaceDetails] = useState<CurrentWorkspaceDetails | null>(null);
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  // 工作区切换相关状态
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [confirmCreateModalOpen, setConfirmCreateModalOpen] = useState(false);
  const [pendingWorkspacePath, setPendingWorkspacePath] = useState<string>("");
  const [directoryBrowserOpen, setDirectoryBrowserOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [showHiddenFiles, setShowHiddenFiles] = useState(true);
  const [workspaceHistory, setWorkspaceHistory] = useState<WorkspaceHistoryItem[]>(() => getWorkspaceHistory());
  
  // 应用设置状态
  const [appSettings, setAppSettings] = useState<z.infer<typeof AppSettingsSchema> | null>(null);
  const [globalWorkspacePath, setGlobalWorkspacePath] = useState<string>('unknown');
  
  
  // 表单和UI状态
  const [form] = Form.useForm();
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string>("");

  // 管理组件引用
  const agentManagementRef = useRef<AgentManagementRef | null>(null);
  const mcpManagementRef = useRef<MCPManagementRef | null>(null);

  // 防抖计时器 ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);


  // 面板尺寸状态 - 两列布局：中间面板和右侧面板
  const [panelSizes, setPanelSizes] = useState<number[]>(() => {
    // 初始化时使用默认尺寸（移除左侧面板后调整）
    return [75, 25]; // 对应75%、25%（中间面板，右侧面板）
  });


  // 加载当前工作区
  const loadCurrentWorkspace = async () => {
    try {
      const currentWorkspaceData = await call("getCurrentWorkspace");
      if (currentWorkspaceData) {
        const currentWorkspaceInfo: WorkspaceInfo = {
          path: currentWorkspaceData.path || '',
          name: currentWorkspaceData.name || 'Workspace',
          description: currentWorkspaceData.description,
          created: currentWorkspaceData.created || Date.now(),
          settings: currentWorkspaceData.settings || {},
          agentsCount: currentWorkspaceData.agentsCount || 0,
          mcpServersCount: currentWorkspaceData.mcpServersCount || 0,
          isGlobal: currentWorkspaceData.isGlobal || false,
        };

        setCurrentWorkspace(currentWorkspaceInfo);
        setActiveWorkspaceKey(currentWorkspaceInfo.path);
      }
    } catch (error) {
      handleError(error, "Failed to load current workspace");
    }
  };

  // 加载当前工作区详细信息
  const loadWorkspaceDetails = async (workspace: WorkspaceInfo) => {

    try {
      const details: CurrentWorkspaceDetails = {
        agents: [],
        mcpClients: {} as Record<string, any>,
        fileTreeData: undefined
      };

      // 加载根目录文件列表（懒加载）
      console.log("Loading file tree for workspace:", workspace.path, "isGlobal:", workspace.isGlobal);
      const rootItems = await call("getWorkspaceDirectoryList", {
        directoryPath: ""
      });
      console.log("File tree loaded:", rootItems?.length, "items");
      details.fileTreeData = rootItems;

      // 加载 Agents（获取摘要信息）
      const agentList = await call("getWorkspaceAgentsSummary");
      details.agents = agentList as Array<{
        config: AgentConfig & { scope?: "global" | "workspace" };
        chatLogsCount: number;
        lastChatTime?: number;
      }>;

      // 加载 MCP 客户端
      const mcpList = await call("getWorkspaceMcpClients");

      // 将数组转换为对象格式，使用 name 作为 key
      if (mcpList && Array.isArray(mcpList)) {
        mcpList.forEach((client) => {
          if (client && client.serverName) {
            (details.mcpClients as Record<string, any>)[client.serverName as string] = client;
          }
        });
      }

      setCurrentWorkspaceDetails(details);
    } catch (error) {
      handleError(error, "Failed to load workspace details");
    }
  };

  // 打开工作区
  const openWorkspace = async (values: { path: string }) => {
    setSwitchingWorkspace(true);
    try {

      // 工作区已存在，切换到该工作区
      await switchToWorkspace(values.path);

      // 添加到历史记录
      const folderName = values.path.split(/[/\\]/).pop() || 'Workspace';
      addToWorkspaceHistory(values.path, folderName);
      setWorkspaceHistory(getWorkspaceHistory());

      // 重新加载以更新当前工作区标记
      await loadCurrentWorkspace();


      setOpenModalOpen(false);
      form.resetFields();
      setSelectedPath("");

    } catch (error) {
      handleError(error, "Failed to open workspace");
    } finally {
      setSwitchingWorkspace(false);
    }
  };

  // 切换工作区
  const switchToWorkspace = async (workspacePath: string) => {
    try {
      await call("switchWorkspace", { workspacePath, force: false });
      setOpenModalOpen(false);
      await loadCurrentWorkspace();
      message.success(t`Switched to workspace`);
    } catch (error) {
      setConfirmCreateModalOpen(true);
      setPendingWorkspacePath(workspacePath);
      handleError(error, "Failed to switch to workspace");
    }
  };

  // 创建并切换工作区
  const createAndSwitchWorkspace = async (workspacePath: string) => {
    try {
      await call("switchWorkspace", {
        workspacePath: workspacePath,
        force: true
      });
      
      const folderName = workspacePath.split(/[/\\]/).pop() || 'Workspace';
      addToWorkspaceHistory(workspacePath, folderName);
      setWorkspaceHistory(getWorkspaceHistory());
      message.success(t`Switched to workspace`);
    } catch (error) {
      handleError(error, "Failed to create workspace");
    }
  };

  // 确认创建工作区
  const confirmCreateWorkspace = async () => {
    setSwitchingWorkspace(true);
    try {
      await createAndSwitchWorkspace(pendingWorkspacePath);

      await loadCurrentWorkspace();
      setConfirmCreateModalOpen(false);
      setPendingWorkspacePath("");
    } catch (error) {
      handleError(error, "Failed to confirm create workspace");
    } finally {
      setSwitchingWorkspace(false);
    }
  };



  // 处理应用设置
  const handleAppSettings = async () => {
    try {
      // 加载应用设置
      const settings = await call("getAppSettings");
      setAppSettings(settings);
      setDrawerStates(prev => ({ ...prev, appSettings: true }));
    } catch (error) {
      handleError(error, "Failed to load app settings");
    }
  };

  // 更新应用设置
  const updateAppSettings = async (updates: Partial<z.infer<typeof AppSettingsSchema>>) => {
    try {
      const updatedSettings = await call("updateAppSettings", {
        updates
      });
      setAppSettings(updatedSettings);
      message.success(t`App settings updated successfully`);

      // 如果更改了主题设置，应用到界面
      if (updates.appearance?.darkTheme !== undefined) {
        const darkReader = await import('darkreader');
        if (updates.appearance.darkTheme) {
          darkReader.enable({
            brightness: 100,
            contrast: 90,
            sepia: 10,
          });
        } else {
          darkReader.disable();
        }
      }
    } catch (error) {
      handleError(error, "Failed to update app settings");
    }
  };

  // 处理 MCP Gateways 设置
  const handleMCPGateways = async () => {
    try {
      // 加载应用设置以获取当前的 MCP Gateways 配置
      const settings = await call("getAppSettings");
      setAppSettings(settings);
      setDrawerStates(prev => ({ ...prev, mcpGateways: true }));
    } catch (error) {
      handleError(error, "Failed to load MCP gateways");
    }
  };

  // 获取可用的 MCP 服务列表
  const getAvailableMCPs = () => {
    if (!currentWorkspaceDetails) return [];

    // 提取所有可用的 MCP 服务名称
    const availableMCPs = new Set<string>();
    const allMcpClients = Object.values(currentWorkspaceDetails.mcpClients);

    allMcpClients.forEach(client => {
      if (client.status === 'connected') {
        availableMCPs.add(client.serverName);
        // 也可以添加工具名称
        if (client.tools) {
          client.tools.forEach(tool => {
            availableMCPs.add(tool.name);
          });
        }
      }
    });

    return Array.from(availableMCPs).sort();
  };

  // 更新 MCP Gateways 配置
  const updateMCPGateways = async (gateways: z.infer<typeof MCPGatewaySchema>[]) => {
    try {
      const updates = { mcpGateWays: gateways };
      await updateAppSettings(updates);

      // 刷新 MCP 路由以应用新的网关配置
      try {
        await call("refreshMcpRoutes");
        console.log('MCP routes refreshed successfully');
      } catch (routeError) {
        console.warn('Failed to refresh MCP routes, but settings were saved:', routeError);
        // 不阻止设置保存，只是警告路由刷新失败
      }

      message.success(t`MCP Gateways updated successfully`);
    } catch (error) {
      handleError(error, "Failed to update MCP gateways");
    }
  };



  // 选择服务器目录
  const handleServerDirectorySelect = async (path: string) => {
    try {
      form.setFieldsValue({ path });
      setSelectedPath(path);

      // 检查是否已经是工作区
      const isWorkspace = await call("isWorkspaceDirectory", { directoryPath: path });
      if (isWorkspace) {
        message.warning(t`This directory is already a workspace`);
      }

      setDirectoryBrowserOpen(false);
    } catch (error) {
      handleError(error, "Failed to process selected directory");
    }
  };

  // 刷新工作区详情
  const refreshWorkspaceDetails = async (refreshType?: 'agents' | 'mcp' | 'all') => {
    const type = refreshType || 'all';

    if (currentWorkspace && currentWorkspaceDetails) {
      try {
        const updatedDetails = { ...currentWorkspaceDetails };

        // 根据刷新类型选择性刷新数据
        if (type === 'agents' || type === 'all') {
          // 刷新 Agents
          const rawAgentList = await call("getWorkspaceAgentsSummary");
          updatedDetails.agents = rawAgentList as Array<{
            config: AgentConfig & { scope?: "global" | "workspace" };
            chatLogsCount: number;
            lastChatTime?: number;
          }>;
        }

        if (type === 'mcp' || type === 'all') {
          // 刷新 MCP 客户端
          const mcpList = await call("getWorkspaceMcpClients");

          // 将数组转换为对象格式
          updatedDetails.mcpClients = {} as Record<string, any>;
          if (mcpList && Array.isArray(mcpList)) {
            mcpList.forEach((client) => {
              if (client && client.serverName) {
                (updatedDetails.mcpClients as Record<string, any>)[client.serverName as string] = client;
              }
            });
          }
        }

        setCurrentWorkspaceDetails(updatedDetails);
      } catch (error) {
        console.error("Failed to refresh workspace details:", error);
        throw error;
      }
    }
  };

  // 刷新文件树
  const refreshFileTree = async () => {
    if (currentWorkspace && currentWorkspaceDetails) {
      try {
        // 重新加载文件树数据
        const rootItems = await call("getWorkspaceDirectoryList", {
          directoryPath: ""
        });

        // 更新当前工作区详情中的文件树数据
        setCurrentWorkspaceDetails(prev => {
          if (!prev) return null;
          return {
            ...prev,
            fileTreeData: rootItems
          };
        });
      } catch (error) {
        console.error("Failed to refresh file tree:", error);
        throw error; // 重新抛出错误，让组件显示错误消息
      }
    }
  };

  // 处理隐藏文件显示切换
  const handleShowHiddenChange = (showHidden: boolean) => {
    setShowHiddenFiles(showHidden);
    // 不需要重新加载数据，文件树组件会自动通过useEffect重新过滤和渲染
  };

  // 处理面板尺寸变化（2栏布局）
  const handlePanelSizeChange = (sizes: number[]) => {
    const currentWorkspace = getCurrentWorkspace();
    if (currentWorkspace && sizes.length >= 2) {
      // 直接更新状态数组
      setPanelSizes(sizes);

      // 构建保存到localStorage的对象格式（保持兼容性）
      const sizesToSave: PanelSizes = {
        left: '0%',                      // 左侧面板已移除
        middle: `${sizes[0] || 75}%`,    // 中间面板（聊天区域）
        right: `${sizes[1] || 25}%`      // 右侧面板（管理区域）
      };

      // 保存到localStorage（使用防抖，避免频繁保存）
      const workspaceKey = currentWorkspace.path;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        savePanelSizes(workspaceKey, sizesToSave);
      }, 500); // 500ms 防抖
    }
  };

  // 加载全局工作区路径
  const loadGlobalWorkspacePath = async () => {
    try {
      const path = await call("getGlobalWorkspacePath");
      setGlobalWorkspacePath(path);
    } catch (error) {
      console.error("Failed to load global workspace path:", error);
      // 如果获取失败，使用默认路径
    }
  };

  useEffect(() => {
    loadCurrentWorkspace();
    loadGlobalWorkspacePath();
  }, []);

  // 当工作区加载完成后，自动加载当前活动工作区的详情
  useEffect(() => {
    const workspace = getCurrentWorkspace();
    if (workspace) {
      loadWorkspaceDetails(workspace);
      // 加载当前工作区的面板尺寸（2栏布局）
      const workspaceKey = workspace.path;
      const sizes = getPanelSizes(workspaceKey);
      // 将百分比字符串转换为数字，适配2栏布局
      const middleNum = parseInt(sizes.middle) || 75; // 中间面板默认75%
      const rightNum = parseInt(sizes.right) || 25;   // 右侧面板默认25%
      setPanelSizes([middleNum, rightNum]);
      // 初始化默认聊天标签页
      initDefaultChatTab(workspace);
    }
  }, [activeWorkspaceKey]);

  // 获取当前活动工作区
  const getCurrentWorkspace = () => {
    return currentWorkspace;
  };


  // 获取当前工作区详情
  const getCurrentDetails = (): CurrentWorkspaceDetails => {
    return currentWorkspaceDetails || {
      agents: [],
      mcpClients: {},
      fileTreeData: undefined
    };
  };

  // 处理标签页切换（简化版：不再需要切换工作区标签）
  const handleTabChange = async (key: string) => {
    // 工作区切换逻辑已简化，这里保留以防UI组件调用
    console.log('Tab change:', key);
  };

  // 打开Agent聊天
  const openAgentChat = (agent: { config: AgentConfig; chatLogsCount: number; lastChatTime?: number }, chatLog?: { key: string; label?: string }) => {
    const workspace = currentWorkspace;
    if (!workspace) return;

    // 记录 agent 使用
    addAgentRecentUsage(workspace.path, agent.config.name);

    // 如果有聊天记录，使用聊天记录的key确保唯一性
    const tabKey = chatLog ? `${workspace.path}-${agent.config.name}-${chatLog.key}` : `${workspace.path}-${agent.config.name}`;
    const existingTab = chatTabs.find(tab => tab.key === tabKey);

    if (existingTab) {
      // 如果已存在，切换到该标签页
      setActiveTabKey(tabKey);
    } else {
      // 创建新的聊天标签页
      const tabTitle = chatLog ? `${agent.config.name} - ${chatLog.label?.slice(0, 10) || chatLog.key}` : agent.config.name;
      const newTab: ChatTab = {
        key: tabKey,
        title: tabTitle,
        type: 'chat',
        agentName: agent.config.name,
        agentScope: (agent.config as any).scope || "workspace",
        workspacePath: workspace.path,
        closable: true,
        chatLogToLoad: chatLog, // 传递聊天记录数据
      };
      setChatTabs(prev => [...prev, newTab]);
      setActiveTabKey(tabKey);
    }
  };

  // 打开文件编辑器
  const openFileEditor = (filePath: string, fileName: string) => {
    const currentWorkspace = getCurrentWorkspace();
    if (!currentWorkspace) return;

    const tabKey = `${currentWorkspace.path}-file-${filePath}`;
    const existingTab = chatTabs.find(tab => tab.key === tabKey);

    if (existingTab) {
      // 如果已存在，切换到该标签页
      setActiveTabKey(tabKey);
    } else {
      // 创建新的文件编辑标签页
      const newTab: ChatTab = {
        key: tabKey,
        title: fileName,
        type: 'file',
        filePath: filePath,
        fileName: fileName,
        workspacePath: currentWorkspace.path,
        closable: true,
      };
      setChatTabs(prev => [...prev, newTab]);
      setActiveTabKey(tabKey);
    }
  };


  // 初始化默认欢迎标签页
  const initDefaultChatTab = (workspace: WorkspaceInfo) => {
    const defaultTabKey = `${workspace.path}-welcome`;
    const hasDefaultTab = chatTabs.some(tab => tab.key === defaultTabKey);

    if (!hasDefaultTab) {
      const defaultTab: ChatTab = {
        key: defaultTabKey,
        title: t`Welcome`,
        type: 'welcome',
        workspacePath: workspace.path,
        closable: false,
      };
      setChatTabs(prev => [defaultTab]);
      if (!chatTabs.find(tab => tab.key === activeTabKey)) {
        setActiveTabKey(defaultTabKey);
      }
    }
  };

  // 获取当前工作区用于显示
  const getCurrentWorkspaceForDisplay = () => {
    return currentWorkspace ? [currentWorkspace] : [];
  };

  // 渲染工作区标签页标签
  const renderWorkspaceLabel = (workspace: WorkspaceInfo) => {
    const isGlobal = workspace.isGlobal;

    return (
      <Space>
        {isGlobal ? <GlobalOutlined /> : <FolderOpenOutlined />}
        <div style={{ textAlign: 'left' }}>
          <div>{workspace.name || (isGlobal ? t`Global Workspace` : workspace.name)}</div>
          <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>
            {workspace.path}
          </div>
        </div>
        {isGlobal && <Tag color="blue">{t`Global`}</Tag>}
      </Space>
    );
  };

  // 生成标签页items
  const getTabItems = () => {
    const workspaceList = getCurrentWorkspaceForDisplay();

    return workspaceList.map(workspace => ({
      key: workspace.path,
      label: renderWorkspaceLabel(workspace),
      closable: false,
    }));
  };

  // 渲染工作区内容
  const renderWorkspaceContent = (workspaceKey: string) => {
    const workspace = currentWorkspace;
    const details = getCurrentDetails();

    if (!workspace) {
      return (
        <Empty
          description={t`Please select a workspace to view details`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    // 获取MCP客户端列表
    const mcpClients = Object.values(details.mcpClients).sort((a, b) => a.order - b.order);
    return (
      <div className="h-full">
        <Splitter
          style={{ height: '100%' }}
          onResize={handlePanelSizeChange}
        >
          {/* 中间面板：聊天界面 */}
          <Splitter.Panel
            size={panelSizes[0] || 75}
            min="50%"
          >
            <WorkspaceMiddlePanel
              workspace={workspace}
              chatTabs={chatTabs}
              activeTabKey={activeTabKey}
              agents={details.agents || []}
              mcpClients={mcpClients}
              agentManagementRef={agentManagementRef}
              onTabChange={setActiveTabKey}
              onTabRemove={(targetKey) => {
                const newTabs = chatTabs.filter(tab => tab.key !== targetKey);
                setChatTabs(newTabs);

                // 如果关闭的是当前活动标签页，切换到其他标签页
                if (activeTabKey === targetKey) {
                  const lastTab = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                  const newActiveTab = lastTab ? lastTab.key : "";
                  setActiveTabKey(newActiveTab);
                }
              }}
              onOpenAgentChat={openAgentChat}
              onFileClose={(tabKey) => {
                const newTabs = chatTabs.filter(t => t.key !== tabKey);
                setChatTabs(newTabs);
              }}
            />
          </Splitter.Panel>

          {/* 右侧面板：Agents 和 MCP 管理 */}
          <Splitter.Panel
            size={panelSizes[1] || 25}
            min="20%"
            max="50%"
          >
            <WorkspaceRightPanel
              workspace={workspace}
              workspaceKey={workspaceKey}
              agents={details.agents || []}
              mcpClients={mcpClients}
              agentManagementRef={agentManagementRef}
              mcpManagementRef={mcpManagementRef}
              onRefreshAgents={async () => { await refreshWorkspaceDetails('agents'); }}
              onRefreshMCP={async () => { await refreshWorkspaceDetails('mcp'); }}
              onOpenChat={openAgentChat}
            />
          </Splitter.Panel>
        </Splitter>
      </div>
    );
  };


  return (
    <div className="workspace-page h-full">
      <div className="h-full">
        <div style={{ height: '100%', padding: '0px' }}>
          <Tabs
            className="myFullTabs"
            type="editable-card"
            activeKey={activeWorkspaceKey}
            onChange={handleTabChange}
            onEdit={(_, action) => {
              if (action === 'add') {
                // 点击Switch按钮时打开工作区切换模态框
                setOpenModalOpen(true);
              }
            }}
            style={{ height: '100%' }}
            tabBarStyle={{
              marginBottom: 8,
              padding: '0 8px'
            }}
            tabBarGutter={16} // 增加标签页间距
            centered={true} // 使用Ant Design内置的居中属性
            tabBarExtraContent={{
              left: <AppHeader />,
              right: (
                <AppActions
                  onAIProviderClick={() => setDrawerStates(prev => ({ ...prev, modelConfig: true }))}
                  onRefresh={refresh}
                  onAppSettingsClick={handleAppSettings}
                  onMCPGatewaysClick={handleMCPGateways}
                />
              )
            }}
            items={getTabItems().map(item => ({
              ...item,
              children: renderWorkspaceContent(item.key)
            }))}
            addIcon={
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <SwapOutlined />
                <span style={{ fontSize: '12px' }}>{t`Switch`}</span>
              </div>
            }
          />
        </div>
      </div>

      {/* 工作区切换模态框 */}
      <WorkspaceOpenModal
        open={openModalOpen}
        onCreate={openWorkspace}
        onCancel={() => {
          setOpenModalOpen(false);
          form.resetFields();
          setSelectedPath("");
        }}
        selectedPath={selectedPath}
        onDirectoryBrowserOpen={() => setDirectoryBrowserOpen(true)}
        globalWorkspacePath={globalWorkspacePath}
        workspaceHistory={workspaceHistory}
        onPathSelect={setSelectedPath}
        onHistoryRemove={(path) => {
          removeFromWorkspaceHistory(path);
          setWorkspaceHistory(getWorkspaceHistory());
        }}
        switching={switchingWorkspace}
      />


      {/* 确认创建工作区模态框 */}
      <Modal
        title={t`Create New Workspace`}
        open={confirmCreateModalOpen}
        onCancel={() => {
          setConfirmCreateModalOpen(false);
          setPendingWorkspacePath("");
        }}
        onOk={confirmCreateWorkspace}
        okText={t`Create & Switch`}
        cancelText={t`Cancel`}
        confirmLoading={switchingWorkspace}
      >
        <p>{t`The selected folder is not a workspace. Do you want to create a new workspace here and switch to it?`}</p>
        <p><strong>{t`Path`}:</strong> {pendingWorkspacePath}</p>
      </Modal>



      {/* 服务器目录浏览器 */}
      <ServerDirectoryBrowser
        visible={directoryBrowserOpen}
        onClose={() => setDirectoryBrowserOpen(false)}
        onSelect={handleServerDirectorySelect}
        title={t`Select Workspace Directory`}
        initialPath="~"
      />

      {/* 应用设置抽屉 */}
      <Drawer
        width={800}
        title={t`Application Settings`}
        open={drawerStates.appSettings}
        onClose={() => {
          setDrawerStates(prev => ({ ...prev, appSettings: false }));
          setAppSettings(null);
        }}
      >
        {appSettings && (
          <AppSettings
            settings={appSettings}
            onUpdate={updateAppSettings}
            onReset={async () => {
              try {
                const resetSettings = await call("resetAppSettings");
                setAppSettings(resetSettings);
              } catch (error) {
                console.error("Failed to reset app settings:", error);
                message.error(t`Failed to reset app settings`);
              }
            }}
          />
        )}
      </Drawer>


      {/* AI 提供商设置抽屉 */}
      <Drawer
        width={1000}
        title={t`AI Provider Settings`}
        open={drawerStates.modelConfig}
        onClose={() => {
          setDrawerStates(prev => ({ ...prev, modelConfig: false }));
        }}
        styles={{
          body: {
            padding: 0,
          }
        }}
      >
        <ProviderSettings />
      </Drawer>

      {/* MCP Gateways 设置抽屉 */}
      <Drawer
        width={800}
        title={t`MCP Gateways Settings`}
        open={drawerStates.mcpGateways}
        onClose={() => {
          setDrawerStates(prev => ({ ...prev, mcpGateways: false }));
          setAppSettings(null);
        }}
      >
        {appSettings && (
          <MCPGatewaysSettings
            gateways={(appSettings.mcpGateWays?.filter(gateway =>
              gateway.name && typeof gateway.name === 'string'
            ) || []) as Array<{
              name: string;
              description?: string;
              allowMCPs: string[];
            }>}
            onUpdate={updateMCPGateways}
            availableMCPs={getAvailableMCPs()}
            mcpClients={Object.values(currentWorkspaceDetails?.mcpClients || {})}
          />
        )}
      </Drawer>

    </div>
  );
}