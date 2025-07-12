import React, { useState, useEffect } from "react";
import {
  Tabs,
  Button,
  Space,
  Divider,
  Alert,
  message,
  Card,
} from "antd";
import {
  AppstoreOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  AppearanceSchema,
  SystemSchema,
  DesktopSchema,
  AppSettingsSchema
} from "@hyperchat/shared/jsonSchemas/appSettingsSchema";
import type { z } from "zod";
import Schema2Form from "./schema2Form";

interface AppSettingsProps {
  settings: z.infer<typeof AppSettingsSchema>;
  onUpdate: (updates: Partial<z.infer<typeof AppSettingsSchema>>) => Promise<void>;
  onReset?: () => Promise<void>;
  onExport?: () => Promise<void>;
  onImport?: (settingsJson: string) => Promise<void>;
}

export function AppSettings({
  settings,
  onUpdate,
  onReset,
  onExport,
  onImport,
}: AppSettingsProps) {
  const [activeTab, setActiveTab] = useState("appearance");
  const [hasChanges, setHasChanges] = useState(false);
  const [currentValues, setCurrentValues] = useState(settings);

  // 监听设置变化
  useEffect(() => {
    if (settings) {
      setCurrentValues(settings);
      setHasChanges(false);
    }
  }, [settings]);

  // 处理表单值变化
  const handleFormChange = (values: z.infer<typeof AppSettingsSchema>) => {
    setCurrentValues(values);
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

  // 重置设置
  const handleReset = async () => {
    if (onReset) {
      await onReset();
      message.success(t`Settings reset to defaults`);
    }
  };

  // 导出设置
  const handleExport = async () => {
    if (onExport) {
      await onExport();
    }
  };

  // 导入设置
  const handleImport = async () => {
    if (onImport) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,.jsonc";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          await onImport(text);
        }
      };
      input.click();
    }
  };

  if (!settings) {
    return null;
  }

  // 使用 zodToJsonSchema 转换 Zod Schema 为 JSON Schema
  const appearanceJsonSchema = zodToJsonSchema(AppearanceSchema as any)  as any;

  const systemJsonSchema = zodToJsonSchema(SystemSchema as any)  as any;

  const desktopJsonSchema = zodToJsonSchema(DesktopSchema as any)  as any;

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

        {onExport && (
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            {t`Export`}
          </Button>
        )}

        {onImport && (
          <Button
            icon={<ImportOutlined />}
            onClick={handleImport}
          >
            {t`Import`}
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