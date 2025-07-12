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
} from "antd";
import {
  FolderOutlined,
  SaveOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { t } from "../i18n";
import { WorkspaceSettingsSchema } from "@dadigua/hyperchat-shared/jsonSchemas/workspaceSettingsSchema";
import type { z } from "zod";

const { Text } = Typography;

interface WorkspaceSettingsProps {
  settings: z.infer<typeof WorkspaceSettingsSchema>;
  onUpdate: (updates: Partial<z.infer<typeof WorkspaceSettingsSchema>>) => Promise<void>;
  onReset?: () => Promise<void>;
}

export function WorkspaceSettings({
  settings,
  onUpdate,
  onReset,
}: WorkspaceSettingsProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("workspace");
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
            >
              <Input
                value={formatCreationTime(settings.workspace?.created)}
                disabled
                placeholder={t`Unknown`}
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