/**
 * Agent任务管理面板组件
 * 管理Agent专属的定时任务
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
  Select,
  Divider,
  Popconfirm,
  Tooltip,
  Progress
} from 'antd';
import { 
  ScheduleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { t } from '@dadigua/hyperchat-shared';
import { call } from '../../../common/call';
import type { Task } from '@dadigua/hyperchat-shared';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface AgentTaskPanelProps {
  agentPath: string;
  agentName: string;
  tasks: Task[];
  onRefresh: () => Promise<void>;
}

/**
 * Agent任务管理面板组件
 */
const AgentTaskPanel = forwardRef<any, AgentTaskPanelProps>(({
  agentPath,
  agentName,
  tasks,
  onRefresh
}, ref) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
  const openModal = useCallback((task?: Task) => {
    setEditingTask(task || null);
    
    if (task) {
      form.setFieldsValue({
        name: task.name,
        description: task.description,
        agentName: task.agentName,
        cron: task.cron,
        enabled: !task.disabled
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        enabled: true,
        cron: '0 9 * * *' // 默认每天9点
      });
    }
    
    setModalVisible(true);
  }, [form]);

  /**
   * 保存任务
   */
  const saveTask = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setActionLoading('save', true);

      const taskData = {
        name: values.name,
        description: values.description,
        agentName: agentName,
        cron: values.cron,
        disabled: !values.enabled
      };

      const response = editingTask 
        ? await call('updateTask', {
            workspacePath: agentPath,
            taskName: editingTask.name,
            updates: taskData
          })
        : await call('createTask', {
            workspacePath: agentPath,
            taskData: taskData
          });

      if (response.success) {
        message.success(editingTask ? t`Task updated` : t`Task added`);
        setModalVisible(false);
        await onRefresh();
      } else {
        message.error(response.error || t`Failed to save task`);
      }
    } catch (error) {
      console.error('Save task error:', error);
      message.error(t`Failed to save task`);
    } finally {
      setActionLoading('save', false);
    }
  }, [form, editingTask, agentPath, onRefresh, setActionLoading]);

  /**
   * 删除任务
   */
  const deleteTask = useCallback(async (taskName: string) => {
    try {
      setActionLoading(`delete_${taskName}`, true);
      const response = await call('deleteTask', {
        taskName
      });

      if (response.success) {
        message.success(t`Task deleted`);
        await onRefresh();
      } else {
        message.error(response.error || t`Failed to delete task`);
      }
    } catch (error) {
      console.error('Delete task error:', error);
      message.error(t`Failed to delete task`);
    } finally {
      setActionLoading(`delete_${taskName}`, false);
    }
  }, [agentPath, onRefresh, setActionLoading]);

  /**
   * 启用/禁用任务
   */
  const toggleTask = useCallback(async (taskName: string, enabled: boolean) => {
    try {
      setActionLoading(`toggle_${taskName}`, true);
      const response = await call('enableTask', {
        taskName,
        enabled
      });

      if (response.success) {
        message.success(enabled ? t`Task enabled` : t`Task disabled`);
        await onRefresh();
      } else {
        message.error(response.error || t`Failed to toggle task`);
      }
    } catch (error) {
      console.error('Toggle task error:', error);
      message.error(t`Failed to toggle task`);
    } finally {
      setActionLoading(`toggle_${taskName}`, false);
    }
  }, [agentPath, onRefresh, setActionLoading]);

  /**
   * 手动触发任务
   */
  const triggerTask = useCallback(async (taskName: string) => {
    try {
      setActionLoading(`trigger_${taskName}`, true);
      const response = await call('triggerTask', {
        taskName
      });

      if (response.success) {
        message.success(t`Task triggered successfully`);
      } else {
        message.error(response.error || t`Failed to trigger task`);
      }
    } catch (error) {
      console.error('Trigger task error:', error);
      message.error(t`Failed to trigger task`);
    } finally {
      setActionLoading(`trigger_${taskName}`, false);
    }
  }, [agentPath, setActionLoading]);

  /**
   * 获取任务状态颜色
   */
  const getTaskStatusColor = (task: Task) => {
    if (task.disabled) return 'default';
    // 注意：Task schema 中没有 lastRun 属性，这里先简化逻辑
    // if (task.lastRun) {
    //   const timeSinceLastRun = Date.now() - task.lastRun;
    //   // 如果超过预期运行时间很久，标记为警告
    //   if (timeSinceLastRun > 24 * 60 * 60 * 1000) return 'warning';
    // }
    return 'success';
  };

  /**
   * 渲染任务列表项
   */
  const renderTask = useCallback((task: Task) => {
    const statusColor = getTaskStatusColor(task);
    const isEnabled = !task.disabled;
    
    return (
      <List.Item
        key={task.name}
        actions={[
          <Tooltip title={t`Trigger now`} key="trigger">
            <Button
              type="text"
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={() => triggerTask(task.name)}
              loading={loading[`trigger_${task.name}`]}
              disabled={!isEnabled}
            />
          </Tooltip>,
          <Tooltip title={isEnabled ? t`Disable` : t`Enable`} key="toggle">
            <Button
              type="text"
              size="small"
              icon={isEnabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => toggleTask(task.name, !isEnabled)}
              loading={loading[`toggle_${task.name}`]}
              style={{ color: isEnabled ? '#ff4d4f' : '#52c41a' }}
            />
          </Tooltip>,
          <Tooltip title={t`Edit`} key="edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openModal(task)}
            />
          </Tooltip>,
          <Popconfirm
            title={t`Are you sure to delete this task?`}
            onConfirm={() => deleteTask(task.name)}
            okText={t`Yes`}
            cancelText={t`No`}
            key="delete"
          >
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              danger
              loading={loading[`delete_${task.name}`]}
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
              backgroundColor: statusColor === 'success' ? '#f6ffed' : 
                               statusColor === 'warning' ? '#fff7e6' : '#f5f5f5',
              border: `2px solid ${statusColor === 'success' ? '#52c41a' : 
                                  statusColor === 'warning' ? '#faad14' : '#d9d9d9'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ScheduleOutlined style={{ 
                color: statusColor === 'success' ? '#52c41a' : 
                       statusColor === 'warning' ? '#faad14' : '#999',
                fontSize: '14px' 
              }} />
            </div>
          }
          title={
            <Space>
              <Text strong style={{ fontSize: '13px' }}>
                {task.name}
              </Text>
              <Tag 
                color={statusColor}
              >
                {isEnabled ? t`Enabled` : t`Disabled`}
              </Tag>
              <Tag color="blue">
                {task.agentName}
              </Tag>
            </Space>
          }
          description={
            <div style={{ fontSize: '11px' }}>
              <div style={{ color: '#666', marginBottom: '2px' }}>
                ⏰ {task.cron}
              </div>
              {task.description && (
                <div style={{ color: '#666', marginBottom: '2px' }}>
                  📝 {task.description}
                </div>
              )}
              <div style={{ color: '#999' }}>
                🔧 {task.disabled ? t`Disabled` : t`Enabled`}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  }, [loading, openModal, toggleTask, deleteTask, triggerTask]);

  /**
   * Cron表达式模板
   */
  const cronTemplates = [
    { label: t`Every minute`, value: '* * * * *' },
    { label: t`Every 5 minutes`, value: '*/5 * * * *' },
    { label: t`Every hour`, value: '0 * * * *' },
    { label: t`Every day at 9 AM`, value: '0 9 * * *' },
    { label: t`Every Monday at 9 AM`, value: '0 9 * * 1' },
    { label: t`Every 1st of month`, value: '0 9 1 * *' }
  ];

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
            {t`Add Task`}
          </Button>
          <Text style={{ fontSize: '11px', color: '#666' }}>
            {tasks.length} {t`tasks`} • {tasks.filter(t => !t.disabled).length} {t`enabled`}
          </Text>
        </Space>
      </Card>

      {/* 任务列表 */}
      <Card size="small" title={t`Scheduled Tasks`}>
        {tasks.length > 0 ? (
          <List
            size="small"
            dataSource={tasks}
            renderItem={renderTask}
            style={{ marginTop: '8px' }}
          />
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '40px 20px',
            fontSize: '13px'
          }}>
            <ScheduleOutlined style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }} />
            <div style={{ marginBottom: '8px' }}>
              {t`No tasks configured`}
            </div>
            <Button 
              type="link" 
              size="small" 
              onClick={() => openModal()}
            >
              {t`Add first task`}
            </Button>
          </div>
        )}
      </Card>

      {/* 添加/编辑模态框 */}
      <Modal
        title={editingTask ? t`Edit Task` : t`Add Task`}
        open={modalVisible}
        onOk={saveTask}
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
            label={t`Task Name`}
            rules={[{ required: true, message: t`Please enter task name` }]}
          >
            <Input placeholder={t`Enter a descriptive name for this task`} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t`Description`}
          >
            <Input placeholder={t`Brief description of what this task does`} />
          </Form.Item>


          <Form.Item
            name="cron"
            label={t`Schedule (Cron Expression)`}
            rules={[{ required: true, message: t`Please enter cron expression` }]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder={t`e.g., 0 9 * * * (every day at 9 AM)`} />
              <Select
                placeholder={t`Templates`}
                style={{ width: 150 }}
                onSelect={(value) => form.setFieldValue('cron', value)}
              >
                {cronTemplates.map(template => (
                  <Select.Option key={template.value} value={template.value}>
                    {template.label}
                  </Select.Option>
                ))}
              </Select>
            </Space.Compact>
          </Form.Item>

          <Form.Item
            name="enabled"
            label={t`Enabled`}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <div style={{ 
            fontSize: '11px', 
            color: '#666',
            backgroundColor: '#f5f5f5',
            padding: '8px',
            borderRadius: '4px'
          }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>{t`Cron Expression Format:`}</strong> minute hour day month weekday
            </div>
            <div>
              {t`Examples:`} 
              <br />• <code>0 9 * * *</code> - {t`Every day at 9:00 AM`}
              <br />• <code>*/30 * * * *</code> - {t`Every 30 minutes`}
              <br />• <code>0 9 * * 1</code> - {t`Every Monday at 9:00 AM`}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
});

AgentTaskPanel.displayName = 'AgentTaskPanel';

export default AgentTaskPanel;