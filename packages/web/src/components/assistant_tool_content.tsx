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
    Modal,
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
import Editor from '@monaco-editor/react';

// Local imports
import { call, getURL_PRE } from "../common/call";
import { setClipboardText } from "../common/util";
import { sleep } from "../common/sleep";
import { isOnBrowser } from "../common/util";
import { t } from "../i18n";
import { HyperChatCompletionTool, MyMessage } from "@dadigua/hyperchat-shared";


// Constants
const antdMessage = message;
const DEFAULT_WEBVIEW_SIZE = { x: "800px", y: "400px" };
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

// Types
interface ArtifactProps {
    url: string;
    type: string;
}

interface HtmlNode {
    tagName: string;
    properties?: Record<string, unknown>;
    children?: HtmlNode[];
}

interface CodeProps {
    inline?: boolean;
    children?: React.ReactNode[];
    className?: string;
    node?: HtmlNode;
    [key: string]: unknown;
}

interface KatexProps {
    children?: React.ReactNode;
    node?: HtmlNode;
    [key: string]: unknown;
}

interface WebviewElement extends HTMLElement {
    openDevTools?: () => void;
    executeJavaScript: (script: string) => Promise<{ width: number; height: number }>;
}

interface WebviewConsoleEvent extends Event {
    level: number;
    message: string;
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
    isSvg = isSvg || (/^language-xml/.test(lower) && Boolean(code?.includes("<svg")));
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
            return React.createElement(props.node?.tagName || 'div', {
                ...props.node?.properties,
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
            return React.createElement(props.node?.tagName || 'div', {
                ...props.node?.properties,
            }, newChildren);
        }
    }

    return React.createElement(props.node?.tagName || 'div', {
        ...props.node?.properties,
    }, children);
};

// Artifact Component
const Artifact: React.FC<ArtifactProps> = React.memo(({ url, type }) => {
    const webviewRef = useRef<WebviewElement | null>(null);
    const webviewError = useRef("");
    const [webviewXY, setWebviewXY] = useState(DEFAULT_WEBVIEW_SIZE);

    const handleWebviewLoad = async (element: WebviewElement) => {
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
                            onClick={() => webviewRef.current?.openDevTools?.()}
                        >
                            openDevTools
                        </Button>
                    </Space.Compact>
                    <webview
                        ref={(w) => {
                            if (w) {
                                webviewRef.current = w as unknown as WebviewElement;
                                w.addEventListener("console-message", (e: Event) => {
                                    const consoleEvent = e as WebviewConsoleEvent;
                                    if (consoleEvent.level === 3) {
                                        webviewError.current += consoleEvent.message + "\n";
                                    }
                                });
                                w.addEventListener("did-finish-load", () => handleWebviewLoad(w as unknown as WebviewElement));
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
    const code = props.node?.children ? getCodeString(props.node.children as any) : (children[0] as string) || '';
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
        window.open(getURL_PRE() + "/temp/" + filename);
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
            setArtifact(<Artifact url={getURL_PRE() + "/temp/" + filename} type="html" />);
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



// Content Renderer Component
interface ContentRendererProps {
    content: string;
    isSmall?: boolean;
    renderMode: "markdown" | "text";
    katexComponents: Record<string, any>;
}

const ContentRenderer: React.FC<ContentRendererProps> = React.memo(({
    content,
    isSmall = false,
    renderMode,
    katexComponents
}) => {
    const formattedContent = React.useMemo(() => formatContent(content), [content]);

    if (renderMode === "markdown") {
        return (
            <div className="compact-markdown">
                <MarkdownPreview
                    className={`markdown-body ${isSmall ? 'text-sm' : ''}`}
                    source={formattedContent}
                    components={katexComponents}
                />
            </div>
        );
    } else if (renderMode === "text") {
        return (
            <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                {content}
            </pre>
        );
    }
    return null;
}, (prevProps, nextProps) => {
    return prevProps.content === nextProps.content &&
        prevProps.isSmall === nextProps.isSmall &&
        prevProps.renderMode === nextProps.renderMode;
});

// Content Item Renderer Component
interface ContentItemProps {
    content: any;
    index: number;
}

const ContentItemRenderer: React.FC<ContentItemProps> = ({ content, index }) => {
    if (typeof content === 'string') {
        return (
            <div key={index} style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{t`Text Content`} #{index + 1}:</strong>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={async () => {
                            await setClipboardText({ text: content });
                            message.success(t`Copied to clipboard`);
                        }}
                    >
                        {t`Copy`}
                    </Button>
                </div>
                <div style={{ height: '200px', border: '1px solid #d9d9d9' }}>
                    <Editor
                        defaultLanguage="text"
                        value={content}
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 12,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                        }}
                    />
                </div>
            </div>
        );
    }

    if (typeof content === 'object' && content !== null) {
        if (content.type === 'text') {
            return (
                <div key={index} style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{t`Text Content`} #{index + 1}:</strong>
                        <Button
                            type="primary"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={async () => {
                                await setClipboardText({ text: content.text });
                                message.success(t`Copied to clipboard`);
                            }}
                        >
                            {t`Copy`}
                        </Button>
                    </div>
                    <div style={{ height: '200px', border: '1px solid #d9d9d9' }}>
                        <Editor
                            defaultLanguage="text"
                            value={content.text}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 12,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                            }}
                        />
                    </div>
                </div>
            );
        } else if (content.type === 'image_url') {
            return (
                <div key={index} style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>
                        <strong>{t`Image Content`} #{index + 1}:</strong>
                    </div>
                    <div style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                        <img
                            src={`data:${content.image_url.url}`}
                            alt={`Tool result image ${index + 1}`}
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                        />
                    </div>
                </div>
            );
        } else {
            // Other object types, show as JSON
            const jsonContent = JSON.stringify(content, null, 2);
            return (
                <div key={index} style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{t`Object Content`} #{index + 1}:</strong>
                        <Button
                            type="primary"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={async () => {
                                await setClipboardText({ text: jsonContent });
                                message.success(t`Copied to clipboard`);
                            }}
                        >
                            {t`Copy`}
                        </Button>
                    </div>
                    <div style={{ height: '200px', border: '1px solid #d9d9d9' }}>
                        <Editor
                            defaultLanguage="json"
                            value={jsonContent}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 12,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>
                </div>
            );
        }
    }

    // Fallback for other types
    const stringContent = String(content);
    return (
        <div key={index} style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{t`Content`} #{index + 1}:</strong>
                <Button
                    type="primary"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={async () => {
                        await setClipboardText({ text: stringContent });
                        message.success(t`Copied to clipboard`);
                    }}
                >
                    {t`Copy`}
                </Button>
            </div>
            <div style={{ height: '200px', border: '1px solid #d9d9d9' }}>
                <Editor
                    defaultLanguage="text"
                    value={stringContent}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                    }}
                />
            </div>
        </div>
    );
};

