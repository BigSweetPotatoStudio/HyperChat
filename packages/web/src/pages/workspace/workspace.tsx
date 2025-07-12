import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
  Empty,
  Badge,
  Typography,
  Splitter,
  Spin,
  Drawer,
  Descriptions,
  Dropdown,
  Divider,
} from "antd";
import {
  FolderOpenOutlined,
  PlusOutlined,
  DeleteOutlined,
  SettingOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  SwapOutlined, // 新增切换图标
  StopOutlined,
  InfoCircleOutlined,
  MoreOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  CloseOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { call, msg_receive, callElectron } from "../../common/call";
import { useForceUpdate } from "../../hooks/useForceUpdate";
import { t } from "../../i18n";
import { useNavigate } from "react-router-dom";
import { ServerDirectoryBrowser } from "../../components/ServerDirectoryBrowser";
import { getClients } from "../../common/mcp";
import { MCPManagement, MCPManagementRef } from "../../components/MCPManagement";
import { AgentManagement, AgentManagementRef } from "../../components/AgentManagement";
import { FileTreeComponent } from "../../components/FileTreeComponent";
import { WorkspaceSidebar } from "../../components/WorkspaceSidebar";
import { WorkspaceChat } from "../../components/WorkspaceChat";
import { WorkspaceWelcome } from "../../components/WorkspaceWelcome";
import { getPanelSizes, savePanelSizes, getWorkspaceHistory, addToWorkspaceHistory, removeFromWorkspaceHistory, addAgentRecentUsage } from "../../utils/storage";
import { AgentConfig, IMCPClient, MessageData, MessageDataMap } from "@hyperchat/shared/types";
import { HeaderContext } from "../../common/context";
import { ProviderSettings } from "../../components/ProviderSettings";
import { AppHeader } from "../../components/AppHeader";
import { AppActions } from "../../components/AppActions";

import { FileEditor } from "../../components/FileEditor";
import { Icon } from "@/src/components/icon";
import { WorkspaceSettings } from "../../components/WorkspaceSettings";
import { AppSettings } from "../../components/AppSettings";
import { MCPGatewaysSettings } from "../../components/MCPGatewaysSettings";

const { Title, Text } = Typography;

interface WorkspaceConfig {
  name: string;
  description?: string;
  created: number;
  lastAccessed: number;
  settings: {
  };
  agentsCount?: number;
  mcpServersCount?: number;
}

export interface WorkspaceInfo extends WorkspaceConfig {
  path: string;
  agentsCount: number;
  mcpServersCount: number;
  isGlobal: boolean;
  isActive?: boolean; // 前端活动状态：工作区在标签页列表中（可见/隐藏）
  isCurrent?: boolean; // 是否为当前工作区
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
  size?: number;
  modified: number;
  extension?: string;
  isLeaf?: boolean;
  loaded?: boolean;
  isHidden?: boolean;
}

interface ChatTab {
  key: string;
  title: string;
  type: 'chat' | 'file' | 'welcome';
  agentKey?: string;
  agentName?: string;
  filePath?: string;
  fileName?: string;
  workspacePath: string;
  closable?: boolean;
  chatLogToLoad?: any; // 要加载的聊天记录
}

export type WorkspaceDetails = {
  [key: string]: {
    fileTreeData?: FileNode[];
    agents: {
      config: AgentConfig;
      chatLogsCount: number;
      lastChatTime?: number;
    }[];
    mcpClients: Record<string, IMCPClient>;
  }
};

export function Workspace() {
  const refresh = useForceUpdate();
  const headerContext = useContext(HeaderContext);
  const navigate = useNavigate();

  // 只从context获取真正需要在Layout中管理的状态


  // 本地状态管理 - 直接使用从 Layout 传递的状态
  const [localIsModelConfigOpen, setLocalIsModelConfigOpen] = useState(false);

  // 组合的刷新函数


  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<string>("");

  // 新架构：只需要当前工作区信息
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceInfo | null>(null);
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetails>({});

  const [loading, setLoading] = useState(false);
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [confirmCreateModalOpen, setConfirmCreateModalOpen] = useState(false);
  const [closeConfirmModalOpen, setCloseConfirmModalOpen] = useState(false);
  const [pendingWorkspacePath, setPendingWorkspacePath] = useState<string>("");
  const [pendingCloseWorkspace, setPendingCloseWorkspace] = useState<WorkspaceInfo | null>(null);
  // 移除了 runningWorkspaces 状态 - 新架构下没有运行工作区概念
  const [directoryBrowserOpen, setDirectoryBrowserOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [showHiddenFiles, setShowHiddenFiles] = useState(true);
  const [workspaceHistory, setWorkspaceHistory] = useState(() => getWorkspaceHistory());
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [currentSettingsWorkspace, setCurrentSettingsWorkspace] = useState<WorkspaceInfo | null>(null);
  const [workspaceSettings, setWorkspaceSettings] = useState<any>(null);
  const [appSettingsDrawerOpen, setAppSettingsDrawerOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<any>(null);
  const [mcpGatewaysDrawerOpen, setMCPGatewaysDrawerOpen] = useState(false);
  const [globalWorkspacePath, setGlobalWorkspacePath] = useState<string>('unknown'); // 全局工作区路径
  const [form] = Form.useForm();
  // 为每个工作区维护独立的标签页状态
  const [workspaceTabsMap, setWorkspaceTabsMap] = useState<Record<string, ChatTab[]>>({});
  const [workspaceActiveTabMap, setWorkspaceActiveTabMap] = useState<Record<string, string>>({});

  // 存储各个工作区的 AgentManagement ref
  const agentManagementRefs = useRef<Record<string, AgentManagementRef | null>>({});

  // 存储各个工作区的 MCPManagement ref
  const mcpManagementRefs = useRef<Record<string, MCPManagementRef | null>>({});


  // 面板尺寸状态 - 使用数组格式，与Ant Design Splitter兼容
  const [panelSizes, setPanelSizes] = useState<any[]>(() => {
    // 初始化时使用默认工作区的尺寸，先用默认值
    const sizes = { left: '25%', middle: '50%', right: '25%' };
    return [sizes.left, sizes.middle, sizes.right];
  });

  // 监听MCP客户端状态变化
  useEffect(() => {
    // 监听传统的 MCP 变化消息（兼容性）
    const unsubscribeChangeMcp = msg_receive("message-from-main", (res: MessageData) => {
      if (res.type === "changeMcpClient") {
        const payload = res.data as MessageDataMap["changeMcpClient"];

        // 更新工作区详情中的MCP客户端数据
        setWorkspaceDetails(prev => {
          const newDetails = { ...prev };

          // 更新指定工作区的 MCP 客户端数据
          const details = newDetails[payload.workspacePath]
          if (details && details.mcpClients) {
            if (payload.status === "deleted") {
              // 删除客户端
              delete details.mcpClients[payload.serverName];
            } else {
              // 添加或更新客户端
              details.mcpClients[payload.serverName] = payload;
            }
          }

          return newDetails;
        });
      }
    });

    // 返回清理函数
    return () => {
      if (unsubscribeChangeMcp) unsubscribeChangeMcp();
    };
  }, []);

  // 加载当前工作区（新架构：只需要当前工作区）
  const loadCurrentWorkspace = async () => {
    try {
      setLoading(true);

      // 只需要获取当前工作区信息
      const currentWorkspaceData = await call("getCurrentWorkspace");
      if (currentWorkspaceData) {
        console.log("Current workspace:", currentWorkspaceData);

        // 创建当前工作区信息
        const currentWorkspaceInfo: WorkspaceInfo = {
          path: currentWorkspaceData.path || '',
          name: currentWorkspaceData.name || 'Workspace',
          description: currentWorkspaceData.description,
          created: currentWorkspaceData.created || Date.now(),
          lastAccessed: currentWorkspaceData.lastAccessed || Date.now(),
          settings: currentWorkspaceData.settings || {},
          agentsCount: currentWorkspaceData.agentsCount || 0,
          mcpServersCount: currentWorkspaceData.mcpServersCount || 0,
          isGlobal: currentWorkspaceData.isGlobal || currentWorkspaceData.path?.includes('Documents/HyperChat') || false,
          isActive: true, // 当前工作区总是激活的
          isCurrent: true, // 这就是当前工作区
        };

        // 设置当前工作区
        setCurrentWorkspace(currentWorkspaceInfo);
        setActiveWorkspaceKey(currentWorkspaceInfo.path);
      }
    } catch (error) {
      console.error("Failed to load current workspace:", error);
      message.error(t`Failed to load workspace`);
    } finally {
      setLoading(false);
    }
  };

  // 加载当前工作区详细信息
  const loadWorkspaceDetails = async (workspace: WorkspaceInfo) => {
    const key = workspace.path;

    // 如果已经加载过，直接返回
    if (workspaceDetails[key]) return;

    try {
      const details: any = { agents: [], mcpClients: {} };

      // 加载根目录文件列表（懒加载）
      console.log("Loading file tree for workspace:", workspace.path, "isGlobal:", workspace.isGlobal);
      const rootItems = await call("getWorkspaceDirectoryList", {
        directoryPath: ""
      });
      console.log("File tree loaded:", rootItems?.length, "items");
      details.fileTreeData = rootItems;

      // 加载 Agents（获取摘要信息）
      const agentList = await call("getWorkspaceAgentsSummary");
      details.agents = agentList;

      // 加载 MCP 客户端
      let mcpList = await call("getWorkspaceMcpClients");

      // 将数组转换为对象格式，使用 name 作为 key
      const mcpClients: Record<string, IMCPClient> = {};
      if (mcpList && Array.isArray(mcpList)) {
        mcpList.forEach((client) => {
          if (client && client.serverName) {
            mcpClients[client.serverName] = client;
          }
        });
      }
      details.mcpClients = mcpClients;

      setWorkspaceDetails(prev => ({
        ...prev,
        [key]: details
      }));
    } catch (error) {
      console.error("Failed to load workspace details:", error);
      message.error(t`Failed to load workspace details`);
    }
  };

  // 打开工作区
  const openWorkspace = async (values: { path: string }) => {
    try {


      // if (workspaceConfig) {
      // 工作区已存在，切换到该工作区
      await switchToWorkspace(values.path);

      // 添加到历史记录
      const folderName = values.path.split(/[/\\]/).pop() || 'Workspace';
      addToWorkspaceHistory(values.path, folderName);
      setWorkspaceHistory(getWorkspaceHistory());

      // 重新加载以更新当前工作区标记
      await loadCurrentWorkspace();

      message.success(t`Workspace opened successfully`);
      setOpenModalOpen(false);
      form.resetFields();
      setSelectedPath("");
      // } else {
      //   // 工作区不存在，提示用户是否创建
      //   setPendingWorkspacePath(values.path);
      //   setOpenModalOpen(false);
      //   setConfirmCreateModalOpen(true);
      // }
    } catch (error) {
      console.error("Failed to open workspace:", error);
      message.error(t`Failed to open workspace`);
    }
  };

  // 切换工作区（新架构：简化为只需要切换当前工作区）
  const switchToWorkspace = async (workspacePath: string) => {
    try {
      // 使用switchWorkspace API切换工作区
      await call("switchWorkspace", { workspacePath });

      // 关闭对话框
      setOpenModalOpen(false);

      // 重新加载当前工作区信息
      await loadCurrentWorkspace();

      message.success(t`Switched to workspace`);
    } catch (error) {
      
      console.error("Failed to switch to workspace:", error);
      message.error(t`Failed to switch to workspace`);
    }
  };

  // 创建工作区
  const createWorkspace = async (workspacePath: string) => {
    try {
      // 从路径提取文件夹名称作为工作区名称
      const folderName = workspacePath.split(/[/\\]/).pop() || 'Workspace';

      await call("createWorkspace", {
        workspacePath: workspacePath,
        name: folderName,
      });

      // 添加到历史记录
      addToWorkspaceHistory(workspacePath, folderName);
      setWorkspaceHistory(getWorkspaceHistory());

      message.success(t`Workspace created and switched successfully`);
      await loadCurrentWorkspace();
    } catch (error) {
      console.error("Failed to create workspace:", error);
      message.error(t`Failed to create workspace`);
    }
  };

  // 确认创建工作区
  const confirmCreateWorkspace = async () => {
    try {
      await createWorkspace(pendingWorkspacePath);

      // 切换到新创建的工作区
      await switchToWorkspace(pendingWorkspacePath);

      // 重新加载工作区列表
      await loadCurrentWorkspace();

      setConfirmCreateModalOpen(false);
      setPendingWorkspacePath("");
    } catch (error) {
      console.error("Failed to confirm create workspace:", error);
    }
  };

  // 创建工作区后的初始化操作（新架构下不需要显式启动MCP）
  // 移除了 startWorkspaceMcpClients 函数 - 新架构下工作区自动管理MCP服务

  // 显示关闭确认对话框
  const showCloseConfirm = (workspace: WorkspaceInfo) => {
    setPendingCloseWorkspace(workspace);
    setCloseConfirmModalOpen(true);
  };

  // 处理工作区设置
  const handleWorkspaceSettings = async (workspace: WorkspaceInfo) => {
    try {
      setCurrentSettingsWorkspace(workspace);
      // 加载工作区设置
      const settings = await call("getWorkspaceSettings", { workspacePath: workspace.path });
      setWorkspaceSettings(settings);
      setSettingsDrawerOpen(true);
    } catch (error) {
      console.error("Failed to load workspace settings:", error);
      message.error(t`Failed to load workspace settings`);
    }
  };

  // 更新工作区设置
  const updateWorkspaceSettings = async (updates: any) => {
    if (!currentSettingsWorkspace) return;

    try {
      const updatedSettings = await call("updateWorkspaceSettings", {
        workspacePath: currentSettingsWorkspace.path,
        updates
      });
      setWorkspaceSettings(updatedSettings);
      message.success(t`Settings updated successfully`);

      // 如果更改了主题设置，应用到界面
      if (updates.appearance?.isDarkMode !== undefined) {
        const darkReader = await import('darkreader');
        if (updates.appearance.isDarkMode) {
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
      console.error("Failed to update workspace settings:", error);
      message.error(t`Failed to update workspace settings`);
    }
  };

  // 处理应用设置
  const handleAppSettings = async () => {
    try {
      // 加载应用设置
      const settings = await call("getAppSettings");
      setAppSettings(settings);
      setAppSettingsDrawerOpen(true);
    } catch (error) {
      console.error("Failed to load app settings:", error);
      message.error(t`Failed to load app settings`);
    }
  };

  // 更新应用设置
  const updateAppSettings = async (updates: any) => {
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
      console.error("Failed to update app settings:", error);
      message.error(t`Failed to update app settings`);
    }
  };

  // 处理 MCP Gateways 设置
  const handleMCPGateways = async () => {
    try {
      // 加载应用设置以获取当前的 MCP Gateways 配置
      const settings = await call("getAppSettings");
      setAppSettings(settings);
      setMCPGatewaysDrawerOpen(true);
    } catch (error) {
      console.error("Failed to load MCP gateways:", error);
      message.error(t`Failed to load MCP gateways`);
    }
  };

  // 获取可用的 MCP 服务列表
  const getAvailableMCPs = () => {
    const currentWorkspace = getCurrentWorkspace();
    const details = workspaceDetails[currentWorkspace?.path || ''] || { mcpClients: {} };
    const globalDetails = getGlobalDetails();

    // 合并全局和当前工作区的 MCP 客户端
    const allMcpClients = Object.values(Object.assign({}, globalDetails.mcpClients, details.mcpClients));

    // 提取所有可用的 MCP 服务名称
    const availableMCPs = new Set<string>();
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
  const updateMCPGateways = async (gateways: any[]) => {
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
      console.error("Failed to update MCP gateways:", error);
      message.error(t`Failed to update MCP gateways`);
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
      console.error("Failed to process selected directory:", error);
      message.error(t`Failed to process selected directory`);
    }
  };

  // 刷新工作区详情
  const refreshWorkspaceDetails = async (workspaceKey?: string, refreshType?: 'agents' | 'mcp' | 'all') => {
    const key = workspaceKey || activeWorkspaceKey;
    const workspace = currentWorkspace;
    const type = refreshType || 'all';

    if (workspace) {
      try {
        let agentList: any[] | undefined;
        let mcpClients: Record<string, IMCPClient> | undefined;

        // 根据刷新类型选择性刷新数据
        if (type === 'agents' || type === 'all') {
          // 刷新 Agents
          agentList = await call("getWorkspaceAgentsSummary");
        }

        if (type === 'mcp' || type === 'all') {
          // 刷新 MCP 客户端
          const mcpList = await call("getWorkspaceMcpClients");

          // 将数组转换为对象格式
          mcpClients = {};
          if (mcpList && Array.isArray(mcpList)) {
            mcpList.forEach((client) => {
              if (client && client.serverName) {
                mcpClients![client.serverName] = client;
              }
            });
          }
        }

        // 更新工作区详情数据
        setWorkspaceDetails(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            ...(agentList !== undefined && { agents: agentList }),
            ...(mcpClients !== undefined && { mcpClients: mcpClients })
          }
        }) as any);
      } catch (error) {
        console.error("Failed to refresh workspace details:", error);
        throw error;
      }
    }
  };

  // 刷新文件树
  const refreshFileTree = async () => {
    const currentWorkspace = getCurrentWorkspace();
    if (currentWorkspace) {
      const key = currentWorkspace.path;

      try {
        // 重新加载文件树数据
        const rootItems = await call("getWorkspaceDirectoryList", {
          workspacePath: currentWorkspace.path,
          directoryPath: ""
        });

        // 更新工作区详情中的文件树数据
        setWorkspaceDetails(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            fileTreeData: rootItems,
            agents: prev[key]?.agents ?? [],
            mcpClients: prev[key]?.mcpClients ?? {}
          }
        }));
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

  // 处理面板尺寸变化
  const handlePanelSizeChange = (sizes: any[]) => {
    const currentWorkspace = getCurrentWorkspace();
    if (currentWorkspace && sizes.length >= 3) {
      // 直接更新状态数组
      setPanelSizes(sizes);

      // 构建保存到localStorage的对象格式
      const sizesToSave = {
        left: sizes[0],
        middle: sizes[1],
        right: sizes[2]
      };

      // 保存到localStorage（使用防抖，避免频繁保存）
      const workspaceKey = currentWorkspace.path;
      clearTimeout((handlePanelSizeChange as any).timeoutId);
      (handlePanelSizeChange as any).timeoutId = setTimeout(() => {
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
      // 加载当前工作区的面板尺寸
      const workspaceKey = workspace.path;
      const sizes = getPanelSizes(workspaceKey);
      setPanelSizes([sizes.left, sizes.middle, sizes.right]);
      // 初始化默认聊天标签页
      initDefaultChatTab(workspace);
    }
  }, [activeWorkspaceKey]);

  // 获取当前活动工作区（新架构：直接返回当前工作区）
  const getCurrentWorkspace = () => {
    return currentWorkspace;
  };

  // 获取当前工作区详情
  const getCurrentDetails = () => {
    return workspaceDetails[activeWorkspaceKey] || { agents: [], mcpClients: {} };
  };

  // 获取当前工作区详情
  const getGlobalDetails = () => {
    if (!currentWorkspace?.path) {
      return { agents: [], mcpClients: {} };
    }
    return workspaceDetails[currentWorkspace.path] || { agents: [], mcpClients: {} };
  };

  // 处理标签页切换（新架构下移除，只有一个工作区）
  const handleTabChange = async (key: string) => {
    // 新架构下只有一个工作区，这个函数保留以防UI组件调用
    console.warn('handleTabChange called in new architecture, key:', key);
  };

  // 打开Agent聊天
  const openAgentChat = (workspaceKey: string, agent: any, chatLog?: any) => {
    const workspace = currentWorkspace;
    if (!workspace) return;

    // 记录 agent 使用
    addAgentRecentUsage(workspace.path, agent.config.key, agent.config.name || agent.config.key);

    // 如果有聊天记录，使用聊天记录的key确保唯一性
    const tabKey = chatLog ? `${workspace.path}-${agent.config.key}-${chatLog.key}` : `${workspace.path}-${agent.config.key}`;
    const currentTabs = workspaceTabsMap[workspaceKey] || [];
    const existingTab = currentTabs.find(tab => tab.key === tabKey);

    if (existingTab) {
      // 如果已存在，切换到该标签页
      setWorkspaceActiveTabMap(prev => ({
        ...prev,
        [workspaceKey]: tabKey
      }));
    } else {
      // 创建新的聊天标签页
      const tabTitle = chatLog ? `${agent.config.name || agent.config.key} - ${chatLog.label || chatLog.key}` : agent.config.name || agent.config.key;
      const newTab: ChatTab = {
        key: tabKey,
        title: tabTitle,
        type: 'chat',
        agentKey: agent.config.key,
        agentName: agent.config.name || agent.config.key,
        workspacePath: workspace.path,
        closable: true,
        chatLogToLoad: chatLog, // 传递聊天记录数据
      };
      setWorkspaceTabsMap(prev => ({
        ...prev,
        [workspaceKey]: [...currentTabs, newTab]
      }));
      setWorkspaceActiveTabMap(prev => ({
        ...prev,
        [workspaceKey]: tabKey
      }));
    }
  };

  // 打开文件编辑器
  const openFileEditor = (filePath: string, fileName: string) => {
    const currentWorkspace = getCurrentWorkspace();
    if (!currentWorkspace) return;

    const tabKey = `${currentWorkspace.path}-file-${filePath}`;
    const currentTabs = workspaceTabsMap[currentWorkspace.path] || [];
    const existingTab = currentTabs.find(tab => tab.key === tabKey);

    if (existingTab) {
      // 如果已存在，切换到该标签页
      setWorkspaceActiveTabMap(prev => ({
        ...prev,
        [currentWorkspace.path]: tabKey
      }));
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
      setWorkspaceTabsMap(prev => ({
        ...prev,
        [currentWorkspace.path]: [...currentTabs, newTab]
      }));
      setWorkspaceActiveTabMap(prev => ({
        ...prev,
        [currentWorkspace.path]: tabKey
      }));
    }
  };


  // 初始化默认欢迎标签页
  const initDefaultChatTab = (workspace: WorkspaceInfo) => {
    const defaultTabKey = `${workspace.path}-welcome`;
    const currentTabs = workspaceTabsMap[workspace.path] || [];
    const hasDefaultTab = currentTabs.some(tab => tab.key === defaultTabKey);

    if (!hasDefaultTab) {
      const defaultTab: ChatTab = {
        key: defaultTabKey,
        title: t`Welcome`,
        type: 'welcome',
        workspacePath: workspace.path,
        closable: false,
      };
      setWorkspaceTabsMap(prev => ({
        ...prev,
        [workspace.path]: [defaultTab, ...currentTabs]
      }));
      if (!workspaceActiveTabMap[workspace.path]) {
        setWorkspaceActiveTabMap(prev => ({
          ...prev,
          [workspace.path]: defaultTabKey
        }));
      }
    }
  };

  // 获取当前工作区（新架构：只有一个当前工作区）
  const getCurrentWorkspaceForDisplay = () => {
    return currentWorkspace ? [currentWorkspace] : [];
  };

  // 生成标签页items（新架构：只显示当前工作区）
  const getTabItems = () => {
    const items: any[] = [];
    const workspaceList = getCurrentWorkspaceForDisplay();

    workspaceList.forEach(workspace => {
      const isGlobal = workspace.isGlobal;

      items.push({
        key: workspace.path,
        label: (
          <Space>
            {isGlobal ? <GlobalOutlined /> : <FolderOpenOutlined />}
            <div style={{ textAlign: 'left' }}>
              <div>{workspace.name || (isGlobal ? t`Global Workspace` : workspace.name)}</div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>
                {workspace.path}
              </div>
            </div>
            {isGlobal ? (
              <Space>
                <Tag color="blue">{t`Global`}</Tag>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'settings',
                        label: t`Workspace Settings`,
                        icon: <SettingOutlined />,
                        onClick: () => {
                          handleWorkspaceSettings(workspace);
                        }
                      }
                    ]
                  }}
                  trigger={['click']}
                >
                  <Button type="text" size="small" icon={<SettingOutlined />} onClick={(e) => e.stopPropagation()} />
                </Dropdown>
              </Space>
            ) : (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'settings',
                      label: t`Workspace Settings`,
                      icon: <SettingOutlined />,
                      onClick: () => {
                        handleWorkspaceSettings(workspace);
                      }
                    },
                    {
                      key: 'switchToGlobal',
                      label: t`Switch to Global Workspace`,
                      icon: <GlobalOutlined />,
                      onClick: async () => {
                        if (globalWorkspacePath) {
                          await switchToWorkspace(globalWorkspacePath);
                        }
                      }
                    },
                    {
                      type: 'divider',
                    },
                  ]
                }}
                trigger={['click']}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
              </Dropdown>
            )}
          </Space>
        ),
        closable: !isGlobal, // 全局工作区不可关闭
      });
    });

    return items;
  };

  // 渲染工作区内容
  const renderWorkspaceContent = (workspaceKey: string) => {
    const workspace = currentWorkspace;
    const details = workspaceDetails[workspaceKey] || { agents: [], mcpClients: {} };
    const globalDetails = getGlobalDetails();

    if (!workspace) {
      return (
        <Empty
          description={t`Please select a workspace to view details`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    // 普通工作区可以使用全局MCP客户端
    const mcpClients = Object.values(Object.assign({}, globalDetails.mcpClients, details.mcpClients)).sort((a, b) => a.order - b.order);
    return (
      <div className="h-full">
        <Splitter
          style={{ height: '100%' }}
          onResize={handlePanelSizeChange}
        >
          {/* 左侧面板：工作区侧边栏 */}
          <Splitter.Panel
            size={panelSizes[0] || "25%"}
            min="15%"
            max="40%"
          >
            <WorkspaceSidebar
              workspace={workspace}
              fileTreeData={details.fileTreeData}
              showHidden={showHiddenFiles}
              onShowHiddenChange={handleShowHiddenChange}
              onRefreshFileTree={refreshFileTree}
              onFileSelect={openFileEditor}
            />
          </Splitter.Panel>

          {/* 中间面板：聊天界面 */}
          <Splitter.Panel
            size={panelSizes[1] || "50%"}
            min="30%"
          >
            <Card
              title={null}
              size="small"
              className="h-full"
              styles={{ body: { padding: '0', height: '100%', overflow: 'hidden' } }}
            >
              {workspaceTabsMap[workspaceKey]?.length && workspaceTabsMap[workspaceKey]?.length > 0 ? (
                <Tabs
                  className="myFullTabs"
                  type="editable-card"
                  activeKey={workspaceActiveTabMap[workspaceKey] || ""}
                  onChange={(tabKey) => {
                    setWorkspaceActiveTabMap(prev => ({
                      ...prev,
                      [workspaceKey]: tabKey
                    }));
                  }}
                  onEdit={(targetKey, action) => {
                    if (action === 'remove' && typeof targetKey === 'string') {
                      const tabs = workspaceTabsMap[workspaceKey] || [];
                      const newTabs = tabs.filter(tab => tab.key !== targetKey);
                      setWorkspaceTabsMap(prev => ({
                        ...prev,
                        [workspaceKey]: newTabs
                      }));

                      // 如果关闭的是当前活动标签页，切换到其他标签页
                      if (workspaceActiveTabMap[workspaceKey] === targetKey) {
                        const lastTab = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
                        const newActiveTab = lastTab ? lastTab.key : "";
                        setWorkspaceActiveTabMap(prev => ({
                          ...prev,
                          [workspaceKey]: newActiveTab
                        }));
                      }
                    }
                  }}
                  hideAdd
                  size="small"
                  tabBarStyle={{ marginBottom: 0, padding: '0 8px' }}
                  items={(workspaceTabsMap[workspaceKey] || []).map(tab => ({
                    key: tab.key,
                    label: (
                      <Space size="small">
                        {tab.type === 'file' ? (
                          <FileTextOutlined />
                        ) : tab.type === 'welcome' ? (
                          <Icon name="bx-bot" />
                        ) : tab.agentKey ? (
                          <MessageOutlined />
                        ) : (
                          <GlobalOutlined />
                        )}
                        <span>{tab.title}</span>
                      </Space>
                    ),
                    closable: tab.closable,
                    children: (
                      <div style={{ height: '100%', overflow: 'hidden' }}>
                        {tab.type === 'file' && tab.filePath && tab.fileName ? (
                          <FileEditor
                            filePath={tab.filePath}
                            workspacePath={tab.workspacePath}
                            fileName={tab.fileName}
                            onClose={() => {
                              const tabs = workspaceTabsMap[workspaceKey] || [];
                              const newTabs = tabs.filter(t => t.key !== tab.key);
                              setWorkspaceTabsMap(prev => ({
                                ...prev,
                                [workspaceKey]: newTabs
                              }));
                            }}
                          />
                        ) : tab.type === 'welcome' ? (
                          <WorkspaceWelcome
                            workspace={workspace}
                            agents={details.agents || []}
                            onOpenAgentChat={(agent, chatLog) => openAgentChat(workspaceKey, agent, chatLog)}
                            onCreateAgent={() => {
                              // 调用对应工作区的创建Agent函数
                              const agentManagementRef = agentManagementRefs.current[workspaceKey];
                              if (agentManagementRef) {
                                agentManagementRef.createAgent();
                              } else {
                                console.warn('AgentManagement ref not available for workspace:', workspaceKey);
                              }
                            }}
                          />
                        ) : (
                          <WorkspaceChat
                            workspace={workspace}
                            agentKey={tab.agentKey}
                            workspaceDetails={workspaceDetails}
                            key={tab.key}
                            mcpClients={mcpClients}
                            chatLogToLoad={tab.chatLogToLoad}
                          />
                        )}
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Empty description={t`No chat tabs open`} />
                </div>
              )}
            </Card>
          </Splitter.Panel>

          {/* 右侧面板：Agents 和 MCP 管理 */}
          <Splitter.Panel
            size={panelSizes[2] || "25%"}
            min="15%"
            max="40%"
          >
            <Card
              title={t`Management Panel`}
              size="small"
              // className="h-full"
              styles={{ body: { padding: 0 } }}
            >
              <Tabs
                className="myTabBodyFull"
                animated={true}
                tabBarStyle={{ marginBottom: 0, padding: '0 8px' }}
                size="small"
                items={[
                  {
                    label: (
                      <Space>
                        <Icon name="bx-bot"></Icon>
                        {t`Agents`}
                        <Tag>{details.agents?.length || 0}</Tag>
                      </Space>
                    ),
                    key: "agents",
                    children: workspace ? (
                      <AgentManagement
                        ref={(ref) => {
                          agentManagementRefs.current[workspaceKey] = ref;
                        }}
                        workspace={workspace}
                        agents={details.agents || []}
                        onRefresh={() => refreshWorkspaceDetails(workspaceKey, 'agents')}
                        onOpenChat={(agent: any, chatLog?: any) => openAgentChat(workspaceKey, agent, chatLog)}
                        mcpClients={mcpClients}
                      />
                    ) : <Empty description={t`No workspace selected`} />,
                  },
                  {
                    label: (
                      <Space>
                        <Icon name="mcp"></Icon>
                        {t`MCP`}
                        <Tag color="green">{mcpClients.filter(x => x.status == "connected").length}</Tag>
                      </Space>
                    ),
                    key: "mcp",
                    children: workspace ? (
                      <MCPManagement
                        ref={(ref) => {
                          mcpManagementRefs.current[workspaceKey] = ref;
                        }}
                        workspace={workspace}
                        mcpClients={mcpClients}
                        onRefresh={() => refreshWorkspaceDetails(workspaceKey, 'mcp')}
                      />
                    ) : <Empty description={t`No workspace selected`} />,
                  },
                ]}
              />
            </Card>
          </Splitter.Panel>
        </Splitter>
      </div>
    );
  };

  // 处理工作区切换和关闭
  const handleTabEdit = (targetKey: string | React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>, action: 'add' | 'remove') => {
    if (action === 'add') {
      // 显示工作区切换对话框
      setOpenModalOpen(true);
    } else if (action === 'remove') {
      // 确保 targetKey 是字符串类型
      if (typeof targetKey === 'string') {
        const workspace = currentWorkspace;
        if (workspace && !workspace.isGlobal) {
          // 显示关闭确认对话框
          showCloseConfirm(workspace);
        }
      }
    }
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
            onEdit={handleTabEdit}
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
                  onAIProviderClick={() => setLocalIsModelConfigOpen(true)}
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
      <Modal
        title={t`Switch Workspace`}
        open={openModalOpen}
        onCancel={() => {
          setOpenModalOpen(false);
          form.resetFields();
          setSelectedPath("");
        }}
        onOk={() => {
          form.submit();
        }}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={openWorkspace}
        >
          <Form.Item
            label={t`Folder Path`}
            name="path"
            rules={[{ required: true, message: t`Please select folder path` }]}
            extra={t`Choose a project folder to work with. If it's not a workspace, you can create one.`}
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input
                style={{ width: "calc(100% - 100px)" }}
                placeholder={t`Choose project folder...`}
                value={selectedPath || form.getFieldValue('path') || ''}
                readOnly
              />
              <Button
                icon={<FolderOpenOutlined />}
                onClick={() => setDirectoryBrowserOpen(true)}
              >
                {t`Select Directory`}
              </Button>
            </Space.Compact>
          </Form.Item>

          {/* 全局工作区快速选择 */}
          <Divider orientation="left">
            <Space>
              <GlobalOutlined />
              <span>{t`Global Workspace`}</span>
            </Space>
          </Divider>
          <Card
            size="small"
            style={{ marginBottom: 16, cursor: 'pointer' }}
            hoverable
            onClick={() => {
              if (globalWorkspacePath) {
                form.setFieldsValue({ path: globalWorkspacePath });
                setSelectedPath(globalWorkspacePath);
              }
            }}
          >
            <Card.Meta
              avatar={<GlobalOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
              title={
                <Space>
                  <span>{t`Global Workspace`}</span>
                  <Tag color="blue">{t`Default`}</Tag>
                </Space>
              }
              description={
                <div>
                  <Text type="secondary">{globalWorkspacePath}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {t`Contains global agents, MCP tools and configurations`}
                  </Text>
                </div>
              }
            />
          </Card>

          {/* 历史记录 */}
          {workspaceHistory.length > 0 && (
            <>
              <Divider orientation="left">
                <Space>
                  <HistoryOutlined />
                  <span>{t`Recent Workspaces`}</span>
                </Space>
              </Divider>
              <List
                size="small"
                dataSource={workspaceHistory}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '8px 0' }}
                    onClick={() => {
                      form.setFieldsValue({ path: item.path });
                      setSelectedPath(item.path);
                    }}
                    actions={[
                      <Button
                        key="remove"
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWorkspaceHistory(item.path);
                          setWorkspaceHistory(getWorkspaceHistory());
                        }}
                        title={t`Remove from history`}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FolderOpenOutlined />}
                      title={
                        <Space>
                          <span>{item.name}</span>
                          <Tag color="blue">
                            <ClockCircleOutlined />
                            {new Date(item.lastUsed).toLocaleDateString()}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {item.path}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}
        </Form>
      </Modal>


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
        open={appSettingsDrawerOpen}
        onClose={() => {
          setAppSettingsDrawerOpen(false);
          setAppSettings(null);
        }}
        destroyOnClose
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
            onExport={async () => {
              try {
                const settingsJson = await call("exportAppSettings");
                // 创建下载链接
                const blob = new Blob([settingsJson], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `hyperchat-app-settings.json`;
                a.click();
                URL.revokeObjectURL(url);
                message.success(t`App settings exported successfully`);
              } catch (error) {
                console.error("Failed to export app settings:", error);
                message.error(t`Failed to export app settings`);
              }
            }}
            onImport={async (settingsJson: string) => {
              try {
                const importedSettings = await call("importAppSettings", {
                  settingsJson
                });
                setAppSettings(importedSettings);
                message.success(t`App settings imported successfully`);
              } catch (error) {
                console.error("Failed to import app settings:", error);
                message.error(t`Failed to import app settings`);
              }
            }}
          />
        )}
      </Drawer>

      {/* 工作区设置抽屉 */}
      <Drawer
        width={800}
        title={currentSettingsWorkspace ? t`Workspace Settings` + ` - ${currentSettingsWorkspace.name}` : t`Workspace Settings`}
        open={settingsDrawerOpen}
        onClose={() => {
          setSettingsDrawerOpen(false);
          setCurrentSettingsWorkspace(null);
          setWorkspaceSettings(null);
        }}
        destroyOnClose
      >
        {workspaceSettings && (
          <WorkspaceSettings
            settings={workspaceSettings}
            onUpdate={updateWorkspaceSettings}
            onReset={async () => {
              if (!currentSettingsWorkspace) return;
              try {
                const resetSettings = await call("resetWorkspaceSettings", {
                  workspacePath: currentSettingsWorkspace.path
                });
                setWorkspaceSettings(resetSettings);
              } catch (error) {
                console.error("Failed to reset settings:", error);
                message.error(t`Failed to reset settings`);
              }
            }}
            onExport={async () => {
              if (!currentSettingsWorkspace) return;
              try {
                const settingsJson = await call("exportWorkspaceSettings", {
                  workspacePath: currentSettingsWorkspace.path
                });
                // 创建下载链接
                const blob = new Blob([settingsJson], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${currentSettingsWorkspace.name}-settings.json`;
                a.click();
                URL.revokeObjectURL(url);
                message.success(t`Settings exported successfully`);
              } catch (error) {
                console.error("Failed to export settings:", error);
                message.error(t`Failed to export settings`);
              }
            }}
            onImport={async (settingsJson: string) => {
              if (!currentSettingsWorkspace) return;
              try {
                const importedSettings = await call("importWorkspaceSettings", {
                  workspacePath: currentSettingsWorkspace.path,
                  settingsJson
                });
                setWorkspaceSettings(importedSettings);
                message.success(t`Settings imported successfully`);
              } catch (error) {
                console.error("Failed to import settings:", error);
                message.error(t`Failed to import settings`);
              }
            }}
          />
        )}
      </Drawer>

      {/* AI 提供商设置抽屉 */}
      <Drawer
        width={1000}
        title={t`AI Provider Settings`}
        open={localIsModelConfigOpen}
        onClose={() => {
          setLocalIsModelConfigOpen(false);
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
        open={mcpGatewaysDrawerOpen}
        onClose={() => {
          setMCPGatewaysDrawerOpen(false);
          setAppSettings(null);
        }}
        destroyOnClose
      >
        {appSettings && (
          <MCPGatewaysSettings
            gateways={appSettings.mcpGateWays || []}
            onUpdate={updateMCPGateways}
            availableMCPs={getAvailableMCPs()}
            mcpClients={Object.values(workspaceDetails[currentWorkspace?.path || '']?.mcpClients || {})}
          />
        )}
      </Drawer>

    </div>
  );
}