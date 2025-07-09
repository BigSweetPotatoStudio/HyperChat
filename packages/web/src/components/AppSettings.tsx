import React, { useState, useEffect } from "react";
import {
  Tabs,
  Button,
  Space,
  Divider,
  Typography,
  Alert,
  message,
  Card,
} from "antd";
import {
  AppstoreOutlined,
  GlobalOutlined,
  DesktopOutlined,
  ExperimentOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AppSettingsSchema } from "../../../core/src/shared/jsonSchemas/appSettingsSchema.mjs";
import Schema2Form from "./schema2Form";

const { Title, Text } = Typography;

interface AppSettingsProps {
  settings: any;
  onUpdate: (updates: any) => Promise<void>;
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
  const handleFormChange = (values: any) => {
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


  // 创建外观设置 schema
  const appearanceSchema = {
    type: "object" as const,
    title: t`Appearance Settings`,
    properties: {
      darkTheme: {
        type: "boolean"  as const,
        title: t`Dark Theme`,
        description: t`Enable dark theme`,
        default: false,
      },
      language: {
        type: "string"  as const,
        title: t`Language`,
        description: t`Interface language`,
        enum: ["zhCN", "enUS"],
        default: "zhCN",
      },
    },
  };

  // 创建系统设置 schema
  const systemSchema = {
    type: "object" as const,
    title: t`System Settings`,
    properties: {
      closeAction: {
        type: "string" as const,
        title: t`Close Action`,
        description: t`What to do when closing the window`,
        enum: ["minimize", "exit"],
      },
      password: {
        type: "string" as const,
        title: t`Application Password`,
        description: t`Password to protect the application`,
        default: "123456",
      },
      isDeveloper: {
        type: "boolean" as const,
        title: t`Developer Mode`,
        description: t`Enable developer mode`,
        default: false,
      },
      windowSize: {
        type: "object" as const,
        title: t`Window Size`,
        properties: {
          width: {
            type: "integer" as const,
            title: t`Width`,
            description: t`Window width in pixels`,
            minimum: 800,
            maximum: 4000,
            default: 1440,
          },
          height: {
            type: "integer" as const,
            title: t`Height`,
            description: t`Window height in pixels`,
            minimum: 600,
            maximum: 3000,
            default: 900,
          },
        },
      },
    },
  };

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
          onChange={(values) => handleFormChange({ ...currentValues, appearance: values })}
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
          onChange={(values) => handleFormChange({ ...currentValues, system: values })}
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
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div><strong>{t`Version`}:</strong> {settings?.version || 'N/A'}</div>
            <div><strong>{t`Platform`}:</strong> {settings?.platform || 'N/A'}</div>
            <div><strong>{t`App Data Directory`}:</strong> {settings?.appDataDir || 'N/A'}</div>
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