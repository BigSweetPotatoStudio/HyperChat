import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  List,
  Button,
  Tag,
  Space,
  Empty,
  Dropdown,
  Modal,
  Drawer,
  Descriptions,
  Typography,
  message,
  Select,
  Input,
  Spin,
  Alert,
  Form,
  Radio,
  Popconfirm,
  Divider,
} from "antd";
import {
  ReloadOutlined,
  MoreOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  PlusOutlined,
  FilterOutlined,
  SearchOutlined,
  ExperimentOutlined,
  SettingOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { call } from "../common/call";
import { t } from "../i18n";
import { HyperChatCompletionTool, IMCPClient, MCPServerConfig } from "@dadigua/hyperchat-shared/types";
import Editor from "@monaco-editor/react";
import { WorkspaceInfo } from "../pages/workspace/types";
import { useForceUpdate } from "../hooks";

const { Title, Text } = Typography;





interface MCPManagementProps {
  workspace: WorkspaceInfo;
  mcpClients: IMCPClient[];
  onRefresh: () => Promise<void>;
}

// MCP 配置表单数据结构
interface MCPFormValues {
  _type?: 'edit' | 'create';
  _name?: string;
  name: string;
  type: 'stdio' | 'sse' | 'streamableHttp';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  _envList?: { name: string; value: string }[];
  url?: string;
  headers?: string | Record<string, string>;
}

export interface MCPManagementRef {
  addMcpServer: () => void;
  refreshMcpClients: () => void;
}

export const MCPManagement = forwardRef<MCPManagementRef, MCPManagementProps>(({ workspace, mcpClients, onRefresh }, ref) => {
  let reflesh = useForceUpdate();

  const [mcpRefreshing, setMcpRefreshing] = useState(false);
  const [mcpDetailDrawer, setMcpDetailDrawer] = useState(false);
  const [selectedMcpClient, setSelectedMcpClient] = useState<IMCPClient | null>(null);
  const [addMcpModalOpen, setAddMcpModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  // Scope filters removed in Agent-centered architecture
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [selectedClientTools, setSelectedClientTools] = useState<any[]>([]);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  // 工具测试相关状态
  const [testToolModalOpen, setTestToolModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<HyperChatCompletionTool | null>(null);
  const [testParams, setTestParams] = useState<string>("{}");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // MCP 配置表单相关状态
  const [mcpForm] = Form.useForm<MCPFormValues>();
  const [loadingOpenMCP, setLoadingOpenMCP] = useState(false);
  const [mcpConfigResult, setMcpConfigResult] = useState<{ data: any; error: any }>({ data: null, error: null });

  // Monaco编辑器引用
  const monacoRef = useRef<any>(null);
  const editorRef = useRef<any>(null);

  // 添加MCP服务器
  const addMcpServer = () => {
    mcpForm.resetFields();
    setMcpConfigResult({ data: null, error: null });
    setAddMcpModalOpen(true);
  };

  // 编辑MCP服务器
  const editMcpServer = (client: IMCPClient) => {
    // 准备表单数据进行编辑
    let formValues = {
      ...client.config,
      name: client.serverName,
    } as any;

    formValues._name = client.serverName;
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

    formValues.type = formValues?.type || formValues?.hyperchat?.type || "stdio";
    formValues.url = formValues?.url || formValues?.hyperchat?.url || "";

    // 转换 headers 格式
    formValues.headers = Object.entries(formValues.headers || {})
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    mcpForm.resetFields();
    mcpForm.setFieldsValue(formValues);
    setMcpConfigResult({ data: null, error: null });
    setAddMcpModalOpen(true);
  };

  // 刷新MCP客户端列表
  const refreshMcpClients = async () => {
    try {
      setMcpRefreshing(true);

      if (workspace.isGlobal) {
        // 全局工作区：强制重新加载全局MCP客户端
        await call("forceReloadMcpClients");
      } else {
        // 项目工作区：强制重新加载工作区特定的MCP客户端
        try {
          await call("forceReloadWorkspaceMcpClients");
        } catch (error) {
          // 如果工作区MCP强制重新加载失败，回退到全局强制重新加载
          console.warn("Workspace MCP force reload failed, falling back to global force reload:", error);
          await call("forceReloadMcpClients");
        }
      }

      // 调用父组件的刷新函数
      await onRefresh();

      message.success(t`MCP clients reloaded successfully`);
    } catch (error) {
      console.error("Failed to reload MCP clients:", error);
      message.error(t`Failed to reload MCP clients`);
    } finally {
      setMcpRefreshing(false);
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    addMcpServer,
    refreshMcpClients
  }), []);

  // 重启MCP客户端
  const restartMcpClient = async (client: IMCPClient) => {
    try {
      // 使用新的工作区特定的重启方法
      await call("manageWorkspaceMcpClient", {
        clientName: client.serverName,
        action: "restart"
        // scope: client.scope // 传递 scope 信息
      });

      message.success(t`MCP client restarted successfully`);

      // 重启成功后刷新前端数据（只刷新MCP数据）
      await onRefresh();
    } catch (error) {
      console.error(`Failed to restart MCP client ${client.serverName}:`, error);
      message.error(t`Failed to restart MCP client`);
    }
  };

  // 停用MCP客户端
  const disableMcpClient = async (client: IMCPClient) => {
    try {
      // 使用新的工作区特定的禁用方法
      await call("manageWorkspaceMcpClient", {
        clientName: client.serverName,
        action: "disable"
        // scope: client.scope // 传递 scope 信息
      });
      message.success(t`MCP client disabled successfully`);

      // 停用成功后刷新前端数据（只刷新MCP数据）
      await onRefresh();
    } catch (error) {
      console.error(`Failed to disable MCP client ${client.serverName}:`, error);
      message.error(t`Failed to disable MCP client`);
    }
  };

  // 启用MCP客户端
  const enableMcpClient = async (client: IMCPClient) => {
    try {
      // 使用新的工作区特定的启用方法
      await call("manageWorkspaceMcpClient", {
        clientName: client.serverName,
        action: "enable"
        // scope: client.scope // 传递 scope 信息
      });
      message.success(t`MCP client enabled successfully`);

      // 启用成功后刷新前端数据（只刷新MCP数据）
      await onRefresh();
    } catch (error) {
      console.error(`Failed to enable MCP client ${client.serverName}:`, error);
      message.error(t`Failed to enable MCP client`);
    }
  };

  // 删除MCP客户端
  const deleteMcpClient = async (client: IMCPClient) => {
    try {
      // 使用新的删除方法支持 scope 参数
      await call("deleteWorkspaceMcpServerConfig", {
        serverName: client.serverName
        // scope: client.scope // 传递 scope 信息
      });
      message.success(t`MCP client deleted successfully`);

      // 删除成功后刷新前端数据（只刷新MCP数据）
      await onRefresh();
    } catch (error) {
      console.error(`Failed to delete MCP client ${client.serverName}:`, error);
      message.error(t`Failed to delete MCP client`);
    }
  };

  // 显示MCP客户端详情
  const showMcpClientDetails = (client: IMCPClient) => {
    setSelectedMcpClient(client);
    setMcpDetailDrawer(true);
  };

  // 显示工具列表模态框
  const showToolsModal = (client: IMCPClient) => {
    setSelectedClientTools(client.tools || []);
    setSelectedClientName(client.serverName);
    setToolsModalOpen(true);
  };

  // 打开工具测试模态框
  const openTestToolModal = (tool: HyperChatCompletionTool) => {
    setSelectedTool(tool);
    setTestParams(generateDefaultParams(tool.inputSchema));
    setTestResult(null);
    setTestError(null);
    setTestToolModalOpen(true);
  };

  // 生成默认参数
  const generateDefaultParams = (schema: any): string => {
    try {
      const properties = schema.properties || {};
      const defaultObj: any = {};

      for (const [key, prop] of Object.entries(properties) as [string, any][]) {
        if (prop.type === 'string') {
          defaultObj[key] = prop.enum ? prop.enum[0] : '';
        } else if (prop.type === 'number') {
          defaultObj[key] = 0;
        } else if (prop.type === 'boolean') {
          defaultObj[key] = false;
        } else if (prop.type === 'array') {
          defaultObj[key] = [];
        } else if (prop.type === 'object') {
          defaultObj[key] = {};
        }
      }

      return JSON.stringify(defaultObj, null, 2);
    } catch (error) {
      return '{}';
    }
  };

  // 验证参数
  const validateParams = (params: string, schema: any): { valid: boolean; error?: string } => {
    try {
      const parsedParams = JSON.parse(params);

      // 检查必需参数
      if (schema.required) {
        for (const requiredKey of schema.required) {
          if (!(requiredKey in parsedParams)) {
            return { valid: false, error: `${t`Missing required parameter:`} ${requiredKey}` };
          }
        }
      }

      // 检查参数类型
      if (schema.properties) {
        for (const [key, value] of Object.entries(parsedParams)) {
          const propSchema = schema.properties[key];
          if (!propSchema && schema.additionalProperties === false) {
            return { valid: false, error: `${t`Unknown parameter:`} ${key}` };
          }
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: t`Invalid JSON format` };
    }
  };

  // 执行工具测试
  const runToolTest = async () => {
    if (!selectedTool) return;

    const validation = validateParams(testParams, selectedTool.inputSchema);
    if (!validation.valid) {
      setTestError(validation.error || t`Invalid parameters`);
      return;
    }

    setTestRunning(true);
    setTestResult(null);
    setTestError(null);

    try {
      const parsedParams = JSON.parse(testParams);

      const result = await call("mcpCallToolWithWorkspace", {
        workspacePath: workspace.path,
        name: selectedTool.clientName,
        functionName: selectedTool.originalName,
        args: parsedParams
      });

      setTestResult(result);
    } catch (error: any) {
      console.error("Tool test error:", error);
      setTestError(error.message || t`Tool execution failed`);
    } finally {
      setTestRunning(false);
    }
  };

  // 配置Monaco编辑器
  const handleEditorBeforeMount = (monaco: any) => {
    monacoRef.current = monaco;
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // 当选中工具改变时，更新JSON Schema
    if (selectedTool && selectedTool.inputSchema) {
      configureMonacoSchema(monaco, selectedTool.inputSchema);
    }
  };

  // 配置Monaco的JSON Schema验证
  const configureMonacoSchema = (monaco: any, inputSchema: any) => {
    if (!monaco) return;

    // 将inputSchema转换为完整的JSON Schema
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      ...inputSchema,
      additionalProperties: inputSchema.additionalProperties !== false
    };

    // 设置诊断选项
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: "http://hyperchat/tool-params-schema.json",
        fileMatch: ["*"],
        schema: schema
      }],
      schemaValidation: "error",
      allowComments: false,
      trailingCommas: "error"
    });
  };

  // 当选中工具改变时，更新Schema
  useEffect(() => {
    if (monacoRef.current && selectedTool && selectedTool.inputSchema) {
      configureMonacoSchema(monacoRef.current, selectedTool.inputSchema);
    }
  }, [selectedTool]);

  // 过滤和排序MCP客户端
  const getFilteredMcpClients = () => {
    // 将对象转换为数组并按 scope 优先级排序
    let filteredClients = Object.values(mcpClients)
      .sort((a, b) => {
        // 首先按 scope 排序：本地（workspace）排在前面，全局（global）排在后面
        const scopeA = (a as any).scope || 'workspace';
        const scopeB = (b as any).scope || 'workspace';
        
        if (scopeA === 'workspace' && scopeB === 'global') return -1;
        if (scopeA === 'global' && scopeB === 'workspace') return 1;
        
        // 相同 scope 内按原有的 order 排序
        return a.order - b.order;
      });

    // Scope filtering removed in Agent-centered architecture

    // 按状态过滤
    if (statusFilter === "enabled") {
      filteredClients = filteredClients.filter(client => {
        const isDisabled = client.status === "disabled" || client.config?.disabled;
        return !isDisabled;
      });
    } else if (statusFilter === "disabled") {
      filteredClients = filteredClients.filter(client => {
        const isDisabled = client.status === "disabled" || client.config?.disabled;
        return isDisabled;
      });
    }

    // 按搜索文本过滤
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filteredClients = filteredClients.filter(client =>
        client.serverName.toLowerCase().includes(searchLower) ||
        client.serverName?.toLowerCase().includes(searchLower) ||
        client.config?.type?.toLowerCase().includes(searchLower)
      );
    }

    return filteredClients;
  };

  // 渲染工具列表的 Modal 内容
  const renderToolsModalContent = (tools: HyperChatCompletionTool[]) => {
    return (
      <div style={{ maxHeight: 400, overflow: 'auto' }}>
        <List
          size="small"
          dataSource={tools}
          renderItem={(tool: any) => (
            <List.Item
              actions={[
                <Button
                  key="test"
                  type="primary"
                  size="small"
                  icon={<ExperimentOutlined />}
                  onClick={() => openTestToolModal(tool)}
                >
                  {t`Test`}
                </Button>
              ]}
            >
              <List.Item.Meta
                title={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>{tool.name}</span>}
                description={
                  <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                    {tool.description || t`No description available`}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };


  return (
    <>
      <div className="p-2 overflow-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{`MCP (${getFilteredMcpClients().length}/${Object.keys(mcpClients).length})`}</span>
          <div className="flex gap-1">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setAddMcpModalOpen(true)}
              title={t`Add MCP server`}
            />
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined spin={mcpRefreshing} />}
              onClick={refreshMcpClients}
              loading={mcpRefreshing}
              title={t`Refresh MCP clients`}
            />
          </div>
        </div>

        {/* Scope filters removed in Agent-centered architecture */}

        {/* 搜索和过滤 */}
        <div className="mb-2">
          <Space.Compact style={{ width: "100%" }}>
            <Input
              size="small"
              placeholder={t`Search MCP clients...`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
              style={{ flex: 1 }}
            />
            <Select
              size="small"
              style={{ width: "40%" }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: t`All` },
                { value: "enabled", label: t`Enabled` },
                { value: "disabled", label: t`Disabled` },
              ]}
              suffixIcon={<FilterOutlined />}
            />
          </Space.Compact>
        </div>

        {getFilteredMcpClients().length > 0 ? (
          <List
            size="small"
            dataSource={getFilteredMcpClients()}
            renderItem={(client) => {

              const menuItems = [
                {
                  key: "details",
                  icon: <InfoCircleOutlined />,
                  label: t`View Details`,
                  onClick: () => showMcpClientDetails(client),
                },
                // 只有非内置的MCP客户端才能编辑
                client.mcpType !== "builtin" ? {
                  key: "edit",
                  icon: <SettingOutlined />,
                  label: t`Edit`,
                  onClick: () => editMcpServer(client),
                } : null,
                {
                  key: "restart",
                  icon: <ReloadOutlined />,
                  label: t`Restart`,
                  onClick: () => restartMcpClient(client),
                },
                {
                  type: "divider" as const
                },
                // 只有非内置的MCP客户端才能禁用/启用
                client.mcpType !== "builtin" ? (
                  client.status === "disabled" ? {
                    key: "enable",
                    icon: <PlayCircleOutlined />,
                    label: t`Enable`,
                    onClick: () => enableMcpClient(client),
                  } : {
                    key: "disable",
                    icon: <StopOutlined />,
                    label: t`Disable`,
                    onClick: () => disableMcpClient(client),
                  }
                ) : null,
                {
                  type: "divider" as const
                },
                // 只有非内置的MCP客户端才能删除
                client.mcpType !== "builtin" ? {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: t`Delete`,
                  danger: true,
                  onClick: () => {
                    const scopeWarning = (client as any).scope === 'global' 
                      ? t`Warning: Deleting a global MCP server will affect all projects using this server!`
                      : t`This will only delete the MCP server from current workspace.`;
                    
                    Modal.confirm({
                      title: t`Confirm Delete`,
                      content: (
                        <div>
                          <p>{t`Are you sure you want to delete this MCP client?`}</p>
                          <Alert 
                            message={scopeWarning}
                            type={(client as any).scope === 'global' ? 'warning' : 'info'}
                            style={{ marginTop: 8 }}
                          />
                        </div>
                      ),
                      onOk: () => deleteMcpClient(client),
                      okButtonProps: { danger: true },
                    });
                  },
                } : null,
              ].filter(item => item !== null);

              return (
                <List.Item
                  actions={[
                    <Dropdown
                      key="more"
                      menu={{ items: menuItems }}
                      trigger={['click']}
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={<MoreOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span className="text-sm">{client.serverName}</span>
                        {/* Scope 标签 */}
                        {(client as any).scope && (
                          <Tag color={(client as any).scope === "global" ? "orange" : "purple"}>
                            {(client as any).scope === "global" ? t`Global` : t`Workspace`}
                          </Tag>
                        )}
                        {client.mcpType === "builtin" ? (
                          <Tag color="blue">{t`Built-in`}</Tag>
                        ) : (
                          null
                        )}
                      </Space>
                    }
                    description={
                      <div className="text-xs">
                        <div className="text-gray-500 mb-1">
                          {client.serverName || client.serverName} - {client.config?.type || "stdio"}
                        </div>
                        <Space size="small">
                          <Tag
                            color={
                              client.status === "connected" ? "green" :
                                client.status === "disabled" ? "gray" :
                                  client.status === "disconnected" ? "orange" :
                                    client.status === "error" ? "volcano" :
                                      client.status === "connecting" ? "blue" : "default"
                            }
                          >
                            {client.status}
                          </Tag>
                          {client.tools && (
                            <Tag
                              color="cyan"
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                showToolsModal(client);
                              }}
                            >
                              {client.tools.length} {t`tools`}
                            </Tag>
                          )}
                          {client.resources && (
                            <Tag color="purple">
                              {client.resources.length} {t`resources`}
                            </Tag>
                          )}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty
            description={
              Object.keys(mcpClients).length === 0
                ? t`No MCP clients`
                : searchText.trim()
                  ? t`No matching MCP clients found`
                  : statusFilter === "enabled"
                    ? t`No enabled MCP clients`
                    : statusFilter === "disabled"
                      ? t`No disabled MCP clients`
                      : t`No MCP clients`
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>

      {/* 添加/编辑 MCP 配置模态框 */}
      <Modal
        width={600}
        title={t`Add MCP Server`}
        open={addMcpModalOpen}
        okButtonProps={{
          autoFocus: true,
          htmlType: "submit",
          loading: loadingOpenMCP,
        }}
        okText={t`Install And Run`}
        maskClosable={false}
        cancelButtonProps={{ style: { display: "none" } }}
        onCancel={() => {
          setAddMcpModalOpen(false);
          setMcpConfigResult({ data: null, error: null });
        }}
        modalRender={(dom) => (
          <Form
            initialValues={{
              type: "stdio",
            }}
            form={mcpForm}
            layout="vertical"
            name="Configure MCP"
            clearOnDestroy
            onFinish={async (values: MCPFormValues) => {
              try {
                setLoadingOpenMCP(true);

                // 检查服务名称是否已存在（新建时）
                if (values._type !== "edit") {
                  // 检查名称是否重复（简化：只在当前工作区检查）
                  const existingClients = Object.values(mcpClients).filter(x => x.serverName === values.name);
                  if (existingClients.length > 0) {
                    message.error(t`MCP Service Name already exists`);
                    return;
                  }
                } else {
                  // 编辑时，如果名称改变则删除旧服务
                  if (values._name && values.name !== values._name) {
                    // 编辑时需要传递正确的 scope 参数
                    const editingClient = Object.values(mcpClients).find(x => x.serverName === values._name);
                    const editingScope = (editingClient as any)?.scope || 'workspace';
                    
                    await call("deleteWorkspaceMcpServerConfig", {
                      serverName: values._name
                      // scope: editingScope
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
                  values.command = command?.trim() || '';
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

                // 添加MCP配置（支持全局/工作区）
                await call("setWorkspaceMcpServerConfig", {
                  serverName: values.name,
                  serverConfig: mcpServerConfig
                  // scope parameter removed in Agent-centered architecture
                });

                setMcpConfigResult({
                  data: "success",
                  error: null,
                });

                // 刷新数据
                await onRefresh();
                setAddMcpModalOpen(false);
                message.success(t`MCP server added successfully`);
              } catch (e: any) {
                setMcpConfigResult({
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

        {/* Scope selection removed in Agent-centered architecture */}

        {/* Scope display removed in Agent-centered architecture */}

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
          <Radio.Group onChange={() => { reflesh() }}>
            <Radio value="stdio">stdio</Radio>
            <Radio value="sse">sse</Radio>
            <Radio value="streamableHttp">streamableHttp</Radio>
          </Radio.Group>
        </Form.Item>

        {/* 根据服务类型显示不同的配置项 */}
        {(mcpForm.getFieldValue("type") === "sse" ||
          mcpForm.getFieldValue("type") === "streamableHttp") ? (
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
        {mcpConfigResult.data && (
          <div>
            <div>Result:</div>
            <div>{mcpConfigResult.data}</div>
          </div>
        )}
        {mcpConfigResult.error && (
          <div className="text-red-500 max-h-64 overflow-auto">
            <div>Result:</div>
            <div>{mcpConfigResult.error.toString()}</div>
          </div>
        )}
      </Modal>

      {/* MCP客户端详情抽屉 */}
      <Drawer
        title={t`MCP Client Details`}
        open={mcpDetailDrawer}
        onClose={() => {
          setMcpDetailDrawer(false);
          setSelectedMcpClient(null);
        }}
        width={600}
      >
        {selectedMcpClient && (
          <div>
            <Descriptions
              title={selectedMcpClient.serverName}
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label={t`Name`}>
                {selectedMcpClient.serverName}
              </Descriptions.Item>
              <Descriptions.Item label={t`Server Name`}>
                {selectedMcpClient.serverName || "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label={t`Status`}>
                <Tag
                  color={
                    selectedMcpClient.status === "disabled" ? "default" :
                      selectedMcpClient.status === "connected" ? "green" : "red"
                  }
                >
                  {selectedMcpClient.status === "disabled" ? t`Disabled` :
                    selectedMcpClient.status === "connected" ? t`Connected` : t`Disconnected`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t`Type`}>
                {selectedMcpClient.config?.type || "stdio"}
              </Descriptions.Item>
              <Descriptions.Item label={t`Source`}>
                <Tag color={selectedMcpClient.mcpType === "builtin" ? "blue" : "default"}>
                  {selectedMcpClient.mcpType === "builtin" ? t`Built-in` : t`Custom`}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t`Tools Count`}>
                {selectedMcpClient.tools?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Resources Count`}>
                {selectedMcpClient.resources?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label={t`Prompts Count`}>
                {selectedMcpClient.prompts?.length || 0}
              </Descriptions.Item>
            </Descriptions>

            {/* 工具列表 */}
            {selectedMcpClient.tools && selectedMcpClient.tools.length > 0 && (
              <div className="mt-4">
                <Title level={5}>{t`Available Tools`}</Title>
                <List
                  size="small"
                  bordered
                  dataSource={selectedMcpClient.tools}
                  renderItem={(tool: any) => (
                    <List.Item>
                      <List.Item.Meta
                        title={tool.name}
                        description={tool.description}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 资源列表 */}
            {selectedMcpClient.resources && selectedMcpClient.resources.length > 0 && (
              <div className="mt-4">
                <Title level={5}>{t`Available Resources`}</Title>
                <List
                  size="small"
                  bordered
                  dataSource={selectedMcpClient.resources}
                  renderItem={(resource: any) => (
                    <List.Item>
                      <List.Item.Meta
                        title={resource.name || resource.uri}
                        description={resource.description}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 配置信息 */}
            {selectedMcpClient.config && (
              <div className="mt-4">
                <Title level={5}>{t`Configuration`}</Title>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(selectedMcpClient.config, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 工具列表模态框 */}
      <Modal
        title={`${selectedClientName} - ${t`Available Tools`}`}
        open={toolsModalOpen}
        onCancel={() => {
          setToolsModalOpen(false);
          setSelectedClientTools([]);
          setSelectedClientName("");
        }}
        footer={[
          <Button key="close" onClick={() => {
            setToolsModalOpen(false);
            setSelectedClientTools([]);
            setSelectedClientName("");
          }}>
            {t`Close`}
          </Button>
        ]}
        width={600}
      >
        {selectedClientTools.length > 0 ? (
          renderToolsModalContent(selectedClientTools)
        ) : (
          <Empty description={t`No tools available`} />
        )}
      </Modal>

      {/* 工具测试模态框 */}
      <Modal

        title={selectedTool ? `${t`Test Tool`}: ${selectedTool.name}` : t`Test Tool`}
        open={testToolModalOpen}
        onCancel={() => {
          setTestToolModalOpen(false);
          setSelectedTool(null);
          setTestParams("{}");
          setTestResult(null);
          setTestError(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setTestToolModalOpen(false);
              setSelectedTool(null);
              setTestParams("{}");
              setTestResult(null);
              setTestError(null);
            }}
          >
            {t`Cancel`}
          </Button>,
          <Button
            key="run"
            type="primary"
            loading={testRunning}
            onClick={runToolTest}
          >
            {t`Run Test`}
          </Button>
        ]}
        width={800}
      >
        {selectedTool && (
          <div>
            {/* 工具描述 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>{t`Description`}: </Text>
              <Text>{selectedTool.description || t`No description available`}</Text>
            </div>

            {/* 参数输入 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>{t`Parameters`}:</Text>
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 4 }}>
                <Editor
                  height="300px"
                  defaultLanguage="json"
                  value={testParams}
                  onChange={(value) => setTestParams(value || "{}")}
                  beforeMount={handleEditorBeforeMount}
                  onMount={handleEditorMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on",
                    formatOnPaste: true,
                    formatOnType: true,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    quickSuggestions: {
                      other: true,
                      comments: false,
                      strings: true
                    },
                    parameterHints: {
                      enabled: true
                    },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnCommitCharacter: true,
                    tabCompletion: 'on',
                    wordBasedSuggestions: 'currentDocument'
                  }}
                />
              </div>
              {selectedTool.inputSchema && selectedTool.inputSchema.properties && (
                <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                  <Text strong style={{ fontSize: 12 }}>{t`Parameter Reference`}:</Text>
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(selectedTool.inputSchema.properties).map(([key, prop]: [string, any]) => (
                      <div key={key} style={{ marginBottom: 8 }}>
                        <Text code style={{ fontSize: 12 }}>{key}</Text>
                        <Text style={{ fontSize: 12, marginLeft: 8 }}>
                          ({prop.type})
                          {Array.isArray(selectedTool.inputSchema.required) &&
                            selectedTool.inputSchema.required.includes(key) &&
                            <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>{t`Required`}</Tag>
                          }
                        </Text>
                        {prop.description && (
                          <div style={{ fontSize: 11, color: '#666', marginTop: 2, marginLeft: 16 }}>
                            {prop.description}
                          </div>
                        )}
                        {prop.enum && (
                          <div style={{ fontSize: 11, color: '#666', marginTop: 2, marginLeft: 16 }}>
                            {t`Options`}: {prop.enum.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 错误信息 */}
            {testError && (
              <Alert
                message={t`Error`}
                description={testError}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 执行结果 */}
            {testResult !== null && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>{t`Result`}:</Text>
                <div style={{
                  backgroundColor: '#f5f5f5',
                  padding: 12,
                  borderRadius: 4,
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, fontSize: 12 }}>
                    {typeof testResult === 'string'
                      ? testResult
                      : JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {testRunning && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <Spin tip={t`Running tool test...`} />
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
});