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
  Button,
  Card,
  Checkbox,
  Divider,
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
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
const antdMessage = message;
import React, { useCallback, useEffect, useRef, useState } from "react";
import OpenAI from "openai";
import { v4 } from "uuid";

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
} from "@ant-design/icons";
import type { ConfigProviderProps, GetProp } from "antd";
import { MyMessage, OpenAiChannel } from "../../common/openai";
import { ChatHistory, GPT_MODELS, GPTS } from "../../common/data";

import { PromptsModal } from "./promptsModal";
import {
  getClients,
  getPrompts,
  getResourses,
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

// let openaiClient: OpenAiChannel;
export const Chat = ({ onTitleChange = undefined }) => {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };

  // const [clients, setClients] = React.useState<InitedClient[]>([]);
  // const [prompts, setPrompts] = React.useState<InitedClient["prompts"]>([]);
  // const [resources, setResources] = React.useState<InitedClient["resources"]>(
  //   [],
  // );
  const openaiClient = useRef<OpenAiChannel>();

  const clientsRef = useRef<InitedClient[]>([]);
  const promptsRef = useRef<InitedClient["prompts"]>([]);
  const resourcesRef = useRef<InitedClient["resources"]>([]);

  let init = useCallback(() => {
    console.log("init");
    ChatHistory.init().then(() => {
      setHistoryFilterSign(1);
    });

    GPTS.init().then(() => {
      refresh();
    });
    GPT_MODELS.init().then(() => {
      refresh();
    });
    (async () => {
      currentChatReset({}, "", true);
    })();
  }, []);
  useEffect(() => {
    init();
    EVENT.on("refresh", init);
    return () => {
      EVENT.off("refresh", init);
    };
  }, []);

  const [isOpenPromptsModal, setIsOpenPromptsModal] = useState(false);
  const [promptsModalValue, setPromptsModalValue] = useState({} as any);
  const [mode, setMode] = React.useState<"edit" | undefined>(undefined);

  const [value, setValue] = React.useState("");
  const [direction, setDirection] =
    React.useState<GetProp<ConfigProviderProps, "direction">>("ltr");

  const currentChat = React.useRef<ChatHistoryItem>({
    label: "",
    key: "",
    messages: [],
    modelKey: undefined,
    gptsKey: undefined,
    sended: false,
    requestType: "stream",
    icon: undefined,
    allowMCPs: [],
    attachedDialogueCount: undefined,
    dateTime: Date.now(),
  });
  const currentChatReset = async (
    newConfig: Partial<ChatHistoryItem>,
    prompt = "",
    allMCPs = false,
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
      label: "",
      key: "",
      messages: [],
      modelKey: undefined,
      gptsKey: undefined,
      sended: false,
      requestType: "stream",
      icon: undefined,
      allowMCPs: [],
      attachedDialogueCount: undefined,
      dateTime: Date.now(),
      ...newConfig,
    };

    setResourceResList([]);
    setPromptResList([]);
    let clients = await getClients().catch(() => []);
    clientsRef.current = clients;
    if (allMCPs) {
      currentChat.current.allowMCPs = clients.map((v) => v.name);
    }

    clientsRef.current;
    let p = getPrompts((x) => currentChat.current.allowMCPs.includes(x.name));
    promptsRef.current = p;
    let r = getResourses((x) => currentChat.current.allowMCPs.includes(x.name));
    resourcesRef.current = r;

    refresh();
  };
  const selectGptsKey = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (currentChat.current.gptsKey == null) {
      onTitleChange && onTitleChange();
    } else {
      let find = GPTS.get().data.find(
        (x) => x.key == currentChat.current.gptsKey,
      );
      onTitleChange && onTitleChange(find.label);
    }
  }, [currentChat.current.gptsKey]);

  function format(x: MyMessage, i, arr): any {
    let common = {
      className: {
        "no-attached": !(
          x.content_attached == null || x.content_attached == true
        ),
      },
      role: x.role,
    };

    if (x.content_from) {
      return {
        ...common,
        key: i.toString(),
        placement: x.role == "user" || x.role == "system" ? "end" : "start",
        avatar: {
          icon: x.role == "system" ? "⚙️" : <UserOutlined />,
          style: {
            color: "#f56a00",
            backgroundColor: "#fde3cf",
          },
        },
        content: (
          <div
            className="cursor-pointer"
            onClick={() => {
              Modal.info({
                width: "80%",
                title: "Tip",
                maskClosable: true,
                content: <div>{x.content as string}</div>,
              });
            }}
          >
            <Attachments.FileCard
              item={{
                name: x.content_from as string,
                uid: x.content_from as string,
                size: x.content.length,
              }}
            ></Attachments.FileCard>
          </div>
        ),
      };
    }
    if (x.role == "user" || x.role == "system") {
      if (x.content_context == null) {
        x.content_context = {};
      }
      return {
        ...common,
        key: i.toString(),
        placement: "end",
        avatar: {
          icon: x.role == "system" ? "⚙️" : <UserOutlined />,
          style: {
            color: "#f56a00",
            backgroundColor: "#fde3cf",
          },
        },
        footer: (
          <Space>
            <CopyOutlined
              className="hover:text-cyan-400"
              key="copy"
              onClick={() => {
                call("setClipboardText", [
                  Array.isArray(x.content)
                    ? (x.content[0] as any).text
                    : x.content.toString(),
                ]);
                message.success(t`Copied to clipboard`);
              }}
            />

            <EditOutlined
              className="hover:text-cyan-400"
              onClick={() => {
                x.content_context.edit = !x.content_context.edit;
                refresh();
              }}
            />

            {x.role == "user" && (
              <SyncOutlined
                className="hover:text-cyan-400"
                key="sync"
                onClick={() => {
                  openaiClient.current.messages.splice(i);
                  currentChat.current.messages = openaiClient.current.messages;
                  refresh();
                  onRequest(x.content as any);
                }}
              />
            )}
            {x.role == "user" && x.content_attached == false && (
              <Tooltip title="Cleared">
                <MinusCircleOutlined className="cursor-not-allowed" />
              </Tooltip>
            )}
          </Space>
        ),
        content: (
          <UserContent
            x={x}
            submit={(content) => {
              if (x.role == "system") {
                openaiClient.current.messages.find(
                  (x) => x.role == "system",
                ).content = content;

                currentChat.current.messages = openaiClient.current.messages;

                let userIndex = openaiClient.current.messages.findLastIndex(
                  (x) => x.role == "user",
                );
                if (userIndex > -1) {
                  let content =
                    openaiClient.current.messages[userIndex].content;
                  openaiClient.current.messages.splice(userIndex);
                  refresh();
                  onRequest(content as any);
                }
              } else {
                openaiClient.current.messages.splice(i);
                currentChat.current.messages = openaiClient.current.messages;
                refresh();
                onRequest(content);
              }
            }}
          />
        ),
      };
    } else if (x.role == "tool") {
      return {
        ...common,
        placement: "start",
        avatar: {
          icon: "🔧",
          style: {
            color: "#fff",
            backgroundColor: "#87d068",
          },
        },
        key: i.toString(),
        content: (
          <Tooltip
            title={
              <div className="max-h-40 overflow-auto text-ellipsis">
                {x.content as string}
              </div>
            }
          >
            <span
              className="cursor-pointer"
              onClick={() => {
                Modal.info({
                  width: "80%",
                  title: "Tool Call Result",
                  maskClosable: true,
                  content: (
                    <div>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {x.content as string}
                      </pre>
                    </div>
                  ),
                });
              }}
            >
              {x.content_status == "loading" ? (
                <SyncOutlined spin />
              ) : x.content_status == "error" ? (
                "❌Error"
              ) : (
                "✅Completed"
              )}
              <div className="line-clamp-1">{x.content as string}</div>
            </span>
            {x.content_attachment &&
              x.content_attachment.length > 0 &&
              x.content_attachment.map((x, i) => {
                if (x.type == "image") {
                  return (
                    <DownImage
                      key={i}
                      src={`data:${x.mimeType};base64,${x.data}`}
                    />
                  );
                }
              })}
          </Tooltip>
        ),
      };
    } else if (x.role == "assistant") {
      return {
        ...common,
        placement: "start",
        avatar: {
          icon: "🤖",
          style: {
            color: "#fff",
            backgroundColor: "#87d068",
          },
        },
        key: i.toString(),
        // typing: x.content_status == "dataLoading",
        footer: x.content_status != "error" && (
          <div className="flex justify-between">
            <Space>
              <CopyOutlined
                className="hover:text-cyan-400"
                key="copy"
                onClick={() => {
                  call("setClipboardText", [x.content.toString()]);
                  message.success("Copied to clipboard");
                }}
              />
              <SyncOutlined
                key="sync"
                className="hover:text-cyan-400"
                onClick={() => {
                  // onRequest(x.content as any);
                  let content = openaiClient.current.messages[i].content;
                  openaiClient.current.messages.splice(i);
                  currentChat.current.messages = openaiClient.current.messages;
                  refresh();
                  onRequest();
                  // while (i--) {
                  //   if (openaiClient.current.messages[i].role === "user") {
                  //     let content = openaiClient.current.messages[i].content;
                  //     openaiClient.current.messages.splice(i);
                  //     currentChat.current.messages =
                  //       openaiClient.current.messages;
                  //     refresh();
                  //     onRequest(content as any);
                  //     break;
                  //   }
                  // }
                }}
              />
            </Space>
            <Space>
              {x.content_attached == false && (
                <Tooltip title="Cleared">
                  <MinusCircleOutlined className="cursor-not-allowed bg-red-200" />
                </Tooltip>
              )}
              {x.content_usage && (
                <>
                  {x?.content_usage?.prompt_tokens ? (
                    <Tooltip title="prompt_tokens">
                      <UploadOutlined />
                      {x?.content_usage?.prompt_tokens}
                    </Tooltip>
                  ) : null}
                  {x?.content_usage?.completion_tokens ? (
                    <Tooltip title="completion_tokens">
                      <DownloadOutlined />
                      {x?.content_usage?.completion_tokens}
                    </Tooltip>
                  ) : null}
                  {x?.content_usage?.total_tokens ? (
                    <Tooltip title="total_tokens">
                      <StockOutlined />
                      {x?.content_usage?.total_tokens}
                    </Tooltip>
                  ) : null}
                </>
              )}
            </Space>
          </div>
        ),
        // loading:
        //   x.content_status == "loading" || x.content_status == "dataLoading",
        content:
          x.content_status == "loading" ? (
            <SyncOutlined spin />
          ) : x.content_status == "error" ? (
            <span className="text-red-400">
              Please check if the network is connected or LLM not support or
              Invalid Input Content.
            </span>
          ) : (
            <div>
              {x.tool_calls &&
                x.tool_calls.map((tool: any, index) => {
                  return (
                    <Tooltip
                      key={index}
                      title={
                        <div className="max-h-40 overflow-auto text-ellipsis">
                          {tool.function.arguments}
                        </div>
                      }
                    >
                      <Spin spinning={x.content_status == "loading"}>
                        <a
                          className="cursor-pointer"
                          onClick={() => {
                            Modal.info({
                              width: "80%",
                              title: "Tool Call",
                              maskClosable: true,
                              content: (
                                <div>
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    <span>Tool Name: </span>
                                    {tool.restore_name || tool.function.name}
                                  </pre>
                                  <pre
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    <span>Tool Arguments: </span>{" "}
                                    {tool.function.arguments}
                                  </pre>
                                </div>
                              ),
                            });
                          }}
                        >
                          <div className="line-clamp-1">
                            {tool.restore_name || tool.function.name} :{" "}
                            {tool.function.arguments}
                          </div>
                        </a>
                      </Spin>
                    </Tooltip>
                  );
                })}
              {x.content && (
                <MarkDown
                  markdown={x.content}
                  onCallback={(e) => {
                    setValue(e);
                  }}
                ></MarkDown>
              )}
              {x.content_status == "dataLoading" && <LoadingOutlined />}
            </div>
          ),
      };
    } else {
      antdMessage.error("Unknown role");
    }
  }

  const createChat = () => {
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
    currentChat.current.modelKey = config.key;
    openaiClient.current = new OpenAiChannel(
      { ...config, allowMCPs: currentChat.current.allowMCPs },
      currentChat.current.messages,
      currentChat.current.requestType == "stream",
    );
    currentChat.current.messages = openaiClient.current.messages;
    refresh();
  };
  const [loading, setLoading] = useState(false);

  const onRequest = async (message?: string) => {
    Clarity.event(`sender-${process.env.NODE_ENV}`);
    console.log("onRequest", message);
    try {
      setLoading(true);
      if (currentChat.current.sended == false) {
        createChat();

        currentChatReset({
          ...currentChat.current,
          key: v4(),
          label: message,
          messages: openaiClient.current.messages,
          modelKey: currentChat.current.modelKey,
          sended: true,
          gptsKey: currentChat.current.gptsKey,
          allowMCPs: currentChat.current.allowMCPs,
          dateTime: Date.now(),
        });
        setData([currentChat.current, ...data]);
        ChatHistory.get().data.unshift(currentChat.current);
      } else {
        let findIndex = ChatHistory.get().data.findIndex(
          (x) => x.key == currentChat.current.key,
        );

        if (findIndex > -1) {
          let find = ChatHistory.get().data.splice(findIndex, 1)[0];

          currentChat.current.dateTime = Date.now();
          find.dateTime = currentChat.current.dateTime;

          ChatHistory.get().data.unshift(find);

          loadMoreData(false);
        }
      }
      openaiClient.current.options.allowMCPs = currentChat.current.allowMCPs;
      if (message) {
        openaiClient.current.addMessage(
          { role: "user", content: message },
          resourceResList,
          promptResList,
        );
      }

      refresh();

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

      await ChatHistory.save();
    } catch (e) {
      antdMessage.error(
        e.message || "An error occurred, please try again later",
      );
    } finally {
      setLoading(false);
    }
  };
  // const [chatHistorys, setChatHistorys] = useState([]);

  const [isToolsShow, setIsToolsShow] = useState(false);

  const [loadMoreing, setLoadMoreing] = useState(false);
  const [data, setData] = useState<GetProp<ConversationsProps, "items">>([]);

  let loadIndex = useRef(0);

  const loadDataTatal = useRef(0);

  const loadMoreData = (loadMore = true) => {
    // console.log(historyFilterType, historyFilterSearchValue, loadIndex.current);
    // console.log("loadMoreData: ", ChatHistory.get().data);
    if (loadMore) {
      loadIndex.current += 25;
    } else {
      loadIndex.current = 25;
    }

    if (loadMoreing) {
      return;
    }
    setLoadMoreing(true);

    let formmatedData = ChatHistory.get()
      .data.filter(
        (x) =>
          selectGptsKey.current == null || x.gptsKey == selectGptsKey.current,
      )
      .filter((x) => {
        if (historyFilterType.current == "all") {
          return true;
        } else if (historyFilterType.current == "star") {
          return x.icon == "⭐";
        } else {
          return (
            historyFilterSearchValue == "" ||
            x.label.toLowerCase().includes(historyFilterSearchValue)
          );
        }
      });
    loadDataTatal.current = formmatedData.length;
    formmatedData = formmatedData.slice(0, loadIndex.current);
    setData(formmatedData);
    console.log("loadMoreData", loadIndex.current, loadDataTatal.current);
    setLoadMoreing(false);
  };

  const [resourceResList, setResourceResList] = React.useState<
    Array<{
      call_name: string;
      uid: string;
      contents: any[];
    }>
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

  const [historyFilterSign, setHistoryFilterSign] = useState<0 | 1>(0);
  // const [historyFilterType, setHistoryFilterType] = useState<
  //   "all" | "star" | "search"
  // >("all");
  const historyFilterType = useRef<"all" | "star" | "search">("all");

  const [historyFilterSearchValue, setHistoryFilterSearchValue] = useState("");
  useEffect(() => {
    loadMoreData(historyFilterSign == 0);
  }, [historyFilterType.current, historyFilterSearchValue, historyFilterSign]);

  let supportImage = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    GPT_MODELS.get().data[0]
  )?.supportImage;

  let supportTool = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    GPT_MODELS.get().data[0]
  )?.supportTool;

  const scrollableDivID = "scrollableDiv" + v4();

  return (
    <div className="chat h-full">
      <div className="h-full rounded-lg bg-white p-4">
        <XProvider direction={direction}>
          <Flex style={{ height: "100%" }} gap={12}>
            <div
              className="h-full flex-none overflow-hidden pr-2"
              style={{ width: "240px" }}
            >
              {selectGptsKey.current ? (
                <div className="flex">
                  <Button
                    onClick={() => {
                      currentChatReset({
                        messages: [],
                        allowMCPs: clientsRef.current.map((v) => v.name),
                        sended: false,
                        gptsKey: undefined,
                      });
                      selectGptsKey.current = undefined;
                      loadMoreData(false);
                    }}
                  >
                    <LeftOutlined />
                  </Button>
                  <Button
                    type="primary"
                    className="ml-1 w-full"
                    onClick={() => {
                      if (openaiClient.current) {
                        let find = GPTS.get().data.find(
                          (y) => y.key === currentChat.current.gptsKey,
                        );
                        currentChatReset(
                          {
                            allowMCPs: find.allowMCPs,
                            gptsKey: find.key,
                            modelKey: find.modelKey,
                            attachedDialogueCount: find.attachedDialogueCount,
                          },
                          find.prompt,
                        );
                      }
                    }}
                  >
                    New Chat
                  </Button>
                </div>
              ) : (
                <Button
                  type="primary"
                  className="ml-1 w-full"
                  onClick={() => {
                    currentChatReset({
                      messages: [],
                      allowMCPs: clientsRef.current.map((v) => v.name),
                      sended: false,
                      gptsKey: undefined,
                    });
                    selectGptsKey.current = undefined;
                    loadMoreData(false);
                  }}
                >
                  New Chat
                </Button>
              )}
              <div className="mt-2 flex items-center justify-between">
                <Space>
                  <span>Dialogue Records</span>
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
                      value: "all",
                      icon: <CommentOutlined />,
                    },
                    {
                      value: "star",
                      icon: <StarOutlined />,
                    },
                    {
                      value: "search",
                      icon: <SearchOutlined />,
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
                id={scrollableDivID}
                className="overflow-y-auto overflow-x-hidden"
                style={{
                  width: 240,
                  height: "calc(100% - 70px)",
                }}
              >
                <InfiniteScroll
                  dataLength={data.length}
                  next={loadMoreData}
                  hasMore={data.length < loadDataTatal.current}
                  loader={
                    <div style={{ textAlign: "center" }}>
                      <Spin indicator={<RedoOutlined spin />} size="small" />
                    </div>
                  }
                  endMessage={<Divider plain>Nothing 🤐</Divider>}
                  scrollableTarget={scrollableDivID}
                >
                  <Conversations
                    items={data.map((x) => {
                      return {
                        ...x,
                        icon: x.icon == "⭐" ? <StarOutlined /> : undefined,
                      };
                    })}
                    activeKey={currentChat.current.key}
                    onActiveChange={(key) => {
                      if (currentChat.current.key == key) {
                        return;
                      }
                      let item = ChatHistory.get().data.find(
                        (x) => x.key == key,
                      );
                      if (item) {
                        // console.log("onActiveChange", item);

                        currentChatReset({
                          ...item,
                          messages: [],
                        });

                        setTimeout(() => {
                          currentChatReset(item);
                          createChat();
                        });
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
                          label: "Star",
                          key: "star",
                          icon: <StarOutlined />,
                        },
                        {
                          label: "Remove",
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
                          setData(
                            data.filter((x) => x.key !== conversation.key),
                          );
                          refresh();
                          message.success("Delete Success");
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
                      },
                    })}
                  />
                </InfiniteScroll>
              </div>
            </div>

            <Divider type="vertical" style={{ height: "100%" }} />
            <Flex
              className="flex-grow overflow-x-auto"
              vertical
              style={{ flex: 1 }}
              gap={8}
            >
              {(currentChat.current.messages == null ||
                currentChat.current.messages?.length == 0) && (
                <div>
                  <Welcome
                    icon="👋"
                    title="Welcome"
                    className="mb-4"
                    description={
                      GPTS.get().data.length > 0
                        ? "Choose a prompt from below, and let's start chatting"
                        : "Start chatting"
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
                        setPromptsModalValue({} as any);
                        setIsOpenPromptsModal(true);
                      }}
                    >
                      Add Agent
                    </Button>
                  </Space>

                  <div className="flex items-center">
                    <div className="flex flex-wrap">
                      <DndContext
                        sensors={botSearchValue != "" ? [] : [sensors]}
                        onDragEnd={(e) => {
                          try {
                            let data = GPTS.get().data;
                            let oldIndex = data.findIndex(
                              (x) => x.key == e.active.id,
                            );

                            let newIndex = data.findIndex(
                              (x) => x.key == e.over.id,
                            );

                            let item = data[oldIndex];

                            data.splice(oldIndex, 1);

                            data.splice(newIndex, 0, item);

                            GPTS.save();
                            refresh();
                          } catch {}
                        }}
                      >
                        <SortableContext
                          items={GPTS.get()
                            .data.filter(
                              (x) =>
                                botSearchValue == "" ||
                                x.label.toLowerCase().includes(botSearchValue),
                            )
                            .map((x) => x.key)}
                        >
                          {GPTS.get()
                            .data.filter(
                              (x) =>
                                botSearchValue == "" ||
                                x.label.toLowerCase().includes(botSearchValue),
                            )
                            .map((item) => (
                              <SortableItem
                                key={item.key}
                                id={item.key}
                                item={item}
                                onClick={(item) => {
                                  // console.log("onGPTSClick", item);
                                  if (mode == "edit") {
                                    return;
                                  }
                                  let find = GPTS.get().data.find(
                                    (y) => y.key === item.key,
                                  );
                                  currentChatReset(
                                    {
                                      allowMCPs: find.allowMCPs,
                                      gptsKey: find.key,
                                      modelKey: find.modelKey,
                                      attachedDialogueCount:
                                        find.attachedDialogueCount,
                                    },
                                    find.prompt,
                                  );
                                  selectGptsKey.current = find.key;
                                  historyFilterType.current = "all";
                                  loadMoreData(false);
                                }}
                                onEdit={() => {
                                  let value = GPTS.get().data.find(
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
                                      let index = GPTS.get().data.findIndex(
                                        (y) => y.key === item.key,
                                      );
                                      GPTS.get().data.splice(index, 1);
                                      await GPTS.save();
                                      call("openMcpClient", ["hyper_task"]);
                                      refresh();
                                    },
                                    onCancel(...args) {},
                                  });
                                }}
                              />
                            ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                </div>
              )}

              <Bubble.List
                style={{ flex: 1, paddingRight: 4 }}
                items={currentChat.current.messages?.map(format)}
              />
              <div className="">
                {/* <Tooltip title="Cancel">
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      if (client) {
                        setLoading(false);
                        client.cancel();
                        message.success("Cancel sending!");
                      }
                    }}
                  >
                    🚫
                  </span>
                </Tooltip>
                <Divider type="vertical" /> */}

                {/* <Tooltip title="Reset">
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      if (openaiClient.current) {
                        let p = currentChat.current.messages.find(
                          (x) => x.role == "system",
                        )?.content;

                        currentChatReset(
                          {
                            gptsKey: currentChat.current.gptsKey,
                          },
                          p,
                        );
                      }
                    }}
                  >
                    🔄
                  </span>
                </Tooltip> */}
                <Tooltip title="Clear Context">
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      if (openaiClient.current) {
                        calcAttachDialogue(
                          currentChat.current.messages,
                          0,
                          true,
                        );
                        refresh();
                      }
                    }}
                  >
                    🗑️
                  </span>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Clients and Tools">
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      setIsToolsShow(true);
                    }}
                  >
                    {supportTool == null || supportTool == true ? (
                      <>
                        💻
                        {
                          clientsRef.current.filter((v) =>
                            currentChat.current.allowMCPs.includes(v.name),
                          ).length
                        }
                      </>
                    ) : (
                      <>💻 LLM not support</>
                    )}
                  </span>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Resources" placement="bottom">
                  <Dropdown
                    placement="topRight"
                    menu={{
                      items: resourcesRef.current.map((x, i) => {
                        return {
                          key: x.key,
                          label: `${x.key}--${x.description}`,
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
                          console.log("mcpCallResource", res);
                          res.call_name = resource.key + "--" + resource.uri;
                          res.uid = v4();
                          setResourceResList([...resourceResList, res]);
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
                <Tooltip title="Prompts" placement="bottom">
                  <Dropdown
                    placement="topRight"
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
                          if (prompt.arguments && prompt.arguments.length > 0) {
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
                <Divider type="vertical" />
                <Tooltip title="Select LLM">
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
                      createChat();
                    }}
                    options={GPT_MODELS.get().data.map((x) => {
                      return {
                        label: x.name,
                        value: x.key,
                      };
                    })}
                  ></Select>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Select Request Type">
                  <span>type:</span>
                  <Dropdown
                    arrow
                    menu={{
                      selectable: true,
                      defaultSelectedKeys: [currentChat.current.requestType],
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
                        currentChat.current.requestType = e.key;
                        createChat();
                      },
                    }}
                  >
                    <Button size="small" type="link">
                      {currentChat.current.requestType}
                      <DownOutlined />
                    </Button>
                  </Dropdown>
                </Tooltip>
                <Divider type="vertical" />

                <Tooltip title="Token Usage">
                  <span className="cursor-pointer">
                    token:{" "}
                    {openaiClient.current == null ? (
                      0
                    ) : typeof openaiClient.current.totalTokens == "number" &&
                      !Number.isNaN(openaiClient.current.totalTokens) ? (
                      openaiClient.current.totalTokens
                    ) : (
                      <span>
                        {"estimate " + openaiClient.current.estimateTotalTokens}
                      </span>
                    )}
                  </span>
                </Tooltip>
                <Divider type="vertical" />
                <SettingOutlined
                  className="cursor-pointer hover:text-cyan-400"
                  onClick={() => {
                    setIsOpenMoreSetting(true);
                    formMoreSetting.resetFields();
                    formMoreSetting.setFieldsValue(currentChat.current);
                  }}
                />
              </div>
              <MyAttachR
                resourceResList={resourceResList}
                resourceResListRemove={(x) => {
                  setResourceResList(
                    resourceResList.filter((v) => v.uid != x.uid),
                  );
                  message.success("Delete Success");
                }}
                promptResList={promptResList}
                promptResListRemove={(x) => {
                  setPromptResList(promptResList.filter((v) => v.uid != x.uid));
                  message.success("Delete Success");
                }}
              ></MyAttachR>

              <QuickPath
                onChange={(path) => {
                  setValue((value) => {
                    return value + " " + path;
                  });
                }}
              >
                <Sender
                  prefix={
                    supportImage && (
                      <SelectFile
                        uploadType="image"
                        onChange={async (path) => {
                          // console.log(path);
                          if (path == "") return;
                          path = "file://" + path;
                          resourceResList.push({
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
                          setResourceResList(resourceResList.slice());
                        }}
                      >
                        <Button
                          type="text"
                          icon={<LinkOutlined />}
                          onClick={() => {}}
                        />
                      </SelectFile>
                    )
                  }
                  onPasteFile={async (file) => {
                    // console.log("onPasteFile", file);

                    let path = "file://" + file.path;
                    resourceResList.push({
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
                    setResourceResList(resourceResList.slice());
                  }}
                  loading={loading}
                  value={value}
                  onChange={(nextVal) => {
                    setValue(nextVal);
                  }}
                  onCancel={() => {
                    setLoading(false);
                    openaiClient.current.cancel();
                    // message.success("Cancel sending!");
                  }}
                  onSubmit={(s) => {
                    setValue("");
                    onRequest(s);
                  }}
                  placeholder="Start inputting"
                />
              </QuickPath>
            </Flex>
          </Flex>
        </XProvider>
        <PromptsModal
          open={isOpenPromptsModal}
          onCreate={async (value) => {
            if (value.key) {
              const index = GPTS.get().data.findIndex(
                (y) => y.key == value.key,
              );
              if (index !== -1) {
                GPTS.get().data[index] = value as any;
              }
            } else {
              GPTS.get().data.push({
                ...value,
                key: v4(),
                allowMCPs: value.allowMCPs || [],
              });
            }
            await GPTS.save();
            call("openMcpClient", ["hyper_task"]);
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
          title="Tool"
          onOk={() => setIsToolsShow(false)}
          cancelButtonProps={{ style: { display: "none" } }}
        >
          <Table
            size="small"
            rowKey={(record) => record.name}
            pagination={false}
            dataSource={clientsRef.current}
            rowHoverable={false}
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: clientsRef.current
                .filter((record) =>
                  currentChat.current.allowMCPs.includes(record.name),
                )
                .map((v) => v.name),
              onChange: async (selectedRowKeys, selectedRows) => {
                // for (let c of clientsRef.current) {
                //   c.enable = false;
                // }
                // for (let row of selectedRowKeys) {
                //   let client = clientsRef.current.find((v) => v.name == row);
                //   client.enable = true;
                // }

                // let p = getPrompts();
                // promptsRef.current = p;
                // let r = getResourses();
                // resourcesRef.current = r;
                // refresh();
                currentChatReset({
                  ...currentChat.current,
                  allowMCPs: selectedRowKeys as string[],
                });
              },
            }}
            columns={[
              {
                title: "client",
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
                      {record.tools.map((x) => {
                        return (
                          <Tooltip
                            key={x.origin_name || x.function.name}
                            title={x.function.description}
                          >
                            <Tag className="cursor-pointer">
                              {x.origin_name ||
                                x.function.name.replace(x.key + "--", "")}
                            </Tag>
                          </Tooltip>
                        );
                      })}
                    </div>
                  );
                },
              },
            ]}
          ></Table>
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
          title="More  Setting"
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

                calcAttachDialogue(
                  openaiClient.current.messages,
                  currentChat.current.attachedDialogueCount,
                );

                refresh();
                setIsOpenMoreSetting(false);
              }}
            >
              {dom}
            </Form>
          )}
        >
          <Form.Item
            name="attachedDialogueCount"
            label="attachedDialogueCount"
            tooltip="Number of sent Dialogue Message attached per request"
          >
            {/* <InputNumber
              placeholder="blank means is all."
              min={0}
              style={{ width: "100%" }}
            /> */}
            <Slider defaultValue={20} max={40} />
          </Form.Item>
        </Modal>
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
