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
import { debounce, isOnBrowser } from "../../common";
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
        Object.assign(electronData.get().webdav, { baseDirName: "HyperChat" }),
      );
      const c = await call("getConfig");
      port.current = c.port;
      refresh();
    })();
  }, []);
  const [webdavForm] = useForm();

  const [password, setPassword] = useState("");
  const [day, setDay] = useState(30);

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
              <Space.Compact>
                <Input
                  className="w-full"
                  value={password}
                  onChange={async (e) => {
                    setPassword(e.target.value || "123456");
                  }}
                ></Input>
                <Button
                  onClick={async () => {

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
                <Button
                  onClick={() =>
                    window.open(
                      `${location.protocol}//${location.hostname}:${port.current}/${electronData.get().password}/`,
                    )
                  }
                >
                  OpenWeb({`${location.protocol}//${location.hostname}:${port.current}/${electronData.get().password}/`})
                </Button>
              </Space.Compact>

            </Form.Item>
            {isOnBrowser && <Form.Item label={t`Network Settings`}>
              <Radio.Group
                options={[
                  {
                    label: t`local-browser` + t`(Need to solve cors problem)`,
                    value: "local-browser",
                  },
                  {
                    label: t`server-proxy`,
                    value: "server-proxy",
                  },
                ]}
                value={electronData.get().browserNetworkSetting}
                onChange={async (e) => {
                  electronData.get().browserNetworkSetting = e.target.value;
                  await electronData.save();
                  refresh();
                }}
              />
            </Form.Item>}

            {!isOnBrowser && <Form.Item label={t`Startup window size`}>
              <Select
                options={[
                  // 4:3 比例
                  {
                    label: "1024x768 (4:3)",
                    value: "1024x768",
                  }, {
                    label: "1280x960 (4:3)",
                    value: "1280x960",
                  }, {
                    label: "1600x1200 (4:3)",
                    value: "1600x1200",
                  },
                  // 16:10 比例
                  {
                    label: "1280x800 (16:10)",
                    value: "1280x800",
                  }, {
                    label: "1440x900 (16:10)",
                    value: "1440x900",
                  }, {
                    label: "1680x1050 (16:10)",
                    value: "1680x1050",
                  },
                  // 16:9 比例
                  {
                    label: "1280x720 (16:9)",
                    value: "1280x720",
                  }, {
                    label: "1366x768 (16:9)",
                    value: "1366x768",
                  }, {
                    label: "1600x900 (16:9)",
                    value: "1600x900",
                  }, {
                    label: "1920x1080 (16:9)",
                    value: "1920x1080",
                  }
                ]}
                value={electronData.get().windowSize.width + "x" + electronData.get().windowSize.height}
                onChange={(e) => {
                  let [width, height] = e.split("x").map(x => parseInt(x));
                  electronData.get().windowSize.width = width;
                  electronData.get().windowSize.height = height;
                  electronData.save();
                  refresh();
                  message.success(t`Save Success, please restart`);
                }}
              />
            </Form.Item>}

            <Form.Item label={t`Develop Mode`}>
              <Switch

                value={electronData.get().isDeveloper}
                onChange={async (value) => {
                  electronData.get().isDeveloper = value;
                  await electronData.save();
                  refresh();
                }}
              ></Switch>
            </Form.Item>

            <Form.Item
              label={t`ClearChatHistory(exclude Star)`}
              name="deleteChatRecord"
            >
              <Space wrap>
                <InputNumber placeholder="day" value={day} onChange={e => setDay(e)}></InputNumber>
                <Button
                  onClick={async () => {
                    let res = await call("clearChatHistory", [day]);
                    message.success(t`Clear Success ` + res + t` records`);
                  }}
                >
                  {t`Clear logs older than `}{day}{t` days`}
                </Button>
              </Space>
            </Form.Item>
            <Form.Item label={t`DevTools`} name="openDevTools">
              <Space wrap>
                {!isOnBrowser && <Button
                  onClick={() => {
                    call("openDevTools", []);
                  }}
                >
                  {t`openDevTools`}({window.electron.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I'})
                </Button>}
                <Button
                  onClick={() =>
                    call("openExplorer", [electronData.get().logFilePath])
                  }
                >
                  {t`logFile`}
                </Button>
                <Button
                  onClick={() =>
                    call("openExplorer", [electronData.get().appDataDir])
                  }
                >
                  {t`appDataDir`}
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
