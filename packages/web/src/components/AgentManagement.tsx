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
  model?: string;
  config?: any;
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
        // TODO: 实现更新Agent的API调用
        message.success(t`Agent updated successfully`);
      } else {
        // 创建新Agent
        // TODO: 实现创建Agent的API调用
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
      // TODO: 实现删除Agent的API调用
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
                        {agent.model && (
                          <Tag color="green">{agent.model}</Tag>
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
                {selectedAgent.model || "N/A"}
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

            {/* 配置信息 */}
            {selectedAgent.config && (
              <div className="mt-4">
                <Title level={5}>{t`Configuration`}</Title>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedAgent.config, null, 2)}
                </pre>
              </div>
            )}
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
              rows={8} 
              placeholder={t`Enter agent prompt`}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}