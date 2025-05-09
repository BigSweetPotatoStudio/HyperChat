import {
    CopyOutlined,
    DownloadOutlined,
    FileMarkdownOutlined,
    FileTextOutlined,
    FundViewOutlined,
    UploadOutlined,
} from "@ant-design/icons";
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
const antdMessage = message;
import React, { useCallback, useEffect, useRef, useState } from "react";
// import "github-markdown-css/github-markdown-light.css";


import markdownit from "markdown-it";
import mk from "@vscode/markdown-it-katex";
import { DownImage } from "../pages/chat/component";
import { Editor } from "./editor";
import { t } from "../i18n";
import { MyMessage } from "../../../common/data";

export function UserContent({ x, regenerate = undefined, onSubmit }: { x: MyMessage, regenerate?: () => void, onSubmit: (x: any) => void }) {
    const [isEdit, setIsEdit] = useState(false);
    const [value, setValue] = useState("");
    const container = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [maxWidth, setMaxWidth] = useState(0);
    // console.log(maxWidth)
    useEffect(() => {
        setMaxWidth(container.current ? (container.current.parentElement.parentElement.parentElement.offsetWidth - 60) : 500);
        if (x.content_context.edit) {

            setWidth(container.current ? Math.min(container.current.offsetWidth + 50, maxWidth) : 500);
            if (Array.isArray(x.content)) {
                if (x.content[0].type == "text") {
                    setValue(x.content[0].text);
                }
            } else {
                setValue(x.content.toString());
            }
            setIsEdit(true);
        } else {
            setIsEdit(false);
        }
    }, [x.content_context.edit]);
    return (
        <div ref={c => container.current = c}>

            {isEdit ? (
                <div>
                    <Editor autoHeight style={{ width: width + "px", minWidth: 300, border: "0px", padding: "4px 0" }} value={x.content_template || x.content.toString()} onChange={e => {
                        setValue(e);
                    }} onSubmit={() => {
                        x.content_sended = false;
                        x.content_context.edit = false;
                        setIsEdit(false);
                        onSubmit(value);
                    }}></Editor>
                    <Space.Compact>
                        <Button
                            size="small"
                            onClick={() => {
                                x.content_context.edit = false;
                                setIsEdit(false);
                            }}
                        >
                            {t`Cancel`}
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                x.content_sended = false;
                                x.content_context.edit = false;
                                setIsEdit(false);
                                onSubmit(value);
                            }}
                        >
                            {t`Submit`}
                        </Button>
                    </Space.Compact>
                </div>
            ) : (!x.content_sended && x.role == "system" && maxWidth > 0) ? <div><Editor autoHeight style={{ width: maxWidth + "px", minWidth: 300, border: "0px", padding: "4px 0" }} value={x.content_template || x.content.toString()} onChange={e => {
                x.content_template = e;
            }} ></Editor></div> : Array.isArray(x.content) ? (
                x.content.map((c, i) => {
                    if (c.type == "text") {
                        return (
                            <div key={i}>
                                <pre
                                    key={i}
                                    style={{
                                        whiteSpace: "pre-wrap",
                                        wordWrap: "break-word",
                                    }}
                                >
                                    {c.text.toString() || x.content_template}
                                </pre>
                                {x.content.length > 1 && i == 0 && (
                                    <Divider plain>resources</Divider>
                                )}
                            </div>
                        );
                    } else if (c.type == "image_url") {
                        return (
                            <DownImage
                                onClick={() => {
                                    Modal.info({
                                        width: "50%",
                                        title: "Tip",
                                        maskClosable: true,
                                        content: (
                                            <div>
                                                <img
                                                    className="bg-cover"
                                                    src={c.image_url.url as string}
                                                />
                                            </div>
                                        ),
                                    });
                                }}
                                key={i}
                                src={c.image_url.url}
                                className="h-48 w-48"
                            />
                        );
                    } else {
                        return <span key={i}>unknown</span>;
                    }
                })
            ) : (

                <pre
                    style={{
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                    }}
                >
                    {x.content.toString() || x.content_template}
                </pre>
                // <Editor autoHeight style={{ width: "80%" }} value={x.content.toString()}></Editor>
            )}
        </div>
    );
}




