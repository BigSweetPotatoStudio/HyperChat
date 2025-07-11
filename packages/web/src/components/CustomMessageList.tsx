import React, { forwardRef, useImperativeHandle, useRef, useEffect, useMemo, useCallback } from 'react';
import { Avatar, Card, Space, Tooltip, message as antdmessage, Modal, Collapse } from 'antd';
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
  StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { MyMessage } from '@hyperchat/shared/types';
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

    useImperativeHandle(ref, () => ({
      nativeElement: containerRef.current,
      scrollTo: (options: ScrollToOptions): void => {
        containerRef.current?.scrollTo(options);
      }
    }));

    // 自动滚动逻辑
    useEffect(() => {
      if (status === "runing" && containerRef.current) {
        const timer = setInterval(() => {
          containerRef.current?.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }, 100);
        return () => clearInterval(timer);
      }
      return undefined; // 明确返回undefined
    }, [status]);

    // 第一步：收集和整理消息内容
    const collectMessageContents = (x: MyMessage, i: number, arr: MyMessage[]): CollectedMessageData | null => {
      x.content_attached = x.content_attached == null ? true : x.content_attached;

      if (x.role === "user" || x.role === "system" || x.role === "hyper_memory") {
        // 用户、系统、记忆消息直接返回单个消息
        return {
          type: x.role,
          messages: [x],
          index: i,
          usage: null,
        };
      } else if (x.role === "assistant" || x.role === "tool") {
        // assistant/tool 消息需要收集连续的消息
        // 检查是否是最后一个连续的assistant/tool消息
        if (i + 1 != arr.length && arr[i + 1] &&
          arr[i + 1]!.role !== "user" &&
          arr[i + 1]!.role !== "system" &&
          arr[i + 1]!.role !== "hyper_memory") {
          return null; // 不是最后一个，跳过
        }

        // 收集连续的assistant/tool消息
        let contents: MyMessage[] = [];
        let index = i;
        while (index >= 0) {
          const currentMsg = arr[index];
          if (!currentMsg || currentMsg.role === "user" || currentMsg.role === "system" || currentMsg.role === "hyper_memory") {
            break;
          }
          contents.push(currentMsg);
          index--;
        }
        contents = contents.reverse();

        // 计算token使用量
        let usage = {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        };

        for (let content of contents) {
          if (content.content_usage) {
            if (content.content_usage.prompt_tokens !== 0) {
              usage.prompt_tokens = content.content_usage.prompt_tokens;
            }
            if (content.content_usage.completion_tokens !== 0) {
              usage.completion_tokens = content.content_usage.completion_tokens;
            }
            if (content.content_usage.total_tokens !== 0) {
              usage.total_tokens = content.content_usage.total_tokens;
            }
          }
        }

        return {
          type: "assistant_group",
          messages: contents,
          index: i,
          usage,
        };
      }

      // 未知角色，返回null
      return null;
    };

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
                  x.content_template = content;
                  x.content_date = Date.now();
                  const userIndex = messages.findLastIndex((msg) => msg.role === "user");
                  if (userIndex > -1) {
                    onSumbit(messages.filter((_, index) => index <= userIndex));
                  }
                } else {
                  x.content_template = content;
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
              color: '#f56a00',
              backgroundColor: '#fde3cf',
            }}
          />
        );
      } else if (role === 'system') {
        return (
          <Avatar
            icon={<Icon name="system-copy" />}
            style={{
              color: '#f56a00',
              backgroundColor: '#fde3cf',
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
                if (message.role === 'user') {
                  message.content_date = Date.now();
                  onSumbit(messages.filter((_, i) => i <= index));
                } else if (message.role === 'assistant') {
                  onSumbit(messages.filter((_, i) => i < index));
                }
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

    // 第一步：收集所有消息的数据
    const collectedMessagesData = useMemo(() => {
      if (!messages) return [];
      return messages.map((message, index) =>
        collectMessageContents(message, index, messages)
      ).filter(Boolean) as CollectedMessageData[];
    }, [messages]);

    // 第二步：格式化并渲染所有UI消息
    const renderedMessages = useMemo(() => {
      return collectedMessagesData.map((collectedData) =>
        formatAndRenderUIMessage(collectedData)
      ).filter(Boolean);
    }, [collectedMessagesData, contexts, readOnly, onSumbit, onClone, onContextUpdate]);

    return (
      <div
        ref={containerRef}
        className={`custom-message-list ${className || ''}`}
        style={{
          height: messages?.length > 0 ? '100%' : 0,
          paddingRight: 4,
          overflowY: 'auto',
          ...style,
        }}
      >
        {renderedMessages}
      </div>
    );
  }
);

CustomMessageList.displayName = 'CustomMessageList';