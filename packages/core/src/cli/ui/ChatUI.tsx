import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, Newline } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { t } from '../../i18n.mjs';
import type { MyMessage, CommonContent } from '@dadigua/hyperchat-shared/types';

// 收集的消息数据类型（模仿前端逻辑）
interface CollectedMessageData {
  type: "user" | "system" | "hyper_memory" | "assistant_group";
  messages: MyMessage[];
  index: number;
}

// 配置 marked 以使用终端渲染器
marked.setOptions({
  // @ts-ignore - marked-terminal 类型定义问题
  renderer: new TerminalRenderer()
});

// 辅助函数：渲染 Markdown 内容
const renderMarkdown = (content: string): string => {
  try {
    const result = marked(content);
    // 确保返回字符串类型
    return typeof result === 'string' ? result : content;
  } catch (error) {
    // 如果 Markdown 解析失败，返回原始文本
    return content;
  }
};

interface ChatUIProps {
  onUserInput: (input: string) => Promise<void>;
  onExit: () => void;
  messages?: MyMessage[]; // 外部传入的消息数据，优先使用
  workspaceInfo?: {
    path: string;
    agentCount: number;
    mcpClientsCount: number;
    totalToolsCount: number;
    currentAgent?: string;
    currentModel?: string;
    agentAllowedMCPs?: number;
    agentAvailableTools?: number;
    agentToolNames?: string[];
  };
}

// 辅助函数：将复杂内容转换为字符串
const renderContent = (content: string | CommonContent): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content.map(item => {
      if (item.type === 'text') {
        return item.text;
      } else if (item.type === 'image_url') {
        return '[Image]';
      }
      return '[' + (item as any).type + ']';
    }).join(' ');
  }
  return String(content);
};

