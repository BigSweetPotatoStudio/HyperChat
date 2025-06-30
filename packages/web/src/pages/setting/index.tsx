/**
 * @fileoverview HyperChat 应用设置页面组件
 * 
 * 这个组件提供了 HyperChat 应用程序的各种配置选项，包括：
 * - 基本设置：语言选择、自动启动、退出行为等
 * - 网络设置：代理模式、本地浏览器模式等
 * - 开发者选项：开发者模式、调试工具等
 * - 数据管理：清理聊天记录等
 * - 联系方式：项目链接和开发者社交媒体等
 * 
 * @author HyperChat Team
 * @version 1.0.0
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
  type FC,
} from "react";
import {
  Button,
  Switch,
  message,
  Radio,
  Input,
  Space,
  Form,
  InputNumber,
  Select,
  type FormInstance,
} from "antd";
import { call, callElectron } from "../../common/call";
import { AppSetting, electronData } from "@hyperchat/shared/data.mjs";
import { isOnBrowser } from "../../common";
import { useForm } from "antd/es/form/Form";
import { currLang, t } from "../../i18n";
import { HeaderContext } from "../../common/context";
import { useForceUpdate } from "../../hooks/useForceUpdate";

// 未使用的导入（已注释）
// import client from "socket.io-client";
// import SimplePeer from "simple-peer";
// import { Mic, Speaker, Settings, HelpCircle, AlertCircle, Wifi, VolumeIcon, VolumeX, Volume2 } from "lucide-react";
// import { CloudSyncOutlined, CopyOutlined, ExclamationCircleFilled } from "@ant-design/icons";
// import { sleep } from "../../common/sleep";
// import dayjs from "dayjs";
// import { e } from "../../common/service";

/** 配置对象类型定义 */
interface ConfigResponse {
  /** 服务器端口号 */
  port: number;
}

/** 窗口尺寸选项类型 */
interface WindowSizeOption {
  label: string;
  value: string;
}

/** 语言选项类型 */
interface LanguageOption {
  value: string;
  label: string;
}

/** 网络设置选项类型 */
interface NetworkOption {
  label: string;
  value: "local-browser" | "server-proxy";
}

/** WebDAV 表单数据类型 */
interface WebDAVFormData {
  url?: string;
  username?: string;
  password?: string;
  baseDirName?: string;
}

/**
 * 设置页面组件
 * 提供应用程序的各种配置选项，包括：
 * - 基本设置（语言、启动设置等）
 * - 网络设置
 * - 开发者选项
 * - 清理功能
 * - 社交链接
 */
