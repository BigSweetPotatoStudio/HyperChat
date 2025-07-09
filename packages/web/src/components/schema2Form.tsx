import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, InputNumber, Select, Switch, Button, Space, Card, Typography, message } from 'antd';
import { Editor } from '@monaco-editor/react';
import { CodeOutlined, FormOutlined } from '@ant-design/icons';
import type { JSONSchema7 } from 'json-schema';

const { Title } = Typography;

interface Schema2FormProps {
  schema: JSONSchema7;
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
}

export const Schema2Form: React.FC<Schema2FormProps> = ({
  schema,
  value = {},
  onChange,
  disabled = false
}) => {
  const [form] = Form.useForm();
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonValue, setJsonValue] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const objectToJson = useCallback((obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return '{}';
    }
  }, []);

  const jsonToObject = useCallback((jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch (error: any) {
      throw new Error(`JSON解析错误: ${error.message}`);
    }
  }, []);

  useEffect(() => {
    setJsonValue(objectToJson(value));
  }, [value, objectToJson]);

  const validateJsonSchema = useCallback((data: any): string | null => {
    if (schema.type === 'object' && typeof data !== 'object') {
      return '数据类型不匹配，期望对象类型';
    }
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          return `缺少必需字段: ${field}`;
        }
      }
    }
    return null;
  }, [schema]);

  const handleFormChange = useCallback((_changedValues: any, allValues: any) => {
    setJsonValue(objectToJson(allValues));
    onChange?.(allValues);
  }, [onChange, objectToJson]);

  const handleJsonChange = useCallback((newValue: string = '') => {
    setJsonValue(newValue);
    setJsonError(null);
    
    try {
      const parsedData = jsonToObject(newValue);
      const validationError = validateJsonSchema(parsedData);
      
      if (validationError) {
        setJsonError(validationError);
        return;
      }
      
      form.setFieldsValue(parsedData);
      onChange?.(parsedData);
    } catch (error: any) {
      setJsonError(error.message);
    }
  }, [jsonToObject, validateJsonSchema, form, onChange]);

  const handleModeChange = useCallback((newMode: 'form' | 'json') => {
    if (newMode === 'json' && mode === 'form') {
      const formValues = form.getFieldsValue();
      setJsonValue(objectToJson(formValues));
    } else if (newMode === 'form' && mode === 'json') {
      try {
        const parsedData = jsonToObject(jsonValue);
        const validationError = validateJsonSchema(parsedData);
        
        if (validationError) {
          message.error(validationError);
          return;
        }
        
        form.setFieldsValue(parsedData);
      } catch (error: any) {
        message.error(error.message);
        return;
      }
    }
    setMode(newMode);
  }, [mode, form, jsonValue, objectToJson, jsonToObject, validateJsonSchema]);

  const renderFormItem = useCallback((fieldName: string, fieldSchema: JSONSchema7) => {
    const { type, title, description, enum: enumValues } = fieldSchema;
    
    const commonProps = {
      disabled,
      placeholder: description || `请输入${title || fieldName}`,
    };

    switch (type) {
      case 'string':
        if (enumValues && Array.isArray(enumValues)) {
          return (
            <Select {...commonProps}>
              {enumValues.map((value) => (
                <Select.Option key={String(value)} value={value}>
                  {String(value)}
                </Select.Option>
              ))}
            </Select>
          );
        }
        return <Input {...commonProps} />;
      
      case 'number':
      case 'integer':
        return <InputNumber {...commonProps} style={{ width: '100%' }} />;
      
      case 'boolean':
        return <Switch {...commonProps} />;
      
      default:
        return <Input {...commonProps} />;
    }
  }, [disabled]);

  const renderForm = useCallback(() => {
    if (!schema.properties) return null;

    return (
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        initialValues={value}
        disabled={disabled}
      >
        {Object.entries(schema.properties).map(([fieldName, fieldSchema]) => {
          const typedFieldSchema = fieldSchema as JSONSchema7;
          const isRequired = schema.required?.includes(fieldName);
          
          return (
            <Form.Item
              key={fieldName}
              name={fieldName}
              label={typedFieldSchema.title || fieldName}
              rules={[
                { required: isRequired, message: `请输入${typedFieldSchema.title || fieldName}` }
              ]}
              tooltip={typedFieldSchema.description}
            >
              {renderFormItem(fieldName, typedFieldSchema)}
            </Form.Item>
          );
        })}
      </Form>
    );
  }, [schema, form, handleFormChange, value, disabled, renderFormItem]);

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {schema.title || '配置表单'}
            </Title>
            <Button.Group size="small">
              <Button
                type={mode === 'form' ? 'primary' : 'default'}
                icon={<FormOutlined />}
                onClick={() => handleModeChange('form')}
              >
                表单模式
              </Button>
              <Button
                type={mode === 'json' ? 'primary' : 'default'}
                icon={<CodeOutlined />}
                onClick={() => handleModeChange('json')}
              >
                JSON模式
              </Button>
            </Button.Group>
          </Space>
        </div>

        {mode === 'form' ? (
          renderForm()
        ) : (
          <div>
            <Editor
              height="400px"
              language="json"
              value={jsonValue}
              onChange={handleJsonChange}
              options={{
                readOnly: disabled,
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'on',
                formatOnPaste: true,
                formatOnType: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                tabSize: 2,
                insertSpaces: true,
              }}
              theme="vs-light"
            />
            {jsonError && (
              <div style={{ marginTop: 8, color: '#ff4d4f' }}>
                ❌ {jsonError}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Schema2Form;