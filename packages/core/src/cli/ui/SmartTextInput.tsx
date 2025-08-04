import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { t } from '../../i18n.mjs';
import { 
  getFilePathSuggestions, 
  extractFilePathFromInput, 
  buildInputWithFilePath,
  getCurrentAtSymbolInfo,
  getAllAtSymbolsInfo,
  type FileSuggestion,
  type AtSymbolInfo
} from './FilePathUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { getAppDataDir } from '../../const.mjs';

// 历史记录持久化工具函数
const getHistoryFilePath = (): string => {
  return path.join(getAppDataDir(), 'cli_history.json');
};

const loadHistoryFromFile = async (): Promise<string[]> => {
  try {
    const historyPath = getHistoryFilePath();
    const data = await fs.readFile(historyPath, 'utf-8');
    const history = JSON.parse(data);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    // 文件不存在或读取失败，返回空数组
    return [];
  }
};

const saveHistoryToFile = async (history: string[]): Promise<void> => {
  try {
    const historyPath = getHistoryFilePath();
    const appDataDir = path.dirname(historyPath);
    
    // 确保目录存在
    await fs.mkdir(appDataDir, { recursive: true });
    
    // 保存历史记录
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('Failed to save CLI history:', error);
  }
};

// 命令定义接口
export interface Command {
  command: string;
  description: string;
  isAgentCommand?: boolean;  // 是否为Agent命令
}

// 建议类型枚举
export type SuggestionType = 'command' | 'file';

// 统一建议接口
export interface Suggestion {
  type: SuggestionType;
  displayText: string;
  value: string;
  description?: string;
}

// SmartTextInput组件属性
export interface SmartTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  availableCommands?: Command[];
  agentCommands?: Command[];  // Agent自定义命令
  maxHistorySize?: number;
  disabled?: boolean;
  onCommandExecute?: (command: string, args: string) => Promise<string | null>;  // 命令执行回调
}

