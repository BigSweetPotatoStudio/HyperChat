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
import { call, msg_receive } from "./common/call";
import {
  AppSetting,
  ChatHistory,  DataList,
  electronData,
  GPT_MODELS,
  IMCPClient,
  KNOWLEDGE_BASE,
  MCP_CONFIG,
} from "../../shared/data.mjs";
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
import { OpenAICompatibility } from "./common/openai-compatibility";
import { ProviderSettings } from "./components/ProviderSettings";

setDarkReaderFetchMethod((url) => {
  return fetch(url, {
    credentials: "omit",
    mode: "no-cors",
  });
})



msg_receive("message-from-main", (msg) => {
  if (msg.type == "TaskResult") {
    // setTimeout(() => {
    //   ChatHistory.init();
    // }, 300);
    notification.open({
      message: (
        <div>
          <span className="text-red-400">{msg.data.task.name}</span> Task Done
          by agent: <Tag color="blue">{msg.data.agent.label}</Tag>
        </div>
      ),
      description: msg.data.result,
      onClick: () => {
        // console.log("Notification Clicked!");
        try {
          window["w"]["navigate"](`/Task/Results?taskKey=${msg.data.task.key}`);
        } catch (e) { }
      },
      duration: 10 * 1000,
    });
  }
});

export function Layout() {
  const [num, setNum] = useState(0);
  function refresh() {
    setNum((n) => n + 1);
  }
  const navigate = useNavigate();
  const location = useLocation();
  // console.log(location.pathname); // 输出当前路径
  window["w"] = {};
  window["w"]["navigate"] = navigate;
  window["w"]["location"] = location;

  useEffect(() => {
    setTimeout(() => {
      if (location.pathname == "/") {
        navigate("/Chat");
      }
    });
    // EVENT.on("setIsToolsShowTrue", () => {
    //   setIsToolsShow(true);
    // });
    EVENT.on("setIsModelConfigOpenTrue", () => {
      setIsModelConfigOpen(true);
    });
  }, []);
  useEffect(() => {
    msg_receive("message-from-main", async (res: any) => {
      // console.log("UpdateMsg! ", res);

      if (res.type == "UpdateMsg" && res.data.status == 1) {
        setUpdateData(res.data);
      }

      if (res.type == "UpdateMsg" && res.data.status == 4) {
        Modal.confirm({
          title: "Update",
          content:
            "The new version has been downloaded, do you want to restart and update?",
          icon: <ExclamationCircleFilled />,
          okText: "Restart And Update",
          onOk() {
            call("quitAndInstall");
          },
        });
      }

      if (res.type == "sync") {
        setSyncStatus(res.data.status);
        if (res.data.status == 0) {
          // for (let data of DataList) {
          //   if (data.options.sync) {
          //     await data.init();
          //   }
          // }
          setTimeout(() => {
            refresh();
          }, 500);
          refresh();
        }
      }
      if (res.type === "changeMcpClient") {
        setMcpClients(res.data);
        setClients(res.data);
        window.getTools = (allowMCPs) => {
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
  useEffect(() => {
    (async () => {
      await Promise.all([
        GPT_MODELS.init(),
        MCP_CONFIG.init(),
        KNOWLEDGE_BASE.init(),
        electronData.init(),
      ]);
      refresh();

      let res = await call("checkUpdate");
      if (res) {
        console.log("checkUpdate: ", res);
      }
      await initMcpClients();
      refresh();
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

  const [locale, setLocal] = useState(currLang == "zhCN" ? zhCN : enUS);  const [collapsed, setCollapsed] = useState(false);
  const [isModelConfigOpen, setIsModelConfigOpen] = useState(false);
  const [mcpClients, setMcpClients] = useState<InitedClient[]>([]);

  const [syncStatus, setSyncStatus] = useState(0);

  const [updateData, setUpdateData] = useState({} as any);
  useEffect(() => {
    (async () => {
      await AppSetting.init();
      refresh();
    })();
  }, []);

  const setLang = (e) => {
    setCurrLang(e);
    setLocal(e == "zhCN" ? zhCN : enUS);
    refresh();
  };
  let defaultModel = getDefaultModelConfigSync(GPT_MODELS);

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
          actionsRender={(props) => {
            return (
              <Space>
                <a href="https://github.com/BigSweetPotatoStudio/HyperChat">
                  <GithubFilled></GithubFilled>
                </a>                <Button
                  onClick={() => {
                    setIsModelConfigOpen(true);
                  }}
                  icon={<Icon name="brain" />}
                >
                  {t`AI Providers`}
                </Button>
                <Select
                  className="hidden lg:inline-block"
                  value={currLang}
                  style={{ width: 120 }}
                  onChange={(e) => {
                    // setCurrLang(e);
                    // setLocal(e == "zhCN" ? zhCN : enUS);
                    // refresh();
                    setLang(e);
                  }}
                  options={[
                    { value: "zhCN", label: "中文" },
                    { value: "enUS", label: "English" },
                  ]}
                />

                <Switch
                  checkedChildren={"🌙"}
                  unCheckedChildren={"☀️"}
                  checked={AppSetting.get().darkTheme}
                  onChange={async (checked) => {
                    AppSetting.get().darkTheme = checked;
                    await AppSetting.save();
                    refresh();
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
          avatarProps={{
            // src: user.icon,
            // size: "small",
            // title: (user.name || "用户") + `(${user.email || "去登录"})`,
            render: (props, dom) => {
              return (
                <>
                  {/* <Button>
                 
                    任务
                  </Button> */}

                  <Button
                    type="link"
                    style={{
                      color:
                        syncStatus == 1
                          ? undefined
                          : syncStatus == -1
                            ? "red"
                            : "gray",
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
          logo={
            <img
              onClick={() => {
                window.location.hash = "#/Home";
              }}
              src="./assets/favicon.png"
            ></img>
          }
          headerTitleRender={(logo, title, _) => {
            return (
              <Link to="Home">
                HyperChat<span>({electronData.get().version}){updateData.info && <Tag className=" text-red-600" onClick={() => {
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
                            updateData.info.releaseNotes.map((x) => {
                              return (
                                <div dangerouslySetInnerHTML={{ __html: x.note }}></div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ),
                    okText: t`Download And Update`,
                    onOk: async () => {
                      call("checkUpdateDownload");
                    },
                  });
                }}>{`New`}</Tag>}</span>
              </Link>
            );
          }}
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
          // breadcrumbRender={(routers = []) => {
          //   // console.log(routers);
          //   return [
          //     // { path: "/", breadcrumbName: "主页" },
          //     ...routers,
          //   ];
          // }}
          // onMenuHeaderClick={(e) => console.log(e)}
          menuItemRender={(item, dom) => <Link to={item.path}>{dom}</Link>}
          layout="mix"
          splitMenus={true}
        >
          <HeaderContext.Provider
            value={{
              globalState: num, updateGlobalState: refresh, setLang,
              mcpClients,

            }}
          >
            <Outlet />
          </HeaderContext.Provider>
        </ProLayout>        <Drawer
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

// layout.tsx 作为 Web 前端的全局布局组件，负责导航、主题、路由等统一管理
// 这里省略部分实现，实际包含侧边栏、头部、内容区等
