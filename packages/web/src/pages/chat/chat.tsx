/**
 * @fileoverview HyperChat聊天界面组件
 * 
 * 这是HyperChat应用的核心聊天界面组件，提供以下主要功能：
 * 
 * 1. AI对话功能：
 *    - 支持多种AI模型（OpenAI、Claude、Gemini等）
 *    - 流式和完整两种请求模式
 *    - 支持文本和图片输入
 * 
 * 2. MCP（模型上下文协议）集成：
 *    - 工具调用和确认机制
 *    - 资源和提示管理
 *    - 多MCP客户端支持
 * 
 * 3. Agent管理：
 *    - 内置和自定义Agent
 *    - Agent配置和编辑
 *    - 模板变量替换
 * 
 * 4. 聊天记录管理：
 *    - 历史记录存储和加载
 *    - 搜索和过滤功能
 *    - 星标和分类管理
 * 
 * 5. 用户界面：
 *    - 响应式设计（支持移动端）
 *    - 拖拽排序
 *    - 多种显示模式
 * 
 * @author HyperChat Team
 * @version 1.0.0
 */

import {
  Sender,
  Welcome,
  XProvider,
} from "@ant-design/x";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  Result,
  Segmented,
  Select,
  Slider,
  Space,
  Spin,
  Splitter,
  Table,
  Tag,
  theme,
  Tooltip,
  Tree,
  Typography,
  Upload,
  Watermark,
} from "antd";
const antdMessage = message;
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import OpenAI from "openai";
import { v4 } from "uuid";
import * as MCPTypes from "@modelcontextprotocol/sdk/types.js";
import { io } from "socket.io-client";
import { getURL_PRE, msg_receive } from "../../common/call";
import "@xterm/xterm/css/xterm.css";
import _ from 'lodash';
import { blobToBase64, calcAttachDialogue, urlToBase64 } from "./utils/index"


import {
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  StarOutlined,
  SearchOutlined,
  SyncOutlined,
  LinkOutlined,
  SettingOutlined,
  LeftOutlined,
  DownloadOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined,
  ClearOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckOutlined,
  DisconnectOutlined,
  ApiOutlined,
  EllipsisOutlined,
} from "@ant-design/icons";
import type { ConfigProviderProps, GetProp } from "antd";
import { MyMessage } from "@hyperchat/shared/data.mjs";
import { AiChannel } from "@hyperchat/shared/ai.mjs";

import {
  ChatHistory,
  AI_MODELS,
  Agents,
  AppSetting, IMCPClient,
  electronData,
  HyperChatCompletionTool,
  Tool_Call,
  VarList,
} from "@hyperchat/shared/data.mjs";

import { PromptsModal } from "./promptsModal";
import {
  getTools,
  InitedClient,
} from "../../common/mcp";
import { EVENT } from "../../common/event";
import InfiniteScroll from "react-infinite-scroll-component";
import { call } from "../../common/call";
import { MyAttachR } from "./attachR";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortableItem";
import Clarity from "@microsoft/clarity";
import { ChatHistoryItem } from "@hyperchat/shared/data.mjs";
import { useForm } from "antd/es/form/Form";
import { currLang, t } from "../../i18n";
import { NumberStep } from "../../common/numberStep";
import { HeaderContext } from "../../common/context";
import dayjs from "dayjs";
import { sleep } from "../../common/sleep";
import {
  getMyUuid,
  JsonSchema2FormItemOrNull,
} from "../../common/util";
import zodToJsonSchema from "zod-to-json-schema";
import { Icon } from "../../components/icon";
import { Messages } from "../../components/messages";
import { getFirstCharacter, getFirstEmoji } from "../../common";
import { Container, X } from "lucide-react";
import { setInterval } from "node:timers/promises";
import { getDefaultModelConfig, getDefaultModelConfigSync, rename } from "../../components/ai";
import { InputAI } from "../../components/input_ai";
import { MySender } from "../../components/my_sender";
import { disableCompletionItemProvider, Editor, enableCompletionItemProvider } from "../../components/editor";
import { Link } from "react-router-dom";
import { BuiltinAgents } from "./utils/builtinAgent";
import { useForceUpdate } from "../../hooks/useForceUpdate";

/**
 * Chat组件的Props类型定义
 */
interface ChatProps {
  /** 标题变化回调函数 */
  onTitleChange?: (title?: string) => void;
  /** 会话ID */
  sessionID?: string;
  /** Agent数据配置 */
  data?: {
    /** 用户ID */
    uid: string;
    /** Agent键值 */
    agentKey: string;
    /** 消息内容 */
    message: string;
    /** 完成回调 */
    onComplete: (text: string) => void;
    /** 错误回调 */
    onError: (error: any) => void;
  };
  /** 仅查看模式配置 */
  onlyView?: {
    /** 历史记录键值 */
    histroyKey: string;
  };
}

/**
 * Chat聊天组件 - HyperChat应用的核心聊天界面
 * 支持AI对话、MCP工具调用、多模型切换等功能
 * 
 * @param props Chat组件的属性
 * @returns Chat组件JSX元素
 */
