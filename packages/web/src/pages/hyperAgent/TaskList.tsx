/**
 * 任务列表页面组件
 * 用于管理定时任务的创建、编辑、删除和执行
 * 支持 cron 表达式定时执行，与 AI Agent 集成
 */
import React, {
  useState,
  useEffect,
  version,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  Button,
  Table,
  Switch,
  Tooltip,
  Modal,
  message,
  Radio,
  Input,
  Tabs,
  ConfigProvider,
  Progress,
  Card,
  Flex,
  Tag,
  Space,
  Slider,
  Form,
  InputNumber,
  Descriptions,
  Select,
  Divider,
  Popconfirm,
  Popover,
} from "antd";
import { call } from "../../common/call";
import client from "socket.io-client";
import SimplePeer from "simple-peer";
import {
  Mic,
  Speaker,
  Settings,
  HelpCircle,
  AlertCircle,
  Wifi,
  VolumeIcon,
  VolumeX,
  Volume2,
} from "lucide-react";
import { debounce } from "../../common";
import {
  CaretRightOutlined,
  CloudSyncOutlined,
  CopyOutlined,
  ExclamationCircleFilled,
  StopOutlined,
} from "@ant-design/icons";
import { sleep } from "../../common/sleep";
import dayjs from "dayjs";
import { useForm } from "antd/es/form/Form";
import { e } from "../../common/service";
import { t } from "../../i18n";
import { NewTaskModal } from "./newTaskModal";
import { Agents, LocalSetting, TaskList, Task } from "@hyperchat/shared/data.mjs";
import { v4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { HeaderContext } from "../../common/context";
import { Icon } from "../../components/icon";
import { useForceUpdate } from "../../hooks/useForceUpdate";

// 加载状态管理对象
const loadObj: Record<string, boolean> = {};

/**
 * 任务列表页面主组件
 * @returns JSX.Element
 */
export function TaskListPage(): JSX.Element {
  // 使用强制更新 hook
  const refresh = useForceUpdate();
  
  // 全局状态管理
  const context = useContext(HeaderContext);
  const { globalState, updateGlobalState } = context || {};
  
  // 路由相关 hooks
  // 路由相关 hooks
  const navigate = useNavigate();
  const location = useLocation();
  
  /**
   * 表格列配置
   */
  const columns = [
    {
      title: t`name`,
      dataIndex: "name",
      key: "name",
    },
    {
      title: "cron",
      dataIndex: "cron", 
      key: "cron",
    },
    {
      title: "Agent",
      dataIndex: "agentKey",
      key: "agentKey",
      /**
       * 渲染 Agent 标签
       * @param text - 单元格文本
       * @param row - 当前行数据
       * @param index - 行索引
       */
      render: (text: string, row: Task, index: number) => {
        return (
          <Tag color="blue">
            {Agents.get().data.find((x) => x.key == row.agentKey)?.name}
          </Tag>
        );
      },
    },
    {
      title: "message",
      dataIndex: "command",
      key: "command",
      width: 300,
      ellipsis: true,
      /**
       * 渲染消息内容，支持悬浮显示完整内容
       * @param text - 单元格文本
       * @param row - 当前行数据
       * @param index - 行索引
       */
      render: (text: string, row: Task, index: number) => {
        return (
          <Popover placement="bottom" content={<div style={{
            maxWidth: "calc(70vw)",
          }}>
            <div style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }} className="line-clamp-6">{row.command}</div>

          </div>}>
            <div style={{ height: 22 }} className="overflow-hidden w-60">{row.command}</div>
          </Popover>
        );
      },
    },
    {
      title: t`enabled`,
      dataIndex: "enabled",
      key: "enabled",
      /**
       * 渲染启用/禁用开关
       * @param text - 单元格文本
       * @param row - 当前行数据
       * @param index - 行索引
       */
      render: (text: boolean, row: Task, index: number) => {
        return (
          <Switch
            value={!row.disabled}
            onChange={async (checked: boolean) => {
              // 更新任务状态
              row.disabled = !checked;
              await TaskList.save();
              
              // 根据状态启动或停止任务
              if (!row.disabled) {
                // await call("startTask", { taskkey: row.key });
              } else {
                // await call("stopTask", { taskkey: row.key });
              }

              refresh();
            }}
          />
        );
      },
    },
    {
      title: t`operation`,
      dataIndex: "operation",
      key: "operation",
      /**
       * 渲染操作按钮组
       * @param text - 单元格文本
       * @param row - 当前行数据
       * @param index - 行索引
       */
      render: (text: any, row: Task, index: number) => {
        return (
          <div className="flex gap-2">
            {/* 查看结果按钮 */}
            <Button
              size="small"
              type="link"
              onClick={() => {
                navigate(`../Results?taskKey=${row.key}`);
              }}
            >{t`ViewResults`}</Button>

            {/* 编辑按钮 */}
            <Button
              size="small"
              type="link"
              onClick={() => {
                setCurrRow(row);
                setVisible(true);
              }}
            >{t`Edit`}</Button>

            {/* 删除按钮 */}
            <Popconfirm
              title={t`Are you sure to delete this task?`}
              onConfirm={async () => {
                // 停止任务执行
                // await call("stopTask", { taskkey: row.key });
                
                // 从任务列表中移除
                TaskList.get().data = TaskList.get().data.filter(
                  (item) => item.key !== row.key,
                );

                await TaskList.save();
                refresh();
              }}
            >
              <Button
                size="small"
                type="link">{t`Delete`}</Button>
            </Popconfirm>

            {/* 测试运行按钮 */}
            <Button
              size="small"
              type="link"
              {...(loadObj[row.key] !== undefined ? { loading: loadObj[row.key] } : {})}
              className="text-red-300"
              onClick={async () => {
                // 设置加载状态
                loadObj[row.key] = true;
                refresh();
                
                try {
                  // 执行任务测试
                  // await call("runTask", { taskkey: row.key });
                } finally {
                  // 清除加载状态
                  loadObj[row.key] = false;
                  refresh();
                }
              }}
            >{t`Test`}</Button>
          </div>
        );
      },
    },
  ];
  
  // 模态框可见性状态
  const [visible, setVisible] = useState<boolean>(false);
  
  // 当前操作的行数据
  const [currRow, setCurrRow] = useState<Task>({} as Task);

  /**
   * 组件初始化效果
   * 加载任务列表、Agent 配置和 Electron 数据
   */
  useEffect(() => {
    (async () => {
      await Promise.all([
        TaskList.init(),
        Agents.init(),
        LocalSetting.init(),
      ]);
      refresh();
    })();
  }, []);

  return (
    <div className="overflow-auto h-full">
      {/* 操作按钮区域 */}
      <div className="flex gap-2">
        {/* 创建任务按钮 */}
        <Button
          type="primary"
          onClick={() => {
            setCurrRow({} as Task);
            setVisible(true);
          }}
        >{t`Create Task`}</Button>

        {/* 全局任务开关 */}
        <span className="my-bottom">
          {t`Main Switch`}: 
          <Switch 
            checked={LocalSetting.get().runTask} 
            onChange={async (checked: boolean) => {
              LocalSetting.get().runTask = checked;
              await LocalSetting.save();
              refresh();
            }}
          />
        </span>
      </div>

      {/* 任务列表表格 */}
      <Table
        pagination={false}
        scroll={{
          x: true,
        }}
        rowKey={(record: Task) => record.key}
        dataSource={TaskList.get().data}
        columns={columns}
      />

      {/* 新建/编辑任务模态框 */}
      <NewTaskModal
        open={visible}
        onCancel={() => setVisible(false)}
        initialValues={currRow}
        onCreate={async (values: any) => {
          try {
            if (values.key) {
              // 编辑现有任务
              const updatedTask = Object.assign(currRow, values);
              const taskIndex = TaskList.get().data.findIndex((x) => x.key === values.key);
              TaskList.get().data[taskIndex] = updatedTask;
              await TaskList.save();
              
              // 如果任务启用，则启动任务
              if (!updatedTask.disabled) {
                // await call("startTask", { taskkey: updatedTask.key });
              }
              refresh();
              setVisible(false);
            } else {
              // 创建新任务
              values.key = v4();
              
              // 验证 cron 表达式格式
              await call("checkTask", { task: values }).catch((error) => {
                message.error(t`cron format error!`);
                throw error;
              });
              
              TaskList.get().data.push(values);
              await TaskList.save();
              // await call("startTask", { taskkey: values.key });
              refresh();
              setVisible(false);
            }
          } catch (error) {
            // 静默处理错误，UI 会显示相应的错误信息
          }
        }}
      />
    </div>
  );
}
