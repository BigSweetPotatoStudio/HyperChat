import {
  Button,
  Carousel,
  Checkbox,
  Form,
  FormInstance,
  FormProps,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Popover,
  Radio,
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  Tooltip,
  Tree,
  TreeDataNode,
  TreeProps,
  TreeSelect,
  Typography,
  message,
} from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import { CloseOutlined, FormOutlined, SearchOutlined, SmileOutlined } from "@ant-design/icons";
import { InitedClient } from "../../common/mcp";
import { GPT_MODELS } from "../../../../common/data";
import { t } from "../../i18n";
import { NumberStep } from "../../common/numberStep";
import EmojiPicker from 'emoji-picker-react';
import { HeaderContext } from "../../common/context";
interface Values {
  label: string;
  prompt: string;
  callable: boolean;
  key?: string;
  allowMCPs: string[];
  modelKey: string;
  attachedDialogueCount?: number;
  confirm_call_tool: boolean;
}

interface CollectionCreateFormProps {
  initialValues: Values;
  onFormInstanceReady: (instance: FormInstance<Values>) => void;
}

const ModalForm: React.FC<CollectionCreateFormProps> = ({
  initialValues,
  onFormInstanceReady,
}) => {
  const [num, setNum] = useState(0);
  const refresh = () => {
    setNum((x) => x + 1);
  };
  const { mcpClients } = useContext(HeaderContext);
  const [form] = Form.useForm();

  useEffect(() => {
    onFormInstanceReady(form);
    (async () => {

      GPT_MODELS.init().then(() => {
        refresh();
      });
    })();
  }, []);

  return (
    <Form form={form} name="form_in_modal" initialValues={initialValues}>
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
        <Input.TextArea placeholder="Please enter System Prompt" rows={4} />
      </Form.Item>
      <Form.Item name="modelKey" label={t`LLM`}>
        <Select
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
      <Form.Item name="callable" label={t`Callable`} valuePropName="checked">
        <Checkbox
        // onChange={() => {
        //   form.setFieldValue(
        //     "allowMCPs",
        //     (form.getFieldValue("allowMCPs") || []).filter(
        //       (x) => x != "hyper_agent",
        //     ),
        //   );
        //   refresh();
        // }}
        >
          {t`Allowed to be called by 'hyper_agent'`}
        </Checkbox>
      </Form.Item>
      <Form.Item name="description" label={t`description`}>
        <Input.TextArea
          placeholder={t`Please provide a description for more accurate call.`}
          rows={2}
        />
      </Form.Item>
    </Form>
  );
};

interface CollectionCreateFormModalProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
  initialValues: Values;
}

export const PromptsModal: React.FC<CollectionCreateFormModalProps> = ({
  open,
  onCreate,
  onCancel,
  initialValues,
}) => {
  const [formInstance, setFormInstance] = useState<FormInstance>();
  initialValues.allowMCPs = initialValues.allowMCPs || [];
  initialValues.confirm_call_tool =
    initialValues.confirm_call_tool == undefined
      ? false
      : initialValues.confirm_call_tool;
  initialValues.callable =
    initialValues.callable == undefined ? true : initialValues.callable;
  return (
    <Modal
      width={800}
      open={open}
      title={`Agent`}
      okButtonProps={{ autoFocus: true }}
      onCancel={onCancel}
      destroyOnClose
      onOk={async () => {
        try {
          const values = await formInstance?.validateFields();
          formInstance?.resetFields();
          onCreate(values);
        } catch (error) {
          console.log("Failed:", error);
        }
      }}
    >
      <ModalForm
        initialValues={initialValues}
        onFormInstanceReady={(instance) => {
          setFormInstance(instance);
        }}
      />
    </Modal>
  );
};
