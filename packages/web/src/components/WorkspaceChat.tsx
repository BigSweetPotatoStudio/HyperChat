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
  Space,
  Tooltip,
  Upload,
  message,
  theme,
} from "antd";
import {
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
  SyncOutlined,
} from "@ant-design/icons";

import { v4 } from "uuid";
import { call, getURL_PRE } from "../common/call";
import { blobToBase64, calcAttachDialogue, urlToBase64 } from "../pages/chat/utils/index";
import { AiChannel } from "@hyperchat/shared/ai.mjs";
import {
  AI_MODELS,
  ChatHistory,
  LocalSetting,
  VarList,
  ChatHistoryItem,
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
import { MyAttachR } from "../pages/chat/attachR";
import { WorkspaceDetails, WorkspaceInfo } from "../pages/workspace/workspace";
import { HyperChatCompletionTool, IMCPClient } from "@hyperchat/shared/types.mjs";

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
}

/**
 * 工作区聊天组件
 */
export const WorkspaceChat = ({ workspace, agentKey, workspaceDetails, mcpClients }: WorkspaceChatProps) => {
  // 使用强制刷新 hook
  const refresh = useForceUpdate();

  // 从上下文获取全局状态和MCP客户端
  const context = useContext(HeaderContext);
  const { globalState, updateGlobalState } = context || {};

  // AI通道客户端引用
  const aiClientRef = useRef<AiChannel>(new AiChannel({}));

  // 输入框的值
  const [value, setValue] = useState("");

  // 默认聊天配置
  const defaultChatValue = useRef({
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
    temperature: undefined as number | undefined,
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
  const resourceResListRef = useRef<Array<any>>([]);

  // 提示结果列表引用
  const promptResList = useRef<Array<any>>([]);

  /** 工具显示状态 */
  const [isToolsShow, setIsToolsShow] = useState(false);

  // 初始化
  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          AI_MODELS.init(),
          ChatHistory.init(),
          LocalSetting.init(),
          VarList.init(),
        ]);

        const defaultModel = getDefaultModelConfigSync(AI_MODELS);
        currentChat.current.modelKey = defaultModel ? defaultModel.key : "";
        const agent = workspaceDetails[workspace.path]?.agents.find(a => a.config.key === agentKey);
        // 如果指定了agentKey，使用Agent配置
        if (agentKey && agent) {

          defaultChatValue.current.agentKey = agentKey;
          defaultChatValue.current.messages = [{
            role: "system" as const,
            content_template: agent.config.prompt || "",
            content_date: Date.now(),
            content: "",
          }]
          defaultChatValue.current.allowMCPs = agent.config.allowMCPs || [];
          defaultChatValue.current.modelKey = agent.config.modelKey || defaultModel?.key || "";
          defaultChatValue.current.temperature = agent.config.temperature;
          defaultChatValue.current.confirm_call_tool = agent.config.confirm_call_tool || false;

        } else {
          currentChatReset(
            {},
          );
        }

        refresh();
      } catch (error) {
        console.error("Failed to initialize workspace chat:", error);
      }
    })();
  }, [workspace, agentKey]);

  /**
   * 重置当前聊天配置
   */
  const currentChatReset = async (
    newConfig: Partial<typeof defaultChatValue.current>,
  ) => {

    currentChat.current = {
      ...defaultChatValue.current,
      ...newConfig,
    };

    resourceResListRef.current = [];
    promptResList.current = [];

    refresh();
  };

  /**
   * 处理用户请求的核心函数
   */
  const onRequest = useCallback(async (content?: string) => {
    let aiClient = aiClientRef.current;
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

      if (currentChat.current.sented == false) {
        currentChat.current = {
          ...currentChat.current,
          key: getMyUuid(),
          label: content || "New Chat",
          messages: aiClient.messages,
          sented: true,
          dateTime: Date.now(),
        };
      } else {
        currentChat.current.label = content || currentChat.current.label;
        currentChat.current.dateTime = Date.now();
      }

      refresh();

      let mcpTools = getTools(Object.values(mcpClients), currentChat.current.allowMCPs);
      // console.log("MCP Tools:", mcpTools);
      aiClient.register({
        antdmessage: {
          warning: message.warning,
        },
        mcpTools: mcpTools,
        platform: "web",
        getURL_PRE: getURL_PRE
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

      if (agentKey) {
        // 如果是 Agent 聊天，保存到 Agent 的聊天记录中
        await call("saveAgentChatLog", {
          workspacePath: workspace.path,
          agentKey: agentKey,
          chatLog: currentChat.current
        });
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
  }, [workspace, agentKey]);

  // 获取当前模型配置
  let currModel = (
    AI_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    getDefaultModelConfigSync(AI_MODELS)
  );

  /** 是否支持图片 */
  let supportImage = currModel?.supportImage;
  /** 是否支持工具 */
  let supportTool = currModel?.supportTool;
  const { token } = theme.useToken();
  const agent = workspaceDetails[workspace.path]?.agents.find(a => a.config.key === agentKey);

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
                    icon={agentKey ? "🤖" : "💬"}
                    title={agentKey ? (agent?.config.name || t`Agent Chat`) : t`Workspace Chat`}
                    className="mb-4"
                    description={agentKey ? t`Chatting with agent` : t`Start chatting in your workspace`}
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
                        sented: false,
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
                      // placeholder={
                      //   AI_MODELS.get().data.length > 0
                      //     ? `${currModel?.provider || 'unknown'}:${currModel?.name || 'unknown'}`
                      //     : "Please add a LLM model"
                      // }
                      className="w-64"
                      // allowClear
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
                onSubmit={(s) => {
                  if (s == "") return;
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
                            let load = (mcpClients || []).filter(
                              (v) => v.status == "connected",
                            ).length;
                            let all = (mcpClients || []).filter(x => x.status !== "disabled").length;
                            let curr = (mcpClients || []).filter((v) => {
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

                              (mcpClients || []).forEach((v) => {
                                tools = tools.concat(
                                  v.tools.filter((t) => {

                                    return (
                                      currentChat.current.allowMCPs.includes(t.clientName) || currentChat.current.allowMCPs.includes(t.restore_name)
                                    );
                                  }),
                                );
                              });

                              // let set = new Set();
                              // for (let tool_name of currentChat.current.allowMCPs) {
                              //   let [name, _] = tool_name.split(" > ");
                              //   set.add(name);
                              // }

                              // let curr = mcpClients.filter((v) => {
                              //   return v.status !== "disabled" && set.has(v.name);
                              // });
                              // let toolLen = 0;
                              // for (let x of curr) {
                              //   toolLen += x.tools.length;
                              // }
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
                    disabled={!value.trim() || loading}
                    onClick={() => {
                      if (value.trim()) {
                        onRequest(value);
                        setValue("");
                        editorRef.current?.setValue("");
                      }
                    }}
                  >
                    {loading ? t`Sending` : t`Send`}
                  </Button>
                </Flex>
              </div>
            </div>
          </div>
        </div>
      </XProvider>
    </div>
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