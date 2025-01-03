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
  message,
  Modal,
  Popconfirm,
  Radio,
  Result,
  Segmented,
  Select,
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
import { MarkDown, UserContent } from "./component";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortableItem";
import { QuickPath, SelectFile } from "../../common/selectFile";

let client: OpenAiChannel;

export const Chat = () => {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const [clients, setClients] = React.useState<InitedClient[]>([]);
  const [prompts, setPrompts] = React.useState<InitedClient["prompts"]>([]);
  const [resources, setResources] = React.useState<InitedClient["resources"]>(
    [],
  );
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
      let clients = await getClients().catch(() => []);
      currentChatReset(
        "",
        clients.map((v) => v.name),
      );
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

  const currentChat = React.useRef({
    label: "",
    key: "",
    messages: [],
    modelKey: undefined,
    gptsKey: undefined,
    sended: false,
    requestType: "stream",
    icon: "",
    allowMCPs: [],
  });
  const currentChatReset = (
    prompt?: string,
    allowMCPs = [],
    modelKey?: string,
  ) => {
    currentChat.current = {
      label: "",
      key: "",
      messages: prompt
        ? [
            {
              role: "system",
              content: prompt,
            },
          ]
        : [],
      modelKey: modelKey,
      gptsKey: undefined,
      sended: false,
      icon: "",
      allowMCPs: allowMCPs,
      requestType: currentChat.current.requestType,
    };
    refresh();
    setResourceResList([]);
    setPromptResList([]);
    getClients().then((clients) => {
      for (let c of clients) {
        if ((currentChat.current.allowMCPs || []).includes(c.name)) {
          c.enable = true;
        } else {
          c.enable = false;
        }
      }
      setClients(clients);
      getPrompts().then((x) => {
        setPrompts(x);
      });
      getResourses().then((x) => {
        setResources(x);
      });
    });
  };

  function format(x: MyMessage, i, arr): any {
    if (x.content_from) {
      return {
        ...x,
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
      return {
        ...x,
        key: i.toString(),
        placement: "end",
        avatar: {
          icon: x.role == "system" ? "⚙️" : <UserOutlined />,
          style: {
            color: "#f56a00",
            backgroundColor: "#fde3cf",
          },
        },
        content:
          x.role == "system" ? (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
              }}
            >
              {x.content as string}
            </pre>
          ) : (
            <UserContent
              x={x}
              regenerate={() => {
                client.messages.splice(i);
                currentChat.current.messages = client.messages;
                refresh();
                onRequest(x.content as string);
              }}
              submit={(content) => {
                client.messages.splice(i);
                currentChat.current.messages = client.messages;
                refresh();
                onRequest(content as string);
              }}
            />
          ),
      };
    } else if (x.role == "tool") {
      return {
        ...x,
        placement: "start",
        avatar: {
          icon: "🤖",
          style: {
            color: "#fff",
            backgroundColor: "#87d068",
          },
        },
        key: i.toString(),
        content: (
          <Tooltip
            title={
              <div className="h-40 overflow-auto text-ellipsis">
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
              {x.content_status == "error" ? "❌" : "✅Completed"}
            </span>
          </Tooltip>
        ),
      };
    } else {
      return {
        ...x,
        placement: "start",
        avatar: {
          icon: "🤖",
          style: {
            color: "#fff",
            backgroundColor: "#87d068",
          },
        },
        key: i.toString(),
        content:
          !x.content && x.tool_calls == null ? (
            <Spin spinning={i + 1 == arr.length}>
              <span>🤖</span>
            </Spin>
          ) : (
            <div>
              {x.tool_calls &&
                x.tool_calls.map((tool) => {
                  return (
                    <Tooltip
                      title={
                        <div className="h-40 overflow-auto text-ellipsis">
                          {tool.function.arguments}
                        </div>
                      }
                    >
                      <Spin spinning={i + 1 == arr.length}>
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
                                    {tool.function.name}
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
                            {tool.function.name} : {tool.function.arguments}
                          </div>
                        </a>
                      </Spin>
                    </Tooltip>
                  );
                })}
              {x.content && <MarkDown markdown={x.content}></MarkDown>}
            </div>
          ),
      };
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
    client = new OpenAiChannel(
      config,
      currentChat.current.messages,
      currentChat.current.requestType == "stream",
    );
    currentChat.current.messages = client.messages;
    refresh();
  };
  const [loading, setLoading] = useState(false);
  const onRequest = async (message: string) => {
    console.log("onRequest", message);
    try {
      setLoading(true);
      if (currentChat.current.sended == false) {
        createChat();
        currentChat.current = {
          ...currentChat.current,
          label: message,
          key: v4(),
          messages: client.messages,
          modelKey: currentChat.current.modelKey,
          sended: true,
          icon: "",
          gptsKey: currentChat.current.gptsKey,
          allowMCPs: clients
            .filter((record) => (record.enable == null ? true : record.enable))
            .map((v) => v.name),
        };
        setData([currentChat.current, ...data]);
        ChatHistory.get().data.unshift(currentChat.current);
      } else {
        let find = ChatHistory.get().data.find(
          (x) => x.key == currentChat.current.key,
        );
        if (find) {
          currentChat.current.allowMCPs = clients
            .filter((record) => (record.enable == null ? true : record.enable))
            .map((v) => v.name);
        }
      }
      client.addMessage(
        { role: "user", content: message },
        resourceResList,
        promptResList,
      );
      setResourceResList([]);
      setPromptResList([]);
      refresh();

      await client.completion(() => {
        currentChat.current.messages = client.messages;
        refresh();
      });
      currentChat.current.messages = client.messages;
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

    const formmatedData = ChatHistory.get()
      .data.filter((x) => {
        if (historyFilterType == "all") {
          return true;
        } else if (historyFilterType == "star") {
          return x.icon == "⭐";
        } else {
          return (
            historyFilterSearchValue == "" ||
            x.label.toLowerCase().includes(historyFilterSearchValue)
          );
        }
      })
      .slice(0, loadIndex.current);
    setData(formmatedData);

    setLoadMoreing(false);
  };

  const [resourceResList, setResourceResList] = React.useState([]);
  const [promptResList, setPromptResList] = React.useState([]);

  const [isFillPromptModalOpen, setIsFillPromptModalOpen] =
    React.useState(false);
  const [fillPromptFormItems, setFillPromptFormItems] = React.useState([]);
  const mcpCallPromptCurr = useRef({} as any);

  const sensors = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });
  const [botSearchValue, setBotSearchValue] = useState("");

  const [historyFilterSign, setHistoryFilterSign] = useState<0 | 1>(0);
  const [historyFilterType, setHistoryFilterType] = useState<
    "all" | "star" | "search"
  >("all");
  const [historyFilterSearchValue, setHistoryFilterSearchValue] = useState("");
  useEffect(() => {
    loadMoreData(historyFilterSign == 0);
  }, [historyFilterType, historyFilterSearchValue, historyFilterSign]);
  return (
    <div className="chat h-full">
      <div className="h-full rounded-lg bg-white p-4">
        <XProvider direction={direction}>
          <Flex style={{ height: "100%" }} gap={12}>
            <div
              className="h-full flex-none overflow-hidden pr-2"
              style={{ width: "240px" }}
            >
              <Button
                type="primary"
                className="w-full"
                onClick={() => {
                  currentChatReset(
                    "",
                    clients.map((v) => v.name),
                  );
                }}
              >
                New Chat
              </Button>
              <div className="mt-2 flex items-center justify-between">
                <Space>
                  {/* <CommentOutlined /> */}
                  <span>Dialogue Records</span>
                </Space>
                <Segmented
                  size="small"
                  value={historyFilterType}
                  onChange={(value) => {
                    setHistoryFilterType(value as any);
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
                {historyFilterType == "search" && (
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
                id="scrollableDiv"
                className="overflow-y-auto overflow-x-hidden"
                style={{
                  width: 240,
                  height: "calc(100% - 70px)",
                }}
              >
                <InfiniteScroll
                  dataLength={data.length}
                  next={loadMoreData}
                  hasMore={
                    data.length <
                    ChatHistory.get().data.filter((x) => {
                      if (historyFilterType == "all") {
                        return true;
                      } else if (historyFilterType == "star") {
                        return x.icon == "⭐";
                      } else {
                        return (
                          historyFilterSearchValue == "" ||
                          x.label
                            .toLowerCase()
                            .includes(historyFilterSearchValue)
                        );
                      }
                    }).length
                  }
                  loader={
                    <div style={{ textAlign: "center" }}>
                      <Spin indicator={<RedoOutlined spin />} size="small" />
                    </div>
                  }
                  endMessage={<Divider plain>Nothing 🤐</Divider>}
                  scrollableTarget="scrollableDiv"
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
                      let item = ChatHistory.get().data.find(
                        (x) => x.key == key,
                      );
                      // console.log("onActiveChange", item);
                      if (item) {
                        currentChatReset();
                        Object.assign(currentChat.current, item);
                        // currentChat.current = item;

                        createChat();
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
                          if (ChatHistory.get().data[index].icon.length == 0) {
                            ChatHistory.get().data[index].icon = "⭐";
                          } else {
                            ChatHistory.get().data[index].icon = "";
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
                      Add Bot
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
                            // console.log(
                            //   "onDragEnd",
                            //   e,
                            //   data[oldIndex].label,
                            //   data[newIndex].label,
                            // );
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
                                  console.log("onGPTSClick", item);
                                  if (mode == "edit") {
                                    return;
                                  }
                                  let find = GPTS.get().data.find(
                                    (y) => y.key === item.key,
                                  );
                                  currentChatReset(
                                    find.prompt,
                                    find.allowMCPs,
                                    find.modelKey,
                                  );
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
                                    onOk: () => {
                                      let index = GPTS.get().data.findIndex(
                                        (y) => y.key === item.key,
                                      );
                                      GPTS.get().data.splice(index, 1);
                                      GPTS.save();
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

                    {/* <Prompts
                      onItemClick={(item) => {
                        console.log("onItemClick", item);
                        if (mode == "edit") {
                          return;
                        }
                        let find = GPTS.get().data.find(
                          (y) => y.key === item.data.key,
                        );
                        currentChatReset(find.prompt, find.allowMCPs);
                      }}
                      items={GPTS.get().data.map((x) => {
                        return {
                          ...x,
                          description: mode == "edit" && (
                            <span>
                              <Button
                                size="small"
                                onClick={() => {
                                  let value = GPTS.get().data.find(
                                    (y) => y.key === x.key,
                                  );

                                  setPromptsModalValue(value);
                                  setIsOpenPromptsModal(true);
                                }}
                              >
                                <EditOutlined />
                              </Button>
                              <Popconfirm
                                title="Are you sure to delete?"
                                onConfirm={() => {
                                  let index = GPTS.get().data.findIndex(
                                    (y) => y.key === x.key,
                                  );
                                  GPTS.get().data.splice(index, 1);
                                  GPTS.save();
                                  refresh();
                                }}
                              >
                                <Button size="small">
                                  <DeleteOutlined />
                                </Button>
                              </Popconfirm>
                            </span>
                          ),
                        };
                      })}
                    />
                    <Space.Compact className="ml-2">
                      <Button
                        onClick={() => {
                          setPromptsModalValue({} as any);
                          setIsOpenPromptsModal(true);
                        }}
                      >
                        Add
                      </Button>
                      {mode == "edit" ? (
                        <Button
                          onClick={() => {
                            setMode(undefined);
                          }}
                        >
                          Exit Edit
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setMode("edit");
                          }}
                        >
                          Edit
                        </Button>
                      )}
                    </Space.Compact> */}
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
                <Tooltip title="Reset">
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      if (client) {
                        // client.clear();
                        // currentChat.current.messages = client.messages;
                        let p = currentChat.current.messages.find(
                          (x) => x.role == "system",
                        )?.content;

                        currentChatReset(p, currentChat.current.allowMCPs);
                      }
                    }}
                  >
                    🔄
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
                    💻
                    {
                      clients.filter(
                        (v) => v.enable == null || v.enable == true,
                      ).length
                    }
                  </span>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Resources" placement="bottom">
                  <Dropdown
                    placement="topRight"
                    menu={{
                      items: resources.map((x, i) => {
                        return {
                          key: x.key,
                          label: `${x.key}--${x.description}`,
                        };
                      }),
                      onClick: async (item) => {
                        let resource = resources.find(
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
                      {resources.length}
                    </span>
                  </Dropdown>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title="Prompts" placement="bottom">
                  <Dropdown
                    placement="topRight"
                    menu={{
                      items: prompts.map((x, i) => {
                        return {
                          key: x.key,
                          label: `${x.key} (${x.description})`,
                        };
                      }),
                      onClick: async (item) => {
                        let prompt = prompts.find((x) => x.key === item.key);
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
                      {prompts.length}
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
                  {/* <Select
                    size="small"
                    className="w-20"
                    value={currentChat.current.requestType}
                    onChange={(value) => {
                      currentChat.current.requestType = value;
                      createChat();
                    }}
                    options={[
                      {
                        label: "stream",
                        value: "stream",
                      },
                      {
                        label: "completion",
                        value: "completion",
                      },
                    ]}
                  ></Select> */}
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
                    {client == null ? (
                      0
                    ) : typeof client.totalTokens == "number" &&
                      !Number.isNaN(client.totalTokens) ? (
                      client.totalTokens
                    ) : (
                      <span>{"estimate " + client.estimateTotalTokens}</span>
                    )}
                  </span>
                </Tooltip>
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
                  loading={loading}
                  value={value}
                  onChange={(nextVal) => {
                    setValue(nextVal);
                  }}
                  onCancel={() => {
                    setLoading(false);
                    client.cancel();
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
          onCreate={(value) => {
            console.log("onCreate", value);
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
            GPTS.save();
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
            dataSource={clients}
            rowHoverable={false}
            rowSelection={{
              type: "checkbox",
              selectedRowKeys: clients
                .filter((record) =>
                  record.enable == null ? true : record.enable,
                )
                .map((v) => v.name),
              onChange: (selectedRowKeys, selectedRows) => {
                for (let c of clients) {
                  c.enable = false;
                }
                for (let row of selectedRowKeys) {
                  let client = clients.find((v) => v.name == row);
                  client.enable = true;
                }
                refresh();
                getPrompts().then((x) => {
                  setPrompts(x);
                });
                getResourses().then((x) => {
                  setResources(x);
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
                            key={x.function.name}
                            title={x.function.description}
                          >
                            <Tag className="cursor-pointer">
                              {x.function.name.replace(x.key + "--", "")}
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
          title="Fill Prompt Arguments"
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
      </div>
    </div>
  );
};
