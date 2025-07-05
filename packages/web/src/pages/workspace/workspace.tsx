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
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceInfo | null>(null);
  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [mcpClients, setMcpClients] = useState<any[]>([]);
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
        // 获取工作区路径（从配置中推导）
        const wsPath = ws.path || ws.name; // 假设有路径信息
        try {
          const summary = await call("getCurrentWorkspace", { workspacePath: wsPath });
          if (summary) {
            workspaceInfos.push({
              ...ws,
              path: wsPath,
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

  // 选择工作区并加载详细信息
  const selectWorkspace = async (workspace: WorkspaceInfo) => {
    if (selectedWorkspace?.path === workspace.path) return;
    
    setSelectedWorkspace(workspace);
    setFileTree(null);
    setAgents([]);
    setMcpClients([]);

    try {
      // 如果不是全局工作区，加载文件树
      if (!workspace.isGlobal) {
        const tree = await call("getWorkspaceFileTree", { workspacePath: workspace.path });
        setFileTree(tree);
      }

      // 加载 Agents
      const agentList = await call("getWorkspaceAgents", { workspacePath: workspace.path });
      setAgents(agentList);

      // 加载 MCP 客户端
      const mcpList = await call("getWorkspaceMcpClients", { workspacePath: workspace.path });
      setMcpClients(mcpList);
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
      if (selectedWorkspace?.path === workspace.path) {
        setSelectedWorkspace(null);
      }
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

  return (
    <div className="workspace-page h-full p-4">
      <div className="flex h-full gap-4">
        {/* 左侧：工作区列表 */}
        <div className="w-1/3">
          <Card
            title={
              <Space>
                <AppstoreOutlined />
                {t`Workspaces`}
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalOpen(true)}
              >
                {t`New Workspace`}
              </Button>
            }
            className="h-full"
          >
            <div className="space-y-4 overflow-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
              {/* 全局工作区 */}
              {globalWorkspace && (
                <Card
                  size="small"
                  className={`cursor-pointer transition-all ${
                    selectedWorkspace?.path === "global" ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => selectWorkspace(globalWorkspace)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <GlobalOutlined className="text-blue-500" />
                        <Text strong>{globalWorkspace.name || "全局工作区"}</Text>
                        <Tag color="blue">全局</Tag>
                      </div>
                      <Text type="secondary" className="text-xs">
                        全局配置和资源
                      </Text>
                    </div>
                    <div className="text-right">
                      <div>
                        <Badge count={globalWorkspace.agentsCount} size="small" />
                        <Text className="ml-1 text-xs">Agents</Text>
                      </div>
                      <div>
                        <Badge count={globalWorkspace.mcpServersCount} size="small" />
                        <Text className="ml-1 text-xs">MCP</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 项目工作区列表 */}
              {workspaces.map((workspace) => (
                <Card
                  key={workspace.path}
                  size="small"
                  className={`cursor-pointer transition-all ${
                    selectedWorkspace?.path === workspace.path ? "border-blue-500 bg-blue-50" : ""
                  }`}
                  onClick={() => selectWorkspace(workspace)}
                  actions={[
                    <Tooltip title="设置">
                      <SettingOutlined onClick={(e) => e.stopPropagation()} />
                    </Tooltip>,
                    <Popconfirm
                      title="确定删除此工作区吗？"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        deleteWorkspace(workspace);
                      }}
                    >
                      <Tooltip title="删除">
                        <DeleteOutlined className="text-red-500" />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FolderOpenOutlined />
                        <Text strong>{workspace.name}</Text>
                      </div>
                      {workspace.description && (
                        <Text type="secondary" className="text-xs">
                          {workspace.description}
                        </Text>
                      )}
                      <Text type="secondary" className="text-xs block">
                        {workspace.path}
                      </Text>
                    </div>
                    <div className="text-right">
                      <div>
                        <Badge count={workspace.agentsCount} size="small" />
                        <Text className="ml-1 text-xs">Agents</Text>
                      </div>
                      <div>
                        <Badge count={workspace.mcpServersCount} size="small" />
                        <Text className="ml-1 text-xs">MCP</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {workspaces.length === 0 && !globalWorkspace && (
                <Empty
                  description="暂无工作区"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </Card>
        </div>

        {/* 右侧：工作区详情 */}
        <div className="flex-1">
          {selectedWorkspace ? (
            <Card
              title={
                <Space>
                  {selectedWorkspace.isGlobal ? <GlobalOutlined /> : <FolderOpenOutlined />}
                  {selectedWorkspace.name}
                  {selectedWorkspace.isGlobal && <Tag color="blue">全局</Tag>}
                </Space>
              }
              className="h-full"
            >
              <Tabs
                items={[
                  // 文件树标签页（仅非全局工作区显示）
                  ...(!selectedWorkspace.isGlobal ? [{
                    label: "文件树",
                    key: "files",
                    children: (
                      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                        {fileTree ? (
                          <Tree
                            showIcon
                            defaultExpandAll
                            treeData={[convertFileTreeToTreeData(fileTree)]}
                          />
                        ) : (
                          <Empty description="暂无文件树数据" />
                        )}
                      </div>
                    ),
                  }] : []),
                  // Agents 标签页
                  {
                    label: `Agents (${agents.length})`,
                    key: "agents",
                    children: (
                      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                        {agents.length > 0 ? (
                          <List
                            dataSource={agents}
                            renderItem={(agent) => (
                              <List.Item>
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
                  },
                  // MCP 客户端标签页
                  {
                    label: `MCP (${mcpClients.length})`,
                    key: "mcp",
                    children: (
                      <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                        {mcpClients.length > 0 ? (
                          <List
                            dataSource={mcpClients}
                            renderItem={(client) => (
                              <List.Item>
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
                  },
                ]}
              />
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <Empty
                description="请选择一个工作区查看详情"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </Card>
          )}
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