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
import { Agents, electronData, TaskList } from "../../../../common/data";
import { v4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { HeaderContext } from "../../common/context";
import { Icon } from "../../components/icon";

const loadObj: {
  [key: string]: any;
} = {};

export function TaskListPage() {
  const [num, setNum] = useState(0);
  const refresh = () => {
    setNum((x) => x + 1);
  };
  const { globalState, updateGlobalState } = useContext(HeaderContext);
  const navigate = useNavigate();
  const location = useLocation();
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
      render: (text, row, index) => {
        return (
          <Tag color="blue">
            {Agents.get().data.find((x) => x.key == row.agentKey)?.label}
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
      render: (text, row, index) => {
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
          // <Tooltip title={row.command}>
          //   <div className="line-clamp-1 w-60">{row.command}</div>
          // </Tooltip>
        );
      },
    },
    {
      title: t`enabled`,
      dataIndex: "enabled",
      key: "enabled",
      render: (text, row, index) => {
        return (
          <Switch
            value={!row.disabled}
            onChange={async (e) => {
              row.disabled = !e;
              await TaskList.save();
              if (!row.disabled) {
                await call("startTask", [row.key]);
              } else {
                await call("stopTask", [row.key]);
              }

              refresh();
            }}
          ></Switch>
        );
      },
    },
    {
      title: t`operation`,
      dataIndex: "operation",
      key: "operation",
      render: (text, row, index) => {
        return (
          <div className="flex gap-2">
            <Button
              size="small"
              type="link"
              onClick={() => {
                navigate(`../Results?taskKey=${row.key}`);
              }}
            >{t`ViewResults`}</Button>

            <Button
              size="small"
              type="link"
              onClick={() => {
                setCurrRow(row);
                setVisible(true);
              }}
            >{t`Edit`}</Button>

            <Popconfirm
              title={t`Are you sure to delete this task?`}
              onConfirm={() => {
                call("stopTask", [row.key]);
                TaskList.get().data = TaskList.get().data.filter(
                  (item) => item.key !== row.key,
                );

                TaskList.save();
                refresh();
              }}
            >
              <Button
                size="small"
                type="link">{t`Delete`}</Button>
            </Popconfirm>

            <Button
              size="small"
              type="link"
              loading={loadObj[row.key]}
              className="text-red-300"
              onClick={async () => {
                loadObj[row.key] = true;
                refresh();
                try {
                  await call("runTask", [row.key]);
                }
                finally {
                  loadObj[row.key] = false;
                  refresh();
                }
              }}
            >{t`Test`}</Button>
          </div >
        );
      },
    },
  ];
  const [visible, setVisible] = useState(false);
  const [currRow, setCurrRow] = useState<any>({});

  useEffect(() => {
    (async () => {
      await Promise.all([
        TaskList.init(),
        Agents.init(),
        electronData.init(),
      ]);
      refresh();
    })();
  }, []);

  return (
    <div className="overflow-auto h-full">
      <div className="flex gap-2">
        <Button
          type="primary"
          onClick={() => {
            setCurrRow({});
            setVisible(true);
          }}
        >{t`Create Task`}</Button>

        {/* <Button icon={<CaretRightOutlined />}>{t`Disable running tasks on this machine`}</Button>
        <Button icon={<StopOutlined />}>{t`Enable running tasks on this machine`}</Button> */}
        <span className="my-bottom">{t`Main Switch`}: <Switch checked={electronData.get().runTask} onChange={async (checked) => {
          electronData.get().runTask = checked;
          await electronData.save();
          refresh();
        }}></Switch></span>
      </div>


      <Table
        pagination={false}
        scroll={{
          x: true,
        }}
        rowKey={(r) => r.key}
        dataSource={TaskList.get().data}
        columns={columns}
      />

      <NewTaskModal
        open={visible}
        onCancel={() => setVisible(false)}
        initialValues={currRow}
        onCreate={async (v) => {
          try {
            if (v.key) {
              v = Object.assign(currRow, v);
              let i = TaskList.get().data.findIndex((x) => x.key == v.key);
              TaskList.get().data[i] = v;
              await TaskList.save();
              if (!v.disabled) {
                await call("startTask", [v.key]);
              }
              refresh();
              setVisible(false);
            } else {
              v.key = v4();
              await call("checkTask", [v]).catch((e) => {
                message.error(t`cron format error!`);
                throw e;
              });
              TaskList.get().data.push(v);
              await TaskList.save();
              await call("startTask", [v.key]);
              refresh();
              setVisible(false);
            }
          } catch { }
        }}
      />
    </div>
  );
}
