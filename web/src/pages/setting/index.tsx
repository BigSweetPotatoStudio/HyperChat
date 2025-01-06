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
import { AppSetting, electronData } from "../../common/data";
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

export function Setting() {
  const [num, setNum] = useState(0);
  function refresh() {
    setNum((num) => num + 1);
  }

  useEffect(() => {
    (async () => {
      await AppSetting.init();
      await electronData.init();
      AppSetting.get().isAutoLauncher = await call("isAutoLauncher"); // 获取是否自动启动
      webdavForm.resetFields();
      webdavForm.setFieldsValue(
        Object.assign({ baseDirName: "HyperChat" }, AppSetting.get().webdav),
      );
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
      if (values.autoSync) {
        window.location.reload();
      } else {
        await call("webDaveInit", []);
      }

      message.success("Save success");
    }
  };

  return (
    <div>
      <div className="relative flex pr-8 pt-2">
        <div className="w-1/2">
          <Form
            name="webdavForm"
            form={webdavForm}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600, padding: 24 }}
            onFinish={webDavOnFinish}
            initialValues={{
              baseDirName: "HyperChat",
            }}
            autoComplete="off"
          >
            <Form.Item
              label="WebDAV Url"
              name="url"
              rules={[{ required: true, message: "Please input Url!" }]}
              normalize={(value) => value.trim()}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please input username!" }]}
              normalize={(value) => value.trim()}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please input password!" }]}
              normalize={(value) => value.trim()}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="baseDirName"
              name="baseDirName"
              rules={[{ required: true, message: "Please input!" }]}
              normalize={(value) => value.trim()}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="autoSync"
              name="autoSync"
              tooltip="This is an experimental feature"
            >
              <Switch
                checkedChildren="AutoSync"
                unCheckedChildren="Close"
              ></Switch>
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Space>
                <Button
                  onClick={() => {
                    webdavForm.validateFields().then((values) => {
                      webDavOnFinish(values, "test");
                    });
                  }}
                >
                  Test
                </Button>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
                <Button
                  onClick={async () => {
                    setSyncLoading(true);
                    try {
                      if (AppSetting.get().webdav.autoSync) {
                        window.location.reload();
                      } else {
                        await call("webDavSync", []);
                        message.success("Sync Success!");
                        setSyncLoading(false);
                        window.location.reload();
                      }
                    } catch (error) {
                      message.error("Sync failed");
                      setSyncLoading(false);
                    }
                  }}
                  loading={syncLoading}
                >
                  <CloudSyncOutlined />
                  Sync
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
        <div className="w-1/2">
          <Form
            layout="vertical"
            name="basicSitting"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            initialValues={{
              // port: data.get().port,
              isAutoLauncher: AppSetting.get().isAutoLauncher,
            }}
            autoComplete="off"
          >
            <Form.Item label="LaunchStartup" name="isAutoLauncher">
              <Switch
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

            <Form.Item label="openDevTools" name="openDevTools">
              <Space>
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
            This software is free and OpenSource. Feel free to follow me, and I
            will bring more utility software.
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
