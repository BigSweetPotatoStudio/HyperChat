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

// const md = markdownit({
//     html: true,
//     breaks: true,

//     highlight: function (str, lang) {
//         let fnName = "copy" + v4().replaceAll("-", "");
//         window[fnName] = async () => {
//             await call("setClipboardText", [str]);
//             message.success(t`Copied to clipboard`);
//         };
//         if (lang && hljs.getLanguage(lang)) {
//             try {
//                 return (
//                     `<div class="my-highlight" style="position:relative;padding:0px;" ><span onclick="${fnName}()" style="position:absolute;bottom:0px;left:0px;" role="img" aria-label="copy" tabindex="-1" class="anticon anticon-copy cursor-pointer"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></span><code class="hljs">` +
//                     hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
//                     "</code></div>"
//                 );
//             } catch (__) { }
//         }

//         return (
//             `<div class="my-highlight" style="position:relative;padding:0px;" ><span onclick="${fnName}()" style="position:absolute;bottom:0px;left:0px;" role="img" aria-label="copy" tabindex="-1" class="anticon anticon-copy cursor-pointer"><svg viewBox="64 64 896 896" focusable="false" data-icon="copy" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M832 64H296c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h496v688c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V96c0-17.7-14.3-32-32-32zM704 192H192c-17.7 0-32 14.3-32 32v530.7c0 8.5 3.4 16.6 9.4 22.6l173.3 173.3c2.2 2.2 4.7 4 7.4 5.5v1.9h4.2c3.5 1.3 7.2 2 11 2H704c17.7 0 32-14.3 32-32V224c0-17.7-14.3-32-32-32zM350 856.2L263.9 770H350v86.2zM664 888H414V746c0-22.1-17.9-40-40-40H232V264h432v624z"></path></svg></span><code class="hljs" >` +
//             md.utils.escapeHtml(str) +
//             "</code></div>"
//         );
//     },
// });
// md.use(mk);

// function render(content) {
//     content = content.replace(/\\\[(.+?)\\\]/gs, "$$" + "$1" + "$$");
//     content = content.replace(/\\\((.+?)\\\)/g, "$$" + "$1" + "$$");
//     return md.render(content);
// }

// function IRenderMarkdown(props) {
//     return (
//         <div
//             className="markdown-body text-sm lg:text-base"
//             dangerouslySetInnerHTML={{ __html: render(props.children) }}
//         />
//     );
// }
// const RenderMarkdown = React.memo(IRenderMarkdown);

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



let katexR = ({ children = [], className, ...props }) => {

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
                dangerouslySetInnerHTML: {
                    __html: html
                },
                className: String(className),
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
                className: String(className),
            }, newChildren);
        }
    }

    return React.createElement(props.node.tagName, {
        className: String(className),
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
                                    <MarkdownPreview className="markdown-body" source={format(x.content.toString())}
                                        // disableCopy
                                        components={{
                                            code: Code,
                                            p: katexR,
                                            li: katexR,
                                            h1: katexR,
                                            h2: katexR,
                                            h3: katexR,
                                            h4: katexR,
                                            h5: katexR,
                                            h6: katexR,
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
                                    items={x.tool_calls?.map((tool: any, index) => {
                                        return {
                                            key: index.toString(),
                                            showArrow: false,
                                            label: <Spin
                                                key={index}
                                                spinning={x.content_status == "loading"}
                                            >
                                                <div className="flex items-center">
                                                    <div
                                                        className="cursor-pointer"
                                                    >
                                                        <div className="line-clamp-1 text-blue-500">
                                                            <ToolOutlined className="" />
                                                            <span className="text-purple-500">
                                                                {tool.restore_name || tool.function.name}
                                                            </span>{" "}
                                                            {tool.function.arguments}
                                                        </div>
                                                    </div>
                                                    <a className="ml-2">
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