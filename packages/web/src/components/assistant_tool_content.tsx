// React imports
import React, { useRef, useState } from "react";

// Ant Design imports
import {
    CheckSquareOutlined,
    CloseSquareOutlined,
    CopyOutlined,
    DownloadOutlined,
    EyeInvisibleOutlined,
    EyeOutlined,
    FileMarkdownOutlined,
    FileTextOutlined,
    IeOutlined,
    SyncOutlined,
    ThunderboltOutlined,
    ToolOutlined,
} from "@ant-design/icons";
import {
    Button,
    Collapse,
    message,
    Segmented,
    Space,
    Spin,
} from "antd";

// Third-party libraries
import MarkdownPreview from '@uiw/react-markdown-preview';
import { getCodeString } from 'rehype-rewrite';
import mermaid from "mermaid";
import katex from 'katex';
import 'katex/dist/katex.css';
import { v4 } from "uuid";

// Local imports
import { call, getURL_PRE } from "../common/call";
import { setClipboardText } from "../common/util";
import { sleep } from "../common/sleep";
import { isOnBrowser } from "../common/util";
import { t } from "../i18n";
import { MyMessage } from "../../../core/src/shared/data.mjs";
import { Pre } from "./pre";
import { DownImage } from "../pages/chat/component";

// Constants
const antdMessage = message;
const DEFAULT_WEBVIEW_SIZE = { x: "800px", y: "400px" };
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

// Types
interface ArtifactProps {
    url: string;
    type: string;
}

interface CodeProps {
    inline?: boolean;
    children?: any[];
    className?: string;
    node?: any;
    [key: string]: any;
}

interface KatexProps {
    children?: any;
    node?: any;
    [key: string]: any;
}

// Utility functions
const formatContent = (content: string): string => {
    content = content.replace(/\\\[(.+?)\\\]/gs, "$$" + "$1" + "$$");
    content = content.replace(/\\\((.+?)\\\)/g, "$$" + "$1" + "$$");
    return content;
};

const detectCodeLanguage = (className?: string, code?: string) => {
    if (!className) return { isHtml: false, isSvg: false, isMermaid: false, isHigh: false };
    
    const lower = className.toLowerCase();
    const isHtml = /^language-html/.test(lower);
    const isMermaid = /^language-mermaid/.test(lower);
    let isSvg = /^language-svg/.test(lower);
    isSvg = isSvg || (/^language-xml/.test(lower) && code?.includes("<svg"));
    const isHigh = /code-highlight/.test(lower);
    
    return { isHtml, isSvg, isMermaid, isHigh };
};

