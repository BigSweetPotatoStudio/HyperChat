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
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Button,
  Divider,
  Flex,
  Select,
  Tooltip,
  Upload,
  message,
  theme,
} from "antd";
import {
  Sender,
  Welcome,
  XProvider,
} from "@ant-design/x";
import {
  LinkOutlined,
  SettingOutlined,
  PlusCircleOutlined,
  ClearOutlined,
  LoadingOutlined,
  SendOutlined,
} from "@ant-design/icons";

import { v4 } from "uuid";
import { call } from "../common/call";
import { blobToBase64, urlToBase64 } from "../pages/chat/utils/index";
import { AiChannel } from "@hyperchat/shared/ai.mjs";
import {
  AI_MODELS,
  ChatHistory,
  AppSetting,
  Agents,
  LocalSetting,
  VarList,
} from "@hyperchat/shared/data.mjs";
import { MyMessage } from "@hyperchat/shared/data.mjs";
import { Messages } from "./messages";
import { Icon } from "./icon";
import { getDefaultModelConfig, getDefaultModelConfigSync } from "./ai";
import { Editor } from "./editor";
import { t } from "../i18n";
import { getMyUuid } from "../common/util";
import { HeaderContext } from "../common/context";
import { useForceUpdate } from "../hooks/useForceUpdate";

/**
 * 工作区聊天组件的Props类型定义
 */
interface WorkspaceChatProps {
  /** 工作区信息 */
  workspace?: {
    path: string;
    name: string;
    isGlobal?: boolean;
  };
}

/**
 * 工作区聊天组件
 */
