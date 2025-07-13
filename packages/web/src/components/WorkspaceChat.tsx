/**
 * @fileoverview 工作区聊天组件
 * 
 * 专门用于工作区中间位置的聊天界面，包含：
 * 1. 聊天消息显示
 * 2. 操作栏（模型选择、设置等）
 * 3. 发送框
 */
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import React, {
  useCallback,
  useContext,
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
  theme,
  Form,
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
} from "@ant-design/icons";

import { v4 } from "uuid";
import { call, getURL_PRE } from "../common/call";
import { addChatRecentUsage } from "../utils/storage";

import { AiChannel } from "@dadigua/hyperchat-shared/ai";
import {
  ChatHistoryItem,
} from "@dadigua/hyperchat-shared/types";
import type { AISettings, AIModelConfigItem } from "@dadigua/hyperchat-shared";
import { useAISettings } from "../contexts/AppSettingsContext";
import { MyMessage } from "@dadigua/hyperchat-shared/types";
import { Messages } from "./messages";
import { Icon } from "./icon";
import { Editor } from "./editor";
import { t } from "../i18n";
import { blobToBase64, getMyUuid, JsonSchema2FormItemOrNull, urlToBase64 } from "../common/util";
import { HeaderContext } from "../common/context";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { MyAttachR } from "./attachR";
import { WorkspaceDetails, WorkspaceInfo } from "../pages/workspace/types";
import { AllMessage, CommonContent, CommonContentItem, HyperChatCompletionTool, IMCPClient, Tool_Call } from "@dadigua/hyperchat-shared/types";
import { NumberStep } from "../common/numberStep";
import { AgentCommonFormItems } from "./AgentManagement";

/**
 * 工作区聊天组件的Props类型定义
 */
interface WorkspaceChatProps {
  /** 工作区信息 */
  workspace: WorkspaceInfo;
  /** 指定的Agent Key，用于Agent聊天 */
  agentKey?: string;
  workspaceDetails: WorkspaceDetails;
  mcpClients: IMCPClient[];
  /** 要加载的特定聊天记录 */
  chatLogToLoad?: ChatHistoryItem;
}

/**
 * 工作区聊天组件
 */
