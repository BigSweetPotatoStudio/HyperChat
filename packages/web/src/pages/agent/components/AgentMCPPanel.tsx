/**
 * Agent MCP管理面板组件
 * 管理Agent专属的MCP客户端
 */

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  List, 
  Tag, 
  Typography, 
  message,
  Modal,
  Form,
  Input,
  Switch,
  Divider,
  Popconfirm,
  Tooltip
} from 'antd';
import { 
  ApiOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  LinkOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import { call } from '../../../common/call';
import type { IMCPClient } from '@dadigua/hyperchat-shared';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AgentMCPPanelProps {
  agentPath: string;
  agentName: string;
  mcpClients: IMCPClient[];
  onRefresh: () => Promise<void>;
}

/**
 * Agent MCP管理面板组件
 */
const AgentMCPPanel = forwardRef<any, AgentMCPPanelProps>(({
  agentPath,
  agentName,
  mcpClients,
  onRefresh
}, ref) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<IMCPClient | null>(null);
  const [form] = Form.useForm();

  /**
   * 暴露方法给父组件
   */
  useImperativeHandle(ref, () => ({
    refresh: onRefresh,
    openAddModal: () => openModal()
  }));

  /**
   * 设置加载状态
   */
  const setActionLoading = useCallback((action: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [action]: isLoading }));
  }, []);

  /**
   * 打开添加/编辑模态框
   */
  const openModal = useCallback((client?: IMCPClient) => {
    setEditingClient(client || null);
    
    if (client) {
      form.setFieldsValue({
        name: client.serverName,
        serverPath: client.config.command || '',
        args: client.config.args?.join(' ') || '',
        env: Object.entries(client.config.env || {}).map(([key, value]) => ({ key, value })),
        enabled: client.status === 'connected'
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
        env: [{ key: '', value: '' }]
      });
    }
    
    setModalVisible(true);
  }, [form]);

  /**
   * 保存MCP客户端
   */
  const saveMCPClient = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setActionLoading('save', true);

      // 处理环境变量
      const env: Record<string, string> = {};
      if (values.env) {
        values.env.forEach((item: any) => {
          if (item.key && item.value) {
            env[item.key] = item.value;
          }
        });
      }

      const serverConfig = {
        type: 'stdio' as const,
        command: values.serverPath,
        args: values.args ? values.args.split(' ').filter(Boolean) : [],
        env,
        disabled: !values.enabled
      };

      // 调用Agent级别的MCP管理API
      if (editingClient) {
        // 更新现有客户端
        await call('setAgentMcpServerConfig', {
          agentName,
          serverName: values.name,
          serverConfig
        });
        message.success(t`MCP client updated`);
      } else {
        // 添加新客户端
        await call('setAgentMcpServerConfig', {
          agentName,
          serverName: values.name,
          serverConfig
        });
        message.success(t`MCP client added`);
      }

      setModalVisible(false);
      await onRefresh();
    } catch (error) {
      console.error('Save MCP client error:', error);
      message.error(t`Failed to save MCP client`);
    } finally {
      setActionLoading('save', false);
    }
  }, [form, editingClient, agentName, onRefresh, setActionLoading]);

  /**
   * 删除MCP客户端
   */
  const deleteMCPClient = useCallback(async (clientId: string) => {
    try {
      setActionLoading(`delete_${clientId}`, true);
      
      // 调用Agent级别的MCP删除API
      await call('deleteAgentMcpServerConfig', {
        agentName,
        serverName: clientId
      });

      message.success(t`MCP client deleted`);
      await onRefresh();
    } catch (error) {
      console.error('Delete MCP client error:', error);
      message.error(t`Failed to delete MCP client`);
    } finally {
      setActionLoading(`delete_${clientId}`, false);
    }
  }, [agentName, onRefresh, setActionLoading]);

  /**
   * 启动/停止MCP客户端
   */
  const toggleMCPClient = useCallback(async (clientId: string, enabled: boolean) => {
    try {
      setActionLoading(`toggle_${clientId}`, true);
      
      // 调用Agent级别的MCP重启API
      await call('restartAgentMcpClient', {
        agentName,
        clientName: clientId
      });

      message.success(enabled ? t`MCP client started` : t`MCP client stopped`);
      await onRefresh();
    } catch (error) {
      console.error('Toggle MCP client error:', error);
      message.error(t`Failed to toggle MCP client`);
    } finally {
      setActionLoading(`toggle_${clientId}`, false);
    }
  }, [agentName, onRefresh, setActionLoading]);

  /**
   * 渲染MCP客户端列表项
   */
  const renderMCPClient = useCallback((client: IMCPClient) => {
    const isConnected = client.status === 'connected';
    const isEnabled = client.status === 'connected';
    
    return (
      <List.Item
        key={client.serverName}
        actions={[
          <Tooltip title={isEnabled ? t`Stop` : t`Start`} key="toggle">
            <Button
              type="text"
              size="small"
              icon={isEnabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => toggleMCPClient(client.serverName, !isEnabled)}
              loading={loading[`toggle_${client.serverName}`]}
              style={{ color: isEnabled ? '#ff4d4f' : '#52c41a' }}
            />
          </Tooltip>,
          <Tooltip title={t`Edit`} key="edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(client)}
            />
          </Tooltip>,
          <Popconfirm
            title={t`Are you sure to delete this MCP client?`}
            onConfirm={() => deleteMCPClient(client.serverName)}
            okText={t`Yes`}
            cancelText={t`No`}
            key="delete"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              loading={loading[`delete_${client.serverName}`]}
            />
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            <div style={{ 
              width: '32px', 
              height: '32px',
              borderRadius: '16px',
              backgroundColor: isConnected ? '#f6ffed' : '#fff2e8',
              border: `2px solid ${isConnected ? '#52c41a' : '#faad14'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isConnected ? (
                <LinkOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
              ) : (
                <DisconnectOutlined style={{ color: '#faad14', fontSize: '14px' }} />
              )}
            </div>
          }
          title={
            <Space>
              <Text strong style={{ fontSize: '13px' }}>
                {client.serverName}
              </Text>
              <Tag 
                color={isConnected ? 'success' : 'warning'}
              >
                {isConnected ? t`Connected` : t`Disconnected`}
              </Tag>
              {!isEnabled && (
                <Tag color="default">
                  {t`Disabled`}
                </Tag>
              )}
            </Space>
          }
          description={
            <div style={{ fontSize: '11px' }}>
              <div style={{ color: '#666', marginBottom: '2px' }}>
                📍 {client.config.command}
              </div>
              {client.config.args && client.config.args.length > 0 && (
                <div style={{ color: '#666', marginBottom: '2px' }}>
                  🔧 {client.config.args.join(' ')}
                </div>
              )}
              <div style={{ color: '#999' }}>
                {client.mcpType} • v{client.version}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  }, [loading, openModal, toggleMCPClient, deleteMCPClient]);

  return (
    <div style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      {/* 操作按钮 */}
      <Card size="small" style={{ marginBottom: '12px' }}>
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            {t`Add MCP Client`}
          </Button>
          <Text style={{ fontSize: '11px', color: '#666' }}>
            {mcpClients.length} {t`clients`}
          </Text>
        </Space>
      </Card>

      {/* MCP客户端列表 */}
      <Card size="small" title={t`MCP Clients`}>
        {mcpClients.length > 0 ? (
          <List
            size="small"
            dataSource={mcpClients}
            renderItem={renderMCPClient}
            style={{ marginTop: '8px' }}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '40px 20px',
            fontSize: '13px'
          }}>
            <ApiOutlined style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }} />
            <div style={{ marginBottom: '8px' }}>
              {t`No MCP clients configured`}
            </div>
            <Button 
              type="link" 
              size="small" 
              onClick={() => openModal()}
            >
              {t`Add first MCP client`}
            </Button>
          </div>
        )}
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingClient ? t`Edit MCP Client` : t`Add MCP Client`}
        open={modalVisible}
        onOk={saveMCPClient}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading.save}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          size="small"
        >
          <Form.Item
            name="name"
            label={t`Client Name`}
            rules={[{ required: true, message: t`Please enter client name` }]}
          >
            <Input placeholder={t`Enter a friendly name for this MCP client`} />
          </Form.Item>

          <Form.Item
            name="serverPath"
            label={t`Server Path`}
            rules={[{ required: true, message: t`Please enter server path` }]}
          >
            <Input placeholder={t`e.g., /path/to/mcp-server or npm package name`} />
          </Form.Item>

          <Form.Item
            name="args"
            label={t`Arguments`}
          >
            <Input placeholder={t`Command line arguments (space separated)`} />
          </Form.Item>

          <Form.Item
            name="enabled"
            label={t`Enabled`}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider orientation="left" style={{ fontSize: '12px' }}>
            {t`Environment Variables`}
          </Divider>

          <Form.List name="env">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'key']}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <Input placeholder={t`Variable name`} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      style={{ marginBottom: 0, flex: 1 }}
                    >
                      <Input placeholder={t`Variable value`} />
                    </Form.Item>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      size="small"
                    />
                  </Space>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    {t`Add environment variable`}
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
});

AgentMCPPanel.displayName = 'AgentMCPPanel';

export default AgentMCPPanel;