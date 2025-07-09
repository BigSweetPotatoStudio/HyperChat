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
  Input,
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
  LockOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";

const { Title, Text } = Typography;
const { Password } = Input;

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
            label={t`Dark Theme`}
            name={["appearance", "darkTheme"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Theme Mode`}
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
                { value: "zhCN", label: "中文" },
                { value: "enUS", label: "English" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t`Close Action`}
            name={["appearance", "closeAction"]}
          >
            <Select
              placeholder={t`Select close action`}
              allowClear
              options={[
                { value: "minimize", label: t`Minimize to tray` },
                { value: "exit", label: t`Exit application` },
              ]}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: "network",
      label: (
        <span>
          <GlobalOutlined />
          {t`Network`}
        </span>
      ),
      children: (
        <>
          <Form.Item
            label={t`Browser Network Setting`}
            name={["network", "browserNetworkSetting"]}
          >
            <Select
              options={[
                { value: "server-proxy", label: t`Server Proxy` },
                { value: "direct", label: t`Direct Connection` },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t`Auto Sync`}
            name={["network", "autoSync"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Card title={t`WebDAV Settings`} size="small" style={{ marginTop: 16 }}>
            <Form.Item
              label={t`WebDAV URL`}
              name={["network", "webdav", "url"]}
            >
              <Input placeholder="https://example.com/webdav" />
            </Form.Item>

            <Form.Item
              label={t`Username`}
              name={["network", "webdav", "username"]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t`Password`}
              name={["network", "webdav", "password"]}
            >
              <Password />
            </Form.Item>

            <Form.Item
              label={t`Base Directory`}
              name={["network", "webdav", "baseDirName"]}
            >
              <Input placeholder="HyperChat" />
            </Form.Item>
          </Card>
        </>
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
        <>
          <Form.Item
            label={t`Application Password`}
            name={["system", "password"]}
          >
            <Password />
          </Form.Item>

          <Form.Item
            label={t`Run Task`}
            name={["system", "runTask"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Load Claude Config`}
            name={["system", "isLoadClaudeConfig"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Card title={t`Window Settings`} size="small" style={{ marginTop: 16 }}>
            <Form.Item
              label={t`Window Width`}
              name={["system", "windowSize", "width"]}
            >
              <InputNumber
                min={800}
                max={4000}
                step={10}
                addonAfter="px"
              />
            </Form.Item>

            <Form.Item
              label={t`Window Height`}
              name={["system", "windowSize", "height"]}
            >
              <InputNumber
                min={600}
                max={3000}
                step={10}
                addonAfter="px"
              />
            </Form.Item>
          </Card>
        </>
      ),
    },
    {
      key: "developer",
      label: (
        <span>
          <ExperimentOutlined />
          {t`Developer`}
        </span>
      ),
      children: (
        <>
          <Alert
            message={t`Developer Settings`}
            description={t`These settings are for developers and advanced users. Use with caution.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            label={t`Developer Mode`}
            name={["system", "isDeveloper"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Enable Debug Mode`}
            name={["developer", "enableDebugMode"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Enable Telemetry`}
            name={["developer", "enableTelemetry"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Experimental Features`}
            name={["developer", "experimentalFeatures"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label={t`Show Advanced Options`}
            name={["developer", "showAdvancedOptions"]}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />
          
          <Card title={t`System Information`} size="small">
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div><strong>{t`Version`}:</strong> {settings?.version || 'N/A'}</div>
              <div><strong>{t`Platform`}:</strong> {settings?.platform || 'N/A'}</div>
              <div><strong>{t`App Data Directory`}:</strong> {settings?.appDataDir || 'N/A'}</div>
              <div><strong>{t`UUID`}:</strong> {settings?.uuid || 'N/A'}</div>
            </div>
          </Card>
        </>
      ),
    },
  ];

  return (
    <div className="app-settings">
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