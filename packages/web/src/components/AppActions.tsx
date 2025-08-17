import React, { useState, useEffect } from 'react';
import { Button, Select, Switch, Space } from 'antd';
import { GithubFilled, SyncOutlined, SettingOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppearanceSettings } from '../contexts/AppSettingsContext';
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
} from 'darkreader';
import { Icon } from './icon';
import { msg_receive } from '../common/call';
import { t } from '../i18n';
import { DataMigration } from './DataMigration';

interface AppActionsProps {
  onAIProviderClick: () => void;
  onRefresh: () => void;
  onAppSettingsClick?: () => void;
}

export function AppActions({ onAIProviderClick, onRefresh, onAppSettingsClick }: AppActionsProps) {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState(0); // 同步状态：0-正常，1-同步中，-1-失败
  const { appearance, updateAppearance } = useAppearanceSettings();
  const [migrationVisible, setMigrationVisible] = useState(false);

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

      {/* 应用设置按钮 */}
      {onAppSettingsClick && (
        <Button
          onClick={onAppSettingsClick}
          icon={<SettingOutlined />}
        >
          {t`App Settings`}
        </Button>
      )}

      {/* 数据迁移按钮 */}
      <Button
        onClick={() => setMigrationVisible(true)}
        icon={<DatabaseOutlined />}
        type="dashed"
      >
        {t`Data Migration`}
      </Button>

      {/* AI 提供商设置按钮 */}
      <Button
        onClick={onAIProviderClick}
        icon={<Icon name="brain" />}
      >
        {t`AI Providers`}
      </Button>


      {/* 数据迁移弹窗 */}
      <DataMigration
        visible={migrationVisible}
        onClose={() => setMigrationVisible(false)}
      />
    </Space>
  );
}