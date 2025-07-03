import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { 
    Space, 
    Button, 
    Table, 
    Popover, 
    Popconfirm, 
    Form, 
    Modal, 
    Input, 
    TreeSelect, 
    message, 
    FormInstance 
} from "antd";
import { t } from "@/src/i18n";
import { LocalSetting, MCP_GateWay } from "@hyperchat/shared/data.mjs";
import { HeaderContext } from "../../common/context";
import { v4 as uuid } from "uuid";
import { call } from "@/src/common/call";
import { setClipboardText } from "@/src/common/util";
import { CopyOutlined } from "@ant-design/icons";

/**
 * MCP Gateway 网关数据类型
 */
interface MCPGatewayData {
    /** 网关名称 */
    name: string;
    /** 网关描述 */
    description?: string;
    /** 允许的 MCP 服务列表 */
    allowMCPs: string[];
}

/**
 * 网关配置信息类型
 */
interface GatewayConfig {
    /** 服务端口 */
    port: number;
    /** 访问密码 */
    password: string;
}

/**
 * 网关 URL 配置类型
 */
interface GatewayUrls {
    /** SSE 连接地址 */
    sse: string;
    /** HTTP 流式连接地址 */
    streamableHttp: string;
}

/**
 * MCP Gateway 管理页面组件
 * 
 * 该组件用于管理 MCP (Model Context Protocol) 网关，提供以下功能：
 * - 显示所有已创建的网关列表
 * - 创建新的网关配置
 * - 编辑现有网关配置
 * - 删除网关配置
 * - 复制网关访问地址
 * 
 * @returns JSX.Element MCP Gateway 管理页面
 */
