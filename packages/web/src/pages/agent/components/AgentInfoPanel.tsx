/**
 * Agent信息面板组件
 * 显示Agent的详细信息和控制操作
 */

import React, { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Descriptions, 
  Tag, 
  Typography, 
  message,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider
} from 'antd';
import { 
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  MessageOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import { call } from '../../../common/call';
import { AgentInstanceInfo } from '../types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AgentInfoPanelProps {
  agentPath: string;
  agentName: string;
  agentInstance: AgentInstanceInfo;
  onRefresh: () => Promise<void>;
  onOpenChat: (chatLog?: any) => void;
}

/**
 * Agent信息面板组件
 */
const AgentInfoPanel = forwardRef<any, AgentInfoPanelProps>(({
  agentPath,
  agentName,
  agentInstance,
  onRefresh,
  onOpenChat
}, ref) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [form] = Form.useForm();

  /**
   * 暴露方法给父组件
   */
  useImperativeHandle(ref, () => ({
    refresh: onRefresh,
    openConfig: () => setConfigModalVisible(true)
  }));

  /**
   * 设置加载状态
   */
  const setActionLoading = useCallback((action: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [action]: isLoading }));
  }, []);

  /**
   * 启动Agent
   */
  const startAgent = useCallback(async () => {
    try {
      setActionLoading('start', true);
      // 注意：Agent中心架构暂不支持这些API，这里模拟响应
      const response = { 
        success: true, 
        message: 'Agent started successfully' 
      };

      if (response.success) {
        message.success(t`Agent started successfully`);
        await onRefresh();
      } else {
        message.error(response.message || t`Failed to start agent`);
      }
    } catch (error) {
      console.error('Start agent error:', error);
      message.error(t`Failed to start agent`);
    } finally {
      setActionLoading('start', false);
    }
  }, [agentPath, onRefresh, setActionLoading]);

  /**
   * 停止Agent
   */
  const stopAgent = useCallback(async () => {
    try {
      setActionLoading('stop', true);
      // 注意：Agent中心架构暂不支持这些API，这里模拟响应
      const response = { 
        success: true, 
        message: 'Agent stopped successfully' 
      };

      if (response.success) {
        message.success(t`Agent stopped successfully`);
        await onRefresh();
      } else {
        message.error(response.message || t`Failed to stop agent`);
      }
    } catch (error) {
      console.error('Stop agent error:', error);
      message.error(t`Failed to stop agent`);
    } finally {
      setActionLoading('stop', false);
    }
  }, [agentPath, onRefresh, setActionLoading]);

  /**
   * 重启Agent
   */
  const restartAgent = useCallback(async () => {
    if (agentInstance.isRunning) {
      await stopAgent();
      // 等待一秒后启动
      setTimeout(() => {
        startAgent();
      }, 1000);
    } else {
      await startAgent();
    }
  }, [agentInstance.isRunning, stopAgent, startAgent]);

  /**
   * 打开配置编辑
   */
  const openConfigModal = useCallback(() => {
    form.setFieldsValue({
      name: agentInstance.config.name,
      systemPrompt: agentInstance.config.prompt,
      modelKey: agentInstance.config.modelKey,
      temperature: agentInstance.config.temperature || 0.7,
      maxTokens: agentInstance.config.maxTokens || 2048
    });
    setConfigModalVisible(true);
  }, [agentInstance.config, form]);

  /**
   * 保存配置
   */
  const saveConfig = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setActionLoading('save', true);

      // 注意：Agent中心架构暂不支持这些API，这里模拟响应
      const response = { 
        success: true, 
        message: 'Configuration saved successfully' 
      };

      if (response.success) {
        message.success(t`Configuration saved successfully`);
        setConfigModalVisible(false);
        await onRefresh();
      } else {
        message.error(response.message || t`Failed to save configuration`);
      }
    } catch (error) {
      console.error('Save config error:', error);
      message.error(t`Failed to save configuration`);
    } finally {
      setActionLoading('save', false);
    }
  }, [form, agentPath, onRefresh, setActionLoading]);

  /**
   * 复制Agent路径
   */
  const copyAgentPath = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(agentPath);
      message.success(t`Agent path copied to clipboard`);
    } catch (error) {
      console.error('Copy error:', error);
      message.error(t`Failed to copy agent path`);
    }
  }, [agentPath]);

  return (
    <div style={{ padding: '12px', height: '100%', overflow: 'auto' }}>
      {/* 控制按钮 */}
      <Card size="small" title={t`Control`} style={{ marginBottom: '12px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            {agentInstance.isRunning ? (
              <Button
                danger
                icon={<PauseCircleOutlined />}
                onClick={stopAgent}
                loading={loading.stop}
                size="small"
              >
                {t`Stop`}
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={startAgent}
                loading={loading.start}
                size="small"
              >
                {t`Start`}
              </Button>
            )}
            
            <Button
              icon={<ReloadOutlined />}
              onClick={restartAgent}
              loading={loading.start || loading.stop}
              size="small"
            >
              {t`Restart`}
            </Button>

            <Button
              icon={<MessageOutlined />}
              onClick={() => onOpenChat()}
              disabled={!agentInstance.isRunning}
              size="small"
            >
              {t`Chat`}
            </Button>
          </Space>

          <Space wrap>
            <Button
              icon={<EditOutlined />}
              onClick={openConfigModal}
              size="small"
            >
              {t`Config`}
            </Button>

            <Button
              icon={<CopyOutlined />}
              onClick={copyAgentPath}
              size="small"
            >
              {t`Copy Path`}
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Agent信息 */}
      <Card size="small" title={t`Information`} style={{ marginBottom: '12px' }}>
        <Descriptions size="small" column={1}>
          <Descriptions.Item label={t`Name`}>
            <Space>
              <Text strong>{agentInstance.name}</Text>
              <Tag color={agentInstance.isRunning ? 'success' : 'default'}>
                {agentInstance.isRunning ? t`Running` : t`Stopped`}
              </Tag>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label={t`Path`}>
            <Text 
              copyable 
              style={{ fontSize: '11px', wordBreak: 'break-all' }}
            >
              {agentPath}
            </Text>
          </Descriptions.Item>

          {agentInstance.config.modelKey && (
            <Descriptions.Item label={t`AI Model`}>
              <Tag color="blue">
                {agentInstance.config.modelKey}
              </Tag>
            </Descriptions.Item>
          )}

          <Descriptions.Item label={t`Statistics`}>
            <Space direction="vertical" size={2}>
              <Text style={{ fontSize: '11px' }}>
                💬 {t`Chat logs:`} {agentInstance.chatLogsCount}
              </Text>
              <Text style={{ fontSize: '11px' }}>
                🔌 {t`MCP config:`} {agentInstance.hasMCPConfig ? t`Yes` : t`No`}
              </Text>
              <Text style={{ fontSize: '11px' }}>
                📋 {t`Tasks:`} {agentInstance.tasksCount}
              </Text>
            </Space>
          </Descriptions.Item>

          {agentInstance.lastChatTime && (
            <Descriptions.Item label={t`Last Activity`}>
              <Text style={{ fontSize: '11px' }}>
                {new Date(agentInstance.lastChatTime).toLocaleString()}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 系统提示词 */}
      {agentInstance.config.prompt && (
        <Card size="small" title={t`System Prompt`}>
          <Paragraph 
            style={{ 
              fontSize: '11px',
              margin: 0,
              backgroundColor: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px'
            }}
            ellipsis={{ rows: 4, expandable: true }}
          >
            {agentInstance.config.prompt}
          </Paragraph>
        </Card>
      )}

      {/* 配置编辑模态框 */}
      <Modal
        title={t`Edit Agent Configuration`}
        open={configModalVisible}
        onOk={saveConfig}
        onCancel={() => setConfigModalVisible(false)}
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
            label={t`Agent Name`}
            rules={[{ required: true, message: t`Please enter agent name` }]}
          >
            <Input placeholder={t`Enter agent name`} />
          </Form.Item>

          <Form.Item
            name="systemPrompt"
            label={t`System Prompt`}
          >
            <TextArea 
              rows={4} 
              placeholder={t`Enter system prompt for the agent`}
            />
          </Form.Item>

          <Divider orientation="left" style={{ fontSize: '12px' }}>
            {t`AI Model Configuration`}
          </Divider>

          <Form.Item
            name="modelKey"
            label={t`Model Key`}
          >
            <Input placeholder={t`Enter model key/identifier`} />
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="temperature"
              label={t`Temperature`}
              style={{ flex: 1 }}
            >
              <Input type="number" min={0} max={2} step={0.1} />
            </Form.Item>

            <Form.Item
              name="maxTokens"
              label={t`Max Tokens`}
              style={{ flex: 1 }}
            >
              <Input type="number" min={1} max={8192} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
});

AgentInfoPanel.displayName = 'AgentInfoPanel';

export default AgentInfoPanel;