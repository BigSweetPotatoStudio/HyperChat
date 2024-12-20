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
  Tooltip,
  Typography,
} from "antd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import OpenAI from "openai";
import { v4 } from "uuid";
import markdownit from "markdown-it";

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
} from "@ant-design/icons";
import type { ConfigProviderProps, GetProp } from "antd";
import { MyMessage, OpenAiChannel } from "../../common/openai";
import { ChatHistory, GPT_MODELS, GPTS } from "../../common/data";
import "github-markdown-css";
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

const md = markdownit({ html: true, breaks: true });
const renderMarkdown: BubbleProps["messageRender"] = (content) => (
  <div
    className="markdown-body"
    dangerouslySetInnerHTML={{ __html: md.render(content) }}
  />
);
const MarkDown = ({ markdown }) => {
  const [render, setRender] = React.useState("markdown");
  return (
    <div
      className="relative bg-white p-4"
      style={{ width: "100%", overflowX: "auto" }}
    >
      <Segmented
        size="small"
        onChange={(value) => {
          setRender(value);
        }}
        options={[
          {
            label: "Markdown",
            value: "markdown",
            icon: <FileMarkdownOutlined />,
          },
          {
            label: "Text",
            value: "text",
            icon: <FileTextOutlined />,
          },
        ]}
      />
      <br></br>
      {render == "markdown" ? (
        renderMarkdown(markdown)
      ) : (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {markdown}
        </pre>
      )}
    </div>
  );
};

let client: OpenAiChannel;

