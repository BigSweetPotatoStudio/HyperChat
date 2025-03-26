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
import { GPT_MODELS, KNOWLEDGE_Store } from "../../../../common/data";

import { t } from "../../i18n";

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
        label={t`name`}
        rules={[{ required: true, message: t`Please enter` }]}
      >
        <Input placeholder={t`Please enter`} />
      </Form.Item>

      <Form.Item<Values>
        name="model"
        label={t`model`}
        rules={[{ required: true, message: t`Please enter` }]}
      >
        <Select
          placeholder={t`Please select`}
          options={GPT_MODELS.get()
            .data.filter((x) => x.type == "embedding")
            .map((x) => {
              return {
                label: x.name,
                value: x.key,
              };
            })}
          disabled={form.getFieldValue("key")}
        />
      </Form.Item>
      <Form.Item<Values>
        name="description"
        label={t`description`}
        rules={[{ required: true, message: t`Please enter` }]}
      >
        <Input.TextArea placeholder={t`Please enter`} rows={4} />
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
      title={t`KnowledgeBase`}
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
