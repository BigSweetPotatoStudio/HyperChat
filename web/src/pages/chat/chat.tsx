import {
  Attachments,
  Bubble,
  BubbleProps,
  Conversations,
  ConversationsProps,
  Prompts,
  Sender,
  Suggestion,
  ThoughtChain,
  Welcome,
  XProvider,
  useXAgent,
  useXChat,
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
import { getURL_PRE } from "../../common/call";
import "@xterm/xterm/css/xterm.css";
import _ from 'lodash';
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { z } from "zod";

function Pre(p) {
  return (
    <div>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        {p.children as string}
      </pre>
    </div>
  );
}

function urlToBase64(url: string) {
  return new Promise<string>((resolve, reject) => {
    // 创建图片对象
    const img = new Image();

    // 跨域支持
    img.crossOrigin = "Anonymous";

    img.onload = function () {
      // 创建画布
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 设置画布大小
      canvas.width = (this as any).width;
      canvas.height = (this as any).height;

      // 绘制图片
      ctx.drawImage(this as any, 0, 0);

      // 转换为 Base64
      const base64 = canvas.toDataURL("image/png");
      // console.log(base64);
      resolve(base64);
    };

    img.onerror = function () {
      reject(new Error("图片加载失败"));
    };

    // 设置图片源
    img.src = url;
  });
}

function blobToBase64(blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string); // reader.result 包含 Base64 字符串
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.onabort = () => {
      reject(new Error("读取中断"));
    };

    reader.readAsDataURL(blob);
  });
}

import {
  AlipayCircleOutlined,
  AppstoreOutlined,
  BarsOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  GithubOutlined,
  LoadingOutlined,
  SmileOutlined,
  StopOutlined,
  UserOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  RedoOutlined,
  StarOutlined,
  SearchOutlined,
  DownOutlined,
  SyncOutlined,
  LinkOutlined,
  FileImageOutlined,
  ToolOutlined,
  CopyOutlined,
  SettingOutlined,
  LeftOutlined,
  MinusCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  StockOutlined,
  WechatWorkOutlined,
  PlusCircleOutlined,
  CloseCircleOutlined,
  ClearOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckOutlined,
  DisconnectOutlined,
} from "@ant-design/icons";
import type { ConfigProviderProps, GetProp } from "antd";
import { MyMessage, OpenAiChannel } from "../../common/openai";
import {
  ChatHistory,
  GPT_MODELS,
  Agents,
  AppSetting,
  IMCPClient,
  electronData,
  HyperChatCompletionTool,
  Tool_Call,
} from "../../../../common/data";

