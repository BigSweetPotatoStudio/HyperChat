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
  Popover,
  Radio,
  Space,
  Switch,
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
  MoreOutlined,
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
import { InitedClient } from "../../common/mcp";
import { t } from "../../i18n";
import { HeaderContext } from "../../common/context";
import {
  JsonSchema2FormItem,
  JsonSchema2FormItemOrNull,
  JsonSchema2ProFormColumnsType,
} from "../../common";
import { Pre } from "../../components/pre";
import { Icon } from "../../components/icon";

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


export function Market() {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);
  const [nodeV, setNodeV] = useState("");
  const [uv, setUvVer] = useState("");
  const [mcpLoadingObj, setMcpLoadingObj] = useState(
    {} as any as { [s: string]: boolean },
  );

  // const [mcpExtensionData, setMcpExtensionData] = useState<any>([]);


  let init = async () => {
    (async () => {
      let x = await call("exec", ["node", ["-v"]]);
      setNodeV(x);
    })();
    (async () => {
      let y = await call("exec", ["uv", ["-V"]]);
      setUvVer(y);
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
  const [currRow, setCurrRow] = useState({
    ext: {}
  } as InitedClient);
  const [mcpconfigOpen, setMcpconfigOpen] = useState(false);

  const [isAddMCPConfigOpen, setIsAddMCPConfigOpen] = useState(false);
  const [loadingOpenMCP, setLoadingOpenMCP] = useState(false);
  const [mcpform] = Form.useForm();
  const [currResult, setCurrResult] = useState({
    data: null as any,
    error: null as any,
  });
  useEffect(() => { }, []);

  const RenderEnableAndDisable = (item: InitedClient) => {
    return (
      <Button key="enable" onClick={async (e) => {
        try {
          mcpLoadingObj[item.name] = true;
          setMcpLoadingObj({ ...mcpLoadingObj });


          if (item.status != "disabled") {
            await call("closeMcpClients", [item.name, {
              isdelete: false,
              isdisable: true
            }]);
          } else {
            await call("openMcpClient", [item.name]);
          }

        } catch (e) {
          message.error(e.message);
        } finally {
          mcpLoadingObj[item.name] = false;
          setMcpLoadingObj({ ...mcpLoadingObj });
        }
      }} type="link" title={
        item.status == "disabled"
          ? t`Enable`
          : t`Disable`
      } icon={
        item.status == "disabled" ? (
          <CaretRightOutlined />
        ) : (
          <StopOutlined />
        )
      }></Button>
    );
  };
  const ListItemMeta = (item: InitedClient) => {
    return (
      <List.Item.Meta
        className="px-2"
        title={
          <>
            <span>
              {item.name}&nbsp;
              {item.version && <Tag>{item.version}</Tag>}
              {item.source == "builtin" && <Tag color="blue">{t`built-in`}</Tag>}
              {item.source == "hyperchat" && item.config.isSync && <Tag className=" text-blue-400">sync</Tag>}
              &nbsp;

              {(item.config?.type && item.config?.type != "stdio") && <Tag>{item.config?.type}</Tag>}

              &nbsp;
              {item.status == "connecting" ? (
                <SyncOutlined spin className="text-blue-400" />
              ) : item.status == "connected" ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : item.status == "disconnected" ? (
                <DisconnectOutlined className="text-red-400" />
              ) : item.status ==
                "disabled" ? null : null}
            </span>
          </>
        }
        description={item.servername}
      />
    );
  };

  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="market overflow-auto">
      <div className="flex flex-wrap">
        <div className="w-full lg:w-2/5">
          <Tabs
            className="rounded-lg bg-white"
            type="card"
            items={[

              {
                label: t`MCP Community`,
                key: "thirdparty",
                children: (
                  <div className="bg-white p-0">
                    <div className="flex justify-center p-1">
                      <Space.Compact>
                        <Input placeholder="Search" onChange={e => {
                          setSearchValue(e.target.value);
                        }} />
                        <Button
                          onClick={() => {
                            mcpform.resetFields();
                            setIsAddMCPConfigOpen(true);
                            setCurrResult({
                              data: null,
                              error: null,
                            })
                          }}
                        >
                          {t`Add MCP`}
                        </Button>
                        <Button
                          title={t`Open Configuration File`}
                          icon={<SettingOutlined />}
                          onClick={async () => {
                            let p = await call("pathJoin", ["mcp.json"]);
                            await call("openExplorer", [p]);
                          }}
                        >
                        </Button>
                      </Space.Compact>
                    </div>
                    <div style={{ maxHeight: "calc(100vh - 152px)", overflowY: "auto" }}>
                      <List
                        itemLayout="horizontal"
                        dataSource={mcpClients.filter(x => x.source == "hyperchat" && x.name && x.name.includes(searchValue))}
                        renderItem={(item: InitedClient, index) => (
                          <List.Item
                            className="hover:cursor-pointer hover:bg-slate-300"
                            actions={[<Space.Compact>
                              {[
                                (
                                  <a
                                    key="list-del"
                                    className="text-lg hover:text-cyan-400"
                                  >
                                    <Popconfirm
                                      title="Sure to delete?"
                                      onConfirm={async () => {
                                        try {
                                          await call("closeMcpClients", [
                                            item.name,
                                            {
                                              isdelete: true,
                                              isdisable: false,
                                            }
                                          ]);

                                        } catch (e) {
                                          message.error(e.message);
                                        }
                                      }}
                                    >
                                      <Button title={t`delete`} type="link">
                                        <DeleteOutlined className="text-lg hover:text-cyan-400" />
                                      </Button>
                                    </Popconfirm>
                                  </a>
                                ),

                                RenderEnableAndDisable(item),

                                <a key="set-del" className="text-lg hover:text-cyan-400">
                                  <Button type="link" onClick={async (e) => {
                                    // await MCP_CONFIG.init()
                                    // const config =
                                    //   MCP_CONFIG.get().mcpServers[item.name];

                                    let formValues = {
                                      ...item.config,
                                      name: item.name,
                                    } as any;
                                    formValues._name = item.name;
                                    formValues._type = "edit";
                                    formValues.command = [
                                      formValues.command || "",
                                      ...formValues.args || [],
                                    ].join("   ");
                                    formValues._envList = [];
                                    for (let key in (formValues.env || {})) {
                                      formValues._envList.push({
                                        name: key,
                                        value: formValues.env[key],
                                      });
                                    }
                                    formValues.type =
                                      formValues?.type || formValues?.hyperchat?.type || "stdio";
                                    formValues.url =
                                      formValues?.url || formValues?.hyperchat?.url || "";


                                    formValues.headers = Object.entries(formValues.headers || {}).map(([key, value]) => `${key}=${value}`).join("\n");

                                    mcpform.resetFields();
                                    mcpform.setFieldsValue(formValues);
                                    setIsAddMCPConfigOpen(true);
                                    setCurrResult({
                                      data: null,
                                      error: null,
                                    })
                                  }} title={t`Setting`}>
                                    <SettingOutlined />
                                  </Button>
                                </a>,
                                <Popover key="more-setting" trigger="click" title={t`More Setting`} content={
                                  <div>
                                    {t`Sync`}: <Switch value={item.config.isSync} onChange={async (e) => {
                                      // await MCP_CONFIG.init()
                                      // MCP_CONFIG.get().mcpServers[item.name].isSync = e;
                                      // await MCP_CONFIG.save();
                                      // item.config.isSync = e;
                                      // refresh();
                                      item.config.isSync = e;
                                      await call("openMcpClient", [item.name, item.config, { onlySave: true }]);
                                    }}></Switch>
                                  </div>
                                }><Button type="link" icon={<MoreOutlined />} title={t`More Setting`}></Button></Popover>
                                // ) : undefined,
                              ].filter((x) => x != null)}
                            </Space.Compact>]}
                          >
                            {ListItemMeta(item)}
                          </List.Item>
                        )}
                      />
                    </div>
                  </div>
                ),
              },
              {
                label: t`Build-in`,
                key: "official",
                children: (
                  <div className="bg-white p-0">
                    <List
                      itemLayout="horizontal"
                      dataSource={mcpClients.filter(x => x.source == "builtin")}
                      renderItem={(item: InitedClient, index) => (
                        <List.Item
                          className="hover:cursor-pointer hover:bg-slate-300"
                          actions={[
                            // item.source == "builtin" && (
                            //   <a
                            //     key="list-loadmore-down"
                            //     className="text-lg hover:text-cyan-400"
                            //   >
                            //     {MCP_CONFIG.get().mcpServers[item.name] ? (
                            //       <Popconfirm
                            //         title="Sure to delete?"
                            //         onConfirm={async () => {
                            //           try {
                            //             await call("closeMcpClients", [
                            //               item.uid,
                            //               {
                            //                 isdelete: true,
                            //                 isdisable: false,
                            //               }
                            //             ]);
                            //           } catch (e) {
                            //             message.error(e.message);
                            //           }
                            //         }}
                            //       >
                            //         <Tooltip
                            //           title="uninstall"
                            //           placement="bottom"
                            //         >
                            //           <DeleteOutlined className="text-lg hover:text-cyan-400" />
                            //         </Tooltip>
                            //       </Popconfirm>
                            //     ) : (
                            //       <Tooltip title="install" placement="bottom">
                            //         <CloudDownloadOutlined
                            //           onClick={async (e) => {
                            //             e.stopPropagation();
                            //             mcpconfigform.resetFields();

                            //             setCurrRow(item);
                            //             let zo = eval(
                            //               jsonSchemaToZod(item.ext.configSchema),
                            //             );
                            //             mcpconfigform?.setFieldsValue(
                            //               zo.safeParse({}).data,
                            //             );
                            //             if (
                            //               Object.keys(
                            //                 MCP_CONFIG.get().mcpServers[
                            //                   item.name
                            //                 ]?.hyperchat.config || {},
                            //               ).length > 0
                            //             ) {
                            //               mcpconfigform.setFieldsValue(
                            //                 MCP_CONFIG.get().mcpServers[
                            //                   item.name
                            //                 ]?.hyperchat.config || {},
                            //               );
                            //             }
                            //             setMcpconfigOpen(true);
                            //             await getClients();
                            //             refresh();
                            //           }}
                            //         />
                            //       </Tooltip>
                            //     )}
                            //   </a>
                            // ),


                            RenderEnableAndDisable(item),

                            item.status != "disabled" ? (
                              <a className="text-lg hover:text-cyan-400">
                                <Button type="link" title={t`Setting`} onClick={async (e) => {
                                  e.stopPropagation();
                                  mcpconfigform.resetFields();
                                  let zo = eval(
                                    jsonSchemaToZod(item.ext.configSchema),
                                  );
                                  mcpconfigform?.setFieldsValue(
                                    zo.safeParse({}).data,
                                  );


                                  mcpconfigform.setFieldsValue(
                                    item.config?.hyperchat?.config || {},
                                  );

                                  setCurrRow(item);
                                  setMcpconfigOpen(true);
                                  refresh();
                                }}>
                                  <SettingOutlined

                                  />
                                </Button>
                              </a>
                            ) : undefined,
                            // item.github ? (
                            //   <a
                            //     className="text-lg hover:text-cyan-400"
                            //     href={item.github}
                            //   >
                            //     <GithubOutlined />
                            //   </a>
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
              mcpClients.filter(x => x.source == "claude").length > 0 && {
                label: t`Claude Desktop`,
                key: "claude",
                children: (
                  <div className="bg-white p-0">
                    <div className="flex justify-center p-1">
                      <>
                        <Button
                          title={t`Open Configuration File`}
                          icon={<SettingOutlined />}
                          onClick={async () => {

                            let c = await call("getConfig", []);
                            await call("openExplorer", [c.claudeConfigPath]);
                          }}
                        >
                          Claude Desktop Config
                        </Button>
                        <span title="isLoadClaudeConfig:" className="my-bottom">
                          <Switch checked={electronData.get().isLoadClaudeConfig} onChange={async (checked) => {
                            if (checked) {
                              for (let x of mcpClients.filter(x => x.source == "claude")) {
                                await call("openMcpClient", [x.name]);
                              }
                            } else {
                              for (let x of mcpClients.filter(x => x.source == "claude")) {
                                await call("closeMcpClients", [x.name, { isdelete: false, isdisable: true }]);
                              }
                            }
                            electronData.get().isLoadClaudeConfig = checked;
                            await electronData.save();
                            refresh();
                          }} /> </span>
                      </>
                    </div>
                    <div style={{ maxHeight: "calc(100vh - 152px)", overflowY: "auto" }}>
                      <List
                        itemLayout="horizontal"
                        dataSource={mcpClients.filter(x => x.source == "claude" && x.name && x.name.includes(searchValue))}
                        renderItem={(item: any, index) => (
                          <List.Item
                            className="hover:cursor-pointer hover:bg-slate-300"

                          >
                            {ListItemMeta(item)}
                          </List.Item>
                        )}
                      />
                    </div>
                  </div>
                ),
              },
            ].filter(x => x)}
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
          title={t`BuildIn MCP Configuration`}
          open={mcpconfigOpen}
          footer={[]}
          onCancel={() => setMcpconfigOpen(false)}
          forceRender={true}
        >
          <Form
            name="buildinMcpConfigform"
            form={mcpconfigform}
            onFinish={async (values) => {
              // console.log("onFinish", values);
              let zo = eval(jsonSchemaToZod(currRow.ext.configSchema));

              values = zo.safeParse(values).data;
              // console.log("onFinish", values);
              currRow.config = {
                ...currRow.config,
                hyperchat: {
                  config: values,
                } as any
              }

              try {
                if (
                  currRow.source == "builtin"
                ) {
                  await call("openMcpClient", [
                    currRow.name,
                    currRow.config,
                  ]);
                  setMcpconfigOpen(false);
                } else {
                  // ! 不会生效了
                  // let config = currRow.resolve(values);
                  // config.hyperchat = {
                  //   url: "",
                  //   type: "stdio",
                  //   scope: "outer",
                  //   config: values,
                  // };
                  // await call("openMcpClient", [currRow.name, config]);

                  // MCP_CONFIG.get().mcpServers[currRow.name] = config;
                  // await MCP_CONFIG.save();

                  // await getClients();
                  // setMcpconfigOpen(false);
                }
              } catch (e) {
                message.error(e.message);
              }
            }}
          >
            {currRow.ext.configSchema
              ? JsonSchema2FormItemOrNull(currRow.ext.configSchema) ||
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

                  if (values._type != "edit") { // 新建
                    if (mcpClients.find(x => x.name === values.name)) {
                      message.error(t`MCP Service Name already exists`);
                      return;
                    }
                  } else { //编辑
                    if (values.name != values._name) {
                      await call("closeMcpClients", [values._name, { isdelete: true, isdisable: true }]);
                    }
                  }


                  let mcpServerConfig = {} as MCP_CONFIG_TYPE;
                  if (values.type == "sse" || values.type == "streamableHttp") {
                    let headers = {};
                    values.headers = values.headers || "";
                    let lines = values.headers.split("\n");
                    for (let line of lines) {
                      let [key, value] = line.split("=");
                      if (key && value) {
                        headers[key.trim()] = value.trim();
                      }
                    }
                    mcpServerConfig = {
                      url: values.url,
                      type: values.type,
                      headers: headers,
                    };
                  } else {
                    let commands = values.command
                      .split(" ")
                      .filter((x) => x.trim() != "");

                    let [command, ...args] = commands;
                    values.command = command.trim();
                    values.args = args;
                    values.env = {};
                    try {
                      values._envList = values._envList || [];
                      for (let x of values._envList) {
                        values.env[x.name.trim()] = x.value.trim();
                      }
                    } catch {
                      message.error("Please enter a valid JSON");
                      return;
                    }
                    mcpServerConfig = {
                      command: values.command,
                      args: values.args,
                      env: values.env,
                    }
                  }

                  await call("openMcpClient", [values.name, mcpServerConfig]);

                  setCurrResult({
                    data: "success",
                    error: null,
                  });
                  refresh();
                  setIsAddMCPConfigOpen(false);
                } catch (e) {
                  // message.error(e.message);
                  setCurrResult({
                    data: null,
                    error: e.message,
                  });
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
            label={t`Old Name`}
            className="hidden"
            rules={[{ required: true, message: t`Please enter` }]}
          >
            <Input
              disabled
              placeholder="Please enter"
            ></Input>
          </Form.Item>
          <Form.Item
            name="name"
            label={t`Name`}
            rules={[{ required: true, message: t`Please enter` }]}
          >
            <Input
              placeholder="Please enter"
            ></Input>
          </Form.Item>

          <Form.Item
            name="type"
            label={t`type`}
            rules={[{ required: true, message: t`Please enter` }]}
          >
            <Radio.Group
              onChange={(e) => {
                refresh();
              }}
            >
              <Radio value="stdio">stdio</Radio>
              <Radio value="sse">sse</Radio>
              <Radio value="streamableHttp">streamableHttp</Radio>
            </Radio.Group>
          </Form.Item>
          {(mcpform.getFieldValue("type") == "sse" || mcpform.getFieldValue("type") == "streamableHttp") ? (
            <div>
              {" "}
              <Form.Item
                name="url"
                label="url"
                rules={[{ required: true, message: "Please enter" }]}
              >
                <Input placeholder="Please enter url"></Input>
              </Form.Item>
              <Form.Item
                name="headers"
                label={t`request-headers`}
              >
                <Input.TextArea placeholder="Content-Type=application/json
Authorization=Bearer token"></Input.TextArea>
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
                            rules={[
                              { required: true, message: "Missing name" },
                            ]}
                          >
                            <Input placeholder="Var Name" />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            className="flex-1"
                            name={[name, "value"]}
                            rules={[
                              { required: true, message: "Missing Value" },
                            ]}
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

          {currResult.data && (
            <div>
              <div>Result:</div>
              <div>{(currResult.data)}</div>
            </div>
          )}
          {currResult.error && (
            <div className="text-red-500 max-h-64 overflow-auto">
              <div>Result:</div>
              <Pre>{currResult.error.toString()}</Pre>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