// KaTeX Renderer Component
const KatexRenderer: React.FC<KatexProps> = ({ children = [], ...props }) => {
    const regexs = [/\$(.+?)\$/gs];
    
    for (let regex of regexs) {
        if (typeof children === 'string' && regex.test(children)) {
            const html = (children as string).replace(regex, (s, replacer) => {
                return katex.renderToString(replacer, {
                    throwOnError: false,
                });
            });
            return React.createElement(props.node.tagName, {
                ...props.node.properties,
                dangerouslySetInnerHTML: { __html: html },
            });
        } else if (Array.isArray(children)) {
            const newChildren = children.map((child, i) => {
                if (typeof child === 'string' && regex.test(child)) {
                    return (
                        <span 
                            key={i} 
                            dangerouslySetInnerHTML={{
                                __html: child.replace(regex, (s, replacer) => {
                                    return katex.renderToString(replacer, {
                                        throwOnError: false,
                                    });
                                })
                            }}
                        />
                    );
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
};

// Artifact Component
const Artifact: React.FC<ArtifactProps> = React.memo(({ url, type }) => {
    const webviewRef = useRef<any>(null);
    const webviewError = useRef("");
    const [webviewXY, setWebviewXY] = useState(DEFAULT_WEBVIEW_SIZE);

    const handleWebviewLoad = async (element: any) => {
        try {
            await sleep(1000);
            const script = `
                var r;
                var res;
                if(document.body){
                    r = document.querySelector("html").getBoundingClientRect();
                } else {
                    r = document.firstChild.getBoundingClientRect();
                }
                res = { width: r.width, height: r.height };
            `;
            const res = await element.executeJavaScript(script);
            setWebviewXY({
                x: res.width + "px",
                y: res.height + "px",
            });
        } catch (e) {
            console.error("webview executeJavaScript fail: ", e);
        }
    };

    const handleIframeLoad = async (iframe: HTMLIFrameElement) => {
        await sleep(1000);
        const root = iframe.contentWindow?.document.querySelector("html") || 
                    iframe.contentWindow?.document.querySelector("svg");
        if (root) {
            const rect = root.getBoundingClientRect();
            console.log("iframe loaded", rect.width, rect.height);
            setWebviewXY({
                x: rect.width + "px",
                y: rect.height + "px",
            });
        }
    };

    return (
        <div>
            {!isOnBrowser ? (
                <>
                    <Space.Compact className="absolute right-0 bottom-8">
                        <Button
                            size="small"
                            onClick={() => webviewRef.current?.openDevTools()}
                        >
                            openDevTools
                        </Button>
                    </Space.Compact>
                    <webview
                        ref={(w) => {
                            if (w) {
                                webviewRef.current = w;
                                w.addEventListener("console-message", (e: any) => {
                                    if (e.level === 3) {
                                        webviewError.current += e.message + "\n";
                                    }
                                });
                                w.addEventListener("did-finish-load", () => handleWebviewLoad(w));
                            }
                        }}
                        src={url}
                        useragent={USER_AGENT}
                        style={{
                            height: webviewXY.y,
                            width: webviewXY.x,
                        }}
                    />
                </>
            ) : (
                <iframe
                    src={url}
                    ref={(r) => {
                        if (r) {
                            r.onload = () => handleIframeLoad(r);
                        }
                    }}
                    style={{
                        height: webviewXY.y,
                        width: webviewXY.x,
                    }}
                />
            )}
        </div>
    );
});

// Code Component
const Code: React.FC<CodeProps> = ({ inline, children = [], className, ...props }) => {
    const demoid = useRef(`dome${v4()}`);
    const code = props.node?.children ? getCodeString(props.node.children) : children[0] || '';
    const { isHtml, isSvg, isMermaid, isHigh } = detectCodeLanguage(className, code);
    const [artifact, setArtifact] = useState<JSX.Element | null>(null);

    const handlePreview = async () => {
        let filename = "";
        if (isHtml) {
            filename = await call("saveTempFile", { txt: code, ext: "html" });
        } else if (isSvg) {
            filename = await call("saveTempFile", { txt: code, ext: "svg" });
        } else if (isMermaid) {
            const str = await mermaid.render(demoid.current, code);
            filename = await call("saveTempFile", { txt: str.svg, ext: "svg" });
        }
        window.open(getURL_PRE() + "temp/" + filename);
    };

    const handleDownload = async () => {
        const a = document.createElement("a");
        if (isHtml) {
            a.href = URL.createObjectURL(new Blob([code], { type: "text/html" }));
            a.download = "code.html";
        } else if (isSvg) {
            a.href = URL.createObjectURL(new Blob([code], { type: "image/svg+xml" }));
            a.download = "code.svg";
        } else if (isMermaid) {
            const str = await mermaid.render(demoid.current, code);
            a.href = URL.createObjectURL(new Blob([str.svg], { type: "image/svg+xml" }));
            a.download = "code.svg";
        }
        a.click();
    };

    const handleToggleArtifact = async () => {
        if (artifact) {
            setArtifact(null);
        } else {
            let filename = "";
            if (isHtml) {
                filename = await call("saveTempFile", { txt: code, ext: "html" });
            } else if (isSvg) {
                filename = await call("saveTempFile", { txt: code, ext: "svg" });
            } else if (isMermaid) {
                const str = await mermaid.render(demoid.current, code);
                filename = await call("saveTempFile", { txt: str.svg, ext: "svg" });
            }
            setArtifact(<Artifact url={getURL_PRE() + "temp/" + filename} type="html" />);
        }
    };

    const handleCopy = async () => {
        await setClipboardText({ text: code });
        message.success(t`Copied to clipboard`);
    };

    return (
        <code className="relative">
            <span className="block absolute right-0 bottom-0">
                {isHigh && (isHtml || isSvg || isMermaid) && (
                    <span>
                        <Button onClick={handlePreview} icon={<IeOutlined />} />
                        <Button onClick={handleDownload} icon={<DownloadOutlined />} />
                        <Button 
                            onClick={handleToggleArtifact} 
                            icon={artifact ? <EyeInvisibleOutlined /> : <EyeOutlined />} 
                        />
                        <Button onClick={handleCopy} icon={<CopyOutlined />} />
                    </span>
                )}
            </span>
            {artifact || children}
        </code>
    );
};



// Main Component
export const AssistantToolContent = ({ contents }: { contents: MyMessage[] }) => {
    const [render, setRender] = useState("markdown");

    const renderSegments = [
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
    ];

    const katexComponents = {
        code: Code,
        p: KatexRenderer,
        h1: KatexRenderer,
        h2: KatexRenderer,
        h3: KatexRenderer,
        h4: KatexRenderer,
        h5: KatexRenderer,
        h6: KatexRenderer,
        li: KatexRenderer,
        ol: KatexRenderer,
        ul: KatexRenderer,
        menu: KatexRenderer,
    };

    const renderContent = (content: string, isSmall = false) => {
        if (render === "markdown") {
            return (
                <MarkdownPreview 
                    className={`markdown-body ${isSmall ? 'text-sm' : ''}`}
                    source={formatContent(content)}
                    components={katexComponents}
                />
            );
        } else if (render === "text") {
            return (
                <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                    {content}
                </pre>
            );
        }
        return null;
    };

    return (
        <div className="relative bg-white p-2" style={{ width: "100%", overflowX: "auto" }}>
            <Segmented
                size="small"
                value={render}
                onChange={setRender}
                options={renderSegments}
            />

            {contents.map((x, i) => {
                if (x.role !== "assistant") return null;
                
                x.content = x.content || "";
                
                return (
                    <div key={i}>
                        {/* Reasoning Content */}
                        {x.reasoning_content && (
                            <div className="my-collapse reasoning_content">
                                <Collapse
                                    expandIcon={() => <ThunderboltOutlined />}
                                    size="small"
                                    defaultActiveKey={x.content_status === "dataLoading" ? ["reasoning_content"] : undefined}
                                    items={[{
                                        key: "reasoning_content",
                                        label: (
                                            <div className="line-clamp-1">
                                                {t`thinking`}: {x.reasoning_content}
                                            </div>
                                        ),
                                        children: renderContent(x.reasoning_content.toString(), true)
                                    }]}
                                />
                            </div>
                        )}

                        {/* Main Content */}
                        {renderContent(x.content.toString())}

                        {/* Tool Calls */}
                        {x.content_tool_calls && x.content_tool_calls.length > 0 && (
                            <div className="my-collapse">
                                <Collapse
                                    bordered={false}
                                    size="small"
                                    expandIcon={() => <ToolOutlined />}
                                    items={x.content_tool_calls.map((tool: any, index) => {
                                        const toolResult = contents.find(j => j.tool_call_id === tool.id);
                                        
                                        return {
                                            key: index.toString(),
                                            label: (
                                                <Spin spinning={x.content_status === "loading"}>
                                                    <div className="flex items-center">
                                                        <div className="cursor-pointer">
                                                            <div className="line-clamp-1 text-blue-500">
                                                                <span className="text-purple-500">
                                                                    {tool.restore_name || tool.function.name}
                                                                </span>{" "}
                                                                {tool.function.arguments}
                                                            </div>
                                                        </div>
                                                        {toolResult && (
                                                            <div className="ml-2">
                                                                {toolResult.content_status === "loading" ? (
                                                                    <SyncOutlined spin />
                                                                ) : toolResult.content_status === "error" ? (
                                                                    <div className="line-clamp-1 text-red-500">
                                                                        <CloseSquareOutlined />
                                                                    </div>
                                                                ) : (
                                                                    <div className="line-clamp-1 text-green-600">
                                                                        <CheckSquareOutlined />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Spin>
                                            ),
                                            children: (
                                                <div className="max-h-80 overflow-auto bg-slate-200">
                                                    <div>
                                                        <Pre>
                                                            <CopyOutlined 
                                                                onClick={async () => {
                                                                    await setClipboardText({ text: tool.function.arguments });
                                                                    message.success(t`Copied to clipboard`);
                                                                }} 
                                                            />
                                                            {tool.function.arguments}
                                                        </Pre>
                                                    </div>
                                                    
                                                    {toolResult && (
                                                        <div>
                                                            <span>
                                                                {toolResult.content_status === "loading" ? (
                                                                    <SyncOutlined spin />
                                                                ) : toolResult.content_status === "error" ? (
                                                                    <div className="line-clamp-1 text-red-500">
                                                                        <CloseSquareOutlined />{t`Error`}
                                                                    </div>
                                                                ) : (
                                                                    <div className="line-clamp-1 text-green-600">
                                                                        <CheckSquareOutlined />{t`Completed`}
                                                                    </div>
                                                                )}
                                                            </span>
                                                            <span className="text-gray-400">
                                                                {Array.isArray(toolResult.content) ? 
                                                                    toolResult.content.map((c, i) => (
                                                                        <div key={i}>
                                                                            {c.type === "text" ? (
                                                                                <div>
                                                                                    <CopyOutlined 
                                                                                        onClick={async () => {
                                                                                            await setClipboardText({ text: c.text });
                                                                                            message.success(t`Copied to clipboard`);
                                                                                        }} 
                                                                                    />
                                                                                    {c.text}
                                                                                </div>
                                                                            ) : c.type === "image" ? (
                                                                                <DownImage src={`data:${c.mimeType};base64,${c.data}`} />
                                                                            ) : null}
                                                                        </div>
                                                                    )) : (
                                                                        <>
                                                                            <CopyOutlined 
                                                                                onClick={async () => {
                                                                                    await setClipboardText({ text: toolResult.content?.toString() });
                                                                                    message.success(t`Copied to clipboard`);
                                                                                }} 
                                                                            />
                                                                            {toolResult.content?.toString()}
                                                                        </>
                                                                    )
                                                                }
                                                            </span>
                                                            {toolResult.content_attachment?.length > 0 && 
                                                                toolResult.content_attachment.map((attachment, i) => (
                                                                    attachment.type === "image" ? (
                                                                        <DownImage 
                                                                            key={i}
                                                                            src={`data:${attachment.mimeType};base64,${attachment.data}`} 
                                                                        />
                                                                    ) : attachment.type === "text" ? (
                                                                        <Pre key={i}>{attachment.text}</Pre>
                                                                    ) : null
                                                                ))
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        };
                                    })}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};