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
  PlayCircleOutlined,
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
    enableKnowledgeBase: boolean;
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
  isRunning?: boolean; // 后端活动状态：标记工作区是否在后台运行
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

  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [globalWorkspace, setGlobalWorkspace] = useState<WorkspaceInfo | null>(null);
  const [workspaceDetails, setWorkspaceDetails] = useState<WorkspaceDetails>({});

  const [loading, setLoading] = useState(false);
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [confirmCreateModalOpen, setConfirmCreateModalOpen] = useState(false);
  const [closeConfirmModalOpen, setCloseConfirmModalOpen] = useState(false);
  const [pendingWorkspacePath, setPendingWorkspacePath] = useState<string>("");
  const [pendingCloseWorkspace, setPendingCloseWorkspace] = useState<WorkspaceInfo | null>(null);
  const [runningWorkspaces, setRunningWorkspaces] = useState<Set<string>>(new Set());
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

  // 加载工作区列表
  const loadWorkspaces = async () => {
    try {
      setLoading(true);

      // 加载运行中的工作区列表
      let runningPaths = new Set<string>();
      try {
        const runningWorkspacesList = await call("getRunningWorkspaces");
        runningPaths = new Set(runningWorkspacesList.map((ws: any) => ws.path));
        setRunningWorkspaces(runningPaths);
        console.log("Loaded running workspaces:", Array.from(runningPaths));
      } catch (error) {
        console.warn("Failed to load running workspaces:", error);
      }

      // 加载全局工作区
      const globalWs = await call("getGlobalWorkspace");
      if (globalWs) {
        console.log("Global workspace path:", globalWs.path);
        const globalSummary = await call("getCurrentWorkspace", {
          workspacePath: globalWs.path
        });
        const globalWorkspaceInfo = {
          ...globalWs,
          agentsCount: 0,
          mcpServersCount: 0,
          isGlobal: true,
          isActive: true, // 全局工作区默认总是在前端显示
          isRunning: true, // 全局工作区默认总是在后台运行
          ...globalSummary,
        };
        setGlobalWorkspace(globalWorkspaceInfo);

        // 如果还没有选择工作区，默认选择全局工作区
        if (!activeWorkspaceKey) {
          setActiveWorkspaceKey(globalWs.path);
        }
      }

      // 加载项目工作区列表
      const workspaceList = await call("getWorkspaceList");
      const workspaceInfos: WorkspaceInfo[] = [];

      for (const ws of workspaceList) {
        try {
          // ws 现在已经包含了正确的 path 字段
          const summary = await call("getCurrentWorkspace", { workspacePath: ws.path });
          if (summary) {
            workspaceInfos.push({
              ...ws,
              agentsCount: summary.agentsCount || 0,
              mcpServersCount: summary.mcpServersCount || 0,
              isActive: false, // 默认不在前端显示
              isRunning: runningPaths.has(ws.path), // 使用本地变量而不是状态
              isGlobal: false, // 标记为项目工作区
            });
          }
        } catch (error) {
          // 工作区可能不存在或损坏，跳过
          console.warn(`Failed to load workspace ${ws.name}:`, error);
        }
      }

      setWorkspaces(workspaceInfos);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
      message.error(t`Failed to load workspaces`);
    } finally {
      setLoading(false);
    }
  };

  // 加载工作区详细信息
  const loadWorkspaceDetails = async (workspace: WorkspaceInfo) => {
    const key = workspace.path;

    // 如果已经加载过，直接返回
    if (workspaceDetails[key]) return;

    try {
      const details: any = { agents: [], mcpClients: {} };

      // 加载根目录文件列表（懒加载）
      console.log("Loading file tree for workspace:", workspace.path, "isGlobal:", workspace.isGlobal);
      const rootItems = await call("getWorkspaceDirectoryList", {
        workspacePath: workspace.path,
        directoryPath: ""
      });
      console.log("File tree loaded:", rootItems?.length, "items");
      details.fileTreeData = rootItems;

      // 加载 Agents（获取摘要信息）
      const agentList = await call("getWorkspaceAgentsSummary", { workspacePath: workspace.path });
      details.agents = agentList;

      // 加载 MCP 客户端
      let mcpList = await call("getWorkspaceMcpClients", { workspacePath: workspace.path });

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
      // 尝试打开已存在的工作区
      const workspaceConfig = await call("openWorkspace", {
        workspacePath: values.path,
      });

      if (workspaceConfig) {
        // 工作区已存在，直接加载
        await startWorkspaceMcpClients(values.path);

        // 添加到历史记录
        const folderName = values.path.split(/[/\\]/).pop() || 'Workspace';
        addToWorkspaceHistory(values.path, folderName);
        setWorkspaceHistory(getWorkspaceHistory());

        // 切换到该工作区
        setActiveWorkspaceKey(values.path);

        // 将新打开的工作区标记为活动和运行中
        await loadWorkspaces(); // 先重新加载工作区列表
        setWorkspaces(prev => prev.map(ws => ({
          ...ws,
          isActive: ws.path === values.path || ws.isActive,
          isRunning: ws.path === values.path ? true : ws.isRunning
        })));

        message.success(t`Workspace opened successfully`);
        setOpenModalOpen(false);
        form.resetFields();
        setSelectedPath("");
      } else {
        // 工作区不存在，提示用户是否创建
        setPendingWorkspacePath(values.path);
        setOpenModalOpen(false);
        setConfirmCreateModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to open workspace:", error);
      message.error(t`Failed to open workspace`);
    }
  };

  // 打开已打开的工作区（切换到前端）
  const switchToWorkspace = async (workspacePath: string) => {
    try {
      // 将工作区标记为前端活动状态
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        isActive: ws.path === workspacePath || ws.isActive, // 保留其他已激活的工作区
        isRunning: ws.path === workspacePath ? true : ws.isRunning // 确保标记为运行中
      })));

      // 切换到该工作区（这会让它重新出现在标签页中）
      setActiveWorkspaceKey(workspacePath);
      setOpenModalOpen(false);

      // 如果工作区在后台运行，直接切换
      if (runningWorkspaces.has(workspacePath)) {
        // 重新加载工作区详情（因为它现在要显示在标签页中）
        const workspace = workspaces.find(ws => ws.path === workspacePath);
        if (workspace) {
          await loadWorkspaceDetails(workspace);
          // 确保有默认的欢迎标签页
          initDefaultChatTab(workspace);
        }
        message.success(t`Switched to workspace`);
        return;
      }

      // 如果不在运行，启动它
      await startWorkspaceMcpClients(workspacePath);

      // 更新运行状态
      setRunningWorkspaces(prev => new Set(prev).add(workspacePath));

      message.success(t`Workspace opened and switched`);
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

      await startWorkspaceMcpClients(workspacePath);

      // 添加到历史记录
      addToWorkspaceHistory(workspacePath, folderName);
      setWorkspaceHistory(getWorkspaceHistory());

      message.success(t`Workspace created successfully`);
      loadWorkspaces();
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
      setActiveWorkspaceKey(pendingWorkspacePath);

      // 重新加载工作区列表并标记新工作区为活动
      await loadWorkspaces();
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        isActive: ws.path === pendingWorkspacePath || ws.isActive
      })));

      setConfirmCreateModalOpen(false);
      setPendingWorkspacePath("");
    } catch (error) {
      console.error("Failed to confirm create workspace:", error);
    }
  };

  // 启动工作区MCP服务
  const startWorkspaceMcpClients = async (workspacePath: string) => {
    try {
      await call("startWorkspaceMcpClients", { workspacePath });
      // 更新前端运行状态
      setRunningWorkspaces(prev => new Set(prev).add(workspacePath));

      // 更新工作区的运行状态
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        isRunning: ws.path === workspacePath ? true : ws.isRunning
      })));
    } catch (mcpError) {
      console.warn("Failed to start workspace MCP clients:", mcpError);
      // 不阻止工作区操作，只是警告
    }
  };

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

  // 关闭工作区（完全关闭）
  const closeWorkspace = async (workspace: WorkspaceInfo) => {
    try {
      // 调用关闭工作区的命令（后端会自动从运行列表中移除）
      await call("closeWorkspace", { workspacePath: workspace.path });

      // 更新前端状态
      setRunningWorkspaces(prev => {
        const newSet = new Set(prev);
        newSet.delete(workspace.path);
        return newSet;
      });

      // 更新工作区状态：既不在前端显示，也不在后台运行
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        isActive: ws.path === workspace.path ? false : ws.isActive,
        isRunning: ws.path === workspace.path ? false : ws.isRunning
      })));

      message.success(t`Workspace closed successfully`);

      // 如果关闭的是当前活动工作区，切换到全局工作区
      if (activeWorkspaceKey === workspace.path) {
        setActiveWorkspaceKey(globalWorkspace?.path || "");
      }

      // 清除详情缓存
      setWorkspaceDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[workspace.path];
        return newDetails;
      });

      setCloseConfirmModalOpen(false);
      setPendingCloseWorkspace(null);
    } catch (error) {
      console.error("Failed to close workspace:", error);
      message.error(t`Failed to close workspace`);
    }
  };

  // 后台运行工作区（保持后台活动状态，但从前端标签页中隐藏）
  const runWorkspaceInBackground = async (workspace: WorkspaceInfo) => {
    try {
      // 确保工作区在运行列表中（表示后台活动状态）
      setRunningWorkspaces(prev => new Set(prev).add(workspace.path));

      // 更新工作区状态：后台运行但前端不显示
      setWorkspaces(prev => prev.map(ws => ({
        ...ws,
        isActive: ws.path === workspace.path ? false : ws.isActive, // 前端不显示
        isRunning: ws.path === workspace.path ? true : ws.isRunning // 后台保持运行
      })));

      message.success(t`Workspace is now running in background`);

      // 如果隐藏的是当前选中的工作区，切换到全局工作区
      if (activeWorkspaceKey === workspace.path) {
        setActiveWorkspaceKey(globalWorkspace?.path || "");
      }

      setCloseConfirmModalOpen(false);
      setPendingCloseWorkspace(null);
    } catch (error) {
      console.error("Failed to run workspace in background:", error);
      message.error(t`Failed to run workspace in background`);
    }
  };

  // 删除工作区
  const deleteWorkspace = async (workspace: WorkspaceInfo) => {
    try {
      // 先关闭工作区
      await closeWorkspace(workspace);

      // 然后删除工作区配置
      await call("deleteWorkspace", { workspacePath: workspace.path });

      message.success(t`Workspace deleted successfully`);

      // 重新加载工作区列表
      loadWorkspaces();
    } catch (error) {
      console.error("Failed to delete workspace:", error);
      message.error(t`Failed to delete workspace`);
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
    const workspace = (globalWorkspace && key === globalWorkspace.path) ? globalWorkspace : workspaces.find(ws => ws.path === key);
    const type = refreshType || 'all';

    if (workspace) {
      try {
        let agentList: any[] | undefined;
        let mcpClients: Record<string, IMCPClient> | undefined;

        // 根据刷新类型选择性刷新数据
        if (type === 'agents' || type === 'all') {
          // 刷新 Agents
          agentList = await call("getWorkspaceAgentsSummary", { workspacePath: workspace.path });
        }

        if (type === 'mcp' || type === 'all') {
          // 刷新 MCP 客户端
          const mcpList = await call("getWorkspaceMcpClients", { workspacePath: workspace.path });

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

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // 当工作区加载完成后，自动加载当前活动工作区的详情
  useEffect(() => {
    const currentWorkspace = getCurrentWorkspace();
    if (currentWorkspace) {
      loadWorkspaceDetails(currentWorkspace);
      // 加载当前工作区的面板尺寸
      const workspaceKey = currentWorkspace.path;
      const sizes = getPanelSizes(workspaceKey);
      setPanelSizes([sizes.left, sizes.middle, sizes.right]);
      // 初始化默认聊天标签页
      initDefaultChatTab(currentWorkspace);
    }
  }, [activeWorkspaceKey]);

  // 获取当前活动工作区
  const getCurrentWorkspace = () => {
    if (globalWorkspace && activeWorkspaceKey === globalWorkspace.path) {
      return globalWorkspace;
    }
    return workspaces.find(ws => ws.path === activeWorkspaceKey);
  };

  // 获取当前工作区详情
  const getCurrentDetails = () => {
    return workspaceDetails[activeWorkspaceKey] || { agents: [], mcpClients: {} };
  };

  // 获取当前工作区详情
  const getGlobalDetails = () => {
    if (!globalWorkspace?.path) {
      return { agents: [], mcpClients: {} };
    }
    return workspaceDetails[globalWorkspace.path] || { agents: [], mcpClients: {} };
  };

  // 处理标签页切换
  const handleTabChange = async (key: string) => {
    setActiveWorkspaceKey(key);

    // // 更新工作区的 isActive 状态
    // setWorkspaces(prev => prev.map(ws => ({
    //   ...ws,
    //   isActive: ws.path === key
    // })));

    const workspace = (globalWorkspace && key === globalWorkspace.path) ? globalWorkspace : workspaces.find(ws => ws.path === key);
    if (workspace) {
      // 如果是项目工作区，尝试启动其MCP服务
      if (!workspace.isGlobal) {
        try {
          await call("startWorkspaceMcpClients", { workspacePath: workspace.path });
        } catch (mcpError) {
          console.warn("Failed to start workspace MCP clients on switch:", mcpError);
          // 不阻止工作区切换，只是警告
        }
      }
      await loadWorkspaceDetails(workspace);
      // 确保有默认的欢迎标签页
      initDefaultChatTab(workspace);
    }
  };

  // 打开Agent聊天
  const openAgentChat = (workspaceKey: string, agent: any, chatLog?: any) => {
    const workspace = (globalWorkspace && workspaceKey === globalWorkspace.path) ? globalWorkspace : workspaces.find(ws => ws.path === workspaceKey);
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

  // 获取活动显示的工作区列表（全局 + 当前显示的）
  const getActiveWorkspaces = () => {
    const activeList: WorkspaceInfo[] = [];

    // 总是显示全局工作区
    if (globalWorkspace) {
      activeList.push(globalWorkspace);
    }

    // 添加所有标记为活动的工作区
    workspaces.forEach(workspace => {
      if (workspace.isActive) {
        activeList.push(workspace);
      }
    });

    return activeList;
  };

  // 生成标签页items
  const getTabItems = () => {
    const items: any[] = [];
    const activeList = getActiveWorkspaces();

    activeList.forEach(workspace => {
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
                      type: 'divider',
                    },
                    {
                      key: 'close',
                      label: t`Close Workspace`,
                      icon: <CloseOutlined />,
                      onClick: () => {
                        showCloseConfirm(workspace);
                      }
                    },
                    {
                      key: 'delete',
                      label: t`Delete Workspace`,
                      danger: true,
                      icon: <DeleteOutlined />,
                      onClick: () => {
                        deleteWorkspace(workspace);
                      }
                    }
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
    const workspace = (globalWorkspace && workspaceKey === globalWorkspace.path) ? globalWorkspace : workspaces.find(ws => ws.path === workspaceKey);
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

  // 处理标签页关闭（显示关闭确认）
  const handleTabEdit = (targetKey: string | React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>, action: 'add' | 'remove') => {
    if (action === 'add') {
      // 显示打开工作区对话框
      setOpenModalOpen(true);
    } else if (action === 'remove') {
      // 确保 targetKey 是字符串类型
      if (typeof targetKey === 'string') {
        const workspace = workspaces.find(ws => ws.path === targetKey);
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
            addIcon={<PlusOutlined />}
          />
        </div>
      </div>

      {/* 打开工作区模态框 */}
      <Modal
        title={t`Open or Create Workspace`}
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
            extra={t`Select a folder to open as workspace or create a new workspace`}
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input
                style={{ width: "calc(100% - 100px)" }}
                placeholder={t`Select workspace folder`}
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

          {/* 已打开的工作区 */}
          {runningWorkspaces.size > 0 && (
            <>
              <Divider orientation="left">
                <Space>
                  <PlayCircleOutlined />
                  <span>{t`Running Workspaces`}</span>
                </Space>
              </Divider>
              <List
                size="small"
                dataSource={workspaces.filter(ws => ws.isRunning && !ws.isActive)}
                renderItem={(workspace) => (
                  <List.Item
                    style={{ cursor: 'pointer', padding: '8px 0' }}
                    onClick={() => {
                      switchToWorkspace(workspace.path);
                    }}
                    actions={[
                      <Button
                        key="switch"
                        type="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          switchToWorkspace(workspace.path);
                        }}
                      >
                        {t`Switch`}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FolderOpenOutlined />}
                      title={
                        <Space>
                          <span>{workspace.name}</span>
                          <Tag color="green">{t`Running`}</Tag>
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {workspace.path}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </>
          )}

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
        okText={t`Create`}
        cancelText={t`Cancel`}
      >
        <p>{t`The selected folder is not a workspace. Do you want to create a new workspace here?`}</p>
        <p><strong>{t`Path`}:</strong> {pendingWorkspacePath}</p>
      </Modal>

      {/* 工作区关闭确认模态框 */}
      <Modal
        title={t`Close Workspace`}
        open={closeConfirmModalOpen}
        onCancel={() => {
          setCloseConfirmModalOpen(false);
          setPendingCloseWorkspace(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCloseConfirmModalOpen(false);
            setPendingCloseWorkspace(null);
          }}>
            {t`Cancel`}
          </Button>,
          <Button key="background" type="default" onClick={() => {
            if (pendingCloseWorkspace) {
              runWorkspaceInBackground(pendingCloseWorkspace);
            }
          }}>
            {t`Run in Background`}
          </Button>,
          <Button key="close" type="primary" danger onClick={() => {
            if (pendingCloseWorkspace) {
              closeWorkspace(pendingCloseWorkspace);
            }
          }}>
            {t`Close Completely`}
          </Button>
        ]}
      >
        <p>{t`How would you like to close this workspace?`}</p>
        {pendingCloseWorkspace && (
          <p><strong>{pendingCloseWorkspace.name}</strong> ({pendingCloseWorkspace.path})</p>
        )}
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>{t`Run in Background`}:</strong> {t`Keep MCP services and terminals running, but hide from tabs`}
          </div>
          <div>
            <strong>{t`Close Completely`}:</strong> {t`Stop all MCP services and terminals for this workspace`}
          </div>
        </div>
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
            mcpClients={Object.values(workspaceDetails[globalWorkspace!.path]?.mcpClients || {})}
          />
        )}
      </Drawer>

    </div>
  );
}