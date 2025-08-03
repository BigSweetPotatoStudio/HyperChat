import React, { forwardRef, useImperativeHandle, useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Avatar, Card, Space, Tooltip, message as antdmessage, Modal, Collapse, FloatButton, Button } from 'antd';
import {
  CopyOutlined,
  EditOutlined,
  BranchesOutlined,
  SyncOutlined,
  ReloadOutlined,
  MinusCircleOutlined,
  UserOutlined,
  LoadingOutlined,
  UploadOutlined,
  DownloadOutlined,
  StockOutlined,
  DatabaseOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  VerticalAlignBottomOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { MyMessage } from '@dadigua/hyperchat-shared/types';
import { setClipboardText } from '../common/util';
import { t } from '../i18n';
import { Icon } from './icon';
import { Pre } from './pre';
import { AssistantToolContent } from './assistant_tool_content';
import { UserContent } from './user_content';
import { DownImage } from './WorkspaceChatComponent/component';
import { Attachments } from '@ant-design/x';
import './CustomMessageList.css';

interface CustomMessageListProps {
  messages: MyMessage[];
  onSumbit: (messages: MyMessage[]) => void;
  readOnly?: boolean;
  status?: string;
  onClone?: (index: number) => void;
  style?: React.CSSProperties;
  className?: string;
  contexts?: { [key: string]: { edit: boolean } };
  onContextUpdate?: () => void;
}

// 收集的消息数据类型
interface CollectedMessageData {
  type: "user" | "system" | "hyper_memory" | "assistant_group";
  messages: MyMessage[];
  index: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
}

export interface CustomMessageListRef {
  nativeElement: HTMLDivElement | null;
  scrollTo: (options: ScrollToOptions) => void;
}

export const CustomMessageList = forwardRef<CustomMessageListRef, CustomMessageListProps>(
  ({ messages, onSumbit, readOnly, status, onClone, style, className, contexts, onContextUpdate }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const autoScrollEnabledRef = useRef(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useImperativeHandle(ref, () => ({
      nativeElement: containerRef.current,
      scrollTo: (options: ScrollToOptions): void => {
        containerRef.current?.scrollTo(options);
      }
    }));

    // 检测是否是AI回复开始，重新启用自动滚动
    useEffect(() => {
      if (status === "runing" && !autoScrollEnabledRef.current) {
        autoScrollEnabledRef.current = true;
      }
    }, [status]);

    // 自动滚动逻辑
    useEffect(() => {
      if (status === "runing" && autoScrollEnabledRef.current && containerRef.current) {
        // 显示取消滚动按钮
        setShowScrollButton(true);

        const timer = setInterval(() => {
          if (containerRef.current && autoScrollEnabledRef.current) {
            containerRef.current.scrollTo({
              top: containerRef.current.scrollHeight,
              behavior: 'smooth'
            });
          }
        }, 100);

        scrollIntervalRef.current = timer;
        return () => {
          clearInterval(timer);
          scrollIntervalRef.current = null;
        };
      } else {
        // 隐藏取消滚动按钮
        if (status !== "runing") {
          setShowScrollButton(false);
        }

        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
          scrollIntervalRef.current = null;
        }
      }
      return undefined;
    }, [status]);

    // 取消自动滚动
    const handleCancelAutoScroll = useCallback(() => {
      autoScrollEnabledRef.current = false;
      setShowScrollButton(false);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }, []);


    // 清理函数：当组件卸载时清理定时器
    useEffect(() => {
      return () => {
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
      };
    }, []);


    // 第二步：格式化UI消息并渲染
    const formatAndRenderUIMessage = (collectedData: CollectedMessageData): React.ReactNode => {
      const { type, messages: msgList, index: i, usage } = collectedData;
      const x = msgList[msgList.length - 1]; // 取最后一个消息作为主消息

      if (!x) return null; // 确保消息存在

      const isUser = type === "user" || type === "system";
      const isAttached = x.content_attached !== false;

      let messageContent: React.ReactNode = null;

      if (type === "user" || type === "system") {
        // MCP prompt 处理
        if (x.content_from) {
          messageContent = (
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
                  size: (x.content as string).length,
                }}
              />
            </div>
          );
        } else {
          messageContent = (
            <UserContent
              x={x}
              index={i}
              contexts={contexts || {}}
              onSubmit={(content) => {
                if (x.role === "system") {
                  x.content = content;
                  x.content_date = Date.now();
                  const userIndex = messages.findLastIndex((msg) => msg.role === "user");
                  if (userIndex > -1) {
                    onSumbit(messages.filter((_, index) => index <= userIndex));
                  }
                } else {
                  x.content = content;
                  x.content_date = Date.now();
                  onSumbit(messages.filter((_, index) => index <= i));
                }
              }}
            />
          );
        }
      } else if (type === "hyper_memory") {
        // 为记忆消息添加类型检查
        const memoryMessage = x as MyMessage & { memory_key_points?: string[] };
        const memoryContent = typeof x.content === 'string' ? x.content : JSON.stringify(x.content);

        messageContent = (
          <div className="my-collapse memory-content">
            <Collapse
              expandIcon={() => <DatabaseOutlined />}
              size="small"
              defaultActiveKey={[]}
              items={[{
                key: "memory_content",
                label: (
                  <div className="line-clamp-1">
                    {t`Memory Summary`}: {memoryContent}
                  </div>
                ),
                children: (
                  <div>
                    <div className="memory-content-detail">
                      {memoryContent}
                    </div>
                    {memoryMessage.memory_key_points && memoryMessage.memory_key_points.length > 0 && (
                      <div className="memory-points">
                        <div className="memory-points-title">
                          <BankOutlined style={{ marginRight: 6, color: '#722ed1' }} />
                          {t`Key Points`}:
                        </div>
                        <ul className="memory-points-list">
                          {memoryMessage.memory_key_points.map((point: string, idx: number) => (
                            <li key={idx} className="memory-point-item">{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              }]}
            />
          </div>
        );
      } else if (type === "assistant_group") {
        messageContent = (
          <div>
            <AssistantToolContent contents={msgList} />
            {x.content_status === "error" && (
              <div className="text-red-500">
                {t`Here are the error messages: `}
                <div className="text-red-700">{x.content_error}</div>
              </div>
            )}
          </div>
        );
      }

      if (!messageContent) return null;

      // 直接返回渲染的UI组件
      return (
        <div
          key={i.toString()}
          className={`message-item ${isUser ? 'message-user' : 'message-assistant'} ${!isAttached ? 'message-not-attached' : ''}`}
        >
          <div className="message-avatar">
            {getMessageAvatar(x.role)}
          </div>
          <div className="message-body">
            <Card
              size="small"
              className={`message-card ${x.role}`}
            >
              <div className="message-content">
                {messageContent}
              </div>
              <div className="message-footer">
                {/* 状态和附件显示 */}
                <div className="message-status-attachments">
                  {getMessageAttachments(x)}
                </div>
                <div className="flex flex-wrap justify-between text-xs w-full">
                  <Space>
                    {getMessageActions(x, i, { isUser, contents: msgList, usage })}
                  </Space>
                  <Space>
                    {getMessageStatus(x)}
                    {x.content_date && (
                      <span>
                        {dayjs(x.content_date).format("YYYY-MM-DD HH:mm:ss")}
                      </span>
                    )}
                    {getTokenUsage(usage)}
                  </Space>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    };

    // 获取消息头像
    const getMessageAvatar = (role: string) => {
      if (role === 'user') {
        return (
          <Avatar
            icon={<UserOutlined />}
            style={{
              color: '#1890ff',
              backgroundColor: '#e6f7ff',
            }}
          />
        );
      } else if (role === 'system') {
        return (
          <Avatar
            icon={<Icon name="system-copy" />}
            style={{
              color: '#1890ff',
              backgroundColor: '#e6f7ff',
            }}
          />
        );
      } else if (role === 'hyper_memory') {
        return (
          <Avatar
            icon={<DatabaseOutlined />}
            style={{
              color: '#fff',
              backgroundColor: '#722ed1',
            }}
          />
        );
      } else {
        return (
          <Avatar
            icon={<Icon name="bx-bot" />}
            style={{
              color: '#fff',
              backgroundColor: '#87d068',
            }}
          />
        );
      }
    };

    // 获取消息操作按钮
    const getMessageActions = (message: MyMessage, index: number, _messageData: { isUser: boolean; contents: MyMessage[]; usage: any }) => {
      const actions: any[] = [];

      // 复制按钮
      actions.push(
        <CopyOutlined
          key="copy"
          className="hover:text-cyan-400 cursor-pointer"
          onClick={async () => {
            const text = Array.isArray(message.content)
              ? (message.content[0] as any)?.text || ''
              : message.content?.toString() || '';
            await setClipboardText({ text });
            antdmessage.success(t`Copied to clipboard`);
          }}
        />
      );

      // 克隆按钮
      if (message.role === 'user' || message.role === 'assistant') {
        actions.push(
          <Tooltip key="clone" title="Clone">
            <BranchesOutlined
              className="hover:text-cyan-400 cursor-pointer"
              onClick={() => onClone?.(index)}
            />
          </Tooltip>
        );
      }

      // 编辑按钮
      if (!readOnly && (message.role === 'user' || message.role === 'system')) {
        actions.push(
          <Tooltip key="edit" title={t`Edit`}>
            <EditOutlined
              key="edit"
              className="hover:text-cyan-400 cursor-pointer"
              onClick={() => {
                if (!contexts) return;
                if (contexts[index] == null) {
                  contexts[index] = { edit: false };
                }
                contexts[index]!.edit = !contexts[index]!.edit;
                onContextUpdate?.();
              }}
            />
          </Tooltip>
        );
      }

      // 重试按钮
      if (message.content_attached && !readOnly && message.role !== "hyper_memory") {
        actions.push(
          <Tooltip key="retry" title={t`Retry`}>
            <ReloadOutlined
              className="hover:text-cyan-400 cursor-pointer"
              onClick={() => {
                let lastUserToolIndex = messages.findLastIndex((msg, i) => i <= index && (msg.role === 'user' || msg.role === 'tool'));
                onSumbit(messages.filter((_, i) => i <= lastUserToolIndex));
              }}
            />
          </Tooltip>
        );
      }

      // 清除标识
      if (message.content_attached === false) {
        actions.push(
          <Tooltip key="cleared" title="Cleared">
            <MinusCircleOutlined className="cursor-not-allowed" />
          </Tooltip>
        );
      }

      return actions;
    };

    // 获取Token使用量显示
    const getTokenUsage = (usage: CollectedMessageData['usage']) => {
      if (!usage) return null;

      const usageElements: any[] = [];

      if (usage.prompt_tokens) {
        usageElements.push(
          <Tooltip key="prompt" title="prompt_tokens">
            <UploadOutlined />{usage.prompt_tokens}
          </Tooltip>
        );
      }

      if (usage.completion_tokens) {
        usageElements.push(
          <Tooltip key="completion" title="completion_tokens">
            <DownloadOutlined />{usage.completion_tokens}
          </Tooltip>
        );
      }

      if (usage.total_tokens) {
        usageElements.push(
          <Tooltip key="total" title="total_tokens">
            <StockOutlined />{usage.total_tokens}
          </Tooltip>
        );
      }

      return usageElements.length > 0 ? usageElements : null;
    };

    // 获取消息状态显示
    const getMessageStatus = useCallback((message: MyMessage) => {
      if (!message.content_status) {
        return null;
      }

      // 各种状态的处理
      switch (message.content_status) {
        case "loading":
          return (
            <Tooltip key="loading" title={t`Processing...`}>
              <SyncOutlined className="text-blue-400" spin />
            </Tooltip>
          );

        case "dataLoading":
          return (
            <Tooltip key="dataLoading" title={t`Loading data...`}>
              <LoadingOutlined className="text-blue-600" />
            </Tooltip>
          );

        case "error":
          return (
            <Tooltip key="error" title={message.content_error || t`Error occurred`}>
              <CloseCircleOutlined className="text-red-500" />
            </Tooltip>
          );

        case "success":
          return (
            <Tooltip key="success" title={t`Completed successfully`}>
              <CheckCircleOutlined className="text-green-600" />
            </Tooltip>
          );

        case "dataLoadComplete": // 数据加载完成
          return (
            <Tooltip key="dataLoadComplete" title={t`Data load complete`}>
              <CheckCircleOutlined className="text-green-600" />
            </Tooltip>
          );
        default:
          return null;
      }
    }, []);

    // 获取消息附件显示
    const getMessageAttachments = useCallback((message: MyMessage) => {
      if (!message.content_attachment || message.content_attachment.length === 0) {
        return null;
      }

      return message.content_attachment.map((attachment, idx) => {
        if (attachment.type === "image") {
          return (
            <DownImage
              key={idx}
              src={`data:${attachment.mimeType};base64,${attachment.data}`}
            />
          );
        } else if (attachment.type === "text") {
          return <Pre key={idx}>{attachment.text}</Pre>;
        }
        return null;
      });
    }, []);

    // 将消息数组转换为收集的消息数据
    const messages2collectMessages = (messageList: MyMessage[]): CollectedMessageData[] => {
      if (!messageList?.length) return [];

      const result: CollectedMessageData[] = [];
      const isUserLikeRole = (role: string) => role === "user" || role === "system" || role === "hyper_memory";
      const isAssistantLikeRole = (role: string) => role === "assistant" || role === "tool";

      for (let i = 0; i < messageList.length; i++) {
        const message = messageList[i];
        // 确保 content_attached 有默认值
        message.content_attached = message.content_attached ?? true;

        if (isUserLikeRole(message.role)) {
          // 用户类消息直接添加
          result.push({
            type: message.role as "user" | "system" | "hyper_memory",
            messages: [message],
            index: i,
            usage: null,
          });
        } else if (isAssistantLikeRole(message.role)) {
          // 检查是否是连续assistant/tool消息组的最后一个
          const nextMessage = messageList[i + 1];
          if (nextMessage && isAssistantLikeRole(nextMessage.role)) {
            continue; // 不是最后一个，跳过
          }

          // 向前收集连续的assistant/tool消息
          const contents: MyMessage[] = [];
          for (let j = i; j >= 0 && isAssistantLikeRole(messageList[j].role); j--) {
            contents.unshift(messageList[j]); // 使用unshift避免后续reverse
          }

          // 计算总token使用量
          const usage = contents.reduce((acc, msg) => {
            if (msg.content_usage) {
              return {
                prompt_tokens: msg.content_usage.prompt_tokens || acc.prompt_tokens,
                completion_tokens: msg.content_usage.completion_tokens || acc.completion_tokens,
                total_tokens: msg.content_usage.total_tokens || acc.total_tokens,
              };
            }
            return acc;
          }, { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });

          result.push({
            type: "assistant_group",
            messages: contents,
            index: i,
            usage,
          });
        }
      }

      return result;
    };

    // 第一步：收集所有消息的数据
    const collectedMessagesData = useMemo(() => {
      return messages2collectMessages(messages);
    }, [messages]);

    // 第二步：格式化并渲染所有UI消息
    const renderedMessages = useMemo(() => {
      // console.log(collectedMessagesData, 'collectedMessagesData');
      return collectedMessagesData.map((collectedData) =>
        formatAndRenderUIMessage(collectedData)
      ).filter(Boolean);
    }, [collectedMessagesData, contexts, readOnly, onSumbit, onClone, onContextUpdate]);

    return (
      <div
        ref={containerRef}
        className={`custom-message-list ${className || ''}`}
        style={{
          height: '100%',
          paddingRight: 4,
          overflowY: 'auto',
          position: 'relative',
          ...style,
        }}
      >
        {renderedMessages}
        <div className='w-full flex justify-end' style={{
          visibility: showScrollButton ? 'visible' : 'hidden',
          position: 'sticky',
          bottom: 0,
          right: 0,
          zIndex: 1000,
        }}>
          <Button
            icon={<StopOutlined />}
            title={t`Cancel auto scroll`}
            // style={{
            //   display: showScrollButton ? 'block' : 'none',
            //   position: 'sticky',
            //   bottom: 16,
            //   right: 16,
            //   zIndex: 1000,
            // }}
            onClick={handleCancelAutoScroll}
          />
        </div>

      </div>
    );
  }
);

CustomMessageList.displayName = 'CustomMessageList';