// Tool Data Modal Component
interface ToolDataModalProps {
    visible: boolean;
    onClose: () => void;
    toolArgs: any;
    toolResult: any;
    toolName: string;
}

const ToolDataModal: React.FC<ToolDataModalProps> = ({
    visible,
    onClose,
    toolArgs,
    toolResult,
    toolName
}) => {
    const handleCopyArgs = async () => {
        await setClipboardText({ text: JSON.stringify(toolArgs, null, 2) });
        message.success(t`Copied arguments to clipboard`);
    };

    const renderResult = () => {
        if (Array.isArray(toolResult)) {
            return toolResult.map((item, index) => (
                <ContentItemRenderer key={index} content={item} index={index} />
            ));
        } else {
            return <ContentItemRenderer content={toolResult} index={0} />;
        }
    };

    return (
        <Modal
            title={t`Tool Details:` + toolName}
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            height={600}
        >
            <div style={{ height: '70vh', overflowY: 'auto' }}>
                {/* Arguments Section */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong>{t`Arguments`}:</strong>
                        <Button
                            type="primary"
                            size="small"
                            icon={<CopyOutlined />}
                            onClick={handleCopyArgs}
                        >
                            {t`Copy`}
                        </Button>
                    </div>
                    <div style={{ height: '200px', border: '1px solid #d9d9d9' }}>
                        <Editor
                            defaultLanguage="json"
                            value={JSON.stringify(toolArgs, null, 2)}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 12,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>
                </div>

                {/* Result Section */}
                <div>
                    <div style={{ marginBottom: '16px' }}>
                        <strong>{t`Result`}:</strong>
                    </div>
                    {renderResult()}
                </div>
            </div>
        </Modal>
    );
};

// Main Component
interface AssistantToolContentProps {
    contents: MyMessage[];
}

export const AssistantToolContent: React.FC<AssistantToolContentProps> = ({ contents }) => {
    const [render, setRender] = useState<"markdown" | "text">("markdown");
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTool, setSelectedTool] = useState<{
        args: any;
        result: any;
        name: string;
    } | null>(null);

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

    // 添加紧凑的 Markdown 样式
    React.useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .compact-markdown .markdown-body {
                font-size: 14px !important;
                line-height: 1.2 !important;
            }
            .compact-markdown .markdown-body p {
                margin-bottom: 0.1em !important;
                margin-top: 0.1em !important;
            }
            .compact-markdown .markdown-body h1 {
                font-size: 1.5em !important;
                margin-top: 0.2em !important;
                margin-bottom: 0.1em !important;
            }
            .compact-markdown .markdown-body h2 {
                font-size: 1.3em !important;
                margin-top: 0.2em !important;
                margin-bottom: 0.1em !important;
            }
            .compact-markdown .markdown-body h3 {
                font-size: 1.15em !important;
                margin-top: 0.2em !important;
                margin-bottom: 0.1em !important;
            }
            .compact-markdown .markdown-body h4,
            .compact-markdown .markdown-body h5,
            .compact-markdown .markdown-body h6 {
                font-size: 1em !important;
                margin-top: 0.2em !important;
                margin-bottom: 0.1em !important;
            }
            .compact-markdown .markdown-body ul,
            .compact-markdown .markdown-body ol {
                margin-top: 0.1em !important;
                margin-bottom: 0.1em !important;
                padding-left: 1em !important;
            }
            .compact-markdown .markdown-body li {
                margin-bottom: 0 !important;
                margin-top: 0 !important;
            }
            .compact-markdown .markdown-body pre {
                margin-top: 0.15em !important;
                margin-bottom: 0.15em !important;
                padding: 0.2em !important;
                font-size: 13px !important;
            }
            .compact-markdown .markdown-body blockquote {
                margin-top: 0.15em !important;
                margin-bottom: 0.15em !important;
                padding-left: 0.5em !important;
            }
            .compact-markdown .markdown-body > *:first-child {
                margin-top: 0 !important;
            }
            .compact-markdown .markdown-body > *:last-child {
                margin-bottom: 0 !important;
            }
            .compact-markdown .markdown-body code {
                padding: 0.05em 0.1em !important;
                font-size: 0.9em !important;
            }
            .compact-markdown .markdown-body hr {
                margin: 0.3em 0 !important;
            }
            .compact-markdown .markdown-body table {
                margin: 0.15em 0 !important;
            }
            .compact-markdown .markdown-body br {
                content: "";
                display: block !important;
                margin-bottom: 0.2em !important;
            }
            .compact-markdown .markdown-body hr {
                height: 0 !important;
            } 
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const katexComponents = React.useMemo(() => ({
        code: Code as any,
        p: KatexRenderer as any,
        h1: KatexRenderer as any,
        h2: KatexRenderer as any,
        h3: KatexRenderer as any,
        h4: KatexRenderer as any,
        h5: KatexRenderer as any,
        h6: KatexRenderer as any,
        li: KatexRenderer as any,
        ol: KatexRenderer as any,
        ul: KatexRenderer as any,
        menu: KatexRenderer as any,
    }), []);

    return (
        <div className="relative bg-white p-2" style={{ width: "100%", overflowX: "auto" }}>
            <Segmented
                size="small"
                value={render}
                onChange={(value) => setRender(value as "markdown" | "text")}
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
                                    defaultActiveKey={x.content_status === "dataLoading" ? ["reasoning_content"] : []}
                                    items={[{
                                        key: "reasoning_content",
                                        label: (
                                            <div className="line-clamp-1 break-all" >
                                                {t`thinking`}: {x.reasoning_content}
                                            </div>
                                        ),
                                        children: (
                                            <ContentRenderer
                                                content={x.reasoning_content.toString()}
                                                isSmall={true}
                                                renderMode={render}
                                                katexComponents={katexComponents}
                                            />
                                        )
                                    }]}
                                />
                            </div>
                        )}

                        {/* Main Content */}
                        <ContentRenderer
                            content={x.content.toString()}
                            renderMode={render}
                            katexComponents={katexComponents}
                        />

                        {/* Tool Calls */}
                        {x.content_tool_calls && x.content_tool_calls.length > 0 && (
                            <div className="">
                                {x.content_tool_calls.map((tool, index) => {
                                    const toolResult = contents.find(j => j.tool_call_id === tool.id);
                                    // 分离 reason 和其他参数
                                    const { reason, ...argsShow } = (tool.function.args || {}) as any;

                                    return (
                                        <div key={index} className="mb-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                                            <Spin spinning={x.content_status === "loading"}>
                                                <div className="flex items-center flex-1" onClick={() => {
                                                    setSelectedTool({
                                                        args: tool.function.args,
                                                        result: toolResult?.content || '',
                                                        name: tool.displayName || tool.function.name
                                                    });
                                                    setModalVisible(true);
                                                }}>
                                                    <ToolOutlined className="mr-2 text-gray-500" />
                                                    <div className="cursor-pointer flex-1">
                                                        <div className="line-clamp-1 text-blue-500 break-all">
                                                            <span className="text-purple-500">
                                                                {tool.displayName || tool.function.name}
                                                            </span>
                                                            {reason && (
                                                                <span className="text-green-600 ml-2">
                                                                    {reason}
                                                                </span>
                                                            )}
                                                            {Object.keys(argsShow).length > 0 && (
                                                                <span className="ml-2">
                                                                    {(() => {
                                                                        const argsStr = JSON.stringify(argsShow, null, 0).replace(/\n\s*/g, ' ');
                                                                        // 如果参数太长，截断显示
                                                                        return argsStr.length > 200 ? argsStr.substring(0, 200) + '...' : argsStr;
                                                                    })()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {toolResult && (
                                                        <div className="ml-2 flex gap-1">

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

                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Tool Data Modal */}
            {selectedTool && (
                <ToolDataModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    toolArgs={selectedTool.args}
                    toolResult={selectedTool.result}
                    toolName={selectedTool.name}
                />
            )}
        </div>
    );
};