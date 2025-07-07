import React, { useState, useEffect, useCallback, useContext } from "react";
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
  Select,
  Switch,
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
  GithubFilled,
  SyncOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { call, msg_receive, callElectron } from "../../common/call";
import { useForceUpdate } from "../../hooks/useForceUpdate";
import { t, currLang, setCurrLang } from "../../i18n";
import { useNavigate } from "react-router-dom";
import {
  AppSetting,
  LocalSetting,
} from "@hyperchat/shared/data.mjs";
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
} from "darkreader";
import { ServerDirectoryBrowser } from "../../components/ServerDirectoryBrowser";
import { getClients } from "../../common/mcp";
import { MCPManagement } from "../../components/MCPManagement";
import { AgentManagement } from "../../components/AgentManagement";
import { FileTreeComponent } from "../../components/FileTreeComponent";
import { WorkspaceSidebar } from "../../components/WorkspaceSidebar";
import { WorkspaceChat } from "../../components/WorkspaceChat";
import { getPanelSizes, savePanelSizes, getWorkspaceHistory, addToWorkspaceHistory, removeFromWorkspaceHistory } from "../../utils/storage";
import { AgentConfig } from "@hyperchat/shared/types.mjs";
import { HeaderContext } from "../../common/context";
import { Icon } from "../../components/icon";
import { ProviderSettings } from "../../components/ProviderSettings";

const { Title, Text } = Typography;

interface WorkspaceConfig {
  name: string;
  description?: string;
  created: number;
  lastAccessed: number;
  settings: {
    enableKnowledgeBase: boolean;
  };
}

export interface WorkspaceInfo extends WorkspaceConfig {
  path: string;
  agentsCount: number;
  mcpServersCount: number;
  isGlobal?: boolean;
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
  agentKey?: string;
  agentName?: string;
  workspacePath: string;
  closable?: boolean;
}

