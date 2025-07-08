import React, { useState, useEffect } from 'react';
import { Button, Select, Switch, Space } from 'antd';
import { GithubFilled, SyncOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { t, currLang, setCurrLang } from '../i18n';
import { AppSetting } from '@hyperchat/shared/data.mjs';
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
} from 'darkreader';
import { Icon } from './icon';
import { msg_receive } from '../common/call';

interface AppActionsProps {
  onAIProviderClick: () => void;
  onRefresh: () => void;
}

export function AppActions({ onAIProviderClick, onRefresh }: AppActionsProps) {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState(0); // 同步状态：0-正常，1-同步中，-1-失败

  // 监听同步状态变化
  useEffect(() => {
    const unsubscribe = msg_receive("message-from-main", (res) => {
      // 处理同步状态变化
      if (res.type == "syncMsg") {
        setSyncStatus(res.data.status);
        if (res.data.status == 0) {
          // 同步完成后刷新组件
          setTimeout(() => {
            onRefresh();
          }, 500);
          onRefresh();
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [onRefresh]);

  const handleLanguageChange = (lang: string) => {
    setCurrLang(lang);
    onRefresh();
  };

  const handleThemeChange = async (checked: boolean) => {
    AppSetting.get().darkTheme = checked;
    await AppSetting.save();
    onRefresh();

    // 应用主题设置
    if (checked) {
      enableDarkMode({
        brightness: 100,
        contrast: 90,
        sepia: 10,
      });
    } else {
      disableDarkMode();
    }
  };

  const handleSyncClick = () => {
    navigate("/Setting/WebdavSetting");
  };

  return (
    <Space>
      {/* GitHub 链接 */}
      <a 
        href="https://github.com/BigSweetPotatoStudio/HyperChat"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GithubFilled style={{ fontSize: 20 }} />
      </a>

      {/* AI 提供商设置按钮 */}
      <Button
        onClick={onAIProviderClick}
        icon={<Icon name="brain" />}
      >
        {t`AI Providers`}
      </Button>

      {/* 语言切换选择器 */}
      <Select
        value={currLang}
        style={{ width: 120 }}
        onChange={handleLanguageChange}
        options={[
          { value: "zhCN", label: "中文" },
          { value: "enUS", label: "English" },
        ]}
      />

      {/* 主题切换开关 */}
      <Switch
        checkedChildren={"🌙"}
        unCheckedChildren={"☀️"}
        checked={AppSetting.get().darkTheme}
        onChange={handleThemeChange}
      />

    </Space>
  );
}