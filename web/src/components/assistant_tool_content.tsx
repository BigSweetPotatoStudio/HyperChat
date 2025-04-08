import {
    CopyOutlined,
    DownloadOutlined,
    FileMarkdownOutlined,
    FileTextOutlined,
    FundViewOutlined,
    SyncOutlined,
    UploadOutlined,
} from "@ant-design/icons";
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
import "github-markdown-css/github-markdown-light.css";
import "../../public/katex/katex.min.css";

import markdownit from "markdown-it";
import mk from "@vscode/markdown-it-katex";

// let webviewErrorValue = "";
import { call } from "../common/call";
import hljs from "highlight.js"; // https://highlightjs.org
import "highlight.js/styles/github.css";
import { v4 } from "uuid";
import { sleep } from "../common/sleep";
import { isOnBrowser } from "../common/util";
import { t } from "../i18n";
import { MyMessage } from "../common/openai";
import { Pre } from "./pre";
import { DownImage } from "../pages/chat/component";

const md = markdownit({
    html: true,
    breaks: true,

    highlight: function (str, lang) {
        let fnName = "copy" + v4().replaceAll("-", "");
        window[fnName] = async () => {
            await call("setClipboardText", [str]);
            message.success(t`Copied to clipboard`);
        };
        if (lang && hljs.getLanguage(lang)) {
            try {
                return (
                    `<div class="my-highlight" style="position:relative;padding:0px;" ><span onclick="${fnName}()" style="position:absolute;bottom:0px;left:0px;" role="img" aria-label="copy" tabindex="-1" class="anticon anticon-copy cursor-pointer"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></span><code class="hljs">` +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    "</code></div>"
                );
            } catch (__) { }
        }

        return (
            `<div class="my-highlight" style="position:relative;padding:0px;" ><span onclick="${fnName}()" style="position:absolute;bottom:0px;left:0px;" role="img" aria-label="copy" tabindex="-1" class="anticon anticon-copy cursor-pointer"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></span><code class="hljs" >` +
            md.utils.escapeHtml(str) +
            "</code></div>"
        );
    },
});
md.use(mk);

function render(content) {
    content = content.replace(/\\\[(.+?)\\\]/gs, "$$" + "$1" + "$$");
    content = content.replace(/\\\((.+?)\\\)/g, "$$" + "$1" + "$$");
    return md.render(content);
}

function IRenderMarkdown(props) {
    return (
        <div
            className="markdown-body text-sm lg:text-base"
            dangerouslySetInnerHTML={{ __html: render(props.children) }}
        />
    );
}
const RenderMarkdown = React.memo(IRenderMarkdown);

function extractHTMLContent(str) {
    // 定义一个正则表达式来匹配 ```html 和 ``` 之间的所有内容
    const regex = /```html(.*?)```/gs;
    // 执行匹配并检查是否有结果
    let match = regex.exec(str);
    if (match && match[1]) {
        // 如果有匹配项，返回捕获组中的内容，并去除多余的空白字符
        return match[1].trim();
    }
    // 如果没有找到匹配的内容，则返回空字符串或 null
    return "";
}
function extractSvgContent(str) {
    // 定义一个正则表达式来匹配 ```svg 和 ``` 之间的所有内容
    let regex = /```xml(\n?<svg.*?)```/gs;
    // 执行匹配并检查是否有结果
    let match = regex.exec(str);
    if (match && match[1]) {
        // 如果有匹配项，返回捕获组中的内容，并去除多余的空白字符
        return match[1].trim();
    }
    // 定义一个正则表达式来匹配 ```svg 和 ``` 之间的所有内容
    regex = /```svg(\n?<svg.*?)```/gs;
    // 执行匹配并检查是否有结果
    match = regex.exec(str);
    if (match && match[1]) {
        // 如果有匹配项，返回捕获组中的内容，并去除多余的空白字符
        return match[1].trim();
    }
    return "";
}
function textToBase64Unicode(text) {
    // 创建一个Uint8Array从TextEncoder输出的字节流
    let encoder = new TextEncoder();
    let uint8Array = encoder.encode(text);

    // 将Uint8Array转化为字符串，因为btoa接受字符串作为参数
    let binaryString = Array.from(uint8Array, (byte) =>
        String.fromCharCode(byte),
    ).join("");

    // 使用btoa进行Base64编码
    return btoa(binaryString);
}


