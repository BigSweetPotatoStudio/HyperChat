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
import { Agents, KNOWLEDGE_Store, Task } from "../../../../common/data";
import { t } from "../../i18n";

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
type Values = Task;

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
  useEffect(() => {
    (async()=>{
        await Agents.init();
        refresh();
    })()
  }, []);

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
        name="agentKey"
        label={t`Agent`}
        rules={[{ required: true, message: t`Please select` }]}
      >
        <Select placeholder={t`Please select`}>
          {Agents.get().data.map((x) => (
            <Select.Option key={x.key} value={x.key}>
              {x.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item<Values>
        name="command"
        label={t`message`}
        rules={[{ required: true, message: t`Please enter` }]}
      >
        <Input.TextArea placeholder={t`Please enter`} rows={4}/>
      </Form.Item>
      <Form.Item<Values>
        name="cron"
        label={t`cronExpression`}
        rules={[{ required: true, message: t`Please enter` }]}
      >
        <Input placeholder={t`Please enter, e.g., "0 * * * *"`} />
      </Form.Item>

      {/* <Form.Item<Values>
        name="description"
        label={t`description`}
      >
        <Input.TextArea placeholder={t`Please enter`} rows={2} />
      </Form.Item> */}
    </Form>
  );
};

interface CollectionCreateFormModalProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
  initialValues: Values;
}

export const NewTaskModal: React.FC<CollectionCreateFormModalProps> = ({
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
      title={t`Task`}
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
