import React, { useState } from "react";
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
  Form,
  Input,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { t } from "../i18n";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Agent {
  key: string;
  name: string;
  description?: string;
  prompt?: string;
  modelKey?: string;
  allowMCPs?: string[];
  confirm_call_tool?: boolean;
  temperature?: number;
  tags?: string[];
  created?: number;
  lastModified?: number;
  chatLogsCount?: number;
  lastChatTime?: number;
}

interface WorkspaceInfo {
  path: string;
  isGlobal?: boolean;
}

interface AgentManagementProps {
  workspace: WorkspaceInfo;
  agents: Agent[];
  onRefresh: () => Promise<void>;
}

export function AgentManagement({ workspace, agents, onRefresh }: AgentManagementProps) {
  const [agentDetailDrawer, setAgentDetailDrawer] = useState(false);
  const [agentEditModal, setAgentEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form] = Form.useForm();

  // 显示Agent详情
  const showAgentDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentDetailDrawer(true);
  };

  // 编辑Agent
  const editAgent = (agent: Agent) => {
    setEditingAgent(agent);
    form.setFieldsValue({
      name: agent.name,
      description: agent.description,
      prompt: agent.prompt,
      modelKey: agent.modelKey,
      temperature: agent.temperature,
      tags: agent.tags?.join(', '),
    });
    setAgentEditModal(true);
  };

  // 创建新Agent
  const createAgent = () => {
    setEditingAgent(null);
    form.resetFields();
    setAgentEditModal(true);
  };

  // 保存Agent
  const saveAgent = async (values: any) => {
    try {
      if (editingAgent) {
        // 更新现有Agent
        await call('updateAgent', {
          workspacePath: workspace.path,
          agentKey: editingAgent.key,
          updates: {
            name: values.name,
            description: values.description,
            prompt: values.prompt,
            allowMCPs: values.allowMCPs || [],
            confirm_call_tool: values.confirm_call_tool || false,
            modelKey: values.modelKey,
            temperature: values.temperature,
            tags: values.tags || []
          }
        });
        message.success(t`Agent updated successfully`);
      } else {
        // 创建新Agent
        await call('createAgent', {
          workspacePath: workspace.path,
          config: {
            name: values.name,
            description: values.description,
            prompt: values.prompt,
            allowMCPs: values.allowMCPs || [],
            confirm_call_tool: values.confirm_call_tool || false,
            modelKey: values.modelKey,
            temperature: values.temperature,
            tags: values.tags || []
          }
        });
        message.success(t`Agent created successfully`);
      }
      
      setAgentEditModal(false);
      form.resetFields();
      setEditingAgent(null);
      await onRefresh();
    } catch (error) {
      console.error("Failed to save agent:", error);
      message.error(t`Failed to save agent`);
    }
  };

  // 删除Agent
  const deleteAgent = async (agent: Agent) => {
    try {
      await call('deleteAgent', {
        workspacePath: workspace.path,
        agentKey: agent.key
      });
      message.success(t`Agent deleted successfully`);
      await onRefresh();
    } catch (error) {
      console.error("Failed to delete agent:", error);
      message.error(t`Failed to delete agent`);
    }
  };

  // 运行Agent
  const runAgent = async (agent: Agent) => {
    try {
      // TODO: 实现运行Agent的逻辑
      message.success(t`Agent started successfully`);
    } catch (error) {
      console.error("Failed to run agent:", error);
      message.error(t`Failed to run agent`);
    }
  };

  return (
    <>
      <div className="p-2 overflow-auto" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{`Agents (${agents.length})`}</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={createAgent}
            title={t`Create Agent`}
          />
        </div>
        
        {agents.length > 0 ? (
          <List
            size="small"
            dataSource={agents}
            renderItem={(agent) => {
              const menuItems = [
                {
                  key: "details",
                  icon: <InfoCircleOutlined />,
                  label: t`View Details`,
                  onClick: () => showAgentDetails(agent),
                },
                {
                  key: "run",
                  icon: <PlayCircleOutlined />,
                  label: t`Run Agent`,
                  onClick: () => runAgent(agent),
                },
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: t`Edit`,
                  onClick: () => editAgent(agent),
                },
                {
                  type: "divider" as const // 修正 divider 类型
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: t`Delete`,
                  danger: true,
                  onClick: () => {
                    Modal.confirm({
                      title: t`Confirm Delete`,
                      content: t`Are you sure you want to delete this agent?`,
                      onOk: () => deleteAgent(agent),
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
                        <span className="text-sm">{agent.name || agent.key}</span>
                        {agent.modelKey && (
                          <Tag color="green">{agent.modelKey}</Tag>
                        )}
                        {agent.chatLogsCount !== undefined && (
                          <Tag color="blue">{agent.chatLogsCount} chats</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1">
                          {agent.description || agent.prompt?.slice(0, 50) || t`No description`}
                        </div>
                        <Space size="small">
                          <Tag color="blue">
                            {agent.key}
                          </Tag>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty 
            description={t`No Agents`} 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" size="small" onClick={createAgent}>
              {t`Create Agent`}
            </Button>
          </Empty>
        )}
      </div>

      {/* Agent详情抽屉 */}
      <Drawer
        title={t`Agent Details`}
        open={agentDetailDrawer}
        onClose={() => {
          setAgentDetailDrawer(false);
          setSelectedAgent(null);
        }}
        width={600}
      >
        {selectedAgent && (
          <div>
            <Descriptions
              title={selectedAgent.name || selectedAgent.key}
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label={t`Name`}>
                {selectedAgent.name || selectedAgent.key}
              </Descriptions.Item>
              <Descriptions.Item label={t`Key`}>
                {selectedAgent.key}
              </Descriptions.Item>
              <Descriptions.Item label={t`Description`}>
                {selectedAgent.description || t`No description`}
              </Descriptions.Item>
              <Descriptions.Item label={t`Model`}>
                {selectedAgent.modelKey || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={t`Chat Logs`}>
                {selectedAgent.chatLogsCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Last Chat`}>
                {selectedAgent.lastChatTime ? new Date(selectedAgent.lastChatTime).toLocaleString() : 'Never'}
              </Descriptions.Item>
              <Descriptions.Item label={t`Tags`}>
                {selectedAgent.tags?.map(tag => <Tag key={tag}>{tag}</Tag>) || 'None'}
              </Descriptions.Item>
              <Descriptions.Item label={t`Created`}>
                {selectedAgent.created ? new Date(selectedAgent.created).toLocaleString() : 'Unknown'}
              </Descriptions.Item>
            </Descriptions>

            {/* Prompt内容 */}
            {selectedAgent.prompt && (
              <div className="mt-4">
                <Title level={5}>{t`Prompt`}</Title>
                <div className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedAgent.prompt}
                </div>
              </div>
            )}

            {/* MCP 配置 */}
            {selectedAgent.allowMCPs && selectedAgent.allowMCPs.length > 0 && (
              <div className="mt-4">
                <Title level={5}>{t`Allowed MCPs`}</Title>
                <Space wrap>
                  {selectedAgent.allowMCPs.map(mcp => (
                    <Tag key={mcp} color="purple">{mcp}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 其他配置 */}
            <div className="mt-4">
              <Title level={5}>{t`Settings`}</Title>
              <div className="space-y-2">
                <div>Tool Confirmation: {selectedAgent.confirm_call_tool ? 'Enabled' : 'Disabled'}</div>
                {selectedAgent.temperature !== undefined && (
                  <div>Temperature: {selectedAgent.temperature}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Agent编辑模态框 */}
      <Modal
        title={editingAgent ? t`Edit Agent` : t`Create Agent`}
        open={agentEditModal}
        onCancel={() => {
          setAgentEditModal(false);
          form.resetFields();
          setEditingAgent(null);
        }}
        onOk={() => {
          form.submit();
        }}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveAgent}
        >
          <Form.Item
            label={t`Agent Name`}
            name="name"
            rules={[{ required: true, message: t`Please enter agent name` }]}
          >
            <Input placeholder={t`Enter agent name`} />
          </Form.Item>
          
          <Form.Item
            label={t`Description`}
            name="description"
          >
            <Input placeholder={t`Enter agent description`} />
          </Form.Item>
          
          <Form.Item
            label={t`Prompt`}
            name="prompt"
            rules={[{ required: true, message: t`Please enter agent prompt` }]}
          >
            <TextArea 
              rows={6} 
              placeholder={t`Enter agent prompt`}
            />
          </Form.Item>

          <Form.Item
            label={t`Model Key`}
            name="modelKey"
          >
            <Input placeholder={t`Enter model key (optional)`} />
          </Form.Item>

          <Form.Item
            label={t`Temperature`}
            name="temperature"
          >
            <Input type="number" min={0} max={2} step={0.1} placeholder="0.7" />
          </Form.Item>

          <Form.Item
            label={t`Tags`}
            name="tags"
          >
            <Input placeholder={t`Enter tags separated by commas`} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}