export const WorkspaceChat = ({ workspace, agentKey, workspaceDetails, mcpClients, chatLogToLoad }: WorkspaceChatProps) => {
  // 使用强制刷新 hook
  const refresh = useForceUpdate();

  // 从上下文获取全局状态和MCP客户端
  const context = useContext(HeaderContext);
  const { globalState, updateGlobalState } = context || {};

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
        label: model.name,
        value: model.key,
      }))
    }));
  };

  // AI通道客户端引用
  const aiClientRef = useRef<AiChannel>(new AiChannel({}));

  // 输入框的值
  const [value, setValue] = useState("");

  // 发送历史记录管理
  const sendHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);

  // 默认聊天配置
  const defaultChatValue = useRef({
    label: "",
    key: "",
    messages: [] as MyMessage[],
    modelKey: "",
    agentKey: "",
    allowMCPs: [] as string[],
    dateTime: Date.now(),
    chatType: "user" as const, // "user" | "task" | "called"
    confirm_call_tool: false,
    temperature: undefined as number | undefined,
    attachedDialogueCount: 5
  });

  // 当前聊天引用
  const currentChat = useRef<ChatHistoryItem>(defaultChatValue.current);

  // 加载状态
  const [loading, setLoading] = useState(false);

  // AI通道缓存对象
  let cacheOBJ = useRef({} as Record<string, AiChannel>);

  // 编辑器引用
  const editorRef = useRef<any>(null);

  // 资源结果列表引用
  const resourceResListRef = useRef<(CommonContentItem & { uid: string })[]>([]);

  // 提示结果列表引用
  const promptResList = useRef<Array<any>>([]);

  /** 工具显示状态 */
  const [isToolsShow, setIsToolsShow] = useState(false);

  /** 设置模态框状态 */
  const [isSettingsShow, setIsSettingsShow] = useState(false);

  /** 设置表单 */
  const [settingsForm] = Form.useForm();

  // Modal实例和上下文holder
  const [modal, contextHolder] = Modal.useModal();
  // 保存设置
  const saveSettings = async (values: any) => {
    try {
      // 更新当前聊天配置
      currentChat.current.temperature = values.temperature;
      currentChat.current.attachedDialogueCount = values.attachedDialogueCount;
      currentChat.current.confirm_call_tool = values.confirm_call_tool;
      if (currentChat.current.key == "") {
        return;
      }
      // 保存到持久化存储
      if (agentKey && workspace?.path) {
        await call("saveAgentChatLog", {
          agentKey: agentKey,
          chatLog: currentChat.current
        });
      }

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

  // 初始化
  useEffect(() => {
    (async () => {
      try {

        // 等待 AI 设置加载完成
        if (!aiSettings || aiSettingsLoading) {
          return;
        }

        const defaultModel = getDefaultModelFromSettings(aiSettings);
        currentChat.current.modelKey = defaultModel?.key || "";
        const agent = workspaceDetails[workspace.path]?.agents.find(a => a.config.key === agentKey);
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
        // 否则如果指定了agentKey，使用Agent配置
        else if (agentKey && agent) {

          defaultChatValue.current = ({
            ...defaultChatValue.current,
            agentKey: agentKey,
            messages: [{
              role: "system" as const,
              content_template: agent.config.prompt || "",
              content_date: Date.now(),
              content: "",
            }],
            allowMCPs: agent.config.allowMCPs || [],
            modelKey: agent.config.modelKey || defaultModel?.key || "",
            temperature: agent.config.temperature,
            confirm_call_tool: agent.config.confirm_call_tool || false,
            attachedDialogueCount: agent.config.attachedDialogueCount || 5,
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
  }, [workspace, agentKey, chatLogToLoad, aiSettings, aiSettingsLoading]);

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

    resourceResListRef.current = [];
    promptResList.current = [];

    refresh();
  };
  let confirm_call_tool_cb = (tool: Tool_Call): Promise<any> => {
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
                  )?.restore_name || tool.function.name}
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
                        currentChat.current.confirm_call_tool = false;
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
  /**
   * 处理用户请求的核心函数
   */
  const onRequest = useCallback(async (content?: string) => {

    let aiClient = aiClientRef.current;
    try {
      setLoading(true);

      if (!aiSettings) {
        throw new Error("AI settings not loaded");
      }

      let config = aiSettings.models?.find(
        (x) => x.key == currentChat.current.modelKey,
      );
      if (config == null) {
        if (!aiSettings.models || aiSettings.models.length == 0) {
          throw new Error("Please add LLM first");
        } else {
          throw new Error(t`Model not found, please select a model`);
        }
      }

      aiClient.messages = currentChat.current.messages;

      if (content) {
        aiClient.addMessage(
          {
            role: "user",
            content: "",
            content_template: content,
            content_date: new Date().getTime(),
          },
          resourceResListRef.current,
          promptResList.current,
        );
      }

      // 处理变量模板
      for (let m of aiClient.messages) {
        if (m.role == "user" || m.role == "system") {
          if (!m.content_sended && m.content_template) {
            if (typeof m.content == "string") {
              m.content = m.content_template;
            }
            m.content_sended = true;
          }
        }
      }
      function getFirstUserContent() {
        let label = currentChat.current.label.toString();
        let firstUser = aiClient.messages.find(
          (x) => x.content_attached != false && x.role == "user",
        );
        let firstUserContent = (firstUser as AllMessage)?.content;
        if (typeof firstUserContent == "string") {
          label = firstUserContent;
        } else if (Array.isArray(firstUserContent)) {
          label = firstUserContent.find((x) => x.type == "text")?.text || "";
        } else {
          label = (firstUserContent as any).toString() || "New Chat";
        }
        return label;
      }

      currentChat.current.key = currentChat.current.key || getMyUuid();
      currentChat.current.label = currentChat.current.label || getFirstUserContent() || "New Chat";
      currentChat.current.messages = aiClient.messages;
      currentChat.current.dateTime = Date.now();


      refresh();

      let mcpTools = getTools(mcpClients, currentChat.current.allowMCPs);
      // console.log("MCP Tools:", mcpTools);
      aiClient.register({
        antdmessage: {
          warning: message.warning,
        },
        mcpTools: mcpTools,
        platform: "web",
        getURL_PRE: getURL_PRE,
        aiSettings: aiSettings as any,
        compressionConfig: {
          enabled: currentChat.current.attachedDialogueCount! > 0 ? true : false,
          userMessageThreshold: currentChat.current.attachedDialogueCount || 5,    // 用户消息达到5条时触发压缩
          compressionStrategy: "summary",
        }
      })

      await aiClient.completion({
        modelKey: config?.key || "",
        allowMCPs: currentChat.current.allowMCPs,
        confirm_call_tool: currentChat.current.confirm_call_tool,
        confirm_call_tool_cb,
        onUpdate: (r) => {
          if (r && r.type == "compress") {
            currentChat.current.label = r.data.title || currentChat.current.label;
          }
          Object.assign(currentChat.current.messages, aiClient.messages);
          refresh();
        }
      }, {
        ...(currentChat.current.temperature !== undefined ? { temperature: currentChat.current.temperature } : {}),
      });

      resourceResListRef.current = [];
      promptResList.current = [];

      Object.assign(currentChat.current.messages, aiClient.messages)
      refresh();

      // 保存聊天记录
      if (agentKey) {
        // 如果是 Agent 聊天，保存到 Agent 的聊天记录中
        await call("saveAgentChatLog", {
          agentKey: agentKey,
          chatLog: currentChat.current
        });
      }

      // 更新最近使用记录
      if (workspace?.path && agentKey && currentChat.current.key) {
        const agent = workspaceDetails[workspace.path]?.agents.find(a => a.config.key === agentKey);
        const agentName = agent?.config.name || agentKey;
        const chatLabel = currentChat.current.label || 'New Chat';

        addChatRecentUsage(
          workspace.path,
          agentKey,
          agentName,
          currentChat.current.key,
          chatLabel
        );
      }


    } catch (e) {
      console.error(e);
      if (aiClient && aiClient.lastMessage) {
        aiClient.lastMessage.content_error = e instanceof Error ? e.message : String(e);
        Object.assign(currentChat.current.messages, aiClient.messages);
        refresh();
      }
      message.error(
        e instanceof Error ? e.message : t`An error occurred, please try again later`,
      );
    } finally {
      setLoading(false);
    }
  }, [workspace, agentKey, aiSettings, aiSettingsLoading]);

  // 获取当前模型配置
  let currModel = aiSettings ? (
    aiSettings.models?.find((x) => x.key == currentChat.current.modelKey) ||
    getDefaultModelFromSettings(aiSettings)
  ) : null;

  /** 是否支持图片 */
  let supportImage = currModel?.supportImage;
  /** 是否支持工具 */
  let supportTool = currModel?.supportTool;
  const { token } = theme.useToken();
  const agent = workspaceDetails[workspace.path]?.agents.find(a => a.config.key === agentKey);

  // 提取系统消息
  const systemMessages = currentChat.current.messages?.filter(m => m.role === "system") || [];
  // 过滤掉系统消息的其他消息
  const nonSystemMessages = currentChat.current.messages?.filter(m => m.role !== "system") || [];

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
                  {agentKey ? (agent?.config.name || t`Agent Chat`) : t`Workspace Chat`}
                </span>
              </div>
              {systemMessages.map((msg, index) => (
                <div key={index} className="text-sm line-clamp-1 text-gray-700 bg-white p-0 rounded border border-blue-200">
                  {msg.content_template || msg.content}
                </div>
              ))}
            </div>
          )}

          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-auto p-4">
            {(nonSystemMessages.length == 0) && (
              <>
                <Welcome
                  icon={agentKey ? "🤖" : "💬"}
                  title={t`Welcome Chat`}
                  className="mb-4"
                  description={agentKey ? t`Chatting with agent` : t`Start chatting in your workspace`}
                />
              </>
            )}

            <Messages
              messages={nonSystemMessages}
              onSumbit={(messages) => {
                // 合并系统消息和用户提交的消息
                currentChat.current.messages = [...systemMessages, ...messages];
                refresh();
                onRequest();
              }}
              {...(aiClientRef.current?.status ? { status: aiClientRef.current.status } : {})}
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
                        messages: currentChat.current.messages.filter((x => x.role == "system")),
                      });
                    }}
                  />
                </Tooltip>
                {/* 
                <Tooltip title={t`Clear Context`}>
                  <Button
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={() => {
                      calcAttachDialogue(
                        currentChat.current.messages,
                        0,
                        true,
                      );
                      refresh();
                    }}
                  />
                </Tooltip> */}

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
                      value={currentChat.current.modelKey}
                      onChange={(value) => {
                        currentChat.current.modelKey = value;
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
                      settingsForm.setFieldsValue({
                        modelKey: currentChat.current.modelKey,
                        temperature: currentChat.current.temperature ?? 1,
                        attachedDialogueCount: currentChat.current.attachedDialogueCount ?? 10,
                        confirm_call_tool: currentChat.current.confirm_call_tool ?? false,
                        allowMCPs: currentChat.current.allowMCPs || [],
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
            {/* 发送框 */}
            <div className="my-sender-container">
              <Editor
                onDragFile={async (file: any) => {
                  if (!file) return;

                  if (file.path) {
                    editorRef.current?.insertTextAtCursor(file.path);
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
                submitType="enter"
                ref={editorRef}
                style={{
                  border: "0px",
                  padding: "8px 0px 8px",
                }}
                autoHeight
                rows={1}
                maxRows={10}
                value={value}
                onChange={(nextVal) => {
                  setValue(nextVal);
                }}
                onKeyDown={handleKeyDown}
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
                fontSize={16}
                lineHeight={28}
                placeholder={t`Start inputting...`}
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

                    {supportTool == null || supportTool == true ? (
                      <Space.Compact>
                        <Button onClick={() => {
                          setIsToolsShow(true);
                        }} type="dashed" icon={<Icon name="mcp" ></Icon>}>


                          {(() => {
                            let set = new Set();
                            for (let tool_name of currentChat.current.allowMCPs) {
                              let [name, _] = tool_name.split(" > ");
                              set.add(name);
                            }
                            let loading = mcpClients.filter((v) => v.status == "connecting").length > 0;
                            let load = mcpClients.filter(
                              (v) => v.status == "connected",
                            ).length;
                            let all = mcpClients.filter(x => x.status !== "disabled").length;
                            let curr = mcpClients.filter((v) => {
                              return v.status !== "disabled" && set.has(v.serverName);
                            }).length;

                            return loading ? (
                              <>
                                {`${curr} `}
                                <SyncOutlined spin />
                                {`(${load}/${all})`}
                              </>
                            ) : curr
                          })()}
                          <Icon name="chuizi-copy" ></Icon>{

                            (() => {
                              let tools: IMCPClient["tools"] = [];

                              mcpClients.forEach((v) => {
                                tools = tools.concat(
                                  v.tools.filter((t) => {

                                    return (
                                      currentChat.current.allowMCPs.includes(t.clientName) || currentChat.current.allowMCPs.includes(t.restore_name)
                                    );
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
                        setLoading(false);
                        aiClientRef.current?.cancel();
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
        title={t`MCP Tool`}
        // onOk={() => setIsToolsShow(false)}
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
      // cancelButtonProps={{ style: { display: "none" } }}
      >
        <Tree
          checkable
          selectedKeys={[]}
          onSelect={(selectedKeys, info) => {
            // console.log("onSelect", selectedKeys, info);
            let [clientName, _] = (selectedKeys[0] as string || "").split(" > ");
            clientName = clientName || "";
            if (info.node.isLeaf) {

              if (info.node.checked) {
                currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => x != selectedKeys[0]);
                if (clientName) {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => x != clientName);
                }
              } else {
                currentChat.current.allowMCPs.push(selectedKeys[0] as string);
              }
            } else {
              if (info.node.halfChecked || info.node.checked == false) {
                if (clientName) {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => !x.startsWith(clientName));
                }
                currentChat.current.allowMCPs.push(info.node.key);
                info.node.children.forEach((x) => {
                  currentChat.current.allowMCPs.push(x.key as string);
                });
              } else {
                if (clientName) {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => !x.startsWith(clientName));
                }
              }
            }

            refresh();
          }}
          onCheck={(checkedKeys) => {
            // console.log("onCheck", checkedKeys);
            currentChat.current.allowMCPs = checkedKeys as string[];
            refresh();
          }}
          checkedKeys={currentChat.current.allowMCPs}
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
                      <span
                      >
                        {tool.origin_name || tool.name}
                      </span>
                    </Tooltip>
                  ),
                  key: tool.restore_name,
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
        onOk={() => settingsForm.submit()}
        width={600}
        destroyOnClose
      >
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={saveSettings}
          preserve={false}
        >
          {AgentCommonFormItems}
        </Form>
      </Modal>
    </div >
  );
};

function getTools(mcpClients: IMCPClient[], allowMCPs?: string[]): HyperChatCompletionTool[] {
  let tools: HyperChatCompletionTool[] = [];

  mcpClients.forEach((v) => {
    tools = tools.concat(
      v.tools.filter((t) => {
        if (!allowMCPs) return true;
        return (
          allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
        );
      }),
    );
  });
  return tools;
}