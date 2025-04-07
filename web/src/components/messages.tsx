import { Attachments, Bubble } from "@ant-design/x";
import React, { useCallback } from "react";
import { MyMessage } from "../common/openai";
import { CopyOutlined, DownloadOutlined, EditOutlined, LoadingOutlined, MinusCircleOutlined, StockOutlined, SyncOutlined, UploadOutlined, UserOutlined, WechatWorkOutlined } from "@ant-design/icons";
import { Collapse, message, Modal, Space, Spin, Tooltip } from "antd";
import { v4 } from "uuid";
import { call } from "../common/call";
import { t } from "../i18n";
import dayjs from "dayjs";
import { DownImage, MarkDown, UserContent } from "../pages/chat/component";
import { Pre } from "./pre";

export const Messages = ({ messages, onSumbit }: { messages: MyMessage[]; onSumbit: (messages: MyMessage[]) => void }) => {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const format = useCallback((x: MyMessage, i, arr) => {
        let common = {
            className: {
                "no-attached": !(
                    x.content_attached == null || x.content_attached == true
                ),
            } as any,
            role: x.role,
        };

        if (x.role == "user" || x.role == "system") {
            // mcp prompt
            if (x.content_from) {
                return {
                    ...common,
                    key: i.toString(),
                    placement: x.role == "user" || x.role == "system" ? "end" as const : "start" as const,
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
                                    width: "90%",
                                    style: { maxWidth: 1024 },
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
            if (x.content_context == null) {
                x.content_context = {};
            }
            return {
                ...common,
                key: i.toString(),
                placement: "end" as const,
                avatar: {
                    icon: x.role == "system" ? "⚙️" : <UserOutlined />,
                    style: {
                        color: "#f56a00",
                        backgroundColor: "#fde3cf",
                    },
                },
                footer: (
                    <Space>
                        {/* {x.role == "user" && (
              <Tooltip title="New Chat">
                <WechatWorkOutlined
                  onClick={async () => {
                    await onGPTSClick(currentChat.current.agentKey, {
                      loadHistory: false,
                    });
                    if (Array.isArray(x.content)) {
                      // console.log("x.content", x);

                      resourceResListRef.current = x.content
                        .slice(1)
                        .map((x) => {
                          if (x.type == "text") {
                            return {
                              call_name: "new-chat",
                              contents: [
                                {
                                  text: x.text,
                                  type: "text",
                                },
                              ],
                              uid: v4(),
                            };
                          } else if (x.type == "image_url") {
                            return {
                              call_name: "new-chat",
                              contents: [
                                {
                                  path: undefined,
                                  blob: x.image_url.url,
                                  type: "image",
                                },
                              ],
                              uid: v4(),
                            };
                          } else {
                            console.log("unknown type", x);
                          }
                        });

                      if (
                        (x.content[0] as OpenAI.ChatCompletionContentPartText)
                          .type == "text"
                      ) {
                        onRequest(
                          (x.content[0] as OpenAI.ChatCompletionContentPartText)
                            .text,
                        );
                      }
                    } else {
                      onRequest(x.content as any);
                    }
                  }}
                />
              </Tooltip>
            )} */}
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
                            <>
                                {x.content_date && (
                                    <span style={{ marginLeft: 16 }}>
                                        {dayjs(x.content_date).format("YYYY-MM-DD HH:mm:ss")}
                                    </span>
                                )}
                                <SyncOutlined
                                    className="hover:text-cyan-400"
                                    key="sync"
                                    onClick={() => {
                                        onSumbit(messages.filter((x, index) => index <= i));
                                    }}
                                />
                            </>
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
                                messages.find(
                                    (y) => y.role == "system",
                                ).content = content;



                                let userIndex = messages.findLastIndex(
                                    (x) => x.role == "user",
                                );
                                if (userIndex > -1) {
                                    // let content =
                                    //     messages[userIndex].content;
                                    // messages.splice(userIndex);
                                    // refresh();
                                    onSumbit(messages.filter((x, index) => index <= userIndex));
                                    //   onRequest(content as any);
                                }
                            } else {
                                x.content = content;
                                onSumbit(messages.filter((x, index) => index <= i));
                                // onRequest(content);
                            }
                        }}
                    />
                ),
            };
        } else {
            if (true) {
                if (i + 1 != arr.length && arr[i + 1] && arr[i + 1].role != "user") {
                    return;
                }
                // if (arr[i + 1] && arr[i + 1].role != "user") {
                //   return;
                // }
                let rocessProgress = [];
                let index = arr[i].role == "assistant" ? i - 1 : i;
                // let last_content_usage =
                //   arr[i].role == "tool" ? null : arr[i].content_usage;
                while (index >= 0) {
                    // if (last_content_usage == null) {
                    //   if (arr[index].role == "assistant") {
                    //     last_content_usage = arr[index].content_usage;
                    //   }
                    // }
                    if (arr[index].role == "user") {
                        break;
                    }
                    rocessProgress.push(arr[index]);
                    index--;
                }
                rocessProgress = rocessProgress.reverse();
                let last_content_usage = {} as {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
                for (let x of rocessProgress) {
                    if (x.content_usage) {
                        if (x.content_usage.prompt_tokens != 0) {
                            last_content_usage.prompt_tokens = x.content_usage.prompt_tokens;
                        }
                        if (x.content_usage.completion_tokens != 0) {
                            last_content_usage.completion_tokens =
                                x.content_usage.completion_tokens;
                        }
                        if (x.content_usage.total_tokens != 0) {
                            last_content_usage.total_tokens = x.content_usage.total_tokens;
                        }
                    }
                }
                if (arr[i].role == "assistant") {
                    if (x.content_usage) {
                        if (x.content_usage.prompt_tokens != 0) {
                            last_content_usage.prompt_tokens = x.content_usage.prompt_tokens;
                        }
                        if (x.content_usage.completion_tokens != 0) {
                            last_content_usage.completion_tokens =
                                x.content_usage.completion_tokens;
                        }
                        if (x.content_usage.total_tokens != 0) {
                            last_content_usage.total_tokens = x.content_usage.total_tokens;
                        }
                    }
                }
                return {
                    ...common,
                    placement: "start" as const,
                    avatar: {
                        icon: "🤖",
                        style: {
                            color: "#fff",
                            backgroundColor: "#87d068",
                        },
                    },
                    key: i,
                    footer: (
                        <div className="flex flex-wrap justify-between text-xs">
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
                                        // 请求以前的消息，不包括这条
                                        onSumbit(messages.filter((x, index) => index < i));
                                    }}
                                />
                            </Space>
                            {
                                <Space>
                                    {x.content_attached == false && (
                                        <Tooltip title="Cleared">
                                            <MinusCircleOutlined className="cursor-not-allowed bg-red-200" />
                                        </Tooltip>
                                    )}
                                    {x.content_date && (
                                        <span style={{ marginLeft: 16 }}>
                                            {dayjs(x.content_date).format("YYYY-MM-DD HH:mm:ss")}
                                        </span>
                                    )}
                                    {last_content_usage && (
                                        <>
                                            {last_content_usage?.prompt_tokens ? (
                                                <Tooltip title="prompt_tokens">
                                                    <UploadOutlined />
                                                    {last_content_usage?.prompt_tokens}
                                                </Tooltip>
                                            ) : null}
                                            {last_content_usage?.completion_tokens ? (
                                                <Tooltip title="completion_tokens">
                                                    <DownloadOutlined />
                                                    {last_content_usage?.completion_tokens}
                                                </Tooltip>
                                            ) : null}
                                            {last_content_usage?.total_tokens ? (
                                                <Tooltip title="total_tokens">
                                                    <StockOutlined />
                                                    {last_content_usage?.total_tokens}
                                                </Tooltip>
                                            ) : null}
                                        </>
                                    )}
                                </Space>
                            }
                        </div>
                    ),
                    content: (
                        <div>
                            <div>
                                {rocessProgress.map((x, i) => {
                                    if (x.role == "tool") {
                                        return (
                                            <div key={i}>
                                                <span
                                                    key={i}
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        Modal.info({
                                                            width: "90%",
                                                            style: { maxWidth: 1024 },
                                                            title: t`Tool Call Result`,
                                                            maskClosable: true,
                                                            content: <Pre>{x.content as string}</Pre>,
                                                        });
                                                    }}
                                                >
                                                    {x.content_status == "loading" ? (
                                                        <SyncOutlined spin />
                                                    ) : x.content_status == "error" ? (
                                                        <div className="line-clamp-1 text-red-500">
                                                            ❌Error{" "}
                                                            <span className="text-red-300">
                                                                {x?.content?.toString()}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="line-clamp-1 text-green-400">
                                                            ✅Completed{" "}
                                                            <span className="text-gray-400">
                                                                {x?.content?.toString()}
                                                            </span>
                                                        </div>
                                                    )}
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
                                                            return <Pre key={i}>{x.text}</Pre>;
                                                        }
                                                    })}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="bg-gray-200" key={i}>
                                                {x.tool_calls?.map((tool: any, index) => {
                                                    return (
                                                        <Spin
                                                            key={index}
                                                            spinning={x.content_status == "loading"}
                                                        >
                                                            <a
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    Modal.info({
                                                                        width: "90%",
                                                                        style: { maxWidth: 1024 },
                                                                        title: t`Tool Call`,
                                                                        maskClosable: true,
                                                                        content: (
                                                                            <div>
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
                                                                                        {tool.restore_name ||
                                                                                            tool.function.name}
                                                                                    </span>
                                                                                </pre>
                                                                                {x?.content?.toString()}
                                                                                <div>
                                                                                    <span>Tool Arguments: </span>
                                                                                </div>
                                                                                <Pre>{tool.function.arguments}</Pre>
                                                                            </div>
                                                                        ),
                                                                    });
                                                                }}
                                                            >
                                                                <div className="line-clamp-1">
                                                                    🔧
                                                                    <span className="text-purple-500">
                                                                        {tool.restore_name || tool.function.name}
                                                                    </span>{" "}
                                                                    <span className="text-gray-500">
                                                                        {" "}
                                                                        {x?.content?.toString()}
                                                                    </span>{" "}
                                                                    {tool.function.arguments}
                                                                </div>
                                                            </a>
                                                        </Spin>
                                                    );
                                                })}
                                            </div>
                                        );
                                    }
                                })}
                            </div>
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
                                            children: <Pre>{x.reasoning_content}</Pre>,
                                        },
                                    ]}
                                />
                            )}

                            {x.role == "assistant" && (
                                <>
                                    {x.content && (
                                        <MarkDown
                                            markdown={x.content}
                                            onCallback={(e) => {
                                                // setValue(e);
                                            }}
                                        ></MarkDown>
                                    )}
                                    {x.content_status == "loading" ? (
                                        <SyncOutlined spin />
                                    ) : x.content_status == "error" ? (
                                        <div className="text-red-500">
                                            {t`Please verify your network connection. If the network is working, there might be a small bug in the program. Here are the error messages: `}
                                            <div className="text-red-700">{x.content_error}</div>
                                        </div>
                                    ) : null}
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
                                                return <Pre>{x.text}</Pre>;
                                            }
                                        })}
                                </>
                            )}
                        </div>
                    ),
                };
            }

        }
    }, [messages]);

    return <Bubble.List
        autoScroll={true}
        style={{
            paddingRight: 4,
            height:
                messages?.length > 0 ? "100%" : 0,
        }}
        items={messages
            ?.map(format)
            ?.filter((x) => x != null)}
    />
};