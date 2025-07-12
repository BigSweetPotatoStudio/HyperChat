import React, { useState, useEffect } from "react";
import {
  Form,
  Switch,
  Select,
  InputNumber,
  Tabs,
  Button,
  Space,
  Divider,
  Typography,
  Alert,
  message,
} from "antd";
import {
  AppstoreOutlined,
  EditOutlined,
  CodeOutlined,
  ExperimentOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";
import { WorkspaceSettingsSchema } from "@dadigua/hyperchat-shared/jsonSchemas/workspaceSettingsSchema";
import type { z } from "zod";

const { Text } = Typography;

interface WorkspaceSettingsProps {
  settings: z.infer<typeof WorkspaceSettingsSchema>;
  onUpdate: (updates: Partial<z.infer<typeof WorkspaceSettingsSchema>>) => Promise<void>;
  onReset?: () => Promise<void>;
  onExport?: () => Promise<void>;
  onImport?: (settingsJson: string) => Promise<void>;
}

export function WorkspaceSettings({
  settings,
  onUpdate,
  onReset,
  onExport,
  onImport,
}: WorkspaceSettingsProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("appearance");
  const [hasChanges, setHasChanges] = useState(false);

  // 监听设置变化
  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
      setHasChanges(false);
    }
  }, [settings, form]);

  // 处理表单值变化
  const handleFormChange = () => {
    setHasChanges(true);
  };

  // 保存设置
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await onUpdate(values);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
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
        <>
          <Form.Item
            label={t`Dark Mode`}
            name={["appearance", "isDarkMode"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Theme`}
            name={["appearance", "theme"]}
          >
            <Select
              options={[
                { value: "light", label: t`Light` },
                { value: "dark", label: t`Dark` },
                { value: "auto", label: t`Auto` },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t`Font Size`}
            name={["appearance", "fontSize"]}
          >
            <Select
              options={[
                { value: "small", label: t`Small` },
                { value: "medium", label: t`Medium` },
                { value: "large", label: t`Large` },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t`Language`}
            name={["appearance", "language"]}
          >
            <Select
              options={[
                { value: "zh-CN", label: "中文" },
                { value: "en-US", label: "English" },
              ]}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: "editor",
      label: (
        <span>
          <EditOutlined />
          {t`Editor`}
        </span>
      ),
      children: (
        <>
          <Form.Item
            label={t`Auto Save`}
            name={["editor", "autoSave"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Auto Save Delay (ms)`}
            name={["editor", "autoSaveDelay"]}
            dependencies={[["editor", "autoSave"]]}
          >
            <InputNumber
              min={1000}
              max={60000}
              step={1000}
              disabled={!form.getFieldValue(["editor", "autoSave"])}
            />
          </Form.Item>

          <Form.Item
            label={t`Word Wrap`}
            name={["editor", "wordWrap"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Tab Size`}
            name={["editor", "tabSize"]}
          >
            <Select
              options={[
                { value: 2, label: "2" },
                { value: 4, label: "4" },
                { value: 8, label: "8" },
              ]}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: "ai",
      label: (
        <span>
          <CodeOutlined />
          {t`AI`}
        </span>
      ),
      children: (
        <>
          <Form.Item
            label={t`Default Model`}
            name={["ai", "defaultModel"]}
          >
            <Select
              placeholder={t`Select default AI model`}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label={t`Default Agent`}
            name={["ai", "defaultAgent"]}
          >
            <Select
              placeholder={t`Select default agent`}
              allowClear
            />
          </Form.Item>

          <Form.Item
            label={t`Temperature`}
            name={["ai", "temperature"]}
          >
            <InputNumber
              min={0}
              max={2}
              step={0.1}
              precision={1}
            />
          </Form.Item>

          <Form.Item
            label={t`Max Tokens`}
            name={["ai", "maxTokens"]}
          >
            <InputNumber
              min={100}
              max={32000}
              step={100}
            />
          </Form.Item>

          <Form.Item
            label={t`Stream Response`}
            name={["ai", "streamResponse"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </>
      ),
    },
    {
      key: "advanced",
      label: (
        <span>
          <ExperimentOutlined />
          {t`Advanced`}
        </span>
      ),
      children: (
        <>
          <Alert
            message={t`Advanced Settings`}
            description={t`These settings are for advanced users. Changing them may affect system stability.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label={t`Enable Telemetry`}
            name={["advanced", "enableTelemetry"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Debug Mode`}
            name={["advanced", "debugMode"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Experimental Features`}
            name={["advanced", "experimentalFeatures"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </>
      ),
    },
  ];

  return (
    <div className="workspace-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onValuesChange={handleFormChange}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
        />
      </Form>

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