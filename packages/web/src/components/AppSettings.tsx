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
  RobotOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import {
  AppearanceSchema,
  SystemSchema,
  DesktopSchema,
  AIConfigSchema,
  MCPGatewaySchema
} from "../../../core/src/shared/jsonSchemas/appSettingsSchema.mjs";
import Schema2Form from "./schema2Form";

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

  // 使用 zodToJsonSchema 转换 Zod Schema 为 JSON Schema
  const appearanceJsonSchema = zodToJsonSchema(AppearanceSchema as any)  as any;

  const systemJsonSchema = zodToJsonSchema(SystemSchema as any)  as any;

  const desktopJsonSchema = zodToJsonSchema(DesktopSchema as any)  as any;

  const aiJsonSchema = zodToJsonSchema(AIConfigSchema as any)  as any;

  const mcpGatewaysJsonSchema = zodToJsonSchema(z.array(MCPGatewaySchema) as any) as any;

  // 创建外观设置 schema，添加中文标题
  const appearanceSchema = appearanceJsonSchema;

  // 创建系统设置 schema，添加中文标题
  const systemSchema = systemJsonSchema;

  // 创建桌面设置 schema，添加中文标题
  const desktopSchema = desktopJsonSchema;

  // 创建AI设置 schema，添加中文标题
  const aiSchema = {
    ...aiJsonSchema,
    title: t`AI Settings`,
    properties: {
      ...aiJsonSchema.properties,
      models: {
        ...aiJsonSchema.properties.models,
        title: t`AI Models`,
        description: t`Configure available AI models`,
      },
      customProviders: {
        ...aiJsonSchema.properties.customProviders,
        title: t`Custom Providers`,
        description: t`Add custom AI model providers`,
      },
      builtinApiKeys: {
        ...aiJsonSchema.properties.builtinApiKeys,
        title: t`API Keys`,
        description: t`Configure API keys for built-in providers`,
      },
      defaultModel: {
        ...aiJsonSchema.properties.defaultModel,
        title: t`Default Model`,
        description: t`Set the default AI model`,
      },
    },
  };

  // 创建MCP Gateways设置 schema，添加中文标题
  const mcpGatewaysSchema = {
    ...mcpGatewaysJsonSchema,
    title: t`MCP Gateways`,
    description: t`Configure MCP gateways for model context protocol`,
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
          onChange={(values) => handleFormChange({ ...currentValues, desktop: values })}
        />
      ),
    },
    {
      key: "ai",
      label: (
        <span>
          <RobotOutlined />
          {t`AI Settings`}
        </span>
      ),
      children: (
        <Schema2Form
          schema={aiSchema}
          value={currentValues?.ai}
          onChange={(values) => handleFormChange({ ...currentValues, ai: values })}
        />
      ),
    },
    {
      key: "mcpGateways",
      label: (
        <span>
          <ApiOutlined />
          {t`MCP Gateways`}
        </span>
      ),
      children: (
        <Schema2Form
          schema={mcpGatewaysSchema}
          value={currentValues?.mcpGateWays}
          onChange={(values) => handleFormChange({ ...currentValues, mcpGateWays: values })}
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