export const AssistantToolContent = ({ contents }: { contents: MyMessage[] }) => {
    // console.log("AssistantToolContent", contents);
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };

    const [render, setRender] = React.useState("markdown");


    return (
        <div
            className="relative bg-white p-2"
            style={{ width: "100%", overflowX: "auto" }}
        >
            <Segmented
                size="small"
                value={render}
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
                    }
                ].filter((x) => x)}
            />

            {contents.map((x, i) => {
                if (x.role === "assistant") {
                    x.content = x.content || "";
                    return (
                        <div key={i}>
                            {
                                render == "markdown" ? (
                                    <RenderMarkdown>{x.content.toString()}</RenderMarkdown>
                                ) : render == "text" ? (
                                    <pre
                                        style={{
                                            whiteSpace: "pre-wrap",
                                            wordWrap: "break-word",
                                        }}
                                    >
                                        {x.content.toString()}
                                    </pre>
                                ) : null
                            }
                            <div className="my-collapse" style={{ display: x.tool_calls?.length > 0 ? "block" : "none" }}  >
                                <Collapse
                                    bordered={false}
                                    size="small"
                                    items={x.tool_calls?.map((tool: any, index) => {
                                        return {
                                            key: index.toString(),
                                            showArrow: false,
                                            label: <Spin
                                                key={index}
                                                spinning={x.content_status == "loading"}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="line-clamp-1 text-blue-500">
                                                            🔧
                                                            <span className="text-purple-500">
                                                                {tool.restore_name || tool.function.name}
                                                            </span>{" "}
                                                            {tool.function.arguments}
                                                        </div>
                                                    </div>
                                                    <a >
                                                        {(() => {
                                                            let y = x;
                                                            x = contents.find(j => j.tool_call_id == tool.id);
                                                            if (x == undefined) {
                                                                return null;
                                                            }
                                                            return <div >
                                                                <span
                                                                    key={i}
                                                                    className="cursor-pointer"

                                                                >
                                                                    {x.content_status == "loading" ? (
                                                                        <SyncOutlined spin />
                                                                    ) : x.content_status == "error" ? (
                                                                        <div className="line-clamp-1 text-red-500">
                                                                            ❌
                                                                        </div>
                                                                    ) : (
                                                                        <div className="line-clamp-1 text-green-400">
                                                                            ✅
                                                                        </div>
                                                                    )}
                                                                </span>

                                                            </div>
                                                        })()}
                                                    </a>
                                                </div>
                                            </Spin>,
                                            children: (
                                                <div key={index} className="max-h-80 overflow-auto bg-slate-200">
                                                    <div className="">
                                                        <Pre>{tool.function.arguments}</Pre>
                                                    </div>

                                                    <div>
                                                        {(() => {
                                                            let y = x;
                                                            x = contents.find(j => j.tool_call_id == tool.id);
                                                            if (x == undefined) {
                                                                return null;
                                                            }
                                                            return <div >
                                                                <span
                                                                    key={i}
                                                                >
                                                                    {x.content_status == "loading" ? (
                                                                        <SyncOutlined spin />
                                                                    ) : x.content_status == "error" ? (
                                                                        <div className="line-clamp-1 text-red-500">
                                                                            ❌Error{" "}

                                                                        </div>
                                                                    ) : (
                                                                        <div className="line-clamp-1 text-green-400">
                                                                            ✅Completed{" "}
                                                                        </div>
                                                                    )}
                                                                </span>
                                                                <span className="text-gray-400">
                                                                    {x?.content?.toString()}
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
                                                        })()}
                                                    </div>
                                                </div>
                                            )
                                        }
                                    })} />


                            </div>


                        </div>
                    )
                } else if (x.role === "tool") {
                    return null;
                    return <div key={i}>
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
                }
            })}

        </div>
    );
};