import React, { useState, useEffect } from "react";
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
} from "@ant-design/icons";
import { call } from "../../common/call";
import { useForceUpdate } from "../../hooks/useForceUpdate";
import { t } from "../../i18n";
import { ServerDirectoryBrowser } from "../../components/ServerDirectoryBrowser";

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
}

export function Workspace() {
  const refresh = useForceUpdate();
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [globalWorkspace, setGlobalWorkspace] = useState<WorkspaceInfo | null>(null);
  const [activeWorkspaceKey, setActiveWorkspaceKey] = useState<string>("global");
  const [workspaceDetails, setWorkspaceDetails] = useState<{
    [key: string]: {
      fileTree?: FileNode;
      agents: any[];
      mcpClients: any[];
    }
  }>({});
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [directoryBrowserOpen, setDirectoryBrowserOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>("");
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
      message.error("加载工作区失败");
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
      
      // 如果不是全局工作区，加载文件树
      if (!workspace.isGlobal) {
        const tree = await call("getWorkspaceFileTree", { workspacePath: workspace.path });
        details.fileTree = tree;
      }

      // 加载 Agents
      const agentList = await call("getWorkspaceAgents", { workspacePath: workspace.path });
      details.agents = agentList;

      // 加载 MCP 客户端
      const mcpList = await call("getWorkspaceMcpClients", { workspacePath: workspace.path });
      details.mcpClients = mcpList;
      
      setWorkspaceDetails(prev => ({
        ...prev,
        [key]: details
      }));
    } catch (error) {
      console.error("Failed to load workspace details:", error);
      message.error("加载工作区详情失败");
    }
  };

  // 创建新工作区
  const createWorkspace = async (values: { name: string; description?: string; path: string }) => {
    try {
      await call("createWorkspace", {
        workspacePath: values.path,
        name: values.name,
        description: values.description,
      });
      message.success("工作区创建成功");
      setCreateModalOpen(false);
      form.resetFields();
      setSelectedPath("");
      loadWorkspaces();
    } catch (error) {
      console.error("Failed to create workspace:", error);
      message.error("创建工作区失败");
    }
  };

  // 删除工作区
  const deleteWorkspace = async (workspace: WorkspaceInfo) => {
    try {
      await call("deleteWorkspace", { workspacePath: workspace.path });
      message.success("工作区删除成功");
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
      message.error("删除工作区失败");
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
        message.warning("该目录已经是一个工作区");
      }
      
      setDirectoryBrowserOpen(false);
    } catch (error) {
      console.error("Failed to process selected directory:", error);
      message.error("处理选择的目录失败");
    }
  };

  // 将文件树转换为 Tree 组件需要的格式
  const convertFileTreeToTreeData = (node: FileNode): any => {
    return {
      title: node.name,
      key: node.path,
      icon: node.type === "directory" ? <FolderOutlined /> : <FileOutlined />,
      children: node.children?.map(convertFileTreeToTreeData),
    };
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
            <span>{globalWorkspace.name || "全局工作区"}</span>
            <Tag color="blue" >全局</Tag>
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
            <span>{workspace.name}</span>
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
          description="请选择一个工作区查看详情"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    const tabItems: any[] = [];
    
    // 文件树标签页（仅非全局工作区显示）
    if (!currentWorkspace.isGlobal) {
      tabItems.push({
        label: "文件树",
        key: "files",
        children: (
          <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {details.fileTree ? (
              <Tree
                showIcon
                defaultExpandAll
                treeData={[convertFileTreeToTreeData(details.fileTree)]}
              />
            ) : (
              <Empty description="暂无文件树数据" />
            )}
          </div>
        ),
      });
    }
    
    // Agents 标签页
    tabItems.push({
      label: `Agents (${details.agents.length})`,
      key: "agents",
      children: (
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {details.agents.length > 0 ? (
            <List
              dataSource={details.agents}
              renderItem={(agent) => (
                <List.Item
                  actions={[
                    <Button key="edit" size="small">编辑</Button>,
                    <Button key="delete" size="small" danger>删除</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={agent.name || agent.key}
                    description={agent.description || agent.prompt?.slice(0, 100)}
                  />
                  <Tag>{agent.type || "自定义"}</Tag>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无 Agents" />
          )}
        </div>
      ),
    });
    
    // MCP 客户端标签页
    tabItems.push({
      label: `MCP (${details.mcpClients.length})`,
      key: "mcp",
      children: (
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
          {details.mcpClients.length > 0 ? (
            <List
              dataSource={details.mcpClients}
              renderItem={(client) => (
                <List.Item
                  actions={[
                    <Button key="restart" size="small">重启</Button>,
                    <Button key="delete" size="small" danger>删除</Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={client.name}
                    description={`${client.servername || ""} - ${client.config?.type || "stdio"}`}
                  />
                  <Space>
                    <Tag color={client.status === "connected" ? "green" : "red"}>
                      {client.status}
                    </Tag>
                    {client.source === "builtin" && <Tag color="blue">内置</Tag>}
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无 MCP 客户端" />
          )}
        </div>
      ),
    });
    
    return (
      <div className="h-full">
        <Tabs 
          items={tabItems} 
          style={{ height: '100%' }}
          tabBarStyle={{ marginBottom: 16 }}
        />
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

      {/* 创建工作区模态框 */}
      <Modal
        title="创建新工作区"
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
          onFinish={createWorkspace}
        >
          <Form.Item
            label="工作区名称"
            name="name"
            rules={[{ required: true, message: "请输入工作区名称" }]}
          >
            <Input placeholder="输入工作区名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <Input.TextArea placeholder="可选的工作区描述" rows={3} />
          </Form.Item>

          <Form.Item
            label="文件夹路径"
            name="path"
            rules={[{ required: true, message: "请选择文件夹路径" }]}
          >
            <Input.Group compact>
              <Input
                style={{ width: "calc(100% - 100px)" }}
                placeholder="选择工作区文件夹"
                value={selectedPath || form.getFieldValue('path') || ''}
                readOnly
              />
              <Button
                icon={<FolderOpenOutlined />}
                onClick={() => setDirectoryBrowserOpen(true)}
              >
                选择目录
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
        title="选择工作区目录"
        initialPath="~"
      />
    </div>
  );
}