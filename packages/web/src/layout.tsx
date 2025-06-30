/**
 * Layout 组件说明：
 * 
 * 这是 HyperChat Web 前端应用的主布局组件，负责：
 * 1. 全局状态管理 - 管理语言设置、主题、同步状态等
 * 2. 路由导航 - 提供侧边栏导航和页面路由
 * 3. 消息处理 - 监听来自主进程的各种消息并响应
 * 4. 初始化逻辑 - 初始化各种数据源和服务
 * 5. UI 交互 - 提供用户界面交互功能
 * 
 * 主要功能模块：
 * - ProLayout: 基于 Ant Design Pro 的布局组件
 * - 主题切换: 支持明暗主题切换
 * - 语言切换: 支持中英文切换
 * - MCP 客户端管理: 管理模型上下文协议客户端
 * - 同步功能: 与后端数据同步
 * - 更新检查: 自动检查应用更新
 * - AI 提供商设置: 管理 AI 模型配置
 */


import React, { createContext, useEffect, useState } from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { v4 } from "uuid";
import OpenAI from "openai";
import Clarity from "@microsoft/clarity";
import {
  Button,
  Table,
  Switch,
  Modal,
  message,
  Radio,
  Input,
  Tabs,
  ConfigProvider,
  Popconfirm,
  Popover,
  Dropdown,
  Space,
  MenuProps,
  Select,
  Spin,
  Progress,
  Form,
  Divider,
  Tooltip,
  InputNumber,
  Tag,
  Timeline,
  notification,
  Drawer,
} from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";

import {
  AndroidOutlined,
  CheckOutlined,
  ChromeFilled,
  CloseOutlined,
  CloudOutlined,
  CrownFilled,
  DownOutlined,
  ExclamationCircleFilled,
  GiftOutlined,
  GithubFilled,
  InfoCircleFilled,
  LoadingOutlined,
  LogoutOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  QuestionCircleFilled,
  RocketOutlined,
  SmileFilled,
  SmileOutlined,
  SyncOutlined,
  TabletFilled,
} from "@ant-design/icons";

import { HeaderContext } from "./common/context";
import {
  PageContainer,
  ProBreadcrumb,
  ProCard,
  ProLayout,
} from "@ant-design/pro-components";
import { getLayoutRoute } from "./router";
import { currLang, setCurrLang, t } from "./i18n";
import { call, callElectron, msg_receive } from "./common/call";
import {
  AppSetting,
  ChatHistory, 
  DataList,
  electronData,
  AI_MODELS,
  IMCPClient,
  KNOWLEDGE_BASE,
  MCP_CONFIG,
} from "@hyperchat/shared/data.mjs";
import { InitedClient, initMcpClients, setClients } from "./common/mcp";
import { EVENT } from "./common/event";
import { DndTable } from "./common/dndTable";
import { sleep } from "./common/sleep";
import { InputPlus } from "./common/input_plus";
import { rejects } from "assert";
import {
  enable as enableDarkMode,
  disable as disableDarkMode,
  auto as followSystemColorScheme,
  exportGeneratedCSS as collectCSS,
  isEnabled as isDarkReaderEnabled,
  setFetchMethod as setDarkReaderFetchMethod,
} from "darkreader";
import { Pre } from "./components/pre";
import { Icon } from "./components/icon";
import { getDefaultModelConfigSync } from "./components/ai";
import { ProviderSettings } from "./components/ProviderSettings";

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
  type: "sync";
  data: {
    status: number;
  };
}

