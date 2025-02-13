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
import { KNOWLEDGE_Resource } from "../../../../common/data";
import { SelectFile } from "../../common/selectFile";
import { t } from "../../i18n";

type Values = KNOWLEDGE_Resource;

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
        name="type"
        label="type"
        rules={[{ required: true, message: t`Please enter` }]}
      >
        <Segmented
          options={[
            { value: "markdown", label: "markdown" },
            { value: "file", label: "file" },
          ]}
          onChange={() => {
            refresh();
          }}
        />
      </Form.Item>

      {form.getFieldValue("type") == "markdown" && (
        <Form.Item<Values>
          name="markdown"
          label="markdown"
          rules={[{ required: true, message: t`Please enter` }]}
        >
          <Input.TextArea placeholder="Please enter" rows={4} />
        </Form.Item>
      )}

      {form.getFieldValue("type") == "file" && (
        <>
          <Form.Item<Values>
            name="filepath"
            label="filepath"
            rules={[{ required: true, message: t`Please select` }]}
          >
            <SelectFile
              filters={[
                {
                  name: "Doc Files",
                  extensions: ["pdf"],
                },
              ]}
            />
          </Form.Item>
          <Form.Item<Values> label="tips">
            {t`Currently, only PDF is supported, but in the future, DOC, PPT,
            audio, and image formats will be supported.`}
          </Form.Item>
        </>
      )}
    </Form>
  );
};

interface CollectionCreateFormModalProps {
  open: boolean;
  onCreate: (values: Values) => void;
  onCancel: () => void;
  initialValues: Values;
}

export const KnowledgeBaseResourceModal: React.FC<
  CollectionCreateFormModalProps
> = ({ open, onCreate, onCancel, initialValues }) => {
  const [formInstance, setFormInstance] = useState<FormInstance>();
  initialValues.type = initialValues.type || "markdown";
  const [loading, setLoading] = useState(false);
  return (
    <Modal
      width={800}
      open={open}
      title={t`KnowledgeBaseResource`}
      okButtonProps={{ autoFocus: true, loading }}
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
      <ModalForm
        initialValues={initialValues}
        onFormInstanceReady={(instance) => {
          setFormInstance(instance);
        }}
      />
    </Modal>
  );
};
