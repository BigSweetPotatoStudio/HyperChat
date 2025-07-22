import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
  Radio,
  InputNumber,
  Tooltip,
  Popover,
  Slider,
  Row,
  Col,
  Alert,
  Divider,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SmileOutlined,
  MessageOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { WorkspaceInfo } from "../pages/workspace/types";
import { t } from "../i18n";
import { useAISettings } from "../contexts/AppSettingsContext";
import EmojiPicker from 'emoji-picker-react';
import { HyperChatEditor } from "./HyperChatEditor";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { AgentConfig, ChatHistoryItem, IMCPClient } from "@dadigua/hyperchat-shared";
const { Title } = Typography;


interface Agent {
  config: AgentConfig & { scope?: "global" | "workspace" };
  chatLogsCount: number;
  lastChatTime?: number;
}

// WorkspaceInfo 类型已移至 ../pages/workspace/types.ts

interface AgentManagementProps {
  workspace: WorkspaceInfo;
  agents: Agent[];
  onRefresh: () => Promise<void>;
  onOpenChat?: (agent: Agent, chatLog?: ChatHistoryItem) => void;
  mcpClients: IMCPClient[];
}

export interface AgentManagementRef {
  createAgent: () => void;
}

export const AgentManagement = forwardRef<AgentManagementRef, AgentManagementProps>(({ workspace, agents, onRefresh, onOpenChat, mcpClients }, ref) => {
  const [agentDetailDrawer, setAgentDetailDrawer] = useState(false);
  const [agentEditModal, setAgentEditModal] = useState(false);
  const [chatHistoryModal, setChatHistoryModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [chatHistoryAgent, setChatHistoryAgent] = useState<Agent | null>(null);
  const [chatHistoryList, setChatHistoryList] = useState<ChatHistoryItem[]>([]);
  const [loadingChatHistory, setLoadingChatHistory] = useState(false);
  const [form] = Form.useForm();
  const [scopeFilter, setScopeFilter] = useState<'all' | 'workspace' | 'global'>('all');
  const [createScope, setCreateScope] = useState<'workspace' | 'global'>('global');
  const refresh = useForceUpdate();
  // 从 Context 获取 AI 设置
  const { aiSettings, loading: aiSettingsLoading } = useAISettings();

  // 获取模型的显示名称
  const getModelDisplayName = (modelKey: string): string => {
    if (!aiSettings) return modelKey;
    const model = aiSettings.models?.find(m => m.key === modelKey);
    return model ? (model.fullName || model.name || modelKey) : "Default";
  };

  // 当 aiSettings 变化时刷新组件
  useEffect(() => {
    refresh();
  }, [aiSettings]);

  // 暴露 createAgent 方法给父组件
  useImperativeHandle(ref, () => ({
    createAgent
  }), []);

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
        name: values.name,
        description: values.description,
        prompt: values.prompt,
        allowMCPs: values.allowMCPs || [],
        isConfirmCallTool: values.isConfirmCallTool ?? false,
        modelKey: values.modelKey,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        maxAttachedDialogs: values.maxAttachedDialogs,
        compressionStrategy: values.compressionStrategy,
        maxContextTokens: values.maxContextTokens,
      };

      if (editingAgent) {
        // 更新现有Agent
        const agentKey = editingAgent?.config.name;

        if (!agentKey) {
          throw new Error('Agent key is missing');
        }
        await call('updateAgent', {
          agentName: agentKey,
          updates: agentConfig,
          scope: editingAgent.config.scope // 使用原有的 scope
        });
        message.success(t`Agent updated successfully`);
      } else {
        // 创建新Agent
        await call('createAgent', {
          config: agentConfig,
          scope: createScope // 使用用户选择的 scope
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
        agentName: agent.config.name,
        scope: agent.config.scope // 明确指定要删除的 Agent scope
      });
      message.success(t`Agent deleted successfully`);
      await onRefresh();
    } catch (error) {
      console.error("Failed to delete agent:", error);
      message.error(t`Failed to delete agent`);
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
        agentName: agent.config.name
      });

      // 按时间倒序排列聊天记录
      const sortedChatLogs = (result.chatLogs || []).sort((a, b) => {
        const timeA = a.dateTime || 0;
        const timeB = b.dateTime || 0;
        return timeB - timeA; // 倒序：最新的在前
      });
      setChatHistoryList(sortedChatLogs);
    } catch (error) {
      console.error("Failed to load chat history:", error);
      message.error(t`Failed to load chat history`);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  // 删除聊天记录
  const deleteChatLog = async (chatLog: ChatHistoryItem) => {
    Modal.confirm({
      title: t`Confirm Delete`,
      content: t`Are you sure you want to delete this chat log?`,
      okText: t`Delete`,
      cancelText: t`Cancel`,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          if (!chatHistoryAgent) return;

          await call('deleteAgentChatLog', {
            agentName: chatHistoryAgent.config.name,
            chatKey: chatLog.key
          });

          message.success(t`Chat log deleted successfully`);

          // 重新加载聊天历史列表
          const result = await call('getAgentChatLogs', {
            agentName: chatHistoryAgent.config.name
          });
          // 按时间倒序排列聊天记录
          const sortedChatLogs = (result.chatLogs || []).sort((a, b) => {
            const timeA = a.dateTime || 0;
            const timeB = b.dateTime || 0;
            return timeB - timeA; // 倒序：最新的在前
          });
          setChatHistoryList(sortedChatLogs);

          // 刷新Agent列表以更新聊天记录数量
          await onRefresh();
        } catch (error) {
          console.error("Failed to delete chat log:", error);
          message.error(t`Failed to delete chat log`);
        }
      }
    });
  };

  // 过滤和排序 agents
  const filteredAgents = agents
    .filter(agent => {
      if (scopeFilter === 'all') return true;
      return agent.config.scope === scopeFilter;
    })
    .sort((a, b) => {
      // 本地（workspace）Agent 排在前面，全局（global）Agent 排在后面
      const scopeA = a.config.scope || 'workspace';
      const scopeB = b.config.scope || 'workspace';

      if (scopeA === 'workspace' && scopeB === 'global') return -1;
      if (scopeA === 'global' && scopeB === 'workspace') return 1;

      // 相同 scope 内按名称排序
      return a.config.name.localeCompare(b.config.name);
    });

  return (
    <>
      <div className="p-2 overflow-auto" >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{`Agents (${filteredAgents.length}/${agents.length})`}</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={createAgent}
            title={t`Create Agent`}
          />
        </div>

        {/* Scope 过滤器 */}
        <div className="mb-3">
          <Radio.Group
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            size="small"
          >
            <Radio.Button value="all">{t`All`}</Radio.Button>
            <Radio.Button value="workspace">{t`Workspace`}</Radio.Button>
            <Radio.Button value="global">{t`Global`}</Radio.Button>
          </Radio.Group>
        </div>

        {filteredAgents.length > 0 ? (
          <List
            size="small"
            dataSource={filteredAgents}
            renderItem={(agent) => {
              const isGlobalAgent = agent.config.scope === "global";
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
                // 编辑功能 - 所有 Agent 都可以编辑
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: t`Edit`,
                  onClick: () => editAgent(agent),
                },
                {
                  type: "divider" as const
                },
                // 删除功能 - 所有 Agent 都可以删除，但全局 Agent 会有警告
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: t`Delete`,
                  danger: true,
                  onClick: () => {
                    const scopeWarning = agent.config.scope === 'global'
                      ? t`Warning: Deleting a global agent will affect all projects using this agent!`
                      : t`This will only delete the agent from current workspace.`;

                    Modal.confirm({
                      title: t`Confirm Delete`,
                      content: (
                        <div>
                          <p>{t`Are you sure you want to delete this agent?`}</p>
                          <Alert
                            message={scopeWarning}
                            type={agent.config.scope === 'global' ? 'warning' : 'info'}
                            style={{ marginTop: 8 }}
                          />
                        </div>
                      ),
                      onOk: () => deleteAgent(agent),
                      okButtonProps: { danger: true },
                    });
                  },
                }
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
                        <span className="text-sm">{agent.config.name}</span>
                        {agent.config.scope && (
                          <Tag color={agent.config.scope === "global" ? "orange" : "purple"}>
                            {agent.config.scope === "global" ? t`Global` : t`Workspace`}
                          </Tag>
                        )}

                        {agent.chatLogsCount !== undefined && (
                          <Tooltip title={t`Chat count`}>
                            <Tag color="blue">{agent.chatLogsCount} 💬</Tag>
                          </Tooltip>
                        )}
                        {agent.config.allowMCPs && agent.config.allowMCPs.length > 0 && (
                          <Tooltip title={t`Tools count`}>
                            <Tag color="cyan">{agent.config.allowMCPs.length} 🔧</Tag>
                          </Tooltip>
                        )}
                      </Space>
                    }
                    description={
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1">
                          {agent.config.modelKey && (
                            <Tag color="green">{getModelDisplayName(agent.config.modelKey)}</Tag>
                          )}
                          {agent.config.description || agent.config.prompt?.slice(0, 50) || t`No description`}
                        </div>
                        {/* <Space size="small">
                          <Tag color="blue">
                            {agent.config.name}
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
            description={
              agents.length === 0
                ? t`No Agents`
                : scopeFilter === 'all'
                  ? t`No Agents`
                  : `${t`No`} ${scopeFilter} ${t`agents`}`
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {agents.length === 0 && (
              <Button type="primary" size="small" onClick={createAgent}>
                {t`Create Agent`}
              </Button>
            )}
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
              title={selectedAgent.config.name || selectedAgent.config.name}
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label={t`Name`}>
                {selectedAgent.config.name || selectedAgent.config.name}
              </Descriptions.Item>
              <Descriptions.Item label={t`Key`}>
                {selectedAgent.config.name}
              </Descriptions.Item>
              <Descriptions.Item label={t`Scope`}>
                <Tag color={selectedAgent.config.scope === "global" ? "orange" : "purple"}>
                  {selectedAgent.config.scope === "global" ? t`Global` : t`Workspace`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t`Description`}>
                {selectedAgent.config.description || t`No description`}
              </Descriptions.Item>
              <Descriptions.Item label={t`Model`}>
                {selectedAgent.config.modelKey
                  ? getModelDisplayName(selectedAgent.config.modelKey)
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={t`Chat Logs`}>
                {selectedAgent.chatLogsCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Tools`}>
                {selectedAgent.config.allowMCPs ? selectedAgent.config.allowMCPs.length : 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Last Chat`}>
                {selectedAgent.lastChatTime ? new Date(selectedAgent.lastChatTime).toLocaleString() : 'Never'}
              </Descriptions.Item>
              <Descriptions.Item label={t`Context History`}>
                {selectedAgent.config.maxAttachedDialogs || 5}
              </Descriptions.Item>
              <Descriptions.Item label={t`Compression Strategy`}>
                {selectedAgent.config.compressionStrategy || 'tokens'}
              </Descriptions.Item>
              {selectedAgent.config.maxContextTokens && (
                <Descriptions.Item label={t`Max Context Tokens`}>
                  {selectedAgent.config.maxContextTokens}
                </Descriptions.Item>
              )}
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
                  {selectedAgent.config.allowMCPs.map((mcp: string) => (
                    <Tag key={mcp} color="purple">{mcp}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 其他配置 */}
            <div className="mt-4">
              <Title level={5}>{t`Settings`}</Title>
              <div className="space-y-2">
                <div>Tool Confirmation: {selectedAgent.config.isConfirmCallTool ? 'Enabled' : 'Disabled'}</div>
                {selectedAgent.config.temperature !== undefined && (
                  <div>Temperature: {selectedAgent.config.temperature}</div>
                )}
                {selectedAgent.config.maxTokens !== undefined && (
                  <div>Max Tokens: {selectedAgent.config.maxTokens}</div>
                )}
                {selectedAgent.config.maxAttachedDialogs !== undefined && (
                  <div>Context History: {selectedAgent.config.maxAttachedDialogs}</div>
                )}
                {selectedAgent.config.compressionStrategy && (
                  <div>Compression Strategy: {selectedAgent.config.compressionStrategy}</div>
                )}
                {selectedAgent.config.maxContextTokens !== undefined && (
                  <div>Max Context Tokens: {selectedAgent.config.maxContextTokens}</div>
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
        destroyOnHidden
        width={800}
        okButtonProps={{ autoFocus: true }}
        afterOpenChange={(open) => {
          // 当模态框打开时，设置表单值
          if (open) {
            if (editingAgent) {
              // 编辑模式：设置Agent的现有值
              const formValues = {
                key: editingAgent.config.name,
                name: editingAgent.config.name,
                description: editingAgent.config.description,
                prompt: editingAgent.config.prompt,
                modelKey: editingAgent.config.modelKey,
                temperature: editingAgent.config.temperature ?? 1,
                maxTokens: editingAgent.config.maxTokens,
                allowMCPs: editingAgent.config.allowMCPs || [],
                isConfirmCallTool: editingAgent.config.isConfirmCallTool ?? false,
                maxAttachedDialogs: editingAgent.config.maxAttachedDialogs,
                compressionStrategy: editingAgent.config.compressionStrategy || 'tokens',
                maxContextTokens: editingAgent.config.maxContextTokens,
              };
              form.resetFields();
              form.setFieldsValue(formValues);
            } else {
              // 创建模式：从工作区设置读取默认值
              const workspaceAIConfig = workspace?.settings?.aiConfig;
              const firstAvailableModel = aiSettings?.models?.[0]?.key || "";

              // 只有在 aiSettings 加载完成后才设置默认值
              if (aiSettings && !aiSettingsLoading) {
                const defaultValues = {
                  allowMCPs: ["hyper_system", "hyper_browser"],
                  isConfirmCallTool: workspaceAIConfig?.isConfirmCallTool ?? false,
                  temperature: workspaceAIConfig?.temperature ?? 1,
                  maxTokens: workspaceAIConfig?.maxTokens,
                  maxAttachedDialogs: workspaceAIConfig?.maxAttachedDialogs,
                  modelKey: workspaceAIConfig?.modelKey || firstAvailableModel,
                  prompt: workspaceAIConfig?.prompt || "",
                  compressionStrategy: 'tokens',
                };

                form.setFieldsValue(defaultValues);
              }
              // 重置 scope 选择为默认值
              setCreateScope('global');
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
          {/* Scope 选择 - 只在创建模式显示 */}
          {!editingAgent && (
            <>
              <Alert
                message={
                  createScope === 'global'
                    ? t`Creating a global agent that will be available in all workspaces`
                    : t`Creating a workspace agent that will only be available in current workspace`
                }
                type={createScope === 'global' ? 'warning' : 'info'}
                style={{ marginBottom: 16 }}
              />
              <Form.Item label={t`Agent Scope`}>
                <Radio.Group
                  value={createScope}
                  onChange={(e) => setCreateScope(e.target.value)}
                >
                  <Radio value="workspace">
                    <Space>
                      <Tag color="purple">{t`Workspace`}</Tag>
                      <span>{t`Current project only`}</span>
                    </Space>
                  </Radio>
                  <Radio value="global">
                    <Space>
                      <Tag color="orange">{t`Global`}</Tag>
                      <span>{t`All projects shared`}</span>
                    </Space>
                  </Radio>
                </Radio.Group>
              </Form.Item>
              <Divider />
            </>
          )}

          {/* 编辑模式显示当前 scope */}
          {editingAgent && (
            <>
              <Alert
                message={
                  editingAgent.config.scope === 'global'
                    ? t`Editing a global agent - changes will affect all projects using this agent`
                    : `${t`Current agent scope:`} ${t`Workspace`}`
                }
                type={editingAgent.config.scope === 'global' ? 'warning' : 'info'}
                style={{ marginBottom: 16 }}
              />
            </>
          )}

          <Form.Item
            name="name"
            label={t`Name`}
            rules={[{ required: true, message: t`Please enter the name` }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="prompt"
            label={t`System Prompt`}
            rules={[{ required: true, message: t`Please enter System Prompt` }]}
          >
            <HyperChatEditor
              autoHeight={false}
              style={{ height: "150px" }}
              placeholder={t`Enter system prompt for this agent...`}
            />
          </Form.Item>

          <Form.Item name="modelKey" label={t`Language Model`}
          // rules={[{ required: true, message: t`Please select a language model` }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t`Choose the AI model for this agent`}
              allowClear
              options={aiSettings ? (aiSettings.models || []).map((m) => ({
                label: m.provider + ":" + m.name,
                value: m.key,
              })) : []}
            />
          </Form.Item>

          <Form.Item
            name="allowMCPs"
            label={t`Available Tools`}
          >
            <TreeSelect
              multiple
              treeCheckable
              placeholder={t`Select tools and capabilities for this agent`}
              showCheckedStrategy={TreeSelect.SHOW_PARENT}
              treeData={(Object.values(mcpClients) || []).map((x) => ({
                title: x.serverName,
                key: x.serverName,
                value: x.serverName,
                children: x.tools.map((t) => ({
                  title: (
                    <Tooltip title={t.description}>
                      <span>{t.originalName || t.name}</span>
                    </Tooltip>
                  ),
                  key: t.displayName,
                  value: t.displayName,
                })),
              }))}
            />
          </Form.Item>

          {AgentCommonFormItems}

          <Form.Item name="description" label={t`Description`}>
            <Input.TextArea
              placeholder={t`Describe what this agent does and its capabilities...`}
              rows={2}
            />
          </Form.Item>

        </Form>
      </Modal>

      {/* 聊天历史模态框 */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            {t`Chat History`} - {chatHistoryAgent?.config.name}
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
        destroyOnHidden
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
              renderItem={(chatLog: ChatHistoryItem, index) => (
                <List.Item
                  key={chatLog.key || index}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    // 关闭历史记录模态框
                    setChatHistoryModal(false);
                    setChatHistoryAgent(null);
                    setChatHistoryList([]);

                    // 打开聊天并加载历史记录
                    if (chatHistoryAgent && onOpenChat) {
                      onOpenChat(chatHistoryAgent, chatLog);
                    }
                  }}
                  actions={[
                    <Button
                      key="delete"
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      danger
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡
                        deleteChatLog(chatLog);
                      }}
                      title={t`Delete Chat Log`}
                    />
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{chatLog.label || `Chat ${index + 1}`}</span>
                        {chatLog.messages && (
                          <Tag color="blue">{chatLog.messages.length} messages</Tag>
                        )}
                        {chatLog.configOverrides?.modelKey && (
                          <Tag color="green">{getModelDisplayName(chatLog.configOverrides.modelKey)}</Tag>
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
});

export const AgentCommonFormItems = (
  <Row gutter={[16, 16]}>
    <Col span={12}>
      <Form.Item
        name="temperature"
        label={t`Temperature`}
        tooltip={t`What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.`}
      >
        <Slider
          min={0}
          max={2}
          step={0.1}
          marks={{
            0: '0',
            1: '1',
            2: '2'
          }}
          tooltip={{ formatter: (value) => value?.toFixed(1) }}
        />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="maxTokens"
        label={t`Max Tokens`}
        tooltip={t`Maximum tokens for AI response (100-32000)`}
      >
        <InputNumber
          min={100}
          max={32000}
          step={100}
          style={{ width: '100%' }}
          placeholder="4000"
        />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item
        name="compressionStrategy"
        label={t`Compression Strategy`}
        tooltip={t`Strategy for memory compression: tokens (token数量), dialogs (轮数)`}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select strategy"
          options={[
            { value: 'dialogs', label: t`Dialogs Count` },
            { value: 'tokens', label: t`Token Count` },
          ]}
        />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item
        name="maxContextTokens"
        label={t`Max Context Tokens`}
        tooltip={t`Maximum context tokens before compression (1000-128000). Only effective when compression strategy is 'tokens' or 'auto'`}
      >
        <InputNumber
          min={1000}
          max={128000}
          step={1000}
          style={{ width: '100%' }}
          placeholder="Max Context Tokens"
        />
      </Form.Item>
    </Col>
    <Col span={8}>
      <Form.Item
        name="maxAttachedDialogs"
        label={t`Max Attached Dialogs`}
        tooltip={t`Maximum number of attached dialog histories (0-100)`}
      >
        <InputNumber
          min={0}
          max={100}
          step={1}
          style={{ width: '100%' }}
          placeholder="Maximum number of attached dialog histories (0-100)"
        />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        name="isConfirmCallTool"
        label={t`Tool Execution`}
        tooltip={t`Do you want to confirm calling the tool?`}
      >
        <Radio.Group>
          <Radio value={true}>{t`Need Confirm`}</Radio>
          <Radio value={false}>{t`Direct Call`}</Radio>
        </Radio.Group>
      </Form.Item>
    </Col>
  </Row>
)