export const ChatUI: React.FC<ChatUIProps> = ({ onUserInput, onExit, messages: externalMessages, workspaceInfo }) => {
  const [internalMessages, setInternalMessages] = useState<MyMessage[]>([]); // 内部消息状态
  const [forceUpdate, setForceUpdate] = useState(0); // 强制更新计数器
  
  // 优先使用外部传入的消息，如果没有则使用内部状态
  const messages = externalMessages || internalMessages;
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showInput, setShowInput] = useState(true);

  // 添加消息的方法（直接使用 MyMessage）
  const addMessage = (message: any) => {
    const fullMessage: MyMessage = {
      ...message,
      content: message.content || '',
      content_date: Date.now()
    };
    if (!externalMessages) {
      setInternalMessages(prev => [...prev, fullMessage]);
    }
    return fullMessage.content_date?.toString() || Date.now().toString();
  };

  // 更新最后一条消息
  const updateLastMessage = (updates: Partial<MyMessage>) => {
    if (!externalMessages) {
      setInternalMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0) {
          const lastMessage = newMessages[newMessages.length - 1];
          newMessages[newMessages.length - 1] = {
            ...lastMessage,
            ...updates
          } as MyMessage;
        }
        return newMessages;
      });
    }
  };

  // 处理用户输入
  const handleSubmit = async (userInput: string) => {
    const trimmedInput = userInput.trim();

    // 处理特殊命令
    if (trimmedInput === '/exit') {
      onExit();
      return;
    }

    if (trimmedInput === '/help') {
      const helpMessage: MyMessage = {
        role: 'system',
        content: `📋 ${t`Chat commands:`}
  /exit             - ${t`Exit chat`}
  /help             - ${t`Show help`}
  /clear            - ${t`Clear chat history`}
  /model            - ${t`Show current model`}
  /tools            - ${t`Show available MCP tools`}
  /toolinfo <name>  - ${t`Show detailed info for a specific tool`}`,
        content_date: Date.now()
      };
      if (!externalMessages) {
        setInternalMessages(prev => [...prev, helpMessage]);
      }
      return;
    }

    if (trimmedInput === '/clear') {
      if (!externalMessages) {
        setInternalMessages([]);
        const clearMessage: MyMessage = {
          role: 'system',
          content: `✅ ${t`Chat history cleared`}`,
          content_date: Date.now()
        };
        setInternalMessages([clearMessage]);
      }
      return;
    }

    if (trimmedInput === '/model') {
      const modelMessage: MyMessage = {
        role: 'system',
        content: `🤖 ${t`Current model:`} ${workspaceInfo?.currentModel || 'N/A'}`,
        content_date: Date.now()
      };
      if (!externalMessages) {
        setInternalMessages(prev => [...prev, modelMessage]);
      }
      return;
    }

    if (!trimmedInput) {
      return;
    }

    // 添加用户消息
    const userMessage: MyMessage = {
      role: 'user',
      content: trimmedInput,
      content_status: 'success',
      content_date: Date.now()
    };
    if (!externalMessages) {
      setInternalMessages(prev => [...prev, userMessage]);
    }

    // 开始思考状态
    setIsThinking(true);
    setShowInput(false);
    setInput('');

    try {
      await onUserInput(trimmedInput);
    } catch (error) {
      const errorMessage: MyMessage = {
        role: 'system',
        content: `❌ ${t`Error:`} ${error instanceof Error ? error.message : String(error)}`,
        content_date: Date.now()
      };
      if (!externalMessages) {
        setInternalMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsThinking(false);
      setShowInput(true);
    }
  };

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

        result.push({
          type: "assistant_group",
          messages: contents,
          index: i,
        });
      }
    }
    
    return result;
  };

  // 强制刷新函数
  const forceRefresh = () => {
    setForceUpdate(prev => prev + 1);
  };

  // 如果使用外部消息，对外暴露控制方法
  useEffect(() => {
    if (externalMessages) {
      // 只暴露状态控制方法，消息管理由外部处理
      (globalThis as any).__chatUI = {
        setThinking: setIsThinking,
        setShowInput,
        forceRefresh // 暴露强制刷新方法
      };
    } else {
      // 内部消息管理模式，暴露所有方法
      (globalThis as any).__chatUI = {
        addMessage,
        updateLastMessage,
        setThinking: setIsThinking,
        setShowInput,
        forceRefresh
      };
    }
  }, [externalMessages]);

  // 渲染消息组（模仿前端 CustomMessageList）
  const renderMessageGroup = (collectedData: CollectedMessageData) => {
    const { type, messages: msgList, index } = collectedData;
    
    if (type === "user" || type === "system" || type === "hyper_memory") {
      const message = msgList[0];
      if (!message) return null;
      
      const iconMap = {
        user: '🧑',
        system: '💻',
        hyper_memory: '🧠'
      };
      
      const colorMap = {
        user: 'blue' as const,
        system: 'yellow' as const,
        hyper_memory: 'magenta' as const
      };
      
      return (
        <Box key={`${type}-${index}`} flexDirection="column" marginBottom={1}>
          <Text color={colorMap[type]}>
            {iconMap[type]} {type === 'user' ? t`You:` : type === 'system' ? t`System:` : t`Memory:`} {renderContent(message.content)}
          </Text>
        </Box>
      );
    } else if (type === "assistant_group") {
      // 处理 assistant 和 tool 消息组
      return (
        <Box key={`assistant-group-${index}`} flexDirection="column" marginBottom={1}>
          {/* 只显示一次 AI 标签 */}
          <Text color="green">🤖 {t`AI:`}</Text>
          
          {msgList.map((message, msgIndex) => {
            if (message.role === 'assistant') {
              return (
                <Box key={`assistant-${msgIndex}`} flexDirection="column">
                  {/* 移除了重复的 AI: 标签 */}
                  
                  {/* 推理内容 */}
                  {message.reasoning_content && (
                    <Box marginLeft={2} marginBottom={1}>
                      <Text color="gray">💭 {t`thinking`}: {message.reasoning_content}</Text>
                    </Box>
                  )}
                  
                  {/* 工具调用 */}
                  {message.content_tool_calls && message.content_tool_calls.map((tool, toolIndex) => {
                    // 根据消息状态显示不同的工具调用状态
                    const getToolCallDisplay = () => {
                      switch (message.content_status) {
                        case 'loading':
                        case 'dataLoading':
                          return { icon: '🔄', color: 'blue' as const, text: t`Calling tool:` };
                        case 'success':
                        case 'dataLoadComplete':
                          return { icon: '🔧', color: 'cyan' as const, text: t`Called tool:` };
                        case 'error':
                          return { icon: '❌', color: 'red' as const, text: t`Tool call failed:` };
                        default:
                          return { icon: '🔧', color: 'cyan' as const, text: t`Calling tool:` };
                      }
                    };

                    const toolDisplay = getToolCallDisplay();
                    
                    // 查找对应的工具结果
                    const toolResult = msgList.find(msg => 
                      msg.role === 'tool' && msg.tool_call_id === tool.id
                    );
                    
                    return (
                      <Box key={`tool-call-${toolIndex}`} marginLeft={2} flexDirection="column">
                        <Text color={toolDisplay.color}>
                          {toolDisplay.icon} {toolDisplay.text} {tool.displayName || tool.originalName || tool.function.name}
                        </Text>
                        {tool.function.args && Object.keys(tool.function.args).length > 0 && (
                          <Text color="gray">  ({(() => {
                            const argsStr = JSON.stringify(tool.function.args, null, 0).replace(/\n\s*/g, ' ');
                            // 如果参数太长，截断显示
                            return argsStr.length > 100 ? argsStr.substring(0, 100) + '...' : argsStr;
                          })()})</Text>
                        )}
                        
                        {/* 工具结果状态 */}
                        {/* {toolResult && (
                          <Box marginLeft={2}>
                            {toolResult.content_status === 'loading' ? (
                              <Text color="blue">⏳ {t`Tool executing...`}</Text>
                            ) : toolResult.content_status === 'error' ? (
                              <Text color="red">❌ {t`Tool failed`}</Text>
                            ) : (
                              <Text color="green">✅ {t`Tool completed`}</Text>
                            )}
                          </Box>
                        )} */}
                      </Box>
                    );
                  })}
                  
                  {/* 工具调用和主要内容之间添加换行 */}
                  {message.content_tool_calls && message.content_tool_calls.length > 0 && message.content && (
                    <Newline />
                  )}
                  
                  {/* 主要内容 */}
                  {message.content && (
                    <Box marginLeft={2}>
                      <Text>{renderMarkdown(renderContent(message.content))}</Text>
                    </Box>
                  )}
                  
                  {/* 错误信息 */}
                  {message.content_status === 'error' && message.content_error && (
                    <Box marginLeft={2}>
                      <Text color="red">❌ {t`Error:`} {message.content_error}</Text>
                    </Box>
                  )}
                </Box>
              );
            } else if (message.role === 'tool') {
              // 工具结果消息（仅显示内容，状态已在工具调用中显示）
              const getToolStatusDisplay = () => {
                switch (message.content_status) {
                  case 'loading':
                    return { icon: '⏳', color: 'yellow' as const, text: t`Tool executing:` };
                  case 'success':
                    return { icon: '✅', color: 'green' as const, text: t`Tool result:` };
                  case 'error':
                    return { icon: '❌', color: 'red' as const, text: t`Tool error:` };
                  case 'dataLoading':
                    return { icon: '🔄', color: 'blue' as const, text: t`Tool loading:` };
                  case 'dataLoadComplete':
                    return { icon: '✅', color: 'green' as const, text: t`Tool completed:` };
                  default:
                    return { icon: '🔧', color: 'cyan' as const, text: t`Tool:` };
                }
              };

              const statusDisplay = getToolStatusDisplay();
              
              return (
                <Box key={`tool-result-${msgIndex}`} marginLeft={2} marginBottom={1} flexDirection="column">
                  <Text color={statusDisplay.color}>
                    {statusDisplay.icon} {statusDisplay.text} {message.tool_call_name || 'Tool'}
                  </Text>
                  {message.content && (
                    <Box marginLeft={2}>
                      <Text color="gray">
                        {(() => {
                          const content = renderContent(message.content);
                          return content.length > 200 ? content.substring(0, 200) + '...' : content;
                        })()}
                      </Text>
                    </Box>
                  )}
                </Box>
              );
            }
            return null;
          })}
        </Box>
      );
    }
    
    return null;
  };

  return (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single" borderColor="blue" padding={1} marginBottom={1}>
        <Box flexDirection="column">
          <Text color="blue" bold>🚀 HyperChat CLI</Text>
          {workspaceInfo && (
            <>
              <Text>📍 {t`Workspace:`} {workspaceInfo.path}</Text>
              {workspaceInfo.currentAgent && (
                <Text>🌐 {t`Current Agent:`} {workspaceInfo.currentAgent}</Text>
              )}
              {workspaceInfo.currentModel && (
                <Text>🤖 {t`Model:`} {workspaceInfo.currentModel}</Text>
              )}
              {workspaceInfo.agentAllowedMCPs !== undefined && (
                <Text>🛠️ {t`Agent allowed tools:`} {workspaceInfo.agentAllowedMCPs === 0 ? t`All available tools` : `${workspaceInfo.agentAllowedMCPs} configured, ${workspaceInfo.agentAvailableTools || 0} available`}</Text>
              )}
              {workspaceInfo.agentToolNames && workspaceInfo.agentToolNames.length > 0 && (
                <Text color="gray">    📋 {(() => {
                  const toolNames = workspaceInfo.agentToolNames!.slice(0, 3);
                  const more = workspaceInfo.agentToolNames!.length > 3 ? ` (+${workspaceInfo.agentToolNames!.length - 3} more)` : '';
                  return toolNames.join(', ') + more;
                })()}</Text>
              )}
            </>
          )}
          <Text color="gray">💡 {t`Type /exit to exit, /help for help`}</Text>
        </Box>
      </Box>

      {/* Messages */}
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {React.useMemo(() => {
          // 收集消息数据
          const collectedMessagesData = messages2collectMessages(messages);
          // 渲染消息组
          return collectedMessagesData.map((collectedData) =>
            renderMessageGroup(collectedData)
          ).filter(Boolean);
        }, [messages, forceUpdate])}

        {/* Thinking indicator */}
        {isThinking && (
          <Box>
            <Text color="gray">
              <Spinner type="dots" />
              {' '}{t`AI is thinking...`}
            </Text>
          </Box>
        )}
      </Box>

      {/* Input */}
      {showInput && (
        <Box borderStyle="single" borderColor="green" paddingX={1}>
          <Text color="green">🧑 {t`You:`} </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder={t`Type your message...`}
          />
        </Box>
      )}
    </Box>
  );
};

export default ChatUI;