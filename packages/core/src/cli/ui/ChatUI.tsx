import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { t } from '../../i18n.mjs';
import type { MyMessage, CommonContent, ChatHistoryItem } from '@dadigua/hyperchat-shared/types';
import chalk from 'chalk';
import ChatLogSelector from './ChatLogSelector.js';

// 收集的消息数据类型（模仿前端逻辑）
interface CollectedMessageData {
  type: "user" | "system" | "hyper_memory" | "assistant_group";
  messages: MyMessage[];
  index: number;
}

// 配置 marked 以使用终端渲染器
marked.setOptions({
  // @ts-ignore - marked-terminal 类型定义问题
  renderer: new TerminalRenderer({})
});

// 辅助函数：渲染 Markdown 内容
const renderMarkdown = (content: string): string => {
  try {
    const result = marked(content);
    // 确保返回字符串类型，并移除末尾的换行符
    const markdown = typeof result === 'string' ? result : content;
    return markdown.replace(/\n+$/, ''); // 移除末尾的换行符
  } catch (error) {
    // 如果 Markdown 解析失败，返回原始文本
    return content;
  }
};

interface ChatUIProps {
  onUserInput: (input: string) => Promise<void>;
  onExit: () => void;
  onCancel?: () => void; // 新增取消回调
  onChatLogSelect?: (chatLogKey: string) => Promise<void>; // 聊天记录选择回调
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

export const ChatUI: React.FC<ChatUIProps> = ({ onUserInput, onExit, onCancel, onChatLogSelect, messages: externalMessages, workspaceInfo }) => {
  // 所有 hooks 必须在组件顶部，在任何条件返回之前
  const [forceUpdate, setForceUpdate] = useState(0); // 强制更新计数器
  const [systemMessages, setSystemMessages] = useState<MyMessage[]>([]); // UI系统消息
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false); // 取消状态
  
