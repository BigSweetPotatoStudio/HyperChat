// Ant Design 图标组件
import {
    CopyOutlined,
    DownloadOutlined,
    FileMarkdownOutlined,
    FileTextOutlined,
    FundViewOutlined,
    UploadOutlined,
} from "@ant-design/icons";

// Ant Design 基础组件
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

// Ant Design X 聊天组件（当前未使用，但保留以备将来使用）
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

// 保存 Ant Design 的 message 组件，避免命名冲突
const antdMessage = message;

// React 核心钩子
import React, { useCallback, useEffect, useRef, useState } from "react";

// Markdown 相关库
import markdownit from "markdown-it";
import mk from "@vscode/markdown-it-katex";

// 本地组件和工具
import { DownImage } from "./WorkspaceChatComponent/component";
import { Editor } from "./editor";
import { t } from "../i18n";
import { MyMessage } from "@hyperchat/shared/data";

/**
 * UserContent 组件的属性接口
 */
interface UserContentProps {
    /** 消息对象，包含消息内容和上下文信息 */
    x: MyMessage;
    /** 可选的消息重新生成回调函数 */
    regenerate?: () => void;
    /** 提交回调函数，当用户提交编辑内容时调用 */
    onSubmit: (content: string) => void;
    contexts: {
        [key: string]: { edit: boolean }
    }

    index: number;
}

/**
 * 用户内容显示组件
 * 
 * 该组件负责显示和编辑用户消息内容，支持：
 * - 文本内容的显示和编辑
 * - 图片内容的显示和预览
 * - 系统消息的实时编辑
 * - 多媒体内容的渲染
 * 
 * @param props - 组件属性
 * @returns React 组件
 */
export function UserContent({ x, regenerate = undefined, onSubmit, contexts, index }: UserContentProps) {
    // 状态管理
    /** 是否处于编辑模式 */
    const [isEdit, setIsEdit] = useState<boolean>(false);
    /** 编辑器中的当前值 */
    const [value, setValue] = useState<string>("");

    // DOM 引用
    /** 容器元素的引用，用于计算宽度 */
    const container = useRef<HTMLDivElement>(null);

    // 布局相关状态
    /** 编辑器的当前宽度 */
    const [width, setWidth] = useState<number>(0);
    /** 编辑器的最大宽度 */
    const [maxWidth, setMaxWidth] = useState<number>(0);
    // console.log(maxWidth)

    /**
     * 监听编辑状态变化的副作用
     * 当消息的编辑状态改变时：
     * 1. 计算容器的最大宽度
     * 2. 如果进入编辑模式，设置编辑器宽度和初始值
     * 3. 如果退出编辑模式，重置状态
     */
    useEffect(() => {
        // 计算最大宽度，基于父容器宽度减去边距
        setMaxWidth(container.current ? (container.current.parentElement!.parentElement!.parentElement!.offsetWidth - 60) : 500);

        if (contexts[index]?.edit) {
            // 进入编辑模式
            setWidth(container.current ? Math.min(container.current.offsetWidth + 50, maxWidth) : 500);

            // 设置编辑器的初始值
            if (Array.isArray(x.content)) {
                const firstContent = x.content?.[0];
                if (firstContent && firstContent.type === "text" && 'text' in firstContent) {
                    setValue(firstContent.text);
                }
            } else {
                setValue(x.content.toString());
            }
            setIsEdit(true);
        } else {
            // 退出编辑模式
            setIsEdit(false);
        }
    }, [contexts[index]?.edit, maxWidth]);

    /**
     * 处理编辑提交的函数
     * 重置消息状态并调用外部提交回调
     */
    const handleSubmit = useCallback(() => {
        x.content_sended = false;
        contexts[index]!.edit = false;
        setIsEdit(false);
        onSubmit(value);
    }, [value, onSubmit, x]);

    /**
     * 处理取消编辑的函数
     */
    const handleCancel = useCallback(() => {
        contexts[index]!.edit = false;
        setIsEdit(false);
    }, [x]);

    return (
        <div ref={container}>
            {/* 编辑模式：显示编辑器和操作按钮 */}
            {isEdit ? (
                <div>
                    <Editor
                        autoHeight
                        style={{
                            width: width + "px",
                            minWidth: 300,
                            border: "0px",
                            padding: "4px 0"
                        }}
                        value={x.content_template || x.content.toString()}
                        onChange={(e: string) => setValue(e)}
                        onSubmit={handleSubmit}
                    />
                    <Space.Compact>
                        <Button size="small" onClick={handleCancel}>
                            {t`Cancel`}
                        </Button>
                        <Button size="small" onClick={handleSubmit}>
                            {t`Submit`}
                        </Button>
                    </Space.Compact>
                </div>
            ) : (
                /* 系统消息且未发送：显示实时编辑器 */
                !x.content_sended && x.role === "system" && maxWidth > 0 ? (
                    <div>
                        <Editor
                            autoHeight
                            style={{
                                width: maxWidth + "px",
                                minWidth: 300,
                                border: "0px",
                                padding: "4px 0"
                            }}
                            value={x.content_template || x.content.toString()}
                            onChange={(e: string) => {
                                x.content_template = e;
                            }}
                        />
                    </div>
                ) : (
                    /* 普通显示模式：根据内容类型渲染 */
                    Array.isArray(x.content) ? (
                        /* 多媒体内容数组 */
                        x.content.map((c, i) => {
                            if (c.type === "text") {
                                return (
                                    <div key={i}>
                                        <pre
                                            style={{
                                                whiteSpace: "pre-wrap",
                                                wordWrap: "break-word",
                                            }}
                                        >
                                            {c.text.toString() || x.content_template}
                                        </pre>
                                        {/* 如果有多个内容项且这是第一个文本项，显示资源分隔符 */}
                                        {x.content.length > 1 && i === 0 && (
                                            <Divider plain>resources</Divider>
                                        )}
                                    </div>
                                );
                            } else if (c.type === "image_url") {
                                return (
                                    <DownImage
                                        onClick={() => {
                                            // 点击图片显示预览模态框
                                            Modal.info({
                                                width: "50%",
                                                title: "Tip",
                                                maskClosable: true,
                                                content: (
                                                    <div>
                                                        <img
                                                            className="bg-cover"
                                                            src={c.image_url.url as string}
                                                            alt="预览图片"
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
                                // 未知内容类型
                                return <span key={i}>unknown</span>;
                            }
                        })
                    ) : (
                        /* 纯文本内容 */
                        <pre
                            style={{
                                whiteSpace: "pre-wrap",
                                wordWrap: "break-word",
                            }}
                        >
                            {x.content.toString() || x.content_template}
                        </pre>
                    )
                )
            )}
        </div>
    );
}




