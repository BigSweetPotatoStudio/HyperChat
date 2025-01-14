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
  Radio,
  Segmented,
  Select,
  Slider,
  Space,
  Tree,
  TreeDataNode,
  TreeProps,
  Typography,
  message,
} from "antd";
import React, { useContext, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

import { CloseOutlined, FormOutlined } from "@ant-design/icons";
import { getClients, InitedClient } from "../../common/mcp";
import { GPT_MODELS } from "../../common/data";

interface Values {
  label: string;
  prompt: string;

  key?: string;
  allowMCPs: string[];
  modelKey: string;
  attachedDialogueCount?: number;
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

  const [form] = Form.useForm();
  const [clients, setClients] = React.useState<InitedClient[]>([]);
  useEffect(() => {
    onFormInstanceReady(form);
    (async () => {
      getClients().then((x) => {
        setClients(x);
      });
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
        label={"Name"}
        rules={[{ required: true, message: `Please enter the name` }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="prompt"
        label="Prompt Content"
        rules={[{ required: true, message: `Please enter Prompt Content` }]}
      >
        <Input.TextArea placeholder="Please enter Prompt Content" rows={4} />
      </Form.Item>
      <Form.Item name="modelKey" label="LLM">
        <Select
          placeholder="Please select default LLM"
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
        label="MCP"
        rules={[
          { required: false, message: `Please select the allowed MCP client.` },
        ]}
      >
        <Checkbox.Group
          options={clients.map((x) => {
            return {
              label: x.name,
              value: x.name,
            };
          })}
        />
      </Form.Item>
      <Form.Item
        name="attachedDialogueCount"
        label="attachedDialogueCount"
        tooltip="Number of sent Dialogue Message attached per request"
      >
        {/* <InputNumber
          placeholder="blank means is all."
          min={0}
          style={{ width: "100%" }}
        /> */}
        <Slider defaultValue={20} max={40} />
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

  return (
    <Modal
      width={800}
      open={open}
      title={"Prompt"}
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