export const Chat = ({
  onTitleChange = undefined,
  sessionID = "",
  data: agentData = {
    uid: "",
    agentKey: "",
    message: "",
    onComplete: (text) => { },
    onError: (e) => { },
  },
  onlyView = {
    histroyKey: "",
  },
}: ChatProps) => {
  // 组件初始化日志
  useEffect(() => {
    console.log("Chat")
  }, []);

  // 使用强制刷新 hook
  const refresh = useForceUpdate();

  // 从上下文获取全局状态和MCP客户端
  const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);

  // 监听全局状态变化，触发数据加载
  useEffect(() => {
    loadMoreData(false);
  }, [globalState]);

  // Modal实例和上下文holder
  const [modal, contextHolder] = Modal.useModal();

  // Agent名称映射对象
  let getAgentNameObj = useRef({} as Record<string, string>);

  // 内置Agent配置
  let builtinAgent = useRef(BuiltinAgents as any);

  useEffect(() => {
    (async () => {
      try {
        DATA.current.loadingMessages = true;
        refresh();
        await Promise.all([
          Agents.init(),
          AI_MODELS.init(),
          AppSetting.init(),
          ChatHistory.init(),
          electronData.init(),
          VarList.init(),
        ]);
        disableCompletionItemProvider();
        enableCompletionItemProvider();
        msg_receive("message-from-main", async (msg) => {
          if (msg.type == "update_var_list") {
            await VarList.init();
            disableCompletionItemProvider();
            enableCompletionItemProvider();
          }
        });


        Agents.get().data = builtinAgent.current.concat(Agents.get().data.filter(x => x.type != "builtin"));
        Agents.get().data.forEach((x) => {
          getAgentNameObj.current[x.key] = x.label;
        });
        refresh();
        loadMoreData(false);

        if (agentData.agentKey) {
          try {
            await onGPTSClick(agentData.agentKey);

            if (agentData.message) {
              await onRequest(agentData.message);
              // 确保content是字符串类型
              const content = openaiClient.current.lastMessage.content;
              const contentStr = typeof content === 'string' ? content :
                Array.isArray(content) ? content.map(c => (c as any).text || '').join('') :
                  String(content);
              agentData.onComplete(contentStr);
            }
          } catch (e) {
            console.error(" hyper_call_agent error: ", e);
            agentData.onError(e);
          }
        } else if (onlyView.histroyKey) {
          if (onlyView.histroyKey) {
            let item = ChatHistory.get().data.find(
              (x) => x.key === onlyView.histroyKey,
            );
            if (item) {

              if (item.messages == null || item.messages.length == 0 || +item.version == 2) {

                let messages = await call("readJSON", { path: `messages/${item.key}.json` }).catch(() => []);
                item.messages = messages || [];
                if (item.messages.length == 0 && item.agentKey != null) {
                  let agent = Agents.get().data.find(x => x.key == item.agentKey);
                  if (agent) {
                    item.messages = [
                      {
                        role: "system" as const,
                        content: agent.prompt,
                        content_date: Date.now(), // Corrected to use Date.now() for current timestamp
                      },
                    ];
                  }
                }

              }
              currentChatReset(item);
            }
          }
        } else {
          if (AppSetting.get().defaultAllowMCPs == undefined) {
            // let clients = await getClients().catch(() => [] as InitedClient[]);
            AppSetting.get().defaultAllowMCPs = [];
          }

          currentChatReset(
            {
              allowMCPs: AppSetting.get().defaultAllowMCPs,
            },
            "",
          );
        }
      } finally {
        DATA.current.loadingMessages = false;
        refresh();
      }
    })();
  }, [onlyView.histroyKey]);

  /**
   * GPT Agent点击处理函数
   * @param key Agent的键值
   * @param options 选项配置
   */
  const onGPTSClick = async (key: string, { loadHistory = true } = {}) => {
    let find = Agents.get().data.find((y) => y.key === key);
    selectGptsKey.current = find.key;
    historyFilterType.current = "all";
    await currentChatReset(
      {
        allowMCPs: find.allowMCPs,
        agentKey: find.key,
        modelKey: find.modelKey,
        attachedDialogueCount: find.attachedDialogueCount,
        temperature: find.temperature,
        confirm_call_tool: find.confirm_call_tool,
      },
      find.prompt,
    );
  };

  /** AI通道客户端引用 */
  const openaiClient = useRef<AiChannel>();

  /** MCP提示列表引用 */
  const promptsRef = useRef<InitedClient["prompts"]>([]);
  /** MCP资源列表引用 */
  const resourcesRef = useRef<InitedClient["resources"]>([]);

  /** 提示模态框开关状态 */
  const [isOpenPromptsModal, setIsOpenPromptsModal] = useState(false);
  /** 提示模态框的值 */
  const [promptsModalValue, setPromptsModalValue] = useState({} as any);

  /** 输入框的值 */
  const [value, setValue] = React.useState("");

  /** 默认聊天配置 */
  const defaultChatValue: ChatHistoryItem = {
    label: "",
    key: "",
    messages: [],
    modelKey: undefined,
    agentKey: undefined,
    sented: false,
    requestType: "stream",
    allowMCPs: [],
    temperature: undefined,
    attachedDialogueCount: undefined,
    dateTime: Date.now(),
    isCalled: agentData.agentKey ? true : false,
    isTask: false,
    confirm_call_tool: true,
    icon: ""
  };

  /** 移动端检测 */
  const mobile = useRef({
    is: window.innerWidth < 1024,
  });

  /** 组件数据状态 */
  const DATA = useRef({
    /** MCP加载状态 */
    mcpLoading: false,
    /** 是否显示历史记录 */
    showHistory: mobile.current.is ? false : onlyView.histroyKey ? false : true,
    /** 建议显示状态 */
    suggestionShow: false,
    /** 对比差异列表 */
    diffs: [] as Array<{
      messages: ChatHistoryItem["messages"];
      modelKey: string;
      openaiClient: AiChannel;
      label: string;
    }>,
    /** 消息加载状态 */
    loadingMessages: false,
    /** 是否滚动到底部 */
    scrollBottom: true,
  });

  /** 当前聊天引用 */
  const currentChat = React.useRef<ChatHistoryItem>(defaultChatValue);

  /**
   * 重置当前聊天配置
   * @param newConfig 新的聊天配置
   * @param prompt 提示词
   */
  const currentChatReset = async (
    newConfig: Partial<ChatHistoryItem>,
    prompt = "",
    // loadDefaultAllowMCPs = undefined,
  ) => {
    if (prompt) {
      newConfig.messages = [
        {
          role: "system" as const,
          content_template: prompt,
          content_date: Date.now(), // Corrected to use Date.now() for current timestamp
          content: "",
        },
      ];
    }
    currentChat.current = {
      ...defaultChatValue,
      ...newConfig,
    };
    for (let d of DATA.current.diffs) {
      d.messages = currentChat.current.messages.slice();
    }


    resourceResListRef.current = [];
    promptResList.current = [];

    refresh();
  };

  // 监听MCP客户端和允许的MCP变化，更新提示和资源列表
  useEffect(() => {
    let set = new Set();
    for (let tool_name of currentChat.current.allowMCPs) {
      let [name, _] = tool_name.split(" > ");
      set.add(name);
    }

    // 收集所有允许的MCP客户端的提示
    let prompts: IMCPClient["prompts"] = [];
    mcpClients
      .filter((m) => set.has(m.name))
      .forEach((v) => {
        prompts = prompts.concat(v.prompts);
      });
    promptsRef.current = prompts;

    // 收集所有允许的MCP客户端的资源
    let resources: IMCPClient["resources"] = [];
    mcpClients
      .filter((m) => set.has(m.name))
      .forEach((v) => {
        resources = resources.concat(v.resources);
      });
    resourcesRef.current = resources;
    refresh();
  }, [mcpClients, currentChat.current.allowMCPs]);

  /** 选中的GPT键值 */
  const selectGptsKey = useRef<string | undefined>(undefined);

  // 监听当前聊天的agentKey变化，更新标题
  useEffect(() => {
    if (currentChat.current.agentKey == null) {
      onTitleChange && onTitleChange();
    } else {
      let find = Agents.get().data.find(
        (x) => x.key == currentChat.current.agentKey,
      );
      if (find) {
        onTitleChange && onTitleChange(find.label);
      } else {
        onTitleChange && onTitleChange("");
      }
    }
  }, [currentChat.current.agentKey]);

  /** 加载状态 */
  const [loading, setLoading] = useState(false);
  /** AI通道缓存对象 */
  let cacheOBJ = useRef({} as Record<string, AiChannel>);

  /**
   * 处理用户请求的核心函数
   * @param message 可选的消息内容
   */
  const onRequest = useCallback(async (message?: string) => {
    Clarity && Clarity.event(`sender-${process.env.NODE_ENV}`);
    console.log("onRequest", message);

    /**
     * 工具调用确认回调函数
     * @param tool 要调用的工具
     * @returns Promise<any> 用户确认的参数
     */
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
                    {getTools().find(
                      (x) => x.name == tool.function.name,
                    ).restore_name}
                  </span>
                </pre>
                {JsonSchema2FormItemOrNull(
                  getTools().find(
                    (x) => x.name == tool.function.name,
                  ).inputSchema,
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

    let iOnRequest = async (index: number, modelKey, messages: MyMessage[], setOpenaiClient: (openaiClient) => void) => {
      let current = index == -1 ? true : false;
      let config = AI_MODELS.get().data.find(
        (x) => x.key == modelKey,
      );
      if (config == null) {
        if (AI_MODELS.get().data.length == 0) {
          EVENT.fire("setIsModelConfigOpenTrue");
          throw new Error("Please add LLM first");
        }
        config = await getDefaultModelConfig();
      }
      let aiClient = (() => {
        let cacheKey = index;
        if (cacheOBJ.current[cacheKey]) {
          return cacheOBJ.current[cacheKey];
        }
        let res = new AiChannel({});
        cacheOBJ.current[cacheKey] = res;
        res.register({
          antdmessage: {
            warning: antdMessage.warning,
          },
          mcpTools: getTools(currentChat.current.allowMCPs),
          platform: "web",
          getURL_PRE
        })
        return res;
      })();

      function getFirstUserContent() {
        let label = currentChat.current.label.toString();
        let firstUser = messages.find(
          (x) => x.content_attached != false && x.role == "user",
        );
        let firstUserContent = (firstUser as OpenAI.ChatCompletionUserMessageParam)?.content;
        if (typeof firstUserContent == "string") {
          label = firstUserContent;
        } else if (Array.isArray(firstUserContent)) {
          label = firstUserContent.find((x) => x.type == "text")?.text || "";
        } else {
          label = (firstUserContent as any).toString();
        }
        return label;
      }
      let messages_format_callback = async (message) => {
        if (message.role == "user" || message.role == "system") {
          if (!message.content_sended) {
            let varList = [...VarList.get().data?.map((v) => {
              let varName = v.scope + "." + v.name;
              return {
                ...v,
                varName: varName,
              }
            })];
            async function renderTemplate(template: string) {
              let reg = /{{(.*?)}}/g;
              let matchs = template.match(reg);
              let subResults = [];
              for (let match of matchs || []) {
                let varName = match.slice(2, -2).trim();
                let v = varList.find((x) => x.varName == varName);
                let value = varName;
                if (v) {
                  if (v.variableType == "js") {
                    value = await call("runCode", { code: v.code });
                  } else if (v.variableType == "webjs") {
                    let code = `
                        (async () => {
                            ${v.code}
                           return await get()
                        })()
                        `;
                    // console.log(code);
                    value = await eval(code);
                  } else {
                    value = v.value;
                  }
                }
                subResults.push({ value, varName });
              }
              let result = template.replace(reg, (match, p1) => {
                return subResults.find((x) => x.varName === p1.trim())?.value || match;
              });
              return result;
            }
            if (message.content_template) {
              if (typeof message.content == "string") {
                message.content = await renderTemplate(message.content_template);
              }
              else if (Array.isArray(message.content) && message.content.length >= 1) {
                if (message.content[0].type == "text") {
                  message.content[0].text = await renderTemplate(message.content_template);
                }
              }

            }
            message.content_sended = true;
          }
        }
      }

      try {

        setOpenaiClient(aiClient);
        aiClient.messages = messages;
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
        for (let m of aiClient.messages) {
          if (m.role == "user" || m.role == "system") {
            if (!m.content_sended) {
              await messages_format_callback(m);
            }
          }
        }
        if (current) {
          if (currentChat.current.sented == false) {
            currentChat.current = {
              ...currentChat.current,

              key: getMyUuid(),
              label: message.toString(),
              messages: aiClient.messages,
              sented: true,
              dateTime: Date.now(),
            };

          } else {

            currentChat.current.label = getFirstUserContent();
            currentChat.current.dateTime = Date.now();

          }
        }
        refresh();

        await aiClient.completion({
          modelKey: config.key,
          allowMCPs: currentChat.current.allowMCPs,
          confirm_call_tool: currentChat.current.confirm_call_tool,
          confirm_call_tool_cb,
          onUpdate: () => {
            Object.assign(messages, aiClient.messages);
            refresh();
          }
        }, {
          temperature: currentChat.current.temperature,
        });
        currentChat.current.label = getFirstUserContent();

        resourceResListRef.current = [];
        promptResList.current = [];

        calcAttachDialogue(
          aiClient.messages,
          currentChat.current.attachedDialogueCount,
          false,
        );

        Object.assign(messages, aiClient.messages)
        refresh();



        if (current) {

          await call("addChatHistory", { item: currentChat.current })
          let findIndex = ChatHistory.get().data.findIndex(
            (x) => x.key == currentChat.current.key,
          );
          if (findIndex > -1) {
            ChatHistory.get().data.splice(findIndex, 1)
          }
          ChatHistory.get().data.unshift(currentChat.current);
          loadMoreData(false);
        }


      } catch (e) {


        console.error(e);

        aiClient.lastMessage.content_error = e.message;
        Object.assign(messages, aiClient.messages)
        refresh();


        if (current) {
          // await ChatHistory.save();
          await call("addChatHistory", { item: currentChat.current })
          let findIndex = ChatHistory.get().data.findIndex(
            (x) => x.key == currentChat.current.key,
          );
          if (findIndex > -1) {
            ChatHistory.get().data.splice(findIndex, 1)
          }
          ChatHistory.get().data.unshift(currentChat.current);
          loadMoreData(false);
        }
        refresh();
        antdMessage.error(
          e.message || t`An error occurred, please try again later`,
        );
      }
    }
    try {
      setLoading(true);
      let alls = []
      for (let [index, diff] of DATA.current.diffs.entries()) {
        diff.messages = _.cloneDeep(currentChat.current.messages);
        let promise = iOnRequest(index, diff.modelKey, diff.messages, (openaiClient) => {
          diff.openaiClient = openaiClient;
        });
        alls.push(promise);
      }
      let promise = iOnRequest(-1, currentChat.current.modelKey, currentChat.current.messages, (c) => {
        openaiClient.current = c;
      });
      alls.push(promise);
      await Promise.allSettled(alls).then((res) => {
        if (res.every(x => x.status == "fulfilled")) {

        } else {
          console.log("all res has error", res);
        }
      });
    } catch (e) {
      // 错误处理
    } finally {
      setLoading(false);
    }
  }, []);

  /** 工具显示状态 */
  const [isToolsShow, setIsToolsShow] = useState(false);

  /** 历史记录搜索值 */
  const [historyFilterSearchValue, setHistoryFilterSearchValue] = useState("");

  /** 历史记录过滤类型 */
  const historyFilterType = useRef<
    "all" | "star" | "search" | "agent" | "task"
  >("all");

  // 监听过滤条件变化，重新加载数据
  useEffect(() => {
    loadMoreData(false);
  }, [
    historyFilterType.current,
    historyFilterSearchValue,
    selectGptsKey.current,
  ]);

  /**
   * 加载更多数据的函数
   * @param loadMore 是否加载更多
   * @param loadIndexChange 是否改变加载索引
   */
  const loadMoreData = useCallback(
    async (loadMore = true, loadIndexChange = true) => {
      refresh();
      return;
    },
    [historyFilterSearchValue],
  );

  /** 资源结果列表引用 */
  const resourceResListRef = useRef<
    Array<
      MCPTypes.ReadResourceResult & {
        call_name: string;
        uid: string;
      }
    >
  >([]);

  /** 提示结果列表引用 */
  const promptResList = useRef<Array<MCPTypes.GetPromptResult>>([]);

  /** 填充提示模态框开关状态 */
  const [isFillPromptModalOpen, setIsFillPromptModalOpen] =
    React.useState(false);
  /** 更多设置模态框开关状态 */
  const [isOpenMoreSetting, setIsOpenMoreSetting] = React.useState(false);

  /** 更多设置表单实例 */
  const [formMoreSetting] = useForm();

  /** 填充提示表单项状态 */
  const [fillPromptFormItems, setFillPromptFormItems] = React.useState([]);
  /** MCP调用提示当前值引用 */
  const mcpCallPromptCurr = useRef({} as any);

  /** 拖拽传感器配置 */
  const sensors = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  /** 机器人搜索值 */
  const [botSearchValue, setBotSearchValue] = useState("");

  /** 获取当前模型配置 */
  let currModel = (
    AI_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    getDefaultModelConfigSync(AI_MODELS)
  );

  /** 是否支持图片 */
  let supportImage = currModel?.supportImage;
  /** 是否支持工具 */
  let supportTool = currModel?.supportTool;
  /** 模型名称 */
  let modelName = currModel?.name;

  /**
   * 聊天记录激活处理函数
   * @param key 聊天记录的键值
   */
  const onActiveChange = async (key: string) => {
    if (currentChat.current.key == key) {
      return;
    }
    let item = ChatHistory.get().data.find((x) => x.key == key);
    if (item) {
      // 移动端关闭历史记录面板
      if (mobile.current.is) {
        DATA.current.showHistory = false;
      }

      // 如果消息为空或版本过旧，重新加载消息
      if (item.messages == null || item.messages.length == 0 || +item.version == 2) {
        try {
          DATA.current.loadingMessages = true;
          refresh();
          let messages = await call("readJSON", { path: `messages/${item.key}.json` }).catch(() => []);
          item.messages = messages || [];
          if (item.messages.length == 0 && item.agentKey != null) {
            let agent = Agents.get().data.find(x => x.key == item.agentKey);
            if (agent) {
              item.messages = [
                {
                  role: "system" as const,
                  content: agent.prompt,
                  content_date: Date.now(),
                },
              ];
            }
          }
        } finally {
          DATA.current.loadingMessages = false;
          refresh();
        }
      }
      await currentChatReset(item);
    }
  }

  /** 表格高度状态 */
  const [tableHeight, setTableHeight] = useState(500);
  /** 表格容器引用 */
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 监听窗口大小变化，调整表格高度
  useEffect(() => {
    const handleResize = () => {
      if (tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight;
        setTableHeight(containerHeight - 50);
      }
    };

    // 初始计算
    handleResize();

    // 添加窗口大小变化监听器
    window.addEventListener("resize", handleResize);

    // 组件卸载时清理监听器
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  let historyShowNode = (
    <div ref={tableContainerRef} className="h-full relative">
      <div className="mt-2 flex items-center justify-between">
        <Space>
          <span>{t`Chat Logs`}</span>
        </Space>
        <Segmented
          size="small"
          value={historyFilterType.current}
          onChange={(value) => {
            historyFilterType.current = value as any;
            refresh();
          }}
          options={[
            {
              title: t`All`,
              value: "all",
              icon: <CommentOutlined />,
            },
            {
              title: t`Star`,
              value: "star",
              icon: <StarOutlined />,
            },
            {
              title: t`Search`,
              value: "search",
              icon: <SearchOutlined />,
            },
            {
              title: t`Agent`,
              value: "agent",
              icon: <Icon name="bx-bot" />,
            },
            {
              title: t`Task`,
              value: "task",
              icon: <Icon name="task"></Icon>,
            },
          ]}
        />
      </div>
      <div>
        {historyFilterType.current == "search" && (
          <Input
            size="small"
            placeholder="search"
            value={historyFilterSearchValue}
            onChange={(e) => {
              setHistoryFilterSearchValue(e.target.value);
            }}
            allowClear
          ></Input>
        )}
      </div>
      <Table
        virtual
        bordered={false}
        scroll={{ x: 232, y: tableHeight }}
        pagination={false}
        size="small"
        showHeader={false}
        rowKey="key"
        rowHoverable={false}
        rowClassName={(x) => x.key == currentChat.current.key ? "rounded my-table-row bg-slate-200" : "rounded my-table-row hover:bg-slate-100"}
        columns={[{
          title: t`Chat Logs`,
          dataIndex: "label",
          key: "label",
          width: "100%",

          render: (text, x) => {
            let agentName = getAgentNameObj.current[x.agentKey || x["gptsKey"]] || "";
            let first = getFirstCharacter(agentName);
            return (<Popover placement="right" content={!mobile.current.is && <div style={{
              maxWidth: "calc(70vw)",
            }}>
              <div className="line-clamp-4 whitespace-pre">{text}</div>
              <div className="text-gray-400">{`${dayjs(x.dateTime).format("YYYY-MM-DD HH:mm:ss")}   `}<span className=" text-sky-400">{agentName}</span></div>
            </div>}>

              <div className="pt-2 pb-2 flex items-center cursor-pointer relative" onClick={() => {
                onActiveChange(x.key);
              }}>
                <>
                  {first && <span className="rounded bg-slate-300 inline-block text-center" style={{ width: 22, height: 22, minWidth: 22, minHeight: 22 }}>{first}</span>}
                  {x.icon == "⭐" ? <StarOutlined /> : undefined}
                </>

                <div style={{ height: 22 }} className="ml-1 overflow-hidden">{x.label.toString()}</div>

                <Dropdown trigger={["click", "contextMenu"]} menu={{
                  onClick: async (menuInfo) => {
                    menuInfo.domEvent.stopPropagation();
                    let conversation = x;
                    // message.info(`Click ${conversation.key} - ${menuInfo.key}`);
                    if (menuInfo.key === "remove") {


                      await call("removeChatHistory", { key: conversation.key });
                      let index = ChatHistory.get().data.findIndex(
                        (x) => x.key === conversation.key,
                      );
                      ChatHistory.get().data.splice(index, 1);
                      loadMoreData(false, false);
                      refresh();
                      message.success(t`Delete Success`);
                    }
                    if (menuInfo.key === "star") {
                      let index = ChatHistory.get().data.findIndex(
                        (x) => x.key === conversation.key,
                      );
                      if (ChatHistory.get().data[index].icon == "⭐") {
                        ChatHistory.get().data[index].icon = "";
                      } else {
                        ChatHistory.get().data[index].icon = "⭐";
                      }
                      loadMoreData(false, false);
                      refresh();
                      await call("changeChatHistory", { item: ChatHistory.get().data[index] })

                    }
                    if (menuInfo.key === "rename") {
                      await onActiveChange(conversation.key);

                      setIsOpenMoreSetting(true);
                      formMoreSetting.resetFields();
                      formMoreSetting.setFieldsValue(currentChat.current);
                    }
                  },
                  items: [
                    {
                      label: t`Star`,
                      key: "star",
                      icon: <StarOutlined />,
                    },
                    {
                      label: t`Rename`,
                      key: "rename",
                      icon: <EditOutlined />,
                    },
                    {
                      label: t`Remove`,
                      key: "remove",
                      icon: <DeleteOutlined />,
                      danger: true,
                    },
                  ],

                }} placement="bottomRight">
                  <EllipsisOutlined onClick={(e) => {
                    e.stopPropagation();
                  }} className="hidden menus rounded text-center absolute right-0 bg-white text-sky-400"
                    style={{ top: "50%", transform: "translateY(-50%)", fontSize: 16 }} />
                </Dropdown>

              </div>

            </Popover>);
          },
        }]} dataSource={ChatHistory.get().data
          .filter((x) => {
            if (selectGptsKey.current == null || x.agentKey == selectGptsKey.current || x["gptsKey"] == selectGptsKey.current) {
              if (historyFilterType.current == "all") {
                return !x.isCalled && !x.isTask;
              } else if (historyFilterType.current == "agent") {
                return x.isCalled == true;
              } else if (historyFilterType.current == "task") {
                return x.isTask == true;
              } else if (historyFilterType.current == "star") {
                return x.icon == "⭐";
              } else {
                return (
                  historyFilterSearchValue == "" ||
                  x.label
                    .toString()
                    .toLowerCase()
                    .includes(historyFilterSearchValue)
                );
              }
            } else {
              return false;
            }
          })}></Table>
    </div>
  );

  /** 调用工具模态框开关状态 */
  const [callToolOpen, setCallToolOpen] = useState(false);
  /** 调用工具表单实例 */
  const [callToolForm] = Form.useForm();
  /** 当前工具信息 */
  const [currTool, setCurrTool] = useState({} as any);
  /** 当前工具执行结果 */
  const [currToolResult, setCurrToolResult] = useState({
    data: null as any,
    error: null as any,
  });

  /** Ant Design主题token */
  const { token } = theme.useToken();
  /** 编辑器引用 */
  const editorRef = useRef<any>(null);

  // 渲染组件JSX
  return (
    <div key={sessionID} className="chat relative h-full">
      <div className="h-full rounded-lg bg-white">
        <XProvider>

          <div className="flex h-full">
            {mobile.current.is ? (
              <>
                <Drawer
                  placement="left"
                  className="chat"
                  onClose={(e) => {
                    DATA.current.showHistory = false;
                    refresh();
                  }}
                  footer={null}
                  title={t`Chat Logs`}
                  open={DATA.current.showHistory}
                  getContainer={false}
                >
                  {historyShowNode}
                </Drawer>
              </>
            ) :
              <div style={{ display: DATA.current.showHistory ? "block" : "none" }} className="hidden h-full w-0 flex-none overflow-hidden pr-2 lg:block lg:w-60">
                {historyShowNode}
              </div>
            }
            <Divider style={{ display: !mobile.current.is && DATA.current.showHistory ? "block" : "none" }} type="vertical" className="hidden h-full lg:block" />
            <div style={{ alignSelf: "stretch", width: (mobile.current.is) ? "100%" : DATA.current.showHistory ? "calc(100% - 265px)" : "100%" }}>
              <Spin wrapperClassName="my-spin w-full h-full"

                spinning={DATA.current.loadingMessages} indicator={<LoadingOutlined spin />} tip={t`Loading...`}  >
                <div
                  className="h-full flex w-full flex-col justify-between"

                >
                  {
                    DATA.current.diffs.length == 0 ?
                      <div className="msg-container overflow-auto">
                        {(currentChat.current.messages == null ||
                          currentChat.current.messages?.length == 0) && (
                            <>
                              <Welcome
                                icon="👋"
                                title={t`Welcome`}
                                className="mb-4"
                                description={
                                  Agents.get().data.length > 0
                                    ? t`Choose a prompt from below, and let's start chatting`
                                    : t`Start chatting`
                                }
                              />
                              <Space>
                                <Input
                                  placeholder="search"
                                  value={botSearchValue}
                                  onChange={(e) => {
                                    setBotSearchValue(e.target.value);
                                  }}
                                  allowClear
                                ></Input>
                                <Button
                                  onClick={() => {
                                    setPromptsModalValue({
                                      confirm_call_tool: false,
                                    } as any);
                                    setIsOpenPromptsModal(true);
                                  }}
                                >
                                  {t`Add Agent`}
                                </Button>
                              </Space>

                              <div className="flex items-center">
                                <div className="flex flex-wrap">
                                  <DndContext
                                    sensors={botSearchValue != "" ? [] : [sensors]}
                                    onDragEnd={(e) => {
                                      try {
                                        let data = Agents.get().data;
                                        let oldIndex = data.findIndex(
                                          (x) => x.key == e.active.id,
                                        );

                                        let newIndex = data.findIndex(
                                          (x) => x.key == e.over.id,
                                        );

                                        let item = data[oldIndex];

                                        data.splice(oldIndex, 1);

                                        data.splice(newIndex, 0, item);

                                        Agents.save();
                                        refresh();
                                      } catch { }
                                    }}
                                  >
                                    <SortableContext
                                      items={(Agents.get()
                                        .data).filter(
                                          (x) =>
                                            botSearchValue == "" ||
                                            x.label
                                              .toLowerCase()
                                              .includes(botSearchValue),
                                        )
                                        .map((x) => x.key)}
                                    >
                                      {(Agents.get()
                                        .data).filter(
                                          (x) =>
                                            botSearchValue == "" ||
                                            x.label
                                              .toLowerCase()
                                              .includes(botSearchValue),
                                        )
                                        .map((item) => (
                                          <SortableItem
                                            key={item.key}
                                            id={item.key}
                                            item={item}
                                            onClick={(item) => {
                                              // console.log("onGPTSClick", item);
                                              onGPTSClick(item.key);
                                            }}
                                            onEdit={() => {
                                              let value = Agents.get().data.find(
                                                (y) => y.key === item.key,
                                              );
                                              setPromptsModalValue(value);
                                              setIsOpenPromptsModal(true);
                                            }}
                                            onRemove={() => {
                                              Modal.confirm({
                                                title: "Tip",
                                                maskClosable: true,
                                                content: "Are you sure to delete?",
                                                onOk: async () => {
                                                  let index = Agents.get().data.findIndex(
                                                    (y) => y.key === item.key,
                                                  );
                                                  Agents.get().data.splice(index, 1);
                                                  await Agents.save();
                                                  call("openMcpClient", { clientName: "hyper_agent" });
                                                  refresh();
                                                },
                                                onCancel(...args) { },
                                              });
                                            }}
                                          />
                                        ))}
                                    </SortableContext>
                                  </DndContext>
                                </div>
                              </div>
                            </>
                          )}

                        <Messages messages={currentChat.current.messages} onSumbit={(messages) => {
                          currentChat.current.messages = messages;
                          refresh();
                          onRequest();
                        }} status={openaiClient.current?.status}
                          onClone={async (i) => {
                            let clone = _.cloneDeep(currentChat.current);
                            clone.key = getMyUuid();
                            clone.messages = clone.messages.slice(0, i + 1);
                            clone.icon = "";

                            await call("addChatHistory", { item: clone });
                            ChatHistory.get().data.unshift(clone);

                            loadMoreData(false, false);
                          }}></Messages>
                      </div>
                      : <Splitter layout={window.innerHeight > window.innerWidth ? "vertical" : "horizontal"} className="msg-container overflow-auto">
                        <Splitter.Panel>
                          <div className="h-full">
                            {(currentChat.current.messages == null ||
                              currentChat.current.messages?.length == 0) && (
                                <>
                                  <Welcome
                                    icon="👋"
                                    title={t`Welcome`}
                                    className="mb-4"
                                    description={
                                      Agents.get().data.length > 0
                                        ? t`Choose a prompt from below, and let's start chatting`
                                        : t`Start chatting`
                                    }
                                  />
                                  <Space>
                                    <Input
                                      placeholder="search"
                                      value={botSearchValue}
                                      onChange={(e) => {
                                        setBotSearchValue(e.target.value);
                                      }}
                                      allowClear
                                    ></Input>
                                    <Button
                                      onClick={() => {
                                        setPromptsModalValue({
                                          confirm_call_tool: false,
                                        } as any);
                                        setIsOpenPromptsModal(true);
                                      }}
                                    >
                                      {t`Add Agent`}
                                    </Button>
                                  </Space>

                                  <div className="flex items-center">
                                    <div className="flex flex-wrap">
                                      <DndContext
                                        sensors={botSearchValue != "" ? [] : [sensors]}
                                        onDragEnd={(e) => {
                                          try {
                                            let data = Agents.get().data;
                                            let oldIndex = data.findIndex(
                                              (x) => x.key == e.active.id,
                                            );

                                            let newIndex = data.findIndex(
                                              (x) => x.key == e.over.id,
                                            );

                                            let item = data[oldIndex];

                                            data.splice(oldIndex, 1);

                                            data.splice(newIndex, 0, item);

                                            Agents.save();
                                            refresh();
                                          } catch { }
                                        }}
                                      >
                                        <SortableContext
                                          items={(Agents.get()
                                            .data).filter(
                                              (x) =>
                                                botSearchValue == "" ||
                                                x.label
                                                  .toLowerCase()
                                                  .includes(botSearchValue),
                                            )
                                            .map((x) => x.key)}
                                        >
                                          {(Agents.get()
                                            .data).filter(
                                              (x) =>
                                                botSearchValue == "" ||
                                                x.label
                                                  .toLowerCase()
                                                  .includes(botSearchValue),
                                            )
                                            .map((item) => (
                                              <SortableItem
                                                key={item.key}
                                                id={item.key}
                                                item={item}
                                                onClick={(item) => {
                                                  // console.log("onGPTSClick", item);
                                                  onGPTSClick(item.key);
                                                }}
                                                onEdit={() => {
                                                  let value = Agents.get().data.find(
                                                    (y) => y.key === item.key,
                                                  );
                                                  setPromptsModalValue(value);
                                                  setIsOpenPromptsModal(true);
                                                }}
                                                onRemove={() => {
                                                  Modal.confirm({
                                                    title: "Tip",
                                                    maskClosable: true,
                                                    content: "Are you sure to delete?",
                                                    onOk: async () => {
                                                      let index = Agents.get().data.findIndex(
                                                        (y) => y.key === item.key,
                                                      );
                                                      Agents.get().data.splice(index, 1);
                                                      await Agents.save();
                                                      call("openMcpClient", { clientName: "hyper_agent" });
                                                      refresh();
                                                    },
                                                    onCancel(...args) { },
                                                  });
                                                }}
                                              />
                                            ))}
                                        </SortableContext>
                                      </DndContext>
                                    </div>
                                  </div>
                                </>
                              )}

                            <Messages messages={currentChat.current.messages} onSumbit={(messages) => {
                              currentChat.current.messages = messages;
                              refresh();
                              onRequest();
                            }} status={openaiClient.current?.status}
                              onClone={async (i) => {
                                let clone = _.cloneDeep(currentChat.current);
                                clone.key = v4();
                                clone.messages = clone.messages.slice(0, i + 1);
                                clone.icon = "";

                                await call("addChatHistory", { item: clone });
                                ChatHistory.get().data.unshift(clone);

                                loadMoreData(false, false);
                              }}></Messages>
                          </div>


                        </Splitter.Panel>

                        {
                          DATA.current.diffs.map((x, i) => {
                            return <Splitter.Panel key={i} className="h-full"  >
                              <Watermark className="h-full  relative" content={x.label} font={{
                                color: "rgba(0,0,0,.25)",
                              }}>
                                <div className=" absolute top-0 right-0 cursor-pointer z-10 text-red-400" onClick={() => {
                                  DATA.current.diffs = DATA.current.diffs.filter((_, j) => j != i);
                                  refresh();
                                }}><CloseCircleOutlined /></div>
                                <Messages readOnly messages={x.messages} onSumbit={(messages) => {

                                }} status={x.openaiClient?.status}></Messages>
                              </Watermark>
                            </Splitter.Panel>;
                          })}
                      </Splitter>
                  }




                  <div className="my-footer flex-grow-0 pt-1">
                    <div className="my-op flex justify-between">
                      <div className="op-left">
                        <span>
                          <>
                            <span>
                              <Button
                                size="small"
                                onClick={() => {
                                  DATA.current.showHistory =
                                    !DATA.current.showHistory;
                                  refresh();
                                }}
                              >
                                {DATA.current.showHistory ? (
                                  <MenuFoldOutlined />
                                ) : (
                                  <MenuUnfoldOutlined />
                                )}
                              </Button>

                              <Divider type="vertical" />
                            </span>
                            {currentChat.current.agentKey && (
                              <>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    currentChatReset({
                                      messages: [],
                                      // 返回
                                      allowMCPs: AppSetting.get().defaultAllowMCPs,
                                      sented: false,
                                      agentKey: undefined,
                                    });
                                    selectGptsKey.current = undefined;
                                    loadMoreData(false);
                                  }}
                                >
                                  <LeftOutlined />
                                </Button>
                                <Divider type="vertical" />
                              </>
                            )}
                          </>
                        </span>
                        <Tooltip title={t`New Chat`}>
                          <PlusCircleOutlined
                            className="cursor-pointer hover:text-cyan-400"
                            onClick={() => {
                              if (currentChat.current.agentKey) {
                                let key =
                                  currentChat.current.agentKey ||
                                  currentChat.current["gptsKey"];
                                onGPTSClick(key);
                              } else {
                                currentChatReset({
                                  messages: [],
                                  allowMCPs: AppSetting.get().defaultAllowMCPs,
                                  sented: false,
                                  agentKey: undefined,
                                });
                                selectGptsKey.current = undefined;
                              }
                            }}
                          />
                        </Tooltip>
                        <Divider type="vertical" />
                        <Tooltip title={t`Clear Context`}>
                          <ClearOutlined
                            className="cursor-pointer hover:text-cyan-400"
                            onClick={() => {

                              calcAttachDialogue(
                                currentChat.current.messages,
                                0,
                                true,
                              );
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
                                  ? `${getDefaultModelConfigSync(AI_MODELS).provider}:${getDefaultModelConfigSync(AI_MODELS).name}`
                                  : "Please add a LLM model"
                              }
                              className="w-60"
                              allowClear
                              value={currentChat.current.modelKey}
                              onChange={(value) => {
                                currentChat.current.modelKey = value;
                                refresh();
                              }}
                              options={AI_MODELS.getGroupedByProvider()}
                            ></Select>
                          </span>
                        </Tooltip>
                        <Divider type="vertical" />

                        <SettingOutlined
                          title={t`Settings`}
                          className="cursor-pointer hover:text-cyan-400"
                          onClick={() => {
                            setIsOpenMoreSetting(true);
                            formMoreSetting.resetFields();
                            formMoreSetting.setFieldsValue(currentChat.current);
                          }}
                        />

                      </div>
                      <div className="flex">
                        <div>
                          {
                            electronData.get().isDeveloper && <Button size="small" title={t`Download Chat Config`} onClick={() => {
                              let a = document.createElement("a");
                              a.href = URL.createObjectURL(
                                new Blob([JSON.stringify(currentChat.current, null, 2)], { type: "text/json" }),
                              );
                              a.download = (currentChat.current.key || "none") + ".json";
                              a.click();
                            }}><DownloadOutlined /></Button>
                          }
                        </div>

                        <Divider type="vertical" />
                        <Link style={{ color: "inherit" }} title={t`edit variables`} to={"/Setting/VariableList"}> <Icon name="var" className="hover:text-cyan-400"></Icon></Link>
                        <Divider type="vertical" />
                        <Dropdown
                          trigger={['click']}
                          arrow
                          menu={{
                            selectable: true,
                            items: AI_MODELS.get()
                              .data.filter(
                                (x) => x.type == "llm" || x.type == null,
                              )
                              .map((x) => {
                                return {
                                  label: <>{x.name}{DATA.current.diffs.find(y => y.modelKey == x.key) && <><CheckOutlined /></>}</>,
                                  value: x.key,
                                  key: x.key,
                                };
                              }),
                            onClick: (e) => {
                              if (!DATA.current.diffs.find(x => x.modelKey == e.key)) {
                                let name = AI_MODELS.get().data.find((x) => x.key == e.key)?.name;
                                DATA.current.diffs.push({ modelKey: e.key, messages: currentChat.current.messages, openaiClient: undefined, label: name });
                                refresh();
                              } else {
                                DATA.current.diffs = DATA.current.diffs.filter(x => x.modelKey != e.key);
                                refresh();
                              }
                            },
                          }}
                        >
                          <Button size="small" title={t`Model Comparison in Chat`}>
                            <Icon name="duibi"></Icon>
                          </Button>
                        </Dropdown>
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

                    <div className="my-sender-container">
                      <Editor
                        onDragFile={async (file: any) => {
                          if (!file) {
                            return;
                          }
                          if (file.path) {
                            editorRef.current?.insertTextAtCursor(file.path);
                          } else {
                            if (file.type.includes("image")) {
                              let path = await blobToBase64(file);
                              resourceResListRef.current.push({
                                call_name: "UserUpload",
                                contents: [
                                  {
                                    path: path,
                                    blob: path,
                                    type: "image",
                                  },
                                ],
                                uid: v4(),
                              });
                              refresh();
                            } else {
                              message.warning(t`please uplaod image`);
                            }
                          }
                        }}

                        onParseFile={async (file) => {
                          if (!file) {
                            return;
                          }
                          if (file.type.includes("image")) {
                            let path = await blobToBase64(file);
                            resourceResListRef.current.push({
                              call_name: "UserUpload",
                              contents: [
                                {
                                  path: path,
                                  blob: path,
                                  type: "image",
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
                          padding: "4px 0px 4px",
                        }} autoHeight rows={1} maxRows={10} value={value}
                        onChange={(nextVal) => {
                          setValue(nextVal);
                        }}
                        onSubmit={(s) => {
                          if (DATA.current.suggestionShow) {
                            return;
                          }
                          if (s == "") {
                            return;
                          }
                          onRequest(s);
                          setValue("");
                          editorRef.current?.setValue("");
                        }}
                        fontSize={16}
                        lineHeight={28}
                        placeholder={t`You can use variables by enter namespace, for example, enter var, or use @ to call other agents.`}
                      />

                      <Sender
                        className="my-sender"
                        footer={({ components }) => {
                          const { SendButton, LoadingButton, SpeechButton } = components;
                          return (
                            <Flex justify="space-between" align="center">
                              <Flex align="center">

                                {supportImage && (
                                  <>
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
                                                path: path,
                                                blob: await urlToBase64(path),
                                                type: "image",
                                              },
                                            ],
                                            uid: v4(),
                                          });
                                          refresh();
                                        } else {
                                          message.warning(t`please uplaod image`);
                                        }
                                        return false;
                                      }}
                                    >
                                      <Button
                                        type="text"
                                        icon={<LinkOutlined />}
                                        onClick={() => { }}
                                      />
                                    </Upload>
                                    {/* <Divider type="vertical" /> */}
                                  </>)}

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

                                          let load = mcpClients.filter(
                                            (v) => v.status == "connected",
                                          ).length;
                                          let all = mcpClients.filter(x => x.status !== "disabled").length;
                                          let curr = mcpClients.filter((v) => {
                                            return v.status !== "disabled" && set.has(v.name);
                                          }).length;

                                          return DATA.current.mcpLoading ? (
                                            <>
                                              {`${curr} `}
                                              <SyncOutlined spin />
                                              {`(${load}/${all})`}
                                            </>
                                          ) : (
                                            curr
                                          );
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
                                {/* <Divider type="vertical" /> */}
                                <Tooltip title={t`Resources`} placement="bottom">
                                  <Dropdown
                                    placement="top"
                                    trigger={["click"]}
                                    menu={{
                                      items: resourcesRef.current.map((x, i) => {
                                        return {
                                          key: x.key,
                                          label: !x.description
                                            ? x.key
                                            : `${x.key}--${x.description}`,
                                        };
                                      }),
                                      onClick: async (item) => {
                                        let resource = resourcesRef.current.find(
                                          (x) => x.key === item.key,
                                        );
                                        if (resource) {
                                          let res = await call("mcpCallResource", {
                                            name: resource.clientName as string,
                                            uri: resource.uri,
                                          });
                                          let t = {
                                            ...res,
                                            call_name: resource.key + "--" + resource.uri,
                                            uid: v4(),
                                          };
                                          console.log("mcpCallResource", t);
                                          resourceResListRef.current.push(t);
                                          refresh();
                                        }
                                      },
                                    }}
                                    arrow
                                  >
                                    <Button size="small" type="default" className="cursor-pointer border-0">
                                      <Icon name="resources" />{" "}
                                      {resourcesRef.current.length}
                                    </Button>
                                  </Dropdown>
                                </Tooltip>

                                <Tooltip title={t`Prompts`} placement="bottom">
                                  <Dropdown
                                    placement="top"
                                    trigger={["click"]}
                                    menu={{
                                      items: promptsRef.current.map((x, i) => {
                                        return {
                                          key: x.key,
                                          label: `${x.key} (${x.description})`,
                                        };
                                      }),
                                      onClick: async (item) => {
                                        let prompt = promptsRef.current.find(
                                          (x) => x.key === item.key,
                                        );
                                        if (prompt) {
                                          if (
                                            prompt.arguments &&
                                            prompt.arguments.length > 0
                                          ) {
                                            setIsFillPromptModalOpen(true);
                                            setFillPromptFormItems(prompt.arguments);
                                            mcpCallPromptCurr.current = prompt;
                                          } else {
                                            let res = await call("mcpCallPrompt", {
                                              name: prompt.clientName as string,
                                              functionName: prompt.name,
                                              args: {},
                                            });
                                            console.log("mcpCallPrompt", res);
                                            res.call_name = prompt.key;
                                            res.uid = v4();
                                            promptResList.current.push(res);
                                            refresh();

                                          }
                                        }
                                      },
                                    }}
                                    arrow
                                  >
                                    <Button size="small" type="default" className="cursor-pointer border-0">
                                      <Icon name="prompts" />{" "}
                                      {promptsRef.current.length}
                                    </Button>
                                  </Dropdown>
                                </Tooltip>
                              </Flex>
                              <Flex align="center">
                                {/* <Button type="text" style={{
                                    fontSize: 18,
                                    color: token.colorText,
                                  }} icon={<ApiOutlined />} />

                                  <Divider type="vertical" /> */}
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
                          // if (nextVal === "/") {
                          //   onTrigger();
                          // } else if (!nextVal) {
                          //   onTrigger(false);
                          // }
                          setValue(nextVal);
                        }}
                        onCancel={() => {
                          setLoading(false);
                          openaiClient.current?.cancel();
                          for (let d of DATA.current.diffs) {
                            d.openaiClient?.cancel();
                          }
                          // message.success("Cancel sending!");
                        }}
                        onSubmit={(s) => {
                          if (DATA.current.suggestionShow) {
                            return;
                          }
                          onRequest(value);
                          setValue("");
                          editorRef.current?.setValue("");
                        }}
                        placeholder={t`Start inputting, You can use @ to call other agents, or quickly enter`}
                      />
                    </div>

                  </div>
                </div>
              </Spin>
            </div>
          </div>
        </XProvider>
        <PromptsModal
          open={isOpenPromptsModal}
          onCreate={async (value) => {
            if (value.key) {
              const index = Agents.get().data.findIndex(
                (y) => y.key == value.key,
              );
              if (index !== -1) {
                Agents.get().data[index] = value as any;
              }
            } else {
              Agents.get().data.push({
                ...value,
                key: v4(),
                allowMCPs: value.allowMCPs || [],
              });
            }
            await Agents.save();
            Agents.get().data.forEach((x) => {
              getAgentNameObj.current[x.key] = x.label;
            });
            // 修改更新agents状态
            call("openMcpClient", { clientName: "hyper_agent" });
            refresh();
            setIsOpenPromptsModal(false);
          }}
          initialValues={promptsModalValue}
          onCancel={() => {
            setIsOpenPromptsModal(false);
          }}
        ></PromptsModal>
        <Modal
          width={1000}
          open={isToolsShow}
          onCancel={() => setIsToolsShow(false)}
          maskClosable
          title={t`MCP Tool`}
          // onOk={() => setIsToolsShow(false)}
          footer={[
            <Button
              key="2"
              onClick={async () => {
                AppSetting.get().defaultAllowMCPs =
                  currentChat.current.allowMCPs;
                await AppSetting.save();
                setIsToolsShow(false);
              }}
            >{t`Set Default`}</Button>,
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
              let [clientName, _] = (selectedKeys[0] as string).split(" > ");
              if (info.node.isLeaf) {

                if (info.node.checked) {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => x != selectedKeys[0]);
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => x != clientName);
                } else {
                  currentChat.current.allowMCPs.push(selectedKeys[0] as string);
                }
              } else {
                if (info.node.halfChecked || info.node.checked == false) {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => !x.startsWith(clientName));
                  currentChat.current.allowMCPs.push(info.node.key);
                  info.node.children.forEach((x) => {
                    currentChat.current.allowMCPs.push(x.key as string);
                  });
                } else {
                  currentChat.current.allowMCPs = currentChat.current.allowMCPs.filter(x => !x.startsWith(clientName));
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
                title: (<Tooltip title={x.servername}>
                  <span>
                    {x.name}{" "}{x.source == "builtin" ? <Tag color="blue">{t`built-in`}</Tag> : null}
                    {x.status == "connected" ? null : x.status ==
                      "connecting" ? (
                      <SyncOutlined spin className="m-1 text-blue-400" />
                    ) : (
                      x.source == "hyperchat" ? <Button
                        className="m-1"
                        size="small"
                        onClick={async () => {
                          x.status = "connecting";
                          refresh();
                          await call("openMcpClient", { clientName: x.name });
                        }}
                      >{t`Reload`}</Button> : <DisconnectOutlined className="text-red-400" />
                    )}
                  </span></Tooltip>
                ),
                key: x.name,
                children: x.tools.map((tool) => {
                  return {
                    title: (
                      <Tooltip title={tool.description}>
                        <span
                        >
                          {tool.origin_name || tool.name}
                          <ApiOutlined onClick={(e) => {
                            e.stopPropagation();
                            setCurrTool(tool);
                            setCurrToolResult({
                              data: null,
                              error: null,
                            });
                            callToolForm.resetFields();
                            setCallToolOpen(true);
                          }} title={t`run`} className=" hover:text-cyan-400 ml-1" />
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

        <Modal
          title={t`Call Tool`}
          open={callToolOpen}
          footer={[]}
          onCancel={() => setCallToolOpen(false)}
          forceRender={true}
          width={"80%"}
          zIndex={2000}
        >
          <Form
            // layout="vertical"
            form={callToolForm}
            // labelCol={{ span: 6 }}
            // wrapperCol={{ span: 18 }}
            onFinish={async (values) => {
              console.log("onFinish", values);
              try {
                let call_res = await call("mcpCallTool", {
                  name: currTool.clientName,
                  functionName: currTool.origin_name,
                  args: values,
                });
                setCurrToolResult({
                  data: call_res,
                  error: null,
                });

                // console.log(call_res);
              } catch (e) {
                setCurrToolResult({
                  data: null,
                  error: e,
                });
              }
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
                {currTool.restore_name || currTool?.function?.name}
              </span>
              <div><span>Tool description: </span>
                <span className="text-gray-400">{currTool?.function?.description}</span></div>
            </pre>
            {currTool.key
              ? JsonSchema2FormItemOrNull(
                currTool.function.parameters,
              ) || t`No parameters`
              : []}
            <Form.Item className="flex justify-end">
              <Button htmlType="submit">Submit</Button>
            </Form.Item>
          </Form>
          {currToolResult.data && (
            <div>
              <div>Result:</div>
              <div>{JSON.stringify(currToolResult.data)}</div>
            </div>
          )}
          {currToolResult.error && (
            <div>
              <div>Result:</div>
              <div>{currToolResult.error.toString()}</div>
            </div>
          )}
        </Modal>

        <Modal
          width={800}
          title={t`Fill Prompt Arguments`}
          open={isFillPromptModalOpen}
          okButtonProps={{ autoFocus: true, htmlType: "submit" }}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsFillPromptModalOpen(false);
          }}
          modalRender={(dom) => (
            <Form
              name="FillPrompt"
              clearOnDestroy
              onFinish={async (values) => {
                let prompt = mcpCallPromptCurr.current;
                let res = await call("mcpCallPrompt", {
                  name: prompt.clientName as string,
                  functionName: prompt.name,
                  args: values,
                });
                console.log("mcpCallPrompt", res);
                res.call_name = prompt.key;
                res.uid = v4();
                promptResList.current.push(res);
                refresh();
                setIsFillPromptModalOpen(false);
              }}
            >
              {dom}
            </Form>
          )}
        >
          {fillPromptFormItems.map((x) => {
            return (
              <Form.Item
                key={x.name}
                name={x.name}
                label={x.name}
                rules={[{ required: x.required, message: "Please enter" }]}
              >
                <Input placeholder={x.description}></Input>
              </Form.Item>
            );
          })}
        </Modal>
        <Modal
          width={800}
          title={t`More Setting`}
          open={isOpenMoreSetting}
          okButtonProps={{ autoFocus: true, htmlType: "submit" }}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsOpenMoreSetting(false);
          }}
          modalRender={(dom) => (
            <Form
              name="MoreSetting"
              form={formMoreSetting}
              clearOnDestroy
              onFinish={async (values) => {
                currentChat.current.attachedDialogueCount =
                  values.attachedDialogueCount;
                currentChat.current.temperature = values.temperature;

                calcAttachDialogue(
                  currentChat.current.messages,
                  currentChat.current.attachedDialogueCount,
                );

                currentChat.current.confirm_call_tool =
                  values.confirm_call_tool;
                let item = ChatHistory.get().data.find(
                  (x) => x.key === currentChat.current.key,
                );
                if (item) {
                  item.label = values.label;
                  currentChat.current.label = values.label;
                  await call("changeChatHistory", { item: currentChat.current });
                  loadMoreData();
                }
                refresh();
                setIsOpenMoreSetting(false);
              }}
            >
              {dom}
            </Form>
          )}
        >
          <Form.Item
            name="label"
            label={t`Name`}
          >
            <InputAI aiGen={async () => {
              let res = await rename([{
                role: "user" as const,
                content: `${currLang === "zhCN" ? "请使用中文" : ""}
${currentChat.current.messages.filter(x => x.role != "tool").map(x => {
                  return `` + x.role + `: ` + x.content;
                }).join("\n")}`
              }]);
              return res;
            }} />
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
        </Modal>

        {contextHolder}


      </div>
    </div>
  );
};