export const Setting: FC = () => {
  // ==================== 状态管理 ====================
  
  /** 访问密码输入值 */
  const [password, setPassword] = useState<string>("");
  
  /** 清理聊天记录的天数 */
  const [day, setDay] = useState<number>(30);
  
  // ==================== Hooks ====================
  
  /** 组件强制更新函数 */
  const refresh = useForceUpdate();
  
  /** 获取全局上下文 */
  const { globalState, updateGlobalState, setLang } = useContext(HeaderContext) || {
    globalState: 0,
    updateGlobalState: () => {},
    setLang: () => {},
  };
  
  /** WebDAV 配置表单实例 */
  const [webdavForm] = useForm<WebDAVFormData>();
  
  /** 服务器端口号引用 */
  const port = useRef<number>(0);

  // ==================== 工具函数 ====================
  
  // ==================== 副作用 ====================
  
  /**
   * 组件初始化
   * 加载配置数据和设置表单初始值
   */
  useEffect(() => {
    const initializeSettings = async (): Promise<void> => {
      try {
        // 初始化应用设置和电子应用数据
        await AppSetting.init();
        await electronData.init();
        
        // 设置初始密码
        setPassword(electronData.get().password);
        
        // 获取自动启动状态
        try {
          AppSetting.get().isAutoLauncher = await callElectron("isAutoLauncher");
        } catch (error) {
          console.warn("获取自动启动状态失败:", error);
          // 保持当前设置值
        }
        
        // 初始化 WebDAV 表单
        webdavForm.resetFields();
        webdavForm.setFieldsValue({
          ...electronData.get().webdav,
          baseDirName: "HyperChat",
        });
        
        // 获取服务器配置
        const config: ConfigResponse = await call("getConfig");
        port.current = config.port;
        
        // 刷新组件
        refresh();
      } catch (error) {
        console.error("初始化设置页面失败:", error);
        message.error(t`Failed to initialize settings`);
      }
    };

    initializeSettings();
  }, [webdavForm, refresh]);

  // ==================== 常量定义 ====================
  
  /** 语言选项 */
  const languageOptions: LanguageOption[] = [
    { value: "zhCN", label: "中文" },
    { value: "enUS", label: "English" },
  ];

  /** 窗口尺寸选项 */
  const windowSizeOptions: WindowSizeOption[] = [
    // 4:3 比例
    { label: "1024x768 (4:3)", value: "1024x768" },
    { label: "1280x960 (4:3)", value: "1280x960" },
    { label: "1600x1200 (4:3)", value: "1600x1200" },
    // 16:10 比例
    { label: "1280x800 (16:10)", value: "1280x800" },
    { label: "1440x900 (16:10)", value: "1440x900" },
    { label: "1680x1050 (16:10)", value: "1680x1050" },
    // 16:9 比例
    { label: "1280x720 (16:9)", value: "1280x720" },
    { label: "1366x768 (16:9)", value: "1366x768" },
    { label: "1600x900 (16:9)", value: "1600x900" },
    { label: "1920x1080 (16:9)", value: "1920x1080" },
  ];

  /** 网络设置选项 */
  const networkOptions: NetworkOption[] = [
    {
      label: t`local-browser` + t`(Need to solve cors problem)`,
      value: "local-browser",
    },
    {
      label: t`server-proxy`,
      value: "server-proxy",
    },
  ];

  // ==================== 事件处理函数 ====================
  
  /**
   * 处理自动启动设置变更
   */
  const handleAutoLauncherChange = async (value: boolean): Promise<void> => {
    try {
      AppSetting.get().isAutoLauncher = value;
      await AppSetting.save();
      
      if (value) {
        await callElectron("enableAutoLauncher");
      } else {
        await callElectron("disableAutoLauncher");
      }
      
      refresh();
    } catch (error) {
      console.error("设置自动启动失败:", error);
      message.error(t`Failed to update auto launcher setting`);
    }
  };

  /**
   * 处理关闭动作设置变更
   */
  const handleCloseActionChange = async (value: "minimize" | "exit" | 0): Promise<void> => {
    try {
      (electronData.get() as any).closeAction = value; // 使用 any 类型断言避免类型检查问题
      await electronData.save();
      refresh();
    } catch (error) {
      console.error("设置关闭动作失败:", error);
      message.error(t`Failed to update close action setting`);
    }
  };

  /**
   * 处理自动同步设置变更
   */
  const handleAutoSyncChange = async (enabled: boolean): Promise<void> => {
    try {
      electronData.get().autoSync = enabled;
      await electronData.save();
      refresh();
    } catch (error) {
      console.error("设置自动同步失败:", error);
      message.error(t`Failed to update auto sync setting`);
    }
  };

  /**
   * 处理 MCP 调用工具超时设置变更
   */
  const handleMcpTimeoutChange = async (value: number | null): Promise<void> => {
    try {
      AppSetting.get().mcpCallToolTimeout = parseInt(String(value)) || 60;
      await AppSetting.save();
      refresh();
    } catch (error) {
      console.error("设置 MCP 超时失败:", error);
      message.error(t`Failed to update MCP timeout setting`);
    }
  };

  /**
   * 更新访问密码
   */
  const handlePasswordUpdate = async (): Promise<void> => {
    try {
      // 验证密码格式
      if (!/^[a-zA-Z0-9]+$/.test(password)) {
        message.error(t`Password must contain only letters and numbers`);
        return;
      }
      
      electronData.get().password = password;
      await electronData.save();
      message.success(t`Update Success, please restart`);
    } catch (error) {
      console.error("更新密码失败:", error);
      message.error(t`Failed to update password`);
    }
  };

  /**
   * 打开 Web 访问链接
   */
  const handleOpenWeb = (): void => {
    const webUrl = `${location.protocol}//${location.hostname}:${port.current}/${electronData.get().password}/`;
    window.open(webUrl);
  };

  /**
   * 处理网络设置变更
   */
  const handleNetworkSettingChange = async (value: "local-browser" | "server-proxy"): Promise<void> => {
    try {
      electronData.get().browserNetworkSetting = value;
      await electronData.save();
      refresh();
    } catch (error) {
      console.error("设置网络配置失败:", error);
      message.error(t`Failed to update network setting`);
    }
  };

  /**
   * 处理窗口尺寸变更
   */
  const handleWindowSizeChange = async (sizeString: string): Promise<void> => {
    try {
      const [width, height] = sizeString.split("x").map(x => parseInt(x));
      electronData.get().windowSize.width = width;
      electronData.get().windowSize.height = height;
      await electronData.save();
      refresh();
      message.success(t`Save Success, please restart`);
    } catch (error) {
      console.error("设置窗口尺寸失败:", error);
      message.error(t`Failed to update window size`);
    }
  };

  /**
   * 处理开发者模式变更
   */
  const handleDeveloperModeChange = async (value: boolean): Promise<void> => {
    try {
      electronData.get().isDeveloper = value;
      await electronData.save();
      refresh();
    } catch (error) {
      console.error("设置开发者模式失败:", error);
      message.error(t`Failed to update developer mode`);
    }
  };

  /**
   * 清理聊天记录
   */
  const handleClearChatHistory = async (): Promise<void> => {
    try {
      const result = await call("clearChatHistory", { day });
      message.success(t`Clear Success ` + result + t` records`);
    } catch (error) {
      console.error("清理聊天记录失败:", error);
      message.error(t`Failed to clear chat history`);
    }
  };

  /**
   * 打开开发者工具
   */
  const handleOpenDevTools = (): void => {
    callElectron("openDevTools");
  };

  /**
   * 打开日志文件位置
   */
  const handleOpenLogFile = (): void => {
    callElectron("openExplorer", { path: electronData.get().logFilePath });
  };

  /**
   * 打开应用数据目录
   */
  const handleOpenAppDataDir = (): void => {
    callElectron("openExplorer", { path: electronData.get().appDataDir });
  };

  // ==================== 渲染 ====================

  return (
    <div className="overflow-auto h-full">
      <div className="relative flex flex-wrap">
        <div className="w-full lg:w-1/2 lg:p-4">
          {/* ==================== 基本设置表单 ==================== */}
          <Form
            layout="vertical"
            name="basicSetting"
            autoComplete="off"
          >
            {/* 移动端语言选择 */}
            <Form.Item label={t`Language`} className="lg:hidden">
              <Select
                value={currLang}
                className="w-full"
                onChange={setLang}
                options={languageOptions}
              />
            </Form.Item>

            {/* 开机自动启动设置 */}
            <Form.Item label={t`LaunchStartup`}>
              <Switch
                value={AppSetting.get().isAutoLauncher}
                checkedChildren="Startup"
                unCheckedChildren="Close"
                onChange={handleAutoLauncherChange}
              />
            </Form.Item>

            {/* 应用退出行为设置 */}
            <Form.Item label={t`Exit Action`}>
              <Radio.Group
                value={(electronData.get() as any).closeAction}
                onChange={(e) => handleCloseActionChange(e.target.value)}
              >
                <Radio value="minimize">{t`Minimize to Tray`}</Radio>
                <Radio value="exit">{t`Exit Application`}</Radio>
                <Radio value={0}>{t`Ask Every Time`}</Radio>
              </Radio.Group>
            </Form.Item>

            {/* 自动同步设置 */}
            <Form.Item
              label={t`autoSync`}
              tooltip={t`This is an experimental feature, 5min sync once`}
            >
              <Switch
                checkedChildren="AutoSync"
                unCheckedChildren="Close"
                value={(electronData.get() as any).autoSync}
                onChange={handleAutoSyncChange}
              />
            </Form.Item>

            {/* MCP 工具调用超时设置 */}
            <Form.Item label={t`mcpCallToolTimeout`}>
              <InputNumber
                className="w-full"
                value={AppSetting.get().mcpCallToolTimeout}
                onChange={handleMcpTimeoutChange}
              />
            </Form.Item>

            {/* Web 访问密码设置 */}
            <Form.Item label={t`web asscess password`}>
              <Space.Compact>
                <Input
                  className="w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value || "123456")}
                />
                <Button onClick={handlePasswordUpdate}>
                  {t`Update`}
                </Button>
                <Button onClick={handleOpenWeb}>
                  OpenWeb({`${location.protocol}//${location.hostname}:${port.current}/${electronData.get().password}/`})
                </Button>
              </Space.Compact>
            </Form.Item>

            {/* 浏览器网络设置（仅在浏览器环境显示） */}
            {isOnBrowser && (
              <Form.Item label={t`Network Settings`}>
                <Radio.Group
                  options={networkOptions}
                  value={(electronData.get() as any).browserNetworkSetting}
                  onChange={(e) => handleNetworkSettingChange(e.target.value)}
                />
              </Form.Item>
            )}

            {/* 启动窗口尺寸设置（非浏览器环境） */}
            {!isOnBrowser && (
              <Form.Item label={t`Startup window size`}>
                <Select
                  options={windowSizeOptions}
                  value={`${electronData.get().windowSize.width}x${electronData.get().windowSize.height}`}
                  onChange={handleWindowSizeChange}
                />
              </Form.Item>
            )}

            {/* 开发者模式设置 */}
            <Form.Item label={t`Develop Mode`}>
              <Switch
                value={(electronData.get() as any).isDeveloper}
                onChange={handleDeveloperModeChange}
              />
            </Form.Item>

            {/* 清理聊天记录功能 */}
            <Form.Item
              label={t`ClearChatHistory(exclude Star)`}
              name="deleteChatRecord"
            >
              <Space wrap>
                <InputNumber 
                  placeholder="day" 
                  value={day} 
                  onChange={(value) => setDay(value || 30)}
                />
                <Button onClick={handleClearChatHistory}>
                  {t`Clear logs older than `}{day}{t` days`}
                </Button>
              </Space>
            </Form.Item>

            {/* 开发者工具和调试功能 */}
            <Form.Item label={t`DevTools`} name="openDevTools">
              <Space wrap>
                {!isOnBrowser && (
                  <Button onClick={handleOpenDevTools}>
                    {t`openDevTools`}({(window as any).electron?.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I'})
                  </Button>
                )}
                <Button onClick={handleOpenLogFile}>
                  {t`logFile`}
                </Button>
                <Button onClick={handleOpenAppDataDir}>
                  {t`appDataDir`}
                </Button>
              </Space>
            </Form.Item>

            {/* ==================== 项目链接区域 ==================== */}
            
            {/* GitHub 链接 */}
            <Form.Item label="GitHub" name="GitHub">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://github.com/BigSweetPotatoStudio/HyperChat"
              >
                https://github.com/BigSweetPotatoStudio/HyperChat
              </a>
            </Form.Item>

            {/* Telegram 链接 */}
            <Form.Item label="Telegram" name="Telegram">
              <a 
                target="_blank" 
                rel="noopener noreferrer"
                href="https://t.me/dadigua001"
              >
                https://t.me/dadigua001
              </a>
            </Form.Item>

            {/* QQ群链接 */}
            <Form.Item label="QQ群" name="QQ群">
              <a
                className="flex items-center text-blue-500"
                target="_blank"
                rel="noopener noreferrer"
                href="https://qm.qq.com/cgi-bin/qm/qr?k=KrNWdu5sp7H3ves3ZPSd7ppKjQiPrAvZ&jump_from=webapi&authKey=xnW+Lcgk5KLh5NPh3lU0ddz9CFDbXgvjEy35wsYipUrCsqXFcqlvM5Yorh6jkGim"
              >
                759977131
              </a>
            </Form.Item>
          </Form>

          {/* ==================== 免费开源声明 ==================== */}
          <div className="text-red-500 my-4">
            {t`This software is free and OpenSource. Feel free to follow me, and I
            will bring more utility software.`}
          </div>

          {/* ==================== 开发者联系方式 ==================== */}
          <Form
            layout="horizontal"
            name="contactInfo"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            autoComplete="off"
          >
            <Form.Item label="Email" name="Email">
              <a href="mailto:0laopo0@gmail.com">0laopo0@gmail.com</a>
            </Form.Item>
            
            <Form.Item label="小红书" name="小红书">
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.xiaohongshu.com/user/profile/5f0dc4fc0000000001005234"
              >
                大地瓜的小红书
              </a>
            </Form.Item>
            
            <Form.Item label="X(Twitter)" name="X(Twitter)">
              <a 
                target="_blank" 
                rel="noopener noreferrer" 
                href="https://x.com/ddg85479319"
              >
                Twitter
              </a>
            </Form.Item>
            
            <Form.Item label="Bilibili" name="Bilibili">
              <a 
                target="_blank" 
                rel="noopener noreferrer" 
                href="https://space.bilibili.com/96150707"
              >
                大地瓜的Bilibili
              </a>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};
