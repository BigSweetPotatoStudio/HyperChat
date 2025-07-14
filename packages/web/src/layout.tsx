/**
 * Layout 组件说明：
 * 
 * 这是 HyperChat Web 前端应用的主布局组件，负责：
 * 1. 全局状态管理 - 管理语言设置、主题、同步状态等
 * 2. 路由导航 - 提供简单的导航和页面路由
 * 3. 消息处理 - 监听来自主进程的各种消息并响应
 * 4. 初始化逻辑 - 初始化各种数据源和服务
 * 5. UI 交互 - 提供用户界面交互功能
 * 
 * 主要功能模块：
 * - Layout: 基于 Ant Design 的标准布局组件
 * - 主题切换: 支持明暗主题切换
 * - 语言切换: 支持中英文切换
 * - MCP 客户端管理: 管理模型上下文协议客户端
 * - 同步功能: 与后端数据同步
 * - 更新检查: 自动检查应用更新
 * - AI 提供商设置: 管理 AI 模型配置
 */


import React, { createContext, useEffect, useState, useRef } from "react";
import { useForceUpdate } from "./hooks/useForceUpdate";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Clarity from "@microsoft/clarity";
import {
  Modal,
  ConfigProvider,
  Tag,
  notification,
  Layout as AntLayout,
  theme,
} from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";

import {
  ExclamationCircleFilled,
} from "@ant-design/icons";

import { HeaderContext } from "./common/context";
import { getCurrLang, setCurrLang, t } from "./i18n";
import type { Language } from "@dadigua/hyperchat-shared";
import { call, callElectron, msg_receive } from "./common/call";
import {

} from "@dadigua/hyperchat-shared/types";
import { InitedClient, setClients } from "./common/mcp";
import { EVENT } from "./common/event";
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
  auto as followSystemColorScheme,
  exportGeneratedCSS as collectCSS,
  isEnabled as isDarkReaderEnabled,
  setFetchMethod as setDarkReaderFetchMethod,
} from "darkreader";

// 定义消息类型
interface TaskResultMessage {
  type: "TaskResult";
  data: {
    task: {
      name: string;
      key: string;
    };
    agent: {
      label: string;
    };
    result: string;
  };
}

interface UpdateMessage {
  type: "UpdateMsg";
  data: {
    status: number;
    info?: {
      version: string;
      releaseName: string;
      releaseNotes: string | Array<{ note: string }>;
    };
  };
}

interface SyncMessage {
  type: "syncMsg";
  data: {
    status: number;
  };
}

interface McpClientMessage {
  type: "changeMcpClient";
  data: InitedClient;
}

// 联合类型定义所有可能的消息类型
type MessageFromMain = TaskResultMessage | UpdateMessage | SyncMessage | McpClientMessage;



/**
 * 设置 DarkReader 的 fetch 方法
 * 用于处理跨域请求和凭证管理
 */
setDarkReaderFetchMethod((url) => {
  return fetch(url, {
    credentials: "omit",
    mode: "no-cors",
  });
});

/**
 * 监听来自主进程的消息
 * 处理任务结果通知
 */
msg_receive("message-from-main", (msg: MessageFromMain) => {
  if (msg.type == "TaskResult") {
    // 显示任务完成通知
    notification.open({
      message: (
        <div>
          <span className="text-red-400">{msg.data.task.name}</span> Task Done
          by agent: <Tag color="blue">{msg.data.agent.label}</Tag>
        </div>
      ),
      description: msg.data.result,
      onClick: () => {
        try {
          // 导航到任务结果页面
          window.w.navigate(`/Task/Results?taskKey=${msg.data.task.key}`);
        } catch (e) {
          console.error("Navigation error:", e);
        }
      },
      duration: 10 * 1000,
    });
  }
});

const { Header, Content } = AntLayout;

/**
 * 应用程序主布局组件
 * 提供全局导航、主题切换、语言切换等功能
 * 管理 MCP 客户端、同步状态、更新检查等全局状态
 */
