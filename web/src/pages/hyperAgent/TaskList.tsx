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
  CloudSyncOutlined,
  CopyOutlined,
  ExclamationCircleFilled,
} from "@ant-design/icons";
import { sleep } from "../../common/sleep";
import dayjs from "dayjs";
import { useForm } from "antd/es/form/Form";
import { e } from "../../common/service";
import { t } from "../../i18n";
import { NewTaskModal } from "./newTaskModal";
import { GPTS, TaskList } from "../../../../common/data";
import { v4 } from "uuid";

export function TaskListPage() {
  const [num, setNum] = useState(0);
  const refresh = () => {
    setNum((x) => x + 1);
  };

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
      title: "agent",
      dataIndex: "agentKey",
      key: "agentKey",
      render: (text, row, index) => {
        return (
          <Tag color="blue">
            {GPTS.get().data.find((x) => x.key == row.agentKey).label}
          </Tag>
        );
      },
    },
    {
      title: "message",
      dataIndex: "message",
      key: "message",
      render: (text, row, index) => {
        return (
          <Tooltip title={row.message}>
            <div className="line-clamp-1">{row.message}</div>
          </Tooltip>
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
              if (e) {
                await call("startTask", [row.key]);
              } else {
                await call("stopTask", [row.key]);
              }

              row.disabled = !e;
              TaskList.save();
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
          <div>
            <a
              onClick={() => {
                setCurrRow(row);
                setVisible(true);
              }}
            >{t`Edit`}</a>
            <Divider type="vertical" />
            <a>{t`Delete`}</a>
          </div>
        );
      },
    },
  ];
  const [visible, setVisible] = useState(false);
  const [currRow, setCurrRow] = useState<any>({});

  useEffect(() => {
    (async () => {
      await TaskList.init();
      await GPTS.init();
      refresh();
    })();
  }, []);

  return (
    <div>
      <Button
        type="primary"
        onClick={() => setVisible(true)}
      >{t`Create Task`}</Button>
      <Table
        rowKey={(r) => r.key}
        dataSource={TaskList.get().data}
        columns={columns}
      />
      <NewTaskModal
        open={visible}
        onCancel={() => setVisible(false)}
        initialValues={currRow}
        onCreate={async (v) => {
          if (v.key) {
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
            TaskList.get().data.push(v);
            await TaskList.save();
            await call("startTask", [v.key]);
            refresh();
            setVisible(false);
          }
        }}
      />
    </div>
  );
}
