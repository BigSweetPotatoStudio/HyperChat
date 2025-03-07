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
  Collapse,
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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result); // reader.result 包含 Base64 字符串
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
} from "@ant-design/icons";
import type { ConfigProviderProps, GetProp } from "antd";
import { MyMessage, OpenAiChannel } from "../../common/openai";
import { ChatHistory, GPT_MODELS, Agents } from "../../../../common/data";

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
import { NumberStep } from "../../common/numberStep";

export const Chat = ({
  onTitleChange = undefined,
  data = {
    agentKey: "",
    message: "",
    onComplete: (text) => {},
    onError: (e) => {},
  },
  onlyView = {
    histroyKey: "",
  },
}) => {
  let init = useCallback(() => {
    console.log("init");

    (async () => {
      await ChatHistory.init();
      await Agents.init();
      await GPT_MODELS.init();
      refresh();
      setHistoryFilterSign((e) => e + 1);
    })();
  }, []);
  useEffect(() => {
    (async () => {
      if (data.agentKey) {
        try {
          // let agents = await GPTS.init();
          // let agent = agents.data.find((x) => x.label == data.agentKey);
          await onGPTSClick(data.agentKey);

          if (data.message) {
            await onRequest(data.message);
            data.onComplete(openaiClient.current.lastMessage.content);
          }
        } catch (e) {
          console.error(" hyper_call_agent error: ", e);
          data.onError(e);
        }
      } else if (onlyView.histroyKey) {
        if (onlyView.histroyKey) {
          let item = ChatHistory.get().data.find(
            (x) => x.key === onlyView.histroyKey,
          );
          if (item) {
            currentChatReset({
              ...item,
              messages: [],
            });

            setTimeout(() => {
              currentChatReset(item);
              createChat();
            });
          }
        }
      } else {
        currentChatReset({}, "", true);
      }
    })();

    init();
    EVENT.on("refresh", init);
    return () => {
      EVENT.off("refresh", init);
    };
  }, []);
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };

  const onGPTSClick = async (key: string) => {
    let find = Agents.get().data.find((y) => y.key === key);
    await currentChatReset(
      {
        allowMCPs: find.allowMCPs,
        agentKey: find.key,
        modelKey: find.modelKey,
        attachedDialogueCount: find.attachedDialogueCount,
        temperature: find.temperature,
      },
      find.prompt,
    );
    selectGptsKey.current = find.key;
    historyFilterType.current = "all";
    loadMoreData(false);
  };

  const openaiClient = useRef<OpenAiChannel>();

  const clientsRef = useRef<InitedClient[]>([]);

  const promptsRef = useRef<InitedClient["prompts"]>([]);
  const resourcesRef = useRef<InitedClient["resources"]>([]);

  const [isOpenPromptsModal, setIsOpenPromptsModal] = useState(false);
  const [promptsModalValue, setPromptsModalValue] = useState({} as any);

  const [value, setValue] = React.useState("");
  const [direction, setDirection] =
    React.useState<GetProp<ConfigProviderProps, "direction">>("ltr");

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
    isCalled: data.agentKey ? true : false,
    isTask: false,
  };

  const currentChat = React.useRef<ChatHistoryItem>(defaultChatValue);
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
      ...defaultChatValue,
      ...newConfig,
    };

    setResourceResList([]);
    setPromptResList([]);
    let clients = await getClients().catch(() => []);
    clientsRef.current = clients;
    if (currentChat.current.agentKey == undefined && allMCPs) {
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
    if (currentChat.current.agentKey == null) {
      onTitleChange && onTitleChange();
    } else {
      let find = Agents.get().data.find(
        (x) => x.key == currentChat.current.agentKey,
      );
      onTitleChange && onTitleChange(find.label);
    }
  }, [currentChat.current.agentKey]);

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
                  title: t`Tool Call Result`,
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
                } else if (x.type == "text") {
                  return <pre>{x.text}</pre>;
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
        footer: (
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
                  openaiClient.current.messages.splice(i);
                  currentChat.current.messages = openaiClient.current.messages;
                  refresh();
                  onRequest();
                }}
              />
            </Space>
            {x.content_status != "error" && (
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
            )}
          </div>
        ),
        // loading:
        //   x.content_status == "loading" || x.content_status == "dataLoading",
        content:
          x.content_status == "loading" ? (
            <SyncOutlined spin />
          ) : x.content_status == "error" ? (
            <div className="text-red-400">
              {t`Please verify your network connection. If the network is working, there might be a small bug in the program. Here are the error messages: `}
              <div className="text-red-700">{x.content_error}</div>
            </div>
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
                              title: t`Tool Call`,
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
              {x.reasoning_content && (
                <Collapse
                  defaultActiveKey={["reasoning_content"]}
                  items={[
                    {
                      key: "reasoning_content",
                      label: (
                        <div className="line-clamp-1">
                          thinking: {x.reasoning_content}
                        </div>
                      ),
                      children: (
                        <pre
                          key="1"
                          style={{
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                          }}
                        >
                          {x.reasoning_content}
                        </pre>
                      ),
                    },
                  ]}
                />
              )}
              {x.content && (
                <MarkDown
                  markdown={x.content}
                  onCallback={(e) => {
                    setValue(e);
                  }}
                ></MarkDown>
              )}
              {x.content_status == "dataLoading" && <LoadingOutlined />}
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
                  } else if (x.type == "text") {
                    return (
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {x.text}
                      </pre>
                    );
                  }
                })}
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
      {
        // ...config,
        baseURL: config.baseURL,
        model: config.model,
        apiKey: config.apiKey,
        call_tool_step: config.call_tool_step,
        supportTool: config.supportTool,
        supportImage: config.supportImage,

        allowMCPs: currentChat.current.allowMCPs,
        temperature: currentChat.current.temperature,
      },
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
          // agentKey: currentChat.current.agentKey,
          // allowMCPs: currentChat.current.allowMCPs,
          // modelKey: currentChat.current.modelKey,

          key: v4(),
          label: message,
          messages: openaiClient.current.messages,
          sended: true,
          dateTime: Date.now(),
        });
        ChatHistory.get().data.unshift(currentChat.current);
      } else {
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
      loadMoreData(false);
      await ChatHistory.save();
      // console.log("ChatHistory.d.data", ChatHistory.get().data.slice(0, 5));
    } catch (e) {
      openaiClient.current.lastMessage.content_error = e.message;
      currentChat.current.messages = openaiClient.current.messages;
      refresh();
      await ChatHistory.save();
      antdMessage.error(
        e.message || t`An error occurred, please try again later`,
      );
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const [isToolsShow, setIsToolsShow] = useState(false);

  const [loadMoreing, setLoadMoreing] = useState(false);
  const [conversations, setConversations] = useState<
    GetProp<ConversationsProps, "items">
  >([]);

  let loadIndex = useRef(0);

  const loadDataTatal = useRef(0);

  const loadMoreData = async (loadMore = true, loadIndexChange = true) => {
    // console.log(historyFilterType, historyFilterSearchValue, loadIndex.current);
    // console.log("loadMoreData: ", ChatHistory.get().data);
    if (ChatHistory.get().data.length == 0) {
      console.log("waiting ChatHistory init");
      return;
    }
    if (loadIndexChange) {
      if (loadMore) {
        loadIndex.current += 25;
      } else {
        loadIndex.current = 25;
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
            x.label.toLowerCase().includes(historyFilterSearchValue)
          );
        }
      });
    loadDataTatal.current = formmatedData.length;
    formmatedData = formmatedData.slice(0, loadIndex.current);
    setConversations(formmatedData);
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

  const [historyFilterSign, setHistoryFilterSign] = useState<number>(0);

  const historyFilterType = useRef<
    "all" | "star" | "search" | "agent" | "task"
  >("all");

  const [historyFilterSearchValue, setHistoryFilterSearchValue] = useState("");
  useEffect(() => {
    loadMoreData(false);
  }, [historyFilterType.current, historyFilterSearchValue, historyFilterSign]);

  let supportImage = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    GPT_MODELS.get().data[0]
  )?.supportImage;

  let supportTool = (
    GPT_MODELS.get().data.find((x) => x.key == currentChat.current.modelKey) ||
    GPT_MODELS.get().data[0]
  )?.supportTool;

  const scrollableDivID = useRef("scrollableDiv" + v4());
  // console.log(currentChat.current.allowMCPs, clientsRef);
  return (
    <div className="chat h-full">
      <div className="h-full rounded-lg bg-white p-4">
        <XProvider direction={direction}>
          <Flex style={{ height: "100%" }} gap={12}>
            {!onlyView.histroyKey && (
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
                          agentKey: undefined,
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
                          let find = Agents.get().data.find(
                            (y) =>
                              y.key === currentChat.current.agentKey ||
                              y.key === currentChat.current["gptsKey"],
                          );
                          currentChatReset(
                            {
                              allowMCPs: find.allowMCPs,
                              agentKey: find.key,
                              modelKey: find.modelKey,
                              attachedDialogueCount: find.attachedDialogueCount,
                              temperature: find.temperature,
                            },
                            find.prompt,
                          );
                        }
                      }}
                    >
                      {t`New Chat`}
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
                        agentKey: undefined,
                      });
                      selectGptsKey.current = undefined;
                      loadMoreData(false);
                    }}
                  >
                    {t`New Chat`}
                  </Button>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <Space>
                    <span>{t`Dialogue Records`}</span>
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

                      {
                        value: "agent",
                        icon: "🤖",
                      },
                      {
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
                  className="overflow-y-auto overflow-x-hidden"
                  style={{
                    width: 240,
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
                            label: t`Star`,
                            key: "star",
                            icon: <StarOutlined />,
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
                              conversations.filter(
                                (x) => x.key !== conversation.key,
                              ),
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
                        },
                      })}
                    />
                  </InfiniteScroll>
                </div>
              </div>
            )}

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
                        setPromptsModalValue({} as any);
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
                          } catch {}
                        }}
                      >
                        <SortableContext
                          items={Agents.get()
                            .data.filter(
                              (x) =>
                                botSearchValue == "" ||
                                x.label.toLowerCase().includes(botSearchValue),
                            )
                            .map((x) => x.key)}
                        >
                          {Agents.get()
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
                <Tooltip title={t`Clear Context`}>
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
                <Tooltip title={t`Clients and Tools`}>
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
                          clientsRef.current.filter((v) => {
                            return currentChat.current.allowMCPs.includes(
                              v.name,
                            );
                          }).length
                        }
                      </>
                    ) : (
                      <>💻 {t`LLM not support`}</>
                    )}
                  </span>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title={t`Resources`} placement="bottom">
                  <Dropdown
                    placement="topRight"
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
                <Tooltip title={t`Prompts`} placement="bottom">
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
                <Tooltip title={t`Select LLM`}>
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
                <Tooltip title={t`Select Request Type`}>
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
                        currentChat.current.requestType = e.key as any;
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

                {/* <Tooltip title={t`Token Usage`}>
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
                </Tooltip> */}
                {/* <Divider type="vertical" /> */}
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
                  message.success(t`Delete Success`);
                }}
                promptResList={promptResList}
                promptResListRemove={(x) => {
                  setPromptResList(promptResList.filter((v) => v.uid != x.uid));
                  message.success(t`Delete Success`);
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
                    if (file.path != "") {
                      let path = "file://" + file.path;
                      let p = await urlToBase64(path);
                      resourceResList.push({
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

                      setResourceResList(resourceResList.slice());
                    } else {
                      if (file.size > 0) {
                        let blob = new Blob([await file.arrayBuffer()], {
                          type: file.type,
                        });
                        let p = await blobToBase64(blob);
                        resourceResList.push({
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
                        setResourceResList(resourceResList.slice());
                      }
                    }
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
          title={t`Tool`}
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
                if (openaiClient.current) {
                  calcAttachDialogue(
                    openaiClient.current.messages,
                    currentChat.current.attachedDialogueCount,
                  );
                  openaiClient.current.options.temperature = values.temperature;
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
