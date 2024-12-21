import {
  Button,
  Carousel,
  Form,
  FormInstance,
  FormProps,
  Input,
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

interface Values {
  label: string;
  prompt: string;

  key?: string;
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

  useEffect(() => {
    onFormInstanceReady(form);
    (async () => {})();
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
