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
  MCPServerConfig,
} from "@hyperchat/shared/data.mjs";
import { EVENT } from "../../common/event";
import { Code } from "../../common/code";
import { getMCPExtensionData } from "../../common/mcp";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import { useForceUpdate } from "../../hooks/useForceUpdate";

/**
 * MCP 市场页面的类型定义
 */

/** MCP 服务器配置的环境变量项 */
interface EnvListItem {
  name: string;
  value: string;
}

/** 表单配置项 */
interface MCPFormValues {
  _type?: 'edit' | 'create';
  _name?: string;
  name: string;
  type: 'stdio' | 'sse' | 'streamableHttp';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  _envList?: EnvListItem[];
  url?: string;
  headers?: string | Record<string, string>;
}

/** 操作结果状态 */
interface OperationResult {
  data: any;
  error: any;
}

/** MCP 加载状态映射 */
interface MCPLoadingState {
  [clientName: string]: boolean;
}
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


import { jsonSchemaToZod } from "json-schema-to-zod";
import { InitedClient } from "../../common/mcp";
import { t } from "../../i18n";
import { HeaderContext } from "../../common/context";
import {
  JsonSchema2FormItem,
  JsonSchema2FormItemOrNull,
  JsonSchema2ProFormColumnsType,
  showText,
} from "../../common";
import { Pre } from "../../components/pre";
import { Icon } from "../../components/icon";
import { MCPGateWayPage } from "./gateway";

/**
 * MCP Market 页面组件
 * 提供 MCP（模型上下文协议）服务的管理界面，包括：
 * - 社区 MCP 服务的安装和配置
 * - 内置 MCP 服务的启用和配置
 * - MCP Gateway 管理
 * - 环境检查和修复工具
 */