export const SmartTextInput: React.FC<SmartTextInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  availableCommands = [],
  agentCommands = [],
  maxHistorySize = 50,
  disabled = false,
  onCommandExecute
}) => {
  // 输入历史相关状态
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalInput, setOriginalInput] = useState(''); // 保存用户正在输入的内容
  const [inputKey, setInputKey] = useState(0); // 用于强制重新渲染TextInput
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
  
  // 候选框相关状态
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentSuggestionType, setCurrentSuggestionType] = useState<SuggestionType>('command');
  
  // 光标位置追踪（用于多@符号支持）
  const [estimatedCursorPosition, setEstimatedCursorPosition] = useState(0);
  const [currentAtSymbolInfo, setCurrentAtSymbolInfo] = useState<AtSymbolInfo | null>(null);

  // 初始化历史记录
  useEffect(() => {
    const initHistory = async () => {
      if (!isHistoryLoaded) {
        const history = await loadHistoryFromFile();
        setInputHistory(history);
        setIsHistoryLoaded(true);
      }
    };
    initHistory();
  }, [isHistoryLoaded]);
  
  // 自动补全功能
  const handleAutoComplete = useCallback((currentInput: string): string => {
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
  }, [availableCommands]);
  
  // 历史记录导航
  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (inputHistory.length === 0) return;
    
    if (direction === 'up') {
      if (historyIndex === -1) {
        // 第一次按上箭头，保存当前输入并显示最新历史（索引0）
        setOriginalInput(value);
        setHistoryIndex(0);
        onChange(inputHistory[0]);
      } else if (historyIndex < inputHistory.length - 1) {
        // 继续向上浏览历史（向后翻页）
        setHistoryIndex(historyIndex + 1);
        onChange(inputHistory[historyIndex + 1]);
      }
    } else { // down
      if (historyIndex !== -1) {
        if (historyIndex > 0) {
          // 向下浏览历史（向前翻页）
          setHistoryIndex(historyIndex - 1);
          onChange(inputHistory[historyIndex - 1]);
        } else {
          // 回到原始输入
          setHistoryIndex(-1);
          onChange(originalInput);
        }
      }
    }
  }, [inputHistory, historyIndex, originalInput, value, onChange]);
  
  // 添加到历史记录
  const addToHistory = useCallback(async (inputText: string) => {
    if (inputText.trim()) {
      // 先移除历史记录中相同的项（如果存在）
      const filteredHistory = inputHistory.filter(item => item !== inputText);
      // 将新输入添加到数组开头，让最新的输入浮到最上面
      const newHistory = [inputText, ...filteredHistory];
      // 保持历史记录在合理数量内
      if (newHistory.length > maxHistorySize) {
        newHistory.pop(); // 从末尾移除最旧的记录
      }
      setInputHistory(newHistory);
      // 异步保存到文件
      await saveHistoryToFile(newHistory);
    }
    // 重置历史导航状态
    setHistoryIndex(-1);
    setOriginalInput('');
  }, [inputHistory, maxHistorySize]);
  
  // 更新候选框
  const updateSuggestions = useCallback(async (inputValue: string) => {
    const trimmedInput = inputValue.trimEnd();
    
    // 更新光标位置估算（通常在输入末尾）
    const newCursorPosition = inputValue.length;
    setEstimatedCursorPosition(newCursorPosition);
    
    // 获取当前光标位置的@符号信息
    const atInfo = getCurrentAtSymbolInfo(trimmedInput, newCursorPosition);
    setCurrentAtSymbolInfo(atInfo);
    
    // 检查是否是文件路径建议（使用新的多@符号支持）
    const filePathPart = extractFilePathFromInput(trimmedInput, newCursorPosition);
    
    if (filePathPart !== null) {
      // 文件路径建议
      try {
        const fileSuggestions = await getFilePathSuggestions(filePathPart);
        const suggestions: Suggestion[] = fileSuggestions.map(fs => ({
          type: 'file' as SuggestionType,
          displayText: fs.displayName,
          value: fs.relativePath,
          description: fs.type === 'directory' ? 'Folder' : 'File'
        }));
        
        setSuggestions(suggestions);
        setCurrentSuggestionType('file');
        setShowSuggestions(suggestions.length > 0);
        setSuggestionIndex(0);
      } catch (error) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    } else if (trimmedInput.startsWith('/')) {
      // 命令建议 - 合并系统命令和Agent命令
      const allCommands = [...availableCommands, ...agentCommands];
      const filtered = allCommands.filter(cmd => 
        cmd.command.startsWith(trimmedInput)
      ).slice(0, 8);
      
      const suggestions: Suggestion[] = filtered.map(cmd => ({
        type: 'command' as SuggestionType,
        displayText: cmd.command,
        value: cmd.command,
        description: cmd.description
      }));
      
      setSuggestions(suggestions);
      setCurrentSuggestionType('command');
      setShowSuggestions(suggestions.length > 0);
      setSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [availableCommands]);
  
  // 候选框导航
  const navigateSuggestions = useCallback((direction: 'up' | 'down') => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    if (direction === 'up') {
      setSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else {
      setSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    }
  }, [showSuggestions, suggestions.length]);
  
  // 选择候选建议
  const selectSuggestion = useCallback(async () => {
    if (showSuggestions && suggestions[suggestionIndex]) {
      const selectedSuggestion = suggestions[suggestionIndex];
      
      if (selectedSuggestion.type === 'command') {
        // 命令建议：添加空格
        const finalInput = selectedSuggestion.value + ' ';
        setShowSuggestions(false);
        onChange(finalInput);
        setInputKey(prev => prev + 1);
      } else if (selectedSuggestion.type === 'file') {
        // 文件路径建议（使用多@符号支持）
        const currentInput = value;
        const newInput = buildInputWithFilePath(currentInput, selectedSuggestion.value, estimatedCursorPosition);
        
        // 检查是否是文件夹
        if (selectedSuggestion.description === 'Folder') {
          // 文件夹：添加 / 并继续提示
          const folderInput = newInput.endsWith('/') ? newInput : newInput + '/';
          onChange(folderInput);
          setInputKey(prev => prev + 1);
          // 继续更新建议
          setTimeout(() => updateSuggestions(folderInput), 50);
        } else {
          // 文件：直接完成，不添加空格
          setShowSuggestions(false);
          onChange(newInput);
          setInputKey(prev => prev + 1);
        }
      }
      
      return true;
    }
    return false;
  }, [showSuggestions, suggestions, suggestionIndex, onChange, value, updateSuggestions]);

  // Tab键建议补全功能
  const handleTabSuggestion = useCallback(async () => {
    if (showSuggestions && suggestions.length > 0) {
      // 如果有候选框，选择当前高亮的建议
      return await selectSuggestion();
    } else {
      // 如果没有候选框，尝试自动补全
      const filePathPart = extractFilePathFromInput(value, estimatedCursorPosition);
      
      if (filePathPart !== null) {
        // 文件路径自动补全 - 暂时触发建议显示
        await updateSuggestions(value);
        return true;
      } else {
        // 命令自动补全
        const completed = handleAutoComplete(value);
        let finalInput = completed;
        
        // 为补全的命令添加空格
        if (completed !== value && completed.startsWith('/') && !completed.endsWith(' ')) {
          finalInput = completed + ' ';
        }
        
        // 只有当有变化时才更新
        if (finalInput !== value) {
          // 强制重新渲染TextInput以确保光标在末尾
          onChange(finalInput);
          setInputKey(prev => prev + 1);
          await updateSuggestions(finalInput);
          return true;
        }
      }
    }
    return false;
  }, [showSuggestions, suggestions, selectSuggestion, handleAutoComplete, value, onChange, updateSuggestions]);
  
  // 处理输入变化时的自动补全提示
  const handleInputChange = useCallback(async (newInput: string) => {
    onChange(newInput);
    // 如果用户正在浏览历史，则重置历史状态
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setOriginalInput('');
    }
    // 更新候选框
    await updateSuggestions(newInput);
  }, [onChange, historyIndex, updateSuggestions]);
  
  // 处理提交
  const handleSubmit = useCallback(async (userInput: string) => {
    // 如果候选框正在显示，Enter键选择建议
    if (showSuggestions && suggestions.length > 0) {
      await selectSuggestion();
      return; // 不提交，只是选择候选项
    }
    
    const trimmedInput = userInput.trim();
    
    // 检查是否是Agent命令
    if (trimmedInput.startsWith('/') && onCommandExecute) {
      const spaceIndex = trimmedInput.indexOf(' ');
      const commandName = spaceIndex > 0 ? trimmedInput.substring(1, spaceIndex) : trimmedInput.substring(1);
      const args = spaceIndex > 0 ? trimmedInput.substring(spaceIndex + 1) : '';
      
      // 检查是否为Agent命令
      const isAgentCommand = agentCommands.some(cmd => cmd.command === '/' + commandName);
      if (isAgentCommand) {
        // 执行命令替换
        const replacedContent = await onCommandExecute(commandName, args);
        if (replacedContent !== null) {
          // 替换输入为命令内容并提交
          await addToHistory(trimmedInput);  // 记录原始命令
          onSubmit(replacedContent);
          return;
        }
      }
    }
    
    // 关闭候选框
    setShowSuggestions(false);
    
    // 添加到历史记录（除了空输入）
    if (trimmedInput) {
      await addToHistory(trimmedInput);
    }

    // 提交输入
    onSubmit(trimmedInput);
  }, [showSuggestions, suggestions, selectSuggestion, addToHistory, onSubmit]);
  
  // 监听键盘输入
  useInput((inputChar, key) => {
    if (disabled) return;
    
    // 只处理特定的快捷键，其他键让TextInput处理
    if (key.delete || key.backspace || 
        (inputChar && inputChar.length === 1 && !key.ctrl && !key.meta)) {
      // 不处理这些键，让TextInput组件自己处理
      return;
    }
    
    // 优先处理上下箭头键 - 区分候选框和历史记录
    if (key.upArrow) {
      if (showSuggestions && suggestions.length > 0) {
        // 有候选框时，用于候选框导航
        navigateSuggestions('up');
      } else {
        // 没有候选框时，用于历史记录导航
        navigateHistory('up');
      }
      return;
    }
    
    if (key.downArrow) {
      if (showSuggestions && suggestions.length > 0) {
        // 有候选框时，用于候选框导航
        navigateSuggestions('down');
      } else {
        // 没有候选框时，用于历史记录导航
        navigateHistory('down');
      }
      return;
    }
    
    if (key.escape && showSuggestions) {
      setShowSuggestions(false);
      return;
    }
    
    if (key.tab) {
      // 使用Tab键建议补全功能（异步）
      handleTabSuggestion();
      return;
    }
    
    // 快捷键支持
    if (key.ctrl) {
      switch (inputChar) {
        case 'c': // Ctrl+C: 清空输入
          onChange('');
          setHistoryIndex(-1);
          setOriginalInput('');
          return;
      }
    }
  }, { isActive: !disabled });

  return (
    <Box flexDirection="column">
      {/* 输入框 */}
      <Box borderStyle="single" borderColor="green" paddingX={1}>
        <Text color="green">🧑 {t`You:`} </Text>
        <TextInput
          key={inputKey}
          value={value}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder={placeholder}
        />
      </Box>
      
      {/* 候选框 */}
      {showSuggestions && suggestions.length > 0 && (
        <Box 
          borderStyle="single" 
          borderColor="cyan" 
          marginTop={0}
          paddingX={1}
          flexDirection="column"
        >
          <Text color="cyan" bold>
            {currentSuggestionType === 'command' ? 
              '📋 ' + t`Command suggestions:` : 
              '📁 ' + t`File path suggestions:` + (currentAtSymbolInfo ? ` @${currentAtSymbolInfo.pathPart}` : '')
            }
          </Text>
          {suggestions.map((suggestion, index) => (
            <Box key={`${suggestion.type}-${suggestion.value}-${index}`} marginY={0}>
              <Text 
                color={index === suggestionIndex ? "black" : "white"}
                backgroundColor={index === suggestionIndex ? "cyan" : undefined}
                bold={index === suggestionIndex}
              >
                {index === suggestionIndex ? '► ' : '  '}
                {suggestion.displayText}
                {suggestion.description && (
                  <Text color={index === suggestionIndex ? "black" : "gray"}>
                    {' '}- {suggestion.description}
                  </Text>
                )}
                {(suggestion as any).isAgentCommand && (
                  <Text color="yellow"> [Agent]</Text>
                )}
              </Text>
            </Box>
          ))}
          <Text color="gray" dimColor>
            💡 {currentSuggestionType === 'command' 
              ? t`Use ↑↓ to navigate, Tab/Enter to select with space, Esc to close`
              : t`Use ↑↓ to navigate, Tab/Enter to select file/folder, Esc to close`
            }
          </Text>
        </Box>
      )}
    </Box>
  );
};