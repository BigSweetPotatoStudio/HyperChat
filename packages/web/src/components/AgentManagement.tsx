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
  Slider,
  Row,
  Col,
  Pagination,
  Spin,
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
import { AgentConfig, ChatHistoryItem, createDefaultBaseAIConfig, IMCPClient } from "@dadigua/hyperchat-shared";
import { convertTreeSelectionToMCPConfig, convertMCPConfigToTreeSelection } from '../utils/mcpUtils';
const { Title } = Typography;


interface Agent {
  config: AgentConfig; // Removed scope in Agent-centered architecture
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
  // 分页状态
  const [chatHistoryPagination, setChatHistoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [form] = Form.useForm();
  // Scope filters removed in Agent-centered architecture
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
      // 使用公共函数转换 TreeSelect 选中值
      const selectedValues = values.allowMCPs || [];
      const { allowMCPs, blockMCPTools } = convertTreeSelectionToMCPConfig(selectedValues, mcpClients);

      const agentConfig = {
        name: values.name,
        description: values.description,
        prompt: values.prompt,
        allowMCPs,
        blockMCPTools,
        isConfirmCallTool: values.isConfirmCallTool ?? false,
        modelKey: values.modelKey,
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        compressionStrategy: 'tokens',
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
          workspacePath: workspace.path
        });
        message.success(t`Agent updated successfully`);
      } else {
        // 创建新Agent
        await call('createAgent', {
          config: agentConfig,
          workspacePath: workspace.path
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
        workspacePath: workspace.path
      });
      message.success(t`Agent deleted successfully`);
      await onRefresh();
    } catch (error) {
      console.error("Failed to delete agent:", error);
      message.error(t`Failed to delete agent`);
    }
  };


  // 加载聊天历史（支持分页）
  const loadChatHistory = async (agent: Agent, page: number = 1, pageSize: number = 10) => {
    try {
      setLoadingChatHistory(true);

      // 获取Agent的聊天历史记录
      const result = await call('getAgentChatLogs', {
        agentName: agent.config.name,
        page: page - 1, // API使用0-based页码
        pageSize: pageSize,
        workspacePath: workspace.path
      });

      setChatHistoryList(result.chatLogs || []);
      setChatHistoryPagination({
        current: page,
        pageSize: pageSize,
        total: result.total || 0,
      });
    } catch (error) {
      console.error("Failed to load chat history:", error);
      message.error(t`Failed to load chat history`);
    } finally {
      setLoadingChatHistory(false);
    }
  };

  // 查看聊天历史
  const viewChatHistory = async (agent: Agent) => {
    setChatHistoryAgent(agent);
    setChatHistoryModal(true);

    // 清空旧的缓存数据，确保显示加载状态
    setChatHistoryList([]);
    setChatHistoryPagination({ current: 1, pageSize: 10, total: 0 });

    // 重置分页状态并加载第一页
    await loadChatHistory(agent, 1, 10);
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
            chatKey: chatLog.key,
            workspacePath: workspace.path
          });

          message.success(t`Chat log deleted successfully`);

          // 重新加载当前页的聊天历史
          await loadChatHistory(
            chatHistoryAgent,
            chatHistoryPagination.current,
            chatHistoryPagination.pageSize
          );

          // 刷新Agent列表以更新聊天记录数量
          await onRefresh();
        } catch (error) {
          console.error("Failed to delete chat log:", error);
          message.error(t`Failed to delete chat log`);
        }
      }
    });
  };

  // Agent-centered架构：简单按名称排序
  const filteredAgents = agents
    .sort((a, b) => a.config.name.localeCompare(b.config.name));

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

        {/* Scope filters removed in Agent-centered architecture */}

        {filteredAgents.length > 0 ? (
          <List
            size="small"
            dataSource={filteredAgents}
            renderItem={(agent) => {
              // Removed isGlobalAgent logic in Agent-centered architecture
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
                    // Simplified delete confirmation in Agent-centered architecture
                    Modal.confirm({
                      title: t`Confirm Delete`,
                      content: t`Are you sure you want to delete this agent?`,
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
                        {/* Scope tags removed in Agent-centered architecture */}

                        {agent.chatLogsCount !== undefined && (
                          <Tooltip title={t`Chat count`}>
                            <Tag color="blue">{agent.chatLogsCount} 💬</Tag>
                          </Tooltip>
                        )}
                        {agent.config.allowMCPs && agent.config.allowMCPs.length > 0 && (
                          <Tooltip title={t`MCP count`}>
                            <Tag color="cyan">{agent.config.allowMCPs.length} 🔧</Tag>
                          </Tooltip>
                        )}
                        {agent.config.modelKey && (
                          <Tag color="green">{getModelDisplayName(agent.config.modelKey)}</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1 line-clamp-1">

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
            description={t`No Agents`}
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
              {/* Scope information removed in Agent-centered architecture */}
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
              <Descriptions.Item label={t`Compression Strategy`}>
                tokens
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
                <div>Compression Strategy: tokens</div>
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
              // 使用公共函数将 allowMCPs 和 blockMCPTools 转换为 TreeSelect 格式
              const allowMCPs = editingAgent.config.allowMCPs || [];
              const blockMCPTools = editingAgent.config.blockMCPTools || [];
              const combinedAllowMCPs = convertMCPConfigToTreeSelection(allowMCPs, blockMCPTools, mcpClients);

              const formValues = {
                key: editingAgent.config.name,
                name: editingAgent.config.name,
                description: editingAgent.config.description,
                prompt: editingAgent.config.prompt,
                modelKey: editingAgent.config.modelKey,
                temperature: editingAgent.config.temperature ?? 1,
                maxTokens: editingAgent.config.maxTokens,
                allowMCPs: combinedAllowMCPs,
                isConfirmCallTool: editingAgent.config.isConfirmCallTool ?? false,
                compressionStrategy: 'tokens',
                maxContextTokens: editingAgent.config.maxContextTokens,
              };
              form.resetFields();
              form.setFieldsValue(formValues);
            } else {
              // 创建模式：从工作区设置读取默认值
              const baseConfig = createDefaultBaseAIConfig("你是谁一个超级agent");
              const firstAvailableModel = aiSettings?.models?.[0]?.key || "";

              // 只有在 aiSettings 加载完成后才设置默认值
              if (aiSettings && !aiSettingsLoading) {
                const defaultValues = {
                  ...baseConfig,
                  allowMCPs: convertMCPConfigToTreeSelection(
                    ["hyper_system", "hyper_browser"], // 默认允许的MCP
                    [], // 默认不阻止任何工具
                    mcpClients
                  ),
                  modelKey: baseConfig?.modelKey || firstAvailableModel,
                  prompt: undefined, // Prompt留空，用户需要输入
                  compressionStrategy: 'tokens',
                };

                form.setFieldsValue(defaultValues);
              }
              // Scope reset removed in Agent-centered architecture
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
          {/* Scope selection removed in Agent-centered architecture */}

          {/* Scope display removed in Agent-centered architecture */}

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
              // showCheckedStrategy={TreeSelect.SHOW_PARENT}
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
          setChatHistoryPagination({ current: 1, pageSize: 10, total: 0 });
        }}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <Spin spinning={loadingChatHistory} tip={t`Loading chat history...`}>
          <div style={{ minHeight: '300px' }}>
            {chatHistoryList.length > 0 ? (
              <>
                <List
                  dataSource={chatHistoryList}
                  renderItem={(chatLog: ChatHistoryItem, index) => (
                    <List.Item
                      key={chatLog.key || index}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={async () => {
                        // 关闭历史记录模态框
                        setChatHistoryModal(false);
                        setChatHistoryAgent(null);
                        setChatHistoryList([]);
                        setChatHistoryPagination({ current: 1, pageSize: 10, total: 0 });

                        // 重新获取最新的聊天记录数据，而不是使用缓存的chatLog
                        if (chatHistoryAgent && onOpenChat) {
                          try {
                            const freshChatLog = await call('getAgentChatLog', {
                              agentName: chatHistoryAgent.config.name,
                              chatLogKey: chatLog.key,
                              workspacePath: workspace.path
                            });
                            onOpenChat(chatHistoryAgent, freshChatLog || chatLog);
                          } catch (error) {
                            console.error("Failed to get fresh chat log:", error);
                            // 降级使用缓存的数据
                            onOpenChat(chatHistoryAgent, chatLog);
                          }
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
                            <span>{chatLog.label || `Chat ${(chatHistoryPagination.current - 1) * chatHistoryPagination.pageSize + index + 1}`}</span>
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

                {/* 分页组件 */}
                {chatHistoryPagination.total > chatHistoryPagination.pageSize && (
                  <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <Pagination
                      current={chatHistoryPagination.current}
                      pageSize={chatHistoryPagination.pageSize}
                      total={chatHistoryPagination.total}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                      pageSizeOptions={['5', '10', '20', '50']}
                      onChange={async (page, pageSize) => {
                        if (chatHistoryAgent) {
                          await loadChatHistory(chatHistoryAgent, page, pageSize);
                        }
                      }}
                      disabled={loadingChatHistory}
                    />
                  </div>
                )}
              </>
            ) : !loadingChatHistory ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <Empty
                  description={t`No chat history found`}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : null}
          </div>
        </Spin>
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
          placeholder="8096"
        />
      </Form.Item>
    </Col>
    {/* compressionStrategy is now fixed to 'tokens' */}
    <Form.Item name="compressionStrategy" initialValue="tokens" hidden>
      <Input />
    </Form.Item>
    <Col span={8}>
      <Form.Item
        name="maxContextTokens"
        label={t`Max Context Tokens`}
        tooltip={t`Maximum context tokens before compression (1000-128000)`}
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