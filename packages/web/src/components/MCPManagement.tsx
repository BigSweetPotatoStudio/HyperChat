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

  // 刷新MCP客户端列表
  const refreshMcpClients = async () => {
    try {
      setMcpRefreshing(true);
      console.log("Refreshing MCP clients for workspace:", workspace);
      
      // 重新初始化MCP客户端
      console.log("Calling initMcpClients...");
      await call("initMcpClients");
      console.log("initMcpClients completed");
      
      // 调用父组件的刷新函数
      console.log("Calling parent onRefresh...");
      await onRefresh();
      console.log("Parent onRefresh completed");
      
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
      // 刷新列表
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
  const showMcpClientDetails = (client: MCPClient) => {
    setSelectedMcpClient(client);
    setMcpDetailDrawer(true);
  };

  return (
    <>
      <div className="p-2 overflow-auto" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{`MCP (${mcpClients.length})`}</span>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined spin={mcpRefreshing} />}
            onClick={refreshMcpClients}
            loading={mcpRefreshing}
            title={t`Refresh MCP clients`}
          />
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
                        {client.source === "builtin" && (
                          <Tag color="blue">{t`Built-in`}</Tag>
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