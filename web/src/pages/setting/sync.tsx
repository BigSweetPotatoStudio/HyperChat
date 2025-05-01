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
import { Pre } from "../../components/pre";

export function WebdavSetting() {
  const [num, setNum] = useState(0);
  function refresh() {
    setNum((num) => num + 1);
  }
  const { globalState, updateGlobalState, setLang } = useContext(HeaderContext);
  useEffect(() => {
    (async () => {
      await AppSetting.init();
      await electronData.init();
      AppSetting.get().isAutoLauncher = await call("isAutoLauncher").catch(
        (x) => AppSetting.get().isAutoLauncher,
      ); // 获取是否自动启动
      webdavForm.resetFields();
      webdavForm.setFieldsValue(
        Object.assign(electronData.get().webdav, { baseDirName: "HyperChat" }),
      );
      refresh();
    })();
  }, []);
  const [webdavForm] = useForm();
  const [syncLoading, setSyncLoading] = useState(false);
  const webDavOnFinish = async (values, type?) => {
    if (type === "save") {
      setSyncLoading(true);
      try {
        await call("testWebDav", [values]);
        
        electronData.get().webdav = values;
        await electronData.save();

        await call("webDavSync", []);
        message.success(t`Sync Success`);
        setCurrResult({
          data: null,
          error: null,
        });
        setSyncLoading(false);
        refresh();
      } catch (error) {
        message.error("Sync failed");
        setCurrResult({
          data: null,
          error: error,
        });
        setSyncLoading(false);
      }
    } else {
      await call("testWebDav", [values]);
      message.success("Test success");
      electronData.get().webdav = values;
      await electronData.save();

      message.success("Save success");
    }
  };
  const [currResult, setCurrResult] = useState({
    data: null as any,
    error: null as any,
  });
  return (
    <div>
      <div className="relative flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:p-4">
          <Form
            name="webdavForm"
            form={webdavForm}
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: 600 }}
            onFinish={webDavOnFinish}
            initialValues={{
              baseDirName: "HyperChat",
            }}
            autoComplete="off"
          >
            <Form.Item
              label={t`WebDAV Url`}
              name="url"
              rules={[{ required: true, message: t`Please input` }]}
              normalize={(value) => value.trim()}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={t`Username`}
              name="username"
              rules={[{ required: true, message: t`Please input!` }]}
              normalize={(value) => value.trim()}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label={t`Password`}
              name="password"
              rules={[{ required: true, message: t`Please input!` }]}
              normalize={(value) => value.trim()}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label={t`baseDirName`}
              name="baseDirName"
              rules={[{ required: true, message: "Please input!" }]}
              normalize={(value) => value.trim()}
            >
              <Input disabled defaultValue="HyperChat" />
            </Form.Item>

            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Space>
                {/* <Button
                  onClick={() => {
                    webdavForm.validateFields().then((values) => {
                      webDavOnFinish(values, "test");
                    });
                  }}
                >
                  {t`Test`}
                </Button> */}
                <Button type="primary" htmlType="submit">
                  {t`Save`}
                </Button>
                <Button
                  onClick={async () => {
                    webdavForm.validateFields().then((values) => {
                      webDavOnFinish(values, "save");
                    });
                    
                    // setSyncLoading(true);
                    // try {
                    //   await call("webDavSync", []);
                    //   message.success(t`Sync Success`);
                    //   setCurrResult({
                    //     data: null,
                    //     error: null,
                    //   });
                    //   setSyncLoading(false);
                    //   refresh();
                    // } catch (error) {
                    //   message.error("Sync failed");
                    //   setCurrResult({
                    //     data: null,
                    //     error: error,
                    //   });
                    //   setSyncLoading(false);
                    // }
                  }}
                  loading={syncLoading}
                >
                  <CloudSyncOutlined />
                  {t`Sync`}
                </Button>
              </Space>
            </Form.Item>
          </Form>
          {currResult.data && (
            <div>
              <div>Result:</div>
              <div>{(currResult.data)}</div>
            </div>
          )}
          {currResult.error && (
            <div className="text-red-500 max-h-64 overflow-auto">
              <div>Result:</div>
              <Pre>{currResult.error.toString()}</Pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