import { PromptsModal } from "./promptsModal";
import {
  getClients,
  getTools,
  InitedClient,
} from "../../common/mcp";
import { EVENT } from "../../common/event";
import InfiniteScroll from "react-infinite-scroll-component";
import { call } from "../../common/call";
import { MyAttachR } from "./attachR";
import { DownImage, MarkDown, UserContent } from "./component";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortableItem";
import { QuickPath, SelectFile } from "../../common/selectFile";
import Clarity from "@microsoft/clarity";
import { ChatHistoryItem } from "../../../../common/data";
import { useForm } from "antd/es/form/Form";
import { t } from "../../i18n";
import { NumberStep } from "../../common/numberStep";
import { HeaderContext } from "../../common/context";
import dayjs from "dayjs";
import { sleep } from "../../common/sleep";
import { BetaSchemaForm, DrawerForm } from "@ant-design/pro-components";
import {
  JsonSchema2FormItem,
  JsonSchema2FormItemOrNull,
  JsonSchema2ProFormColumnsType,
} from "../../common/util";
import zodToJsonSchema from "zod-to-json-schema";
import { Icon } from "../../components/icon";
import { Messages } from "../../components/messages";
import { getFirstCharacter, getFirstEmoji } from "../../common";
import { Container, X } from "lucide-react";
import { setInterval } from "node:timers/promises";
import { getDefaultModelConfig, getDefaultModelConfigSync, rename } from "../../components/ai";
import { InputAI } from "../../components/input_ai";


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
}) => {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);
  useEffect(() => {
    loadMoreData(false);
  }, [globalState]);

  const [modal, contextHolder] = Modal.useModal();
  let getAgentNameObj = useRef({} as Record<string, string>);


  useEffect(() => {
    (async () => {
      try {
        DATA.current.loadingMessages = true;
        refresh();
        await Agents.init();
        await GPT_MODELS.init();
        await AppSetting.init();
        await ChatHistory.init();
        await electronData.init();
        Agents.get().data.forEach((x) => {
          getAgentNameObj.current[x.key] = x.label;
        });
        AppSetting.get().quicks = AppSetting.get().quicks.map((x: any) => {

          if (x.quick == null) {
            let quick = x.value;
            x.value = v4();
            return { label: x.label, value: x.value, quick: quick }
          } else {
            return x;
          }

        });
        // console.log("AppSetting", AppSetting.get().quicks);
        refresh();
        loadMoreData(false);

        if (agentData.agentKey) {
          try {
            // let agents = await GPTS.init();
            // let agent = agents.data.find((x) => x.label == data.agentKey);
            await onGPTSClick(agentData.agentKey);

            if (agentData.message) {
              await onRequest(agentData.message);
              agentData.onComplete(openaiClient.current.lastMessage.content);
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
              // currentChatReset({
              //   ...item,
              //   messages: [],
              // });

              if (item.messages == null || item.messages.length == 0 || item.version == "2.0") {

                let messages = await call("readJSON", [`messages/${item.key}.json`]).catch(() => []);
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
              // setTimeout(() => {

              currentChatReset(item);

              // });
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

  const openaiClient = useRef<OpenAiChannel>();

  // const clientsRef = useRef<InitedClient[]>([]);

  const promptsRef = useRef<InitedClient["prompts"]>([]);
  const resourcesRef = useRef<InitedClient["resources"]>([]);

  const [isOpenPromptsModal, setIsOpenPromptsModal] = useState(false);
  const [promptsModalValue, setPromptsModalValue] = useState({} as any);

  const [value, setValue] = React.useState("");

  const defaultChatValue: ChatHistoryItem = {
    label: "",
    key: "",
    messages: [],
    modelKey: undefined,
    agentKey: undefined,
    sended: false,
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

  const mobile = useRef({
    is: window.innerWidth < 1024,
  });

  const DATA = useRef({
    mcpLoading: false,
    showHistory: mobile.current.is ? false : true,
    suggestionShow: false,
    diffs: [] as Array<{
      messages: ChatHistoryItem["messages"];
      modelKey: string;
      openaiClient: OpenAiChannel;
      label: string;
    }>,
    loadingMessages: false,
    scrollBottom: true,
  });

  const currentChat = React.useRef<ChatHistoryItem>(defaultChatValue);
  const currentChatReset = async (
    newConfig: Partial<ChatHistoryItem>,
    prompt = "",
    // loadDefaultAllowMCPs = undefined,
  ) => {
    if (prompt) {
      newConfig.messages = [
        {
          role: "system" as const,
          content: prompt,
          content_date: Date.now(), // Corrected to use Date.now() for current timestamp
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
    setPromptResList([]);
    // let clients = await getClients().catch(() => []);
    // clientsRef.current = clients;

    // clientsRef.current;
    // let p = getPrompts(currentChat.current.allowMCPs);
    // promptsRef.current = p;
    // let r = getResourses(currentChat.current.allowMCPs);
    // resourcesRef.current = r;

    refresh();
  };

  useEffect(() => {
    let set = new Set();
    for (let tool_name of currentChat.current.allowMCPs) {
      let [name, _] = tool_name.split(" > ");
      set.add(name);
    }

    let prompts: IMCPClient["prompts"] = [];

    mcpClients
      .filter((m) => set.has(m.name))
      .forEach((v) => {
        prompts = prompts.concat(v.prompts);
      });
    promptsRef.current = prompts;

    let resources: IMCPClient["resources"] = [];

    mcpClients
      .filter((m) => set.has(m.name))
      .forEach((v) => {
        resources = resources.concat(v.resources);
      });
    resourcesRef.current = resources;

  }, [mcpClients, currentChat.current.allowMCPs]);

  const selectGptsKey = useRef<string | undefined>(undefined);
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


  const [loading, setLoading] = useState(false);
  let cacheOBJ = useRef({} as Record<string, OpenAiChannel>);
  const onRequest = useCallback(async (message?: string) => {
    Clarity.event(`sender-${process.env.NODE_ENV}`);
    console.log("onRequest", message);
    let confirm_call_tool_cb = (tool: Tool_Call) => {
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
                initialValues={tool.function.argumentsOBJ}
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
                    {tool.restore_name || tool.function.name}
                  </span>
                </pre>
                {JsonSchema2FormItemOrNull(
                  getTools().find(
                    (x) => x.restore_name == tool.restore_name,
                  ).function.parameters,
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
                          if (openaiClient.current) {
                            openaiClient.current.options.confirm_call_tool = false;
                          }
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
      let config = GPT_MODELS.get().data.find(
        (x) => x.key == modelKey,
      );
      if (config == null) {
        if (GPT_MODELS.get().data.length == 0) {
          EVENT.fire("setIsModelConfigOpenTrue");
          throw new Error("Please add LLM first");
        }
        config = await getDefaultModelConfig();
      }
      let openaiClient = (() => {
        let cacheKey = index;
        if (cacheOBJ.current[cacheKey]) {
          return cacheOBJ.current[cacheKey];
        }
        let res = new OpenAiChannel(
          {
            baseURL: config.baseURL,
            apiKey: config.apiKey,
            model: config.model,
          },
        );
        cacheOBJ.current[cacheKey] = res;
        return res;
      })();
      try {
        openaiClient.options = {
          ...config,
          provider: config.provider,
          baseURL: config.baseURL,
          apiKey: config.apiKey,
          model: config.model,
          call_tool_step: config.call_tool_step,
          supportTool: config.supportTool,
          supportImage: config.supportImage,
          isStrict: config.isStrict,

          requestType: currentChat.current.requestType,
          allowMCPs: currentChat.current.allowMCPs,
          temperature: currentChat.current.temperature,
          confirm_call_tool: currentChat.current.confirm_call_tool,
          confirm_call_tool_cb,
        }
        setOpenaiClient(openaiClient);
        openaiClient.messages = messages;
        if (message) {
          openaiClient.addMessage(
            {
              role: "user",
              content: message,
              content_date: new Date().getTime(),
            },
            resourceResListRef.current,
            promptResList,
          );
        }

        if (current) {
          if (currentChat.current.sended == false) {


            currentChat.current = {
              ...currentChat.current,

              key: v4(),
              label: message.toString(),
              messages: openaiClient.messages,
              sended: true,
              dateTime: Date.now(),
            };
            // ChatHistory.get().data.unshift(currentChat.current);


          } else {


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

            currentChat.current.label = label;
            currentChat.current.dateTime = Date.now();
            // let findIndex = ChatHistory.get().data.findIndex(
            //   (x) => x.key == currentChat.current.key,
            // );

            // if (findIndex > -1) {
            //   // let find = ChatHistory.get().data.splice(findIndex, 1)[0];

            //   currentChat.current.dateTime = Date.now();

            //   // Object.assign(find, currentChat.current);
            //   // ChatHistory.get().data.unshift(find);
            // }


          }
        }
        refresh();


        await openaiClient.completion(() => {
          Object.assign(messages, openaiClient.messages);
          refresh();

        });
        resourceResListRef.current = [];
        setPromptResList([]);

        calcAttachDialogue(
          openaiClient.messages,
          currentChat.current.attachedDialogueCount,
          false,
        );

        Object.assign(messages, openaiClient.messages)
        refresh();



        if (current) {
          // currentChat.current.messages = messages;
          // refresh();

          await call("addChatHistory", [currentChat.current])
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

        openaiClient.lastMessage.content_error = e.message;
        Object.assign(messages, openaiClient.messages)
        refresh();


        if (current) {
          // await ChatHistory.save();
          await call("addChatHistory", [currentChat.current])
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
      await Promise.allSettled(alls);
    } finally {
      setLoading(false);
    }
  }, []);

  const [isToolsShow, setIsToolsShow] = useState(false);

  const [loadMoreing, setLoadMoreing] = useState(false);
  const [conversations, setConversations] = useState<
    GetProp<ConversationsProps, "items">
  >([]);

  let loadIndex = useRef(0);

  const loadDataTatal = useRef(0);

  const [historyFilterSearchValue, setHistoryFilterSearchValue] = useState("");

  const historyFilterType = useRef<
    "all" | "star" | "search" | "agent" | "task"
  >("all");
  useEffect(() => {
    loadMoreData(false);
  }, [
    historyFilterType.current,
    historyFilterSearchValue,
    selectGptsKey.current,
  ]);


  const loadMoreData = useCallback(
    async (loadMore = true, loadIndexChange = true) => {
      // console.log(historyFilterType, historyFilterSearchValue, loadIndex.current);
      // console.log("loadMoreData: ", ChatHistory.get().data);
      if (ChatHistory.get().data.length == 0) {
        console.log("waiting ChatHistory init");
        return;
      }
      if (loadIndexChange) {
        if (loadMore) {
          loadIndex.current += 35;
        } else {
          loadIndex.current = 35;
        }
      }
      if (loadMoreing) {
        return;
      }
      setLoadMoreing(true);

      let formmatedData = ChatHistory.get()
        .data.filter((x) => {
          return (
            selectGptsKey.current == null ||
            x.agentKey == selectGptsKey.current ||
            x["gptsKey"] == selectGptsKey.current
          );
        })
        .filter((x) => {
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
        });
      loadDataTatal.current = formmatedData.length;
      formmatedData = formmatedData.slice(0, loadIndex.current);
      setConversations(formmatedData);
      // console.log("loadMoreData", loadIndex.current, loadDataTatal.current);
      setLoadMoreing(false);
    },
    [historyFilterSearchValue],
  );

  // const [resourceResList, setResourceResList] = React.useState<
  //   Array<
  //     MCPTypes.ReadResourceResult & {
  //       call_name: string;
  //       uid: string;
  //     }
  //   >
  // >([]);
  const resourceResListRef = useRef<
    Array<
      MCPTypes.ReadResourceResult & {
        call_name: string;
        uid: string;
      }
    >
  >([]);

  const [promptResList, setPromptResList] = React.useState([]);

  const [isFillPromptModalOpen, setIsFillPromptModalOpen] =
    React.useState(false);
  const [isOpenMoreSetting, setIsOpenMoreSetting] = React.useState(false);

  const [formMoreSetting] = useForm();

  const [fillPromptFormItems, setFillPromptFormItems] = React.useState([]);
  const mcpCallPromptCurr = useRef({} as any);

  const sensors = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const [botSearchValue, setBotSearchValue] = useState("");

  // const [historyFilterSign, setHistoryFilterSign] = useState<number>(0);



  let currModel = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    getDefaultModelConfigSync(GPT_MODELS)
  );

  let supportImage = currModel?.supportImage;

  let supportTool = currModel?.supportTool;

  let modelName = currModel?.name;
  // console.log("modelName", modelName);
  const scrollableDivID = useRef("scrollableDiv" + v4());

  const onActiveChange = async (key) => {
    if (currentChat.current.key == key) {
      return;
    }
    let item = ChatHistory.get().data.find((x) => x.key == key);
    if (item) {
      // console.log("onActiveChange", item);
      if (mobile.current.is) {
        DATA.current.showHistory = false;
      }
      // currentChat.current.messages=[]
      // refresh();
      if (item.messages == null || item.messages.length == 0 || item.version == "2.0") {
        try {
          DATA.current.loadingMessages = true;
          refresh();
          let messages = await call("readJSON", [`messages/${item.key}.json`]).catch(() => []);
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
        } finally {
          DATA.current.loadingMessages = false;
          refresh();
        }
      }
      await currentChatReset(item);
    }
  }


  let historyShowNode = (
    <>
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
      <div
        id={scrollableDivID.current}
        className="h-full w-full overflow-y-auto overflow-x-hidden lg:w-60"
        style={{
          height: "calc(100% - 70px)",
        }}
      >
        <InfiniteScroll
          dataLength={conversations.length}
          next={loadMoreData}
          hasMore={conversations.length < loadDataTatal.current}
          loader={
            <div style={{ textAlign: "center" }}>
              <Spin indicator={<RedoOutlined spin />} size="small" />
            </div>
          }
          endMessage={<Divider plain>Nothing 🤐</Divider>}
          scrollableTarget={scrollableDivID.current}
        >
          <Conversations
            items={conversations.map((x) => {
              let agentName = getAgentNameObj.current[x.agentKey || x["gptsKey"]];
              let first = getFirstCharacter(agentName);
              return {
                ...x,
                label: x.label.toString() + ` - ${dayjs(x.dateTime).format("YYYY-MM-DD HH:mm:ss")}` + (agentName ? ` - ${agentName}` : ""),
                icon: <>{first && <span className="rounded bg-slate-300 inline-block text-center" style={{ width: 22, height: 22 }}>{first}</span>}{x.icon == "⭐" ? <StarOutlined /> : undefined}</>,
              };
            })}
            activeKey={currentChat.current.key}
            onActiveChange={onActiveChange}
            menu={(conversation) => ({
              items: [
                // {
                //   label: "Operation 1",
                //   key: "operation1",
                //   icon: <EditOutlined />,
                // },
                {
                  label: t`Star`,
                  key: "star",
                  icon: <StarOutlined />,
                },
                // {
                //   label: t`Clone`,
                //   key: "clone",
                //   icon: <CopyOutlined />,
                // },
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
              onClick: async (menuInfo) => {
                menuInfo.domEvent.stopPropagation();
                // message.info(`Click ${conversation.key} - ${menuInfo.key}`);
                if (menuInfo.key === "remove") {


                  await call("removeChatHistory", [{ key: conversation.key }]);
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
                  // ChatHistory.save();
                  await call("changeChatHistory", [ChatHistory.get().data[index]])

                }
                if (menuInfo.key === "rename") {
                  await onActiveChange(conversation.key);

                  setIsOpenMoreSetting(true);
                  formMoreSetting.resetFields();
                  formMoreSetting.setFieldsValue(currentChat.current);
                }
              },
            })}
          />
        </InfiniteScroll>
      </div>
    </>
  );

  const [callToolOpen, setCallToolOpen] = useState(false);
  const [callToolForm] = Form.useForm();
  const [currTool, setCurrTool] = useState({} as any);
  const [currToolResult, setCurrToolResult] = useState({
    data: null as any,
    error: null as any,
  });

  const [isUpdateQuicks, setIsUpdateQuicks] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");


  return (
    <div key={sessionID} className="chat relative h-full">
      <div className="h-full rounded-lg bg-white">
        <XProvider>
          {mobile.current.is && (
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
          )}

          <div className="flex h-full">
            {!onlyView.histroyKey && DATA.current.showHistory && (
              <>
                <div className="hidden h-full w-0 flex-none overflow-hidden pr-2 lg:block lg:w-60">
                  {historyShowNode}
                </div>
                <Divider type="vertical" className="hidden h-full lg:block" />
              </>
            )}

            <div
              className="flex-grow-2 flex w-full flex-col justify-between"
              style={{ alignSelf: "stretch", width: mobile.current.is ? "100%" : DATA.current.showHistory ? "calc(100vw - 265px)" : "100%" }}
            >

              <Splitter layout={window.innerHeight > window.innerWidth ? "vertical" : "horizontal"} className="overflow-auto">
                <Splitter.Panel >
                  <Spin spinning={DATA.current.loadingMessages} indicator={<LoadingOutlined spin />} tip="Loading..." fullscreen />

                  <Watermark className="h-full  relative" content={DATA.current.diffs.length > 0 ? modelName : ""}>
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
                                    items={Agents.get()
                                      .data.filter(
                                        (x) =>
                                          botSearchValue == "" ||
                                          x.label
                                            .toLowerCase()
                                            .includes(botSearchValue),
                                      )
                                      .map((x) => x.key)}
                                  >
                                    {Agents.get()
                                      .data.filter(
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
                                                call("openMcpClient", ["hyper_agent"]);
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
                      {/* <Bubble.List
                      autoScroll={true}
                      style={{
                        paddingRight: 4,
                        height:
                          currentChat.current.messages?.length > 0 ? "100%" : 0,
                      }}
                      items={currentChat.current.messages
                        ?.map(format)
                        ?.filter((x) => x != null)}
                    /> */}
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

                          await call("addChatHistory", [clone]);
                          ChatHistory.get().data.unshift(clone);

                          loadMoreData(false, false);
                        }}></Messages>
                    </div>
                  </Watermark>

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
                                  sended: false,
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
                              sended: false,
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
                    <span className="inline-block">
                      <Tooltip title={t`MCP and Tools`}>
                        <span
                          className="cursor-pointer"
                          onClick={() => {
                            setIsToolsShow(true);
                          }}
                        >
                          {supportTool == null || supportTool == true ? (
                            <>
                              <span> <Icon name="mcp"></Icon></span>

                              <span className="px-1">
                                {(() => {
                                  let set = new Set();
                                  for (let tool_name of currentChat.current
                                    .allowMCPs) {
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
                              </span>
                            </>
                          ) : (
                            <><Icon name="mcp"></Icon> {t`LLM not support`}</>
                          )}
                        </span>
                      </Tooltip>
                      <Divider type="vertical" />
                      <Tooltip title={t`Resources`} placement="bottom">
                        <Dropdown
                          placement="top"
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
                                let res = await call("mcpCallResource", [
                                  resource.clientName as string,
                                  resource.uri,
                                ]);
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
                          <span className="cursor-pointer">
                            <Icon name="resources" />{" "}
                            {resourcesRef.current.length}
                          </span>
                        </Dropdown>
                      </Tooltip>
                      <Divider type="vertical" />
                      <Tooltip title={t`Prompts`} placement="bottom">
                        <Dropdown
                          placement="top"
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
                                  let res = await call("mcpCallPrompt", [
                                    prompt.clientName as string,
                                    prompt.name,
                                    {},
                                  ]);
                                  console.log("mcpCallPrompt", res);
                                  res.call_name = prompt.key;
                                  res.uid = v4();
                                  setPromptResList([...promptResList, res]);
                                }
                              }
                            },
                          }}
                          arrow
                        >
                          <span className="cursor-pointer">
                            <Icon name="prompts" />{" "}
                            {promptsRef.current.length}
                          </span>
                        </Dropdown>
                      </Tooltip>
                    </span>
                    <Divider type="vertical" />
                    <Tooltip title={t`Select LLM`}>
                      <span className="inline-block">
                        <Icon name="brain" />{" "}
                        <Select
                          size="small"
                          placeholder={
                            GPT_MODELS.get().data.length > 0
                              ? getDefaultModelConfigSync(GPT_MODELS).name
                              : "Please add a LLM model"
                          }
                          className="w-60"
                          allowClear
                          value={currentChat.current.modelKey}
                          onChange={(value) => {
                            currentChat.current.modelKey = value;
                            refresh();
                          }}
                          options={GPT_MODELS.get()
                            .data.filter(
                              (x) => x.type == "llm" || x.type == null,
                            )
                            .map((x) => {
                              return {
                                label: x.name,
                                value: x.key,
                              };
                            })}
                        ></Select>
                      </span>
                    </Tooltip>
                    <Divider type="vertical" />
                    <Tooltip title={t`Select Request Type`}>
                      <span className="inline-block">
                        <span>type:</span>
                        <Dropdown
                          trigger={['click']}
                          arrow
                          menu={{
                            selectable: true,
                            selectedKeys: [currentChat.current.requestType],
                            items: [
                              {
                                label: "stream",
                                key: "stream",
                              },
                              {
                                label: "complete",
                                key: "complete",
                              },
                            ],
                            onClick: (e) => {
                              currentChat.current.requestType = e.key as any;
                              refresh();
                            },
                          }}
                        >
                          <Button size="small" type="link">
                            {currentChat.current.requestType}
                            <DownOutlined />
                          </Button>
                        </Dropdown>
                      </span>
                    </Tooltip>
                    <Divider type="vertical" />
                    <SettingOutlined
                      title={t`Settings`}
                      className="cursor-pointer hover:text-cyan-400"
                      onClick={() => {
                        setIsOpenMoreSetting(true);
                        formMoreSetting.resetFields();
                        // console.log(currentChat.current);
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
                    <Dropdown
                      trigger={['click']}
                      arrow
                      menu={{
                        selectable: true,
                        items: GPT_MODELS.get()
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
                            let name = GPT_MODELS.get().data.find((x) => x.key == e.key)?.name;
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
                  promptResList={promptResList}
                  promptResListRemove={(x) => {
                    setPromptResList(
                      promptResList.filter((v) => v.uid != x.uid),
                    );
                    message.success(t`Delete Success`);
                  }}
                ></MyAttachR>

                <QuickPath
                  onChange={async (file) => {
                    if (file.path) {
                      setValue((value) => {
                        return value + " " + file.path;
                      });
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
                >
                  <Suggestion
                    items={[
                      {
                        label: "Agents",
                        value: "Agents",
                        children: Agents.get()
                          .data.filter((x) => x.callable)
                          .map((x) => {
                            return {
                              label: x.label,
                              value: x.key,
                            };
                          }),
                      },
                      {
                        label: "Quicks",
                        value: "Quicks",
                        children: AppSetting.get().quicks,
                      },
                      {
                        label: "UpdateQuicks",
                        value: "Update---Quicks",
                      },
                    ]}
                    onSelect={(itemVal) => {
                      let agent = Agents.get().data.find(
                        (x) => x.key == itemVal,
                      );
                      if (agent) {
                        DATA.current.suggestionShow = false;
                        let textarea = document.querySelector(
                          ".my-sender .ant-sender-input",
                        ) as HTMLTextAreaElement;
                        let position = textarea.selectionStart;

                        setValue((value) => {
                          return `${value.slice(0, position)}${agent.label} ${value.slice(position)}`;
                        });
                      } else {
                        if (itemVal == "Update---Quicks") {
                          setIsUpdateQuicks(true);
                          return;
                        } else {
                          DATA.current.suggestionShow = false;
                          let textarea = document.querySelector(
                            ".my-sender .ant-sender-input",
                          ) as HTMLTextAreaElement;
                          let position = textarea.selectionStart;
                          let quick = AppSetting.get().quicks.find(x => x.value == itemVal)?.quick;
                          setValue(`${value.slice(0, position - 1)}` + quick + ` ${value.slice(position)}`);
                          return;
                        }
                      }
                    }}
                    onOpenChange={(open) => {
                      DATA.current.suggestionShow = open;
                    }}
                  >
                    {({ onTrigger, onKeyDown }) => {
                      return (
                        <Sender
                          className="my-sender"
                          prefix={
                            supportImage && (
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
                            )
                          }
                          onKeyDown={(e) => {
                            if (DATA.current.suggestionShow) {
                              if (
                                e.key == "Enter" ||
                                e.key == "ArrowDown" ||
                                e.key == "ArrowUp" ||
                                e.key == "Escape" ||
                                e.key == "ArrowLeft" ||
                                e.key == "ArrowRight"
                              ) {
                                onKeyDown(e);
                              } else {
                                onTrigger(false);
                                DATA.current.suggestionShow = false;
                              }
                            } else {
                              if (e.key == "@") {
                                onTrigger(true);
                                DATA.current.suggestionShow = true;
                              }
                            }
                          }}
                          onPasteFile={async (file) => {
                            // console.log("onPasteFile", file);

                            if (file.type.includes("image")) {
                              let p = await blobToBase64(file);
                              resourceResListRef.current.push({
                                call_name: "UserUpload",
                                contents: [
                                  {
                                    path: p,
                                    blob: p,
                                    type: "image",
                                  },
                                ],
                                uid: v4(),
                              });
                              refresh();
                            } else {
                              message.warning(t`please uplaod image`);
                            }
                          }}
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
                            setValue("");
                            onRequest(s);
                          }}
                          placeholder={t`Start inputting, You can use @ to call other agents, or quickly enter`}
                        />
                      );
                    }}
                  </Suggestion>
                </QuickPath>
              </div>
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
            call("openMcpClient", ["hyper_agent"]);
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
            onCheck={(checkedKeys) => {
              // console.log("onCheck", checkedKeys);
              currentChat.current.allowMCPs = checkedKeys as string[];
              refresh();
            }}
            checkedKeys={currentChat.current.allowMCPs}
            treeData={mcpClients.filter(x => x.status != "disabled").map((x) => {
              return {
                title: (
                  <span>
                    {x.name}{" "}{x.source == "claude" ? <Tag color="blue">{t`claude`}</Tag> : x.source == "builtin" ? <Tag color="blue">{t`built-in`}</Tag> : null}
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
                          await call("openMcpClient", [x.name]);
                        }}
                      >{t`Reload`}</Button> : <DisconnectOutlined className="text-red-400" />
                    )}
                  </span>
                ),
                key: x.name,
                children: x.tools.map((t) => {
                  return {
                    title: (
                      <Tooltip title={t.function.description}>
                        <span
                          onClick={() => {
                            setCurrTool(t);
                            setCurrToolResult({
                              data: null,
                              error: null,
                            });
                            callToolForm.resetFields();
                            setCallToolOpen(true);
                          }}
                        >
                          {t.origin_name || t.function.name}
                        </span>
                      </Tooltip>
                    ),
                    key: t.restore_name,
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
                let call_res = await call("mcpCallTool", [
                  currTool.clientName,
                  currTool.origin_name,
                  values,
                ]);
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
                // zodToJsonSchema(
                // z.object({
                //   // paths: z.array(
                //   //   z.object({
                //   //     first: z.array(
                //   //       z.object({
                //   //         arr: z.array(
                //   //           z.string({
                //   //             description: "filesystem path",
                //   //           }),
                //   //         ),
                //   //       }),
                //   //     ),
                //   //     // s: z.string()
                //   //   }),
                //   // ),

                //   a: z.object({
                //     b: z.object({
                //       c: z.object({
                //         d: z.array(
                //           z.string({
                //             description: "filesystem path",
                //           }),
                //         ),
                //       }),
                //     }),
                //   }),
                // }),
                // ),
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
                let res = await call("mcpCallPrompt", [
                  prompt.clientName as string,
                  prompt.name,
                  values,
                ]);
                console.log("mcpCallPrompt", res);
                res.call_name = prompt.key;
                res.uid = v4();
                setPromptResList([...promptResList, res]);
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
                  await call("changeChatHistory", [currentChat.current]);
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
              let res = await rename(currentChat.current.messages.filter(x => x.role != "tool").map(x => {
                return {
                  role: x.role,
                  content: x.content || " ",
                } as any;
              }));
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
        <Modal
          open={isUpdateQuicks}
          title={t`Edit Quicks Words`}
          width={800}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => setIsUpdateQuicks(false)}
          onOk={() => setIsUpdateQuicks(false)}
        >
          <div>
            <ul className="mb-4">
              {AppSetting.get().quicks?.map((phrase, index) => (
                <li key={index} className="mb-2 rounded bg-gray-100 p-2">
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      size="small"
                      value={phrase.label}
                      onChange={async (e) => {
                        AppSetting.get().quicks[index].label = e.target.value;
                        refresh();
                      }}
                      placeholder="Label"
                    />
                    <Button
                      size="small"
                      type="primary"
                      onClick={async () => {
                        AppSetting.save();
                        message.success(t`Save Success`);
                        refresh();
                      }}
                    >
                      {t`Save`}
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={async () => {
                        AppSetting.get().quicks.splice(index, 1);
                        AppSetting.save();
                        message.success(t`Delete Success`);
                        refresh();
                      }}
                    >
                      {t`Delete`}
                    </Button>
                  </Space.Compact>

                  <Input.TextArea
                    size="small"
                    value={phrase.quick}
                    onChange={async (e) => {
                      AppSetting.get().quicks[index].quick = e.target.value;
                      refresh();
                    }}
                    placeholder="quick words"
                  />
                </li>
              ))}
            </ul>
            <h3 className="mb-2 font-bold">{t`Add Quick`}</h3>
            <Input
              size="small"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="New Words label"
            />
            <Input.TextArea
              size="small"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="New Words value"
            />
            <button
              className="w-full rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600"
              onClick={async () => {
                AppSetting.get().quicks.push({
                  label: newLabel,
                  value: v4(),
                  quick: newValue,
                });
                await AppSetting.save();
                refresh();
                setNewLabel("");
                setNewValue("");
              }}
            >
              {t`Add Quick`}
            </button>
          </div>
        </Modal>
        {contextHolder}

        {/* <Modal
          width={800}
          title={t`Rename`}
          open={isOpenMoreSetting}
          okButtonProps={{ autoFocus: true, htmlType: "submit" }}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsOpenMoreSetting(false);
          }}
        >
          <Form.Item
            label={t`Name`}
          >
            <Space.Compact className="w-full">
              <Input
                className="w-full"
                defaultValue={item.label}
                onChange={(e) => {
                  item.label = e.target.value;
                }}
              ></Input>
              <Popconfirm
                title={t`use AI?`}
                onConfirm={async () => {
                  let messages = await call("readJSON", [`messages/${item.key}.json`]).catch(() => []);
                  item.label = await rename(messages)
                }}
              >
                <Button className="text-yellow-400"><BulbOutlined /></Button>
              </Popconfirm>

            </Space.Compact>
          </Form.Item>

        </Modal> */}
      </div >
    </div >
  );
};

const calcAttachDialogue = (
  messages,
  attachedDialogueCount,
  overwrite = true,
) => {
  if (attachedDialogueCount == null) {
    attachedDialogueCount = 10;
  }
  let c = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    let m = messages[i];
    if (m.role == "system") {
      m.content_attached = true;
      continue;
    }

    if (overwrite) {
      m.content_attached = c < attachedDialogueCount;
    } else {
      if (m.content_attached == false && c < attachedDialogueCount) {
      } else {
        m.content_attached = c < attachedDialogueCount;
      }
    }

    if (m.role == "user") {
      c++;
    }
  }
};
