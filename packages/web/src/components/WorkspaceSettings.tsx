import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Divider,
  Typography,
  Alert,
  message,
  Tabs,
  Row,
  Col,
  Select,
  Slider,
  Switch,
  InputNumber,
  TreeSelect,
  DatePicker,
} from "antd";
import {
  FolderOutlined,
  SaveOutlined,
  ReloadOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";
import { WorkspaceSettings, AISettings, IMCPClient } from "@dadigua/hyperchat-shared";
import type { z } from "zod";
import { useAISettings } from "../contexts/AppSettingsContext";
import dayjs from "dayjs";

const { Text } = Typography;

interface WorkspaceSettingsProps {
  settings: WorkspaceSettings;
  onUpdate: (updates: Partial<WorkspaceSettings>) => Promise<void>;
  onReset?: () => Promise<void>;
  mcpClients?: IMCPClient[];
}

export function WorkspaceSettings({
  settings,
  onUpdate,
  onReset,
  mcpClients,
}: WorkspaceSettingsProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("workspace");
  const [hasChanges, setHasChanges] = useState(false);
  const { aiSettings } = useAISettings();

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


  if (!settings) {
    return null;
  }

  // 格式化创建时间
  const formatCreationTime = (timestamp?: number) => {
    if (!timestamp) return t`Unknown`;
    return new Date(timestamp).toLocaleString();
  };

  const tabItems = [
    {
      key: "workspace",
      label: (
        <span>
          <FolderOutlined />
          {t`Workspace`}
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              label={t`Workspace Name`}
              name={["workspace", "name"]}
              rules={[
                { required: true, message: t`Please enter workspace name` }
              ]}
            >
              <Input placeholder={t`Enter workspace name`} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t`Created Time`}
              name={["workspace", "created"]}
              getValueFromEvent={(date) => date ? date.valueOf() : undefined}
              getValueProps={(value) => ({
                value: value ? dayjs(value) : undefined
              })}
            >
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder={t`Select creation time`}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={t`Description`}
              name={["workspace", "description"]}
            >
              <Input.TextArea
                rows={3}
                placeholder={t`Enter workspace description (optional)`}
              />
            </Form.Item>
          </Col>
        </Row>
      ),
    },
    {
      key: "aiConfig",
      label: (
        <span>
          <RobotOutlined />
          {t`AI Config`}
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              label={t`System Prompt`}
              name={["aiConfig", "prompt"]}
              tooltip={t`AI system prompt for this workspace`}
            >
              <Input.TextArea
                rows={4}
                placeholder={t`Enter AI system prompt (optional)`}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t`Temperature`}
              name={["aiConfig", "temperature"]}
              tooltip={t`AI response temperature (0-2, higher values make output more random)`}
            >
              <Slider
                min={0}
                max={2}
                step={0.1}
                marks={{
                  0: '0',
                  1: '1',
                  2: '2'
                }}
                tooltip={{ formatter: (value) => value?.toFixed(1) }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t`Max Tokens`}
              name={["aiConfig", "maxTokens"]}
              tooltip={t`Maximum tokens for AI response (100-32000)`}
            >
              <InputNumber
                min={100}
                max={32000}
                step={100}
                style={{ width: '100%' }}
                placeholder="4000"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t`Max Attached Dialogs`}
              name={["aiConfig", "maxAttachedDialogs"]}
              tooltip={t`Maximum number of attached dialog histories (0-100)`}
            >
              <InputNumber
                min={0}
                max={100}
                step={1}
                style={{ width: '100%' }}
                placeholder="10"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t`Confirm Tool Calls`}
              name={["aiConfig", "isConfirmCallTool"]}
              valuePropName="checked"
              tooltip={t`Whether to confirm before calling tools`}
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={t`Allowed MCP Servers`}
              name={["aiConfig", "allowMCPs"]}
              tooltip={t`List of allowed MCP server names`}
            >
              <TreeSelect
                multiple
                allowClear
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_PARENT}
                placeholder={t`Select allowed MCP servers`}
                treeData={mcpClients?.map(client => ({
                  title: client.serverName,
                  value: client.serverName,
                  key: client.serverName,
                })) || []}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label={t`Model Key`}
              name={["aiConfig", "modelKey"]}
              tooltip={t`AI model key/identifier`}
            >
              <Select
                placeholder={t`Select AI model (optional)`}
                allowClear
                showSearch
                style={{ width: '100%' }}
              >
                {aiSettings?.models?.map(model => (
                  <Select.Option key={model.key} value={model.key}>
                    {model.name} ({model.provider})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
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