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
  MessageOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { t } from "../i18n";
import { HeaderContext } from "../common/context";
import { AI_MODELS } from "@hyperchat/shared/data.mjs";
import { NumberStep } from "../common/numberStep";
import EmojiPicker from 'emoji-picker-react';
import { Editor } from "./editor";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { AgentConfig, IMCPClient } from "@hyperchat/shared/types.mjs";
const { Title, Text } = Typography;


interface Agent {
  config: AgentConfig;
  chatLogsCount: number;
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
  onOpenChat?: (agent: Agent) => void;
  mcpClients: Record<string, IMCPClient>;
}

export function AgentManagement({ workspace, agents, onRefresh, onOpenChat, mcpClients }: AgentManagementProps) {
  const [agentDetailDrawer, setAgentDetailDrawer] = useState(false);
  const [agentEditModal, setAgentEditModal] = useState(false);
  const [chatHistoryModal, setChatHistoryModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [chatHistoryAgent, setChatHistoryAgent] = useState<Agent | null>(null);
  const [chatHistoryList, setChatHistoryList] = useState<any[]>([]);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [form] = Form.useForm();
  const refresh = useForceUpdate();
  const context = useContext(HeaderContext);


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
  const saveAgent = async (values) => {
    try {
      const agentConfig = {
        name: values.name,
        description: values.description,
        prompt: values.prompt,
        allowMCPs: values.allowMCPs || [],
        confirm_call_tool: values.confirm_call_tool ?? false,
        modelKey: values.modelKey,
        temperature: values.temperature,
        callable: values.callable ?? true,
        attachedDialogueCount: values.attachedDialogueCount,
      };

      if (editingAgent) {
        // 更新现有Agent
        const agentKey = editingAgent?.config.key;

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
        agentKey: agent.config.key
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

  // 查看聊天历史
  const viewChatHistory = async (agent: Agent) => {
    try {
      setLoadingChatHistory(true);
      setChatHistoryAgent(agent);
      setChatHistoryModal(true);

      // 获取Agent的聊天历史记录
      const result = await call('getAgentChatLogs', {
        workspacePath: workspace.path,
        agentKey: agent.config.key
      });

      setChatHistoryList(result.chatLogs || []);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      message.error(t`Failed to load chat history`);
    } finally {
      setLoadingChatHistory(false);
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
                  key: "chat",
                  icon: <MessageOutlined />,
                  label: t`Open Chat`,
                  onClick: () => onOpenChat && onOpenChat(agent),
                },
                {
                  key: "history",
                  icon: <HistoryOutlined />,
                  label: t`Chat History`,
                  onClick: () => viewChatHistory(agent),
                },
                {
                  key: "details",
                  icon: <InfoCircleOutlined />,
                  label: t`View Details`,
                  onClick: () => showAgentDetails(agent),
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
                    <Button
                      key="chat"
                      type="text"
                      size="small"
                      icon={<MessageOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenChat && onOpenChat(agent);
                      }}
                      title={t`Open Chat`}
                    />,
                    <Button
                      key="history"
                      type="text"
                      size="small"
                      icon={<HistoryOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        viewChatHistory(agent);
                      }}
                      title={t`Chat History`}
                    />,
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
                        <span className="text-sm">{agent.config.name || agent.config.key}</span>
                        {agent.config.modelKey && (
                          <Tag color="green">{AI_MODELS.get().data.find(x => x.key === agent.config.modelKey)?.fullName || agent.config.modelKey}</Tag>
                        )}
                        {agent.chatLogsCount !== undefined && (
                          <Tag color="blue">{agent.chatLogsCount} chats</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1">
                          {agent.config.description || agent.config.prompt?.slice(0, 50) || t`No description`}
                        </div>
                        {/* <Space size="small">
                          <Tag color="blue">
                            {agent.config.key}
                          </Tag>
                        </Space> */}
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
              title={selectedAgent.config.name || selectedAgent.config.key}
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label={t`Name`}>
                {selectedAgent.config.name || selectedAgent.config.key}
              </Descriptions.Item>
              <Descriptions.Item label={t`Key`}>
                {selectedAgent.config.key}
              </Descriptions.Item>
              <Descriptions.Item label={t`Description`}>
                {selectedAgent.config.description || t`No description`}
              </Descriptions.Item>
              <Descriptions.Item label={t`Model`}>
                {selectedAgent.config.modelKey
                  ? AI_MODELS.get().data.find(x => x.key === selectedAgent.config.modelKey)?.fullName || selectedAgent.config.modelKey
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={t`Chat Logs`}>
                {selectedAgent.chatLogsCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Last Chat`}>
                {selectedAgent.lastChatTime ? new Date(selectedAgent.lastChatTime).toLocaleString() : 'Never'}
              </Descriptions.Item>
              <Descriptions.Item label={t`Callable`}>
                {selectedAgent.config.callable ? 'Yes' : 'No'}
              </Descriptions.Item>
              <Descriptions.Item label={t`Attached Dialogue Count`}>
                {selectedAgent.config.attachedDialogueCount || 'Default'}
              </Descriptions.Item>
              <Descriptions.Item label={t`Created`}>
                {selectedAgent.config.created ? new Date(selectedAgent.config.created).toLocaleString() : 'Unknown'}
              </Descriptions.Item>
            </Descriptions>

            {/* Prompt内容 */}
            {selectedAgent.config.prompt && (
              <div className="mt-4">
                <Title level={5}>{t`Prompt`}</Title>
                <div className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedAgent.config.prompt}
                </div>
              </div>
            )}

            {/* MCP 配置 */}
            {selectedAgent.config.allowMCPs && selectedAgent.config.allowMCPs.length > 0 && (
              <div className="mt-4">
                <Title level={5}>{t`Allowed MCPs`}</Title>
                <Space wrap>
                  {selectedAgent.config.allowMCPs.map(mcp => (
                    <Tag key={mcp} color="purple">{mcp}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 其他配置 */}
            <div className="mt-4">
              <Title level={5}>{t`Settings`}</Title>
              <div className="space-y-2">
                <div>Tool Confirmation: {selectedAgent.config.confirm_call_tool ? 'Enabled' : 'Disabled'}</div>
                {selectedAgent.config.temperature !== undefined && (
                  <div>Temperature: {selectedAgent.config.temperature}</div>
                )}
                {selectedAgent.config.attachedDialogueCount !== undefined && (
                  <div>Attached Dialogue Count: {selectedAgent.config.attachedDialogueCount}</div>
                )}
                <div>Callable: {selectedAgent.config.callable ? 'Yes' : 'No'}</div>
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
        width={800}
        okButtonProps={{ autoFocus: true }}
        afterOpenChange={(open) => {
          // 当模态框打开时，设置表单值
          if (open) {
            if (editingAgent) {
              // 编辑模式：设置Agent的现有值
              const formValues = {
                key: editingAgent.config.key,
                name: editingAgent.config.name,
                description: editingAgent.config.description,
                prompt: editingAgent.config.prompt,
                modelKey: editingAgent.config.modelKey,
                temperature: editingAgent.config.temperature ?? 1,
                allowMCPs: editingAgent.config.allowMCPs || [],
                confirm_call_tool: editingAgent.config.confirm_call_tool ?? false,
                callable: editingAgent.config.callable ?? true,
                attachedDialogueCount: editingAgent.config.attachedDialogueCount ?? 10,
              };
              form.resetFields();
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

          <Form.Item
            name="name"
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
                label: x.fullName || x.name,
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
              treeData={(Object.values(mcpClients) || []).map((x) => ({
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

          {/* <Collapse>
            <Collapse.Panel key="1" header={t`More Settings`}>
              <Form.Item name="fallbackModelKey" label={t`TaskFallbackLLM`}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={t`Please select TaskFallbackLLM`}
                  allowClear
                  options={AI_MODELS.get().data.map((x) => ({
                    label: x.fullName || x.name,
                    value: x.key,
                  }))}
                />
              </Form.Item>
            </Collapse.Panel>
          </Collapse> */}
        </Form>
      </Modal>

      {/* 聊天历史模态框 */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            {t`Chat History`} - {chatHistoryAgent?.config.name || chatHistoryAgent?.config.key}
          </Space>
        }
        open={chatHistoryModal}
        onCancel={() => {
          setChatHistoryModal(false);
          setChatHistoryAgent(null);
          setChatHistoryList([]);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loadingChatHistory ? (
            <div className="text-center py-8">
              <Space>
                <span>{t`Loading chat history...`}</span>
              </Space>
            </div>
          ) : chatHistoryList.length > 0 ? (
            <List
              dataSource={chatHistoryList}
              renderItem={(chatLog: any, index) => (
                <List.Item
                  key={chatLog.key || index}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // TODO: 可以添加打开具体聊天记录的功能
                    message.info(t`Open chat record: ${chatLog.label || chatLog.key}`);
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {chatLog.icon && <span>{chatLog.icon}</span>}
                        <span>{chatLog.label || `Chat ${index + 1}`}</span>
                        {chatLog.messages && (
                          <Tag color="blue">{chatLog.messages.length} messages</Tag>
                        )}
                        {chatLog.modelKey && (
                          <Tag color="green">{AI_MODELS.get().data.find(x => x.key === chatLog.modelKey)?.fullName || chatLog.modelKey}</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <div className="text-xs text-gray-500">
                          {chatLog.dateTime
                            ? new Date(chatLog.dateTime).toLocaleString()
                            : 'Unknown time'
                          }
                        </div>
                        <div className="text-xs text-gray-400">
                          Key: {chatLog.key}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description={t`No chat history found`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </Modal>
    </>
  );
}