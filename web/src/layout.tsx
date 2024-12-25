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
} from "antd";
import enUS from "antd/locale/en_US";
import zhCN from "antd/locale/zh_CN";

import {
  AndroidOutlined,
  ChromeFilled,
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
import { currLang, setCurrLang } from "./i18n";
import { call } from "./common/call";
import { GPT_MODELS, MCP_CONFIG } from "./common/data";
import { getClients } from "./common/mcp";
import { EVENT } from "./common/event";
import { OpenAiChannel } from "./common/openai";

const Providers = [
  {
    label: "OpenAI",
    url: "https://api.openai.com/v1",
    value: "openai",
  },
  {
    label: "OpenRouter",
    url: "https://openrouter.ai/api/v1",
    value: "openrouter",
  },
  {
    label: "DeepSeek",
    url: "https://api.deepseek.com",
    value: "deepseek",
  },
  {
    label: "DoubBao",
    url: "https://ark.cn-beijing.volces.com/api/v3",
    value: "doubao",
  },
  {
    label: "Other",
    url: "",
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
  }, []);
  useEffect(() => {
    getClients(false).then((x) => {
      setClients(x);
    });
  }, []);
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
  const [clients, setClients] = React.useState([]);
  const [isAddMCPConfigOpen, setIsAddMCPConfigOpen] = useState(false);
  const [loadingOpenMCP, setLoadingOpenMCP] = useState(false);
  const [loadingCheckLLM, setLoadingCheckLLM] = useState(false);

  return (
    <ConfigProvider locale={locale}>
      <div style={{ width: "100%", margin: "0px auto" }}>
        <ProLayout
          prefixCls="my-prefix"
          collapsed={collapsed}
          onCollapse={(collapsed) => {
            console.log(collapsed);
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
          avatarProps={{
            // src: user.icon,
            // size: "small",
            // title: (user.name || "用户") + `(${user.email || "去登录"})`,
            render: (props, dom) => {
              return (
                <>
                  {/* <Button>
                    <AndroidOutlined spin={runing} />
                    任务
                  </Button> */}
                  <Space>
                    <Button
                      onClick={() => {
                        setIsToolsShow(true);
                      }}
                    >
                      💻MCP
                    </Button>
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

                    {/* <Button
                      type="link"
                      onClick={() => {
                        gotoLogin();
                      }}
                    >
                      去登录
                    </Button> */}
                  </Space>
                </>
              );
            },
          }}
          headerTitleRender={(logo, title, _) => {
            return <Link to="home">HyperChat</Link>;
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
          width={800}
          open={isToolsShow}
          onCancel={() => setIsToolsShow(false)}
          maskClosable
          title="MCP Service List"
          onOk={() => setIsToolsShow(false)}
          cancelButtonProps={{ style: { display: "none" } }}
        >
          <Table
            size="small"
            rowKey={(record) => record.name}
            pagination={false}
            dataSource={clients}
            columns={[
              {
                title: "client",
                dataIndex: "name",
                key: "name",
              },
              {
                title: "status",
                dataIndex: "status",
                key: "status",
                render: (text, record, index) => (
                  <span
                    style={{
                      color: text == "connected" ? "green" : "red",
                    }}
                  >
                    {text}
                  </span>
                ),
              },
              {
                title: "Operation",
                dataIndex: "status",
                key: "status",
                render: (text, record, index) => {
                  if (record.scope == "local") {
                    return <Tag color="blue">built-in</Tag>;
                  }
                  return (
                    <div>
                      <Button
                        type="link"
                        onClick={() => {
                          record.config._name = record.name;
                          record.config._type = "edit";
                          record.config._argsStr = (
                            record.config.args || []
                          ).join("   ");

                          record.config._envList = [];
                          for (let key in record.config.env) {
                            record.config._envList.push({
                              name: key,
                              value: record.config.env[key],
                            });
                          }
                          mcpform.resetFields();
                          mcpform.setFieldsValue(record.config);
                          setIsAddMCPConfigOpen(true);
                        }}
                      >
                        config
                      </Button>
                      <Divider type="vertical"></Divider>
                      <Button
                        disabled={record.config.disabled}
                        type="link"
                        onClick={async () => {
                          if (record.config.disabled) {
                            message.error("Service Disabled");
                            return;
                          }
                          try {
                            await call("openMcpClient", [record.name]);
                            getClients(false).then((x) => {
                              setClients(x);
                              EVENT.fire("refresh");
                            });
                          } catch (e) {
                            message.error(e.message);
                          }
                        }}
                      >
                        {record.status == "connected" ? "reload" : "start"}
                      </Button>
                      <Divider type="vertical"></Divider>
                      <Button
                        type="link"
                        style={{
                          color: !record.config.disabled ? "red" : undefined,
                        }}
                        onClick={async () => {
                          record.config.disabled = !record.config.disabled;

                          await MCP_CONFIG.save();
                          try {
                            if (record.config.disabled) {
                              await call("closeMcpClients", [record.name]);
                            } else {
                              await call("openMcpClient", [record.name]);
                            }

                            getClients(false).then((x) => {
                              setClients(x);
                              EVENT.fire("refresh");
                            });
                          } catch (e) {
                            message.error(e.message);
                          }
                        }}
                      >
                        {record.config.disabled ? "enable" : "disable"}
                      </Button>
                    </div>
                  );
                },
              },
            ]}
            footer={() => {
              return (
                <div className="text-center">
                  <Button
                    type="link"
                    onClick={() => {
                      mcpform.resetFields();
                      setIsAddMCPConfigOpen(true);
                    }}
                  >
                    Add MCP
                  </Button>
                  <Button
                    type="link"
                    onClick={async () => {
                      let p = await call("pathJoin", ["mcp.json"]);
                      await call("openExplorer", [p]);
                    }}
                  >
                    Open the configuration file
                  </Button>
                </div>
              );
            }}
          ></Table>
        </Modal>
        <Modal
          width={600}
          title="Configure MCP"
          open={isAddMCPConfigOpen}
          okButtonProps={{
            autoFocus: true,
            htmlType: "submit",
            loading: loadingOpenMCP,
          }}
          maskClosable={false}
          cancelButtonProps={{ style: { display: "none" } }}
          onCancel={() => {
            setIsAddMCPConfigOpen(false);
          }}
          modalRender={(dom) => (
            <Form
              initialValues={{
                envStr: "",
                argsStr: "",
              }}
              form={mcpform}
              layout="vertical"
              name="Configure MCP"
              clearOnDestroy
              onFinish={async (values) => {
                try {
                  setLoadingOpenMCP(true);
                  values.args = values._argsStr
                    .split(" ")
                    .filter((x) => x.trim() != "");
                  try {
                    values.env = {};
                    for (let x of values._envList) {
                      values.env[x.name] = x.value;
                    }
                  } catch {
                    message.error("Please enter a valid JSON");
                    return;
                  }
                  if (
                    values._type == "edit" &&
                    MCP_CONFIG.get().mcpServers[values._name].disabled
                  ) {
                    message.error("MCP Service Disabled");
                    return;
                  }
                  await call("openMcpClient", [values._name, values]);
                  if (values._type == "edit") {
                    let index = clients.findIndex(
                      (e) => e.name == values._name,
                    );

                    if (index == -1) {
                      return;
                    }

                    clients[index].config = {
                      ...clients[index].config,
                      ...values,
                    };

                    MCP_CONFIG.get().mcpServers[values._name] =
                      clients[index].config;
                  } else {
                    clients.push({
                      name: values._name,
                      config: values,
                      status: "disconnected",
                    });
                    if (MCP_CONFIG.get().mcpServers[values._name] != null) {
                      message.error("Name already exists");
                      return;
                    }
                    MCP_CONFIG.get().mcpServers[values._name] = values;
                  }

                  await MCP_CONFIG.save();
                  setIsAddMCPConfigOpen(false);
                  getClients(false).then((x) => {
                    setClients(x);
                    EVENT.fire("refresh");
                  });
                } catch (e) {
                  message.error(e.message);
                } finally {
                  setLoadingOpenMCP(false);
                }
              }}
            >
              {dom}
            </Form>
          )}
        >
          <Form.Item className="hidden" name="_type" label="_type">
            <Input></Input>
          </Form.Item>
          <Form.Item
            name="_name"
            label="Name"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Input
              disabled={mcpform.getFieldValue("_type") == "edit"}
              placeholder="Please enter the name"
            ></Input>
          </Form.Item>
          <Form.Item
            name="command"
            label="command"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Input placeholder="Please enter command"></Input>
          </Form.Item>
          <Form.Item name="_argsStr" label="args">
            <Input placeholder="Please enter args"></Input>
          </Form.Item>

          <Form.Item label="env">
            <Form.List name="_envList">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, "name"]}
                        rules={[{ required: true, message: "Missing name" }]}
                      >
                        <Input placeholder="Var Name" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        className="flex-1"
                        name={[name, "value"]}
                        rules={[{ required: true, message: "Missing Value" }]}
                      >
                        <Input placeholder="Var Value" />
                      </Form.Item>
                      <Form.Item>
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Form.Item>
                    </div>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                    >
                      Add Environment Variables
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Modal>

        <Modal
          width={800}
          title="My LLM Models"
          open={isModelConfigOpen}
          cancelButtonProps={{ style: { display: "none" } }}
          onOk={() => {
            setIsModelConfigOpen(false);
          }}
          onCancel={() => {
            setIsModelConfigOpen(false);
          }}
        >
          <Table
            footer={() => (
              <div className="text-center">
                <Button
                  type="link"
                  onClick={() => {
                    form.resetFields();
                    setIsAddModelConfigOpen(true);
                  }}
                >
                  Add
                </Button>
                <Button
                  type="link"
                  onClick={async () => {
                    let p = await call("pathJoin", ["gpt_models.json"]);
                    await call("openExplorer", [p]);
                  }}
                >
                  Open the configuration file
                </Button>
              </div>
            )}
            size="small"
            pagination={false}
            dataSource={GPT_MODELS.get().data}
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                key: "name",
                width: 200,
              },
              {
                title: "LLM",
                dataIndex: "model",
                key: "model",
                width: 200,
              },
              {
                title: "Operation",
                dataIndex: "key",
                key: "key",
                width: 200,
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
                      Edit
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
                      <Button type="link">Delete</Button>
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
                        Top
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
          title="Configure LLM"
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
              }}
              clearOnDestroy
              onFinish={async (values) => {
                setLoadingCheckLLM(true);
                message.info("Testing the configuration, please wait...");
                let o = new OpenAiChannel(values, []);

                let res = await o.test();
                if (res.code == 0) {
                  message.error(
                    "Please check if the configuration is incorrect or if the network is available.",
                  );
                  setLoadingCheckLLM(false);
                  return;
                } else {
                  if (!res.suppentTool) {
                    message.warning(
                      "Your LLM is available, but does not support tool calls.",
                    );
                  }
                }
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
                form.setFieldsValue({ baseURL: find.url });
                refresh();
                // setTimeout(() => {
                //    refresh();
                // }, 0);
              }}
            ></Select>
          </Form.Item>
          <Form.Item
            style={{
              display:
                form.getFieldValue("provider") != "other" ? "none" : "block",
            }}
            name="baseURL"
            label="baseURL"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Input placeholder="Please enter baseURL"></Input>
          </Form.Item>
          <Form.Item
            name="apiKey"
            label="apiKey"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Input placeholder="Please enter apiKey"></Input>
          </Form.Item>

          <Form.Item
            name="model"
            label="model"
            rules={[{ required: true, message: "Please enter" }]}
          >
            <Input placeholder="Please enter the model"></Input>
          </Form.Item>
          <Form.Item name="name" label="Alias">
            <Input placeholder="The default is the model name"></Input>
          </Form.Item>
          <Form.Item name="call_tool_step" label="Call-Tool-Step">
            <InputNumber
              style={{ width: "100%" }}
              placeholder="default, the model is allowed to execute tools for 100 steps."
            ></InputNumber>
          </Form.Item>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
