import React, { useCallback } from 'react';
import { Form, Input, InputNumber, Select, Switch, Card } from 'antd';
import type { JSONSchema7 } from 'json-schema';
import type { Rule } from 'antd/es/form';

interface Schema2FormItemsProps {
  schema: JSONSchema7;
  disabled?: boolean;
  prefix?: string[];
}

export const Schema2FormItems: React.FC<Schema2FormItemsProps> = ({
  schema,
  disabled = false,
  prefix = []
}) => {
  const renderFormItem = useCallback((fieldName: string, fieldSchema: JSONSchema7, fieldPath: string[]) => {
    const { type, title, description, enum: enumValues, minimum, maximum, minLength, maxLength } = fieldSchema;
    
    const commonProps = {
      disabled,
      placeholder: description || `请输入${title || fieldName}`,
    };

    // 处理嵌套对象
    if (type === 'object' && fieldSchema.properties) {
      return (
        <Card 
          key={fieldName} 
          title={title || fieldName} 
          size="small" 
          style={{ marginBottom: 16 }}
        >
          <Schema2FormItems 
            schema={fieldSchema} 
            disabled={disabled}
            prefix={fieldPath}
          />
        </Card>
      );
    }

    // 处理数组类型
    if (type === 'array') {
      // 简单数组处理，这里可以根据需要扩展
      return (
        <Form.Item
          key={fieldName}
          name={fieldPath}
          label={title || fieldName}
          tooltip={description}
          rules={[
            { required: schema.required?.includes(fieldName), message: `请输入${title || fieldName}` }
          ]}
        >
          <Input.TextArea {...commonProps} placeholder="请输入数组，每行一个值" />
        </Form.Item>
      );
    }

    // 处理基本类型
    let inputComponent: React.ReactNode;
    
    switch (type) {
      case 'string':
        if (enumValues && Array.isArray(enumValues)) {
          inputComponent = (
            <Select {...commonProps}>
              {enumValues.map((value) => (
                <Select.Option key={String(value)} value={value}>
                  {String(value)}
                </Select.Option>
              ))}
            </Select>
          );
        } else if (title?.toLowerCase().includes('password') || fieldName.toLowerCase().includes('password')) {
          inputComponent = <Input.Password {...commonProps} />;
        } else if (maxLength && maxLength > 100) {
          inputComponent = <Input.TextArea {...commonProps} maxLength={maxLength} />;
        } else {
          inputComponent = <Input {...commonProps} maxLength={maxLength} />;
        }
        break;
      
      case 'number':
      case 'integer':
        inputComponent = (
          <InputNumber 
            {...commonProps} 
            style={{ width: '100%' }}
            min={minimum}
            max={maximum}
            step={type === 'integer' ? 1 : 0.1}
          />
        );
        break;
      
      case 'boolean':
        inputComponent = <Switch {...commonProps} />;
        break;
      
      default:
        inputComponent = <Input {...commonProps} />;
    }

    const rules: Rule[] = [];
    
    // 必填验证
    if (schema.required?.includes(fieldName)) {
      rules.push({ required: true, message: `请输入${title || fieldName}` });
    }
    
    // 字符串长度验证
    if (type === 'string') {
      if (minLength) {
        rules.push({ min: minLength, message: `长度不能少于${minLength}个字符` });
      }
      if (maxLength) {
        rules.push({ max: maxLength, message: `长度不能超过${maxLength}个字符` });
      }
    }
    
    // 数字范围验证
    if (type === 'number' || type === 'integer') {
      if (minimum !== undefined) {
        rules.push({ type: 'number', min: minimum, message: `值不能小于${minimum}` });
      }
      if (maximum !== undefined) {
        rules.push({ type: 'number', max: maximum, message: `值不能大于${maximum}` });
      }
    }

    return (
      <Form.Item
        key={fieldName}
        name={fieldPath}
        label={title || fieldName}
        rules={rules}
        tooltip={description}
        valuePropName={type === 'boolean' ? 'checked' : 'value'}
      >
        {inputComponent}
      </Form.Item>
    );
  }, [disabled, schema.required]);

  const renderItems = useCallback(() => {
    if (!schema.properties) return null;

    return Object.entries(schema.properties).map(([fieldName, fieldSchema]) => {
      const typedFieldSchema = fieldSchema as JSONSchema7;
      const fieldPath = [...prefix, fieldName];
      
      return renderFormItem(fieldName, typedFieldSchema, fieldPath);
    });
  }, [schema.properties, prefix, renderFormItem]);

  return (
    <>
      {renderItems()}
    </>
  );
};

export default Schema2FormItems;