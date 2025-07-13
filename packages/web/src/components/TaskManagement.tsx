import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import {
  List,
  Button,
  Tag,
  Space,
  Empty,
  Dropdown,
  Modal,
  Drawer,
  Descriptions,
  Typography,
  message,
  Form,
  Input,
  Select,
  Switch,
  Tooltip,
  Popconfirm,
  Badge,
  Card,
  Divider,
} from "antd";
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  ScheduleOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { WorkspaceInfo } from "../pages/workspace/types";
import { t } from "../i18n";
import type { Task, CRON_TEMPLATES, CRON_DESCRIPTIONS } from "@dadigua/hyperchat-shared";
import type { AgentConfig } from "@dadigua/hyperchat-shared/types";
import { Editor } from "./editor";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TaskManagementProps {
  workspace: WorkspaceInfo;
  tasks: Task[];
  agents: Array<{ config: AgentConfig }>;
  onRefresh: () => Promise<void>;
}

export interface TaskManagementRef {
  createTask: () => void;
}

export const TaskManagement = forwardRef<TaskManagementRef, TaskManagementProps>(
  ({ workspace, tasks, agents, onRefresh }, ref) => {
    const [taskDetailDrawer, setTaskDetailDrawer] = useState(false);
    const [taskEditModal, setTaskEditModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [taskStats, setTaskStats] = useState<{
      total: number;
      enabled: number;
      disabled: number;
      agentCounts: Record<string, number>;
    } | null>(null);

    // 暴露 createTask 方法给父组件
    useImperativeHandle(ref, () => ({
      createTask,
    }), []);

    // 加载任务统计信息
    useEffect(() => {
      loadTaskStats();
    }, [tasks]);

    const loadTaskStats = async () => {
      try {
        const stats = await call('getTaskStats', {
          workspacePath: workspace.path,
        });
        setTaskStats(stats);
      } catch (error) {
        console.error("Failed to load task stats:", error);
      }
    };

    // 显示任务详情
    const showTaskDetails = (task: Task) => {
      setSelectedTask(task);
      setTaskDetailDrawer(true);
    };

    // 编辑任务
    const editTask = (task: Task) => {
      setEditingTask(task);
      form.setFieldsValue(task);
      setTaskEditModal(true);
    };

    // 创建新任务
    const createTask = () => {
      setEditingTask(null);
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        cron: "0 0 * * *", // 每天午夜执行
        disabled: false,
      });
      setTaskEditModal(true);
    };

    // 保存任务
    const saveTask = async (values: any) => {
      try {
        setLoading(true);
        const taskData = {
          name: values.name,
          description: values.description,
          agentKey: values.agentKey,
          cron: values.cron,
          disabled: values.disabled ?? false,
        };

        if (editingTask) {
          // 更新现有任务
          await call('updateTask', {
            workspacePath: workspace.path,
            taskName: editingTask.name,
            updates: taskData,
          });
          message.success(t`Task updated successfully`);
        } else {
          // 创建新任务
          await call('createTask', {
            workspacePath: workspace.path,
            taskData,
          });
          message.success(t`Task created successfully`);
        }

        setTaskEditModal(false);
        form.resetFields();
        setEditingTask(null);
        await onRefresh();
      } catch (error) {
        console.error("Failed to save task:", error);
        message.error(t`Failed to save task`);
      } finally {
        setLoading(false);
      }
    };

    // 删除任务
    const deleteTask = async (task: Task) => {
      try {
        await call('deleteTask', {
          workspacePath: workspace.path,
          taskName: task.name,
        });
        message.success(t`Task deleted successfully`);
        await onRefresh();
      } catch (error) {
        console.error("Failed to delete task:", error);
        message.error(t`Failed to delete task`);
      }
    };

    // 启用/禁用任务
    const toggleTaskStatus = async (task: Task) => {
      try {
        if (task.disabled) {
          await call('enableTask', {
            workspacePath: workspace.path,
            taskName: task.name,
          });
          message.success(t`Task enabled successfully`);
        } else {
          await call('disableTask', {
            workspacePath: workspace.path,
            taskName: task.name,
          });
          message.success(t`Task disabled successfully`);
        }
        await onRefresh();
      } catch (error) {
        console.error("Failed to toggle task status:", error);
        message.error(t`Failed to toggle task status`);
      }
    };

    // 复制任务
    const cloneTask = async (task: Task) => {
      const newTaskName = `${task.name}_copy_${Date.now()}`;
      try {
        await call('cloneTask', {
          workspacePath: workspace.path,
          taskName: task.name,
          newTaskName,
        });
        message.success(t`Task cloned successfully`);
        await onRefresh();
      } catch (error) {
        console.error("Failed to clone task:", error);
        message.error(t`Failed to clone task`);
      }
    };


    // 获取 Agent 名称
    const getAgentName = (agentKey: string): string => {
      const agent = agents.find(a => a.config.key === agentKey);
      return agent ? (agent.config.name || agent.config.key) : agentKey;
    };

    // 格式化 Cron 表达式描述
    const getCronDescription = (cron: string): string => {
      // 这里可以根据需要添加更复杂的 cron 解析逻辑
      const commonPatterns: Record<string, string> = {
        "* * * * *": "Every minute",
        "0 * * * *": "Every hour",
        "0 0 * * *": "Every day at midnight",
        "0 0 * * 0": "Every Sunday at midnight",
        "0 0 1 * *": "On the 1st of every month at midnight",
        "0 9 * * 1-5": "At 9 AM on weekdays",
        "0 10 * * 0,6": "At 10 AM on weekends",
      };
      return commonPatterns[cron] || cron;
    };

    // Cron 模板选项
    const cronTemplates = [
      { value: "* * * * *", label: "Every minute" },
      { value: "0 * * * *", label: "Every hour" },
      { value: "0 0 * * *", label: "Every day at midnight" },
      { value: "0 0 * * 0", label: "Every Sunday at midnight" },
      { value: "0 0 1 * *", label: "On the 1st of every month" },
      { value: "0 9 * * 1-5", label: "At 9 AM on weekdays" },
      { value: "0 10 * * 0,6", label: "At 10 AM on weekends" },
    ];

    return (
      <>
        <div className="p-2 overflow-auto">
          {/* 统计信息 */}
          {taskStats && (
            <Card size="small" className="mb-3">
              <Space size="large">
                <Tooltip title="Total Tasks">
                  <Badge count={taskStats.total} color="blue">
                    <ScheduleOutlined className="text-lg" />
                  </Badge>
                </Tooltip>
                <Tooltip title="Enabled Tasks">
                  <Badge count={taskStats.enabled} color="green">
                    <PlayCircleOutlined className="text-lg" />
                  </Badge>
                </Tooltip>
                <Tooltip title="Disabled Tasks">
                  <Badge count={taskStats.disabled} color="gray">
                    <PauseCircleOutlined className="text-lg" />
                  </Badge>
                </Tooltip>
              </Space>
            </Card>
          )}

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">{`Tasks (${tasks.length})`}</span>
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={createTask}
              title={t`Create Task`}
            />
          </div>

          {tasks.length > 0 ? (
            <List
              size="small"
              dataSource={tasks}
              renderItem={(task) => {
                const menuItems = [
                  {
                    key: "details",
                    icon: <InfoCircleOutlined />,
                    label: t`View Details`,
                    onClick: () => showTaskDetails(task),
                  },
                  {
                    key: "edit",
                    icon: <EditOutlined />,
                    label: t`Edit`,
                    onClick: () => editTask(task),
                  },
                  {
                    key: "clone",
                    icon: <CopyOutlined />,
                    label: t`Clone`,
                    onClick: () => cloneTask(task),
                  },
                  {
                    key: "toggle",
                    icon: task.disabled ? <PlayCircleOutlined /> : <PauseCircleOutlined />,
                    label: task.disabled ? t`Enable` : t`Disable`,
                    onClick: () => toggleTaskStatus(task),
                  },
                  {
                    type: "divider" as const,
                  },
                  {
                    key: "delete",
                    icon: <DeleteOutlined />,
                    label: t`Delete`,
                    danger: true,
                    onClick: () => {
                      Modal.confirm({
                        title: t`Delete Task`,
                        content: t`Are you sure you want to delete this task?`,
                        onOk: () => deleteTask(task),
                      });
                    },
                  },
                ];

                return (
                  <List.Item
                    actions={[
                      <Switch
                        key="status"
                        checked={!task.disabled}
                        onChange={() => toggleTaskStatus(task)}
                        size="small"
                        title={task.disabled ? t`Enable Task` : t`Disable Task`}
                      />,
                      <Dropdown
                        key="more"
                        menu={{ items: menuItems }}
                        trigger={['click']}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    ]}
                    onClick={() => showTaskDetails(task)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span className={`text-sm ${task.disabled ? 'text-gray-400' : ''}`}>
                            {task.name}
                          </span>
                          <Tag color={task.disabled ? "default" : "green"}>
                            <RobotOutlined /> {getAgentName(task.agentKey)}
                          </Tag>
                          <Tooltip title={getCronDescription(task.cron)}>
                            <Tag color="blue">
                              <ScheduleOutlined /> {task.cron}
                            </Tag>
                          </Tooltip>
                        </Space>
                      }
                      description={
                        <Text className={`text-xs ${task.disabled ? 'text-gray-400' : 'text-gray-600'}`}>
                          {task.description}
                        </Text>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t`No tasks yet`}
              className="my-8"
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={createTask}>
                {t`Create Task`}
              </Button>
            </Empty>
          )}
        </div>

        {/* 任务详情抽屉 */}
        <Drawer
          title={t`Task Details`}
          placement="right"
          width={400}
          open={taskDetailDrawer}
          onClose={() => setTaskDetailDrawer(false)}
        >
          {selectedTask && (
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t`Name`}>
                {selectedTask.name}
              </Descriptions.Item>
              <Descriptions.Item label={t`Description`}>
                {selectedTask.description}
              </Descriptions.Item>
              <Descriptions.Item label={t`Agent`}>
                <Tag color="green">
                  <RobotOutlined /> {getAgentName(selectedTask.agentKey)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t`Schedule`}>
                <Space direction="vertical">
                  <Tag color="blue">
                    <ScheduleOutlined /> {selectedTask.cron}
                  </Tag>
                  <Text type="secondary" className="text-xs">
                    {getCronDescription(selectedTask.cron)}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t`Status`}>
                <Tag color={selectedTask.disabled ? "default" : "green"}>
                  {selectedTask.disabled ? t`Disabled` : t`Enabled`}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Drawer>

        {/* 任务编辑模态框 */}
        <Modal
          title={editingTask ? t`Edit Task` : t`Create Task`}
          open={taskEditModal}
          onCancel={() => {
            setTaskEditModal(false);
            form.resetFields();
            setEditingTask(null);
          }}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={saveTask}
            initialValues={{
              cron: "0 0 * * *",
              disabled: false,
            }}
          >
            <Form.Item
              name="name"
              label={t`Task Name`}
              rules={[
                { required: true, message: t`Please enter task name` },
                { max: 100, message: t`Task name cannot exceed 100 characters` },
              ]}
            >
              <Input placeholder={t`Enter task name`} />
            </Form.Item>

            <Form.Item
              name="description"
              label={t`Description`}
              rules={[
                { required: true, message: t`Please enter task description` },
                { max: 500, message: t`Task description cannot exceed 500 characters` },
              ]}
            >
              <TextArea
                rows={3}
                placeholder={t`Enter task description`}
              />
            </Form.Item>

            <Form.Item
              name="agentKey"
              label={t`Agent`}
              rules={[{ required: true, message: t`Please select an agent` }]}
            >
              <Select placeholder={t`Select an agent`}>
                {agents.map((agent) => (
                  <Select.Option key={agent.config.key} value={agent.config.key}>
                    <Space>
                      <RobotOutlined />
                      {agent.config.name || agent.config.key}
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="cron"
              label={t`Schedule (Cron Expression)`}
              rules={[
                { required: true, message: t`Please enter cron expression` },
                {
                  pattern: /^(\*|([0-5]?\d)) (\*|([01]?\d|2[0-3])) (\*|([12]?\d|3[01])) (\*|([1-9]|1[012])) (\*|[0-6])$/,
                  message: t`Invalid cron expression format`,
                },
              ]}
            >
              <Select
                placeholder={t`Select a schedule template or enter custom cron expression`}
                mode="tags"
                maxTagCount={1}
              >
                {cronTemplates.map((template) => (
                  <Select.Option key={template.value} value={template.value}>
                    {template.label} ({template.value})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="disabled" valuePropName="checked">
              <Switch />
              <span className="ml-2">{t`Disable this task`}</span>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {editingTask ? t`Update` : t`Create`}
                </Button>
                <Button
                  onClick={() => {
                    setTaskEditModal(false);
                    form.resetFields();
                    setEditingTask(null);
                  }}
                >
                  {t`Cancel`}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }
);

TaskManagement.displayName = "TaskManagement";