  // 输入历史相关状态
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalInput, setOriginalInput] = useState(''); // 保存用户正在输入的内容
  
  // 可用命令列表（包含描述）
  const availableCommands = [
    { command: '/resume', description: t`Resume previous chat log` },
    { command: '/help', description: t`Show help` },
    { command: '/clear', description: t`Clear chat history` },
    { command: '/model', description: t`Show current model` },
    { command: '/tools', description: t`Show available MCP tools` },
    { command: '/toolinfo', description: t`Show detailed info for a specific tool` },
    { command: '/exit', description: t`Exit chat` },
  ];
  
  // 候选框相关状态
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(availableCommands);
  
  // 自动补全功能
  const handleAutoComplete = (currentInput: string): string => {
    // 移除末尾空格进行匹配
    const trimmedInput = currentInput.trimEnd();
    
    if (!trimmedInput.startsWith('/')) return currentInput;
    
    const matches = availableCommands.filter(cmd => cmd.command.startsWith(trimmedInput));
    if (matches.length === 1) {
      return matches[0].command;
    } else if (matches.length > 1) {
      // 找到最长公共前缀
      let commonPrefix = matches[0].command;
      for (const match of matches.slice(1)) {
        let i = 0;
        while (i < commonPrefix.length && i < match.command.length && commonPrefix[i] === match.command[i]) {
          i++;
        }
        commonPrefix = commonPrefix.slice(0, i);
      }
      return commonPrefix;
    }
    return currentInput;
  };
  
  // 历史记录导航
  const navigateHistory = (direction: 'up' | 'down') => {
    if (inputHistory.length === 0) return;
    
    if (direction === 'up') {
      if (historyIndex === -1) {
        // 第一次按上箭头，保存当前输入并显示最新历史
        setOriginalInput(input);
        setHistoryIndex(inputHistory.length - 1);
        setInput(inputHistory[inputHistory.length - 1]);
      } else if (historyIndex > 0) {
        // 继续向上浏览历史
        setHistoryIndex(historyIndex - 1);
        setInput(inputHistory[historyIndex - 1]);
      }
    } else { // down
      if (historyIndex !== -1) {
        if (historyIndex < inputHistory.length - 1) {
          // 向下浏览历史
          setHistoryIndex(historyIndex + 1);
          setInput(inputHistory[historyIndex + 1]);
        } else {
          // 回到原始输入
          setHistoryIndex(-1);
          setInput(originalInput);
        }
      }
    }
  };
  
  // 添加到历史记录
  const addToHistory = (inputText: string) => {
    if (inputText.trim() && !inputHistory.includes(inputText)) {
      const newHistory = [...inputHistory, inputText];
      // 保持历史记录在合理数量内
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      setInputHistory(newHistory);
    }
    // 重置历史导航状态
    setHistoryIndex(-1);
    setOriginalInput('');
  };
  
  // 更新候选框
  const updateSuggestions = (inputValue: string) => {
    // 移除末尾空格进行匹配
    const trimmedInput = inputValue.trimEnd();
    
    if (trimmedInput.startsWith('/')) {
      const filtered = availableCommands.filter(cmd => 
        cmd.command.startsWith(trimmedInput)
      ).slice(0, 8); // 默认显示8条
      
      setFilteredCommands(filtered);
      setShowSuggestions(filtered.length > 0);
      setSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
      setFilteredCommands([]);
    }
  };
  
  // 候选框导航
  const navigateSuggestions = (direction: 'up' | 'down') => {
    if (!showSuggestions || filteredCommands.length === 0) return;
    
    if (direction === 'up') {
      setSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else {
      setSuggestionIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    }
  };
  
  // 选择候选命令
  const selectSuggestion = () => {
    if (showSuggestions && filteredCommands[suggestionIndex]) {
      const selectedCommand = filteredCommands[suggestionIndex].command;
      // 为所有命令添加空格，简化逻辑，光标自然会在末尾
      const finalInput = selectedCommand + ' ';
      setInput(finalInput);
      setShowSuggestions(false);
      return true;
    }
    return false;
  };
  
  // 聊天记录选择状态
  const [showChatLogSelector, setShowChatLogSelector] = useState(false);
  const [chatLogs, setChatLogs] = useState<ChatHistoryItem[]>([]);
  const [loadingChatLogs, setLoadingChatLogs] = useState(false);

  // AI消息来自外部，UI系统消息来自内部状态
  const messages = externalMessages || [];

  // 处理取消请求
  const handleCancel = async () => {
    if (!isThinking || isCancelling || !onCancel) return;
    
    setIsCancelling(true);
    try {
      await onCancel();
      // 添加取消消息到系统消息
      const cancelMessage: MyMessage = {
        role: 'system',
        content: `🚫 ${t`AI request cancelled by user`}`,
        content_date: Date.now()
      };
      setSystemMessages(prev => [...prev, cancelMessage]);
    } catch (error) {
      // 取消可能失败，但不需要显示错误
    } finally {
      setIsCancelling(false);
      setIsThinking(false);
      setShowInput(true);
    }
  };

  // 处理自定义键盘交互的输入状态（预留功能）
  // const [customInputMode, setCustomInputMode] = useState(false);
  
  // 处理输入变化时的自动补全提示
  const handleInputChange = (newInput: string) => {
    setInput(newInput);
    // 如果用户正在浏览历史，则重置历史状态
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setOriginalInput('');
    }
    // 更新候选框
    updateSuggestions(newInput);
  };
  
  // 监听键盘输入
  useInput((inputChar, key) => {
    if (key.escape) {
      handleCancel();
      return;
    }
    
    // 只在显示输入框且不在其他模式时处理快速输入
    if (showInput && !showChatLogSelector && !isThinking) {
      // 候选框优先处理
      if (showSuggestions) {
        if (key.upArrow) {
          navigateSuggestions('up');
          return;
        }
        
        if (key.downArrow) {
          navigateSuggestions('down');
          return;
        }
        
        // Enter 键处理移到 handleSubmit 中
        
        if (key.escape) {
          setShowSuggestions(false);
          return;
        }
      } else {
        // 历史记录导航（只在没有候选框时）
        if (key.upArrow) {
          navigateHistory('up');
          return;
        }
        
        if (key.downArrow) {
          navigateHistory('down');
          return;
        }
      }
      
      if (key.tab) {
        const completed = handleAutoComplete(input);
        
        // 为所有补全的命令添加空格，简化逻辑
        let finalInput = completed;
        if (completed !== input && completed.startsWith('/') && !completed.endsWith(' ')) {
          finalInput = completed + ' ';
        }
        
        // 只有当有变化时才更新
        if (finalInput !== input) {
          setInput(finalInput);
          updateSuggestions(finalInput);
        }
        return;
      }
      
      // 快捷键支持
      if (key.ctrl) {
        switch (inputChar) {
          case 'h': // Ctrl+H: 显示帮助
            handleSubmit('/help');
            return;
          case 'c': // Ctrl+C: 清空输入
            setInput('');
            setHistoryIndex(-1);
            setOriginalInput('');
            return;
          case 'r': // Ctrl+R: 恢复聊天记录
            handleSubmit('/resume');
            return;
          case 'l': // Ctrl+L: 清空聊天历史
            handleSubmit('/clear');
            return;
        }
      }
      
      // 更多Ctrl快捷键
      if (key.ctrl && inputChar === 'm') { // Ctrl+M: 显示模型信息
        handleSubmit('/model');
        return;
      }
    }
  });

  // 添加系统消息的方法
  const addSystemMessage = (content: string) => {
    const systemMessage: MyMessage = {
      role: 'system',
      content,
      content_date: Date.now()
    };
    setSystemMessages(prev => [...prev, systemMessage]);
  };

  // 获取当前 agent 的聊天记录
  const loadChatLogs = async () => {
    if (!workspaceInfo?.currentAgent) {
      addSystemMessage(`❌ ${t`No current agent available`}`);
      return;
    }

    setLoadingChatLogs(true);
    try {
      // 通过全局对象获取聊天记录（由外部提供）
      const chatLogsFetcher = (globalThis as any).__getChatLogs;
      if (!chatLogsFetcher) {
        addSystemMessage(`❌ ${t`Chat logs fetcher not available`}`);
        return;
      }

      const result = await chatLogsFetcher(workspaceInfo.currentAgent);
      if (result && result.chatLogs) {
        setChatLogs(result.chatLogs);
        setShowChatLogSelector(true);
        setShowInput(false);
      } else {
        addSystemMessage(`📝 ${t`No chat logs found for agent`} ${workspaceInfo.currentAgent}`);
      }
    } catch (error) {
      addSystemMessage(`❌ ${t`Failed to load chat logs:`} ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingChatLogs(false);
    }
  };

  // 处理聊天记录选择
  const handleChatLogSelect = async (chatLog: ChatHistoryItem) => {
    setShowChatLogSelector(false);
    setShowInput(true);
    
    if (onChatLogSelect) {
      try {
        await onChatLogSelect(chatLog.key);
        addSystemMessage(`✅ ${t`Resumed chat:`} ${chatLog.label}`);
      } catch (error) {
        addSystemMessage(`❌ ${t`Failed to resume chat:`} ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  // 取消聊天记录选择
  const handleChatLogCancel = () => {
    setShowChatLogSelector(false);
    setShowInput(true);
    addSystemMessage(`🚫 ${t`Chat log selection cancelled`}`);
  };

  // 处理用户输入
  const handleSubmit = async (userInput: string) => {
    // 如果候选框正在显示，则选择当前候选项而不是提交
    if (showSuggestions && filteredCommands.length > 0) {
      selectSuggestion();
      return; // 不提交，只是选择候选项
    }
    
    const trimmedInput = userInput.trim();
    
    // 关闭候选框
    setShowSuggestions(false);
    
    // 添加到历史记录（除了空输入）
    if (trimmedInput) {
      addToHistory(trimmedInput);
    }

    // 处理特殊命令
    if (trimmedInput === '/exit') {
      onExit();
      return;
    }

    if (trimmedInput === '/help') {
      const helpContent = `📋 ${t`Chat commands:`}
  /exit             - ${t`Exit chat`}
  /help             - ${t`Show help`}
  /clear            - ${t`Clear chat history`}
  /model            - ${t`Show current model`}
  /resume           - ${t`Resume previous chat log`}
  /tools            - ${t`Show available MCP tools`}
  /toolinfo <name>  - ${t`Show detailed info for a specific tool`}

⌨️  ${t`Keyboard shortcuts:`}
  Esc               - ${t`Cancel current AI request`}
  ↑/↓               - ${t`Navigate input history`}
  Tab               - ${t`Auto-complete commands`}
  Ctrl+H            - ${t`Show help`}
  Ctrl+C            - ${t`Clear current input`}
  Ctrl+R            - ${t`Resume chat log`}
  Ctrl+L            - ${t`Clear chat history`}
  Ctrl+M            - ${t`Show current model`}

🚀 ${t`Quick input features:`}
  • ${t`Command suggestions appear when typing "/"`}
  • ${t`Navigate suggestions with ↑↓, select with Enter`}
  • ${t`Command auto-completion with Tab key`}
  • ${t`Input history navigation with arrow keys`}
  • ${t`History stores up to 50 recent commands`}
  • ${t`Quick access shortcuts for common commands`}`;
      addSystemMessage(helpContent);
      return;
    }

    if (trimmedInput === '/clear') {
      // 清空系统消息（AI消息由外部管理，这里不清理）
      setSystemMessages([]);
      addSystemMessage(`✅ ${t`Chat history cleared`}`);
      return;
    }

    if (trimmedInput === '/model') {
      addSystemMessage(`🤖 ${t`Current model:`} ${workspaceInfo?.currentModel || 'N/A'}`);
      return;
    }

    if (trimmedInput === '/resume') {
      if (loadingChatLogs) {
        addSystemMessage(`⏳ ${t`Loading chat logs, please wait...`}`);
        return;
      }
      await loadChatLogs();
      return;
    }

    if (!trimmedInput) {
      return;
    }

    // 用户消息不在这里添加，由外部的 handleUserInput 处理

    // 开始思考状态
    setIsThinking(true);
    setShowInput(false);
    setInput('');

    try {
      await onUserInput(trimmedInput);
    } catch (error) {
      // addSystemMessage(`❌ ${t`Error:`} ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsThinking(false);
      setShowInput(true);
    }
  };

  // 合并AI消息和系统消息
  const allMessages = [...messages, ...systemMessages].sort((a, b) => (a.content_date || 0) - (b.content_date || 0));

  // 强制刷新函数
  const forceRefresh = () => {
    setForceUpdate(prev => prev + 1);
  };

  // 暴露控制方法给外部
  useEffect(() => {
    (globalThis as any).__chatUI = {
      setThinking: setIsThinking,
      setShowInput,
      forceRefresh
    };
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
        <Box key={`assistant-group-${index}`} flexDirection="column" marginBottom={1} borderStyle="single" borderColor="blue" borderBottom={true}>
          {/* 只显示一次 AI 标签 */}
          <Text color="green">🤖 {t`AI:`}</Text>

          {msgList.map((message, msgIndex) => {
            if (message.role === 'assistant') {
              return (
                <Box key={`assistant-${msgIndex}`} flexDirection="column">
                  {/* 移除了重复的 AI: 标签 */}

                  {/* 推理内容 */}
                  {message.reasoning_content && (
                    <Box marginLeft={2} marginBottom={0}>
                      <Text color="gray">💭 {t`thinking`}: {message.reasoning_content}</Text>
                    </Box>
                  )}

                  {/* 主要内容 */}
                  {message.content && (
                    <Box marginLeft={2}>
                      <Text>{renderMarkdown(renderContent(message.content))}</Text>
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

                    return (
                      <Box key={`tool-call-${toolIndex}`} marginLeft={2} flexDirection="column" marginTop={0} marginBottom={0}>
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
                <Box key={`tool-result-${msgIndex}`} marginLeft={2} flexDirection="column">
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


  // 条件渲染，不使用提前返回
  let content;

  if (showChatLogSelector) {
    content = (
      <Box flexDirection="column" height="100%">
        <ChatLogSelector
          chatLogs={chatLogs}
          onSelect={handleChatLogSelect}
          onCancel={handleChatLogCancel}
        />
      </Box>
    );
  } else if (loadingChatLogs) {
    content = (
      <Box flexDirection="column" height="100%" justifyContent="center" alignItems="center">
        <Box borderStyle="single" borderColor="blue" padding={2}>
          <Text color="blue">
            <Spinner type="dots" />
            {' '}{t`Loading chat logs...`}
          </Text>
        </Box>
      </Box>
    );
  } else {
    content = (
    <Box flexDirection="column" height="100%">
      {/* Header */}
      <Box borderStyle="single"  padding={1} marginBottom={1}>
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
          <Text color="gray">💡 {t`Type "/" for commands, Ctrl+H for help | ↑↓: navigate, Tab: complete, Enter: select, Esc: cancel`}</Text>
        </Box>
      </Box>

      {/* Messages */}
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {(() => {
          // 收集消息数据
          const collectedMessagesData = messages2collectMessages(allMessages);
          // 渲染消息组
          return collectedMessagesData.map((collectedData) =>
            renderMessageGroup(collectedData)
          ).filter(Boolean);
        })()}

        {/* Thinking indicator */}
        {isThinking && (
          <Box>
            <Text color={isCancelling ? "yellow" : "gray"}>
              <Spinner type="dots" />
              {' '}{isCancelling ? t`Cancelling AI request...` : t`AI is thinking...`}
              {isThinking && !isCancelling && (
                <Text color="gray" dimColor> {t`(Press Esc to cancel)`}</Text>
              )}
            </Text>
          </Box>
        )}
      </Box>

      {/* Input */}
      {showInput && (
        <Box flexDirection="column">
          <Box borderStyle="single" borderColor="green" paddingX={1}>
            <Text color="green">🧑 {t`You:`} </Text>
            <TextInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              placeholder={t`Type your message... (↑↓: history, Tab: complete)`}
            />
          </Box>
          
          {/* 候选框 */}
          {showSuggestions && filteredCommands.length > 0 && (
            <Box 
              borderStyle="single" 
              borderColor="cyan" 
              marginTop={0}
              paddingX={1}
              flexDirection="column"
            >
              <Text color="cyan" bold>📋 {t`Command suggestions:`}</Text>
              {filteredCommands.map((cmd, index) => (
                <Box key={cmd.command} marginY={0}>
                  <Text 
                    color={index === suggestionIndex ? "black" : "white"}
                    backgroundColor={index === suggestionIndex ? "cyan" : undefined}
                    bold={index === suggestionIndex}
                  >
                    {index === suggestionIndex ? '► ' : '  '}
                    {cmd.command}
                    <Text color={index === suggestionIndex ? "black" : "gray"}>
                      {' '}- {cmd.description}
                    </Text>
                  </Text>
                </Box>
              ))}
              <Text color="gray" dimColor>
                💡 {t`Use ↑↓ to navigate, Enter to select command, Esc to close`}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
    );
  }

  return content;
};

export default ChatUI;