export function Layout() {
  // 使用强制更新 hook
  const refresh = useForceUpdate();

  // 全局状态版本号，用于组件间通信
  const [globalStateVersion, setGlobalStateVersion] = useState<number>(0);

  // 组合的刷新函数，同时更新强制刷新和全局状态版本
  const combinedRefresh = (): void => {
    refresh();
    setGlobalStateVersion(prev => prev + 1);
  };

  const navigate = useNavigate();
  const location = useLocation();

  // 将导航函数和位置信息暴露到全局 window 对象
  window["w"] = {
    navigate,
    location
  };

  /**
   * 组件挂载时的初始化逻辑
   * 处理路由重定向和事件监听器注册
   */
  useEffect(() => {
    setTimeout(() => {
      // 如果访问根路径，自动重定向到工作区页面
      if (location.pathname == "/") {
        navigate("/Workspace");
      }
    });

    // 注册模型配置打开事件监听器
    // EVENT.on("setIsModelConfigOpenTrue", () => {
    //   setIsModelConfigOpen(true);
    // });
  }, []);
  /**
   * 监听来自主进程的消息
   * 处理更新通知、同步状态、MCP 客户端变化等
   */
  useEffect(() => {
    msg_receive("message-from-main", async (res: MessageFromMain) => {
      // 处理更新消息
      if (res.type == "UpdateMsg" && res.data.status == 1) {
        setUpdateData(res.data);
      }

      // 处理更新下载完成消息
      if (res.type == "UpdateMsg" && res.data.status == 4) {
        Modal.confirm({
          title: "Update",
          content:
            "The new version has been downloaded, do you want to restart and update?",
          icon: <ExclamationCircleFilled />,
          okText: "Restart And Update",
          onOk() {
            callElectron("quitAndInstall");
          },
        });
      }

      // 处理同步状态变化
      if (res.type == "syncMsg") {
        setSyncStatus(res.data.status);
        if (res.data.status == 0) {
          // 同步完成后刷新组件
          setTimeout(() => {
            combinedRefresh();
          }, 500);
          combinedRefresh();
        }
      }

      // // 处理 MCP 客户端变化
      // if (res.type === "changeMcpClient") {
      //   // 支持单个客户端更新或批量替换，通过 ref 更新并触发刷新
      //   const payload = res.data;

      //   if (payload.status === "deleted") {
      //     const idx = mcpClientsRef.current.findIndex((c) => c.name === payload.name);
      //     if (idx >= 0) mcpClientsRef.current.splice(idx, 1);
      //     combinedRefresh();
      //     setClients(mcpClientsRef.current);
      //   } else {
      //     const idx = mcpClientsRef.current.findIndex((c) => c.name === payload.name);
      //     if (idx >= 0) mcpClientsRef.current[idx] = payload;
      //     mcpClientsRef.current = mcpClientsRef.current;
      //     combinedRefresh();
      //     // 同步全局
      //     setClients(mcpClientsRef.current);
      //   }
      //   window.getTools = (allowMCPs?: string[]) => {
      //     let tools: IMCPClient["tools"] = [];

      //     mcpClientsRef.current.forEach((v) => {
      //       tools = tools.concat(
      //         v.tools.filter((t) => {
      //           if (!allowMCPs) return true;
      //           return (
      //             allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
      //           );
      //         }),
      //       );
      //     });
      //     return tools;
      //   }
      // }
    });
  }, []);
  /**
   * 应用初始化逻辑
   * 初始化数据、检查更新、设置分析工具等
   */
  useEffect(() => {
    (async () => {

      // 如果在 Electron 环境中，检查更新
      if (process.env.myRuntime == "electron") {
        let res = await callElectron("checkUpdate");
        if (res) {
          console.log("checkUpdate: ", res);
        }
      }

      // // 初始化 MCP 客户端
      // let res = await call("initMcpClients");
      // for (let client of res) {
      //   let index = mcpClientsRef.current.findIndex((c) => c.name === client.name);
      //   if (index === -1) {
      //     mcpClientsRef.current.push(client);
      //   } else {
      //     mcpClientsRef.current[index] = client;
      //   }
      // }
      // setClients(mcpClientsRef.current);
      // combinedRefresh();

      try {
        // 初始化 Microsoft Clarity 分析工具
        Clarity.init("p731bym3zs");
        Clarity.consent();
        Clarity.event("openApp");
        Clarity.setTag("env", process.env.NODE_ENV || "unknown");

      } catch (e) {
        console.error("Clarity error:", e);
      }
    })();
  }, []);

  // 状态管理
  const [locale, setLocal] = useState(getCurrLang() === "zhCN" ? zhCN : enUS); // 国际化语言设置
  const [isModelConfigOpen, setIsModelConfigOpen] = useState<boolean>(false); // AI 提供商设置抽屉是否打开
  const mcpClientsRef = useRef<InitedClient[]>([]); // MCP 客户端列表
  const [syncStatus, setSyncStatus] = useState<number>(0); // 同步状态：0-正常，1-同步中，-1-失败
  const [updateData, setUpdateData] = useState<UpdateMessage["data"]>({} as any); // 更新数据

  /**
   * 设置语言的函数
   * @param e 语言代码 ("zhCN" | "enUS")
   */
  const setLang = (e: string): void => {
    const lang = e as Language;
    setCurrLang(lang);
    setLocal(lang === "zhCN" ? zhCN : enUS);
    combinedRefresh();
  };



  return (
    <ConfigProvider
      locale={locale}
      theme={{
        algorithm: theme.compactAlgorithm, // 紧凑主题
        token: {
          // 主要品牌色
          colorPrimary: "#91bcf8",
          // 成功色
          colorSuccess: '#52c41a',
          // 警告色  
          colorWarning: '#faad14',
          // 错误色
          colorError: '#ff4d4f',
          // 字体大小
          fontSize: 14,
          // 边框圆角
          borderRadius: 6,
        },
      }}
    >
      <AntLayout style={{ minHeight: "100vh" }}>
        <Content style={{ padding: "0" }}>
          {/* 头部上下文提供者 - 向子组件传递全局状态 */}
          <HeaderContext.Provider
            value={{
              globalState: globalStateVersion,
              updateGlobalState: combinedRefresh,
              setLang,
            }}
          >
            <Outlet />
          </HeaderContext.Provider>
        </Content>

      </AntLayout>
    </ConfigProvider>
  );
}
