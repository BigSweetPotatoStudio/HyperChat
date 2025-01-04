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
import { electronData, MCP_CONFIG } from "../../common/data";
import { EVENT } from "../../common/event";
import { Code } from "../../common/code";
import * as DATA from "../../../public/mcp_data.js";
DATA.MCP.data = [
  {
    name: "hyper_tools",
    description: "hyper_tools",
  },
  ...DATA.MCP.data,
];
import {
  BranchesOutlined,
  CheckOutlined,
  CloudDownloadOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  GithubOutlined,
  PauseCircleOutlined,
  SettingOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  BetaSchemaForm,
  ProFormColumnsType,
  ProFormInstance,
} from "@ant-design/pro-components";

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import path from "path";
import { getClients } from "../../common/mcp";

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
  description: "Server filesystem",
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

// console.log("JsonSchema2ProFormColumnsType", p.configSchema, c);
export function Market() {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const [npx, setNpxVer] = useState("");
  const [uv, setUvVer] = useState("");
  let init = async () => {
    console.log(DATA.MCP);
    (async () => {
      let x = await call("checkNpx", []);
      setNpxVer(x);
    })();
    (async () => {
      let y = await call("checkUV", []);
      setUvVer(y);
    })();

    (async () => {
      await MCP_CONFIG.init();
      refresh();
    })();
  };
  useEffect(() => {
    init();
    (async () => {
      await electronData.init();
      // console.log(electronData.get());
      refresh();
    })();
  }, []);
  const [form] = Form.useForm();
  const mcpconfigform = useRef<ProFormInstance>();
  const [isPathOpen, setIsPathOpen] = useState(false);
  const [currRow, setCurrRow] = useState({} as any);
  const [mcpconfigOpen, setMcpconfigOpen] = useState(false);

  useEffect(() => {}, []);

  return (
    <div className="flex">
      <div className="w-2/5">
        <h1 className=" ">💻MCP</h1>

        <div>
          <div>
            <Space>
              <span className="font-bold">npx & nodejs: </span>
              {npx || "Not Installed"}
            </Space>
          </div>
          {!npx && (
            <div>
              <Space>
                <span>Please run the command.</span>
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
              {uv || "Not Installed"}
            </Space>
          </div>

          {!uv && (
            <div>
              <Space>
                <span>Please run the command.</span>
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
          <Tooltip title="If you are using NVM, you might need to customize the PATH environment var.">
            <Button
              onClick={() => {
                setIsPathOpen(true);
              }}
              danger
            >
              Try Repair environment
            </Button>
          </Tooltip>

          <Button
            onClick={() => {
              EVENT.fire("setIsToolsShowTrue");
            }}
          >
            MCP Service List{" "}
          </Button>
        </Space>
        <Tabs
          className="mt-4"
          type="card"
          items={[
            {
              label: `official`,
              key: "official",
              children: (
                <div className="bg-white p-0">
                  <List
                    itemLayout="horizontal"
                    dataSource={DATA.MCP.data}
                    renderItem={(item: any, index) => (
                      <List.Item
                        // style={{
                        //   background: currRow.name == item.name ? "#f0f0f0" : "",
                        // }}
                        className="hover:cursor-pointer hover:bg-slate-300"
                        // onClick={() => {
                        //   setCurrRow(item);
                        // }}
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
                                      refresh();
                                    } catch (e) {
                                      message.error(e.message);
                                    }
                                  }}
                                >
                                  <DeleteOutlined className="text-lg hover:text-cyan-400" />
                                </Popconfirm>
                              ) : (
                                <CloudDownloadOutlined
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    mcpconfigform.current.resetFields();
                                    mcpconfigform.current.setFieldsValue(
                                      MCP_CONFIG.get().mcpServers[item.name]
                                        ?.hyperchat.config || {},
                                    );
                                    setCurrRow(item);
                                    setMcpconfigOpen(true);
                                    refresh();
                                  }}
                                />
                              )}
                            </a>
                          ),

                          MCP_CONFIG.get().mcpServers[item.name] ? (
                            <a
                              className="text-lg hover:text-cyan-400"
                              onClick={async (e) => {
                                try {
                                  const config =
                                    MCP_CONFIG.get().mcpServers[item.name];
                                  if (config) {
                                    config.disabled = !config.disabled;
                                  }

                                  await MCP_CONFIG.save();

                                  if (config.disabled) {
                                    await call("closeMcpClients", [item.name]);
                                  } else {
                                    await call("openMcpClient", [item.name]);
                                  }
                                  refresh();
                                  getClients(false);
                                } catch (e) {
                                  message.error(e.message);
                                }
                              }}
                            >
                              {MCP_CONFIG.get().mcpServers[item.name]
                                ?.disabled ? (
                                <CheckOutlined />
                              ) : (
                                <StopOutlined />
                              )}
                            </a>
                          ) : undefined,
                          MCP_CONFIG.get().mcpServers[item.name] &&
                          MCP_CONFIG.get().mcpServers[item.name]?.hyperchat
                            .scope != "built-in" &&
                          !MCP_CONFIG.get().mcpServers[item.name].disabled ? (
                            <a className="text-lg hover:text-cyan-400">
                              <SettingOutlined
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mcpconfigform.current.resetFields();
                                  mcpconfigform.current.setFieldsValue(
                                    MCP_CONFIG.get().mcpServers[item.name]
                                      ?.hyperchat.config || {},
                                  );
                                  setCurrRow(item);
                                  setMcpconfigOpen(true);
                                  refresh();
                                }}
                              />
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
                        <List.Item.Meta
                          className="px-2"
                          title={
                            <span>
                              {item.name}&nbsp;
                              {MCP_CONFIG.get().mcpServers[item.name]
                                ?.disabled ? (
                                <DisconnectOutlined className="text-red-400" />
                              ) : (
                                <BranchesOutlined className="text-blue-400" />
                              )}
                              {MCP_CONFIG.get().mcpServers[item.name]?.hyperchat
                                .scope == "built-in" && (
                                <Tag color="blue">built-in</Tag>
                              )}
                            </span>
                          }
                          description={item.description}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
            {
              label: `third party`,
              key: "thirdparty",
              children: <div>third party</div>,
            },
          ]}
        />
      </div>
      <div className="w-3/5">
        <div>
          <h1>More MCP Market</h1>
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
        title="Configure PATH"
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
        title="MCP配置"
        open={mcpconfigOpen}
        footer={[]}
        onCancel={() => setMcpconfigOpen(false)}
        forceRender={true}
      >
        {JsonSchema2ProFormColumnsType(currRow?.configSchema).length > 0
          ? "Please configure the parameters"
          : "No need config"}
        <BetaSchemaForm<any>
          layoutType="Form"
          // layout="horizontal"
          // steps={[
          //   {
          //     title: "ProComponent",
          //   },
          // ]}
          // rowProps={{
          //   gutter: [16, 16],
          // }}
          // colProps={{
          //   span: 12,
          // }}
          formRef={mcpconfigform}
          // params={{ num }}
          // request={async (p) => {
          //   console.log(
          //     currRow.name,
          //     MCP_CONFIG.get().mcpServers[currRow.name]?.hyperchat.config || {},
          //     p,
          //   );
          //   return (
          //     MCP_CONFIG.get().mcpServers[currRow.name]?.hyperchat.config || {}
          //   );
          // }}
          grid={false}
          onFinish={async (values) => {
            try {
              let config = currRow.resolve(values);
              console.log(values, config);
              await call("openMcpClient", [currRow.name, config]);

              Object.assign(config, {
                hyperchat: {
                  config: values,
                },
              });
              MCP_CONFIG.get().mcpServers[currRow.name] = config;
              await MCP_CONFIG.save();

              getClients(false);
              // .then((x) => {
              //   EVENT.fire("refresh");
              // });
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
    </div>
  );
}
