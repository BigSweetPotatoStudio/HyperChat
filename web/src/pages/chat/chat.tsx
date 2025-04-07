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
} from "@ant-design/icons";
import type { ConfigProviderProps, GetProp } from "antd";
import { MyMessage, OpenAiChannel } from "../../common/openai";
import {
  ChatHistory,
  GPT_MODELS,
  Agents,
  AppSetting,
} from "../../../../common/data";

import { PromptsModal } from "./promptsModal";
import {
  getClients,
  getMcpInited,
  getPrompts,
  getResourses,
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
import { Copy } from "lucide-react";
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
  const { globalState, updateGlobalState } = useContext(HeaderContext);
  useEffect(() => {
    loadMoreData(false);
  }, [globalState]);

  const [modal, contextHolder] = Modal.useModal();
  useEffect(() => {
    (async () => {
      await Agents.init();
      await GPT_MODELS.init();
      await AppSetting.init();
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

            // setTimeout(() => {
            currentChatReset(item);

            // });
          }
        }
      } else {
        if (AppSetting.get().defaultAllowMCPs == undefined) {
          let clients = await getClients().catch(() => []);
          AppSetting.get().defaultAllowMCPs = clients.map((v) => v.name);
        }

        currentChatReset(
          {
            allowMCPs: AppSetting.get().defaultAllowMCPs,
          },
          "",
        );
      }

      while (1) {
        if (getMcpInited() == true) {
          let clients = await getClients().catch(() => []);
          clientsRef.current = clients;
          let p = getPrompts(currentChat.current.allowMCPs);
          promptsRef.current = p;
          let r = getResourses(currentChat.current.allowMCPs);
          resourcesRef.current = r;

          DATA.current.mcpLoading = false;
          refresh();
          break;
        } else {
          let clients = await getClients().catch(() => []);
          clientsRef.current = clients;
          let p = getPrompts(currentChat.current.allowMCPs);
          promptsRef.current = p;
          let r = getResourses(currentChat.current.allowMCPs);
          resourcesRef.current = r;
          DATA.current.mcpLoading = false;
          refresh();
          break;
        }
      }
    })();
  }, []);

  const onGPTSClick = async (key: string, { loadHistory = true } = {}) => {
    let find = Agents.get().data.find((y) => y.key === key);
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
    if (loadHistory) {
      selectGptsKey.current = find.key;
      historyFilterType.current = "all";
      loadMoreData(false);
    }
  };

  const openaiClient = useRef<OpenAiChannel>();

  const clientsRef = useRef<InitedClient[]>([]);

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
    }>,
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
          role: "system",
          content: prompt,
        },
      ];
    }
    currentChat.current = {
      ...defaultChatValue,
      ...newConfig,
    };

    resourceResListRef.current = [];
    setPromptResList([]);
    let clients = await getClients().catch(() => []);
    clientsRef.current = clients;

    // clientsRef.current;
    let p = getPrompts(currentChat.current.allowMCPs);
    promptsRef.current = p;
    let r = getResourses(currentChat.current.allowMCPs);
    resourcesRef.current = r;

    refresh();
  };

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


  // const createChat = useCallback((showTip = true) => {
  //   let config = GPT_MODELS.get().data.find(
  //     (x) => x.key == currentChat.current.modelKey,
  //   );
  //   if (config == null) {
  //     if (GPT_MODELS.get().data.length == 0) {
  //       if (showTip) {
  //         EVENT.fire("setIsModelConfigOpenTrue");
  //       }
  //       throw new Error("Please add LLM first");
  //     }
  //     config = GPT_MODELS.get().data[0];
  //   }
  //   // currentChat.current.modelKey = config.key;
  //   // DATA.current.suggestionShow = false;
  //   openaiClient.current = OpenAiChannel.create(
  //     {
  //       // ...config,
  //       baseURL: config.baseURL,
  //       apiKey: config.apiKey,

  //     },
  //   );
  //   openaiClient.current.options = {
  //     ...openaiClient.current.options,
  //     model: config.model,
  //     call_tool_step: config.call_tool_step,
  //     supportTool: config.supportTool,
  //     supportImage: config.supportImage,

  //     requestType: currentChat.current.requestType,
  //     allowMCPs: currentChat.current.allowMCPs,
  //     temperature: currentChat.current.temperature,
  //     confirm_call_tool: currentChat.current.confirm_call_tool,
  //     confirm_call_tool_cb: (tool) => {
  //       return new Promise((resolve, reject) => {
  //         console.log("tool", tool);
  //         let m = modal.confirm({
  //           title: t`Comfirm Call Tool`,
  //           width: "90%",
  //           style: { maxWidth: 1024 },
  //           footer: [],
  //           content: (
  //             <div>
  //               <Form
  //                 initialValues={tool.function.argumentsJSON}
  //                 name="control-hooks"
  //                 onFinish={(e) => {
  //                   // console.log(e);
  //                   resolve(e);
  //                   m.destroy();
  //                 }}
  //               >
  //                 <pre
  //                   style={{
  //                     whiteSpace: "pre-wrap",
  //                     wordWrap: "break-word",
  //                     padding: "8px 0",
  //                     textAlign: "center",
  //                   }}
  //                 >
  //                   <span>Tool Name: </span>
  //                   <span className="text-purple-500">
  //                     {tool.restore_name || tool.function.name}
  //                   </span>
  //                 </pre>
  //                 {JsonSchema2FormItemOrNull(
  //                   getTools().find(
  //                     (x) => x.restore_name == tool.restore_name,
  //                   ).function.parameters,
  //                 ) || t`No parameters`}
  //                 <Form.Item>
  //                   <div className="flex flex-wrap justify-between">
  //                     <Button
  //                       onClick={() => {
  //                         m.destroy();
  //                         reject(new Error(t`User Cancel`));
  //                       }}
  //                     >{t`Cancel`}</Button>
  //                     <Space>
  //                       <Button
  //                         type="primary"
  //                         ghost
  //                         htmlType="submit"
  //                         onClick={() => {
  //                           currentChat.current.confirm_call_tool = false;
  //                           openaiClient.current.options.confirm_call_tool =
  //                             false;
  //                         }}
  //                       >
  //                         {t`Allow this Chat`}
  //                       </Button>
  //                       <Button type="primary" htmlType="submit">
  //                         {t`Allow Once`}
  //                       </Button>
  //                     </Space>
  //                   </div>
  //                 </Form.Item>
  //               </Form>
  //             </div>
  //           ),
  //         });
  //       });
  //     },
  //   }
  //   openaiClient.current.messages = currentChat.current.messages;

  //   // currentChat.current.messages = openaiClient.current.messages;
  //   refresh();
  // }, []);
  const [loading, setLoading] = useState(false);

  const onRequest = useCallback(async (message?: string) => {
    Clarity.event(`sender-${process.env.NODE_ENV}`);
    console.log("onRequest", message);
    try {
      setLoading(true);
      let config = GPT_MODELS.get().data.find(
        (x) => x.key == currentChat.current.modelKey,
      );
      if (config == null) {
        if (GPT_MODELS.get().data.length == 0) {
          EVENT.fire("setIsModelConfigOpenTrue");
          throw new Error("Please add LLM first");
        }
        config = GPT_MODELS.get().data[0];
      }
      openaiClient.current = OpenAiChannel.create(
        {
          baseURL: config.baseURL,
          apiKey: config.apiKey,
        },
      );
      openaiClient.current.options = {
        ...openaiClient.current.options,
        model: config.model,
        call_tool_step: config.call_tool_step,
        supportTool: config.supportTool,
        supportImage: config.supportImage,

        requestType: currentChat.current.requestType,
        allowMCPs: currentChat.current.allowMCPs,
        temperature: currentChat.current.temperature,
        confirm_call_tool: currentChat.current.confirm_call_tool,
        confirm_call_tool_cb: (tool) => {
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
                    initialValues={tool.function.argumentsJSON}
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
        },
      }
      openaiClient.current.messages = currentChat.current.messages;


      if (currentChat.current.sended == false) {
        if (message) {
          openaiClient.current.addMessage(
            {
              role: "user",
              content: message,
              content_date: new Date().getTime(),
            },
            resourceResListRef.current,
            promptResList,
          );
        }
        currentChat.current = {
          ...currentChat.current,
          // agentKey: currentChat.current.agentKey,
          // allowMCPs: currentChat.current.allowMCPs,
          // modelKey: currentChat.current.modelKey,

          key: v4(),
          label: message.toString(),
          messages: openaiClient.current.messages,
          sended: true,
          dateTime: Date.now(),
        };
        resourceResListRef.current = [];
        setPromptResList([]);
        ChatHistory.get().data.unshift(currentChat.current);
      } else {
        if (message) {
          openaiClient.current.addMessage(
            {
              role: "user",
              content: message,
              content_date: new Date().getTime(),
            },
            resourceResListRef.current,
            promptResList,
          );
        }
        let label = currentChat.current.label.toString();
        let firstUserContent = currentChat.current.messages.find(
          (x) => x.role == "user",
        )?.content;

        if (typeof firstUserContent == "string") {
          label = firstUserContent;
        } else if (Array.isArray(firstUserContent)) {
          label = firstUserContent.find((x) => x.type == "text")?.text || "";
        } else {
          label = firstUserContent.toString();
        }

        currentChat.current.label = label;

        let findIndex = ChatHistory.get().data.findIndex(
          (x) => x.key == currentChat.current.key,
        );

        if (findIndex > -1) {
          let find = ChatHistory.get().data.splice(findIndex, 1)[0];

          currentChat.current.dateTime = Date.now();

          Object.assign(find, currentChat.current);
          ChatHistory.get().data.unshift(find);
        }
      }
      openaiClient.current.options.allowMCPs = currentChat.current.allowMCPs;

      refresh();

      openaiClient.current.messages = currentChat.current.messages;
      await openaiClient.current.completion(() => {
        currentChat.current.messages = openaiClient.current.messages;
        refresh();
      });
      calcAttachDialogue(
        openaiClient.current.messages,
        currentChat.current.attachedDialogueCount,
        false,
      );

      currentChat.current.messages = openaiClient.current.messages;
      refresh();
      loadMoreData(false);
      await ChatHistory.save();
      // console.log("ChatHistory.d.data", ChatHistory.get().data.slice(0, 5));
    } catch (e) {
      console.error(e);
      if (openaiClient.current) {
        openaiClient.current.lastMessage.content_error = e.message;
        currentChat.current.messages = openaiClient.current.messages;
      }
      refresh();
      await ChatHistory.save();
      antdMessage.error(
        e.message || t`An error occurred, please try again later`,
      );
      // throw e;
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
    [],
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

  const historyFilterType = useRef<
    "all" | "star" | "search" | "agent" | "task"
  >("all");

  const [historyFilterSearchValue, setHistoryFilterSearchValue] = useState("");
  useEffect(() => {
    loadMoreData(false);
  }, [
    historyFilterType.current,
    historyFilterSearchValue,
    currentChat.current.agentKey,
  ]);

  let supportImage = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    GPT_MODELS.get().data[0]
  )?.supportImage;

  let supportTool = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    GPT_MODELS.get().data[0]
  )?.supportTool;

  const scrollableDivID = useRef("scrollableDiv" + v4());

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
              icon: "🤖",
            },
            {
              title: t`Task`,
              value: "task",
              icon: "📅",
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
              return {
                ...x,
                label: x.label.toString(),
                icon: x.icon == "⭐" ? <StarOutlined /> : undefined,
              };
            })}
            activeKey={currentChat.current.key}
            onActiveChange={(key) => {
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

                currentChatReset(item);
              }
            }}
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
                {
                  label: t`Clone`,
                  key: "clone",
                  icon: <CopyOutlined />,
                },
                {
                  label: t`Remove`,
                  key: "remove",
                  icon: <DeleteOutlined />,
                  danger: true,
                },
              ],
              onClick: (menuInfo) => {
                // message.info(`Click ${conversation.key} - ${menuInfo.key}`);
                if (menuInfo.key === "remove") {
                  let index = ChatHistory.get().data.findIndex(
                    (x) => x.key === conversation.key,
                  );
                  ChatHistory.get().data.splice(index, 1);
                  ChatHistory.save();
                  setConversations(
                    conversations.filter((x) => x.key !== conversation.key),
                  );
                  loadMoreData(false, false);
                  refresh();
                  message.success(t`Delete Success`);
                }
                if (menuInfo.key === "star") {
                  let index = ChatHistory.get().data.findIndex(
                    (x) => x.key === conversation.key,
                  );
                  if (ChatHistory.get().data[index].icon == "⭐") {
                    ChatHistory.get().data[index].icon = undefined;
                  } else {
                    ChatHistory.get().data[index].icon = "⭐";
                  }

                  ChatHistory.save();
                  refresh();
                }
                if (menuInfo.key === "clone") {
                  let index = ChatHistory.get().data.findIndex(
                    (x) => x.key === conversation.key,
                  );
                  let item = ChatHistory.get().data[index];

                  let clone = JSON.parse(JSON.stringify(item));
                  ChatHistory.get().data.unshift({
                    ...clone,
                    key: v4(),
                    label: `${item.label} - Clone`,
                    dateTime: Date.now(),
                  });
                  ChatHistory.save();
                  loadMoreData(false, false);
                  refresh();
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
              style={{ alignSelf: "stretch" }}
            >

              <Splitter className="overflow-auto">
                <Splitter.Panel defaultSize="50%" min="30%" max="70%">
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
                    }}></Messages>
                  </div>
                </Splitter.Panel>

                {
                  DATA.current.diffs.map((x, i) => {
                    return <Splitter.Panel key={i} ><Messages messages={x.messages} onSumbit={(messages) => {

                    }}></Messages></Splitter.Panel>;
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
                            onGPTSClick(key, { loadHistory: false });
                          } else {
                            currentChatReset({
                              messages: [],
                              allowMCPs: AppSetting.get().defaultAllowMCPs,
                              sended: false,
                              agentKey: undefined,
                            });
                            selectGptsKey.current = undefined;
                            loadMoreData(false);
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
                              💻
                              <span className="px-1">
                                {(() => {
                                  let set = new Set();
                                  for (let tool_name of currentChat.current
                                    .allowMCPs) {
                                    let [name, _] = tool_name.split(" > ");
                                    set.add(name);
                                  }

                                  let load = clientsRef.current.filter(
                                    (v) => v.status == "connected",
                                  ).length;
                                  let all = clientsRef.current.length;
                                  let curr = clientsRef.current.filter((v) => {
                                    return set.has(v.name);
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
                            <>💻 {t`LLM not support`}</>
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
                            📦
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
                            📜
                            {promptsRef.current.length}
                          </span>
                        </Dropdown>
                      </Tooltip>
                    </span>
                    <Divider type="vertical" />
                    <Tooltip title={t`Select LLM`}>
                      <span className="inline-block">
                        🧠
                        <Select
                          size="small"
                          placeholder={
                            GPT_MODELS.get().data.length > 0
                              ? GPT_MODELS.get().data[0].name
                              : "Please add a LLM model"
                          }
                          className="w-60"
                          allowClear
                          value={currentChat.current.modelKey}
                          onChange={(value) => {
                            currentChat.current.modelKey = value;
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
                      className="cursor-pointer hover:text-cyan-400"
                      onClick={() => {
                        setIsOpenMoreSetting(true);
                        formMoreSetting.resetFields();
                        console.log(currentChat.current);
                        formMoreSetting.setFieldsValue(currentChat.current);
                      }}
                    />
                  </div>
                  <div>
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
                              label: x.name,
                              value: x.key,
                              key: x.key,
                            };
                          }),
                        onClick: (e) => {

                          DATA.current.diffs.push({ modelKey: e.key, messages: currentChat.current.messages });
                          refresh();
                        },
                      }}
                    >
                      <Button size="small">
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

                          setValue((value) => {
                            return `${value.slice(0, position - 1)}${itemVal} ${value.slice(position)}`;
                          });
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
                            openaiClient.current.cancel();
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
              let p = getPrompts(currentChat.current.allowMCPs);
              promptsRef.current = p;
              let r = getResourses(currentChat.current.allowMCPs);
              resourcesRef.current = r;
              refresh();
            }}
            checkedKeys={currentChat.current.allowMCPs}
            treeData={clientsRef.current.map((x) => {
              return {
                title: (
                  <span>
                    {x.name}
                    {x.status == "connected" ? null : x.status ==
                      "connecting" ? (
                      <SyncOutlined spin className="m-1 text-blue-400" />
                    ) : (
                      <Button
                        className="m-1"
                        size="small"
                        onClick={async () => {
                          x.status = "connecting";
                          refresh();
                          await call("openMcpClient", [x.name]);
                          clientsRef.current = await getClients();
                          refresh();
                        }}
                      >{t`Reload`}</Button>
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

          {/* <Table
            size="small"
            rowKey={(record) => record.name}
            pagination={false}
            dataSource={clientsRef.current}
            rowHoverable={false}
            bordered
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: clientsRef.current
                .filter((record) =>
                  currentChat.current.allowMCPs.includes(record.name),
                )
                .map((v) => v.name),
              onChange: async (selectedRowKeys, selectedRows) => {
                currentChatReset({
                  ...currentChat.current,
                  allowMCPs: selectedRowKeys as string[],
                });
              },
            }}
            footer={
              missMCP.length > 0
                ? () => {
                    if (missMCP.length > 0) {
                      return (
                        <div>
                          <span className="text-red-500">
                            {t`Unloaded MCP`}:{" "}
                          </span>
                          {missMCP.join(" , ")}
                        </div>
                      );
                    } else {
                      return false;
                    }
                  }
                : undefined
            }
            columns={[
              {
                title: "server",
                dataIndex: "name",
                key: "name",
              },
              {
                title: "tools",
                dataIndex: "tools",
                key: "tools",
                render: (text, record) => {
                  return (
                    <div>
                      {record.tools.length > 0 ? (
                        <div className="modal-tools flex flex-wrap gap-0.5">
                          {record.tools.map((x) => {
                            return (
                              <Tooltip
                                key={x.origin_name || x.function.name}
                                title={x.function.description}
                              >
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setCurrTool(x);
                                    setCurrToolResult({
                                      data: null,
                                      error: null,
                                    });
                                    callToolForm.resetFields();
                                    setCallToolOpen(true);
                                  }}
                                >
                                  {x.origin_name ||
                                    x.function.name.replace(x.key + "--", "")}
                                </Button>
                              </Tooltip>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-red-500">{t`disconnected`}</span>
                      )}
                    </div>
                  );
                },
              },
            ].filter((c) => !mobile.current.is || c.key != "tools")}
          ></Table> */}
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


                refresh();
                setIsOpenMoreSetting(false);
              }}
            >
              {dom}
            </Form>
          )}
        >
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
            <NumberStep defaultValue={20} max={40} />
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
                      Update
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={async () => {
                        AppSetting.get().quicks.splice(index, 1);
                        AppSetting.save();
                        refresh();
                      }}
                    >
                      Delete
                    </Button>
                  </Space.Compact>

                  <Input.TextArea
                    size="small"
                    value={phrase.value}
                    onChange={async (e) => {
                      AppSetting.get().quicks[index].value = e.target.value;
                      refresh();
                    }}
                    placeholder="Value"
                  />
                </li>
              ))}
            </ul>
            <h3 className="mb-2 font-bold">Add Words</h3>
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
                  value: newValue,
                });
                await AppSetting.save();
                refresh();
                setNewLabel("");
                setNewValue("");
              }}
            >
              Add Words
            </button>
          </div>
        </Modal>
        {contextHolder}
      </div>
    </div>
  );
};

const calcAttachDialogue = (
  messages,
  attachedDialogueCount,
  overwrite = true,
) => {
  if (attachedDialogueCount == null) {
    attachedDialogueCount = 20;
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
