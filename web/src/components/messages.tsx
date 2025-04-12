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
import { AssistantToolContent } from "./assistant_tool_content";

export const Messages = ({ messages, onSumbit, readOnly }: { messages: MyMessage[]; onSumbit: (messages: MyMessage[]) => void; readOnly?: boolean }) => {
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

                        {!readOnly && <EditOutlined
                            className="hover:text-cyan-400"
                            onClick={() => {
                                x.content_context.edit = !x.content_context.edit;
                                refresh();
                            }}
                        />}

                        {x.role == "user" && (
                            <>
                                {x.content_date && (
                                    <span style={{ marginLeft: 16 }}>
                                        {dayjs(x.content_date).format("YYYY-MM-DD HH:mm:ss")}
                                    </span>
                                )}
                                {x.content_attached && !readOnly && <SyncOutlined
                                    className="hover:text-cyan-400"
                                    key="sync"
                                    onClick={() => {
                                        x.content_date = Date.now();
                                        onSumbit(messages.filter((x, index) => index <= i));
                                    }}
                                />}
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
                                x.content = content;
                                x.content_date = Date.now();


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
                                x.content_date = Date.now();
                                onSumbit(messages.filter((x, index) => index <= i));
                                // onRequest(content);
                            }
                        }}
                    />
                ),
            };
        } else {
            // role == "assistant" || role == "tool"
            if (true) {
                if (i + 1 != arr.length && arr[i + 1] && arr[i + 1].role != "user") {
                    return;
                }

                let contents = [];
                let index = i;
                while (index >= 0) {
                    if (arr[index].role == "user") {
                        break;
                    }
                    contents.push(arr[index]);
                    index--;
                }
                contents = contents.reverse();
                let last_content_usage = {} as {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
                for (let x of contents) {
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
                                {x.content_attached  && !readOnly && <SyncOutlined
                                    key="sync"
                                    className="hover:text-cyan-400"
                                    onClick={() => {
                                        // role == "assistant" 请求以前的消息，不包括这条
                                        onSumbit(messages.filter((x, index) => index < i));
                                    }}
                                />}
                            </Space>
                            {
                                <Space>
                                    {x.content_attached == false && (
                                        <Tooltip title="Cleared">
                                            <MinusCircleOutlined className="cursor-not-allowed" />
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

                            <AssistantToolContent
                                contents={contents}
                            />

                            {x.content_status == "loading" ? (
                                <SyncOutlined spin />
                            ) : x.content_status == "error" ? (
                                <div className="text-red-500">
                                    {t`Please verify your network connection. If the network is working, there might be a small bug in the program. Here are the error messages: `}
                                    <div className="text-red-700">{x.content_error}</div>
                                </div>
                            ) : null}

                            {x.content_status == "dataLoading" && <LoadingOutlined className=" text-blue-400" />}
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