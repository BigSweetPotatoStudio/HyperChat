import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, Newline } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { t } from '../../i18n.mjs';
import type { MyMessage, CommonContent } from '@dadigua/hyperchat-shared/types';
import { fs } from 'zx';

// 收集的消息数据类型（模仿前端逻辑）
interface CollectedMessageData {
  type: "user" | "system" | "hyper_memory" | "assistant_group";
  messages: MyMessage[];
  index: number;
}

// 移除 ChatMessage 接口，直接使用 MyMessage

interface ChatUIProps {
  onUserInput: (input: string) => Promise<void>;
  onExit: () => void;
  workspaceInfo?: {
    path: string;
    agentCount: number;
    mcpClientsCount: number;
    totalToolsCount: number;
    currentAgent?: string;
    currentModel?: string;
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

export const ChatUI: React.FC<ChatUIProps> = ({ onUserInput, onExit, workspaceInfo }) => {
  const [messages, setMessages] = useState<MyMessage[]>([]); // 使用 MyMessage 类型
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const messageIdRef = useRef(0);

  // 添加消息的方法（直接使用 MyMessage）
  const addMessage = (message: any) => {
    const fullMessage: MyMessage = {
      ...message,
      content: message.content || '',
      content_date: Date.now()
    };
    setMessages(prev => [...prev, fullMessage]);
    return fullMessage.content_date?.toString() || Date.now().toString();
  };

  // 更新最后一条消息
  const updateLastMessage = (updates: Partial<MyMessage>) => {
    setMessages(prev => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1] = {
          ...newMessages[newMessages.length - 1],
          ...updates
        };
      }
      return newMessages;
    });
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
      setMessages(prev => [...prev, helpMessage]);
      return;
    }

    if (trimmedInput === '/clear') {
      setMessages([]);
      const clearMessage: MyMessage = {
        role: 'system',
        content: `✅ ${t`Chat history cleared`}`,
        content_date: Date.now()
      };
      setMessages([clearMessage]);
      return;
    }

    if (trimmedInput === '/model') {
      const modelMessage: MyMessage = {
        role: 'system',
        content: `🤖 ${t`Current model:`} ${workspaceInfo?.currentModel || 'N/A'}`,
        content_date: Date.now()
      };
      setMessages(prev => [...prev, modelMessage]);
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
    setMessages(prev => [...prev, userMessage]);

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
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
      setShowInput(true);
    }
  };

  // 消息收集逻辑（模仿前端）
  const collectMessageContents = (x: MyMessage, i: number, arr: MyMessage[]): CollectedMessageData | null => {
    x.content_attached = x.content_attached == null ? true : x.content_attached;

    if (x.role === "user" || x.role === "system" || x.role === "hyper_memory") {
      // 用户、系统、记忆消息直接返回单个消息
      return {
        type: x.role,
        messages: [x],
        index: i,
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

      return {
        type: "assistant_group",
        messages: contents,
        index: i,
      };
    }

    // 未知角色，返回null
    return null;
  };

  // 对外暴露的方法，用于从外部更新消息
  useEffect(() => {
    // 这里可以通过 ref 或其他方式暴露方法给父组件
    (globalThis as any).__chatUI = {
      addMessage,
      updateLastMessage,
      setThinking: setIsThinking,
      setShowInput
    };
  }, []);

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
                      <Box key={`tool-call-${toolIndex}`} marginLeft={2} marginBottom={1}>
                        <Text color={toolDisplay.color}>
                          {toolDisplay.icon} {toolDisplay.text} {tool.displayName || tool.originalName || tool.function.name}
                        </Text>
                        {tool.function.args && Object.keys(tool.function.args).length > 0 && (
                          <Text color="gray"> ({JSON.stringify(tool.function.args, null, 0).replace(/\n\s*/g, ' ')})</Text>
                        )}
                        
                        {/* 工具结果状态 */}
                        {toolResult && (
                          <Box marginLeft={2}>
                            {toolResult.content_status === 'loading' ? (
                              <Text color="blue">⏳ {t`Tool executing...`}</Text>
                            ) : toolResult.content_status === 'error' ? (
                              <Text color="red">❌ {t`Tool failed`}</Text>
                            ) : (
                              <Text color="green">✅ {t`Tool completed`}</Text>
                            )}
                          </Box>
                        )}
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
                      <Text>{renderContent(message.content)}</Text>
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
              <Text>👥 {t`Agents:`} {workspaceInfo.agentCount} | 🔧 {t`MCP Clients:`} {workspaceInfo.mcpClientsCount} | 🛠️ {t`Tools:`} {workspaceInfo.totalToolsCount}</Text>
              {workspaceInfo.currentAgent && (
                <Text>🌐 {t`Current Agent:`} {workspaceInfo.currentAgent}</Text>
              )}
              {workspaceInfo.currentModel && (
                <Text>🤖 {t`Model:`} {workspaceInfo.currentModel}</Text>
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
          const collectedMessagesData = messages.map((message, index) =>
            collectMessageContents(message, index, messages)
          ).filter(Boolean) as CollectedMessageData[];
          fs.writeFileSync('messages.json', JSON.stringify(collectedMessagesData, null, 2));
          // 渲染消息组
          return collectedMessagesData.map((collectedData) =>
            renderMessageGroup(collectedData)
          ).filter(Boolean);
        }, [messages])}

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