import React, { useEffect, useState } from "react";
import {
  Form,
  FormInstance,
  Input,
  Button,
  Space,
  Divider,
  Card,
  Tag,
  List,
  Typography,
  Modal,
} from "antd";
import {
  FolderOpenOutlined,
  GlobalOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { t } from "../../i18n";

const { Text } = Typography;

interface Values {
  path: string;
}

interface CollectionCreateFormProps {
  initialValues: Values;
  onFormInstanceReady: (instance: FormInstance<Values>) => void;
  selectedPath: string;
  onDirectoryBrowserOpen: () => void;
  globalWorkspacePath: string;
  workspaceHistory: Array<{
    path: string;
    name: string;
    lastUsed: number;
  }>;
  onPathSelect: (path: string) => void;
  onHistoryRemove: (path: string) => void;
}

const ModalForm: React.FC<CollectionCreateFormProps> = ({
  initialValues,
  onFormInstanceReady,
  selectedPath,
  onDirectoryBrowserOpen,
  globalWorkspacePath,
  workspaceHistory,
  onPathSelect,
  onHistoryRemove,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    onFormInstanceReady(form);
  }, [form, onFormInstanceReady]);

  return (
    <Form form={form} name="workspace_open_form" layout="vertical" initialValues={initialValues}>
      <Form.Item
        label={t`Folder Path`}
        name="path"
        rules={[{ required: true, message: t`Please select folder path` }]}
        extra={t`Choose a project folder to work with. If it's not a workspace, you can create one.`}
      >
        <Space.Compact style={{ width: "100%" }}>
          <Input
            style={{ width: "calc(100% - 100px)" }}
            placeholder={t`Choose project folder...`}
            value={selectedPath || form.getFieldValue('path') || ''}
            readOnly
          />
          <Button
            icon={<FolderOpenOutlined />}
            onClick={onDirectoryBrowserOpen}
          >
            {t`Select Directory`}
          </Button>
        </Space.Compact>
      </Form.Item>

      {/* 全局工作区快速选择 */}
      <Divider orientation="left">
        <Space>
          <GlobalOutlined />
          <span>{t`Global Workspace`}</span>
        </Space>
      </Divider>
      <Card
        size="small"
        style={{ marginBottom: 16, cursor: 'pointer' }}
        hoverable
        onClick={() => {
          if (globalWorkspacePath) {
            form.setFieldsValue({ path: globalWorkspacePath });
            onPathSelect(globalWorkspacePath);
          }
        }}
      >
        <Card.Meta
          avatar={<GlobalOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
          title={
            <Space>
              <span>{t`Global Workspace`}</span>
              <Tag color="blue">{t`Default`}</Tag>
            </Space>
          }
          description={
            <div>
              <Text type="secondary">{globalWorkspacePath}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t`Contains global agents, MCP tools and configurations`}
              </Text>
            </div>
          }
        />
      </Card>

      {/* 历史记录 */}
      {workspaceHistory.length > 0 && (
        <>
          <Divider orientation="left">
            <Space>
              <HistoryOutlined />
              <span>{t`Recent Workspaces`}</span>
            </Space>
          </Divider>
          <List
            size="small"
            dataSource={workspaceHistory}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '8px 0' }}
                onClick={() => {
                  form.setFieldsValue({ path: item.path });
                  onPathSelect(item.path);
                }}
                actions={[
                  <Button
                    key="remove"
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onHistoryRemove(item.path);
                    }}
                    title={t`Remove from history`}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={<FolderOpenOutlined />}
                  title={
                    <Space>
                      <span>{item.name}</span>
                      <Tag color="blue">
                        <ClockCircleOutlined />
                        {new Date(item.lastUsed).toLocaleDateString()}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.path}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </>
      )}
    </Form>
  );
};

interface CollectionCreateFormModalProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
  initialValues?: Values;
  selectedPath: string;
  onDirectoryBrowserOpen: () => void;
  globalWorkspacePath: string;
  workspaceHistory: Array<{
    path: string;
    name: string;
    lastUsed: number;
  }>;
  onPathSelect: (path: string) => void;
  onHistoryRemove: (path: string) => void;
}

export const WorkspaceOpenModal: React.FC<CollectionCreateFormModalProps> = ({
  open,
  onCreate,
  onCancel,
  initialValues = { path: '' },
  selectedPath,
  onDirectoryBrowserOpen,
  globalWorkspacePath,
  workspaceHistory,
  onPathSelect,
  onHistoryRemove,
}) => {
  const [formInstance, setFormInstance] = useState<FormInstance>();

  return (
    <Modal
      title={t`Switch Workspace`}
      open={open}
      onCancel={onCancel}
      onOk={async () => {
        try {
          const values = await formInstance?.validateFields();
          formInstance?.resetFields();
          onCreate(values);
        } catch (error) {
          console.log("Failed:", error);
        }
      }}
    >
      <ModalForm
        initialValues={initialValues}
        onFormInstanceReady={(instance) => {
          setFormInstance(instance);
        }}
        selectedPath={selectedPath}
        onDirectoryBrowserOpen={onDirectoryBrowserOpen}
        globalWorkspacePath={globalWorkspacePath}
        workspaceHistory={workspaceHistory}
        onPathSelect={onPathSelect}
        onHistoryRemove={onHistoryRemove}
      />
    </Modal>
  );
};