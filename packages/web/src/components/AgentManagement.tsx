import React, { useState, useContext, useEffect } from "react";
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
  Select,
  TreeSelect,
  Checkbox,
  Radio,
  Collapse,
  InputNumber,
  Tooltip,
  Popover,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { t } from "../i18n";
import { HeaderContext } from "../common/context";
import { AI_MODELS } from "@hyperchat/shared/data.mjs";
import { NumberStep } from "../common/numberStep";
import EmojiPicker from 'emoji-picker-react';
import { Editor } from "./editor";
import { useForceUpdate } from "../hooks/useForceUpdate";

const { Title, Text } = Typography;

interface AgentConfig {
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
  callable?: boolean;
  attachedDialogueCount?: number;
  fallbackModelKey?: string;
}

interface Agent {
  config: AgentConfig;
  chatLogsCount: number;
  lastChatTime?: number;
  // 支持旧格式的兼容性
  key?: string;
  name?: string;
  description?: string;
  prompt?: string;
  modelKey?: string;
  allowMCPs?: string[];
  confirm_call_tool?: boolean;
  temperature?: number;
  tags?: string[];
  created?: number;
  lastModified?: number;
  callable?: boolean;
  attachedDialogueCount?: number;
  fallbackModelKey?: string;
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
  const refresh = useForceUpdate();
  const context = useContext(HeaderContext);
  const { mcpClients } = context || {};

  useEffect(() => {
    AI_MODELS.init().then(() => {
      refresh();
    });
  }, []);