export function MCPGateWayPage(): JSX.Element {
    // 获取 MCP 客户端列表上下文
    const context = useContext(HeaderContext);
    const { mcpClients } = context || {};
    
    // 控制模态框显示状态
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    
    // 表单初始值状态
    const [initialValues, setInitialValues] = useState<GatewayFormValues>({
        name: "",
        description: "",
        allowMCPs: [],
    });
    
    // 用于触发组件刷新的状态
    const [refresh, setRefresh] = useState<number>(0);

    /**
     * 组件初始化时加载网关数据
     */
    useEffect(() => {
        (async () => {
            await MCP_GateWay.init();
            setRefresh((prev) => prev + 1);
        })()
    }, [])

    /**
     * 手动触发数据更新
     */
    const handleUpdate = async (): Promise<void> => {
        setRefresh((prev) => prev + 1);
    };

    /**
     * 创建或更新网关配置
     * 
     * @param values - 网关表单数据
     */
    const handleCreateOrUpdateGateway = async (values: GatewayFormValues): Promise<void> => {
        try {
            const gatewayData = MCP_GateWay.get();

            if (values.key) {
                // 更新现有网关
                const index = gatewayData.data.findIndex((item: MCPGatewayData) => item.name === values.key);
                if (index !== -1) {
                    gatewayData.data[index] = {
                        name: values.name,
                        ...(values.description !== undefined && { description: values.description }),
                        allowMCPs: values.allowMCPs,
                    };
                }
            } else {
                // 创建新网关
                gatewayData.data.push({
                    name: values.name,
                    ...(values.description !== undefined && { description: values.description }),
                    allowMCPs: values.allowMCPs,
                });
            }

            // 保存数据并刷新路由
            await MCP_GateWay.save();
            await call("refreshMcpRoutes");
            
            setIsModalOpen(false);
            message.success(values.key ? t`Gateway updated successfully` : t`Gateway created successfully`);
            handleUpdate();
        } catch (error: any) {
            message.error(t`Operation failed: ` + error.message);
        }
    };

    /**
     * 删除指定网关
     * 
     * @param name - 要删除的网关名称
     */
    const handleDelete = async (name: string): Promise<void> => {
        try {
            const gatewayData = MCP_GateWay.get();
            gatewayData.data = gatewayData.data.filter((item: MCPGatewayData) => item.name !== name);
            await MCP_GateWay.save();
            message.success(t`Gateway deleted successfully`);
            handleUpdate();
        } catch (error: any) {
            message.error(t`Delete failed: ` + error.message);
        }
    };

    /**
     * 打开编辑网关模态框
     * 
     * @param record - 要编辑的网关记录
     */
    const handleEdit = (record: MCPGatewayData): void => {
        setInitialValues({
            key: record.name,
            name: record.name,
            description: record.description || "",
            allowMCPs: record.allowMCPs || [],
        });
        setIsModalOpen(true);
    };

    /**
     * 打开创建新网关模态框
     */
    const handleCreate = (): void => {
        setInitialValues({
            name: "",
            description: "",
            allowMCPs: [],
        });
        setIsModalOpen(true);
    };

    /**
     * 表格列配置
     */
    const columns = [
        {
            title: t`name`,
            dataIndex: "name",
            key: "name",
            render: (text: string, record: MCPGatewayData) => (
                <Popover content={record.description}>
                    <span className="cursor-pointer">{text}</span>
                </Popover>
            ),
        },
        {
            title: t`operation`,
            dataIndex: "operation",
            key: "operation",
            render: (text: string, record: MCPGatewayData) => (
                <div className="flex flex-wrap gap-2">
                    <a onClick={() => handleEdit(record)}>
                        {t`Edit`}
                    </a>
                    <Popconfirm
                        title={t`Sure to delete?`}
                        onConfirm={() => handleDelete(record.name)}
                    >
                        <a>{t`Delete`}</a>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div>
            <div className="w-full">
                {/* 操作按钮区域 */}
                <Space>
                    <Button onClick={handleCreate} type="primary">
                        {t`Create Gateway`}
                    </Button>
                </Space>
                
                {/* 网关列表表格 */}
                <Table
                    pagination={false}
                    rowKey="name"
                    dataSource={MCP_GateWay.get().data}
                    columns={columns}
                />

                {/* 创建/编辑网关模态框 */}
                <GatewayModal
                    open={isModalOpen}
                    onCreate={handleCreateOrUpdateGateway}
                    onCancel={() => setIsModalOpen(false)}
                    initialValues={initialValues}
                />
            </div>
        </div>
    );
}

/**
 * 网关表单值类型
 */
type GatewayFormValues = {
    /** 网关名称 */
    name: string;
    /** 网关描述（可选） */
    description?: string;
    /** 允许的 MCP 服务列表 */
    allowMCPs: string[];
    /** 用于编辑时标识的键值（可选） */
    key?: string;
};

/**
 * 网关表单组件属性类型
 */
interface GatewayFormProps {
    /** 表单初始值 */
    initialValues: GatewayFormValues;
    /** 表单实例准备就绪时的回调 */
    onFormInstanceReady: (instance: FormInstance<GatewayFormValues>) => void;
}

/**
 * 网关表单模态框属性类型
 */
interface GatewayFormModalProps {
    /** 模态框是否打开 */
    open: boolean;
    /** 创建/更新网关的回调函数 */
    onCreate: (values: GatewayFormValues) => void;
    /** 取消操作的回调函数 */
    onCancel: () => void;
    /** 表单初始值 */
    initialValues: GatewayFormValues;
}

/**
 * 网关表单组件
 * 
 * 用于创建和编辑 MCP 网关配置的表单组件，包含：
 * - 网关名称输入（仅允许字母数字）
 * - 网关描述输入
 * - MCP 服务选择（支持多选和树形结构）
 * - 生成的访问地址展示和复制功能
 * 
 * @param props - 组件属性
 * @returns JSX.Element 网关表单组件
 */
const GatewayForm: React.FC<GatewayFormProps> = ({
    initialValues,
    onFormInstanceReady,
}) => {
    // 组件刷新状态
    const [refresh, setRefresh] = useState<number>(0);
    // Ant Design 表单实例
    const [form] = Form.useForm<GatewayFormValues>();
    // MCP 客户端列表上下文
    const context = useContext(HeaderContext);
    const { mcpClients } = context || {};
    // 当前网关名称
    const [name, setName] = useState<string>(initialValues.name || "");
    // 配置信息引用
    let config = useRef<GatewayConfig>({
        port: 0,
        password: "",
    });

    /**
     * 获取服务器配置信息
     */
    useEffect(() => {
        (async () => {
            const c = await call("getConfig");
            config.current.port = c.port;
            config.current.password = c.password;
            setRefresh((prev) => prev + 1);
        })()
    }, []);

    /**
     * 注册表单实例
     */
    useEffect(() => {
        onFormInstanceReady(form);
    }, []);

    /**
     * 生成网关访问地址
     */
    let urls: GatewayUrls = ({
        sse: `${location.protocol}//${location.hostname}:${config.current.port}/${config.current.password}/mcp/${name}/sse`,
        streamableHttp: `${location.protocol}//${location.hostname}:${config.current.port}/${config.current.password}/mcp/${name}/mcp`,
    });

    /**
     * 复制文本到剪贴板并显示成功消息
     * 
     * @param text - 要复制的文本
     */
    const handleCopyToClipboard = async (text: string): Promise<void> => {
        await setClipboardText({ text });
        message.success(t`Copied to clipboard`);
    };

    return (
        <Form form={form} name="gateway_form" initialValues={initialValues}>
            {/* 隐藏的编辑标识字段 */}
            <Form.Item className="hidden" name="key" label="key">
                <Input />
            </Form.Item>
            
            {/* 网关名称输入 */}
            <Form.Item
                name="name"
                label={t`name`}
                rules={[{ 
                    required: true, 
                    pattern: /^[a-zA-Z0-9]+$/, 
                    message: t`Only allow alphanumeric characters` 
                }]}
            >
                <Input 
                    placeholder={t`Please enter name`} 
                    onChange={(e) => setName(e.target.value)} 
                />
            </Form.Item>
            
            {/* 网关描述输入 */}
            <Form.Item name="description" label={t`description`}>
                <Input.TextArea 
                    placeholder={t`Please enter description`} 
                    rows={3} 
                />
            </Form.Item>
            
            {/* MCP 服务选择 */}
            <Form.Item
                name="allowMCPs"
                label={t`allowMCPs`}
                rules={[{ required: true, message: t`Please select allowed MCP` }]}
            >
                <TreeSelect
                    multiple
                    treeCheckable
                    placeholder={t`Please select allowed MCP`}
                    showCheckedStrategy={TreeSelect.SHOW_PARENT}
                    treeData={mcpClients?.filter(x => x.status != "disabled")?.map((x) => {
                        return {
                            title: x.name,
                            key: x.name,
                            value: x.name,
                            children: x.tools.map((t) => {
                                return {
                                    title: (
                                        <Popover title={t.description}>
                                            <span>{t.origin_name || t.name}</span>
                                        </Popover>
                                    ),
                                    key: t.restore_name,
                                    value: t.restore_name,
                                };
                            }),
                        };
                    }) || []}
                />
            </Form.Item>
            
            {/* SSE 连接地址展示和复制 */}
            <Form.Item label="sse">
                <Input 
                    disabled 
                    value={urls.sse} 
                    addonAfter={
                        <CopyOutlined 
                            onClick={() => handleCopyToClipboard(urls.sse)} 
                        />
                    } 
                />
            </Form.Item>
            
            {/* HTTP 流式连接地址展示和复制 */}
            <Form.Item label="streamableHttp">
                <Input 
                    disabled 
                    value={urls.streamableHttp} 
                    addonAfter={
                        <CopyOutlined 
                            onClick={() => handleCopyToClipboard(urls.streamableHttp)} 
                        />
                    } 
                />
            </Form.Item>
        </Form>
    );
};

/**
 * 网关模态框组件
 * 
 * 用于创建和编辑网关的模态框组件，包含：
 * - 模态框的打开/关闭控制
 * - 表单验证和提交处理
 * - 加载状态管理
 * 
 * @param props - 组件属性
 * @returns JSX.Element 网关模态框组件
 */
export const GatewayModal: React.FC<GatewayFormModalProps> = ({
    open,
    onCreate,
    onCancel,
    initialValues,
}) => {
    // 表单实例状态
    const [formInstance, setFormInstance] = useState<FormInstance<GatewayFormValues>>();
    // 加载状态
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * 处理表单提交
     */
    const handleSubmit = async (): Promise<void> => {
        try {
            setLoading(true);
            const values = await formInstance?.validateFields();
            formInstance?.resetFields();
            if (values) {
                await onCreate(values);
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.log("Failed:", error);
        }
    };

    return (
        <Modal
            width={800}
            open={open}
            title={initialValues.key ? t`Edit Gateway` : t`Create Gateway`}
            okButtonProps={{ autoFocus: true, loading: loading }}
            onCancel={onCancel}
            destroyOnClose
            onOk={handleSubmit}
        >
            <GatewayForm
                initialValues={initialValues}
                onFormInstanceReady={(instance) => {
                    setFormInstance(instance);
                }}
            />
        </Modal>
    );
};