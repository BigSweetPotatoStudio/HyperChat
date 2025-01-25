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
import { KNOWLEDGE_Store } from "../../../../common/data";

const models = [
  {
    label: "bge-m3(default)",
    value: "bge-m3",
  },
  {
    label: "all-MiniLM-L6-v2(mini)",
    value: "all-MiniLM-L6-v2",
  },
];
type Values = KNOWLEDGE_Store;

interface CollectionCreateFormProps {
  initialValues: Values;
  onFormInstanceReady: (instance: FormInstance<Values>) => void;
}

const ModalForm: React.FC<CollectionCreateFormProps> = ({
  initialValues,
  onFormInstanceReady,
}) => {
  const [form] = Form.useForm();
  useEffect(() => {
    onFormInstanceReady(form);
  }, []);

  const [num, setNum] = useState(0);
  const refresh = () => {
    setNum((x) => x + 1);
  };

  return (
    <Form form={form} name="form_in_modal" initialValues={initialValues}>
      <Form.Item className="hidden" name="key" label={"key"}>
        <Input />
      </Form.Item>
      <Form.Item<Values>
        name="name"
        label="name"
        rules={[{ required: true, message: `Please enter the name` }]}
      >
        <Input />
      </Form.Item>
      <Form.Item<Values>
        name="model"
        label="model"
        rules={[{ required: true, message: `Please enter the model` }]}
      >
        <Select
          placeholder="Please select model"
          options={models}
          disabled={form.getFieldValue("key")}
        />
      </Form.Item>
      <Form.Item<Values>
        name="description"
        label="description"
        rules={[{ required: true, message: `Please enter description` }]}
      >
        <Input.TextArea placeholder="Please enter description" rows={4} />
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

export const KnowledgeBaseModal: React.FC<CollectionCreateFormModalProps> = ({
  open,
  onCreate,
  onCancel,
  initialValues,
}) => {
  const [formInstance, setFormInstance] = useState<FormInstance>();

  return (
    <Modal
      width={800}
      open={open}
      title={"KnowledgeBase"}
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
