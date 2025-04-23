import React, { useEffect } from "react";
import { Editor } from "../../components/editor";
import { Button, Form, Input, Modal, Radio, Select, Table } from "antd";
import { VarScopeList, Var, VarList, zodVarScope } from "../../../../common/data";
import { EditIcon } from "lucide-react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { t } from "../../i18n";
import {
    JsonSchema2FormItemOrNull,
} from "../../common/util";
import { zodToJsonSchema } from "zod-to-json-schema"
import { v4 } from "uuid";
import { Popconfirm } from "antd/lib";
export const VariableList = () => {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const [scope, setScope] = React.useState({
        name: undefined,
        key: undefined
    });
    useEffect(() => {
        (async () => {
            await VarScopeList.init();
            await VarList.init();
            refresh();
        })()
    }, []);

    const [isScopeOpen, setIsScopeOpen] = React.useState(false);
    const [scopeForm] = Form.useForm();

    const [isVariableOpen, setIsVariableOpen] = React.useState(false);
    const [variableForm] = Form.useForm();




    return <div className="overflow-auto h-full"><div className="flex">
        <div className="w-full lg:w-1/4">
            {/*  <Radio.Group

            onChange={(e) => {
                setScope(e.target.value);
            }}
            value={scope}
            options={VarScopeList.get().data.map(x => {
                return {
                    ...x,
                    label: <span>{x.label} <EditIcon /></span>
                }
            })}
        /> */}
            <Table
                size="small"
                rowKey={"key"}
                title={() => {
                    return <div className="flex gap-1">
                        <Button size="small" onClick={() => {
                            setScope({
                                name: undefined,
                                key: undefined
                            });
                        }}>{t`Clear Select`}</Button>
                        <Button size="small" onClick={() => {
                            scopeForm.resetFields();
                            scopeForm.setFieldsValue({
                                name: undefined
                            });
                            setIsScopeOpen(true);
                        }}>{t`Add`}</Button>
                    </div>
                }}

                rowSelection={{
                    type: "radio", selectedRowKeys: [scope.key], onChange: (selectedRowKeys) => {
                        setScope(
                            (VarScopeList.get().data.find(x => x.key == selectedRowKeys[0]) || {}) as any
                        );
                    }
                }}
                columns={[
                    {
                        title: 'scope',
                        dataIndex: 'name',
                        render: (text, record) => {
                            return <span>{text}{" "}<EditOutlined onClick={() => {
                                scopeForm.resetFields();
                                scopeForm.setFieldsValue({
                                    ...record,
                                });
                                setIsScopeOpen(true);
                            }} />{" "}<Popconfirm title={<pre>{t`Are you sure to delete this scope?
Including variables will also be deleted`}</pre>} onConfirm={async () => {

                                    VarScopeList.get().data = VarScopeList.get().data.filter(x => x.key !== record.key);
                                    VarList.get().data = VarList.get().data.filter(x => x.scope !== record.name);
                                    await VarScopeList.save();
                                    await VarList.save();
                                    refresh();
                                }}>
                                    <DeleteOutlined />

                                </Popconfirm>
                            </span>
                        }
                    },
                ]}
                pagination={false}
                dataSource={VarScopeList.get().data}
            />
        </div>
        <div className="w-full lg:w-3/4">
            <Table
                size="small"
                rowKey={"key"}
                title={() => {
                    return <div className="flex gap-1">
                        <Button size="small" onClick={() => {
                            variableForm.resetFields();
                            variableForm.setFieldsValue({
                                scope: VarScopeList.get().data[0]?.name,
                                type: "variable",
                                variableType: "string"
                            });
                            setIsVariableOpen(true);
                        }}>{t`Add`}</Button>
                    </div>
                }}

                columns={[
                    {
                        title: 'name',
                        dataIndex: 'name',
                        width: 200,
                        render: (text, record) => {
                            return <div><span className="line-clamp-1">{text}</span><EditOutlined onClick={() => {
                                variableForm.resetFields();
                                variableForm.setFieldsValue({
                                    ...record,
                                });
                                setIsVariableOpen(true);
                            }} />{" "}<Popconfirm title={t`are you sure to delete this variable?`} onConfirm={async () => {

                                VarList.get().data = VarList.get().data.filter(x => x.key !== record.key);

                                await VarList.save();
                                refresh();
                            }}>
                                    <DeleteOutlined />

                                </Popconfirm></div>
                        }
                    },
                    {
                        title: 'value',
                        dataIndex: 'value',
                        render: (text, record) => {
                            return <span className="line-clamp-2">{text || "code"}</span>
                        }
                    },
                    {
                        title: 'scope',
                        dataIndex: 'scope',
                        render: (text, record) => {
                            return <span className="line-clamp-1">{text}</span>
                        }
                    },

                ]}
                pagination={false}
                dataSource={VarList.get().data.filter(x => {
                    if (scope?.name == null) {
                        return true;
                    } else {
                        return x.scope == scope.name;
                    }
                })}
            />
        </div>
    </div>
        <Modal
            title={t`Scope`}
            open={isScopeOpen}
            footer={[]}
            onCancel={() => setIsScopeOpen(false)}
            forceRender={true}
            width={"80%"}
            zIndex={2000}
        >
            <Form
                form={scopeForm}
                onFinish={async (values) => {
                    if (values.key) {
                        let find = VarScopeList.get().data.find(x => x.key === values.key);
                        if (find) {
                            VarList.get().data.filter(x => x.scope == find.name).forEach(x => {
                                x.scope = values.name;
                            });
                            find.name = values.name;
                            await VarScopeList.save();
                            await VarList.save();
                        }

                    } else {
                        VarScopeList.get().data.push({ key: v4(), name: values.name });
                        await VarScopeList.save();
                    }
                    setIsScopeOpen(false);
                }}
            >
                <Form.Item className="hidden" name="key" label={"key"}>
                    <Input />
                </Form.Item>
                <Form.Item
                    name="name"
                    label={t`Name`}
                    rules={[{ required: true, message: `Please enter the name`, pattern: /^[a-zA-Z0-9]+$/ }]}
                >
                    <Input placeholder="Please enter the name" />
                </Form.Item>
                <Form.Item className="flex justify-end">
                    <Button htmlType="submit">{t`Submit`}</Button>
                </Form.Item>
            </Form>

        </Modal>

        <Modal
            title={t`Variable`}
            open={isVariableOpen}
            footer={[]}
            onCancel={() => setIsVariableOpen(false)}
            forceRender={true}
            width={"80%"}
            zIndex={2000}
        >
            <Form
                form={variableForm}
                onFinish={async (values) => {
                    if (values.key) {
                        let findIndex = VarList.get().data.findIndex(x => x.key === values.key);
                        if (findIndex !== -1) {
                            VarList.get().data[findIndex] = values;
                            await VarList.save();
                        }

                    } else {
                        VarList.get().data.push({ ...values, key: v4() });
                        await VarList.save();
                    }
                    setIsVariableOpen(false);
                }}
            >
                <Form.Item className="hidden" name="key" label={"key"}>
                    <Input />
                </Form.Item>

                <Form.Item
                    name="name"
                    label={t`Name`}
                    rules={[{ required: true, message: `Please enter the name` }]}
                >
                    <Input placeholder="Please enter the name" />
                </Form.Item>
                <Form.Item
                    name="variableType"
                    label={t`variableType`}
                    rules={[{ required: true, message: `Please enter` }]}
                >
                    <Select onChange={() => {
                        refresh();
                    }} options={["string", "js", "webjs"].map(item => ({ value: item, label: item }))} />
                </Form.Item>

                {variableForm.getFieldValue("variableType") != "string" && <Form.Item
                    name="code"
                    label={t`Code`}
                    rules={[{ required: true, message: `Please enter` }]}
                >
                    <Input.TextArea placeholder="Please enter" rows={4} />
                </Form.Item>}
                {variableForm.getFieldValue("variableType") == "string" && <Form.Item
                    name="value"
                    label={t`Value`}
                    rules={[{ required: true, message: `Please enter` }]}
                >
                    <Input.TextArea placeholder="Please enter" />
                </Form.Item>}
                <Form.Item
                    name="scope"
                    label={t`Scope`}
                    rules={[{ required: true, message: `Please enter` }]}
                >
                    <Select options={VarScopeList.get().data.map(item => ({ value: item.name, label: item.name }))} />
                </Form.Item>
                <Form.Item
                    name="type"
                    label={t`Type`}
                    rules={[{ required: true, message: `Please enter` }]}
                >
                    <Select onChange={() => {
                        refresh();
                    }} options={["variable", "quick"].map(item => ({ value: item, label: item }))} />
                </Form.Item>

                <Form.Item className="flex justify-end">
                    <Button htmlType="submit">{t`Submit`}</Button>
                </Form.Item>
            </Form>

        </Modal>
    </div>
};

