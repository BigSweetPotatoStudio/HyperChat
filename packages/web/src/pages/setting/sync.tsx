/**
 * WebDAV 同步设置页面
 * 
 * 该组件提供 WebDAV 服务器的配置界面，用户可以：
 * 1. 配置 WebDAV 服务器连接信息（URL、用户名、密码）
 * 2. 测试 WebDAV 连接是否正常
 * 3. 保存配置到本地存储
 * 4. 执行数据同步操作
 * 
 * @fileoverview WebDAV 同步配置组件
 * @author HyperChat Team
 * @since 2024
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from "react";
import {
  Button,
  message,
  Input,
  Space,
  Form,
  FormInstance,
} from "antd";
import { call, callElectron } from "../../common/call";
import {
  CloudSyncOutlined,
} from "@ant-design/icons";
import { useForm } from "antd/es/form/Form";
import { t } from "../../i18n";
import { HeaderContext } from "../../common/context";
import { Pre } from "../../components/pre";
import { AppSetting, electronData } from "@hyperchat/shared/data.mjs";

/**
 * WebDAV 配置表单字段类型定义
 */
interface WebDavFormValues {
  /** WebDAV 服务器地址 */
  url: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 基础目录名，默认为 HyperChat */
  baseDirName: string;
}

/**
 * 操作结果状态类型定义
 */
interface ResultState {
  /** 操作成功的数据 */
  data: any;
  /** 操作失败的错误信息 */
  error: any;
}

/**
 * WebDAV 同步设置组件
 * 用于配置和管理 WebDAV 服务器连接，实现数据同步功能
 */
export function WebdavSetting(): JSX.Element {
  // 状态管理：用于强制组件重新渲染
  const [num, setNum] = useState<number>(0);
  
  /**
   * 强制刷新组件
   */
  const refresh = useCallback((): void => {
    setNum((prev) => prev + 1);
  }, []);

  // 获取全局上下文
  const { globalState, updateGlobalState, setLang } = useContext(HeaderContext);
  
  // WebDAV 表单实例
  const [webdavForm] = useForm<WebDavFormValues>();
  
  // 同步加载状态
  const [syncLoading, setSyncLoading] = useState<boolean>(false);
  
  // 操作结果状态
  const [currResult, setCurrResult] = useState<ResultState>({
    data: null,
    error: null,
  });

  /**
   * 组件初始化效果
   * 加载应用设置和电子数据，初始化表单值
   */
  useEffect(() => {
    (async (): Promise<void> => {
      try {
        // 初始化应用设置和电子数据
        await AppSetting.init();
        await electronData.init();
        
        // 获取自动启动状态（仅在 Electron 环境下）
        AppSetting.get().isAutoLauncher = await callElectron("isAutoLauncher").catch(
          () => AppSetting.get().isAutoLauncher,
        );
        
        // 重置并设置表单初始值
        webdavForm.resetFields();
        webdavForm.setFieldsValue(
          Object.assign(electronData.get().webdav || {}, { baseDirName: "HyperChat" }),
        );
        
        refresh();
      } catch (error) {
        console.error("初始化 WebDAV 设置失败:", error);
        message.error("初始化失败");
      }
    })();
  }, [webdavForm, refresh]);
  /**
   * 处理 WebDAV 表单提交
   * @param values - 表单值
   * @param type - 操作类型，'save' 表示保存并同步，undefined 表示仅保存
   */
  const webDavOnFinish = async (values: WebDavFormValues, type?: string): Promise<void> => {
    if (type === "save") {
      // 执行保存并同步操作
      setSyncLoading(true);
      try {
        // 测试 WebDAV 连接
        await call("testWebDav", values);
        
        // 保存 WebDAV 配置
        electronData.get().webdav = values;
        await electronData.save();

        // 执行 WebDAV 同步
        await call("webDavSync");
        message.success(t`Sync Success`);
        
        // 清除之前的结果状态
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
      // 仅执行测试和保存操作
      try {
        await call("testWebDav", values);
        message.success("Test success");
        
        // 保存 WebDAV 配置
        electronData.get().webdav = values;
        await electronData.save();
        
        message.success("Save success");
      } catch (error) {
        message.error("Save failed");
        console.error("WebDAV 保存失败:", error);
      }
    }
  };

  return (
    <div>
      <div className="relative flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:p-4">
          {/* WebDAV 配置表单 */}
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
            {/* WebDAV 服务器地址输入框 */}
            <Form.Item
              label={t`WebDAV Url`}
              name="url"
              rules={[{ required: true, message: t`Please input` }]}
              normalize={(value: string) => value.trim()}
            >
              <Input placeholder="https://example.com/webdav" />
            </Form.Item>
            
            {/* 用户名输入框 */}
            <Form.Item
              label={t`Username`}
              name="username"
              rules={[{ required: true, message: t`Please input!` }]}
              normalize={(value: string) => value.trim()}
            >
              <Input placeholder="your_username" />
            </Form.Item>

            {/* 密码输入框 */}
            <Form.Item
              label={t`Password`}
              name="password"
              rules={[{ required: true, message: t`Please input!` }]}
              normalize={(value: string) => value.trim()}
            >
              <Input.Password placeholder="your_password" />
            </Form.Item>

            {/* 基础目录名输入框（只读） */}
            <Form.Item
              label={t`baseDirName`}
              name="baseDirName"
              rules={[{ required: true, message: "Please input!" }]}
              normalize={(value: string) => value.trim()}
            >
              <Input 
                disabled 
                defaultValue="HyperChat" 
                placeholder="HyperChat"
              />
            </Form.Item>

            {/* 操作按钮组 */}
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Space>
                {/* 保存配置按钮 */}
                <Button type="primary" htmlType="submit">
                  {t`Save`}
                </Button>
                
                {/* 同步按钮 */}
                <Button
                  onClick={async (): Promise<void> => {
                    try {
                      const values = await webdavForm.validateFields() as WebDavFormValues;
                      await webDavOnFinish(values, "save");
                    } catch (error) {
                      console.error("表单验证失败:", error);
                    }
                  }}
                  loading={syncLoading}
                  icon={<CloudSyncOutlined />}
                >
                  {t`Sync`}
                </Button>
              </Space>
            </Form.Item>
          </Form>
          
          {/* 成功结果显示区域 */}
          {currResult.data && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <div className="font-medium text-green-800">操作结果:</div>
              <div className="text-green-700">{String(currResult.data)}</div>
            </div>
          )}
          
          {/* 错误结果显示区域 */}
          {currResult.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-500 max-h-64 overflow-auto">
              <div className="font-medium text-red-800">错误信息:</div>
              <Pre>{currResult.error.toString()}</Pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