  // 显示Agent详情
  const showAgentDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setAgentDetailDrawer(true);
  };

  // 编辑Agent
  const editAgent = (agent: Agent) => {
    setEditingAgent(agent);
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
      const agentConfig = {
        name: values.label,
        description: values.description,
        prompt: values.prompt,
        allowMCPs: values.allowMCPs || [],
        confirm_call_tool: values.confirm_call_tool ?? false,
        modelKey: values.modelKey,
        temperature: values.temperature,
        callable: values.callable ?? true,
        attachedDialogueCount: values.attachedDialogueCount,
        fallbackModelKey: values.fallbackModelKey,
      };

      if (editingAgent || values.key) {
        // 更新现有Agent
        const agentKey = editingAgent?.config?.key || editingAgent?.key || values.key;
        
        if (!agentKey) {
          throw new Error('Agent key is missing');
        }
        await call('updateAgent', {
          workspacePath: workspace.path,
          agentKey: agentKey,
          updates: agentConfig
        });
        message.success(t`Agent updated successfully`);
      } else {
        // 创建新Agent
        await call('createAgent', {
          workspacePath: workspace.path,
          config: agentConfig
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
                        <span className="text-sm">{agent.config?.name || agent.name || agent.config?.key || agent.key}</span>
                        {(agent.config?.modelKey || agent.modelKey) && (
                          <Tag color="green">{agent.config?.modelKey || agent.modelKey}</Tag>
                        )}
                        {agent.chatLogsCount !== undefined && (
                          <Tag color="blue">{agent.chatLogsCount} chats</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1">
                          {agent.config?.description || agent.description || agent.config?.prompt?.slice(0, 50) || agent.prompt?.slice(0, 50) || t`No description`}
                        </div>
                        <Space size="small">
                          <Tag color="blue">
                            {agent.config?.key || agent.key}
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
            {(() => {
              const config = selectedAgent.config || selectedAgent;
              return (
                <Descriptions
                  title={config.name || config.key}
                  bordered
                  column={1}
                  size="small"
                >
                  <Descriptions.Item label={t`Name`}>
                    {config.name || config.key}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Key`}>
                    {config.key}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Description`}>
                    {config.description || t`No description`}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Model`}>
                    {config.modelKey || "N/A"}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Chat Logs`}>
                    {selectedAgent.chatLogsCount || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Last Chat`}>
                    {selectedAgent.lastChatTime ? new Date(selectedAgent.lastChatTime).toLocaleString() : 'Never'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Callable`}>
                    {config.callable ? 'Yes' : 'No'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Attached Dialogue Count`}>
                    {config.attachedDialogueCount || 'Default'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Fallback Model`}>
                    {config.fallbackModelKey || 'None'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t`Created`}>
                    {config.created ? new Date(config.created).toLocaleString() : 'Unknown'}
                  </Descriptions.Item>
                </Descriptions>
              );
            })()}

            {/* Prompt内容 */}
            {(() => {
              const config = selectedAgent.config || selectedAgent;
              const prompt = config.prompt || selectedAgent.prompt;
              return prompt && (
                <div className="mt-4">
                  <Title level={5}>{t`Prompt`}</Title>
                  <div className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                    {prompt}
                  </div>
                </div>
              );
            })()}

            {/* MCP 配置 */}
            {(() => {
              const config = selectedAgent.config || selectedAgent;
              const allowMCPs = config.allowMCPs || selectedAgent.allowMCPs;
              return allowMCPs && allowMCPs.length > 0 && (
                <div className="mt-4">
                  <Title level={5}>{t`Allowed MCPs`}</Title>
                  <Space wrap>
                    {allowMCPs.map(mcp => (
                      <Tag key={mcp} color="purple">{mcp}</Tag>
                    ))}
                  </Space>
                </div>
              );
            })()}

            {/* 其他配置 */}
            {(() => {
              const config = selectedAgent.config || selectedAgent;
              return (
                <div className="mt-4">
                  <Title level={5}>{t`Settings`}</Title>
                  <div className="space-y-2">
                    <div>Tool Confirmation: {config.confirm_call_tool ? 'Enabled' : 'Disabled'}</div>
                    {config.temperature !== undefined && (
                      <div>Temperature: {config.temperature}</div>
                    )}
                    {config.attachedDialogueCount !== undefined && (
                      <div>Attached Dialogue Count: {config.attachedDialogueCount}</div>
                    )}
                    <div>Callable: {config.callable ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              );
            })()}
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
        width={800}
        okButtonProps={{ autoFocus: true }}
        afterOpenChange={(open) => {
          // 当模态框打开时，设置表单值
          if (open) {
            if (editingAgent) {
              // 编辑模式：设置Agent的现有值
              const config = editingAgent.config || editingAgent;
              const formValues = {
                key: config.key,
                label: config.name,
                description: config.description,
                prompt: config.prompt,
                modelKey: config.modelKey,
                temperature: config.temperature ?? 1,
                allowMCPs: config.allowMCPs || [],
                confirm_call_tool: config.confirm_call_tool ?? false,
                callable: config.callable ?? true,
                attachedDialogueCount: config.attachedDialogueCount ?? 10,
                fallbackModelKey: config.fallbackModelKey,
              };
              form.setFieldsValue(formValues);
            } else {
              // 创建模式：设置默认值
              form.setFieldsValue({
                allowMCPs: [],
                confirm_call_tool: false,
                callable: true,
                temperature: 1,
                attachedDialogueCount: 10,
              });
            }
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={saveAgent}
          preserve={false}
        >
          <Form.Item className="hidden" name="key" label={"key"}>
            <Input />
          </Form.Item>
          
          <Form.Item
            name="label"
            label={t`Name`}
            rules={[{ required: true, message: t`Please enter the name` }]}
          >
            <Input 
              addonBefore={
                <Popover 
                  destroyTooltipOnHide={false} 
                  trigger="click" 
                  title={t`please select emoji!`} 
                  content={
                    <EmojiPicker 
                      onEmojiClick={(emoji) =>
                        form.setFieldValue("label", emoji.emoji + form.getFieldValue("label"))
                      } 
                    />
                  }
                >
                  <SmileOutlined className=" cursor-pointer" />
                </Popover>
              } 
            />
          </Form.Item>
          
          <Form.Item
            name="prompt"
            label={t`System Prompt`}
            rules={[{ required: true, message: t`Please enter System Prompt` }]}
          >
            <Editor style={{ height: "150px" }} />
          </Form.Item>
          
          <Form.Item name="modelKey" label={t`LLM`}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t`Please select default LLM`}
              allowClear
              options={AI_MODELS.get().data.map((x) => ({
                label: x.name,
                value: x.key,
              }))}
            />
          </Form.Item>
          
          <Form.Item
            name="allowMCPs"
            label={t`allowMCPs`}
          >
            <TreeSelect
              multiple
              treeCheckable
              placeholder={t`Please select allowed MCP`}
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              treeData={(mcpClients || []).map((x) => ({
                title: x.name,
                key: x.name,
                value: x.name,
                children: x.tools.map((t) => ({
                  title: (
                    <Tooltip title={t.description}>
                      <span>{t.origin_name || t.name}</span>
                    </Tooltip>
                  ),
                  key: t.restore_name,
                  value: t.restore_name,
                })),
              }))}
            />
          </Form.Item>
          
          <Form.Item
            name="temperature"
            label={t`temperature`}
            tooltip={t`What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.`}
          >
            <NumberStep defaultValue={1} min={0} max={2} step={0.1} />
          </Form.Item>
          
          <Form.Item
            name="attachedDialogueCount"
            label={t`attachedDialogueCount`}
            tooltip={t`Number of sent Dialogue Message attached per request`}
          >
            <NumberStep defaultValue={10} max={20} />
          </Form.Item>
          
          <Form.Item
            name="confirm_call_tool"
            label={t`callToolType`}
            tooltip={t`Do you want to confirm calling the tool?`}
          >
            <Radio.Group>
              <Radio value={true}>{t`Need Confirm`}</Radio>
              <Radio value={false}>{t`Direct Call`}</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item name="callable" label={t`Callable`} valuePropName="checked">
            <Checkbox>
              {t`Allowed to be called by 'hyper_agent'`}
            </Checkbox>
          </Form.Item>
          
          <Form.Item name="description" label={t`description`}>
            <Input.TextArea
              placeholder={t`Please provide a description for more accurate call.`}
              rows={2}
            />
          </Form.Item>
          
          <Collapse>
            <Collapse.Panel key="1" header={t`More Settings`}>
              <Form.Item name="fallbackModelKey" label={t`TaskFallbackLLM`}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t`Please select TaskFallbackLLM`}
                  allowClear
                  options={AI_MODELS.get().data.map((x) => ({
                    label: x.name,
                    value: x.key,
                  }))}
                />
              </Form.Item>
            </Collapse.Panel>
          </Collapse>
        </Form>
      </Modal>
    </>
  );
}