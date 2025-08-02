/**
 * @fileoverview 工作区聊天组件
 * 
 * 专门用于工作区中间位置的聊天界面，包含：
 * 1. 聊天消息显示
 * 2. 操作栏（模型选择、设置等）
 * 3. 发送框
 */
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Button,
  Divider,
  Flex,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Tree,
  Upload,
  message,
  Form,
  Progress,
  Alert,
} from "antd";
import {
  Welcome,
  XProvider,
} from "@ant-design/x";
import {
  LinkOutlined,
  SettingOutlined,
  ClearOutlined,
  LoadingOutlined,
  SendOutlined,
  SyncOutlined,
  DisconnectOutlined,
  CompressOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

import { v4 } from "uuid";
import { call } from "../common/call";
import { addChatRecentUsage } from "../utils/storage";

import {
  ChatHistoryItem,
} from "@dadigua/hyperchat-shared/types";
import { type AISettings, type AIModelConfigItem } from "@dadigua/hyperchat-shared";
import { useAISettings } from "../contexts/AppSettingsContext";
import { MyMessage } from "@dadigua/hyperchat-shared/types";
import { Messages } from "./messages";
import { Icon } from "./icon";
import { HyperChatEditor, HyperChatEditorRef } from "./HyperChatEditor";
import { t } from "../i18n";
import { blobToBase64, getMyUuid, JsonSchema2FormItemOrNull, urlToBase64 } from "../common/util";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { MyAttachR } from "./attachR";
import { CurrentWorkspaceDetails, WorkspaceInfo } from "../pages/workspace/types";
import { CommonContentItem, HyperChatCompletionTool, IMCPClient, HyperToolCall } from "@dadigua/hyperchat-shared/types";
import { filterMCPTools, convertTreeSelectionToMCPConfig, convertMCPConfigToTreeSelection } from '../utils/mcpUtils';
import { AgentCommonFormItems } from "./AgentManagement";
import { useChatStream } from "../hooks/useChatStream";

/**
 * 工作区聊天组件的Props类型定义
 */
interface WorkspaceChatProps {
  /** 工作区信息 */
  workspace: WorkspaceInfo;
  /** 指定的Agent Key，用于Agent聊天 */
  agentName: string;
  /** Agent的作用域 */
  agentScope: "global" | "workspace";
  workspaceDetails: CurrentWorkspaceDetails;
  mcpClients: IMCPClient[];
  /** 要加载的特定聊天记录 */
  chatLogToLoad?: ChatHistoryItem;
}

/**
 * 工作区聊天组件
 */
export const WorkspaceChat = ({ workspace, agentName, agentScope, workspaceDetails, mcpClients, chatLogToLoad }: WorkspaceChatProps) => {
  // 使用强制刷新 hook
  const refresh = useForceUpdate();

  // 移除未使用的状态
  // 从 Context 获取 AI 设置
  const { aiSettings, loading: aiSettingsLoading } = useAISettings();

  // 获取默认模型配置
  const getDefaultModelFromSettings = (settings: AISettings): AIModelConfigItem | null => {
    if (!settings || !settings.models || !settings.models.length) return null;
    // 优先返回设置中指定的默认模型
    if (settings.defaultModel) {
      const defaultModel = settings.models.find(m => m.key === settings.defaultModel);
      if (defaultModel) return defaultModel;
    }
    // 否则返回第一个LLM模型
    return settings.models.find(m => m.type === 'llm') || settings.models[0] || null;
  };

  // 获取按提供商分组的模型选项
  const getGroupedModelOptions = (settings: AISettings) => {
    if (!settings || !settings.models || !settings.models.length) return [];

    const groups: Record<string, AIModelConfigItem[]> = {};
    settings.models.forEach(model => {
      const provider = model.provider || 'unknown';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider]!.push(model);
    });

    return Object.entries(groups).map(([provider, models]) => ({
      label: provider,
      options: models.map(model => ({
        label: model.provider + ":" + model.name,
        value: model.key,
      }))
    }));
  };

  // 默认聊天配置
  const defaultChatValue = useRef<ChatHistoryItem>({
    label: "",
    key: getMyUuid(),
    messages: [] as MyMessage[],
    agentName: "",
    dateTime: Date.now(),
    chatType: "user" as const, // "user" | "task" | "called"
    // 使用新的配置继承系统
    configOverrides: {
      modelKey: "",
      allowMCPs: [] as string[],
      blockMCPTools: [] as string[],
      isConfirmCallTool: false,
      temperature: undefined as number | undefined,
      maxAttachedDialogs: 5,
      compressionStrategy: undefined as "dialogs" | "tokens" | undefined,
      maxContextTokens: undefined as number | undefined,
      prompt: ""
    }
  });

  // 当前聊天引用
  const currentChat = useRef<ChatHistoryItem>(defaultChatValue.current);

  // 输入框的值
  const [value, setValue] = useState("");

  // 发送历史记录管理
  const sendHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  let confirm_call_tool_cb = (tool: HyperToolCall): Promise<any> => {
    return new Promise((resolve, reject) => {
      console.log("tool", tool);
      let m = modal.confirm({
        title: t`Comfirm Call Tool`,
        width: "90%",
        style: { maxWidth: 1024 },
        footer: [],
        content: (
          <div>
            <Form
              initialValues={tool.function.args}
              name="control-hooks"
              onFinish={(e) => {
                // console.log(e);
                resolve(e);
                m.destroy();
              }}
            >
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  padding: "8px 0",
                  textAlign: "center",
                }}
              >
                <span>Tool Name: </span>
                <span className="text-purple-500">
                  {getTools(mcpClients).find(
                    (x) => x.name == tool.function.name,
                  )?.displayName || tool.function.name}
                </span>
              </pre>
              {JsonSchema2FormItemOrNull(
                getTools(mcpClients).find(
                  (x) => x.name == tool.function.name,
                )?.inputSchema,
              ) || t`No parameters`}
              <Form.Item>
                <div className="flex flex-wrap justify-between">
                  <Button
                    onClick={() => {
                      m.destroy();
                      reject(new Error(t`User Cancel`));
                    }}
                  >{t`Cancel`}</Button>
                  <Space>
                    <Button
                      type="primary"
                      ghost
                      htmlType="submit"
                      onClick={() => {
                        if (!currentChat.current.configOverrides) {
                          currentChat.current.configOverrides = {};
                        }
                        currentChat.current.configOverrides.isConfirmCallTool = false;
                      }}
                    >
                      {t`Allow this Chat`}
                    </Button>
                    <Button type="primary" htmlType="submit">
                      {t`Allow Once`}
                    </Button>
                  </Space>
                </div>
              </Form.Item>
            </Form>
          </div>
        ),
      });
    });
  }

  // 使用新的聊天流 Hook
  const chatStream = useChatStream({
    agentName,
    agentScope,
    onToolConfirm: confirm_call_tool_cb,
  });

  // 获取有效配置值的帮助函数（聊天配置 > Agent配置 > 工作区配置 > 模型列表第一个）
  const getEffectiveConfig = () => {
    const agent = workspaceDetails.agents.find(a => a.config.name === agentName);
    const agentConfig = agent?.config;
    const overrides = currentChat.current.configOverrides || {};

    // 获取可用模型列表
    const availableModels = aiSettings?.models || [];
    const isModelAvailable = (modelKey: string) =>
      availableModels.some(model => model.key === modelKey);

    // 获取工作区默认模型和模型列表第一个作为回退
    const workspaceAIConfig = workspace?.settings?.aiConfig;
    const firstAvailableModel = availableModels[0]?.key || "";

    // 按优先级查找有效的模型
    const findValidModelKey = () => {
      const candidates = [
        overrides.modelKey,
        agentConfig?.modelKey,
        workspaceAIConfig?.modelKey,
        firstAvailableModel
      ].filter(Boolean); // 过滤掉空值

      // 找到第一个存在于模型列表中的候选项
      for (const modelKey of candidates) {
        if (modelKey && isModelAvailable(modelKey)) {
          return modelKey;
        }
      }

      // 如果都不可用，返回第一个可用模型
      return firstAvailableModel;
    };

    return {
      modelKey: findValidModelKey(),
      allowMCPs: overrides.allowMCPs || agentConfig?.allowMCPs || [],
      blockMCPTools: overrides.blockMCPTools || agentConfig?.blockMCPTools || [],
      isConfirmCallTool: overrides.isConfirmCallTool ?? agentConfig?.isConfirmCallTool ?? false,
      temperature: overrides.temperature ?? agentConfig?.temperature ?? workspaceAIConfig?.temperature,
      maxAttachedDialogs: overrides.maxAttachedDialogs ?? agentConfig?.maxAttachedDialogs ?? workspaceAIConfig?.maxAttachedDialogs ?? 5,
      maxTokens: overrides.maxTokens ?? agentConfig?.maxTokens ?? workspaceAIConfig?.maxTokens ?? 4000,
      compressionStrategy: overrides.compressionStrategy ?? agentConfig?.compressionStrategy ?? workspaceAIConfig?.compressionStrategy ?? "tokens",
      maxContextTokens: overrides.maxContextTokens ?? agentConfig?.maxContextTokens ?? workspaceAIConfig?.maxContextTokens,
      prompt: overrides.prompt || agentConfig?.prompt || workspaceAIConfig?.prompt || ""
    };
  };

  // 设置 allowMCPs 的帮助函数
  const setAllowMCPs = (allowMCPs: string[]) => {
    if (!currentChat.current.configOverrides) {
      currentChat.current.configOverrides = {};
    }
    currentChat.current.configOverrides.allowMCPs = allowMCPs;
  };


  // 设置 blockMCPTools 的帮助函数
  const setBlockMCPTools = (blockMCPTools: string[]) => {
    if (!currentChat.current.configOverrides) {
      currentChat.current.configOverrides = {};
    }
    currentChat.current.configOverrides.blockMCPTools = blockMCPTools;
  };



  // 加载状态从 chatStream 获取
  const loading = chatStream.loading;


  // 编辑器引用
  const editorRef = useRef<HyperChatEditorRef>(null);

  // 资源结果列表引用
  const resourceResListRef = useRef<(CommonContentItem & { uid: string })[]>([]);

  // 提示结果列表引用
  const promptResList = useRef<Array<any>>([]);

  /** 工具显示状态 */
  const [isToolsShow, setIsToolsShow] = useState(false);

  /** 设置模态框状态 */
  const [isSettingsShow, setIsSettingsShow] = useState(false);

  /** 手动压缩加载状态 */
  const [compressLoading, setCompressLoading] = useState(false);

  /** 设置表单 */
  const [settingsForm] = Form.useForm();

  // Modal实例和上下文holder
  const [modal, contextHolder] = Modal.useModal();
  // 保存设置
  const saveSettings = async (values: any) => {
    try {
      // 更新当前聊天配置
      if (!currentChat.current.configOverrides) {
        currentChat.current.configOverrides = {};
      }
      currentChat.current.configOverrides.temperature = values.temperature;
      currentChat.current.configOverrides.maxTokens = values.maxTokens;
      currentChat.current.configOverrides.maxAttachedDialogs = values.maxAttachedDialogs;
      currentChat.current.configOverrides.isConfirmCallTool = values.isConfirmCallTool;
      currentChat.current.configOverrides.allowMCPs = values.allowMCPs;
      currentChat.current.configOverrides.blockMCPTools = values.blockMCPTools;
      currentChat.current.configOverrides.modelKey = values.modelKey;
      currentChat.current.configOverrides.compressionStrategy = values.compressionStrategy;
      currentChat.current.configOverrides.maxContextTokens = values.maxContextTokens;

      setIsSettingsShow(false);
      refresh();
      message.success(t`Settings saved successfully`);
    } catch (error) {
      console.error("Failed to save settings:", error);
      message.error(t`Failed to save settings`);
    }
  };

  // 从localStorage加载发送历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('workspace-chat-send-history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        if (Array.isArray(history)) {
          sendHistoryRef.current = history.slice(-50); // 确保不超过50条
        }
      } catch (e) {
        console.error('Failed to load send history:', e);
      }
    }
  }, []);

  // 保存发送历史记录到localStorage
  const saveSendHistory = (history: string[]) => {
    try {
      localStorage.setItem('workspace-chat-send-history', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save send history:', e);
    }
  };

  // 添加消息到发送历史记录
  const addToSendHistory = (message: string) => {
    if (!message.trim()) return;

    // 如果消息已存在，先移除旧的
    const filtered = sendHistoryRef.current.filter(msg => msg !== message);
    // 添加到末尾，保持最多50条
    const newHistory = [...filtered, message].slice(-50);
    sendHistoryRef.current = newHistory;
    saveSendHistory(newHistory);

    // 重置历史记录索引
    historyIndexRef.current = -1;
  };

  // 处理键盘事件（上下箭头键导航历史记录）
  const handleKeyDown = (e: { key: string }) => {
    const history = sendHistoryRef.current;
    const currentIndex = historyIndexRef.current;

    if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        const newIndex = currentIndex === -1 ? history.length - 1 : Math.max(0, currentIndex - 1);
        historyIndexRef.current = newIndex;
        const historyMessage = history[newIndex];
        if (historyMessage !== undefined) {
          setValue(historyMessage);
          if (editorRef.current) editorRef.current.setValue(historyMessage);
        }
      }
    } else if (e.key === 'ArrowDown') {
      if (history.length > 0 && currentIndex >= 0) {
        const newIndex = currentIndex + 1;
        if (newIndex >= history.length) {
          historyIndexRef.current = -1;
          setValue("");
          if (editorRef.current) editorRef.current.setValue("");
        } else {
          historyIndexRef.current = newIndex;
          const historyMessage = history[newIndex];
          if (historyMessage !== undefined) {
            setValue(historyMessage);
            if (editorRef.current) editorRef.current.setValue(historyMessage);
          }
        }
      }
    }
  };

  // 同步 chatStream 消息到 currentChat
  useEffect(() => {
    if (chatStream.messages.length > 0) {
      currentChat.current.messages = chatStream.messages;
      refresh();
    }
  }, [chatStream.messages]);


  // 初始化
  useEffect(() => {
    (async () => {
      try {

        // 等待 AI 设置加载完成
        if (!aiSettings || aiSettingsLoading) {
          return;
        }

        // 初始化默认模型时不设置 configOverrides.modelKey
        // 让 getEffectiveConfig 处理优先级逻辑
        if (!currentChat.current.configOverrides) {
          currentChat.current.configOverrides = {};
        }
        const agent = workspaceDetails.agents.find(a => a.config.name === agentName);
        // 如果有要加载的聊天记录，优先加载聊天记录
        if (chatLogToLoad) {
          defaultChatValue.current = ({
            ...defaultChatValue.current,
            ...(chatLogToLoad as any)
          });
          currentChatReset({
            messages: chatLogToLoad.messages || [],
          });
        }
        // 否则如果指定了agentName，使用Agent配置
        else if (agentName && agent) {

          defaultChatValue.current = ({
            ...defaultChatValue.current,
            agentName: agentName,
            messages: [],
            configOverrides: {
              allowMCPs: agent.config.allowMCPs || [],
              blockMCPTools: agent.config.blockMCPTools || [],
              // 不设置 modelKey，让 getEffectiveConfig 处理优先级
              temperature: agent.config.temperature,
              isConfirmCallTool: agent.config.isConfirmCallTool || false,
              maxAttachedDialogs: agent.config.maxAttachedDialogs || 5,
              compressionStrategy: agent.config.compressionStrategy,
              maxContextTokens: agent.config.maxContextTokens,
              prompt: agent.config.prompt || ""
            }
          });

          currentChatReset({});
        } else {
          currentChatReset({});
        }

        refresh();
      } catch (error) {
        console.error("Failed to initialize workspace chat:", error);
      }
    })();
  }, [workspace, agentName, chatLogToLoad, aiSettings, aiSettingsLoading]);

  /**
   * 重置当前聊天配置
   */
  const currentChatReset = async (
    newConfig: Partial<ChatHistoryItem>,
  ) => {

    currentChat.current = {
      ...defaultChatValue.current,
      ...newConfig,
    };

    // 同步到 chatStream
    chatStream.setMessages(currentChat.current.messages || []);

    resourceResListRef.current = [];
    promptResList.current = [];

    refresh();
  };
  /**
   * 处理用户请求的核心函数
   */
  const onRequest = useCallback(async (content?: string) => {
    try {
      if (!aiSettings) {
        throw new Error("AI settings not loaded");
      }

      const effectiveConfig = getEffectiveConfig();
      let config = aiSettings.models?.find(
        (x: any) => x.key == effectiveConfig.modelKey,
      );
      if (config == null) {
        if (!aiSettings.models || aiSettings.models.length == 0) {
          throw new Error("Please add LLM first");
        } else {
          throw new Error(t`Model not found, please select a model`);
        }
      }
      let userMessage: MyMessage = {
        role: "user",
        content: content || value,
        content_date: Date.now(),
      }

      // 使用 chatStream 开始流式聊天
      await chatStream.startChatStream(
        currentChat.current.key,
        currentChat.current.messages,
        currentChat.current.configOverrides || {},
        userMessage.content ? userMessage : undefined,
      );

      currentChat.current.label = currentChat.current.label || getLabelByFirstUserContent([...currentChat.current.messages, userMessage]) || t`Untitled Chat`;

      if (agent) {
        addChatRecentUsage(
          workspace.path,
          agentName,
          currentChat.current.key,
          currentChat.current.label || 'Untitled Chat'
        );
      }

      // 清空资源列表
      resourceResListRef.current = [];
      promptResList.current = [];

      refresh();

    } catch (e) {
      console.error(e);
      message.error(
        e instanceof Error ? e.message : t`An error occurred, please try again later`,
      );
    }
  }, [workspace, agentName, aiSettings, aiSettingsLoading, chatStream]);

  // 手动压缩记忆处理函数
  const handleManualCompress = useCallback(async () => {
    if (!chatStream.messages.length || compressLoading) return;

    setCompressLoading(true);
    try {
      const effectiveConfig = getEffectiveConfig();
      await chatStream.compressMemory(currentChat.current.key, effectiveConfig);
      
      message.success(t`Memory compression completed successfully`);
    } catch (error) {
      console.error('Memory compression failed:', error);
      message.error(
        error instanceof Error ? 
          `${t`Memory compression failed:`} ${error.message}` : 
          t`Memory compression failed, please try again later`
      );
    } finally {
      setCompressLoading(false);
    }
  }, [chatStream, compressLoading, getEffectiveConfig]);

  // 获取当前模型配置
  const effectiveConfigForModel = getEffectiveConfig();
  let currModel = aiSettings ? (
    aiSettings.models?.find((x) => x.key == effectiveConfigForModel.modelKey) ||
    getDefaultModelFromSettings(aiSettings)
  ) : null;

  /** 是否支持图片 */
  let supportImage = currModel?.supportImage;
  /** 是否支持工具 */
  let supportTool = currModel?.supportTool;
  const agent = workspaceDetails.agents.find(a => a.config.name === agentName);

  // 提取系统消息
  const systemMessages = currentChat.current.configOverrides?.prompt!;
  // 使用 chatStream 的消息或当前聊天的消息
  const allMessages = chatStream.messages.length > 0 ? chatStream.messages : currentChat.current.messages;
  // 过滤掉系统消息的其他消息
  const nonSystemMessages = allMessages?.filter(m => m.role !== "system") || [];

  return (
    <div className="workspace-chat h-full">
      <XProvider>
        <div className="h-full flex flex-col">
          {/* 系统提示词显示区域 */}
          {systemMessages.length > 0 && (
            <div className="flex-shrink-0 border-b bg-blue-50 p-1">
              <div className="text-sm font-medium text-blue-300 mb-2 flex items-center">
                <Icon name="brain" className="mr-2" />
                <span className="mr-2 text-blue-700">
                  {agentName ? (agent?.config.name || t`Agent Chat`) : t`Workspace Chat`}
                </span>
              </div>

              <div className="text-sm line-clamp-1 text-gray-700 bg-white p-0 rounded border border-blue-200">
                {systemMessages}
              </div>

            </div>
          )}

          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-auto p-0">
            {(nonSystemMessages.length == 0) && (
              <>
                <Welcome
                  icon={agentName ? "🤖" : "💬"}
                  title={t`Welcome Chat`}
                  className="mb-4"
                  description={agentName ? t`Chatting with agent` : t`Start chatting in your workspace`}
                />
              </>
            )}

            <Messages
              messages={nonSystemMessages}
              onSumbit={(messages) => {
                // 合并系统消息和用户提交的消息
                currentChat.current.messages = [...messages];
                // 同步到 chatStream
                chatStream.setMessages([...messages]);
                refresh();
                onRequest();
              }}
              status={loading ? "runing" : "stop"}
            />
          </div>

          {/* 操作栏 */}
          <div className="flex-shrink-0 border-t p-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <Tooltip title={t`New Chat`}>
                  <Button
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={() => {
                      currentChatReset({
                        messages: [],
                      });
                    }}
                  />
                </Tooltip>
                <Divider type="vertical" />

                <Tooltip title={t`Select LLM`}>
                  <span className="inline-block">
                    <Icon name="brain" />{" "}
                    <Select
                      size="small"
                      showSearch
                      optionFilterProp="label"
                      placeholder={
                        aiSettings && aiSettings.models && aiSettings.models.length > 0
                          ? `${currModel?.provider || 'unknown'}:${currModel?.name || 'unknown'}`
                          : "Please add a LLM model"
                      }
                      className="w-64"
                      // allowClear
                      disabled={aiSettingsLoading}
                      value={effectiveConfigForModel.modelKey}
                      onChange={(value) => {
                        if (!currentChat.current.configOverrides) {
                          currentChat.current.configOverrides = {};
                        }
                        currentChat.current.configOverrides.modelKey = value;
                        refresh();
                      }}
                      options={aiSettings ? getGroupedModelOptions(aiSettings) : []}
                    />
                  </span>
                </Tooltip>
              </div>

              <div className="flex items-center space-x-2">
                <Tooltip title={t`Settings`}>
                  <Button
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => {
                      // 打开设置模态框时，设置当前表单值
                      const currentEffectiveConfig = getEffectiveConfig();
                      settingsForm.resetFields();
                      settingsForm.setFieldsValue({
                        modelKey: currentEffectiveConfig.modelKey,
                        temperature: currentEffectiveConfig.temperature ?? 1,
                        maxTokens: currentEffectiveConfig.maxTokens ?? 4000,
                        maxAttachedDialogs: currentEffectiveConfig.maxAttachedDialogs ?? 5,
                        isConfirmCallTool: currentEffectiveConfig.isConfirmCallTool ?? false,
                        allowMCPs: currentEffectiveConfig.allowMCPs || [],
                        blockMCPTools: currentEffectiveConfig.blockMCPTools || [],
                        compressionStrategy: currentEffectiveConfig.compressionStrategy ?? "tokens",
                        maxContextTokens: currentEffectiveConfig.maxContextTokens,
                      });
                      setIsSettingsShow(true);
                    }}
                  />
                </Tooltip>
              </div>
            </div>
            <MyAttachR
              resourceResList={resourceResListRef.current}
              resourceResListRemove={(x) => {
                resourceResListRef.current =
                  resourceResListRef.current.filter((v) => v.uid != x.uid);
                refresh();
                message.success(t`Delete Success`);
              }}
              promptResList={promptResList.current}
              promptResListRemove={(x) => {

                promptResList.current = promptResList.current.filter((v) => v.uid != x.uid);
                refresh();
                message.success(t`Delete Success`);
              }}
            ></MyAttachR>
            {/* Token使用信息 */}
            {chatStream.tokenUsage && (
              <div style={{ 
                padding: '8px 12px',
                marginBottom: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                fontSize: '12px'
              }}>
                <Flex justify="space-between" align="center">
                  <Space size={8}>
                    <InfoCircleOutlined style={{ color: '#6c757d' }} />
                    <span style={{ color: '#495057', fontWeight: 500 }}>
                      {chatStream.tokenUsage.strategy === 'tokens' ? 
                        `${t`Token Usage`}: ${chatStream.tokenUsage.current.toLocaleString()} / ${chatStream.tokenUsage.max.toLocaleString()}` :
                        `${t`Dialog Rounds`}: ${chatStream.tokenUsage.current} / ${chatStream.tokenUsage.max}`
                      }
                    </span>
                    <Progress 
                      percent={chatStream.tokenUsage.percentage} 
                      size="small"
                      strokeColor={
                        chatStream.tokenUsage.percentage >= 90 ? '#ff4d4f' :
                        chatStream.tokenUsage.percentage >= 80 ? '#faad14' :
                        '#52c41a'
                      }
                      showInfo={false}
                      style={{ width: '80px', minWidth: '80px' }}
                    />
                    <span style={{ 
                      color: chatStream.tokenUsage.percentage >= 90 ? '#ff4d4f' :
                             chatStream.tokenUsage.percentage >= 80 ? '#faad14' :
                             '#52c41a',
                      fontWeight: 500
                    }}>
                      {chatStream.tokenUsage.percentage}%
                    </span>
                  </Space>
                  <Tooltip title={
                    chatStream.tokenUsage.percentage >= 80 ? 
                      (chatStream.tokenUsage.percentage >= 90 ? `⚠️ ${t`Memory compression will be triggered soon`}` : `⚡ ${t`Approaching compression threshold`}`) :
                      t`Manually compress memory`
                  }>
                    <Button
                      size="small"
                      type={chatStream.tokenUsage.percentage >= 80 ? 'primary' : 'default'}
                      icon={<CompressOutlined />}
                      loading={compressLoading}
                      onClick={handleManualCompress}
                      disabled={chatStream.messages.length <= 1}
                    >
                      {t`Compress`}
                    </Button>
                  </Tooltip>
                </Flex>
              </div>
            )}

            {/* 发送框 */}
            <div className="my-sender-container">
              <HyperChatEditor
                ref={editorRef}
                value={value}
                onChange={(nextVal) => {
                  setValue(nextVal);
                }}
                onSubmit={(s) => {
                  if (s == "") return;
                  if (loading) {
                    message.warning(t`Please wait for the current request to finish`);
                    return;
                  }
                  if (aiSettingsLoading) {
                    message.warning(t`AI settings are loading, please wait...`);
                    return;
                  }
                  addToSendHistory(s);
                  onRequest(s);
                  setValue("");
                  editorRef.current?.setValue("");
                }}
                onDragFile={async (file: File) => {
                  if (!file) return;

                  if ((file as any).path) {
                    editorRef.current?.insertTextAtCursor((file as any).path);
                  } else {
                    if (file.type.includes("image")) {
                      let path = await blobToBase64(file);
                      resourceResListRef.current.push({
                        type: "image_url",
                        image_url: {
                          url: path,
                        },
                        uid: v4(),
                      });
                      refresh();
                    } else {
                      message.warning(t`please upload image`);
                    }
                  }
                }}
                onParseFile={async (file) => {
                  if (!file) return;

                  if (file.type.includes("image")) {
                    let path = await blobToBase64(file);
                    resourceResListRef.current.push({
                      type: "image_url",
                      image_url: {
                        url: path,
                      },
                      uid: v4(),
                    });
                    refresh();
                  } else {
                    message.warning(t`please upload image`);
                  }
                }}
                onKeyDown={handleKeyDown}
                submitType="enter"
                autoHeight
                rows={1}
                maxRows={10}
                fontSize={16}
                lineHeight={28}
                placeholder={t`Start inputting...`}
                style={{
                  border: "0px",
                  padding: "8px 0px 8px",
                }}
              />
              {/* 发送区域操作栏 */}
              <div className="flex justify-between items-center p-2 border-t bg-gray-50 rounded-b">
                <Flex align="center" gap={8}>

                  <Upload
                    disabled={!supportImage}
                    className={`${!supportImage ? 'pointer-events-none opacity-50 text-gray-400' : ''}`}
                    accept="image/*"
                    fileList={[]}
                    beforeUpload={async (file) => {
                      if (file.type.includes("image")) {
                        let path = await blobToBase64(file);
                        resourceResListRef.current.push({
                          type: "image_url",
                          image_url: {
                            url: await urlToBase64(path),
                          },
                          uid: v4(),
                        });
                        refresh();
                      } else {
                        message.warning(t`please upload image`);
                      }
                      return false;
                    }}
                  >
                    <Tooltip title={t`Upload Image`}>
                      <Button
                        type="text"
                        icon={<LinkOutlined />}
                        size="small"
                      />
                    </Tooltip>
                  </Upload>
                  <Tooltip title={t`MCP and Tools`} placement="bottom">
                    <div>
                      {supportTool == null || supportTool == true ? (
                        <Space.Compact>
                          <Button onClick={() => {
                            setIsToolsShow(true);
                          }} type="dashed" icon={<Icon name="mcp" ></Icon>}>


                            {(() => {
                              // let set = new Set();
                              // for (let tool_name of getAllowMCPs()) {
                              //   let [name, _] = tool_name.split(" > ");
                              //   set.add(name);
                              // }
                              // let loading = mcpClients.filter((v) => v.status == "connecting").length > 0;
                              // let load = mcpClients.filter(
                              //   (v) => v.status == "connected",
                              // ).length;
                              // let all = mcpClients.filter(x => x.status !== "disabled").length;
                              let len = mcpClients.filter((v) => {
                                return effectiveConfigForModel.allowMCPs.includes(v.serverName);
                              }).length;
                              return len;
                            })()}
                            <Icon name="chuizi-copy" ></Icon>{

                              (() => {
                                let tools: IMCPClient["tools"] = [];

                                mcpClients.filter(x => effectiveConfigForModel.allowMCPs.includes(x.serverName)).forEach((v) => {
                                  tools = tools.concat(
                                    v.tools.filter((t) => {
                                      return !effectiveConfigForModel.blockMCPTools.includes(t.displayName);
                                    }),
                                  );
                                });
                                return (
                                  <>
                                    {tools.length}
                                  </>
                                )
                              })()
                            }
                          </Button>

                        </Space.Compact>
                      ) : (
                        <>  <Button
                          size="small"
                          type="text"
                          icon={<Icon name="mcp"></Icon>}
                          onClick={() => { }}
                        >{t`LLM not support`}</Button>  </>
                      )}
                    </div>
                  </Tooltip>

                  {/* 附件显示区域
                  {resourceResListRef.current.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {resourceResListRef.current.length} {t`attachments`}
                    </span>
                  )} */}
                </Flex>

                <Flex align="center" gap={8}>
                  {loading && (
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        chatStream.cancelChatStream(currentChat.current.key);
                      }}
                    >
                      {t`Cancel`}
                    </Button>
                  )}

                  <Button
                    type="primary"
                    size="small"
                    icon={loading ? <LoadingOutlined /> : <SendOutlined />}
                    loading={loading}
                    disabled={!value.trim() || loading || aiSettingsLoading}
                    onClick={() => {
                      if (value.trim()) {
                        if (aiSettingsLoading) {
                          message.warning(t`AI settings are loading, please wait...`);
                          return;
                        }
                        addToSendHistory(value);
                        onRequest(value);
                        setValue("");
                        editorRef.current?.setValue("");
                      }
                    }}
                  >
                    {aiSettingsLoading ? t`Loading Settings...` : loading ? t`Sending` : t`Send`}
                  </Button>
                </Flex>
              </div>
            </div>
          </div>
        </div>
      </XProvider >

      <Modal
        width={1000}
        open={isToolsShow}
        onCancel={() => setIsToolsShow(false)}
        maskClosable
        title={t`MCP Tool Selection`}
        footer={[
          <Button
            key="1"
            type="primary"
            onClick={() => {
              setIsToolsShow(false);
            }}
          >
            {t`OK`}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {t`Select MCP clients and tools. Unchecked tools from selected clients will be blocked.`}
          </p>
        </div>
        <Tree
          checkable
          selectedKeys={[]}
          onCheck={(checkedKeys) => {
            // 使用新的转换逻辑
            const selectedValues = checkedKeys as string[];
            const { allowMCPs, blockMCPTools } = convertTreeSelectionToMCPConfig(selectedValues, mcpClients);

            // 更新配置
            setAllowMCPs(allowMCPs);
            setBlockMCPTools(blockMCPTools);

            refresh();
          }}
          checkedKeys={(() => {
            // 将当前配置转换为 Tree 选中状态
            const currentAllowMCPs = getEffectiveConfig().allowMCPs;
            const currentBlockMCPTools = getEffectiveConfig().blockMCPTools;
            return convertMCPConfigToTreeSelection(currentAllowMCPs, currentBlockMCPTools, mcpClients);
          })()}
          treeData={mcpClients.filter(x => x.status != "disabled").map((x) => {
            return {
              title: (<Tooltip title={x.serverName}>
                <span>
                  {x.serverName}{" "}{x.mcpType == "builtin" ? <Tag color="blue">{t`built-in`}</Tag> : null}
                  {x.status == "connected" ? null : x.status ==
                    "connecting" ? (
                    <SyncOutlined spin className="m-1 text-blue-400" />
                  ) : (
                    x.mcpType !== "builtin" ? <Button
                      className="m-1"
                      size="small"
                      onClick={async () => {
                        x.status = "connecting";
                        refresh();
                        await call("startWorkspaceMcpClient", { clientName: x.serverName });
                      }}
                    >{t`Reload`}</Button> : <DisconnectOutlined className="text-red-400" />
                  )}
                </span></Tooltip>
              ),
              key: x.serverName,
              children: x.tools.map((tool) => {
                return {
                  title: (
                    <Tooltip title={tool.description}>
                      <span>
                        {tool.originalName || tool.name}
                      </span>
                    </Tooltip>
                  ),
                  key: tool.displayName,
                  isLeaf: true,
                };
              }),
            };
          })}
        />
      </Modal>

      {/* HOOK */}
      {contextHolder}

      {/* 设置模态框 */}
      <Modal
        title={t`Chat Settings`}
        open={isSettingsShow}
        onCancel={() => setIsSettingsShow(false)}
        onOk={() => { settingsForm.submit() }}
        width={600}
      >
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={saveSettings}
        >
          {AgentCommonFormItems}
        </Form>
      </Modal>
    </div >
  );
};

function getTools(mcpClients: IMCPClient[], allowMCPs?: string[], blockMCPTools?: string[]): HyperChatCompletionTool[] {
  return filterMCPTools(mcpClients, allowMCPs, blockMCPTools) as HyperChatCompletionTool[];
}

function getLabelByFirstUserContent(messages: Array<MyMessage>): string {
  let label = "";
  let firstUser = messages.find(
    (x) => x.role == "user",
  );
  let firstUserContent = (firstUser as any)?.content;
  if (typeof firstUserContent == "string") {
    label = firstUserContent;
  } else if (Array.isArray(firstUserContent)) {
    label = firstUserContent.find((x) => x.type == "text")?.text || "";
  }
  return label;
}