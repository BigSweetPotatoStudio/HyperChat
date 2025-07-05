import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Tree,
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
} from "antd";
import {
  FolderOpenOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileOutlined,
  FolderOutlined,
  SettingOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  InfoCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { call } from "../../common/call";
import { useForceUpdate } from "../../hooks/useForceUpdate";
import { t } from "../../i18n";
import { ServerDirectoryBrowser } from "../../components/ServerDirectoryBrowser";
import { getClients } from "../../common/mcp";

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

interface WorkspaceInfo extends WorkspaceConfig {
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
}

export function Workspace() {
  const refresh = useForceUpdate();
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [globalWorkspace, setGlobalWorkspace] = useState<WorkspaceInfo | null>(null);
  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<string>("global");
  const [workspaceDetails, setWorkspaceDetails] = useState<{
    [key: string]: {
      fileTreeData?: FileNode[];
      agents: any[];
      mcpClients: any[];
    }
  }>({});
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [directoryBrowserOpen, setDirectoryBrowserOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [mcpDetailDrawer, setMcpDetailDrawer] = useState(false);
  const [selectedMcpClient, setSelectedMcpClient] = useState<any>(null);
  const [mcpRefreshing, setMcpRefreshing] = useState(false);
  const [form] = Form.useForm();

  // 加载工作区列表
  const loadWorkspaces = async () => {
    try {
      setLoading(true);

      // 加载全局工作区
      const globalWs = await call("getGlobalWorkspace");
      if (globalWs) {
        const globalSummary = await call("getCurrentWorkspace", {
          workspacePath: globalWs.path || "~/.hyperchat"
        });
        setGlobalWorkspace({
          ...globalWs,
          path: "global",
          agentsCount: 0,
          mcpServersCount: 0,
          isGlobal: true,
          ...globalSummary,
        });
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
    const key = workspace.isGlobal ? "global" : workspace.path;

    // 如果已经加载过，直接返回
    if (workspaceDetails[key]) return;

    try {
      const details: any = { agents: [], mcpClients: [] };

      // 如果不是全局工作区，加载根目录文件列表（懒加载）
      if (!workspace.isGlobal) {
        const rootItems = await call("getWorkspaceDirectoryList", { 
          workspacePath: workspace.path,
          directoryPath: ""
        });
        details.fileTreeData = rootItems;
      }

      // 加载 Agents
      const agentList = await call("getWorkspaceAgents", { workspacePath: workspace.path });
      details.agents = agentList;

      // 加载 MCP 客户端
      const mcpList = await call("getWorkspaceMcpClients", { workspacePath: workspace.path });
      details.mcpClients = mcpList || [];

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
      await call("deleteWorkspace", { workspacePath: workspace.path });
      message.success(t`Workspace deleted successfully`);
      // 如果删除的是当前活动工作区，切换到全局工作区
      if (activeWorkspaceKey === workspace.path) {
        setActiveWorkspaceKey("global");
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

  // 刷新MCP客户端列表
  const refreshMcpClients = async (workspace?: WorkspaceInfo) => {
    try {
      setMcpRefreshing(true);
      
      // 重新初始化MCP客户端
      await call("initMcpClients");
      
      // 如果有指定工作区，重新加载该工作区的详情
      if (workspace) {
        const key = workspace.isGlobal ? "global" : workspace.path;
        // 清除缓存，强制重新加载
        setWorkspaceDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[key];
          return newDetails;
        });
        await loadWorkspaceDetails(workspace);
      } else {
        // 重新加载当前工作区
        const currentWorkspace = getCurrentWorkspace();
        if (currentWorkspace) {
          const key = currentWorkspace.isGlobal ? "global" : currentWorkspace.path;
          setWorkspaceDetails(prev => {
            const newDetails = { ...prev };
            delete newDetails[key];
            return newDetails;
          });
          await loadWorkspaceDetails(currentWorkspace);
        }
      }
      
      message.success(t`MCP clients refreshed successfully`);
    } catch (error) {
      console.error("Failed to refresh MCP clients:", error);
      message.error(t`Failed to refresh MCP clients`);
    } finally {
      setMcpRefreshing(false);
    }
  };

  // 重启MCP客户端
  const restartMcpClient = async (clientName: string) => {
    try {
      // 先关闭客户端
      await call("closeMcpClients", { clientName });
      // 等待一秒后重新打开
      await new Promise(resolve => setTimeout(resolve, 1000));
      await call("openMcpClient", { clientName });
      
      message.success(t`MCP client restarted successfully`);
      // 刷新当前工作区
      await refreshMcpClients();
    } catch (error) {
      console.error(`Failed to restart MCP client ${clientName}:`, error);
      message.error(t`Failed to restart MCP client`);
    }
  };

  // 停用MCP客户端
  const disableMcpClient = async (clientName: string) => {
    try {
      await call("closeMcpClients", { clientName, isdisable: true });
      message.success(t`MCP client disabled successfully`);
      await refreshMcpClients();
    } catch (error) {
      console.error(`Failed to disable MCP client ${clientName}:`, error);
      message.error(t`Failed to disable MCP client`);
    }
  };

  // 启用MCP客户端
  const enableMcpClient = async (clientName: string) => {
    try {
      await call("openMcpClient", { clientName });
      message.success(t`MCP client enabled successfully`);
      await refreshMcpClients();
    } catch (error) {
      console.error(`Failed to enable MCP client ${clientName}:`, error);
      message.error(t`Failed to enable MCP client`);
    }
  };

  // 删除MCP客户端
  const deleteMcpClient = async (clientName: string) => {
    try {
      await call("closeMcpClients", { clientName, isdelete: true });
      message.success(t`MCP client deleted successfully`);
      await refreshMcpClients();
    } catch (error) {
      console.error(`Failed to delete MCP client ${clientName}:`, error);
      message.error(t`Failed to delete MCP client`);
    }
  };

  // 显示MCP客户端详情
  const showMcpClientDetails = (client: any) => {
    setSelectedMcpClient(client);
    setMcpDetailDrawer(true);
  };


  // 更新文件树数据，插入子项
  const updateTreeDataWithChildren = (
    data: FileNode[],
    targetPath: string,
    children: FileNode[]
  ): FileNode[] => {
    return data.map((node) => {
      if (node.path === targetPath) {
        return {
          ...node,
          children: children,
          loaded: true,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeDataWithChildren(node.children, targetPath, children),
        };
      }
      return node;
    });
  };

  // 更新树数据的工具函数（按照官方示例）
  const updateTreeData = (list: any[], key: React.Key, children: any[]): any[] =>
    list.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });

  // 文件树组件
  const FileTreeComponent = ({ 
    workspace, 
    initialData, 
    onDataUpdate 
  }: { 
    workspace: WorkspaceInfo;
    initialData: FileNode[];
    onDataUpdate: (data: FileNode[]) => void;
  }) => {
    // 初始化树数据
    const [treeData, setTreeData] = useState(() => 
      initialData.map((item) => ({
        title: item.name,
        key: item.path,
        icon: item.type === "directory" ? <FolderOutlined /> : <FileOutlined />,
        isLeaf: item.type === "file",
      }))
    );

    // 当初始数据变化时更新组件状态
    useEffect(() => {
      const newTreeData = initialData.map((item) => ({
        title: item.name,
        key: item.path,
        icon: item.type === "directory" ? <FolderOutlined /> : <FileOutlined />,
        isLeaf: item.type === "file",
      }));
      setTreeData(newTreeData);
    }, [initialData]);

    const onLoadData = ({ key, children }: any) =>
      new Promise<void>(async (resolve) => {
        if (children) {
          resolve();
          return;
        }

        try {
          const childrenData: FileNode[] = await call("getWorkspaceDirectoryList", {
            workspacePath: workspace.path,
            directoryPath: key
          });
          
          const treeChildren = childrenData.map((item: FileNode) => ({
            title: item.name,
            key: item.path,
            icon: item.type === "directory" ? <FolderOutlined /> : <FileOutlined />,
            isLeaf: item.type === "file",
          }));

          setTreeData((origin) => updateTreeData(origin, key, treeChildren));
          resolve();
        } catch (error) {
          console.error("Failed to load directory children:", error);
          message.error(t`Failed to load directory contents`);
          resolve();
        }
      });

    return (
      <Tree
        showIcon
        loadData={onLoadData}
        treeData={treeData}
      />
    );
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  // 当工作区加载完成后，自动加载当前活动工作区的详情
  useEffect(() => {
    const currentWorkspace = getCurrentWorkspace();
    if (currentWorkspace) {
      loadWorkspaceDetails(currentWorkspace);
    }
  }, [activeWorkspaceKey, workspaces, globalWorkspace]);

  // 获取当前活动工作区
  const getCurrentWorkspace = () => {
    if (activeWorkspaceKey === "global") {
      return globalWorkspace;
    }
    return workspaces.find(ws => ws.path === activeWorkspaceKey);
  };

  // 获取当前工作区详情
  const getCurrentDetails = () => {
    return workspaceDetails[activeWorkspaceKey] || { agents: [], mcpClients: [] };
  };

  // 处理标签页切换
  const handleTabChange = async (key: string) => {
    setActiveWorkspaceKey(key);
    const workspace = key === "global" ? globalWorkspace : workspaces.find(ws => ws.path === key);
    if (workspace) {
      await loadWorkspaceDetails(workspace);
    }
  };

  // 生成标签页items
  const getTabItems = () => {
    const items: any[] = [];

    // 全局工作区标签页（不可关闭）
    if (globalWorkspace) {
      items.push({
        key: "global",
        label: (
          <Space>
            <GlobalOutlined />
            <div style={{ textAlign: 'left' }}>
              <div>{globalWorkspace.name || t`Global Workspace`}</div>
              <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.2' }}>
                {t`Global Configuration`}
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
        <Splitter style={{ height: '100%' }}>
          {/* 左侧面板：文件树 */}
          <Splitter.Panel defaultSize="25%" min="15%" max="40%">
            <Card
              title={t`File Tree`}
              size="small"
              className="h-full"
              bodyStyle={{ padding: '8px', height: 'calc(100% - 48px)', overflow: 'auto' }}
            >
              {!currentWorkspace.isGlobal && details.fileTreeData ? (
                <FileTreeComponent
                  workspace={currentWorkspace}
                  initialData={details.fileTreeData}
                  onDataUpdate={(updatedData) => {
                    const key = currentWorkspace.isGlobal ? "global" : currentWorkspace.path;
                    setWorkspaceDetails(prev => ({
                      ...prev,
                      [key]: {
                        fileTreeData: updatedData,
                        agents: prev[key]?.agents || [],
                        mcpClients: prev[key]?.mcpClients || []
                      }
                    }));
                  }}
                />
              ) : (
                <Empty
                  description={currentWorkspace.isGlobal ? t`Global workspace has no file tree` : t`No file tree data`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: '20%' }}
                />
              )}
            </Card>
          </Splitter.Panel>

          {/* 中间面板：操作界面 */}
          <Splitter.Panel defaultSize="50%" min="30%">
            <Card
              title={t`Workspace Operations`}
              size="small"
              className="h-full"
              bodyStyle={{ padding: '16px', height: 'calc(100% - 48px)', overflow: 'auto' }}
            >
              <div className="text-center">
                <Empty
                  description={t`Operations interface under development`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ marginTop: '20%' }}
                >
                  <p className="text-gray-500 mt-4">
                    {t`Main workspace operations interface will be displayed here`}
                  </p>
                </Empty>
              </div>
            </Card>
          </Splitter.Panel>

          {/* 右侧面板：Agents 和 MCP 管理 */}
          <Splitter.Panel defaultSize="25%" min="15%" max="40%">
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
                    label: `Agents (${details.agents.length})`,
                    key: "agents",
                    children: (
                      <div className="p-2 overflow-auto" style={{ height: 'calc(100vh - 160px)' }}>
                        {details.agents.length > 0 ? (
                          <List
                            size="small"
                            dataSource={details.agents}
                            renderItem={(agent) => (
                              <List.Item
                                actions={[
                                  <Button key="edit" size="small" type="link">{t`Edit`}</Button>,
                                  <Button key="delete" size="small" type="link" danger>{t`Delete`}</Button>,
                                ]}
                              >
                                <List.Item.Meta
                                  title={<span className="text-sm">{agent.name || agent.key}</span>}
                                  description={
                                    <span className="text-xs text-gray-500">
                                      {agent.description || agent.prompt?.slice(0, 50)}
                                    </span>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Empty description={t`No Agents`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </div>
                    ),
                  },
                  {
                    label: (
                      <Space>
                        {`MCP (${details.mcpClients.length})`}
                        <Button
                          type="text"
                          size="small"
                          icon={<ReloadOutlined spin={mcpRefreshing} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshMcpClients(currentWorkspace);
                          }}
                          loading={mcpRefreshing}
                          title={t`Refresh MCP clients`}
                        />
                      </Space>
                    ),
                    key: "mcp",
                    children: (
                      <div className="p-2 overflow-auto" style={{ height: 'calc(100vh - 160px)' }}>
                        {details.mcpClients.length > 0 ? (
                          <List
                            size="small"
                            dataSource={details.mcpClients}
                            renderItem={(client) => {
                              const isConnected = client.status === "connected";
                              const isDisabled = client.status === "disabled" || client.config?.disabled;
                              
                              const menuItems = [
                                {
                                  key: "details",
                                  icon: <InfoCircleOutlined />,
                                  label: t`View Details`,
                                  onClick: () => showMcpClientDetails(client),
                                },
                                {
                                  key: "restart",
                                  icon: <ReloadOutlined />,
                                  label: t`Restart`,
                                  disabled: isDisabled,
                                  onClick: () => restartMcpClient(client.name),
                                },
                                {
                                  type: "divider"
                                },
                                isDisabled ? {
                                  key: "enable",
                                  icon: <PlayCircleOutlined />,
                                  label: t`Enable`,
                                  onClick: () => enableMcpClient(client.name),
                                } : {
                                  key: "disable",
                                  icon: <StopOutlined />,
                                  label: t`Disable`,
                                  onClick: () => disableMcpClient(client.name),
                                },
                                {
                                  type: "divider"
                                },
                                {
                                  key: "delete",
                                  icon: <DeleteOutlined />,
                                  label: t`Delete`,
                                  danger: true,
                                  onClick: () => {
                                    Modal.confirm({
                                      title: t`Confirm Delete`,
                                      content: t`Are you sure you want to delete this MCP client?`,
                                      onOk: () => deleteMcpClient(client.name),
                                    });
                                  },
                                },
                              ];
                              
                              return (
                                <List.Item
                                  actions={[
                                    <Dropdown
                                      key="more"
                                      menu={{ items: menuItems }}
                                      trigger={['click']}
                                    >
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<MoreOutlined />}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </Dropdown>
                                  ]}
                                >
                                  <List.Item.Meta
                                    title={
                                      <Space>
                                        <span className="text-sm">{client.name}</span>
                                        {client.source === "builtin" && (
                                          <Tag color="blue" size="small">{t`Built-in`}</Tag>
                                        )}
                                      </Space>
                                    }
                                    description={
                                      <div className="text-xs">
                                        <div className="text-gray-500 mb-1">
                                          {client.servername || client.name} - {client.config?.type || "stdio"}
                                        </div>
                                        <Space size="small">
                                          <Tag
                                            color={
                                              isDisabled ? "default" :
                                              isConnected ? "green" : "red"
                                            }
                                            size="small"
                                          >
                                            {isDisabled ? t`Disabled` : 
                                             isConnected ? t`Connected` : t`Disconnected`}
                                          </Tag>
                                          {client.tools && (
                                            <Tag color="cyan" size="small">
                                              {client.tools.length} {t`tools`}
                                            </Tag>
                                          )}
                                          {client.resources && (
                                            <Tag color="purple" size="small">
                                              {client.resources.length} {t`resources`}
                                            </Tag>
                                          )}
                                        </Space>
                                      </div>
                                    }
                                  />
                                </List.Item>
                              );
                            }}
                          />
                        ) : (
                          <Empty description={t`No MCP clients`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                      </div>
                    ),
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
    <div className="workspace-page h-full p-4">
      <div className="h-full">
        <Tabs
          type="editable-card"
          activeKey={activeWorkspaceKey}
          onChange={handleTabChange}
          onEdit={handleTabEdit}
          items={getTabItems()}
          tabBarStyle={{ marginBottom: 16 }}
          addIcon={<PlusOutlined />}
        // tabBarExtraContent={{
        //   right: (
        //     <Tooltip title="新建工作区">
        //       <Button
        //         type="text"
        //         size="small"
        //         icon={<PlusOutlined />}
        //         onClick={() => setCreateModalOpen(true)}
        //       />
        //     </Tooltip>
        //   )
        // }}
        />

        <div style={{ height: 'calc(100% - 48px)' }}>
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
            <Input.Group compact>
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
            </Input.Group>
          </Form.Item>
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

      {/* MCP客户端详情抽屉 */}
      <Drawer
        title={t`MCP Client Details`}
        open={mcpDetailDrawer}
        onClose={() => {
          setMcpDetailDrawer(false);
          setSelectedMcpClient(null);
        }}
        width={600}
      >
        {selectedMcpClient && (
          <div>
            <Descriptions
              title={selectedMcpClient.name}
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label={t`Name`}>
                {selectedMcpClient.name}
              </Descriptions.Item>
              <Descriptions.Item label={t`Server Name`}>
                {selectedMcpClient.servername || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={t`Status`}>
                <Tag
                  color={
                    selectedMcpClient.status === "disabled" ? "default" :
                    selectedMcpClient.status === "connected" ? "green" : "red"
                  }
                >
                  {selectedMcpClient.status === "disabled" ? t`Disabled` :
                   selectedMcpClient.status === "connected" ? t`Connected` : t`Disconnected`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t`Type`}>
                {selectedMcpClient.config?.type || "stdio"}
              </Descriptions.Item>
              <Descriptions.Item label={t`Source`}>
                <Tag color={selectedMcpClient.source === "builtin" ? "blue" : "default"}>
                  {selectedMcpClient.source === "builtin" ? t`Built-in` : t`Custom`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t`Tools Count`}>
                {selectedMcpClient.tools?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Resources Count`}>
                {selectedMcpClient.resources?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Prompts Count`}>
                {selectedMcpClient.prompts?.length || 0}
              </Descriptions.Item>
            </Descriptions>

            {/* 工具列表 */}
            {selectedMcpClient.tools && selectedMcpClient.tools.length > 0 && (
              <div className="mt-4">
                <Title level={5}>{t`Available Tools`}</Title>
                <List
                  size="small"
                  bordered
                  dataSource={selectedMcpClient.tools}
                  renderItem={(tool: any) => (
                    <List.Item>
                      <List.Item.Meta
                        title={tool.name}
                        description={tool.description}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 资源列表 */}
            {selectedMcpClient.resources && selectedMcpClient.resources.length > 0 && (
              <div className="mt-4">
                <Title level={5}>{t`Available Resources`}</Title>
                <List
                  size="small"
                  bordered
                  dataSource={selectedMcpClient.resources}
                  renderItem={(resource: any) => (
                    <List.Item>
                      <List.Item.Meta
                        title={resource.name || resource.uri}
                        description={resource.description}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 配置信息 */}
            {selectedMcpClient.config && (
              <div className="mt-4">
                <Title level={5}>{t`Configuration`}</Title>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedMcpClient.config, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}