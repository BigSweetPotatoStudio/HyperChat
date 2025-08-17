import React, { useState, useEffect } from "react";
import {
  Tabs,
  Button,
  Space,
  Divider,
  Alert,
  message,
  Card,
  Switch,
  List,
} from "antd";
import {
  AppstoreOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  SaveOutlined,
  ReloadOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { setCurrLang, t } from "../i18n";
import { zodToJsonSchema } from "zod-to-json-schema";
import { callElectron } from "../common/call";
import {
  AppearanceSchema,
  SystemSchema,
  DesktopSchema,
  AppSettingsSchema
} from "@dadigua/hyperchat-shared";
import type { z } from "zod";
import Schema2Form from "./schema2Form";

interface AppSettingsProps {
  settings: z.infer<typeof AppSettingsSchema>;
  onUpdate: (updates: Partial<z.infer<typeof AppSettingsSchema>>) => Promise<void>;
  onReset?: () => Promise<void>;
}

export function AppSettings({
  settings,
  onUpdate,
  onReset,
}: AppSettingsProps) {
  const [activeTab, setActiveTab] = useState("appearance");
  const [hasChanges, setHasChanges] = useState(false);
  const [currentValues, setCurrentValues] = useState(settings);
  
  // Electron 自启动状态
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(false);
  const [autoLaunchLoading, setAutoLaunchLoading] = useState(false);

  // 监听设置变化
  useEffect(() => {
    if (settings) {
      setCurrentValues(settings);
      setHasChanges(false);
    }
  }, [settings]);

  // 加载自启动状态（仅在 Electron 环境）
  useEffect(() => {
    const loadAutoLaunchStatus = async () => {
      if (!window.isElectron) return;
      
      try {
        const isEnabled = await callElectron("isAutoLauncher");
        setAutoLaunchEnabled(isEnabled);
      } catch (error) {
        console.error("Failed to load auto launch status:", error);
      }
    };
    
    loadAutoLaunchStatus();
  }, []);

  // 处理表单值变化
  const handleFormChange = (values: z.infer<typeof AppSettingsSchema>) => {
    setCurrentValues(values);
    // 语言设置已移动到环境变量系统，这里不再处理
    setHasChanges(true);
  };

  // 保存设置
  const handleSave = async () => {
    try {
      await onUpdate(currentValues);
      setHasChanges(false);
      message.success(t`Settings saved successfully`);
    } catch (error) {
      console.error("Failed to save settings:", error);
      message.error(t`Failed to save settings`);
    }
  };

  // 切换自启动
  const handleAutoLaunchToggle = async (enabled: boolean) => {
    if (!window.isElectron) {
      message.warning(t`Auto launch is only available in desktop app`);
      return;
    }

    setAutoLaunchLoading(true);
    try {
      if (enabled) {
        await callElectron("enableAutoLauncher");
        message.success(t`Auto launch enabled`);
      } else {
        await callElectron("disableAutoLauncher");
        message.success(t`Auto launch disabled`);
      }
      setAutoLaunchEnabled(enabled);
    } catch (error) {
      console.error("Failed to toggle auto launch:", error);
      message.error(t`Failed to change auto launch setting`);
    } finally {
      setAutoLaunchLoading(false);
    }
  };

  // 重置设置
  const handleReset = async () => {
    if (onReset) {
      await onReset();
      message.success(t`Settings reset to defaults`);
    }
  };


  if (!settings) {
    return null;
  }

  // 使用 zodToJsonSchema 转换 Zod Schema 为 JSON Schema
  const appearanceJsonSchema = zodToJsonSchema(AppearanceSchema as any) as any;

  const systemJsonSchema = zodToJsonSchema(SystemSchema as any) as any;

  const desktopJsonSchema = zodToJsonSchema(DesktopSchema as any) as any;

  // 创建外观设置 schema，添加中文标题
  const appearanceSchema = appearanceJsonSchema;

  // 创建系统设置 schema，添加中文标题
  const systemSchema = systemJsonSchema;

  // 创建桌面设置 schema，添加中文标题
  const desktopSchema = desktopJsonSchema;

  const tabItems = [
    {
      key: "appearance",
      label: (
        <span>
          <AppstoreOutlined />
          {t`Appearance`}
        </span>
      ),
      children: (
        <Schema2Form
          schema={appearanceSchema}
          value={currentValues?.appearance}
          onChange={(values) => handleFormChange({ ...currentValues, appearance: values as z.infer<typeof AppearanceSchema> })}
        />
      ),
    },
    {
      key: "system",
      label: (
        <span>
          <DesktopOutlined />
          {t`System`}
        </span>
      ),
      children: (
        <Schema2Form
          schema={systemSchema}
          value={currentValues?.system}
          onChange={(values) => handleFormChange({ ...currentValues, system: values as z.infer<typeof SystemSchema> })}
        />
      ),
    },
    {
      key: "desktop",
      label: (
        <span>
          <DesktopOutlined />
          {t`Desktop`}
        </span>
      ),
      children: (
        <Schema2Form
          schema={desktopSchema}
          value={currentValues?.desktop}
          onChange={(values) => handleFormChange({ ...currentValues, desktop: values as z.infer<typeof DesktopSchema> })}
        />
      ),
    },
    // 只在 Electron 环境下显示自启动设置
    ...(window.isElectron ? [{
      key: "autolaunch",
      label: (
        <span>
          <RocketOutlined />
          {t`Auto Launch`}
        </span>
      ),
      children: (
        <Card title={t`Auto Launch Settings`} size="small">
          <List
            size="small"
            dataSource={[
              {
                title: t`Launch HyperChat on system startup`,
                description: t`Automatically start HyperChat when you log in to your computer`,
                key: 'autolaunch'
              }
            ]}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Switch
                    key="switch"
                    checked={autoLaunchEnabled}
                    loading={autoLaunchLoading}
                    onChange={handleAutoLaunchToggle}
                  />
                ]}
              >
                <List.Item.Meta
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      ),
    }] : []),
    {
      key: "info",
      label: (
        <span>
          <ExperimentOutlined />
          {t`System Information`}
        </span>
      ),
      children: (
        <Card title={t`System Information`} size="small">
          <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
            <div><strong>{t`Version`}:</strong> {settings?.version || 'N/A'}</div>
            <div><strong>{t`Platform`}:</strong> {settings?.platform || 'N/A'}</div>
            <div><strong>{t`App Data Directory`}:</strong> {settings?.appDataDir || 'N/A'}</div>
            <div><strong>{t`Log File Path`}:</strong> {settings?.logFilePath || 'N/A'}</div>
            <div><strong>{t`System PATH`}:</strong> {settings?.PATH || 'N/A'}</div>
            <div><strong>{t`UUID`}:</strong> {settings?.uuid || 'N/A'}</div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <div className="app-settings">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      <Divider />

      {/* 操作按钮 */}
      <Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          {t`Save`}
        </Button>

        {onReset && (
          <Button
            icon={<ReloadOutlined />}
            onClick={handleReset}
          >
            {t`Reset to Defaults`}
          </Button>
        )}
      </Space>

      {hasChanges && (
        <Alert
          message={t`You have unsaved changes`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </div>
  );
}