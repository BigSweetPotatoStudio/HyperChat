import React, { useState, useEffect } from 'react';
import {
  Space,
  Button,
  Table,
  Popover,
  Popconfirm,
  Form,
  Modal,
  Input,
  message,
  Tag,
  Empty,
  Card,
  TreeSelect,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import { t } from '../i18n';
import { getURL_PRE } from '../common/call';
import { setClipboardText } from '../common/util';
import { convertTreeSelectionToMCPConfig, convertMCPConfigToTreeSelection } from '../utils/mcpUtils';
import { IMCPClient } from '@dadigua/hyperchat-shared';

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
  /** 阻止的 MCP 工具列表 */
  blockMCPTools: string[];
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
  /** 阻止的 MCP 工具列表 */
  blockMCPTools: string[];
  /** 用于编辑时标识的键值（可选） */
  key?: string;
}

// 移除本地定义的接口，使用shared包中的IMCPClient

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
  /** MCP 客户端列表 */
  mcpClients?: IMCPClient[];
}

/**
 * MCP Gateways 设置管理组件
 */
export function MCPGatewaysSettings({
  gateways = [],
  onUpdate,
  availableMCPs = [],
  mcpClients = [],
}: MCPGatewaysSettingsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<MCPGateway | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * 生成网关相关的 URLs
   */
  const generateGatewayUrls = (gatewayName: string) => {
    const baseUrl = getURL_PRE();
    const gatewayPath = gatewayName;
    return {
      sse: `${baseUrl}/mcp/${gatewayPath}/sse`,
      streamableHttp: `${baseUrl}/mcp/${gatewayPath}/mcp`
    };
  };

  /**
   * 复制到剪贴板的处理函数
   */
  const handleCopyToClipboard = async (text: string) => {
    try {
      await setClipboardText({ text });
      message.success(t`Copied to clipboard`);
    } catch (error) {
      message.error(t`Failed to copy to clipboard`);
    }
  };

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
            blockMCPTools: values.blockMCPTools,
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
          blockMCPTools: values.blockMCPTools,
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
      render: (_: any, record: MCPGateway) => (
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
        mcpClients={mcpClients}
        onSave={handleSave}
        onCancel={() => setIsModalOpen(false)}
        loading={loading}
        generateGatewayUrls={(gatewayName?: string) => generateGatewayUrls(gatewayName || '')}
        handleCopyToClipboard={handleCopyToClipboard}
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
  /** MCP 客户端列表 */
  mcpClients: IMCPClient[];
  /** 保存网关的回调函数 */
  onSave: (values: GatewayFormValues) => Promise<void>;
  /** 取消操作的回调函数 */
  onCancel: () => void;
  /** 加载状态 */
  loading: boolean;
  /** 生成网关 URLs 的函数 */
  generateGatewayUrls: (gatewayName?: string) => { sse: string; streamableHttp: string };
  /** 复制到剪贴板的处理函数 */
  handleCopyToClipboard: (text: string) => Promise<void>;
}

/**
 * 网关表单模态框组件
 */
const GatewayModal: React.FC<GatewayModalProps> = ({
  open,
  gateway,
  mcpClients,
  onSave,
  onCancel,
  loading,
  generateGatewayUrls,
  handleCopyToClipboard,
}) => {
  const [form] = Form.useForm<GatewayFormValues>();
  const [currentGatewayName, setCurrentGatewayName] = useState<string>('');

  // 当模态框打开时，设置表单初始值
  useEffect(() => {
    if (open) {
      if (gateway) {
        // 编辑模式：使用转换函数将 allowMCPs 和 blockMCPTools 转换为 TreeSelect 格式
        const allowMCPs = gateway.allowMCPs || [];
        const blockMCPTools = gateway.blockMCPTools || [];
        const combinedSelection = convertMCPConfigToTreeSelection(allowMCPs, blockMCPTools, mcpClients);
        
        const initialValues = {
          name: gateway.name,
          description: gateway.description || '',
          allowMCPs: combinedSelection,
        };
        form.setFieldsValue(initialValues);
        setCurrentGatewayName(gateway.name);
      } else {
        form.resetFields();
        setCurrentGatewayName('');
      }
    }
  }, [open, gateway, form, mcpClients]);

  /**
   * 处理表单提交
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 使用转换函数将 TreeSelect 选中值转换为 allowMCPs 和 blockMCPTools
      const selectedValues = values.allowMCPs || [];
      const { allowMCPs, blockMCPTools } = convertTreeSelectionToMCPConfig(selectedValues, mcpClients);
      
      const gatewayValues = {
        ...values,
        allowMCPs,
        blockMCPTools,
      };
      
      await onSave(gatewayValues);
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
      destroyOnHidden
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
            onChange={(e) => setCurrentGatewayName(e.target.value)}
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

        {/* MCP 服务选择 */}
        <Form.Item
          name="allowMCPs"
          label={t`allowMCPs`}
          rules={[{ required: true, message: t`Please select allowed MCP` }]}
        >
          <TreeSelect
            multiple
            treeCheckable
            placeholder={t`Please select allowed MCP`}
            // showCheckedStrategy={TreeSelect.SHOW_PARENT}
            treeData={mcpClients.filter(x => x.status != "disabled").map((x) => {
              return {
                title: x.serverName,
                key: x.serverName,
                value: x.serverName,
                children: x.tools.map((tool) => {
                  return {
                    title: (
                      <Popover title={tool.description}>
                        <span>{tool.originalName || tool.name}</span>
                      </Popover>
                    ),
                    key: tool.displayName,
                    value: tool.displayName,
                  };
                }),
              };
            })}
          />
        </Form.Item>

        {/* SSE 连接地址展示和复制 */}
        <Form.Item label="sse">
          <Input
            disabled
            value={currentGatewayName ? generateGatewayUrls(currentGatewayName).sse : ''}
            addonAfter={
              <CopyOutlined
                onClick={() => currentGatewayName && handleCopyToClipboard(generateGatewayUrls(currentGatewayName).sse)}
              />
            }
          />
        </Form.Item>

        {/* HTTP 流式连接地址展示和复制 */}
        <Form.Item label="streamableHttp">
          <Input
            disabled
            value={currentGatewayName ? generateGatewayUrls(currentGatewayName).streamableHttp : ''}
            addonAfter={
              <CopyOutlined
                onClick={() => currentGatewayName && handleCopyToClipboard(generateGatewayUrls(currentGatewayName).streamableHttp)}
              />
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MCPGatewaysSettings;