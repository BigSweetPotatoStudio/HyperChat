import React, { useState, useEffect, useCallback } from 'react';
import {
  Space,
  Button,
  Table,
  Popover,
  Popconfirm,
  Form,
  Modal,
  Input,
  Select,
  message,
  FormInstance,
  Tag,
  Empty,
  Card,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { t } from '../i18n';

/**
 * MCP Gateway 数据类型
 */
interface MCPGateway {
  /** 网关名称 */
  name: string;
  /** 网关描述 */
  description?: string;
  /** 允许的 MCP 服务列表 */
  allowMCPs: string[];
}

/**
 * 网关表单值类型
 */
interface GatewayFormValues {
  /** 网关名称 */
  name: string;
  /** 网关描述（可选） */
  description?: string;
  /** 允许的 MCP 服务列表 */
  allowMCPs: string[];
  /** 用于编辑时标识的键值（可选） */
  key?: string;
}

/**
 * MCP Gateways 设置组件属性
 */
interface MCPGatewaysSettingsProps {
  /** MCP Gateways 配置数据 */
  gateways: MCPGateway[];
  /** 更新配置的回调函数 */
  onUpdate: (gateways: MCPGateway[]) => Promise<void>;
  /** 可用的 MCP 服务列表 */
  availableMCPs?: string[];
}

/**
 * MCP Gateways 设置管理组件
 */
export function MCPGatewaysSettings({
  gateways = [],
  onUpdate,
  availableMCPs = [],
}: MCPGatewaysSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<MCPGateway | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 创建新的网关
   */
  const handleCreate = () => {
    setEditingGateway(null);
    setIsModalOpen(true);
  };

  /**
   * 编辑现有网关
   */
  const handleEdit = (gateway: MCPGateway) => {
    setEditingGateway(gateway);
    setIsModalOpen(true);
  };

  /**
   * 删除网关
   */
  const handleDelete = async (name: string) => {
    try {
      setLoading(true);
      const newGateways = gateways.filter(g => g.name !== name);
      await onUpdate(newGateways);
      message.success(t`Gateway deleted successfully`);
    } catch (error: any) {
      message.error(t`Delete failed: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 保存网关（创建或更新）
   */
  const handleSave = async (values: GatewayFormValues) => {
    try {
      setLoading(true);
      let newGateways = [...gateways];

      if (editingGateway) {
        // 更新现有网关
        const index = newGateways.findIndex(g => g.name === editingGateway.name);
        if (index !== -1) {
          newGateways[index] = {
            name: values.name,
            description: values.description,
            allowMCPs: values.allowMCPs,
          };
        }
      } else {
        // 检查名称是否已存在
        if (newGateways.some(g => g.name === values.name)) {
          message.error(t`Gateway name already exists`);
          return;
        }
        // 创建新网关
        newGateways.push({
          name: values.name,
          description: values.description,
          allowMCPs: values.allowMCPs,
        });
      }

      await onUpdate(newGateways);
      setIsModalOpen(false);
      message.success(editingGateway ? t`Gateway updated successfully` : t`Gateway created successfully`);
    } catch (error: any) {
      message.error(t`Operation failed: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 复制网关配置到剪贴板
   */
  const handleCopy = async (gateway: MCPGateway) => {
    try {
      const configText = JSON.stringify(gateway, null, 2);
      await navigator.clipboard.writeText(configText);
      message.success(t`Configuration copied to clipboard`);
    } catch (error) {
      message.error(t`Failed to copy configuration`);
    }
  };

  /**
   * 表格列配置
   */
  const columns = [
    {
      title: t`Gateway Name`,
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: MCPGateway) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: t`Allowed MCPs`,
      dataIndex: 'allowMCPs',
      key: 'allowMCPs',
      render: (allowMCPs: string[]) => (
        <div>
          {allowMCPs.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allowMCPs.slice(0, 3).map(mcp => (
                <Tag key={mcp}>{mcp}</Tag>
              ))}
              {allowMCPs.length > 3 && (
                <Popover
                  content={
                    <div style={{ maxWidth: 300 }}>
                      {allowMCPs.slice(3).map(mcp => (
                        <Tag key={mcp} style={{ margin: 2 }}>{mcp}</Tag>
                      ))}
                    </div>
                  }
                >
                  <Tag>+{allowMCPs.length - 3}</Tag>
                </Popover>
              )}
            </div>
          ) : (
            <span style={{ color: '#999' }}>{t`No MCP configured`}</span>
          )}
        </div>
      ),
    },
    {
      title: t`Actions`,
      key: 'actions',
      width: 150,
      render: (_, record: MCPGateway) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            {t`Edit`}
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record)}
          />
          <Popconfirm
            title={t`Are you sure to delete this gateway?`}
            onConfirm={() => handleDelete(record.name)}
            okText={t`Yes`}
            cancelText={t`No`}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              {t`Delete`}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <ApiOutlined />
            {t`MCP Gateways Management`}
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t`Create Gateway`}
          </Button>
        }
      >
        {gateways.length > 0 ? (
          <Table
            dataSource={gateways}
            columns={columns}
            rowKey="name"
            pagination={false}
            loading={loading}
          />
        ) : (
          <Empty
            description={t`No gateways configured`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t`Create First Gateway`}
            </Button>
          </Empty>
        )}
      </Card>

      {/* 创建/编辑网关模态框 */}
      <GatewayModal
        open={isModalOpen}
        gateway={editingGateway}
        availableMCPs={availableMCPs}
        onSave={handleSave}
        onCancel={() => setIsModalOpen(false)}
        loading={loading}
      />
    </div>
  );
}

/**
 * 网关表单模态框组件属性
 */
interface GatewayModalProps {
  /** 模态框是否打开 */
  open: boolean;
  /** 正在编辑的网关（null 表示创建新网关） */
  gateway: MCPGateway | null;
  /** 可用的 MCP 服务列表 */
  availableMCPs: string[];
  /** 保存网关的回调函数 */
  onSave: (values: GatewayFormValues) => Promise<void>;
  /** 取消操作的回调函数 */
  onCancel: () => void;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 网关表单模态框组件
 */
const GatewayModal: React.FC<GatewayModalProps> = ({
  open,
  gateway,
  availableMCPs,
  onSave,
  onCancel,
  loading,
}) => {
  const [form] = Form.useForm<GatewayFormValues>();

  // 当模态框打开时，设置表单初始值
  useEffect(() => {
    if (open) {
      if (gateway) {
        form.setFieldsValue({
          name: gateway.name,
          description: gateway.description || '',
          allowMCPs: gateway.allowMCPs || [],
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, gateway, form]);

  /**
   * 处理表单提交
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSave(values);
    } catch (error) {
      console.log('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={gateway ? t`Edit Gateway` : t`Create Gateway`}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          description: '',
          allowMCPs: [],
        }}
      >
        <Form.Item
          name="name"
          label={t`Gateway Name`}
          rules={[
            { required: true, message: t`Please enter gateway name` },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: t`Only letters, numbers, underscore and dash are allowed`,
            },
          ]}
        >
          <Input
            placeholder={t`Enter gateway name`}
            disabled={!!gateway} // 编辑时不允许修改名称
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={t`Description`}
        >
          <Input.TextArea
            placeholder={t`Enter gateway description (optional)`}
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="allowMCPs"
          label={t`Allowed MCPs`}
          rules={[
            { required: true, message: t`Please select at least one MCP service` },
          ]}
        >
          <Select
            mode="multiple"
            placeholder={t`Select MCP services`}
            options={availableMCPs.map(mcp => ({
              label: mcp,
              value: mcp,
            }))}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MCPGatewaysSettings;