import React, { useState, useEffect, useRef } from 'react';
import { render, Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import { t } from '../../i18n.mjs';
import type { MyMessage, CommonContent, ChatHistoryItem } from '@dadigua/hyperchat-shared';
import chalk from 'chalk';
import ChatLogSelector from './ChatLogSelector.js';
import { SmartTextInput, type Command } from './SmartTextInput.js';
import { TokenCalculator } from '../../ai/memory-compressor.mjs';
import { AiChannel } from '../../ai/ai.mjs';
import { createAIChannel } from '../../utils/aiConfigHelper.mjs';
import { getBuiltinPrompts } from '../../ai/hyperchat-builtin-prompts.mjs';
import { TaskQueue } from '../../utils/taskQueue.mjs';
import { getMyUuid } from '../utils/util.mjs';
import { AgentInstance } from '../../lib.mjs';
import { Logger } from '../utils/logger.mjs';
import { path, sleep } from 'zx';
import { getAppSettingsManager } from '../../data/appSettingsService.mjs';
import { appDataDir } from '../../const.mjs';

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
  onExit: () => void;
  workspaceInfo?: {
    path: string;
    currentAgent?: string;
    currentModel?: string;
    agentAllowedMCPs?: number;
    agentAvailableTools?: number;
    agentToolNames?: string[];
  };
  agent: AgentInstance;
  logger: Logger;
  effectiveConfig: {
    modelKey: string;
    allowMCPs: string[];
    blockMCPTools: string[];
    isConfirmCallTool: boolean;
    temperature: number;
    maxTokens: number;
    prompt: string;
    maxContextTokens?: number;
  };
  initialMessage?: string;
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

// 创建聊天日志保存队列，确保按顺序写入，避免YAML文件并发问题
const chatLogQueue = new TaskQueue({ concurrency: 1 });

// 获取聊天标签（基于第一个用户消息）
function getLabelByFirstUserContent(messages: Array<MyMessage>): string {
  let label = "";
  let firstUser = messages.find(
    (x) => x.role == "user",
  );
  let firstUserContent = (firstUser as any)?.content;
  if (typeof firstUserContent == "string") {
    label = firstUserContent;
  } else if (Array.isArray(firstUserContent)) {
    label = firstUserContent.find((x) => x.type == "text")?.text || "";
  }
  return label;
}

export const ChatUI: React.FC<ChatUIProps> = ({ onExit, workspaceInfo, agent, logger, effectiveConfig, initialMessage }) => {
  // 所有 hooks 必须在组件顶部，在任何条件返回之前
  const [forceUpdate, setForceUpdate] = useState(0); // 强制更新计数器
  const [systemMessages, setSystemMessages] = useState<MyMessage[]>([]); // UI系统消息
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false); // 取消状态
  const [aiChannel] = useState(() => createAIChannel()); // 创建AI通道
  const [chatKey, setChatKey] = useState(() => getMyUuid()); // 聊天Key状态管理




  // 可用命令列表（包含描述）
  const availableCommands: Command[] = [
    { command: '/resume', description: t`Resume previous chat log` },
    { command: '/help', description: t`Show help` },
    { command: '/clear', description: t`Clear chat history` },
    { command: '/model', description: t`Show current model` },
    { command: '/compress', description: t`Manually compress memory` },
    { command: '/exit', description: t`Exit chat` },
  ];

  // Agent自定义命令
  const [agentCommands, setAgentCommands] = useState<Command[]>([]);

  // 加载Agent命令
  useEffect(() => {
    const loadAgentCommands = async () => {
      try {
        const commands = await agent.getCommands();
        const formattedCommands: Command[] = commands.map(cmd => ({
          command: `/${cmd.name}`,
          description: cmd.content.split('\n')[0].trim().substring(0, 40),
          isAgentCommand: true
        }));
        setAgentCommands(formattedCommands);
      } catch (error) {
        // 静默处理错误 - agent 命令是可选功能
      }
    };
    loadAgentCommands();
  }, [agent]);


  // 聊天记录选择状态
  const [showChatLogSelector, setShowChatLogSelector] = useState(false);
  const [chatLogs, setChatLogs] = useState<ChatHistoryItem[]>([]);
  const [loadingChatLogs, setLoadingChatLogs] = useState(false);

  // AI消息来自aiChannel，UI系统消息来自内部状态
  const messages = aiChannel.messages || [];



  // 处理取消请求
  const handleCancel = async () => {
    if (!isThinking || isCancelling || !aiChannel.cancel) return;

    setIsCancelling(true);
    try {
      await aiChannel.cancel();
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

  // 监听键盘输入 - 只处理Escape键取消AI请求
  useInput((inputChar, key) => {
    if (key.escape) {
      handleCancel();
      return;
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

      const result = await agent.getChatLogsPage();
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

    try {
      aiChannel.messages = [];

      // 加载聊天记录中的消息
      if (chatLog.messages && chatLog.messages.length > 0) {
        aiChannel.messages = chatLog.messages;
      }

      // 恢复原始的 chatKey，确保后续保存到同一文件
      setChatKey(chatLog.key);

      logger.info(`✅ ${t`Loaded chat log:`} ${chatLog.label} (${chatLog.messages?.length || 0} ${t`messages`})`);
      forceRefresh();
      addSystemMessage(`✅ ${t`Resumed chat:`} ${chatLog.label}`);
    } catch (error) {
      addSystemMessage(`❌ ${t`Failed to resume chat:`} ${error instanceof Error ? error.message : String(error)}`);
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
    const trimmedInput = userInput.trim();

    // 处理特殊命令
    if (trimmedInput === '/exit') {
      onExit();
      return;
    }

    if (trimmedInput === '/help') {
      let helpContent = `📋 ${t`Chat commands:`}
  /exit             - ${t`Exit chat`}
  /help             - ${t`Show help`}
  /clear            - ${t`Clear chat history`}
  /model            - ${t`Show current model`}
  /resume           - ${t`Resume previous chat log`}
  /compress         - ${t`Manually compress memory`}`;

      // 添加Agent命令帮助
      if (agentCommands.length > 0) {
        helpContent += `\n\n🎯 ${t`Agent commands:`}`;
        for (const cmd of agentCommands) {
          helpContent += `\n  ${cmd.command.padEnd(15)} - ${cmd.description}`;
        }
      }

      helpContent += `\n\n⌨️  ${t`Keyboard shortcuts:`}
  Esc               - ${t`Cancel current AI request`}
  ↑/↓               - ${t`Navigate input history or suggestions`}
  Tab               - ${t`Auto-complete and select suggestions`}
  Enter             - ${t`Submit input or select suggestion`}
  Ctrl+C            - ${t`Clear current input`}

🚀 ${t`Enhanced suggestion system:`}
  • ${t`Command suggestions appear when typing "/"`}
  • ${t`Tab key: Auto-complete and select with cursor at end`}
  • ${t`Enter key: Select suggestion with cursor at end`}
  • ${t`↑↓ keys: Navigate suggestions or input history`}
  • ${t`Suggestions automatically add space for parameters`}
  • ${t`Input history stores up to 50 recent commands`}`;
      addSystemMessage(helpContent);
      setInput('');
      return;
    }

    if (trimmedInput === '/clear') {
      // 清空AI消息和系统消息
      aiChannel.messages = [];
      setSystemMessages([]);
      // 重新生成 chatKey，开始新的聊天会话
      setChatKey(getMyUuid());
      addSystemMessage(`✅ ${t`Chat history cleared`}`);
      forceRefresh();
      setInput('');
      return;
    }

    if (trimmedInput === '/model') {
      try {
        const appSettingsManager = getAppSettingsManager();
        const aiSettings = appSettingsManager.getAI();
        const availableModels = aiSettings?.models || [];

        let modelInfo = `🤖 ${t`Current model:`} ${workspaceInfo?.currentModel || 'N/A'}\n\n`;

        if (availableModels.length > 0) {
          modelInfo += `📋 ${t`Available models:`}\n\n`;
          availableModels.forEach((model: any, index: number) => {
            const isCurrent = model.key === workspaceInfo?.currentModel;
            const prefix = isCurrent ? '✅' : '  ';
            modelInfo += `${prefix} ${model.key}${model.displayName ? ` (${model.displayName})` : ''}\n`;

            if (model.temperature !== undefined) {
              modelInfo += `      🌡️  Temperature: ${model.temperature}\n`;
            }
            if (model.maxTokens) {
              modelInfo += `      🔢 Max Tokens: ${model.maxTokens}\n`;
            }

            // if (index < availableModels.length - 1) {
            //   modelInfo += '';
            // }
          });

          modelInfo += `\n📍 ${t`Configuration file:`} ${getAppSettingsManager().settingsPath}`;

          // 显示环境变量提示
          const envManager = await import('../../data/managers/envManager.mjs');
          const envModel = envManager.EnvManager.getInstance().get('HyperChat_AI_Model');
          if (envModel) {
            modelInfo += `\n🔧 ${t`Environment variable:`} HyperChat_AI_Model=${envModel}`;
          }

        } else {
          modelInfo += `❌ ${t`No models configured. Please configure AI models first.`}`;
        }

        addSystemMessage(modelInfo);
      } catch (error) {
        addSystemMessage(`❌ ${t`Failed to load model information:`} ${error instanceof Error ? error.message : String(error)}`);
      }
      setInput('');
      return;
    }

    if (trimmedInput === '/compress') {

      const hasContent = messages.length > 1; // 至少需要有一些对话内容
      if (!hasContent) {
        addSystemMessage(`💬 ${t`Not enough conversation to compress`}`);
        setInput('');
        return;
      }

      addSystemMessage(`🔄 ${t`Starting manual memory compression...`}`);

      try {
        // 调用AI通道的压缩方法
        if (aiChannel && aiChannel.compressMemory) {
          await aiChannel.compressMemory(effectiveConfig.modelKey, () => {
            // 强制刷新UI显示压缩进度
            forceRefresh();
          });

          // 构建系统提示词
          const systemPrompt = getBuiltinPrompts(
            effectiveConfig.prompt,
            workspaceInfo?.path || process.cwd(),
            agent.getAgentPath()
          ).prompt;

          // 更新token使用信息
          aiChannel.updateTokenUsage({
            ...effectiveConfig,
            prompt: systemPrompt,
            maxContextTokens: effectiveConfig.maxContextTokens || 4000,
          });

          forceRefresh();
        } else {
          throw new Error(t`Memory compression not available`);
        }
      } catch (error) {
        addSystemMessage(`❌ ${t`Memory compression failed:`} ${error instanceof Error ? error.message : String(error)}`);
      }
      setInput('');
      return;
    }

    if (trimmedInput === '/resume') {
      if (loadingChatLogs) {
        addSystemMessage(`⏳ ${t`Loading chat logs, please wait...`}`);
        setInput('');
        return;
      }
      await loadChatLogs();
      setInput('');
      return;
    }

    if (!trimmedInput) {
      setInput('');
      return;
    }

    // 处理用户输入
    setInput('');
    await handleUserInput(trimmedInput);
  };

  // 处理用户输入的核心逻辑
  const handleUserInput = async (userInput: string): Promise<void> => {
    // 使用已生成的聊天Key

    // 添加用户消息
    const userMessage: MyMessage = {
      role: 'user',
      content: userInput,
      content_date: Date.now()
    };
    aiChannel.addMessage(userMessage);

    // 更新token使用信息
    try {
      const systemPrompt = getBuiltinPrompts(
        effectiveConfig.prompt,
        workspaceInfo?.path || process.cwd(),
        agent.getAgentPath()
      ).prompt;
      aiChannel.updateTokenUsage({
        ...effectiveConfig,
        prompt: systemPrompt,
        maxContextTokens: effectiveConfig.maxContextTokens || 4000,
      });
    } catch (error) {
      // 如果更新token使用信息失败，不影响聊天流程
      console.debug('Failed to update token usage:', error);
    }

    // 开始思考状态
    setIsThinking(true);
    setShowInput(false);

    // 强制刷新UI显示新消息
    forceRefresh();

    try {
      // 构建系统提示词
      const systemPrompt = getBuiltinPrompts(
        effectiveConfig.prompt,
        workspaceInfo?.path || process.cwd(),
        agent.getAgentPath()
      ).prompt;

      await aiChannel.completion({
        ...effectiveConfig,
        prompt: systemPrompt,
        maxContextTokens: effectiveConfig.maxContextTokens || 4000,
        agentInstance: agent, // 直接传递AgentInstance对象
        stream: false, // 在 ink 模式下使用非流式输出
        onUpdate: async () => {
          // 强制刷新UI显示
          forceRefresh();

          // 每次更新时保存聊天历史（使用队列确保顺序写入）
          try {
            chatLogQueue.add(async () => {
              await agent.setChatLog({
                key: chatKey,
                label: getLabelByFirstUserContent(aiChannel.messages),
                messages: aiChannel.messages,
                agentName: agent.getConfig().name,
                dateTime: Date.now(),
                chatType: "user",
                configOverrides: effectiveConfig,
              });
            });
          } catch (error) {
            // 静默处理聊天历史保存错误，不影响主要聊天流程
          }
        }
      });

    } catch (error) {
      // 强制刷新UI显示错误消息
      forceRefresh();
    } finally {
      setIsThinking(false);
      setShowInput(true);
    }
  };

  // 合并AI消息和系统消息
  const allMessages = [...messages, ...systemMessages].sort((a, b) => (a.content_date || 0) - (b.content_date || 0));

  // 生成进度条可视化
  const generateProgressBar = (percentage: number, width: number = 10): string => {
    // 确保百分比在0-100范围内
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    const filled = Math.round((clampedPercentage / 100) * width);
    const empty = Math.max(0, width - filled);
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // 获取token使用状态的颜色
  const getTokenUsageColor = (percentage: number): 'green' | 'yellow' | 'red' => {
    if (percentage >= 90) return 'red';
    if (percentage >= 80) return 'yellow';
    return 'green';
  };

  // 强制刷新函数
  const forceRefresh = () => {
    setForceUpdate(prev => prev + 1);
  };

  // 处理初始消息
  useEffect(() => {
    if (initialMessage) {
      // 延迟处理初始消息，让UI先渲染完成
      setTimeout(async () => {
        await handleUserInput(initialMessage);
        await sleep(500); // 确保消息处理完成
        onExit(); // 处理完初始消息后自动退出
      }, 100);
    }
  }, [initialMessage]);

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

          {msgList.map((message: MyMessage, msgIndex) => {
            if (message.role === 'assistant') {
              return (
                <Box key={`assistant-${msgIndex}`} flexDirection="column">

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
                    const toolResult = msgList.find(m => m.role === 'tool' && m.tool_call_id === tool.id);
                    const { reason, ...argsShow } = (tool.function.args || {}) as any;
                    return (
                      <Box key={`tool-call-${toolIndex}`} marginLeft={2} flexDirection="column" marginTop={0} marginBottom={0}>
                        <Text color={toolDisplay.color}>
                          {toolDisplay.icon} {toolDisplay.text} {tool.displayName || tool.originalName || tool.function.name} <Text color="greenBright">{reason}</Text>
                        </Text>
                        {Object.keys(argsShow).length > 0 && (
                          <Text color="gray">  {(() => {
                            const argsStr = JSON.stringify(argsShow, null, 0).replace(/\n\s*/g, ' ');
                            // 如果参数太长，截断显示
                            return argsStr.length > 200 ? argsStr.substring(0, 200) + '...' : argsStr;
                          })()}</Text>
                        )}

                        {/* 工具结果状态 */}
                        {toolResult && (
                          <Box marginLeft={2}>
                            {toolResult.content_status === 'loading' ? (
                              <Text color="blue">⏳ {t`Tool executing...`} </Text>
                            ) : toolResult.content_status === 'error' ? (
                              <Text color="red">❌ {t`Tool failed`} </Text>
                            ) : (
                              <Text color="green">✅ {t`Tool completed`} </Text>
                            )}
                          </Box>
                        )}
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
              return null;
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
        <Box borderStyle="single" padding={1} marginBottom={1}>
          <Box flexDirection="column">
            <Text color="blue" bold>🚀 HyperChat CLI</Text>
            {workspaceInfo && (
              <>
                <Text>📍 {t`Workspace:`} {workspaceInfo.path}</Text>
                {workspaceInfo.currentAgent && (
                  <Text>🌐 {t`Current Agent:`} {workspaceInfo.currentAgent} <Text color="gray">({agent.getAgentPath()})</Text></Text>
                )}
                {workspaceInfo.currentModel && (
                  <Text>🤖 {t`Model:`} {workspaceInfo.currentModel}</Text>
                )}
                {workspaceInfo.agentAllowedMCPs !== undefined && (
                  <Text>🛠️ {t`Agent allowed tools:`} {`${workspaceInfo.agentAvailableTools || 0} available (${workspaceInfo.agentAllowedMCPs} mcp)`}</Text>
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
            <Text color="gray">💡 {t`Type "/" for commands, Tab: smart complete, Enter: select with cursor at end, ↑↓: navigate, Esc: cancel`}</Text>
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


        </Box>

        {/* Token/Dialog Usage Display */}
        {aiChannel?.tokenUsage && (
          <Box borderStyle="single" borderColor={getTokenUsageColor(aiChannel.tokenUsage.percentage)} paddingX={1} marginBottom={0}>
            <Text color={getTokenUsageColor(aiChannel.tokenUsage.percentage)}>
              {aiChannel.tokenUsage.strategy === 'tokens' ? (
                <>
                  📊 Token Usage: {aiChannel.tokenUsage.current.toLocaleString()} / {aiChannel.tokenUsage.max.toLocaleString()} ({aiChannel.tokenUsage.percentage}%) [{generateProgressBar(aiChannel.tokenUsage.percentage)}]
                  {aiChannel.tokenUsage.type && (
                    <Text color={aiChannel.tokenUsage.type === 'actual' ? 'green' : 'yellow'}>
                      {' '}({aiChannel.tokenUsage.type === 'actual' ? t`Actual` : t`Estimated`})
                    </Text>
                  )}
                </>
              ) : null}
              {aiChannel.tokenUsage.percentage >= 80 && (
                <Text color={aiChannel.tokenUsage.percentage >= 90 ? 'red' : 'yellow'}>
                  {aiChannel.tokenUsage.percentage >= 90 ? ' ⚠️ 即将压缩记忆' : ' ⚡ 接近压缩阈值'}
                </Text>
              )}
            </Text>
          </Box>
        )}

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

        {/* Smart Input */}
        {showInput && (
          <SmartTextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder={t`Type your message... (↑↓: history, Tab: complete)`}
            availableCommands={availableCommands}
            agentCommands={agentCommands}
            disabled={isThinking}
            onCommandExecute={async (command, args) => {
              // 执行Agent命令替换
              const result = await agent.executeCommand(command, args);
              return result;
            }}
          />
        )}
      </Box>
    );
  }

  return content;
};

export default ChatUI;