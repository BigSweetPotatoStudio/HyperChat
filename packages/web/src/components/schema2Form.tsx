import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Space, Card, Typography, message } from 'antd';
import { Editor } from '@monaco-editor/react';
import { CodeOutlined, FormOutlined } from '@ant-design/icons';
import type { JSONSchema7,JSONSchema7Definition } from 'json-schema';
import Schema2FormItems from './Schema2FormItems';

const { Title } = Typography;

interface Schema2FormProps {
  schema: JSONSchema7;
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
}

// 根据 schema 生成默认值的辅助函数
const generateDefaultValue = (schema: JSONSchema7): unknown => {
  if (schema.default !== undefined) {
    return schema.default;
  }
  
  switch (schema.type) {
    case 'object':
      if (schema.properties) {
        const defaultObj: Record<string, unknown> = {};
        Object.entries(schema.properties).forEach(([key, propSchema]) => {
          if (typeof propSchema !== 'boolean') {
            defaultObj[key] = generateDefaultValue(propSchema);
          }
        });
        return defaultObj;
      }
      return {};
    case 'array':
      return [];
    case 'string':
      return '';
    case 'number':
    case 'integer':
      return 0;
    case 'boolean':
      return false;
    default:
      return undefined;
  }
};

// 深度合并对象的辅助函数
const deepMerge = (target: unknown, source: unknown): unknown => {
  if (Array.isArray(source)) {
    return source;
  }
  
  if (source && typeof source === 'object' && target && typeof target === 'object') {
    const result = { ...target };
    Object.keys(source).forEach(key => {
      if ((source as any)[key] !== undefined) {
        (result as any)[key] = deepMerge((target as any)[key], (source as any)[key]);
      }
    });
    return result;
  }
  
  return source !== undefined ? source : target;
};

export const Schema2Form: React.FC<Schema2FormProps> = ({
  schema,
  value,
  onChange,
  disabled = false
}) => {
  // 生成完整的默认值，然后与传入的值深度合并
  const schemaDefaults = generateDefaultValue(schema);
  const defaultValue = value ? deepMerge(schemaDefaults, value) : schemaDefaults;
  const [form] = Form.useForm();
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [jsonValue, setJsonValue] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const objectToJson = useCallback((obj: unknown) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return '{}';
    }
  }, []);

  const jsonToObject = useCallback((jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch (error: unknown) {
      throw new Error(`JSON解析错误: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  useEffect(() => {
    setJsonValue(objectToJson(defaultValue));
    // 同步表单值
    form.setFieldsValue(defaultValue);
  }, [defaultValue, objectToJson, form]);

  const validateJsonSchema = useCallback((data: unknown): string | null => {
    if (schema.type === 'object' && (typeof data !== 'object' || data === null)) {
      return '数据类型不匹配，期望对象类型';
    }
    if (schema.type === 'array' && !Array.isArray(data)) {
      return '数据类型不匹配，期望数组类型';
    }
    if (schema.required && Array.isArray(schema.required) && data && typeof data === 'object') {
      for (const field of schema.required) {
        if (!(field in (data as Record<string, unknown>))) {
          return `缺少必需字段: ${field}`;
        }
      }
    }
    return null;
  }, [schema]);

  const handleFormChange = useCallback((_changedValues: unknown, allValues: unknown) => {
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
    } catch (error: unknown) {
      setJsonError(error instanceof Error ? error.message : 'Unknown error');
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
      } catch (error: unknown) {
        message.error(error instanceof Error ? error.message : 'Unknown error');
        return;
      }
    }
    setMode(newMode);
  }, [mode, form, jsonValue, objectToJson, jsonToObject, validateJsonSchema]);


  const renderForm = useCallback(() => {
    // 支持数组类型的 schema 或有 properties 的对象类型
    if (!schema.properties && schema.type !== 'array') return null;

    return (
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleFormChange}
        initialValues={defaultValue as any}
        disabled={disabled}
      >
        <Schema2FormItems
          schema={schema}
          disabled={disabled}
        />
      </Form>
    );
  }, [schema, form, handleFormChange, defaultValue, disabled]);

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {schema.title || '配置表单'}
            </Title>
            <Space.Compact>
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
            </Space.Compact>
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