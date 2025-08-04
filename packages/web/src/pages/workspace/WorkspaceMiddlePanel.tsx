import React from "react";
import { Card, Tabs, Space, Empty } from "antd";
import {
  FileTextOutlined,
  MessageOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { t } from "../../i18n";
import { WorkspaceChat } from "../../components/WorkspaceChat";
import { WorkspaceWelcome } from "../../components/WorkspaceWelcome";
import { FileEditor } from "../../components/FileEditor";
import { Icon } from "../../components/icon";
import { WorkspaceMiddlePanelProps, ChatTab } from "./types";
import { IMCPClient } from "@dadigua/hyperchat-shared";

// ChatTab 已在 types.ts 中定义，通过主 workspace.tsx 导出

export const WorkspaceMiddlePanel: React.FC<WorkspaceMiddlePanelProps> = ({
  workspace,
  chatTabs,
  activeTabKey,
  agents,
  mcpClients,
  agentManagementRef,
  onTabChange,
  onTabRemove,
  onOpenAgentChat,
  onFileClose,
}) => {
  return (
    <Card
      title={null}
      size="small"
      className="h-full"
      styles={{ body: { padding: '0', height: '100%', overflow: 'hidden' } }}
    >
      {chatTabs.length > 0 ? (
        <Tabs
          className="myFullTabs"
          type="editable-card"
          activeKey={activeTabKey}
          onChange={onTabChange}
          onEdit={(targetKey, action) => {
            if (action === 'remove' && typeof targetKey === 'string') {
              onTabRemove(targetKey);
            }
          }}
          hideAdd
          size="small"
          tabBarStyle={{ marginBottom: 0, padding: '0 8px' }}
          items={chatTabs.map(tab => ({
            key: tab.key,
            label: (
              <Space size="small">
                {tab.type === 'file' ? (
                  <FileTextOutlined />
                ) : tab.type === 'welcome' ? (
                  <Icon name="bx-bot" />
                ) : tab.agentName ? (
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
                    onClose={() => onFileClose(tab.key)}
                  />
                ) : tab.type === 'welcome' ? (
                  <WorkspaceWelcome
                    workspace={workspace}
                    agents={agents}
                    onOpenAgentChat={(agent, chatLog) => onOpenAgentChat(agent, chatLog)}
                    onCreateAgent={() => {
                      if (agentManagementRef.current) {
                        agentManagementRef.current.createAgent();
                      } else {
                        console.warn('AgentManagement ref not available');
                      }
                    }}
                  />
                ) : (
                  <WorkspaceChat
                    workspace={workspace}
                    agentName={tab.agentName || "New Chat"}
                    workspaceDetails={{
                      agents,
                      mcpClients: mcpClients.reduce((acc, client) => {
                        acc[client.serverName] = client;
                        return acc;
                      }, {} as Record<string, IMCPClient>)
                    }}
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
  );
};