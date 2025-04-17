import {
    CheckSquareOutlined,
    CloseSquareOutlined,
    CompressOutlined,
    CopyOutlined,
    DownloadOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    FileMarkdownOutlined,
    FileTextOutlined,
    FundViewOutlined,
    IeOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    ToolOutlined,
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
import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";

// import "github-markdown-css/github-markdown-light.css";
// import "../../public/katex/katex.min.css";
// import markdownit from "markdown-it";
// import mk from "@vscode/markdown-it-katex";

import MarkdownPreview from '@uiw/react-markdown-preview';
import { getCodeString } from 'rehype-rewrite';
import mermaid from "mermaid";
import katex from 'katex';
import 'katex/dist/katex.css';
// let webviewErrorValue = "";
import { call, getURL_PRE } from "../common/call";
// import hljs from "highlight.js"; // https://highlightjs.org
// import "highlight.js/styles/github.css";
import { v4 } from "uuid";
import { sleep } from "../common/sleep";
import { isOnBrowser } from "../common/util";
import { t } from "../i18n";
import { MyMessage } from "../common/openai";
import { Pre } from "./pre";
import { DownImage } from "../pages/chat/component";
import { Icon } from "./icon";


let katexR = ({ children = [],  ...props }) => {
    let regexs = [/\$(.+?)\$/gs];
    for (let regex of regexs) {
        if (typeof children === 'string' && regex.test(children)) {
            // console.log("p", children, className);
            const html = (children as string).replace(regex, (s, replacer) => {
                return katex.renderToString(replacer, {
                    throwOnError: false,
                })
            });
            return React.createElement(props.node.tagName, {
                ...props.node.properties,
                dangerouslySetInnerHTML: {
                    __html: html
                },
            });
        } else if (Array.isArray(children)) {
            const newChildren = children.map((child, i) => {
                if (typeof child === 'string' && regex.test(child)) {
                    return <span key={i} dangerouslySetInnerHTML={{
                        __html: child.replace(regex, (s, replacer) => {
                            return katex.renderToString(replacer, {
                                throwOnError: false,
                            })
                        })
                    }}></span>;
                } else {
                    return child;
                }

            });
            return React.createElement(props.node.tagName, {
                ...props.node.properties,
            }, newChildren);
        }
    }

    return React.createElement(props.node.tagName, {
        ...props.node.properties,
    }, children);

}

const IArtifact = (({ url, type }) => {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const webviewRef = useRef(null);
    const webviewError = useRef("");
    const [webviewXY, setWebviewXY] = React.useState({
        x: "800px",
        y: "400px",
    });
    return <div>
        {!isOnBrowser ? (
            <>
                <Space.Compact className="absolute right-0 bottom-8">
                    {/* <Button
                      size="small"
                      onClick={async () => {
                        let nativeImage = await webviewRef.current?.capturePage();
                        let imageUrl = nativeImage.toDataURL();
        
                        webviewRef.current.downloadURL(imageUrl);
                        // const link = document.createElement("a");
                        // link.href = imageUrl;
                        // link.download = "capture.png";
                        // document.body.appendChild(link);
                        // link.click();
                        // document.body.removeChild(link);
                      }}
                    >
                      capturePage
                    </Button> */}
                    <Button
                        size="small"
                        onClick={() => {
                            webviewRef.current?.openDevTools();
                        }}
                    >
                        openDevTools
                    </Button>
                </Space.Compact>
                <webview
                    ref={(w) => {
                        if (w) {
                            webviewRef.current = w;
                            w.addEventListener("console-message", (e: any) => {
                                // console.log("Guest page logged a message:", e.message);
                                if (e.level === 3) {
                                    // error
                                    webviewError.current =
                                        webviewError.current + e.message + "\n";

                                    refresh();
                                }
                            });
                            w.addEventListener("did-finish-load", async () => {
                                try {
                                    await sleep(1000);
                                    let res = await (w as any).executeJavaScript(
                                        `

        var r;
        var res
        if(document.body){
            r = document.querySelector("html").getBoundingClientRect();
        } else {
            r = document.firstChild.getBoundingClientRect();
        }
        res ={ width: r.width, height: r.height };`,
                                    );
                                    // console.log(res);
                                    setWebviewXY({
                                        x: res.width + "px",
                                        // x: webviewXY.x,
                                        y: res.height + "px",
                                    });
                                } catch (e) {
                                    console.error("webview executeJavaScript fail: ", e);
                                }
                            });
                        }
                    }}
                    src={
                        url
                    }
                    useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
                    // src="https://www.baidu.com"
                    // className="w-3/5"
                    style={{
                        height: webviewXY.y,
                        width: webviewXY.x,
                    }}
                ></webview>
            </>
        ) : (
            <iframe
                src={
                    url
                }
                ref={(r) => {
                    if (r) {
                        r.onload = async () => {
                            await sleep(1000);

                            let root: any = r.contentWindow.document.querySelector("html") || r.contentWindow.document.querySelector("svg");
                            let rect = root.getBoundingClientRect();
                            console.log("iframe loaded", rect.width, rect.height);
                            setWebviewXY({
                                x: rect.width + "px",
                                // x: webviewXY.x,
                                y: rect.height + "px",
                            });
                        }
                    }
                }}
                style={{
                    height: webviewXY.y,
                    width: webviewXY.x,
                }}
            ></iframe>
        )}
    </div >
})

const Artifact = React.memo(IArtifact);

const Code = ({ inline, children = [], className, ...props }) => {
    const demoid = useRef(`dome${v4()}`);
    const [container, setContainer] = useState(null);
    const isMermaid = className && /^language-mermaid/.test(className.toLocaleLowerCase());
    const code = props.node && props.node.children ? getCodeString(props.node.children) : children[0] || '';

    // const reRender = async () => {
    //     if (container && isMermaid) {
    //         try {
    //             const str = await mermaid.render(demoid.current, code);
    //             container.innerHTML = str.svg;
    //         } catch (error) {
    //             container.innerHTML = error;
    //         }
    //     }
    // }

    // useEffect(() => {
    //     reRender()
    // }, [container, isMermaid, code, demoid]);

    // const refElement = useCallback((node) => {
    //     if (node !== null) {
    //         setContainer(node);
    //     }
    // }, []);

    const isHtml = className && /^language-html/.test(className.toLocaleLowerCase());
    let isSvg = className && /^language-svg/.test(className.toLocaleLowerCase());
    isSvg = isSvg || className && /^language-xml/.test(className.toLocaleLowerCase()) && code.includes("<svg");
    const isHigh = className && /code-highlight/.test(className.toLocaleLowerCase());
    // console.log("Code", className, isHtml, isSvg);

    const [artifact, setArtifact] = useState(null as any);

    // if (isMermaid) {
    //     return (
    //         <Fragment>
    //             <code id={demoid.current} style={{ display: "none" }} />
    //             <code ref={refElement} data-name="mermaid" />
    //         </Fragment>
    //     );
    // }


    return <code className="relative">
        <span className="block absolute right-0 bottom-0">
            {isHigh && (isHtml || isSvg || isMermaid) && <span>
                <Button onClick={async () => {

                    let filename = ""
                    if (isHtml) {
                        filename = await call("saveTempFile", [{ txt: code, ext: "html" }]);
                    } else if (isSvg) {
                        filename = await call("saveTempFile", [{ txt: code, ext: "svg" }]);
                    } else if (isMermaid) {
                        const str = await mermaid.render(demoid.current, code);
                        filename = await call("saveTempFile", [{ txt: str.svg, ext: "svg" }]);
                    }
                    window.open(getURL_PRE() + "temp/" + filename);

                }} icon={<IeOutlined />} />
                <Button onClick={async () => {
                    let a = document.createElement("a");
                    if (isHtml) {
                        a.href = URL.createObjectURL(
                            new Blob([code], { type: "text/html" }),
                        );
                        a.download = "code.html";
                        a.click();
                    } else if (isSvg) {
                        a.href = URL.createObjectURL(
                            new Blob([code], { type: "image/svg+xml" }),
                        );
                        a.download = "code.svg";
                        a.click();
                    } else if (isMermaid) {
                        const str = await mermaid.render(demoid.current, code);
                        a.href = URL.createObjectURL(
                            new Blob([str.svg], { type: "image/svg+xml" }),
                        );
                        a.download = "code.svg";
                        a.click();
                    }
                }} icon={<DownloadOutlined />} />
                <Button onClick={async () => {
                    if (artifact) {
                        setArtifact(null);
                    } else {
                        let filename = ""
                        if (isHtml) {
                            filename = await call("saveTempFile", [{ txt: code, ext: "html" }]);
                        } else if (isSvg) {
                            filename = await call("saveTempFile", [{ txt: code, ext: "svg" }]);
                        } else if (isMermaid) {
                            const str = await mermaid.render(demoid.current, code);
                            filename = await call("saveTempFile", [{ txt: str.svg, ext: "svg" }]);
                        }
                        setArtifact(<Artifact url={getURL_PRE() + "temp/" + filename} type="html" />);
                    }
                }} icon={artifact ? <EyeInvisibleOutlined /> : <EyeOutlined />} /><Button onClick={async () => {
                    await call("setClipboardText", [code]);
                    message.success(t`Copied to clipboard`);
                }} icon={<CopyOutlined />} /></span>}
        </span>
        {artifact || children}
    </code>;
};

function format(content) {
    content = content.replace(/\\\[(.+?)\\\]/gs, "$$" + "$1" + "$$");
    content = content.replace(/\\\((.+?)\\\)/g, "$$" + "$1" + "$$");
    return content;
}


export const AssistantToolContent = ({ contents }: { contents: MyMessage[] }) => {
    // console.log("AssistantToolContent", contents);
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };

    const [render, setRender] = React.useState("markdown");
    // const extObj = useRef({} as any);

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
                // if (extObj.current[i] === undefined) {
                //     if (x.content_status === "dataLoading") {
                //         extObj.current[i] = "reasoning_content";
                //     }
                // }
                if (x.role === "assistant") {
                    x.content = x.content || "";
                    return (
                        <div key={i}>
                            <div className="my-collapse reasoning_content">
                                {x.reasoning_content && (
                                    <Collapse
                                        expandIcon={() => <ThunderboltOutlined />}
                                        size="small"
                                        defaultActiveKey={[x.content_status === "dataLoading" ? "reasoning_content" : undefined]}
                                        // activeKey={[extObj.current[i]]}
                                        // onChange={() => {
                                        //     extObj.current[i] = extObj.current[i] == null ? "reasoning_content" : null;
                                        //     refresh();
                                        // }}
                                        items={[
                                            {
                                                key: "reasoning_content",
                                                label: (
                                                    <div className="line-clamp-1">
                                                        {t`thinking`}: {x.reasoning_content}
                                                    </div>
                                                ),
                                                children: render == "markdown" ? (
                                                    <MarkdownPreview className="markdown-body text-sm" source={format(x.reasoning_content.toString())}
                                                        // disableCopy
                                                        components={{
                                                            code: Code,
                                                            p: katexR,

                                                            h1: katexR,
                                                            h2: katexR,
                                                            h3: katexR,
                                                            h4: katexR,
                                                            h5: katexR,
                                                            h6: katexR,
                                                            li: katexR,
                                                            ol: katexR,
                                                            ul: katexR,
                                                            menu: katexR,
                                                        }} />
                                                ) : render == "text" ? (
                                                    <pre
                                                        style={{
                                                            whiteSpace: "pre-wrap",
                                                            wordWrap: "break-word",
                                                        }}
                                                    >
                                                        {(x.reasoning_content.toString())}
                                                    </pre>
                                                ) : null
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                            {
                                render == "markdown" ? (
                                    <MarkdownPreview className="markdown-body" source={format(x.content.toString())}
                                        // disableCopy
                                        components={{
                                            code: Code,
                                            p: katexR,

                                            h1: katexR,
                                            h2: katexR,
                                            h3: katexR,
                                            h4: katexR,
                                            h5: katexR,
                                            h6: katexR,
                                            li: katexR,
                                            ol: katexR,
                                            ul: katexR,
                                            menu: katexR,
                                        }} />
                                ) : render == "text" ? (
                                    <pre
                                        style={{
                                            whiteSpace: "pre-wrap",
                                            wordWrap: "break-word",
                                        }}
                                    >
                                        {(x.content.toString())}
                                    </pre>
                                ) : null
                            }

                            <div className="my-collapse" style={{ display: x.tool_calls?.length > 0 ? "block" : "none" }}  >
                                <Collapse
                                    bordered={false}
                                    size="small"
                                    expandIcon={() => <ToolOutlined className="" />}
                                    items={x.tool_calls?.map((tool: any, index) => {
                                        if (x == null) {
                                            return null;
                                        }
                                        return {
                                            key: index.toString(),
                                            label: <Spin
                                                key={index}
                                                spinning={x.content_status == "loading"}
                                            >
                                                <div className="flex items-center">
                                                    <div
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="line-clamp-1 text-blue-500">
                                                            <span className="text-purple-500">
                                                                {tool.restore_name || tool.function.name}
                                                            </span>{" "}
                                                            {tool.function.arguments}
                                                        </div>
                                                    </div>
                                                    <a className="ml-2">
                                                        {(() => {

                                                            let x = contents.find(j => j.tool_call_id == tool.id);
                                                            if (x == null) {
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
                                                                            <CloseSquareOutlined />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="line-clamp-1 text-green-600">
                                                                            <CheckSquareOutlined />
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
                                                        <Pre><CopyOutlined onClick={async () => {
                                                            await call("setClipboardText", [tool.function.arguments]);
                                                            message.success(t`Copied to clipboard`);
                                                        }} />{tool.function.arguments}</Pre>
                                                    </div>

                                                    <div>
                                                        {(() => {

                                                            let x = contents.find(j => j.tool_call_id == tool.id);
                                                            if (x == null) {
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
                                                                            <CloseSquareOutlined />{t`Error`}{" "}

                                                                        </div>
                                                                    ) : (
                                                                        <div className="line-clamp-1 text-green-600">
                                                                            <CheckSquareOutlined />{t`Completed`}{" "}
                                                                        </div>
                                                                    )}
                                                                </span>
                                                                <span className="text-gray-400">
                                                                    <CopyOutlined onClick={async () => {
                                                                        await call("setClipboardText", [x?.content?.toString()]);
                                                                        message.success(t`Copied to clipboard`);
                                                                    }} /> {x?.content?.toString()}
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
                }
            })}

        </div>
    );
};