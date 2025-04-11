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
import { AppSetting, ChatHistory, electronData } from "../../../../common/data";
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
import { currLang, t } from "../../i18n";
import { HeaderContext } from "../../common/context";

export function Setting() {
  const [num, setNum] = useState(0);
  function refresh() {
    setNum((num) => num + 1);
  }
  const { globalState, updateGlobalState, setLang } = useContext(HeaderContext);
  let port = useRef(0);
  useEffect(() => {
    (async () => {
      await AppSetting.init();
      await electronData.init();
      setPassword(electronData.get().password);
      AppSetting.get().isAutoLauncher = await call("isAutoLauncher").catch(
        (x) => AppSetting.get().isAutoLauncher,
      ); // 获取是否自动启动
      webdavForm.resetFields();
      webdavForm.setFieldsValue(
        Object.assign(AppSetting.get().webdav, { baseDirName: "HyperChat" }),
      );
      const c = await call("getConfig");
      port.current = c.port;
      refresh();
    })();
  }, []);
  const [webdavForm] = useForm();
  const [syncLoading, setSyncLoading] = useState(false);
  const webDavOnFinish = async (values, type?) => {
    if (type === "test") {
      try {
        await call("testWebDav", [values]);
        message.success("Test success");
      } catch (error) {
        message.error("Test failed");
      }
    } else {
      await call("testWebDav", [values]);
      AppSetting.get().webdav = values;
      await AppSetting.save();

      message.success("Save success");
    }
  };
  const [password, setPassword] = useState("");
  return (
    <div className="overflow-auto h-full">
      <div className="relative flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:p-4">
          <Form
            layout="vertical"
            name="basicSitting"
            // initialValues={{
            //   isAutoLauncher: AppSetting.get().isAutoLauncher,
            //   mcpCallToolTimeout: AppSetting.get().mcpCallToolTimeout,
            // }}
            autoComplete="off"
          >
            <Form.Item label={t`Language`} className="lg:hidden">
              <Select
                value={currLang}
                className="w-full"
                onChange={(e) => {
                  setLang(e);
                }}
                options={[
                  { value: "zhCN", label: "中文" },
                  { value: "enUS", label: "English" },
                ]}
              />
            </Form.Item>
            <Form.Item label={t`LaunchStartup`}>
              <Switch
                value={AppSetting.get().isAutoLauncher}
                checkedChildren="Startup"
                unCheckedChildren="Close"
                onChange={async (value) => {
                  AppSetting.get().isAutoLauncher = value;
                  await AppSetting.save();
                  if (value) {
                    await call("enableAutoLauncher");
                  } else {
                    await call("disableAutoLauncher");
                  }
                  refresh();
                }}
              ></Switch>
            </Form.Item>
            <Form.Item
              label={t`autoSync`}
              tooltip={t`This is an experimental feature, 5min sync once`}
            >
              <Switch
                checkedChildren="AutoSync"
                unCheckedChildren="Close"
                value={electronData.get().autoSync}
                onChange={async (e) => {
                  electronData.get().autoSync = e;
                  await electronData.save();
                  refresh();
                }}
              ></Switch>
            </Form.Item>

            <Form.Item label={t`mcpCallToolTimeout`}>
              <InputNumber
                className="w-full"
                value={AppSetting.get().mcpCallToolTimeout}
                onChange={async (value) => {
                  AppSetting.get().mcpCallToolTimeout =
                    parseInt(value as any) || 60;
                  await AppSetting.save();
                  refresh();
                }}
              ></InputNumber>
            </Form.Item>
            <Form.Item label={t`web asscess password`}>
              <Input
                className="w-full"
                value={password}
                onChange={async (e) => {
                  setPassword(e.target.value || "123456");
                }}
              ></Input>
              <Button
                onClick={async () => {
                  // Validate password: must contain alphanumeric characters
                  if (!/^[a-zA-Z0-9]+$/.test(password)) {
                    message.error(t`Password must contain only letters and numbers`);
                    return;
                  }
                  electronData.get().password = password;
                  await electronData.save();
                  message.success(t`Update Success, please restart`);
                }}
              >
                {t`Update`}
              </Button>
            </Form.Item>
            <Form.Item
              label={t`DeleteChatHistory(exclude Star)`}
              name="deleteChatRecord"
            >
              <Space wrap>
                <Button
                  onClick={async () => {
                    await ChatHistory.init()
                    let f = ChatHistory.get().data.filter((x) => !x.icon);
                    let time = dayjs().subtract(30, "day").valueOf();
                    for (let x of f) {
                      // console.log(x.dateTime, time);
                      if (x.dateTime == null || x.dateTime < time) {
                        x.deleted = true;
                      }
                    }
                    ChatHistory.get().data = ChatHistory.get().data.filter(
                      (x) => !x.deleted,
                    );
                    await ChatHistory.save();
                  }}
                >
                  {t`Keep the chat history for the last 30 days`}
                </Button>
                <Button
                  onClick={async () => {
                    let time = dayjs().subtract(15, "day").valueOf();
                    await ChatHistory.init()
                    let f = ChatHistory.get().data.filter((x) => !x.icon);
                    for (let x of f) {
                      if (x.dateTime == null || x.dateTime < time) {
                        x.deleted = true;
                      }
                    }
                    ChatHistory.get().data = ChatHistory.get().data.filter(
                      (x) => !x.deleted,
                    );
                    await ChatHistory.save();
                  }}
                >
                  {t`Keep the chat history for the last 15 days`}
                </Button>
              </Space>
            </Form.Item>
            <Form.Item label={t`DevTools`} name="openDevTools">
              <Space wrap>
                <Button
                  onClick={() => {
                    call("openDevTools", []);
                  }}
                >
                  openDevTools
                </Button>
                <Button
                  onClick={() =>
                    call("openExplorer", [electronData.get().logFilePath])
                  }
                >
                  logFile
                </Button>
                <Button
                  onClick={() =>
                    call("openExplorer", [electronData.get().appDataDir])
                  }
                >
                  appDataDir
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      `http://localhost:${port.current}/${electronData.get().password}/`,
                    )
                  }
                >
                  OpenWeb(http://localhost:{port.current}/
                  {electronData.get().password}/)
                </Button>
              </Space>
            </Form.Item>

            <Form.Item label="Github" name="Github">
              <a
                target="_blank"
                href="https://github.com/BigSweetPotatoStudio/HyperChat"
              >
                https://github.com/BigSweetPotatoStudio/HyperChat
              </a>
            </Form.Item>
            <Form.Item label="Telegram" name="Telegram">
              <a target="_blank" href="https://t.me/dadigua001">
                https://t.me/dadigua001
              </a>
            </Form.Item>
            <Form.Item label="QQ群" name="QQ群">
              <a
                className="flex items-center text-blue-500"
                target="_blank"
                href="https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim"
              >
                759977131
              </a>
            </Form.Item>
          </Form>

          <div className="text-red-500">
            {t`This software is free and OpenSource. Feel free to follow me, and I
            will bring more utility software.`}
          </div>
          <Form
            layout="horizontal"
            name="1351561"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            autoComplete="off"
          >
            <Form.Item label="Email" name="Email">
              <a href="mailto:develop@dadigua.men">0laopo0@gmail.com</a>
            </Form.Item>
            <Form.Item label="小红书" name="小红书">
              <a
                target="_blank"
                href="https://www.xiaohongshu.com/user/profile/5f0dc4fc0000000001005234"
              >
                大地瓜的小红书
              </a>
            </Form.Item>
            <Form.Item label="X(Twitter)" name="X(Twitter)">
              <a target="_blank" href="https://x.com/ddg85479319">
                Twitter
              </a>
            </Form.Item>
            <Form.Item label="Bilibili" name="Bilibili">
              <a target="_blank" href="https://space.bilibili.com/96150707">
                大地瓜的Bilibili
              </a>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
}
