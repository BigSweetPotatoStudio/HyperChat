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
  TableColumnsType,
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
import { debounce, useQuery } from "../../common";
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
import {
  Agents,
  TaskList,
  ChatHistory,
  ChatHistoryItem,
} from "../../../../common/data";
import { v4 } from "uuid";
import { useLocation, useNavigate } from "react-router-dom";
import { Chat } from "../chat";
import { HeaderContext } from "../../common/context";

export function TaskResultsPage() {
  const [num, setNum] = useState(0);
  const refresh = () => {
    setNum((x) => x + 1);
  };
  const { globalState, updateGlobalState } = useContext(HeaderContext);
  useEffect(() => {
    (async () => {
      await ChatHistory.init();
      refresh();
    })();
  }, []);

  const columns: TableColumnsType<ChatHistoryItem> = [
    {
      title: t`dateTime`,
      dataIndex: "dateTime",
      key: "dateTime",
      render: (text, record) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },

    {
      title: "Agent",
      dataIndex: "agentKey",
      key: "agentKey",
      render: (text, row, index) => {
        return (
          <Tag color="blue">
            {
              Agents.get().data.find(
                (x) => x.key == row.agentKey || x.key == row["gptsKey"],
              )?.label
            }
          </Tag>
        );
      },
    },
    {
      title: t`result`,
      dataIndex: "result",
      key: "result",
      render: (text, row, index) => {
        return (
          <Tooltip title={row.messages[row.messages.length - 1].content}>
            <div className="line-clamp-1 w-96">
              {row.messages[row.messages.length - 1].content}
            </div>
          </Tooltip>
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
                setHistroyKey(row.key); // 设置当前行的key（用于查看历史记录）
                setIsOpenResult(true);
              }}
            >{t`View`}</a>
            <Divider type="vertical" />
            <Popconfirm
              title={t`Are you sure to delete this?`}
              onConfirm={() => {
                ChatHistory.get().data = ChatHistory.get().data.filter(
                  (item) => item.key !== row.key,
                );
                ChatHistory.save();
                refresh();
              }}
            >
              <a>{t`Delete`}</a>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    (async () => {
      await TaskList.init();
      await Agents.init();
      refresh();
    })();
  }, []);
  const navigate = useNavigate();
  const query = useQuery();
  const [isOpenResult, setIsOpenResult] = useState(false);
  const [histroyKey, setHistroyKey] = useState<string>("");

  return (
    <div>
      <Button type="primary" onClick={() => history.back()}>{t`Bcak`}</Button>
      <Table
        rowKey={(r) => r.key}
        dataSource={ChatHistory.get().data.filter(
          (x) => x.taskKey == query.get("taskKey"),
        )}
        columns={columns}
      />

      <Modal
        width={1000}
        open={isOpenResult}
        title={`Result`}
        onOk={() => setIsOpenResult(false)}
        onCancel={() => setIsOpenResult(false)}
        destroyOnClose={true}
      >
        {histroyKey && (
          <Chat
            onlyView={{
              histroyKey: histroyKey,
            }}
          />
        )}
      </Modal>
    </div>
  );
}
