import React, { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../../common/call";
import {
  Button,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
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

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { getClients, getMcpClients, InitedClient } from "../../common/mcp";
import { t } from "../../i18n";

export type Package = {
  type: "npx" | "uvx" | "other";
  name: string;
  github?: string;
  description: string;
  keywords: string[];
  resolve: (config: any) => {
    command: string;
    args: string[];
    env: Record<string, string>;
  };
  configSchema: any;
};

const config = z.object({
  paths: z.array(
    z.object({
      path: z.string({
        description: "filesystem path",
        required_error: "path is required",
      }),
    }),
  ),
  path: z.string({
    description: "filesystem path",
  }),
  port: z.number({
    description: "port",
  }),
  host: z.boolean({
    description: "host",
  }),
});

type Config = z.infer<typeof config>;

const p: Package = {
  type: "npx",
  name: "@modelcontextprotocol/server-filesystem",
  github: "https://github.com/modelcontextprotocol/servers.git",
  description: "Server 1 filesystem",
  keywords: ["server", "filesystem"],
  resolve: (config: Config) => {
    return {
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        ...config.paths.map((x) => x.path),
      ],
      env: {},
    };
  },
  configSchema: zodToJsonSchema(config),
};

function JsonSchema2ProFormColumnsType(schema: any): ProFormColumnsType[] {
  function run(item) {
    const columns: ProFormColumnsType[] = [];

    for (const key in item.properties) {
      const prop = item.properties[key];
      let formItemProps = {
        required: item.required?.includes(key),
        rules: [
          {
            required: item.required?.includes(key),
          },
        ],
      };
      let fieldProps = {
        placeholder: prop.description,
      };
      if (prop.type === "array") {
        const column: ProFormColumnsType = {
          title: key,
          dataIndex: key,
          valueType: "formList",
          fieldProps,
          formItemProps,
          columns: JsonSchema2ProFormColumnsType(item.properties[key].items),
        };
        columns.push(column);
        continue;
      } else if (prop.type === "string") {
        const column: ProFormColumnsType = {
          title: key,
          dataIndex: key,
          valueType: "text",

          fieldProps,
          formItemProps,
        };
        columns.push(column);
        continue;
      } else if (prop.type === "number") {
        const column: ProFormColumnsType = {
          title: key,
          dataIndex: key,
          valueType: "digit",
          fieldProps,
          formItemProps,
        };
        columns.push(column);
        continue;
      } else if (prop.type === "boolean") {
        const column: ProFormColumnsType = {
          title: key,
          dataIndex: key,
          valueType: "switch",
          fieldProps,
          formItemProps,
        };
        columns.push(column);
        continue;
      } else {
        throw new Error("not support type");
      }
    }
    return columns;
  }

  if (schema && schema.type === "object") {
    return run(schema);
  } else {
    return [];
  }
}

// const c = JsonSchema2ProFormColumnsType(p.configSchema);
let mcpExtensionDataObj = {};

// console.log("JsonSchema2ProFormColumnsType", p.configSchema, c);
export function Market() {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const [npx, setNpxVer] = useState("");
  const [uv, setUvVer] = useState("");
  const [threePartys, setThreePartys] = useState<Array<{ name: string }>>([]);
  const [mcpLoadingObj, setMcpLoadingObj] = useState(
    {} as any as { [s: string]: boolean },
  );
  let refreshThreePartys = async (mcp) => {
    let arr = [];
    for (let x in mcp.mcpServers) {
      if (mcpExtensionDataObj[x] == undefined) {
        arr.push({ name: x });
      } else {
        if (mcp.mcpServers[x]?.hyperchat?.config == undefined) {
          arr.push({ name: x });
        }
      }
    }
    setThreePartys(arr);
    refresh();
  };
  const [mcpExtensionData, setMcpExtensionData] = useState<any>([]);
  let init = async () => {
    (async () => {
      let x = await call("checkNpx", []);
      setNpxVer(x);
    })();
    (async () => {
      let y = await call("checkUV", []);
      setUvVer(y);
    })();

    (async () => {
      let mcp = await MCP_CONFIG.init();
      let r = (await getMCPExtensionData()) as any[];
      let clients = await getClients(false);
      r = clients
        .filter((x) => x.config.hyperchat.scope == "built-in")
        .concat(r);
      // res.data.unshift({
      //   name: "hyper_tools",
      //   description: "hyper_tools",
      // });
      // r = [];
      for (let x of r) {
        mcpExtensionDataObj[x.name] = x;
      }
      refreshThreePartys(mcp);
      setMcpExtensionData(r);
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
  const mcpconfigform = useRef<ProFormInstance>();
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
              await call("closeMcpClients", [item.name]);
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
          <span>
            {item.name}&nbsp;
            {MCP_CONFIG.get().mcpServers[item.name]?.hyperchat?.scope ==
              "built-in" && <Tag color="blue">built-in</Tag>}
            {mcpLoadingObj[item.name] ? (
              <SyncOutlined spin className="text-blue-400" />
            ) : getMcpClients()[item.name] == null ||
              MCP_CONFIG.get().mcpServers[item.name]
                .disabled ? null : getMcpClients()[item.name]?.status ==
              "connected" ? (
              <CheckCircleTwoTone twoToneColor="#52c41a" />
            ) : (
              <DisconnectOutlined className="text-red-400" />
            )}
            &nbsp;
          </span>
        }
        description={item.description}
      />
    );
  };

  return (
    <div className="flex">
      <div className="w-2/5">
        <h1 className=" ">💻MCP</h1>

        <div>
          <div>
            <Space>
              <span className="font-bold">npx & nodejs: </span>
              {npx || t`Not Installed`}
            </Space>
          </div>
          {!npx && (
            <div>
              <Space>
                <span>{t`Please run the command.`}</span>
                {electronData.get().platform == "win32" ? (
                  <Code>winget install OpenJS.NodeJS.LTS</Code>
                ) : (
                  <Code>brew install node</Code>
                )}
                <a href="https://nodejs.org/">goto nodejs</a>
              </Space>{" "}
            </div>
          )}
        </div>
        <div>
          <div>
            <Space>
              <span className="font-bold">uvx & python:</span>{" "}
              {uv || t`Not Installed`}
            </Space>
          </div>

          {!uv && (
            <div>
              <Space>
                <span>{t`Please run the command.`}</span>
                {electronData.get().platform == "win32" ? (
                  <Code>winget install --id=astral-sh.uv -e</Code>
                ) : (
                  <Code>brew install uv</Code>
                )}
                <a href="https://github.com/astral-sh/uv">goto uv</a>
              </Space>
            </div>
          )}
        </div>
        <Space className="mt-1">
          <Tooltip
            title={t`If you are using NVM, you might need to customize the PATH environment var.`}
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
              label: t`Officially Maintained List`,
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
                            .scope != "built-in" && (
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
                                      mcpconfigform.current.resetFields();
                                      mcpconfigform.current.setFieldsValue(
                                        MCP_CONFIG.get().mcpServers[item.name]
                                          ?.hyperchat.config || {},
                                      );
                                      setCurrRow(item);

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
                          MCP_CONFIG.get().mcpServers[item.name]?.hyperchat
                            ?.scope != "built-in" &&
                          !MCP_CONFIG.get().mcpServers[item.name].disabled ? (
                            <a className="text-lg hover:text-cyan-400">
                              <Tooltip title="setting">
                                <SettingOutlined
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    mcpconfigform.current.resetFields();
                                    mcpconfigform.current.setFieldsValue(
                                      MCP_CONFIG.get().mcpServers[item.name]
                                        ?.hyperchat.config || {},
                                    );
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
              label: t`third party`,
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
                          MCP_CONFIG.get().mcpServers[item.name] &&
                          MCP_CONFIG.get().mcpServers[item.name]?.hyperchat
                            ?.scope != "built-in" &&
                          !MCP_CONFIG.get().mcpServers[item.name].disabled ? (
                            <a className="text-lg hover:text-cyan-400">
                              <Tooltip title="setting">
                                <SettingOutlined
                                  onClick={(e) => {
                                    let formValues = { ...item } as any;
                                    formValues._name = item.name;
                                    formValues._type = "edit";
                                    formValues._argsStr = (
                                      item.args || []
                                    ).join("   ");

                                    formValues._envList = [];
                                    for (let key in item.env) {
                                      formValues._envList.push({
                                        name: key,
                                        value: item.env[key],
                                      });
                                    }
                                    mcpform.resetFields();
                                    mcpform.setFieldsValue(formValues);
                                    setIsAddMCPConfigOpen(true);
                                  }}
                                />
                              </Tooltip>
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
          ]}
        />
      </div>
      <div className="w-3/5 p-4">
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
        {JsonSchema2ProFormColumnsType(currRow?.configSchema).length > 0
          ? t`Please configure the parameters`
          : t`No need config`}
        <BetaSchemaForm<any>
          layoutType="Form"
          formRef={mcpconfigform}
          grid={false}
          onFinish={async (values) => {
            try {
              let config = currRow.resolve(values);
              // console.log(values, config);
              await call("openMcpClient", [currRow.name, config]);

              Object.assign(config, {
                hyperchat: {
                  config: values,
                },
              });
              MCP_CONFIG.get().mcpServers[currRow.name] = config;
              await MCP_CONFIG.save();

              await getClients(false);

              setMcpconfigOpen(false);
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
            searchConfig: {
              submitText: "Install And Run",
            },
            submitButtonProps: {},
            // Configure the properties of the button
            resetButtonProps: {
              style: {
                // Hide the reset button
                display: "none",
              },
            },
          }}
        />
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
                values._argsStr = values._argsStr || "";
                values.args = values._argsStr
                  .split(" ")
                  .filter((x) => x.trim() != "");
                try {
                  values.env = {};
                  values._envList = values._envList || [];
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
    </div>
  );
}
