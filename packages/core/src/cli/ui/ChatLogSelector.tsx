import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { t } from '../../i18n.mjs';
import type { ChatHistoryItem } from '@dadigua/hyperchat-shared/types';

interface ChatLogSelectorProps {
  chatLogs: ChatHistoryItem[];
  onSelect: (chatLog: ChatHistoryItem) => void;
  onCancel: () => void;
}

export const ChatLogSelector: React.FC<ChatLogSelectorProps> = ({ chatLogs, onSelect, onCancel }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const { stdout } = useStdout();
  
  // 计算可显示的聊天记录数量
  // 减去边框(2行) + 标题(2行) + 底部提示(1行) + 一些缓冲(2行)
  const maxVisibleItems = Math.max(3, (stdout?.rows || 20) - 7);

  // 更新滚动位置以确保选中项可见
  useEffect(() => {
    if (selectedIndex < scrollOffset) {
      setScrollOffset(selectedIndex);
    } else if (selectedIndex >= scrollOffset + maxVisibleItems) {
      setScrollOffset(selectedIndex - maxVisibleItems + 1);
    }
  }, [selectedIndex, maxVisibleItems]);

  // 键盘导航
  useInput((input, key) => {
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    } else if (key.downArrow && selectedIndex < chatLogs.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else if (key.return) {
      if (chatLogs[selectedIndex]) {
        onSelect(chatLogs[selectedIndex]);
      }
    } else if (key.escape || input === 'q') {
      onCancel();
    }
  });

  // 格式化时间显示
  const formatDateTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (chatDate.getTime() === today.getTime()) {
      // 今天，只显示时间
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (chatDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      // 昨天
      return `${t`Yesterday`} ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // 其他日期
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  };

  // 格式化聊天类型显示
  const formatChatType = (chatType: string): string => {
    switch (chatType) {
      case 'user': return '👤';
      case 'task': return '📋';
      case 'called': return '📞';
      default: return '💬';
    }
  };

  // 截断长标签
  const truncateLabel = (label: string, maxLength: number = 50): string => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  };

  if (chatLogs.length === 0) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="yellow" padding={1}>
        <Text color="yellow">📝 {t`No chat logs found`}</Text>
        <Text color="gray">
          💡 {t`Start a conversation to create chat logs`}
        </Text>
        <Text color="gray">
          {t`Press Esc to return`}
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="blue" padding={1}>
      <Text color="blue" bold>
        📝 {t`Select Chat Log to Resume`} ({chatLogs.length} {t`total`})
      </Text>
      <Text color="gray">
        {t`Use ↑↓ to navigate, Enter to select, Esc to cancel`}
      </Text>

      <Box flexDirection="column">
        {chatLogs.slice(scrollOffset, scrollOffset + maxVisibleItems).map((chatLog, index) => {
          const actualIndex = scrollOffset + index;
          const isSelected = actualIndex === selectedIndex;
          const typeIcon = formatChatType(chatLog.chatType);
          const timeStr = formatDateTime(chatLog.dateTime);
          const messageCount = chatLog.messages?.length || 0;
          
          return (
            <Box key={chatLog.key} marginY={0}>
              <Text 
                color={isSelected ? "black" : "white"}
                backgroundColor={isSelected ? "blue" : undefined}
                bold={isSelected}
              >
                {isSelected ? '► ' : '  '}
                {typeIcon} {truncateLabel(chatLog.label)} 
                <Text color={isSelected ? "black" : "gray"}>
                  {' '}({messageCount} msgs, {timeStr})
                </Text>
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* 滚动指示器 */}
      {chatLogs.length > maxVisibleItems && (
        <Box justifyContent="space-between">
          <Text color="gray">
            {scrollOffset > 0 ? '↑ 更多' : ''}
          </Text>
          <Text color="gray">
            {scrollOffset + maxVisibleItems < chatLogs.length ? '↓ 更多' : ''}
          </Text>
        </Box>
      )}

      <Text color="gray">
        💡 {t`Total messages in selected:`} {chatLogs[selectedIndex]?.messages?.length || 0}
      </Text>
    </Box>
  );
};

export default ChatLogSelector;