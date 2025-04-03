import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { call } from "../../common/call";
import {
  Button,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Radio,
  Space,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import {
  electronData,
  MCP_CONFIG,
  MCP_CONFIG_TYPE,
} from "../../../../common/data";
import { EVENT } from "../../common/event";
import { Code } from "../../common/code";
// import * as DATA from "../../../public/mcp_data.js";
import { getMCPExtensionData } from "../../common/mcp";
import { zodToJsonSchema } from "zod-to-json-schema";

import { z } from "zod";
// DATA.MCP.data = [
//   {
//     name: "hyper_tools",
//     description: "hyper_tools",
//   },
//   ...DATA.MCP.data,
// ];
import {
  BranchesOutlined,
  CaretRightOutlined,
  CheckCircleTwoTone,
  CheckOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  GithubOutlined,
  MinusCircleOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  StopOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import {
  BetaSchemaForm,
  ProFormColumnsType,
  ProFormInstance,
} from "@ant-design/pro-components";
window["z"] = z;

import { jsonSchemaToZod } from "json-schema-to-zod";
import { getClients, getMcpClients, InitedClient } from "../../common/mcp";
import { t } from "../../i18n";
import { HeaderContext } from "../../common/context";
import {
  JsonSchema2FormItem,
  JsonSchema2FormItemOrNull,
  JsonSchema2ProFormColumnsType,
} from "../../common";

// export type Package = {
//   type: "npx" | "uvx" | "other";
//   name: string;
//   github?: string;
//   description: string;
//   keywords: string[];
//   resolve: (config: any) => {
//     command: string;
//     args: string[];
//     env: Record<string, string>;
//   };
//   configSchema: any;
// };

// const config = z.object({
//   paths: z.array(
//     z.object({
//       path: z.string({
//         description: "filesystem path",
//         required_error: "path is required",
//       }),
//     }),
//   ),
//   path: z.string({
//     description: "filesystem path",
//   }),
//   port: z.number({
//     description: "port",
//   }),
//   host: z.boolean({
//     description: "host",
//   }),
// });

// type Config = z.infer<typeof config>;

// const p: Package = {
//   type: "npx",
//   name: "@modelcontextprotocol/server-filesystem",
//   github: "https://github.com/modelcontextprotocol/servers.git",
//   description: "Server 1 filesystem",
//   keywords: ["server", "filesystem"],
//   resolve: (config: Config) => {
//     return {
//       command: "npx",
//       args: [
//         "-y",
//         "@modelcontextprotocol/server-filesystem",
//         ...config.paths.map((x) => x.path),
//       ],
//       env: {},
//     };
//   },
//   configSchema: zodToJsonSchema(config),
// };

function JsonSchema2DefaultValue(schema: any) {
  let obj = {};
  function run(item) {
    for (const key in item.properties) {
      const prop = item.properties[key];

      let type = prop.type;
      let required = true;
      if (Array.isArray(prop.type)) {
        type = prop.type[0];
      }
      if (type === "array") {
        obj[key] = [];
        continue;
      } else {
        obj[key] = prop.default;
      }
    }
  }

  if (schema && schema.type === "object") {
    run(schema);
  }
  return obj;
}

let mcpExtensionDataObj = {};

export function Market() {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const { globalState, updateGlobalState } = useContext(HeaderContext);
  const [nodeV, setNodeV] = useState("");
  const [uv, setUvVer] = useState("");
  const [threePartys, setThreePartys] = useState<Array<{ name: string }>>([]);
  const [mcpLoadingObj, setMcpLoadingObj] = useState(
    {} as any as { [s: string]: boolean },
  );
  let refreshThreePartys = async (mcp) => {
    let arr = [];
    for (let key in mcp.mcpServers) {
      if (mcpExtensionDataObj[key] == undefined) {
        arr.push({ name: key });
      }
    }
    setThreePartys(arr);
    refresh();
  };
  const [mcpExtensionData, setMcpExtensionData] = useState<any>([]);
  let init = async () => {
    (async () => {
      let x = await call("exec", ["node", ["-v"]]);
      setNodeV(x);
    })();
    (async () => {
      let y = await call("exec", ["uv", ["-V"]]);
      setUvVer(y);
    })();

    (async () => {
      let mcp = await MCP_CONFIG.init();
      let mcpExtensionData = (await getMCPExtensionData().catch(
        (e) => [],
      )) as any[];
      let clients = await getClients(false);
      mcpExtensionData = clients
        .filter((x) => x.config.hyperchat?.scope == "built-in")
        .map((x) => {
          return {
            ...x,
            configSchema: x.ext.configSchema,
          };
        })
        .concat(mcpExtensionData);

      for (let x of mcpExtensionData) {
        mcpExtensionDataObj[x.name] = x;
      }
      refreshThreePartys(mcp);
      setMcpExtensionData(mcpExtensionData);
    })();
  };
  useEffect(() => {
    init();
    (async () => {
      await electronData.init();
      refresh();
    })();
  }, []);
  const [form] = Form.useForm();
  const [mcpconfigform] = Form.useForm();
  const [isPathOpen, setIsPathOpen] = useState(false);
  const [currRow, setCurrRow] = useState({} as any);
  const [mcpconfigOpen, setMcpconfigOpen] = useState(false);

  const [isAddMCPConfigOpen, setIsAddMCPConfigOpen] = useState(false);
  const [loadingOpenMCP, setLoadingOpenMCP] = useState(false);
  const [mcpform] = Form.useForm();

  useEffect(() => {}, []);

  const RenderEnableAndDisable = (item: { name: string }) => {
    return (
      <a
        className="text-lg hover:text-cyan-400"
        onClick={async (e) => {
          try {
            mcpLoadingObj[item.name] = true;
            setMcpLoadingObj({ ...mcpLoadingObj });

            const config = MCP_CONFIG.get().mcpServers[item.name];
            if (config) {
              config.disabled = !config.disabled;
            }
            await MCP_CONFIG.save();

            if (config.disabled) {
              await call("closeMcpClients", [item.name, true]);
            } else {
              await call("openMcpClient", [item.name]);
            }

            await getClients(false);
            refresh();
          } catch (e) {
            message.error(e.message);
          } finally {
            mcpLoadingObj[item.name] = false;
            setMcpLoadingObj({ ...mcpLoadingObj });
          }
        }}
      >
        <Tooltip
          title={
            MCP_CONFIG.get().mcpServers[item.name]?.disabled
              ? "enable"
              : "disable"
          }
        >
          {MCP_CONFIG.get().mcpServers[item.name]?.disabled ? (
            <CaretRightOutlined />
          ) : (
            <StopOutlined />
          )}
        </Tooltip>
      </a>
    );
  };
  const ListItemMeta = (item: { name: string; description?: string }) => {
    return (
      <List.Item.Meta
        className="px-2"
        title={
          <>
            <span>
              {item.name}&nbsp;
              {MCP_CONFIG.get().mcpServers[item.name]?.hyperchat?.scope ==
                "built-in" && <Tag color="blue">built-in</Tag>}
              &nbsp;
              {MCP_CONFIG.get().mcpServers[item.name]?.hyperchat?.scope !=
                "built-in" &&
              MCP_CONFIG.get().mcpServers[item.name]?.hyperchat?.type ==
                "sse" ? (
                <Tag>sse</Tag>
              ) : (
                ""
              )}
              &nbsp;
              {mcpLoadingObj[item.name] ? (
                <SyncOutlined spin className="text-blue-400" />
              ) : getMcpClients()[item.name]?.status == "connected" ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : getMcpClients()[item.name]?.status == "disabled" ? (
                <DisconnectOutlined className="text-red-400" />
              ) : getMcpClients()[item.name]?.status ==
                "disabled" ? null : null}
            </span>
          </>
        }
        description={item.description}
      />
    );
  };
  return (
    <div className="flex flex-wrap">
      <div className="w-full lg:w-2/5">
        {/* <h1 className=" ">💻MCP</h1> */}
        <Space className="mt-1">
          <Button
            onClick={async () => {
              let p = await call("pathJoin", ["mcp.json"]);
              await call("openExplorer", [p]);
            }}
          >
            {t`Open the configuration file`}
          </Button>
        </Space>
        <Tabs
          className="mt-4 rounded-lg bg-white"
          type="card"
          items={[
            {
              label: t`HyperChat Recommend List`,
              key: "official",
              children: (
                <div className="bg-white p-0">
                  <div className="flex justify-center p-1">
                    <a href="https://github.com/BigSweetPotatoStudio/HyperChatMCP">
                      <GithubOutlined />
                      Github
                    </a>
                  </div>
                  <List
                    itemLayout="horizontal"
                    dataSource={mcpExtensionData}
                    renderItem={(item: any, index) => (
                      <List.Item
                        className="hover:cursor-pointer hover:bg-slate-300"
                        actions={[
                          MCP_CONFIG.get().mcpServers[item.name]?.hyperchat
                            ?.scope != "built-in" && (
                            <a
                              key="list-loadmore-down"
                              className="text-lg hover:text-cyan-400"
                            >
                              {MCP_CONFIG.get().mcpServers[item.name] ? (
                                <Popconfirm
                                  title="Sure to delete?"
                                  onConfirm={async () => {
                                    try {
                                      await call("closeMcpClients", [
                                        item.name,
                                        true,
                                      ]);

                                      MCP_CONFIG.get().mcpServers[
                                        item.name
                                      ].disabled = true;
                                      delete MCP_CONFIG.get().mcpServers[
                                        item.name
                                      ];
                                      await MCP_CONFIG.save();
                                      await getClients(false);
                                      refresh();
                                    } catch (e) {
                                      message.error(e.message);
                                    }
                                  }}
                                >
                                  <Tooltip title="uninstall" placement="bottom">
                                    <DeleteOutlined className="text-lg hover:text-cyan-400" />
                                  </Tooltip>
                                </Popconfirm>
                              ) : (
                                <Tooltip title="install" placement="bottom">
                                  <CloudDownloadOutlined
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      mcpconfigform.resetFields();

                                      setCurrRow(item);
                                      let zo = eval(
                                        jsonSchemaToZod(item.configSchema),
                                      );
                                      mcpconfigform?.setFieldsValue(
                                        zo.safeParse({}).data,
                                      );
                                      if (
                                        Object.keys(
                                          MCP_CONFIG.get().mcpServers[item.name]
                                            ?.hyperchat.config || {},
                                        ).length > 0
                                      ) {
                                        mcpconfigform.setFieldsValue(
                                          MCP_CONFIG.get().mcpServers[item.name]
                                            ?.hyperchat.config || {},
                                        );
                                      }
                                      setMcpconfigOpen(true);
                                      await getClients(false);
                                      refresh();
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </a>
                          ),

                          MCP_CONFIG.get().mcpServers[item.name]
                            ? RenderEnableAndDisable(item)
                            : undefined,
                          MCP_CONFIG.get().mcpServers[item.name] &&
                          !MCP_CONFIG.get().mcpServers[item.name]?.disabled ? (
                            <a className="text-lg hover:text-cyan-400">
                              <Tooltip title="setting">
                                <SettingOutlined
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    mcpconfigform.resetFields();
                                    let zo = eval(
                                      jsonSchemaToZod(item.configSchema),
                                    );
                                    mcpconfigform?.setFieldsValue(
                                      zo.safeParse({}).data,
                                    );

                                    // mcpconfigform?.setFieldsValue(
                                    //   JsonSchema2DefaultValue(
                                    //     item.configSchema,
                                    //   ),
                                    // );
                                    if (
                                      Object.keys(
                                        MCP_CONFIG.get().mcpServers[item.name]
                                          ?.hyperchat.config || {},
                                      ).length > 0
                                    ) {
                                      mcpconfigform.setFieldsValue(
                                        MCP_CONFIG.get().mcpServers[item.name]
                                          ?.hyperchat.config || {},
                                      );
                                    }
                                    setCurrRow(item);
                                    await getClients(false);
                                    setMcpconfigOpen(true);
                                    refresh();
                                  }}
                                />
                              </Tooltip>
                            </a>
                          ) : undefined,
                          item.github ? (
                            <a
                              className="text-lg hover:text-cyan-400"
                              href={item.github}
                            >
                              <GithubOutlined />
                            </a>
                          ) : undefined,
                        ].filter((x) => x != null)}
                      >
                        {ListItemMeta(item)}
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
            {
              label: t`MCP Community`,
              key: "thirdparty",
              children: (
                <div className="bg-white p-0">
                  <div className="flex justify-center p-1">
                    <Button
                      onClick={() => {
                        mcpform.resetFields();
                        setIsAddMCPConfigOpen(true);
                      }}
                    >
                      {t`Add MCP`}
                    </Button>
                  </div>

                  <List
                    itemLayout="horizontal"
                    dataSource={threePartys}
                    renderItem={(item: any, index) => (
                      <List.Item
                        className="hover:cursor-pointer hover:bg-slate-300"
                        actions={[
                          MCP_CONFIG.get().mcpServers[item.name]?.hyperchat
                            ?.scope != "built-in" && (
                            <a
                              key="list-loadmore-down"
                              className="text-lg hover:text-cyan-400"
                            >
                              <Popconfirm
                                title="Sure to delete?"
                                onConfirm={async () => {
                                  try {
                                    await call("closeMcpClients", [
                                      item.name,
                                      true,
                                    ]);

                                    MCP_CONFIG.get().mcpServers[
                                      item.name
                                    ].disabled = true;
                                    delete MCP_CONFIG.get().mcpServers[
                                      item.name
                                    ];
                                    await MCP_CONFIG.save();
                                    refreshThreePartys(MCP_CONFIG.get());
                                    refresh();
                                  } catch (e) {
                                    message.error(e.message);
                                  }
                                }}
                              >
                                <Tooltip title="delete" placement="bottom">
                                  <DeleteOutlined className="text-lg hover:text-cyan-400" />
                                </Tooltip>
                              </Popconfirm>
                            </a>
                          ),

                          MCP_CONFIG.get().mcpServers[item.name]
                            ? RenderEnableAndDisable(item)
                            : undefined,
                          // MCP_CONFIG.get().mcpServers[item.name] &&
                          // MCP_CONFIG.get().mcpServers[item.name]?.hyperchat
                          //   ?.scope != "built-in" &&
                          // !MCP_CONFIG.get().mcpServers[item.name]?.disabled ? (
                          <a className="text-lg hover:text-cyan-400">
                            <Tooltip title="setting">
                              <SettingOutlined
                                onClick={(e) => {
                                  const config =
                                    MCP_CONFIG.get().mcpServers[item.name];

                                  let formValues = {
                                    ...config,
                                    name: item.name,
                                  } as any;
                                  formValues._name = formValues.name;
                                  formValues._type = "edit";
                                  // formValues._argsStr = (
                                  //   formValues.args || []
                                  // ).join("   ");
                                  formValues.command = [
                                    formValues.command || "",
                                    ...formValues.args,
                                  ].join("   ");
                                  formValues._envList = [];
                                  for (let key in formValues.env) {
                                    formValues._envList.push({
                                      name: key,
                                      value: formValues.env[key],
                                    });
                                  }
                                  formValues.type =
                                    formValues?.hyperchat?.type || "stdio";
                                  formValues.url =
                                    formValues?.hyperchat?.url || "";
                                  mcpform.resetFields();
                                  mcpform.setFieldsValue(formValues);
                                  setIsAddMCPConfigOpen(true);
                                }}
                              />
                            </Tooltip>
                          </a>,
                          // ) : undefined,
                        ].filter((x) => x != null)}
                      >
                        {ListItemMeta(item)}
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
          ]}
        />
      </div>
      <div className="w-full p-4 lg:w-3/5">
        <div>
          <h1>{t`More MCP Market`}</h1>
          <div>
            <a href="https://modelcontextprotocol.io/examples">
              modelcontextprotocol.io/examples
            </a>
          </div>
          <div>
            <a href="https://mcp.so/">mcp.so</a>
          </div>
          <div>
            <a href="https://www.pulsemcp.com/">pulsemcp.com</a>
          </div>
          <div>
            <a href="https://glama.ai/mcp/servers?attributes=">glama.ai</a>
          </div>
          <div>
            <a href="https://smithery.ai/">smithery.ai</a>
          </div>
          <div>Help: </div>
          <div className="help">
            <div>
              <div>
                <Space>
                  <span className="font-bold">nodejs: </span>
                  {nodeV || t`Not Installed`}
                </Space>
              </div>
              {!nodeV && (
                <div>
                  <Space>
                    {electronData.get().platform == "win32" ? (
                      <div>
                        <span>{t`Please run the command.`}</span>
                        <Code>winget install OpenJS.NodeJS.LTS</Code>
                      </div>
                    ) : electronData.get().platform == "darwin" ? (
                      <div>
                        <span>{t`Please run the command.`}</span>
                        <Code>brew install node</Code>
                      </div>
                    ) : (
                      ""
                    )}
                    <a href="https://nodejs.org/">goto nodejs</a>
                  </Space>{" "}
                </div>
              )}
            </div>
            <div>
              <div>
                <Space>
                  <span className="font-bold">uv:</span>{" "}
                  {uv || t`Not Installed`}
                </Space>
              </div>

              {!uv && (
                <div>
                  <Space>
                    {electronData.get().platform == "win32" ? (
                      <div>
                        <span>{t`Please run the command.`}</span>
                        <Code>winget install --id=astral-sh.uv -e</Code>
                      </div>
                    ) : electronData.get().platform == "darwin" ? (
                      <div>
                        <span>{t`Please run the command.`}</span>
                        <Code>brew install uv</Code>
                      </div>
                    ) : (
                      ""
                    )}
                    <a href="https://github.com/astral-sh/uv">goto uv</a>
                  </Space>
                </div>
              )}
            </div>

            <Tooltip
              title={t`you might need to customize the PATH environment var.`}
            >
              <Button
                onClick={() => {
                  setIsPathOpen(true);
                }}
                danger
              >
                {t`Try Repair environment`}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
      <Modal
        width={600}
        title={t`Configure PATH`}
        open={isPathOpen}
        okButtonProps={{ autoFocus: true, htmlType: "submit" }}
        cancelButtonProps={{ style: { display: "none" } }}
        onCancel={() => {
          setIsPathOpen(false);
        }}
        modalRender={(dom) => (
          <Form
            form={form}
            layout="vertical"
            name="ConfigurePATH"
            initialValues={{
              PATH: electronData.get().PATH,
            }}
            clearOnDestroy
            onFinish={async (values) => {
              electronData.get().PATH = values.PATH;
              await electronData.save();
              init();
              setIsPathOpen(false);
            }}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item name="PATH" label="PATH">
          <Input placeholder="Here, you would input the result of the command echo $PATH."></Input>
        </Form.Item>
      </Modal>
      <Modal
        title={t`MCP Configuration`}
        open={mcpconfigOpen}
        footer={[]}
        onCancel={() => setMcpconfigOpen(false)}
        forceRender={true}
      >
        {/* <BetaSchemaForm<any>
          layoutType="Form"
          name="mcpconfigform"
          formRef={mcpconfigform}
          grid={false}
          onFinish={async (values) => {
            try {
              if (
                MCP_CONFIG.get().mcpServers[currRow.name]?.hyperchat?.scope ==
                "built-in"
              ) {
                MCP_CONFIG.get().mcpServers[currRow.name].hyperchat.config =
                  values;

                await MCP_CONFIG.save();
                await call("openMcpClient", [
                  currRow.name,
                  MCP_CONFIG.get().mcpServers[currRow.name],
                ]);
                await getClients(false);
                setMcpconfigOpen(false);
              } else {
                let config = currRow.resolve(values);
                config.hyperchat = {
                  url: "",
                  type: "stdio",
                  scope: "outer",
                  config: values,
                };
                await call("openMcpClient", [currRow.name, config]);

                MCP_CONFIG.get().mcpServers[currRow.name] = config;
                await MCP_CONFIG.save();

                await getClients(false);
                setMcpconfigOpen(false);
              }
            } catch (e) {
              message.error(e.message);
            }
          }}
          columns={
            currRow.configSchema
              ? JsonSchema2ProFormColumnsType(currRow.configSchema)
              : []
          }
          submitter={{
            // searchConfig: {
            //   submitText: "Install And Run",
            // },
            submitButtonProps: {
              type: "primary",
              children: "Install And Run",
              onClick: () => {
                mcpconfigform.current.submit();
              },
            },
            // Configure the properties of the button
            resetButtonProps: {
              style: {
                // Hide the reset button
                display: "none",
              },
            },
          }}
        /> */}

        <Form
          name="mcpconfigform"
          form={mcpconfigform}
          onFinish={async (values) => {
            // console.log("onFinish", values);
            let zo = eval(jsonSchemaToZod(currRow.configSchema));

            values = zo.safeParse(values).data;
            // console.log("onFinish", values);

            try {
              if (
                MCP_CONFIG.get().mcpServers[currRow.name]?.hyperchat?.scope ==
                "built-in"
              ) {
                MCP_CONFIG.get().mcpServers[currRow.name].hyperchat.config =
                  values;

                await MCP_CONFIG.save();
                await call("openMcpClient", [
                  currRow.name,
                  MCP_CONFIG.get().mcpServers[currRow.name],
                ]);
                await getClients(false);
                setMcpconfigOpen(false);
              } else {
                let config = currRow.resolve(values);
                config.hyperchat = {
                  url: "",
                  type: "stdio",
                  scope: "outer",
                  config: values,
                };
                await call("openMcpClient", [currRow.name, config]);

                MCP_CONFIG.get().mcpServers[currRow.name] = config;
                await MCP_CONFIG.save();

                await getClients(false);
                setMcpconfigOpen(false);
              }
            } catch (e) {
              message.error(e.message);
            }
          }}
        >
          {currRow.configSchema
            ? JsonSchema2FormItemOrNull(currRow.configSchema) ||
              t`No parameters`
            : []}
          <Form.Item className="flex justify-end">
            <Button htmlType="submit">Submit</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        width={600}
        title={t`Configure MCP`}
        open={isAddMCPConfigOpen}
        okButtonProps={{
          autoFocus: true,
          htmlType: "submit",
          loading: loadingOpenMCP,
        }}
        okText={t`Install And Run`}
        maskClosable={false}
        cancelButtonProps={{ style: { display: "none" } }}
        onCancel={() => {
          setIsAddMCPConfigOpen(false);
        }}
        modalRender={(dom) => (
          <Form
            initialValues={{
              type: "stdio",
            }}
            form={mcpform}
            layout="vertical"
            name="Configure MCP"
            clearOnDestroy
            onFinish={async (values) => {
              try {
                setLoadingOpenMCP(true);
                // if (
                //   values._type == "edit" &&
                //   MCP_CONFIG.get().mcpServers[values._name].disabled
                // ) {
                //   message.error("MCP Service Disabled");
                //   return;
                // }
                if (values.type == "sse") {
                  values = {
                    ...values,
                    command: "",
                    args: [],
                    env: {},
                    hyperchat: {
                      url: values.url,
                      type: values.type,
                      scope: "outer",
                      config: {},
                    },
                  };
                } else {
                  let commands = values.command
                    .split(" ")
                    .filter((x) => x.trim() != "");

                  let [command, ...args] = commands;
                  values.command = command;
                  values.args = args;
                  values.env = {};
                  try {
                    values._envList = values._envList || [];
                    for (let x of values._envList) {
                      values.env[x.name] = x.value;
                    }
                  } catch {
                    message.error("Please enter a valid JSON");
                    return;
                  }
                  values.hyperchat = {
                    url: values.url || "",
                    type: values.type,
                    scope: "outer",
                    config: {},
                  };
                }

                await call("openMcpClient", [values._name, values]);
                if (values._type == "edit") {
                  MCP_CONFIG.get().mcpServers[values._name] = values;
                } else {
                  if (MCP_CONFIG.get().mcpServers[values._name] != null) {
                    message.error("Name already exists");
                    return;
                  }
                  MCP_CONFIG.get().mcpServers[values._name] = values;
                }

                await MCP_CONFIG.save();
                await getClients(false);
                refreshThreePartys(MCP_CONFIG.get());

                refresh();
                setIsAddMCPConfigOpen(false);
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
          label={t`Name`}
          rules={[{ required: true, message: t`Please enter` }]}
        >
          <Input
            disabled={mcpform.getFieldValue("_type") == "edit"}
            placeholder="Please enter"
          ></Input>
        </Form.Item>
        <Form.Item
          name="type"
          label="type"
          rules={[{ required: true, message: t`Please enter` }]}
        >
          <Radio.Group
            onChange={(e) => {
              refresh();
            }}
          >
            <Radio value="stdio">stdio</Radio>
            <Radio value="sse">sse</Radio>
          </Radio.Group>
        </Form.Item>
        {mcpform.getFieldValue("type") == "sse" ? (
          <div>
            {" "}
            <Form.Item
              name="url"
              label="url"
              rules={[{ required: true, message: "Please enter" }]}
            >
              <Input placeholder="Please enter url"></Input>
            </Form.Item>
          </div>
        ) : (
          <div>
            <Form.Item
              name="command"
              label="command"
              rules={[{ required: true, message: "Please enter" }]}
            >
              <Input placeholder="Please enter command"></Input>
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
          </div>
        )}
      </Modal>
    </div>
  );
}
