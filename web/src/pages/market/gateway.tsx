import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { Space, Button, Table, Popover, Popconfirm, Form, Modal, Input, TreeSelect, message, FormInstance } from "antd"; // 添加了Form、Modal、Input、TreeSelect等导入
import { t } from "@/src/i18n";
import { MCP_GateWay } from "../../../../common/data";
import { HeaderContext } from "../../common/context";
import { v4 as uuid } from "uuid";

export function MCPGateWayPage() {
    const { mcpClients } = useContext(HeaderContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialValues, setInitialValues] = useState<GatewayFormValues>({
        name: "",
        description: "",
        allowMCPs: [],
    });
    const [refresh, setRefresh] = useState(0);
    useEffect(() => { 
        (async () => {
            await MCP_GateWay.init();
            setRefresh((prev) => prev + 1);
        })()
    }, [])

    // 更新数据
    const handleUpdate = async () => {
        setRefresh((prev) => prev + 1);
    };

    // 创建或更新网关
    const handleCreateOrUpdateGateway = async (values: GatewayFormValues) => {
        try {
            const gatewayData = MCP_GateWay.get();

            if (values.key) {
                // 更新现有网关
                const index = gatewayData.data.findIndex(item => item.name === values.key);
                if (index !== -1) {
                    gatewayData.data[index] = {
                        name: values.name,
                        description: values.description,
                        allowMCPs: values.allowMCPs,
                    };
                }
            } else {
                // 创建新网关
                gatewayData.data.push({
                    name: values.name,
                    description: values.description,
                    allowMCPs: values.allowMCPs,
                });
            }

            await MCP_GateWay.save();
            setIsModalOpen(false);
            message.success(values.key ? t`Gateway updated successfully` : t`Gateway created successfully`);
            handleUpdate();
        } catch (error) {
            message.error(t`Operation failed: ` + error.message);
        }
    };

    // 删除网关
    const handleDelete = async (name: string) => {
        try {
            const gatewayData = MCP_GateWay.get();
            gatewayData.data = gatewayData.data.filter(item => item.name !== name);
            await MCP_GateWay.save();
            message.success(t`Gateway deleted successfully`);
            handleUpdate();
        } catch (error) {
            message.error(t`Delete failed: ` + error.message);
        }
    };

    // 编辑网关
    const handleEdit = (record) => {
        setInitialValues({
            key: record.name,
            name: record.name,
            description: record.description || "",
            allowMCPs: record.allowMCPs || [],
        });
        setIsModalOpen(true);
    };

    // 创建新网关
    const handleCreate = () => {
        setInitialValues({
            name: "",
            description: "",
            allowMCPs: [],
        });
        setIsModalOpen(true);
    };

    const columns = [
        {
            title: t`name`,
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Popover content={record.description}>
                    <span className="cursor-pointer">{text}</span>
                </Popover>
            ),
        },
        {
            title: t`operation`,
            dataIndex: "operation",
            key: "operation",
            render: (text, record) => (
                <div className="flex flex-wrap gap-2">
                    <a
                        onClick={() => handleEdit(record)}
                    >
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
    return <div>
        <div className="w-full">
            <Space>
                <Button
                    onClick={handleCreate}
                    type="primary"
                >
                    {t`Create Gateway`}
                </Button>
            </Space>
            <Table
                pagination={false}
                rowKey="name"
                dataSource={MCP_GateWay.get().data}
                columns={columns}
            />

            <GatewayModal
                open={isModalOpen}
                onCreate={handleCreateOrUpdateGateway}
                onCancel={() => setIsModalOpen(false)}
                initialValues={initialValues}
            />
        </div>
    </div>
}

// 定义表单值类型
type GatewayFormValues = {
    name: string;
    description?: string;
    allowMCPs: string[];
    key?: string;
};

// 表单组件属性
interface GatewayFormProps {
    initialValues: GatewayFormValues;
    onFormInstanceReady: (instance: FormInstance<GatewayFormValues>) => void;
}

// 表单模态框属性
interface GatewayFormModalProps {
    open: boolean;
    onCreate: (values: GatewayFormValues) => void;
    onCancel: () => void;
    initialValues: GatewayFormValues;
}

// 表单组件
const GatewayForm: React.FC<GatewayFormProps> = ({
    initialValues,
    onFormInstanceReady,
}) => {
    const [form] = Form.useForm();
    const { mcpClients } = useContext(HeaderContext);

    useEffect(() => {
        onFormInstanceReady(form);
    }, []);

    return (
        <Form form={form} name="gateway_form" initialValues={initialValues}>
            <Form.Item className="hidden" name="key" label="key">
                <Input />
            </Form.Item>
            <Form.Item
                name="name"
                label={t`name`}
                rules={[{ required: true, pattern: /^[a-zA-Z0-9]+$/, message: t`Only allow alphanumeric characters` }]}
            >
                <Input placeholder={t`Please enter name`} />
            </Form.Item>
            <Form.Item
                name="description"
                label={t`description`}
            >
                <Input.TextArea placeholder={t`Please enter description`} rows={3} />
            </Form.Item>
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
                    treeData={mcpClients?.map((x) => {
                        return {
                            title: x.name,
                            key: x.name,
                            value: x.name,
                            children: x.tools.map((t) => {
                                return {
                                    title: (
                                        <Popover title={t.function.description}>
                                            <span>{t.origin_name || t.function.name}</span>
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
        </Form>
    );
};

// 模态框组件
export const GatewayModal: React.FC<GatewayFormModalProps> = ({
    open,
    onCreate,
    onCancel,
    initialValues,
}) => {
    const [formInstance, setFormInstance] = useState<FormInstance>();
    const [loading, setLoading] = useState(false);

    return (
        <Modal
            width={800}
            open={open}
            title={initialValues.key ? t`Edit Gateway` : t`Create Gateway`}
            okButtonProps={{ autoFocus: true, loading: loading }}
            onCancel={onCancel}
            destroyOnClose
            onOk={async () => {
                try {
                    setLoading(true);
                    const values = await formInstance?.validateFields();
                    formInstance?.resetFields();
                    await onCreate(values);
                    setLoading(false);
                } catch (error) {
                    setLoading(false);
                    console.log("Failed:", error);
                }
            }}
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