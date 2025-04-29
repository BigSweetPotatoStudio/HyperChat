import React, { useContext, useEffect, useState } from "react";
import { Editor } from "../../components/editor";
import { DndContext, PointerSensor, useSensor } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { AgentData, Agents, GPT_MODELS } from "../../../../common/data";
import { SortableItem } from "../chat/sortableItem";
import { Button, Card, Checkbox, Collapse, Divider, Form, Input, Popover, Radio, Select, Tabs, Tag, Tooltip, TreeSelect } from "antd";
import { DeleteOutlined, EditOutlined, FunctionOutlined, SettingFilled, SmileOutlined, SwapOutlined } from "@ant-design/icons";
import { Icon } from "../../components/icon";
import { t } from "../../i18n";
import { Link } from "react-router-dom";
import { getFirstCharacter } from "../../common";
import { NumberStep } from "../../common/numberStep";
import EmojiPicker from "emoji-picker-react";
import { HeaderContext } from "../../common/context";
import { v4 } from "uuid";
import { call } from "../../common/call";

export const AgentCreatePage = () => {
    const [num, setNum] = React.useState(0);
    const refresh = () => {
        setNum((n) => n + 1);
    };
    const { mcpClients } = useContext(HeaderContext);
    const [form] = Form.useForm();



    useEffect(() => {
        (async () => {
            await Promise.all([
                GPT_MODELS.init(),
                Agents.init(),
            ]);
            Agents.get().data = Agents.get().data.filter(x => x.type != "builtin");
            refresh();
        })();
    }, []);


    return <div className="h-full w-full">
        <Button type="primary" onClick={() => history.back()}>{t`Bcak`}</Button>
        <div className="mt-1 h-full w-full overflow-auto">
            <div style={{ width: 500 }}>
                <Form form={form} name="form_in_modal" initialValues={{}}
                    onFinishFailed={(e) => {
                        console.error(e);
                    }}
                    onFinish={async (value) => {
                        if (value.key) {
                            const index = Agents.get().data.findIndex(
                                (y) => y.key == value.key,
                            );
                            if (index !== -1) {
                                Agents.get().data[index] = value as any;
                            }
                        } else {
                            Agents.get().data.push({
                                ...value,
                                key: v4(),
                                allowMCPs: value.allowMCPs || [],
                            });
                        }
                        await Agents.save();
                        // 修改更新agents状态
                        await call("openMcpClient", ["hyper_agent"]);
                        refresh();
                        history.back();
    
                    }}>
                    <Form.Item className="hidden" name="key" label={"key"}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="label"
                        label={t`Name`}
                        rules={[{ required: true, message: `Please enter the name` }]}
                    >
                        <Input addonBefore={<Popover destroyTooltipOnHide={false} trigger="click" title={t`please select emoji!`} content={<EmojiPicker onEmojiClick={(emoji) =>
                            form.setFieldValue("label", emoji.emoji + form.getFieldValue("label"))
                        } />}><SmileOutlined className=" cursor-pointer" /></Popover>} />
                    </Form.Item>
                    <Form.Item
                        name="prompt"
                        label={t`System Prompt`}
                        rules={[{ required: true, message: `Please enter System Prompt` }]}
                    >
                        {/* <Input.TextArea placeholder="Please enter System Prompt" rows={4} /> */}
                        <Editor style={{ height: "150px" }} />
                    </Form.Item>
                    <Form.Item name="modelKey" label={t`LLM`}>
                        <Select
                            showSearch
                            mode="tags"
                            optionFilterProp="label"
                            placeholder={t`Please select default LLM`}
                            allowClear
                            options={GPT_MODELS.get().data.map((x) => {
                                return {
                                    label: x.name,
                                    value: x.key,
                                };
                            })}
                        />
                    </Form.Item>
                    <Form.Item
                        name="allowMCPs"
                        label={t`allowMCPs`}
                        rules={[
                            { required: false, message: t`Please select allowed MCP` },
                        ]}
                    >
                        <TreeSelect
                            multiple
                            treeCheckable
                            placeholder={t`Please select allowed MCP`}
                            showCheckedStrategy={TreeSelect.SHOW_PARENT}
                            treeData={mcpClients.map((x) => {
                                return {
                                    title: x.name,
                                    key: x.name,
                                    value: x.name,
                                    children: x.tools.map((t) => {
                                        return {
                                            title: (
                                                <Tooltip title={t.function.description}>
                                                    <span>{t.origin_name || t.function.name}</span>
                                                </Tooltip>
                                            ),
                                            key: t.restore_name,
                                            value: t.restore_name,
                                        };
                                    }),
                                };
                            })}
                        />
                    </Form.Item>
                    <Form.Item name="subAgents" label={t`subAgents`}>
                        <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder={t`subAgents`}
                            allowClear
                            mode="tags"
                            options={Agents.get().data.map((x) => {
                                return {
                                    label: x.label,
                                    value: x.key,
                                };
                            })}
                        />
                    </Form.Item>
                    <Form.Item
                        name="temperature"
                        label={t`temperature`}
                        tooltip={t`What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.`}
                    >
                        <NumberStep defaultValue={1} min={0} max={2} step={0.1} />
                    </Form.Item>
                    <Form.Item
                        name="attachedDialogueCount"
                        label={t`attachedDialogueCount`}
                        tooltip={t`Number of sent Dialogue Message attached per request`}
                    >
                        <NumberStep defaultValue={10} max={20} />
                    </Form.Item>
                    <Form.Item
                        name="confirm_call_tool"
                        label={t`callToolType`}
                        tooltip={t`Do you want to confirm calling the tool?`}
                    >
                        <Radio.Group>
                            <Radio value={true}>{t`Need Confirm`}</Radio>
                            <Radio value={false}>{t`Direct Call`}</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item name="description" label={t`description`}>
                        <Input.TextArea
                            placeholder={t`Please provide a description for more accurate call.`}
                            rows={2}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button htmlType="submit">{t`Submit`}</Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    </div>
};