let localChatHistory = [];
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
      localChatHistory = ChatHistory.get().data;
      loadMoreData();
    });

    GPTS.init().then(() => {
      refresh();
    });
    GPT_MODELS.init().then(() => {
      refresh();
    });
    getClients().then((x) => {
      setClients(x);
      getPrompts().then((x) => {
        console.log("getPrompts", x);
        setPrompts(x);
      });
      getResourses().then((x) => {
        console.log("getResourses", x);
        setResources(x);
      });
    });
    currentChatReset();
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
    icon: "",
  });
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
                title: "提示",
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
            <Tooltip
              title={
                <>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      client.messages.splice(i);
                      currentChat.current.messages = client.messages;
                      refresh();
                    }}
                  >
                    清除
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => {
                      client.messages.splice(i);
                      currentChat.current.messages = client.messages;
                      refresh();
                      onRequest(x.content as string);
                    }}
                  >
                    重新生成
                  </Button>
                </>
              }
            >
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                }}
              >
                {x.content as string}
              </pre>
            </Tooltip>
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
                  title: "工具调用结果",
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
              {x.content_status == "error" ? "❌" : "✅已完成"}
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
              {x.tool_calls && (
                <Tooltip
                  title={
                    <div className="h-40 overflow-auto text-ellipsis">
                      {x.tool_calls[0].function.arguments}
                    </div>
                  }
                >
                  <Spin spinning={i + 1 == arr.length}>
                    <a
                      className="cursor-pointer"
                      onClick={() => {
                        Modal.info({
                          width: "80%",
                          title: "工具调用",
                          content: (
                            <div>
                              <pre
                                style={{
                                  whiteSpace: "pre-wrap",
                                  wordWrap: "break-word",
                                }}
                              >
                                <span>工具名称: </span>
                                {x.tool_calls[0].function.name}
                              </pre>
                              <pre
                                style={{
                                  whiteSpace: "pre-wrap",
                                  wordWrap: "break-word",
                                }}
                              >
                                <span>工具参数: </span>{" "}
                                {x.tool_calls[0].function.arguments}
                              </pre>
                            </div>
                          ),
                        });
                      }}
                    >
                      {x.tool_calls[0].function.name}
                    </a>
                  </Spin>
                </Tooltip>
              )}
              {x.content && <MarkDown markdown={x.content}></MarkDown>}
            </div>
          ),
      };
    }
  }

  const currentChatReset = (prompt?: string) => {
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
      modelKey: undefined,
      gptsKey: undefined,
      sended: false,
      icon: "",
    };
    refresh();
    setResourceResList([]);
    setPromptResList([]);
  };
  const createChat = () => {
    let config = GPT_MODELS.get().data.find(
      (x) => x.key == currentChat.current.modelKey,
    );
    if (config == null) {
      if (GPT_MODELS.get().data.length == 0) {
        message.error("请先添加大模型");
      }
      config = GPT_MODELS.get().data[0];
    }
    client = new OpenAiChannel(config, currentChat.current.messages);
    currentChat.current.messages = client.messages;
    refresh();
  };
  const [loading, setLoading] = useState(false);
  const onRequest = async (message: string) => {
    console.log("onRequest", message);
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
      };
      setData([currentChat.current, ...data]);
      ChatHistory.get().data.unshift(currentChat.current);
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
    setLoading(false);
  };
  // const [chatHistorys, setChatHistorys] = useState([]);

  const [isToolsShow, setIsToolsShow] = useState(false);

  const [loadMoreing, setLoadMoreing] = useState(false);
  const [data, setData] = useState<GetProp<ConversationsProps, "items">>([]);

  let loadIndex = useRef(0);

  const loadMoreData = () => {
    // console.log("loadMoreData: ", ChatHistory.get().data);
    loadIndex.current += 50;
    if (loadMoreing) {
      return;
    }
    setLoadMoreing(true);

    const formmatedData = localChatHistory.slice(0, loadIndex.current);
    setData(formmatedData);

    setLoadMoreing(false);
  };

  const [resourceResList, setResourceResList] = React.useState([]);
  const [promptResList, setPromptResList] = React.useState([]);

  const [isFillPromptModalOpen, setIsFillPromptModalOpen] =
    React.useState(false);
  const [fillPromptFormItems, setFillPromptFormItems] = React.useState([]);
  const mcpCallPromptCurr = useRef({} as any);

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
                  currentChatReset();
                }}
              >
                新建聊天
              </Button>
              <div>
                <Space className="mt-2">
                  <CommentOutlined />
                  <span>对话记录</span>
                </Space>
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
                  hasMore={data.length < ChatHistory.get().data.length}
                  loader={
                    <div style={{ textAlign: "center" }}>
                      <Spin indicator={<RedoOutlined spin />} size="small" />
                    </div>
                  }
                  endMessage={<Divider plain>没有了 🤐</Divider>}
                  scrollableTarget="scrollableDiv"
                >
                  <Conversations
                    items={data}
                    activeKey={currentChat.current.key}
                    onActiveChange={(key) => {
                      let item = ChatHistory.get().data.find(
                        (x) => x.key == key,
                      );
                      console.log("onActiveChange", item);
                      if (item) {
                        currentChatReset();
                        currentChat.current = item;

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
                          label: "收藏",
                          key: "star",
                          icon: <StarOutlined />,
                        },
                        {
                          label: "删除",
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
                          message.success("删除成功");
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
                    title="欢迎"
                    className="mb-4"
                    description={
                      GPTS.get().data.length > 0
                        ? "选择下面的提示词，开始聊天吧"
                        : "开始聊天"
                    }
                  />
                  <div className="flex items-center">
                    <Prompts
                      onItemClick={(item) => {
                        console.log("onItemClick", item);
                        if (mode == "edit") {
                          return;
                        }

                        currentChatReset(
                          GPTS.get().data.find((y) => y.key === item.data.key)
                            .prompt,
                        );
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
                                title="请确定是否删除"
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
                        添加
                      </Button>
                      {mode == "edit" ? (
                        <Button
                          onClick={() => {
                            setMode(undefined);
                          }}
                        >
                          退出编辑
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            setMode("edit");
                          }}
                        >
                          编辑
                        </Button>
                      )}
                    </Space.Compact>
                  </div>
                </div>
              )}
              <Bubble.List
                style={{ flex: 1 }}
                items={currentChat.current.messages?.map(format)}
              />
              <div className="">
                {/* <Tooltip title="取消请求">
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
                <Tooltip title="重新开始">
                  <span
                    className="cursor-pointer"
                    onClick={() => {
                      if (client) {
                        client.clear();
                        currentChat.current.messages = client.messages;
                        refresh();
                      }
                    }}
                  >
                    🔄
                  </span>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title="客户端和工具">
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
                    {/* 🛠️{tools.length} */}
                  </span>
                </Tooltip>
                <Divider type="vertical" />
                <Tooltip title="资源" placement="bottom">
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
                <Tooltip title="提示词" placement="bottom">
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
                <Tooltip title="选择大模型">
                  🧠
                  <Select
                    size="small"
                    placeholder={
                      GPT_MODELS.get().data.length > 0
                        ? GPT_MODELS.get().data[0].name
                        : "请添加大模型"
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
                <Tooltip title="Token使用情况">
                  <span className="cursor-pointer">
                    token: {client?.totalTokens || 0}
                  </span>
                </Tooltip>
              </div>
              <MyAttachR
                resourceResList={resourceResList}
                resourceResListRemove={(x) => {
                  setResourceResList(
                    resourceResList.filter((v) => v.uid != x.uid),
                  );
                  message.success("删除成功");
                }}
                promptResList={promptResList}
                promptResListRemove={(x) => {
                  setPromptResList(promptResList.filter((v) => v.uid != x.uid));
                  message.success("删除成功");
                }}
              ></MyAttachR>

              <Sender
                loading={loading}
                value={value}
                onChange={(nextVal) => {
                  setValue(nextVal);
                }}
                onCancel={() => {
                  setLoading(false);
                  client.cancel();
                  message.success("Cancel sending!");
                }}
                onSubmit={(s) => {
                  setValue("");
                  onRequest(s);
                }}
                placeholder="开始输入"
              />
            </Flex>
            {/* <Divider type="vertical" style={{ height: "100%" }} />
            <ThoughtChain
              style={{ width: 200 }}
              items={[
                {
                  title: "Hello Ant Design X!",
                  status: "success",
                  description: "status: success",
                  icon: <CheckCircleOutlined />,
                  content:
                    "Ant Design X help you build AI chat/platform app as ready-to-use 📦.",
                },
                {
                  title: "Hello World!",
                  status: "success",
                  description: "status: success",
                  icon: <CheckCircleOutlined />,
                },
                {
                  title: "Pending...",
                  status: "pending",
                  description: "status: pending",
                  icon: <LoadingOutlined />,
                },
              ]}
            /> */}
          </Flex>
        </XProvider>
        <PromptsModal
          open={isOpenPromptsModal}
          onCreate={(value) => {
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
          title="工具"
          onOk={() => setIsToolsShow(false)}
          cancelButtonProps={{ style: { display: "none" } }}
        >
          <Table
            size="small"
            rowKey={(record) => record.name}
            pagination={false}
            dataSource={clients}
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
                            <span className="cursor-pointer">
                              {x.function.name.replace(x.key + "--", "")}
                            </span>
                            {", "}
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
          {/* <Form.Item
            name="baseURL"
            label="baseURL"
            rules={[{ required: true, message: "请输入" }]}
          >
            <Input placeholder="请输入baseURL"></Input>
          </Form.Item> */}
          {fillPromptFormItems.map((x) => {
            return (
              <Form.Item
                key={x.name}
                name={x.name}
                label={x.name}
                rules={[{ required: x.required, message: "请输入" }]}
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
