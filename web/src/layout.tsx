import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { v4 } from "uuid";
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
import { route as routerRoute } from "./router";
import { currLang, setCurrLang, t } from "./i18n";
import { call } from "./common/call";
import {
  AppSetting,
  electronData,
  GPT_MODELS,
  MCP_CONFIG,
} from "./common/data";
import { getClients } from "./common/mcp";
import { EVENT } from "./common/event";
import { OpenAiChannel } from "./common/openai";
import { DndTable } from "./common/dndTable";
import { sleep } from "./common/sleep";
import { InputPlus } from "./common/input_plus";
import { e } from "./common/service";

type ProviderType = {
  label: string;
  baseURL: string;
  apiKey?: string;
  call_tool_step?: number;
  value: string;
  models?: string[];
};

const Providers: ProviderType[] = [
  {
    label: "OpenAI",
    baseURL: "https://api.openai.com/v1",
    value: "openai",
    models: [
      "gpt-4o-mini",
      "gpt-4o",
      "o1-mini",
      "o1",
      "o1-preview",
      "chatgpt-4o-latest",
    ],
  },
  {
    label: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    value: "openrouter",
    models: [
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-haiku-20241022:beta",
      "google/gemini-2.0-flash-001",
    ],
  },
  {
    label: "Gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    value: "gemini",
    models: [
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash-thinking-exp",
      "gemini-2.0-flash",
      "gemini-2.0-flash-001",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-2.0-pro-exp-02-05",
      "gemini-2.0-flash-thinking-exp-01-21",
    ],
  },
  {
    label: "Qwen",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    value: "qwen",
    models: ["qwen-plus", "qwen-turbo", "qwen-max"],
  },
  {
    label: "Ollama",
    baseURL: "http://127.0.0.1:11434/v1",
    apiKey: "ollama",
    value: "ollama",
  },
  {
    label: "DoubBao",
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    value: "doubao",
  },
  {
    label: "GLM",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    value: "glm",
    models: ["glm-4-air"],
  },
  {
    label: "DeepSeek",
    baseURL: "https://api.deepseek.com",
    value: "deepseek",
    call_tool_step: 1,
    models: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    label: "OpenAI Compatibility",
    baseURL: "",
    value: "other",
  },
];

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
  const [route, setRoute] = useState({ ...routerRoute });

  useEffect(() => {
    setTimeout(() => {
      if (location.pathname == "/") {
        navigate("/Chat");
      }
    });
    EVENT.on("setIsToolsShowTrue", () => {
      setIsToolsShow(true);
    });
    EVENT.on("setIsModelConfigOpenTrue", () => {
      setIsModelConfigOpen(true);
    });
  }, []);
  useEffect(() => {}, []);
  useEffect(() => {
    (async () => {
      await GPT_MODELS.init();
      await MCP_CONFIG.init();
      refresh();
    })();
  }, []);

  const [runing, setRuning] = useState(false);
  useEffect(() => {
    let t = setInterval(async () => {
      let historys = await call("getHistory", []);
      if (historys.length > 0) {
        let last = historys[historys.length - 1];
        if (last.status == "success" || last.status == "error") {
          setRuning(false);
        } else {
          setRuning(true);
        }
      } else {
        setRuning(false);
      }
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, []);

  const [locale, setLocal] = useState(currLang == "zhCN" ? zhCN : enUS);
  const [collapsed, setCollapsed] = useState(false);
  const [isModelConfigOpen, setIsModelConfigOpen] = useState(false);
  const [isAddModelConfigOpen, setIsAddModelConfigOpen] = useState(false);
  // const [currRow, setCurrRow] = useState({} as any);
  const [form] = Form.useForm();
  const [mcpform] = Form.useForm();
  const [isToolsShow, setIsToolsShow] = useState(false);

  const [isAddMCPConfigOpen, setIsAddMCPConfigOpen] = useState(false);
  const [loadingOpenMCP, setLoadingOpenMCP] = useState(false);
  const [loadingCheckLLM, setLoadingCheckLLM] = useState(false);
  const [syncStatus, setSyncStatus] = useState(0);
  useEffect(() => {
    window.ext.receive("message-from-main", (res: any) => {
      // console.log("UpdateMsg! ", res);

      if (res.type == "UpdateMsg" && res.data.status == 1) {
        Modal.confirm({
          title: "A new version is available",
          content: (
            <div>
              <div>current version: {electronData.get().version}</div>
              <div>latest version: {res.data.info.version}</div>
              {res.data.info.releaseName != res.data.info.version && (
                <div>title: {res.data.info.releaseName}</div>
              )}
              <div>
                changelog:{" "}
                {typeof res.data.info.releaseNotes == "string" ? (
                  <div
                    style={{ color: "gray" }}
                    dangerouslySetInnerHTML={{
                      __html: res.data.info.releaseNotes,
                    }}
                  ></div>
                ) : (
                  res.data.info.releaseNotes.map((x) => {
                    return (
                      <div dangerouslySetInnerHTML={{ __html: x.note }}></div>
                    );
                  })
                )}
              </div>
            </div>
          ),
          okText: "Download And Update",
          onOk: async () => {
            call("checkUpdateDownload", []);
          },
        });
      }

      if (res.type == "UpdateMsg" && res.data.status == 4) {
        Modal.confirm({
          title: "Update",
          content:
            "The new version has been downloaded, do you want to restart and update?",
          icon: <ExclamationCircleFilled />,
          okText: "Restart And Update",
          onOk() {
            call("quitAndInstall", []);
          },
        });
      }

      if (res.type == "sync") {
        setSyncStatus(res.data.status);
      }
    });
    (async () => {
      await electronData.init();
      Clarity.init("p731bym3zs");
      Clarity.consent();
      Clarity.event("openApp");
      Clarity.setTag("env", process.env.NODE_ENV);
      Clarity.event(
        `openApp-${process.env.NODE_ENV}-${electronData.get().version}`,
      );
      Clarity.setTag("version", electronData.get().version);

      refresh();
      let res = await call("checkUpdate", []);
      if (res) {
        console.log("checkUpdate: ", res);
      }
    })();
  }, []);

  const [timelineData, setTimelineData] = useState([]);
  const [isOpenTestLLM, setIsOpenTestLLM] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      await AppSetting.init();
      refresh();
    })();
  }, []);

  return (
    <ConfigProvider locale={locale}>
      <div style={{ width: "100%", margin: "0px auto" }}>
        <ProLayout
          prefixCls="my-prefix"
          collapsed={collapsed}
          onCollapse={(collapsed) => {
            setCollapsed(collapsed);
          }}
          route={route}
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
                </a>
                <Button
                  onClick={() => {
                    setIsModelConfigOpen(true);
                    if (GPT_MODELS.get().data.length == 0) {
                      form.resetFields();
                      setIsAddModelConfigOpen(true);
                    }
                  }}
                >
                  🧠LLM
                </Button>
                <Select
                  value={currLang}
                  style={{ width: 120 }}
                  onChange={(e) => {
                    setCurrLang(e);
                    setLocal(e == "zhCN" ? zhCN : enUS);
                    window.location.reload();
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
                      window["DarkReader"].enable({
                        brightness: 100,
                        contrast: 90,
                        sepia: 10,
                      });
                    } else {
                      window["DarkReader"].disable();
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
                      navigate("/setting");
                    }}
                  >
                    <SyncOutlined spin={syncStatus == 1} />

                    {syncStatus == 1
                      ? "Syncing"
                      : syncStatus == -1
                        ? "Sync Failed"
                        : "Sync"}
                  </Button>
                </>
              );
            },
          }}
          headerTitleRender={(logo, title, _) => {
            return (
              <Link to="home">
                HyperChat<span>({electronData.get().version})</span>
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
          <HeaderContext.Provider value={{ refresh }}>
            <Outlet />
          </HeaderContext.Provider>
        </ProLayout>

        <Modal
          width={1000}
          title={t`My LLM Models`}
          open={isModelConfigOpen}
          cancelButtonProps={{ style: { display: "none" } }}
          onOk={() => {
            setIsModelConfigOpen(false);
          }}
          onCancel={() => {
            setIsModelConfigOpen(false);
          }}
        >
          <DndTable
            footer={() => (
              <div className="text-center">
                <Button
                  type="link"
                  onClick={() => {
                    form.resetFields();
                    setIsAddModelConfigOpen(true);
                  }}
                >
                  {t`Add`}
                </Button>
                <Button
                  type="link"
                  onClick={async () => {
                    let p = await call("pathJoin", ["gpt_models.json"]);
                    await call("openExplorer", [p]);
                  }}
                >
                  {t`Open the configuration file`}
                </Button>
              </div>
            )}
            size="small"
            pagination={false}
            dataSource={GPT_MODELS.get().data}
            onMove={(data) => {
              GPT_MODELS.get().data = data;
              GPT_MODELS.save();
              refresh();
              EVENT.fire("refresh");
            }}
            columns={[
              {
                title: t`name`,
                dataIndex: "name",
                key: "name",
                width: 200,
                render: (text, record, index) => {
                  return (
                    <div>
                      <div>{text}</div>
                      {record.supportImage && <Tag color="blue">image</Tag>}
                      {record.supportTool && <Tag color="blue">tool</Tag>}
                    </div>
                  );
                },
              },
              {
                title: t`LLM`,
                dataIndex: "model",
                key: "model",
                width: 200,
              },
              {
                title: t`Operation`,
                dataIndex: "key",
                key: "key",
                width: 300,
                render: (text, record, index) => (
                  <div>
                    <Button
                      type="link"
                      onClick={async () => {
                        form.resetFields();
                        if (record.provider == null) {
                          record.provider = "other";
                        }
                        form.setFieldsValue(record);
                        setIsAddModelConfigOpen(true);
                      }}
                    >
                      {t`Edit`}
                    </Button>
                    <Divider type="vertical"></Divider>
                    <Button
                      type="link"
                      onClick={async () => {
                        let clone = { ...record };
                        clone.key = v4();
                        GPT_MODELS.get().data.push(clone);
                        await GPT_MODELS.save();
                        refresh();
                        EVENT.fire("refresh");
                      }}
                    >
                      {t`Clone`}
                    </Button>
                    <Divider type="vertical"></Divider>
                    <Popconfirm
                      title="Confirm"
                      description="Confirm Delete?"
                      onConfirm={async () => {
                        GPT_MODELS.get().data = GPT_MODELS.get().data.filter(
                          (e) => e.key != record.key,
                        );
                        await GPT_MODELS.save();
                        refresh();
                        EVENT.fire("refresh");
                      }}
                    >
                      <Button type="link">{t`Delete`}</Button>
                    </Popconfirm>
                    <Divider type="vertical"></Divider>
                    <Tooltip title="Set default">
                      <Button
                        type="link"
                        onClick={async () => {
                          GPT_MODELS.get().data = GPT_MODELS.get().data.filter(
                            (e) => e.key != record.key,
                          );
                          GPT_MODELS.get().data.unshift(record);
                          await GPT_MODELS.save();
                          refresh();
                          EVENT.fire("refresh");
                        }}
                      >
                        {t`Top`}
                      </Button>
                    </Tooltip>
                  </div>
                ),
              },
            ]}
          />
        </Modal>
        <Modal
          width={600}
          title={t`Configure LLM`}
          open={isAddModelConfigOpen}
          maskClosable={false}
          okButtonProps={{
            autoFocus: true,
            htmlType: "submit",
            loading: loadingCheckLLM,
          }}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsAddModelConfigOpen(false);
          }}
          modalRender={(dom) => (
            <Form
              form={form}
              layout="vertical"
              name="AddModelConfig"
              initialValues={{
                provider: Providers[0].value,
                baseURL: Providers[0].baseURL,
              }}
              clearOnDestroy
              onFinish={async (values) => {
                try {
                  setLoadingCheckLLM(true);
                  // message.info("Testing the configuration, please wait...");
                  setPending(true);
                  setIsOpenTestLLM(true);
                  setTimelineData([
                    {
                      color: "blue",
                      children: "Testing the configuration, please wait...",
                    },
                  ]);
                  let o = new OpenAiChannel(values, []);
                  let testBaseRes = await o.testBase();
                  if (testBaseRes) {
                    setTimelineData((x) => {
                      x.push({
                        color: "green",
                        children: "Text Chat Test Success",
                      });
                      return x.slice();
                    });
                  } else {
                    setTimelineData((x) => {
                      x.push({
                        color: "red",
                        children: "Text Chat Test Failed",
                      });
                      return x.slice();
                    });
                  }
                  if (!testBaseRes) {
                    message.error(
                      "Please check if the configuration is incorrect or if the network is available.",
                    );
                    setLoadingCheckLLM(false);
                    setPending(false);
                    return;
                  }
                  let testImageRes = await o.testImage();
                  if (testImageRes) {
                    setTimelineData((x) => {
                      x.push({
                        color: "green",
                        children: "Image Support Test Success",
                      });
                      return x.slice();
                    });
                    values.supportImage = true;
                  } else {
                    setTimelineData((x) => {
                      x.push({
                        color: "red",
                        children: "Image Support Test Failed",
                      });
                      return x.slice();
                    });
                  }
                  values.supportImage = testImageRes;
                  let testToolRes = await o.testTool();
                  if (testToolRes) {
                    setTimelineData((x) => {
                      x.push({
                        color: "green",
                        children: "Tool Call Test Success",
                      });
                      return x.slice();
                    });
                  } else {
                    setTimelineData((x) => {
                      x.push({
                        color: "red",
                        children: "Tool Call Test Failed",
                      });
                      return x.slice();
                    });
                  }
                  values.supportTool = testToolRes;
                  setPending(false);
                  if (values.key) {
                    let index = GPT_MODELS.get().data.findIndex(
                      (e) => e.key == values.key,
                    );
                    if (index == -1) {
                      return;
                    }
                    GPT_MODELS.get().data[index] = values;
                    await GPT_MODELS.save();
                  } else {
                    values.name = values.name || values.model;
                    values.key = v4();
                    GPT_MODELS.get().data.push(values);
                    await GPT_MODELS.save();
                  }
                  refresh();
                  setIsAddModelConfigOpen(false);
                  EVENT.fire("refresh");
                  setLoadingCheckLLM(false);
                  message.success("save success!");
                } catch {
                  setLoadingCheckLLM(false);
                  message.error("save failed!");
                }
              }}
            >
              {dom}
            </Form>
          )}
        >
          <Form.Item className="hidden" name="key" label="key">
            <Input></Input>
          </Form.Item>
          <Form.Item
            name="provider"
            label="Provider"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Select
              options={Providers}
              onChange={(e) => {
                let find = Providers.find((x) => x.value == e);
                if (find == null) {
                  return;
                }
                console.log(find);
                let value: any = {
                  baseURL: find.baseURL,
                };
                if (find.apiKey) {
                  value.apiKey = find.apiKey;
                }
                if (find.call_tool_step) {
                  value.call_tool_step = find.call_tool_step;
                }
                form.setFieldsValue(value);
                refresh();
                // setTimeout(() => {
                //    refresh();
                // }, 0);
              }}
            ></Select>
          </Form.Item>
          <Form.Item
            name="baseURL"
            label="baseURL"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Input
              disabled={
                !["other", "ollama"].includes(form.getFieldValue("provider"))
              }
              placeholder={t`Please enter baseURL`}
            ></Input>
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="apiKey"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Input placeholder={t`Please enter apiKey`}></Input>
          </Form.Item>

          <Form.Item
            name="model"
            label="model"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <InputPlus
              placeholder={t`Please enter or select the model`}
              options={Providers.find(
                (x) =>
                  x.value ==
                  (form.getFieldValue("provider") || Providers[0].value),
              )?.models?.map((x) => {
                return { value: x, label: x };
              })}
            />
          </Form.Item>
          <Form.Item name="name" label="Alias">
            <Input placeholder="The default is the model name"></Input>
          </Form.Item>
          <Form.Item name="call_tool_step" label="Call-Tool-Step">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="default, the model is allowed to execute tools for 10 steps."
            ></InputNumber>
          </Form.Item>
        </Modal>
        <Modal
          title="Test LLM"
          open={isOpenTestLLM}
          onOk={() => {
            setIsOpenTestLLM(false);
          }}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsOpenTestLLM(false);
          }}
        >
          <Timeline
            pending={pending ? "Testing..." : ""}
            items={timelineData}
          />
        </Modal>
      </div>
    </ConfigProvider>
  );
}