interface McpClientMessage {
  type: "changeMcpClient";
  data: InitedClient[];
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

/**
 * 应用程序主布局组件
 * 提供全局导航、主题切换、语言切换等功能
 * 管理 MCP 客户端、同步状态、更新检查等全局状态
 */
export function Layout(): JSX.Element {
  // 用于触发组件重新渲染的计数器
  const [num, setNum] = useState<number>(0);
  
  /**
   * 刷新组件的函数
   * 通过更新状态来触发组件重新渲染
   */
  function refresh(): void {
    setNum((n) => n + 1);
  }
  
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
      // 如果访问根路径，自动重定向到聊天页面
      if (location.pathname == "/") {
        navigate("/Chat");
      }
    });
    
    // 注册模型配置打开事件监听器
    EVENT.on("setIsModelConfigOpenTrue", () => {
      setIsModelConfigOpen(true);
    });
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
      if (res.type == "sync") {
        setSyncStatus(res.data.status);
        if (res.data.status == 0) {
          // 同步完成后刷新组件
          setTimeout(() => {
            refresh();
          }, 500);
          refresh();
        }
      }
      
      // 处理 MCP 客户端变化
      if (res.type === "changeMcpClient") {
        setMcpClients(res.data);
        setClients(res.data);
        
        // 设置全局工具获取函数
        window.getTools = (allowMCPs?: string[]) => {
          let tools: IMCPClient["tools"] = [];

          res.data.forEach((v) => {
            tools = tools.concat(
              v.tools.filter((t) => {
                if (!allowMCPs) return true;
                return (
                  allowMCPs.includes(t.clientName) || allowMCPs.includes(t.restore_name)
                );
              }),
            );
          });
          return tools;
        }
      }
    });
  }, []);
  /**
   * 应用初始化逻辑
   * 初始化数据、检查更新、设置分析工具等
   */
  useEffect(() => {
    (async () => {
      // 并行初始化各种数据源
      await Promise.all([
        AI_MODELS.init(),
        MCP_CONFIG.init(),
        KNOWLEDGE_BASE.init(),
        electronData.init(),
      ]);
      refresh();
      
      // 如果在 Electron 环境中，检查更新
      if (process.env.myRuntime == "electron") {
        let res = await callElectron("checkUpdate");
        if (res) {
          console.log("checkUpdate: ", res);
        }
      }
      
      // 初始化 MCP 客户端
      await initMcpClients();
      refresh();
      
      // 初始化 Microsoft Clarity 分析工具
      Clarity.init("p731bym3zs");
      Clarity.consent();
      Clarity.event("openApp");
      Clarity.setTag("env", process.env.NODE_ENV);
      Clarity.event(
        `openApp-${process.env.NODE_ENV}-${electronData.get().version}`,
      );
      Clarity.setTag("version", electronData.get().version);
    })();
  }, []);

  // 状态管理
  const [locale, setLocal] = useState(currLang == "zhCN" ? zhCN : enUS); // 国际化语言设置
  const [collapsed, setCollapsed] = useState<boolean>(false); // 侧边栏折叠状态
  const [isModelConfigOpen, setIsModelConfigOpen] = useState<boolean>(false); // AI 提供商设置抽屉是否打开
  const [mcpClients, setMcpClients] = useState<InitedClient[]>([]); // MCP 客户端列表
  const [syncStatus, setSyncStatus] = useState<number>(0); // 同步状态：0-正常，1-同步中，-1-失败
  const [updateData, setUpdateData] = useState<UpdateMessage["data"]>({} as any); // 更新数据
  /**
   * 初始化应用设置
   */
  useEffect(() => {
    (async () => {
      await AppSetting.init();
      refresh();
    })();
  }, []);

  /**
   * 设置语言的函数
   * @param e 语言代码 ("zhCN" | "enUS")
   */
  const setLang = (e: string): void => {
    setCurrLang(e);
    setLocal(e == "zhCN" ? zhCN : enUS);
    refresh();
  };
  
  // 获取默认模型配置
  let defaultModel = getDefaultModelConfigSync(AI_MODELS);

  return (
    <ConfigProvider locale={locale}>
      <div style={{ width: "100%", margin: "0px auto" }}>
        <ProLayout
          prefixCls="my-prefix"
          collapsed={collapsed}
          onCollapse={(collapsed) => {
            setCollapsed(collapsed);
          }}
          route={getLayoutRoute()}
          location={{
            pathname: location.pathname,
          }}
          token={{
            header: {
              colorBgMenuItemSelected: "rgba(0,0,0,0.04)",
            },
          }}
          siderMenuType="group"
          menu={{
            collapsedShowGroupTitle: true,
          }}
          /**
           * 动作渲染器 - 右上角的操作按钮区域
           * 包含 GitHub 链接、AI 提供商设置、语言切换、主题切换等
           */
          actionsRender={(props) => {
            return (
              <Space>
                {/* GitHub 链接 */}
                <a href="https://github.com/BigSweetPotatoStudio/HyperChat">
                  <GithubFilled></GithubFilled>
                </a>
                
                {/* AI 提供商设置按钮 */}
                <Button
                  onClick={() => {
                    setIsModelConfigOpen(true);
                  }}
                  icon={<Icon name="brain" />}
                >
                  {t`AI Providers`}
                </Button>
                
                {/* 语言切换选择器 */}
                <Select
                  className="hidden lg:inline-block"
                  value={currLang}
                  style={{ width: 120 }}
                  onChange={(e) => {
                    setLang(e);
                  }}
                  options={[
                    { value: "zhCN", label: "中文" },
                    { value: "enUS", label: "English" },
                  ]}
                />

                {/* 主题切换开关 */}
                <Switch
                  checkedChildren={"🌙"}
                  unCheckedChildren={"☀️"}
                  checked={AppSetting.get().darkTheme}
                  onChange={async (checked) => {
                    AppSetting.get().darkTheme = checked;
                    await AppSetting.save();
                    refresh();
                    
                    // 应用主题设置
                    if (checked) {
                      enableDarkMode({
                        brightness: 100,
                        contrast: 90,
                        sepia: 10,
                      });
                    } else {
                      disableDarkMode();
                    }
                  }}
                />
              </Space>
            );
          }}
          /**
           * 头像区域渲染器 - 右上角的用户操作区域
           * 显示同步状态按钮
           */
          avatarProps={{
            render: (props, dom) => {
              return (
                <>
                  {/* 同步状态按钮 */}
                  <Button
                    type="link"
                    style={{
                      color:
                        syncStatus == 1
                          ? undefined // 同步中 - 默认颜色
                          : syncStatus == -1
                            ? "red" // 同步失败 - 红色
                            : "gray", // 正常状态 - 灰色
                    }}
                    onClick={() => {
                      navigate("./Setting/WebdavSetting");
                    }}
                  >
                    <SyncOutlined spin={syncStatus == 1} />
                    {syncStatus == 1
                      ? "Syncing"
                      : syncStatus == -1
                        ? "Failed"
                        : "Sync"}
                  </Button>
                </>
              );
            },
          }}
          /**
           * 应用 Logo 区域
           * 点击可跳转到首页
           */
          logo={
            <img
              onClick={() => {
                window.location.hash = "#/Home";
              }}
              src="./assets/favicon.png"
            ></img>
          }
          /**
           * 头部标题渲染器
           * 显示应用名称、版本号和更新提示
           */
          headerTitleRender={(logo, title, _) => {
            return (
              <Link to="Home">
                HyperChat
                <span>
                  ({electronData.get().version})
                  {/* 有新版本时显示更新标签 */}
                  {updateData.info && (
                    <Tag 
                      className=" text-red-600" 
                      onClick={() => {
                        Modal.confirm({
                          title: t`A new version is available`,
                          width: "80%",
                          style: {
                            maxWidth: 1024,
                          },
                          content: (
                            <div>
                              <div>current version: {electronData.get().version}</div>
                              <div>latest version: {updateData.info.version}</div>
                              {updateData.info.releaseName != updateData.info.version && (
                                <div>title: {updateData.info.releaseName}</div>
                              )}
                              <div>
                                changelog:{" "}
                                {typeof updateData.info.releaseNotes == "string" ? (
                                  <div
                                    style={{ color: "gray" }}
                                    dangerouslySetInnerHTML={{
                                      __html: updateData.info.releaseNotes,
                                    }}
                                  ></div>
                                ) : (
                                  updateData.info.releaseNotes.map((x, index) => {
                                    return (
                                      <div 
                                        key={index}
                                        dangerouslySetInnerHTML={{ __html: x.note }}
                                      ></div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          ),
                          okText: t`Download And Update`,
                          onOk: async () => {
                            callElectron("checkUpdateDownload");
                          },
                        });
                      }}
                    >
                      {`New`}
                    </Tag>
                  )}
                </span>
              </Link>
            );
          }}
          /**
           * 菜单页脚渲染器
           * 在侧边栏底部显示欢迎信息
           */
          menuFooterRender={(props) => {
            if (props?.collapsed) return undefined;
            return (
              <div
                style={{
                  textAlign: "center",
                  paddingBlockStart: 12,
                }}
              >
                Welcome to use
              </div>
            );
          }}
          /**
           * 菜单项渲染器
           * 将菜单项包装为 React Router 链接
           */
          menuItemRender={(item, dom) => <Link to={item.path}>{dom}</Link>}
          layout="mix"
          splitMenus={true}
        >
          {/* 头部上下文提供者 - 向子组件传递全局状态 */}
          <HeaderContext.Provider
            value={{
              globalState: num, 
              updateGlobalState: refresh, 
              setLang,
              mcpClients,
            }}
          >
            <Outlet />
          </HeaderContext.Provider>
        </ProLayout>
        
        {/* AI 提供商设置抽屉 */}
        <Drawer
          width={1000}
          title={t`AI Provider Settings`}
          open={isModelConfigOpen}
          onClose={() => {
            setIsModelConfigOpen(false);
          }}
          styles={{
            body: {
              padding: 0,
            }
          }}
        >
          <ProviderSettings />
        </Drawer>      </div>
    </ConfigProvider>
  );
}