export function Market() {
  // ==================== 状态管理 ====================
  
  /** 强制刷新组件 */
  const refresh = useForceUpdate();

  /** 全局上下文，包含 MCP 客户端信息 */
  const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);
  
  /** Node.js 版本信息 */
  const [nodeV, setNodeV] = useState<string>("");
  
  /** UV 工具版本信息 */
  const [uv, setUvVer] = useState<string>("");
  
  /** MCP 服务加载状态映射 */
  const [mcpLoadingObj, setMcpLoadingObj] = useState<MCPLoadingState>({});

  // ==================== 表单和模态框状态 ====================
  
  /** PATH 配置表单实例 */
  const [form] = Form.useForm();
  
  /** MCP 内置服务配置表单实例 */
  const [mcpconfigform] = Form.useForm();
  
  /** PATH 配置模态框开启状态 */
  const [isPathOpen, setIsPathOpen] = useState<boolean>(false);
  
  /** 当前选中的 MCP 客户端行 */
  const [currRow, setCurrRow] = useState<InitedClient>({
    ext: {}
  } as InitedClient);
  
  /** MCP 内置服务配置模态框开启状态 */
  const [mcpconfigOpen, setMcpconfigOpen] = useState<boolean>(false);
  
  /** 添加 MCP 配置模态框开启状态 */
  const [isAddMCPConfigOpen, setIsAddMCPConfigOpen] = useState<boolean>(false);
  
  /** MCP 服务开启操作加载状态 */
  const [loadingOpenMCP, setLoadingOpenMCP] = useState<boolean>(false);
  
  /** MCP 服务配置表单实例 */
  const [mcpform] = Form.useForm<MCPFormValues>();
  
  /** 操作结果状态 */
  const [currResult, setCurrResult] = useState<OperationResult>({
    data: null,
    error: null,
  });

  /** 搜索关键词 */
  const [searchValue, setSearchValue] = useState<string>("");

  // ==================== 初始化和生命周期 ====================

  /**
   * 初始化环境检查
   * 检查 Node.js 和 UV 工具是否已安装
   */
  const init = async (): Promise<void> => {
    (async () => {
      const nodeVersion = await call("exec", { command: "node", args: ["-v"] });
      setNodeV(nodeVersion);
    })();
    (async () => {
      const uvVersion = await call("exec", { command: "uv", args: ["-V"] });
      setUvVer(uvVersion);
    })();
  };

  // 组件挂载时执行初始化
  useEffect(() => {
    init();
    (async () => {
      await electronData.init();
      refresh();
    })();
  }, []);

  // ==================== 组件方法 ====================

  /**
   * 渲染启用/禁用按钮
   * @param item MCP 客户端信息
   * @returns 启用/禁用按钮组件
   */
  const RenderEnableAndDisable = (item: InitedClient): JSX.Element => {
    return (
      <Button 
        key="enable" 
        onClick={async (e: React.MouseEvent) => {
          try {
            // 设置当前 MCP 服务为加载状态
            mcpLoadingObj[item.name] = true;
            setMcpLoadingObj({ ...mcpLoadingObj });

            if (item.status !== "disabled") {
              // 如果当前状态不是禁用，则关闭服务
              await call("closeMcpClients", {
                clientName: item.name,
                isdelete: false,
                isdisable: true
              });
            } else {
              // 如果当前状态是禁用，则开启服务
              await call("openMcpClient", { clientName: item.name });
            }
          } catch (e: any) {
            message.error(e.message);
          } finally {
            // 清除加载状态
            mcpLoadingObj[item.name] = false;
            setMcpLoadingObj({ ...mcpLoadingObj });
          }
        }} 
        type="link" 
        title={item.status === "disabled" ? t`Enable` : t`Disable`}
        icon={
          item.status === "disabled" ? (
            <CaretRightOutlined />
          ) : (
            <StopOutlined />
          )
        }
      />
    );
  };

  /**
   * 渲染列表项元数据
   * @param item MCP 客户端信息
   * @returns 列表项元数据组件
   */
  const ListItemMeta = (item: InitedClient): JSX.Element => {
    return (
      <List.Item.Meta
        className="px-2"
        title={
          <>
            <span>
              {/* MCP 服务名称 */}
              {item.name}&nbsp;
              
              {/* 版本标签 */}
              {item.version && <Tag>{item.version}</Tag>}
              
              {/* 内置服务标签 */}
              {item.source === "builtin" && <Tag color="blue">{t`built-in`}</Tag>}
              
              {/* 同步标签 */}
              {item.source === "hyperchat" && item.config.isSync && (
                <Tag className="text-blue-400">sync</Tag>
              )}
              &nbsp;

              {/* 服务类型标签（非 stdio 类型时显示） */}
              {(item.config?.type && item.config?.type !== "stdio") && (
                <Tag>{item.config?.type}</Tag>
              )}

              &nbsp;
              
              {/* 连接状态图标 */}
              {item.status === "connecting" ? (
                <SyncOutlined spin className="text-blue-400" />
              ) : item.status === "connected" ? (
                <CheckCircleTwoTone twoToneColor="#52c41a" />
              ) : item.status === "disconnected" ? (
                <DisconnectOutlined className="text-red-400" />
              ) : item.status === "disabled" ? null : null}
            </span>
          </>
        }
        description={item.servername}
      />
    );
  };

  // ==================== 组件渲染 ====================

  return (
    <div className="market overflow-auto">
      <div className="flex flex-wrap">
        {/* 左侧：MCP 服务管理面板 */}
        <div className="w-full lg:w-2/5">
          <Tabs
            className="rounded-lg bg-white"
            type="card"
            items={[
              // MCP 社区服务标签页
              {
                label: t`MCP Community`,
                key: "thirdparty",
                children: (
                  <div className="bg-white p-0">
                    {/* 搜索和操作栏 */}
                    <div className="flex justify-center p-1">
                      <Space.Compact>
                        <Input 
                          placeholder="Search" 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearchValue(e.target.value);
                          }} 
                        />
                        <Button
                          onClick={() => {
                            mcpform.resetFields();
                            setIsAddMCPConfigOpen(true);
                            setCurrResult({
                              data: null,
                              error: null,
                            });
                          }}
                        >
                          {t`Add MCP`}
                        </Button>
                        <Button
                          title={t`Open Configuration File`}
                          icon={<SettingOutlined />}
                          onClick={async () => {
                            const configPath = await call("pathJoin", { path: "mcp.json" });
                            await showText({ path: configPath });
                          }}
                        />
                      </Space.Compact>
                    </div>
                    
                    {/* MCP 服务列表 */}
                    <div style={{ maxHeight: "calc(100vh - 152px)", overflowY: "auto" }}>
                      <List
                        itemLayout="horizontal"
                        dataSource={mcpClients.filter(x => 
                          x.source === "hyperchat" && 
                          x.name && 
                          x.name.includes(searchValue)
                        )}
                        renderItem={(item: InitedClient, index: number) => (
                          <List.Item
                            className="hover:cursor-pointer hover:bg-slate-300"
                            actions={[
                              <Space.Compact key="actions">
                                {[
                                  // 删除按钮
                                  (
                                    <a
                                      key="list-del"
                                      className="text-lg hover:text-cyan-400"
                                    >
                                      <Popconfirm
                                        title="Sure to delete?"
                                        onConfirm={async () => {
                                          try {
                                            await call("closeMcpClients", {
                                              clientName: item.name,
                                              isdelete: true,
                                              isdisable: false,
                                            });
                                          } catch (e: any) {
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

                                  // 启用/禁用按钮
                                  RenderEnableAndDisable(item),

                                  // 设置按钮
                                  <a key="set-del" className="text-lg hover:text-cyan-400">
                                    <Button 
                                      type="link" 
                                      onClick={async (e: React.MouseEvent) => {
                                        // 准备表单数据进行编辑
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
                                        
                                        // 转换环境变量格式
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

                                        // 转换 headers 格式
                                        formValues.headers = Object.entries(formValues.headers || {})
                                          .map(([key, value]) => `${key}=${value}`)
                                          .join("\n");

                                        mcpform.resetFields();
                                        mcpform.setFieldsValue(formValues);
                                        setIsAddMCPConfigOpen(true);
                                        setCurrResult({
                                          data: null,
                                          error: null,
                                        });
                                      }} 
                                      title={t`Setting`}
                                    >
                                      <SettingOutlined />
                                    </Button>
                                  </a>,
                                  
                                  // 更多设置按钮
                                  <Popover 
                                    key="more-setting" 
                                    trigger="click" 
                                    title={t`More Setting`} 
                                    content={
                                      <div>
                                        {t`Sync`}: 
                                        <Switch 
                                          value={item.config.isSync} 
                                          onChange={async (checked: boolean) => {
                                            item.config.isSync = checked;
                                            await call("openMcpClient", {
                                              clientName: item.name, 
                                              clientConfig: item.config,
                                              options: { onlySave: true }
                                            });
                                          }}
                                        />
                                      </div>
                                    }
                                  >
                                    <Button 
                                      type="link" 
                                      icon={<MoreOutlined />} 
                                      title={t`More Setting`}
                                    />
                                  </Popover>
                              ].filter((x) => x != null)}
                              </Space.Compact>
                            ]}
                          >
                            {ListItemMeta(item)}
                          </List.Item>
                        )}
                      />
                    </div>
                  </div>
                ),
              },
              // 内置服务标签页
              {
                label: t`Build-in`,
                key: "official",
                children: (
                  <div className="bg-white p-0">
                    <List
                      itemLayout="horizontal"
                      dataSource={mcpClients.filter(x => x.source === "builtin")}
                      renderItem={(item: InitedClient, index: number) => (
                        <List.Item
                          className="hover:cursor-pointer hover:bg-slate-300"
                          actions={[
                            // 启用/禁用按钮
                            RenderEnableAndDisable(item),
                            
                            // 设置按钮（仅当服务未禁用时显示）
                            item.status !== "disabled" ? (
                              <a className="text-lg hover:text-cyan-400" key="builtin-setting">
                                <Button 
                                  type="link" 
                                  title={t`Setting`} 
                                  onClick={async (e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    mcpconfigform.resetFields();
                                    
                                    // 根据配置 schema 生成默认值
                                    const zodSchema = eval(jsonSchemaToZod(item.ext.configSchema));
                                    mcpconfigform?.setFieldsValue(zodSchema.safeParse({}).data);

                                    // 设置当前配置值
                                    mcpconfigform.setFieldsValue(
                                      item.config?.hyperchat?.config || {},
                                    );

                                    setCurrRow(item);
                                    setMcpconfigOpen(true);
                                    refresh();
                                  }}
                                >
                                  <SettingOutlined />
                                </Button>
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
              // MCP Gateway 标签页
              {
                label: t`MCP Gateway`,
                key: "mcpGateway",
                children: (
                  <div>
                    <MCPGateWayPage />
                  </div>
                )
              }
            ].filter(x => x)}
          />
        </div>
        
        {/* 右侧：MCP 市场和帮助信息 */}
        <div className="w-full p-4 lg:w-3/5">
          <div>
            {/* MCP 市场链接 */}
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
            
            {/* 环境检查和帮助信息 */}
            <div>Help: </div>
            <div className="help">
              {/* Node.js 环境检查 */}
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
                      {electronData.get().platform === "win32" ? (
                        <div>
                          <span>{t`Please run the command.`}</span>
                          <Code>winget install OpenJS.NodeJS.LTS</Code>
                        </div>
                      ) : electronData.get().platform === "darwin" ? (
                        <div>
                          <span>{t`Please run the command.`}</span>
                          <Code>brew install node</Code>
                        </div>
                      ) : (
                        ""
                      )}
                      <a href="https://nodejs.org/">goto nodejs</a>
                    </Space>
                  </div>
                )}
              </div>
              
              {/* UV 工具环境检查 */}
              <div>
                <div>
                  <Space>
                    <span className="font-bold">uv:</span>
                    {uv || t`Not Installed`}
                  </Space>
                </div>
                {!uv && (
                  <div>
                    <Space>
                      {electronData.get().platform === "win32" ? (
                        <div>
                          <span>{t`Please run the command.`}</span>
                          <Code>winget install --id=astral-sh.uv -e</Code>
                        </div>
                      ) : electronData.get().platform === "darwin" ? (
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

              {/* 环境修复按钮 */}
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
        
        {/* ==================== 模态框组件 ==================== */}
        
        {/* PATH 配置模态框 */}
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
              onFinish={async (values: { PATH: string }) => {
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
            <Input placeholder="Here, you would input the result of the command echo $PATH." />
          </Form.Item>
        </Modal>
        
        {/* 内置 MCP 配置模态框 */}
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
            onFinish={async (values: any) => {
              // 使用 Zod schema 验证配置数据
              const zodSchema = eval(jsonSchemaToZod(currRow.ext.configSchema));
              const validatedValues = zodSchema.safeParse(values).data;
              
              // 更新配置
              currRow.config = {
                ...currRow.config,
                hyperchat: {
                  config: validatedValues,
                } as any
              };

              try {
                if (currRow.source === "builtin") {
                  await call("openMcpClient", {
                    clientName: currRow.name,
                    clientConfig: currRow.config,
                  });
                  setMcpconfigOpen(false);
                }
              } catch (e: any) {
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

        {/* 添加/编辑 MCP 配置模态框 */}
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
              onFinish={async (values: MCPFormValues) => {
                try {
                  setLoadingOpenMCP(true);

                  // 检查服务名称是否已存在（新建时）
                  if (values._type !== "edit") {
                    if (mcpClients.find(x => x.name === values.name)) {
                      message.error(t`MCP Service Name already exists`);
                      return;
                    }
                  } else {
                    // 编辑时，如果名称改变则删除旧服务
                    if (values._name && values.name !== values._name) {
                      await call("closeMcpClients", { 
                        clientName: values._name, 
                        isdelete: true, 
                        isdisable: true 
                      });
                    }
                  }

                  let mcpServerConfig = {} as MCPServerConfig;
                  
                  // 根据服务类型构建配置
                  if (values.type === "sse" || values.type === "streamableHttp") {
                    let headers: Record<string, string> = {};
                    const headersString = (values.headers as string) || "";
                    const lines = headersString.split("\n");
                    for (let line of lines) {
                      const [key, value] = line.split("=");
                      if (key && value) {
                        headers[key.trim()] = value.trim();
                      }
                    }
                    mcpServerConfig = {
                      url: values.url!,
                      type: values.type,
                      headers: headers,
                    };
                  } else {
                    // 处理 stdio 类型的配置
                    const commands = values.command!
                      .split(" ")
                      .filter((x) => x.trim() !== "");

                    const [command, ...args] = commands;
                    values.command = command.trim();
                    values.args = args;
                    values.env = {};
                    
                    try {
                      values._envList = values._envList || [];
                      for (let envItem of values._envList) {
                        values.env[envItem.name.trim()] = envItem.value.trim();
                      }
                    } catch {
                      message.error("Please enter a valid JSON");
                      return;
                    }
                    
                    mcpServerConfig = {
                      command: values.command,
                      args: values.args,
                      env: values.env,
                    };
                  }

                  // 开启 MCP 客户端
                  await call("openMcpClient", { 
                    clientName: values.name, 
                    clientConfig: mcpServerConfig 
                  });

                  setCurrResult({
                    data: "success",
                    error: null,
                  });
                  refresh();
                  setIsAddMCPConfigOpen(false);
                } catch (e: any) {
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
          {/* 表单隐藏字段 */}
          <Form.Item className="hidden" name="_type" label="_type">
            <Input />
          </Form.Item>
          <Form.Item
            name="_name"
            label={t`Old Name`}
            className="hidden"
            rules={[{ message: t`Please enter` }]}
          >
            <Input disabled placeholder="Please enter" />
          </Form.Item>
          
          {/* 服务名称 */}
          <Form.Item
            name="name"
            label={t`Name`}
            rules={[{ required: true, message: t`Please enter` }]}
          >
            <Input placeholder="Please enter" />
          </Form.Item>

          {/* 服务类型选择 */}
          <Form.Item
            name="type"
            label={t`type`}
            rules={[{ required: true, message: t`Please enter` }]}
          >
            <Radio.Group
              onChange={() => {
                refresh();
              }}
            >
              <Radio value="stdio">stdio</Radio>
              <Radio value="sse">sse</Radio>
              <Radio value="streamableHttp">streamableHttp</Radio>
            </Radio.Group>
          </Form.Item>
          
          {/* 根据服务类型显示不同的配置项 */}
          {(mcpform.getFieldValue("type") === "sse" || 
            mcpform.getFieldValue("type") === "streamableHttp") ? (
            <div>
              {/* HTTP 服务配置 */}
              <Form.Item
                name="url"
                label="url"
                rules={[{ required: true, message: "Please enter" }]}
              >
                <Input placeholder="Please enter url" />
              </Form.Item>
              <Form.Item name="headers" label={t`request-headers`}>
                <Input.TextArea 
                  placeholder="Content-Type=application/json&#10;Authorization=Bearer token" 
                />
              </Form.Item>
            </div>
          ) : (
            <div>
              {/* 命令行服务配置 */}
              <Form.Item
                name="command"
                label="command"
                rules={[{ required: true, message: "Please enter" }]}
              >
                <Input placeholder="Please enter command" />
              </Form.Item>

              {/* 环境变量配置 */}
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

          {/* 操作结果显示 */}
          {currResult.data && (
            <div>
              <div>Result:</div>
              <div>{currResult.data}</div>
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