export type WorkspaceDetails = {
  [key: string]: {
    fileTreeData?: FileNode[];
    agents: {
      config: AgentConfig;
      chatLogsCount: number;
      lastChatTime?: number;
    }[];
    mcpClients: Record<string, any>;
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [directoryBrowserOpen, setDirectoryBrowserOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [showHiddenFiles, setShowHiddenFiles] = useState(true);
  const [workspaceHistory, setWorkspaceHistory] = useState(() => getWorkspaceHistory());
  const [form] = Form.useForm();
  const [chatTabs, setChatTabs] = useState<ChatTab[]>([]);
  const [activeChatTab, setActiveChatTab] = useState<string>("");

  // 面板尺寸状态 - 使用数组格式，与Ant Design Splitter兼容
  const [panelSizes, setPanelSizes] = useState<any[]>(() => {
    // 初始化时使用默认工作区的尺寸，先用默认值
    const sizes = { left: '25%', middle: '50%', right: '25%' };
    return [sizes.left, sizes.middle, sizes.right];
  });
  const [updateData, setUpdateData] = useState({} as any); // 更新数据
  // 监听MCP客户端状态变化
  useEffect(() => {
    // 监听传统的 MCP 变化消息（兼容性）
    const unsubscribeChangeMcp = msg_receive("message-from-main", (res: any) => {
      if (res.type === "changeMcpClient") {
        const payload = res.data;

        // 更新工作区详情中的MCP客户端数据
        setWorkspaceDetails(prev => {
          const newDetails = { ...prev };

          // 更新指定工作区的 MCP 客户端数据
          const details = newDetails[payload.workspacePath]
          if (details && details.mcpClients) {
            if (payload.status === "deleted") {
              // 删除客户端
              delete details.mcpClients[payload.name];
            } else {
              // 添加或更新客户端
              details.mcpClients[payload.name] = payload;
            }
          }


          return newDetails;
        });
      }

      if (res.type == "UpdateMsg" && res.data.status == 1) {
        setUpdateData(res.data);
      }

      // 处理更新下载完成消息
      if (res.type == "UpdateMsg" && res.data.status == 4) {
        Modal.confirm({
          title: "Update",
          content:
            "The new version has been downloaded, do you want to restart and update?",
          icon: <ExclamationCircleFilled />,
          okText: "Restart And Update",
          onOk() {
            callElectron("quitAndInstall");
          },
        });
      }
    });

    // 监听新的工作区特定的 MCP 状态变化消息
    // const unsubscribeMcpStatus = msg_receive("mcp-status-change", (res: any) => {
    //   console.log("收到 MCP 状态变化通知:", res);

    //   const { workspacePath, data } = res;
    //   if (!workspacePath || !data) return;

    //   const { serverName, status } = data;

    //   // 只更新指定工作区的 MCP 客户端数据
    //   setWorkspaceDetails(prev => {
    //     const newDetails = { ...prev };
    //     const workspaceDetails = newDetails[workspacePath];

    //     if (workspaceDetails && workspaceDetails.mcpClients) {
    //       if (status === "deleted" || status === "disconnected") {
    //         // 删除或断开连接的客户端
    //         delete workspaceDetails.mcpClients[serverName];
    //       } else {
    //         // 添加或更新客户端
    //         workspaceDetails.mcpClients[serverName] = {
    //           name: serverName,
    //           status,
    //           workspacePath,
    //           ...data
    //         };
    //       }

    //       console.log(`工作区 ${workspacePath} 的 MCP 客户端 ${serverName} 状态更新为: ${status}`);
    //     }

    //     return newDetails;
    //   });
    // });

    // 返回清理函数
    return () => {
      if (unsubscribeChangeMcp) unsubscribeChangeMcp();
      // if (unsubscribeMcpStatus) unsubscribeMcpStatus();
    };
  }, []);

  // 加载工作区列表
  const loadWorkspaces = async () => {
    try {
      setLoading(true);

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
      const mcpClients: Record<string, any> = {};
      if (mcpList && Array.isArray(mcpList)) {
        mcpList.forEach((client: any) => {
          if (client && client.name) {
            mcpClients[client.name] = client;
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

  // 创建或打开工作区
  const createOrOpenWorkspace = async (values: { path: string }) => {
    try {
      // 从路径提取文件夹名称作为工作区名称
      const folderName = values.path.split(/[/\\]/).pop() || 'Workspace';

      await call("createWorkspace", {
        workspacePath: values.path,
        name: folderName,
      });

      // 尝试启动工作区的MCP服务
      try {
        await call("startWorkspaceMcpClients", { workspacePath: values.path });
      } catch (mcpError) {
        console.warn("Failed to start workspace MCP clients, but workspace creation succeeded:", mcpError);
        // 不阻止工作区创建，只是警告
      }

      // 添加到历史记录
      addToWorkspaceHistory(values.path, folderName);
      setWorkspaceHistory(getWorkspaceHistory());

      message.success(t`Workspace created or opened successfully`);
      setCreateModalOpen(false);
      form.resetFields();
      setSelectedPath("");
      loadWorkspaces();
    } catch (error) {
      console.error("Failed to create or open workspace:", error);
      message.error(t`Failed to create or open workspace`);
    }
  };

  // 删除工作区
  const deleteWorkspace = async (workspace: WorkspaceInfo) => {
    try {
      // 先停止工作区的MCP服务
      if (!workspace.isGlobal) {
        try {
          await call("stopWorkspaceMcpClients", { workspacePath: workspace.path });
        } catch (mcpError) {
          console.warn("Failed to stop workspace MCP clients:", mcpError);
          // 不阻止工作区删除，只是警告
        }
      }

      await call("deleteWorkspace", { workspacePath: workspace.path });


      message.success(t`Workspace deleted successfully`);
      // 如果删除的是当前活动工作区，切换到全局工作区
      if (activeWorkspaceKey === workspace.path) {
        setActiveWorkspaceKey(globalWorkspace?.path || "");
      }
      // 清除详情缓存
      setWorkspaceDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[workspace.path];
        return newDetails;
      });
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

  // 刷新当前工作区详情
  const refreshWorkspaceDetails = async () => {
    const currentWorkspace = getCurrentWorkspace();
    if (currentWorkspace) {
      const key = currentWorkspace.path;

      try {
        // 刷新 Agents
        const agentList = await call("getWorkspaceAgentsSummary", { workspacePath: currentWorkspace.path });

        // 刷新 MCP 客户端
        const mcpList = await call("getWorkspaceMcpClients", { workspacePath: currentWorkspace.path });

        // 将数组转换为对象格式
        const mcpClients: Record<string, any> = {};
        if (mcpList && Array.isArray(mcpList)) {
          mcpList.forEach((client: any) => {
            if (client && client.name) {
              mcpClients[client.name] = client;
            }
          });
        }

        // 更新工作区详情数据
        setWorkspaceDetails(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            agents: agentList || [],
            mcpClients: mcpClients
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
            mcpClients: prev[key]?.mcpClients ?? []
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
  }, [activeWorkspaceKey, workspaces, globalWorkspace]);

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

  // 处理标签页切换
  const handleTabChange = async (key: string) => {
    setActiveWorkspaceKey(key);
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
    }
  };

  // 打开Agent聊天
  const openAgentChat = (agent: any) => {
    const currentWorkspace = getCurrentWorkspace();
    if (!currentWorkspace) return;

    const tabKey = `${currentWorkspace.path}-${agent.config.key}`;
    const existingTab = chatTabs.find(tab => tab.key === tabKey);

    if (existingTab) {
      // 如果已存在，切换到该标签页
      setActiveChatTab(tabKey);
    } else {
      // 创建新的聊天标签页
      const newTab: ChatTab = {
        key: tabKey,
        title: agent.config.name || agent.config.key,
        agentKey: agent.config.key,
        agentName: agent.config.name || agent.config.key,
        workspacePath: currentWorkspace.path,
        closable: true,
      };
      setChatTabs(prev => [...prev, newTab]);
      setActiveChatTab(tabKey);
    }
  };

  // 关闭聊天标签页
  const closeChatTab = (tabKey: string) => {
    const newTabs = chatTabs.filter(tab => tab.key !== tabKey);
    setChatTabs(newTabs);

    // 如果关闭的是当前活动标签页，切换到其他标签页
    if (activeChatTab === tabKey) {
      if (newTabs.length > 0 && newTabs[newTabs.length - 1]) {
        setActiveChatTab(newTabs[newTabs.length - 1]!.key);
      } else {
        setActiveChatTab("");
      }
    }
  };

  // 初始化默认聊天标签页
  const initDefaultChatTab = (workspace: WorkspaceInfo) => {
    const defaultTabKey = `${workspace.path}-default`;
    const hasDefaultTab = chatTabs.some(tab => tab.key === defaultTabKey);

    if (!hasDefaultTab) {
      const defaultTab: ChatTab = {
        key: defaultTabKey,
        title: t`Workspace Chat`,
        workspacePath: workspace.path,
        closable: false,
      };
      setChatTabs(prev => [defaultTab, ...prev]);
      if (!activeChatTab) {
        setActiveChatTab(defaultTabKey);
      }
    }
  };

  // 生成标签页items
  const getTabItems = () => {
    const items: any[] = [];

    // 全局工作区标签页（不可关闭）
    if (globalWorkspace) {
      items.push({
        key: globalWorkspace.path,
        label: (
          <Space>
            <GlobalOutlined />
            <div style={{ textAlign: 'left' }}>
              <div>{globalWorkspace.name || t`Global Workspace`}</div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>
                {globalWorkspace.path}
              </div>
            </div>
            <Tag color="blue" >{t`Global`}</Tag>
            <Badge count={globalWorkspace.agentsCount} size="small" />
            <Badge count={globalWorkspace.mcpServersCount} size="small" />
          </Space>
        ),
        closable: false, // 全局工作区不可关闭
      });
    }

    // 项目工作区标签页（可关闭）
    workspaces.forEach(workspace => {
      items.push({
        key: workspace.path,
        label: (
          <Space>
            <FolderOpenOutlined />
            <div style={{ textAlign: 'left' }}>
              <div>{workspace.name}</div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>
                {workspace.path}
              </div>
            </div>
            <Badge count={workspace.agentsCount} size="small" />
            <Badge count={workspace.mcpServersCount} size="small" />
          </Space>
        ),
        closable: true, // 项目工作区可关闭
      });
    });

    return items;
  };

  // 渲染工作区内容
  const renderWorkspaceContent = () => {
    const currentWorkspace = getCurrentWorkspace();
    const details = getCurrentDetails();

    if (!currentWorkspace) {
      return (
        <Empty
          description={t`Please select a workspace to view details`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div className="h-full">
        <Splitter
          style={{ height: '100%' }}
          onResize={handlePanelSizeChange}
        >
          {/* 左侧面板：工作区侧边栏 */}
          <Splitter.Panel
            size={panelSizes[0]}
            min="15%"
            max="40%"
          >
            <WorkspaceSidebar
              workspace={currentWorkspace}
              fileTreeData={details.fileTreeData}
              showHidden={showHiddenFiles}
              onShowHiddenChange={handleShowHiddenChange}
              onRefreshFileTree={refreshFileTree}
            />
          </Splitter.Panel>

          {/* 中间面板：聊天界面 */}
          <Splitter.Panel
            size={panelSizes[1]}
            min="30%"
          >
            <Card
              title={null}
              size="small"
              className="h-full"
              bodyStyle={{ padding: '0', height: '100%', overflow: 'hidden' }}
            >
              {chatTabs.length > 0 ? (
                <Tabs
                  type="editable-card"
                  activeKey={activeChatTab}
                  onChange={setActiveChatTab}
                  onEdit={(targetKey, action) => {
                    if (action === 'remove' && typeof targetKey === 'string') {
                      closeChatTab(targetKey);
                    }
                  }}
                  hideAdd
                  size="small"
                  tabBarStyle={{ marginBottom: 0, padding: '0 8px' }}
                  items={chatTabs.map(tab => ({
                    key: tab.key,
                    label: (
                      <Space size="small">
                        {tab.agentKey ? <MessageOutlined /> : <GlobalOutlined />}
                        <span>{tab.title}</span>
                      </Space>
                    ),
                    closable: tab.closable,
                    children: (
                      <div style={{ height: 'calc(100vh - 116px)', overflow: 'hidden' }}>
                        <WorkspaceChat
                          workspace={currentWorkspace}
                          agentKey={tab.agentKey}
                          workspaceDetails={workspaceDetails}
                          key={tab.key}
                        />
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
            size={panelSizes[2]}
            min="15%"
            max="40%"
          >
            <Card
              title={t`Management Panel`}
              size="small"
              className="h-full"
              bodyStyle={{ padding: '0', height: 'calc(100% - 48px)' }}
            >
              <Tabs
                size="small"
                items={[
                  {
                    label: t`Agents`,
                    key: "agents",
                    children: currentWorkspace ? (
                      <AgentManagement
                        workspace={currentWorkspace}
                        agents={details.agents || []}
                        onRefresh={refreshWorkspaceDetails}
                        onOpenChat={openAgentChat}
                        mcpClients={details.mcpClients || {}}
                      />
                    ) : <Empty description={t`No workspace selected`} />,
                  },
                  {
                    label: t`MCP`,
                    key: "mcp",
                    children: currentWorkspace ? (
                      <MCPManagement
                        workspace={currentWorkspace}
                        mcpClients={details.mcpClients || {}}
                        onRefresh={refreshWorkspaceDetails}
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

  // 处理标签页关闭（删除工作区）
  const handleTabEdit = (targetKey: string | React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>, action: 'add' | 'remove') => {
    if (action === 'add') {
      setCreateModalOpen(true);
    } else if (action === 'remove') {
      // 确保 targetKey 是字符串类型
      if (typeof targetKey === 'string') {
        const workspace = workspaces.find(ws => ws.path === targetKey);
        if (workspace) {
          deleteWorkspace(workspace);
        }
      }
    }
  };

  return (
    <div className="workspace-page h-full">
      <div className="h-full">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          minHeight: '48px'
        }}>
          {/* 左侧内容 - 显示Logo和标题 */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              onClick={() => {
                navigate("/Workspace");
              }}
              src="./assets/favicon.png"
              style={{ width: 32, height: 32, marginRight: 16, cursor: "pointer" }}
            />
            <span style={{ fontSize: 18, fontWeight: "bold" }}>
              HyperChat
              <span style={{ fontSize: 14, fontWeight: "normal", marginLeft: 8 }}>
                ({LocalSetting.get().version})
                {/* 有新版本时显示更新标签 */}
                {updateData?.info && (
                  <Tag
                    className=" text-red-600"
                    onClick={() => {
                      Modal.confirm({
                        title: t`A new version is available`,
                        width: "80%",
                        style: {
                          maxWidth: 1024,
                        },
                        content: (
                          <div>
                            <div>current version: {LocalSetting.get().version}</div>
                            <div>latest version: {updateData.info?.version}</div>
                            {updateData.info?.releaseName != updateData.info?.version && (
                              <div>title: {updateData.info?.releaseName}</div>
                            )}
                            <div>
                              changelog:{" "}
                              {typeof updateData.info?.releaseNotes == "string" ? (
                                <div
                                  style={{ color: "gray" }}
                                  dangerouslySetInnerHTML={{
                                    __html: updateData.info?.releaseNotes || '',
                                  }}
                                ></div>
                              ) : (
                                updateData.info?.releaseNotes?.map((x, index) => {
                                  return (
                                    <div
                                      key={index}
                                      dangerouslySetInnerHTML={{ __html: x.note }}
                                    ></div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        ),
                        okText: t`Download And Update`,
                        onOk: async () => {
                          callElectron("checkUpdateDownload");
                        },
                      });
                    }}
                  >
                    {`New`}
                  </Tag>
                )}
              </span>
            </span>
          </div>

          {/* 中间的工作区切换标签 */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Tabs
              type="editable-card"
              activeKey={activeWorkspaceKey}
              onChange={handleTabChange}
              onEdit={handleTabEdit}
              items={getTabItems()}
              addIcon={<PlusOutlined />}
              style={{ marginBottom: 0 }}
              tabBarStyle={{ marginBottom: 0, background: 'transparent' }}
            />
          </div>

          {/* 右侧内容 - 显示操作按钮 */}
          <div>
            <Space>
              {/* GitHub 链接 */}
              <a href="https://github.com/BigSweetPotatoStudio/HyperChat">
                <GithubFilled style={{ fontSize: 20 }} />
              </a>

              {/* AI 提供商设置按钮 */}
              <Button
                onClick={() => {
                  setLocalIsModelConfigOpen(true);
                }}
                icon={<Icon name="brain" />}
              >
                {t`AI Providers`}
              </Button>

              {/* 语言切换选择器 */}
              <Select
                value={currLang}
                style={{ width: 120 }}
                onChange={(e) => {
                  setCurrLang(e);
                  refresh();
                }}
                options={[
                  { value: "zhCN", label: "中文" },
                  { value: "enUS", label: "English" },
                ]}
              />

              {/* 主题切换开关 */}
              <Switch
                checkedChildren={"🌙"}
                unCheckedChildren={"☀️"}
                checked={AppSetting.get().darkTheme}
                onChange={async (checked) => {
                  AppSetting.get().darkTheme = checked;
                  await AppSetting.save();
                  refresh();

                  // 应用主题设置
                  if (checked) {
                    enableDarkMode({
                      brightness: 100,
                      contrast: 90,
                      sepia: 10,
                    });
                  } else {
                    disableDarkMode();
                  }
                }}
              />


            </Space>
          </div>
        </div>

        <div style={{ height: 'calc(100% - 48px)', padding: '16px' }}>
          {renderWorkspaceContent()}
        </div>
      </div>

      {/* 创建或打开工作区模态框 */}
      <Modal
        title={t`Create or Open Workspace`}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
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
          onFinish={createOrOpenWorkspace}
        >
          <Form.Item
            label={t`Folder Path`}
            name="path"
            rules={[{ required: true, message: t`Please select folder path` }]}
            extra={t`The workspace name will be automatically set to the folder name`}
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

      {/* 服务器目录浏览器 */}
      <ServerDirectoryBrowser
        visible={directoryBrowserOpen}
        onClose={() => setDirectoryBrowserOpen(false)}
        onSelect={handleServerDirectorySelect}
        title={t`Select Workspace Directory`}
        initialPath="~"
      />

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

    </div>
  );
}