export const WorkspaceChat = ({ workspace }: WorkspaceChatProps) => {
  // 使用强制刷新 hook
  const refresh = useForceUpdate();

  // 从上下文获取全局状态和MCP客户端
  const context = useContext(HeaderContext);
  const { globalState, updateGlobalState, mcpClients } = context || {};

  // AI通道客户端引用
  const openaiClient = useRef<AiChannel>();

  // 输入框的值
  const [value, setValue] = React.useState("");

  // 默认聊天配置
  const defaultChatValue = {
    label: "",
    key: "",
    messages: [] as MyMessage[],
    modelKey: "",
    agentKey: "",
    sented: false,
    requestType: "stream" as const,
    allowMCPs: [] as string[],
    dateTime: Date.now(),
    isCalled: false,
    isTask: false,
    confirm_call_tool: false,
  };

  // 当前聊天引用
  const currentChat = React.useRef(defaultChatValue);

  // 加载状态
  const [loading, setLoading] = useState(false);

  // AI通道缓存对象
  let cacheOBJ = useRef({} as Record<string, AiChannel>);

  // 编辑器引用
  const editorRef = useRef<any>(null);

  // 资源结果列表引用
  const resourceResListRef = useRef<Array<any>>([]);

  // 提示结果列表引用
  const promptResList = useRef<Array<any>>([]);

  // 初始化
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          Agents.init(),
          AI_MODELS.init(),
          AppSetting.init(),
          ChatHistory.init(),
          LocalSetting.init(),
          VarList.init(),
        ]);

        const defaultModel = getDefaultModelConfigSync(AI_MODELS);
        currentChat.current.modelKey = defaultModel ? defaultModel.key : "";

        currentChatReset(
          { allowMCPs: AppSetting.get().defaultAllowMCPs || [] },
          "",
        );

        refresh();
      } catch (error) {
        console.error("Failed to initialize workspace chat:", error);
      }
    })();
  }, [workspace]);

  /**
   * 重置当前聊天配置
   */
  const currentChatReset = async (
    newConfig: Partial<typeof defaultChatValue>,
    prompt = "",
  ) => {
    if (prompt) {
      newConfig.messages = [
        {
          role: "system" as const,
          content_template: prompt,
          content_date: Date.now(),
          content: "",
        },
      ];
    }
    currentChat.current = {
      ...defaultChatValue,
      ...newConfig,
    };

    resourceResListRef.current = [];
    promptResList.current = [];

    refresh();
  };

  /**
   * 处理用户请求的核心函数
   */
  const onRequest = useCallback(async (message?: string) => {
    try {
      setLoading(true);

      let config = AI_MODELS.get().data.find(
        (x) => x.key == currentChat.current.modelKey,
      );
      if (config == null) {
        if (AI_MODELS.get().data.length == 0) {
          throw new Error("Please add LLM first");
        }
        config = await getDefaultModelConfig();
      }

      let aiClient = (() => {
        let cacheKey = "workspace-chat";
        if (cacheOBJ.current[cacheKey]) {
          return cacheOBJ.current[cacheKey];
        }
        let res = new AiChannel({});
        cacheOBJ.current[cacheKey] = res;
        return res;
      })();

      openaiClient.current = aiClient;
      aiClient.messages = currentChat.current.messages;

      if (message) {
        aiClient.addMessage(
          {
            role: "user",
            content: "",
            content_template: message,
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

      if (currentChat.current.sented == false) {
        currentChat.current = {
          ...currentChat.current,
          key: getMyUuid(),
          label: message || "New Chat",
          messages: aiClient.messages,
          sented: true,
          dateTime: Date.now(),
        };
      } else {
        currentChat.current.label = message || currentChat.current.label;
        currentChat.current.dateTime = Date.now();
      }

      refresh();

      aiClient.register({
        antdmessage: {
          warning: message.warning,
        },
        mcpTools: [],
        platform: "web",
        getURL_PRE: () => ""
      })

      await aiClient.completion({
        modelKey: config.key,
        allowMCPs: currentChat.current.allowMCPs,
        confirm_call_tool: currentChat.current.confirm_call_tool,
        onUpdate: () => {
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
      if (workspace && !workspace.isGlobal) {
        await call("addChatHistory", { item: currentChat.current });
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
  }, [workspace]);

  // 获取当前模型配置
  let currModel = (
    AI_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    getDefaultModelConfigSync(AI_MODELS)
  );

  // 是否支持图片
  let supportImage = currModel?.supportImage;
  // 模型名称
  let modelName = currModel?.name;

  const { token } = theme.useToken();

  return (
    <div className="workspace-chat h-full">
      <XProvider>
        <div className="h-full flex flex-col">
          {/* 聊天消息区域 */}
          <div className="flex-1 overflow-auto p-4">
            {(currentChat.current.messages == null ||
              currentChat.current.messages?.length == 0) && (
                <>
                  <Welcome
                    icon="💬"
                    title={t`Workspace Chat`}
                    className="mb-4"
                    description={t`Start chatting in your workspace`}
                  />
                </>
              )}

            <Messages
              messages={currentChat.current.messages}
              onSumbit={(messages) => {
                currentChat.current.messages = messages;
                refresh();
                onRequest();
              }}
              {...(openaiClient.current?.status ? { status: openaiClient.current.status } : {})}
            />
          </div>

          {/* 操作栏 */}
          <div className="flex-shrink-0 border-t p-2">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <Tooltip title={t`New Chat`}>
                  <Button
                    size="small"
                    icon={<PlusCircleOutlined />}
                    onClick={() => {
                      currentChatReset({
                        messages: [],
                        allowMCPs: AppSetting.get().defaultAllowMCPs || [],
                        sented: false,
                        agentKey: "",
                      });
                    }}
                  />
                </Tooltip>

                <Tooltip title={t`Clear Context`}>
                  <Button
                    size="small"
                    icon={<ClearOutlined />}
                    onClick={() => {
                      currentChat.current.messages = [];
                      refresh();
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
                        AI_MODELS.get().data.length > 0
                          ? `${currModel?.provider || 'unknown'}:${currModel?.name || 'unknown'}`
                          : "Please add a LLM model"
                      }
                      className="w-48"
                      allowClear
                      value={currentChat.current.modelKey}
                      onChange={(value) => {
                        currentChat.current.modelKey = value;
                        refresh();
                      }}
                      options={AI_MODELS.getGroupedByProvider()}
                    />
                  </span>
                </Tooltip>
              </div>

              <div className="flex items-center space-x-2">
                <Tooltip title={t`Settings`}>
                  <Button
                    size="small"
                    icon={<SettingOutlined />}
                  />
                </Tooltip>
              </div>
            </div>

            {/* 发送框 */}
            <div className="sender-container">
              <Editor
                onDragFile={async (file: any) => {
                  if (!file) return;

                  if (file.path) {
                    editorRef.current?.insertTextAtCursor(file.path);
                  } else {
                    if (file.type.includes("image")) {
                      let path = await blobToBase64(file);
                      resourceResListRef.current.push({
                        call_name: "UserUpload",
                        contents: [
                          {
                            uri: path,
                            blob: path,
                            mimeType: "image/*",
                          },
                        ],
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
                      call_name: "UserUpload",
                      contents: [
                        {
                          uri: path,
                          blob: path,
                          mimeType: "image/*",
                        },
                      ],
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
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  padding: "8px 12px",
                }}
                autoHeight
                rows={1}
                maxRows={6}
                value={value}
                onChange={(nextVal) => {
                  setValue(nextVal);
                }}
                onSubmit={(s) => {
                  if (s == "") return;
                  onRequest(s);
                  setValue("");
                  editorRef.current?.setValue("");
                }}
                fontSize={14}
                lineHeight={20}
                placeholder={t`Start inputting...`}
              />
              <div className="operation-container">
                {supportImage && (
                  <Upload
                    accept="image/*"
                    fileList={[]}
                    beforeUpload={async (file) => {
                      if (file.type.includes("image")) {
                        let path = await blobToBase64(file);
                        resourceResListRef.current.push({
                          call_name: "UserUpload",
                          contents: [
                            {
                              uri: path,
                              blob: await urlToBase64(path),
                              mimeType: "image/*",
                            },
                          ],
                          uid: v4(),
                        });
                        refresh();
                      } else {
                        message.warning(t`please upload image`);
                      }
                      return false;
                    }}
                  >
                    <Button
                      type="text"
                      icon={<LinkOutlined />}
                      size="small"
                    />
                  </Upload>
                )}
        
              </div>
              <Sender
                className="mt-2"
                footer={({ components }) => {
                  const { SendButton, LoadingButton } = components;
                  return (
                    <Flex justify="space-between" align="center">
                      <Flex align="center">
                        {supportImage && (
                          <Upload
                            accept="image/*"
                            fileList={[]}
                            beforeUpload={async (file) => {
                              if (file.type.includes("image")) {
                                let path = await blobToBase64(file);
                                resourceResListRef.current.push({
                                  call_name: "UserUpload",
                                  contents: [
                                    {
                                      uri: path,
                                      blob: await urlToBase64(path),
                                      mimeType: "image/*",
                                    },
                                  ],
                                  uid: v4(),
                                });
                                refresh();
                              } else {
                                message.warning(t`please upload image`);
                              }
                              return false;
                            }}
                          >
                            <Button
                              type="text"
                              icon={<LinkOutlined />}
                              size="small"
                            />
                          </Upload>
                        )}
                      </Flex>

                      <Flex align="center">
                        {loading ? (
                          <LoadingButton type="default" />
                        ) : (
                          <SendButton type="primary" disabled={false} />
                        )}
                      </Flex>
                    </Flex>
                  );
                }}
                actions={false}
                loading={loading}
                value={value}
                onChange={(nextVal) => {
                  setValue(nextVal);
                }}
                onCancel={() => {
                  setLoading(false);
                  openaiClient.current?.cancel();
                }}
                onSubmit={(s) => {
                  onRequest(value);
                  setValue("");
                  editorRef.current?.setValue("");
                }}
                placeholder={t`Start inputting...`}
              />
            </div>
          </div>
        </div>
      </XProvider>
    </div>
  );
};