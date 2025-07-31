import React from "react";
import { Card, Tabs, Space, Tag, Empty } from "antd";
import { t } from "../../i18n";
import { Icon } from "../../components/icon";
import { AgentManagement, AgentManagementRef } from "../../components/AgentManagement";
import { MCPManagement, MCPManagementRef } from "../../components/MCPManagement";
import { WorkspaceRightPanelProps } from "./types";

export const WorkspaceRightPanel: React.FC<WorkspaceRightPanelProps> = ({
  workspace,
  workspaceKey,
  agents,
  mcpClients,
  agentManagementRef,
  mcpManagementRef,
  onRefreshAgents,
  onRefreshMCP,
  onOpenChat,
}) => {
  const connectedMCPCount = mcpClients.filter(x => x.status === "connected").length;

  return (
    <Card
      title={t`Management Panel`}
      size="small"
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
                <Icon name="bx-bot" />
                {t`Agents`}
                <Tag>{agents.length || 0}</Tag>
              </Space>
            ),
            key: "agents",
            children: workspace ? (
              <AgentManagement
                ref={(ref) => {
                  agentManagementRef.current = ref;
                }}
                workspace={workspace}
                agents={agents}
                onRefresh={onRefreshAgents}
                onOpenChat={onOpenChat}
                mcpClients={mcpClients}
              />
            ) : <Empty description={t`No workspace selected`} />,
          },
          {
            label: (
              <Space>
                <Icon name="mcp" />
                {t`MCP`}
                <Tag color="green">{connectedMCPCount}</Tag>
              </Space>
            ),
            key: "mcp",
            children: workspace ? (
              <MCPManagement
                ref={(ref) => {
                  mcpManagementRef.current = ref;
                }}
                workspace={workspace}
                mcpClients={mcpClients}
                onRefresh={onRefreshMCP}
              />
            ) : <Empty description={t`No workspace selected`} />,
          },
        ]}
      />
    </Card>
  );
};