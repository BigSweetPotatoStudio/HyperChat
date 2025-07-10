import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Avatar, Card, Space, Tooltip, message as antdmessage, Modal, Collapse } from 'antd';
import {
  CopyOutlined,
  EditOutlined,
  BranchesOutlined,
  SyncOutlined,
  MinusCircleOutlined,
  UserOutlined,
  LoadingOutlined,
  UploadOutlined,
  DownloadOutlined,
  StockOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { MyMessage } from '../../../core/src/shared/types.mjs';
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

export interface CustomMessageListRef {
  nativeElement: HTMLDivElement | null;
  scrollTo: (options: ScrollToOptions) => void;
}

export const CustomMessageList = forwardRef<CustomMessageListRef, CustomMessageListProps>(
  ({ messages, onSumbit, readOnly, status, onClone, style, className, contexts, onContextUpdate }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      nativeElement: containerRef.current,
      scrollTo: (options: ScrollToOptions) => {
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
    }, [status]);

    // 格式化消息的函数，基于原有的format逻辑
    const formatMessage = (x: MyMessage, i: number, arr: MyMessage[]) => {
      x.content_attached = x.content_attached == null ? true : x.content_attached;

      let common = {
        className: {
          "no-attached": !(x.content_attached == true),
        } as any,
        role: x.role,
      };

      if (x.role == "user" || x.role == "system") {
        // MCP prompt 处理
        if (x.content_from) {
          return {
            ...common,
            key: i.toString(),
            placement: "end" as const,
            isUser: true,
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
                    size: (x.content as string).length,
                  }}
                />
              </div>
            ),
          };
        }

        return {
          ...common,
          key: i.toString(),
          placement: "end" as const,
          isUser: true,
          content: (
            <UserContent
              x={x}
              index={i}
              contexts={contexts || {}}
              onSubmit={(content) => {
                if (x.role == "system") {
                  x.content_template = content;
                  x.content_date = Date.now();
                  let userIndex = messages.findLastIndex((x) => x.role == "user");
                  if (userIndex > -1) {
                    onSumbit(messages.filter((x, index) => index <= userIndex));
                  }
                } else {
                  x.content_template = content;
                  x.content_date = Date.now();
                  onSumbit(messages.filter((x, index) => index <= i));
                }
              }}
            />
          ),
        };
      } else if (x.role === 'hyper_memory') {
        // 记忆消息特殊处理
        return {
          ...common,
          key: i.toString(),
          placement: "start" as const,
          isUser: false,
          isMemory: true,
          content: (
            <div className="memory-message">
              <div className="memory-header">
                <Icon name="memory" /> {t`Memory Summary`}
              </div>
              <div className="memory-content">
                {x.content}
              </div>
              {x.memory_key_points && (
                <div className="memory-points">
                  <div className="memory-points-title">{t`Key Points`}:</div>
                  <ul>
                    {x.memory_key_points.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
        };
      } else {
        // role == "assistant" || role == "tool"
        // 检查是否是最后一个连续的assistant/tool消息
        if (i + 1 != arr.length && arr[i + 1] && arr[i + 1]!.role != "user" && arr[i + 1]!.role != "system" && arr[i + 1]!.role != "hyper_memory") {
          return null; // 不是最后一个，跳过
        }

        // 收集连续的assistant/tool消息
        let contents: MyMessage[] = [];
        let index = i;
        while (index >= 0) {
          if (arr[index]!.role == "user" || arr[index]!.role == "system" || arr[index]!.role == "hyper_memory") {
            break;
          }
          contents.push(arr[index]!);
          index--;
        }
        contents = contents.reverse();

        // 计算token使用量
        let last_content_usage = {} as {
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
        };

        for (let content of contents) {
          if (content.content_usage) {
            if (content.content_usage.prompt_tokens != 0) {
              last_content_usage.prompt_tokens = content.content_usage.prompt_tokens;
            }
            if (content.content_usage.completion_tokens != 0) {
              last_content_usage.completion_tokens = content.content_usage.completion_tokens;
            }
            if (content.content_usage.total_tokens != 0) {
              last_content_usage.total_tokens = content.content_usage.total_tokens;
            }
          }
        }

        return {
          ...common,
          key: i,
          placement: "start" as const,
          isUser: false,
          contents,
          usage: last_content_usage,
          content: (
            <div>
              <AssistantToolContent contents={contents} />

              {x.content_status == "loading" ? (
                <SyncOutlined spin />
              ) : x.content_status == "error" ? (
                <div className="text-red-500">
                  {t`Here are the error messages: `}
                  <div className="text-red-700">{x.content_error}</div>
                </div>
              ) : null}

              {x.content_status == "dataLoading" && <LoadingOutlined className="text-blue-400" />}

              {x.content_attachment &&
                x.content_attachment.length > 0 &&
                x.content_attachment.map((attachment, idx) => {
                  if (attachment.type == "image") {
                    return (
                      <DownImage
                        key={idx}
                        src={`data:${attachment.mimeType};base64,${attachment.data}`}
                      />
                    );
                  } else if (attachment.type == "text") {
                    return <Pre key={idx}>{attachment.text}</Pre>;
                  }
                  return null;
                })}
            </div>
          ),
        };
      }
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
            icon={<Icon name="memory" />}
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
    const getMessageActions = (message: MyMessage, index: number, formattedMessage: any) => {
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
        );
      }

      // 同步按钮
      if (message.content_attached && !readOnly) {
        actions.push(
          <SyncOutlined
            key="sync"
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
    const getTokenUsage = (usage: any) => {
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

    // 渲染单个消息
    const renderMessage = (message: MyMessage, index: number) => {
      const formattedMessage = formatMessage(message, index, messages);

      if (!formattedMessage) return null; // 被跳过的消息

      const isUser = formattedMessage.isUser;
      const isAttached = message.content_attached !== false;

      return (
        <div
          key={formattedMessage.key}
          className={`message-item ${isUser ? 'message-user' : 'message-assistant'} ${!isAttached ? 'message-not-attached' : ''
            }`}
        >
          <div className="message-avatar">
            {getMessageAvatar(message.role)}
          </div>
          <div className="message-body">
            <Card
              size="small"
              className={`message-card ${message.role}`}
            >
              <div className="message-content">
                {formattedMessage.content}
              </div>
              <div className="message-footer">
                <div className="flex flex-wrap justify-between text-xs">
                  <Space>
                    {getMessageActions(message, index, formattedMessage)}
                  </Space>
                  <Space>
                    {message.content_date && (
                      <span>
                        {dayjs(message.content_date).format("YYYY-MM-DD HH:mm:ss")}
                      </span>
                    )}
                    {getTokenUsage(formattedMessage.usage)}
                  </Space>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    };

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
        {messages?.map(renderMessage)}
      </div>
    );
  }
);

CustomMessageList.displayName = 'CustomMessageList';