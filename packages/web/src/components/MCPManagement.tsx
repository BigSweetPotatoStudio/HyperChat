import React, { useState, useEffect } from "react";
import {
  List,
  Button,
  Tag,
  Space,
  Empty,
  Dropdown,
  Modal,
  Drawer,
  Descriptions,
  Typography,
  message,
} from "antd";
import {
  ReloadOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { t } from "../i18n";

const { Title } = Typography;

interface MCPClient {
  name: string;
  servername?: string;
  status: string;
  config?: any;
  source?: string;
  mcpType?: "builtin" | "custom";
  tools?: any[];
  resources?: any[];
  prompts?: any[];
}

interface WorkspaceInfo {
  path: string;
  isGlobal?: boolean;
}

interface MCPManagementProps {
  workspace: WorkspaceInfo;
  mcpClients: MCPClient[];
  onRefresh: () => Promise<void>;
}

export function MCPManagement({ workspace, mcpClients, onRefresh }: MCPManagementProps) {
  const [mcpRefreshing, setMcpRefreshing] = useState(false);
  const [mcpDetailDrawer, setMcpDetailDrawer] = useState(false);
  const [selectedMcpClient, setSelectedMcpClient] = useState<MCPClient | null>(null);
  const [addMcpModalOpen, setAddMcpModalOpen] = useState(false);

  // 刷新MCP客户端列表
  const refreshMcpClients = async () => {
    try {
      setMcpRefreshing(true);
      
      if (workspace.isGlobal) {
        // 全局工作区：强制重新加载全局MCP客户端
        await call("forceReloadMcpClients");
      } else {
        // 项目工作区：强制重新加载工作区特定的MCP客户端
        try {
          await call("forceReloadWorkspaceMcpClients", { workspacePath: workspace.path });
        } catch (error) {
          // 如果工作区MCP强制重新加载失败，回退到全局强制重新加载
          console.warn("Workspace MCP force reload failed, falling back to global force reload:", error);
          await call("forceReloadMcpClients");
        }
      }
      
      // 调用父组件的刷新函数
      await onRefresh();
      
      message.success(t`MCP clients reloaded successfully`);
    } catch (error) {
      console.error("Failed to reload MCP clients:", error);
      message.error(t`Failed to reload MCP clients`);
    } finally {
      setMcpRefreshing(false);
    }
  };

  // 重启MCP客户端
  const restartMcpClient = async (clientName: string) => {
    try {
      // 使用新的工作区特定的重启方法
      await call("manageWorkspaceMcpClient", {
        workspacePath: workspace.path,
        clientName,
        action: "restart"
      });
      
      message.success(t`MCP client restarted successfully`);
    } catch (error) {
      console.error(`Failed to restart MCP client ${clientName}:`, error);
      message.error(t`Failed to restart MCP client`);
    }
  };

  // 停用MCP客户端
  const disableMcpClient = async (clientName: string) => {
    try {
      // 使用新的工作区特定的禁用方法
      await call("manageWorkspaceMcpClient", {
        workspacePath: workspace.path,
        clientName,
        action: "disable"
      });
      message.success(t`MCP client disabled successfully`);
    } catch (error) {
      console.error(`Failed to disable MCP client ${clientName}:`, error);
      message.error(t`Failed to disable MCP client`);
    }
  };

  // 启用MCP客户端
  const enableMcpClient = async (clientName: string) => {
    try {
      // 使用新的工作区特定的启动方法
      await call("startWorkspaceMcpClient", {
        workspacePath: workspace.path,
        clientName
      });
      message.success(t`MCP client enabled successfully`);
    } catch (error) {
      console.error(`Failed to enable MCP client ${clientName}:`, error);
      message.error(t`Failed to enable MCP client`);
    }
  };

  // 删除MCP客户端
  const deleteMcpClient = async (clientName: string) => {
    try {
      // 使用统一的工作区特定的删除方法
      await call("manageWorkspaceMcpClient", {
        workspacePath: workspace.path,
        clientName,
        action: "delete"
      });
      message.success(t`MCP client deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete MCP client ${clientName}:`, error);
      message.error(t`Failed to delete MCP client`);
    }
  };

  // 显示MCP客户端详情
  const showMcpClientDetails = (client: MCPClient) => {
    setSelectedMcpClient(client);
    setMcpDetailDrawer(true);
  };

  return (
    <>
      <div className="p-2 overflow-auto" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{`MCP (${mcpClients.length})`}</span>
          <div className="flex gap-1">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setAddMcpModalOpen(true)}
              title={t`Add MCP server`}
            />
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={mcpRefreshing} />}
              onClick={refreshMcpClients}
              loading={mcpRefreshing}
              title={t`Refresh MCP clients`}
            />
          </div>
        </div>
        
        {mcpClients.length > 0 ? (
          <List
            size="small"
            dataSource={mcpClients}
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
                  type: "divider" as const
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
                  type: "divider" as const
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
                        {client.mcpType === "builtin" ? (
                          <Tag color="blue">{t`Built-in`}</Tag>
                        ) : (
                          <Tag color="green">{t`Custom`}</Tag>
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
                          >
                            {isDisabled ? t`Disabled` : 
                             isConnected ? t`Connected` : t`Disconnected`}
                          </Tag>
                          {client.tools && (
                            <Tag color="cyan">
                              {client.tools.length} {t`tools`}
                            </Tag>
                          )}
                          {client.resources && (
                            <Tag color="purple">
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

      {/* 添加MCP服务器模态框 */}
      <Modal
        title={t`Add MCP Server`}
        open={addMcpModalOpen}
        onCancel={() => setAddMcpModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAddMcpModalOpen(false)}>
            {t`Cancel`}
          </Button>,
          <Button key="submit" type="primary" disabled>
            {t`Add`}
          </Button>
        ]}
      >
        <div className="text-center py-8">
          <p className="text-gray-500">
            {workspace.isGlobal 
              ? t`Global MCP configuration - Coming soon`
              : t`Workspace MCP configuration - Coming soon`}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {t`This feature is under development`}
          </p>
        </div>
      </Modal>

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
    </>
  );
}