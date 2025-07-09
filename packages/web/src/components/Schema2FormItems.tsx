import React, { useCallback } from 'react';
import { Form, Input, InputNumber, Select, Switch, Card, Button, Typography } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import type { Rule } from 'antd/es/form';

const { Text } = Typography;

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
  // 解析Schema的辅助函数
  const resolveSchema = useCallback((schema: JSONSchema7Definition): JSONSchema7 => {
    if (typeof schema === 'boolean') {
      return schema ? {} : { not: {} };
    }
    return schema;
  }, []);

  // 获取字段默认值
  const getDefaultValue = useCallback((fieldSchema: JSONSchema7): any => {
    if (fieldSchema.default !== undefined) {
      return fieldSchema.default;
    }
    
    switch (fieldSchema.type) {
      case 'string':
        return '';
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return undefined;
    }
  }, []);

  // 渲染数组字段
  const renderArrayField = useCallback((fieldName: string, fieldSchema: JSONSchema7, fieldPath: string[]) => {
    const { title, description, items, minItems, maxItems } = fieldSchema;
    
    if (!items || typeof items === 'boolean') {
      // 简单数组处理
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
          <Input.TextArea placeholder="请输入数组，每行一个值" />
        </Form.Item>
      );
    }

    const itemSchema = resolveSchema(items as JSONSchema7Definition);
    
    return (
      <Form.Item
        key={fieldName}
        label={title || fieldName}
        tooltip={description}
        style={{ marginBottom: 16 }}
      >
        <Form.List 
          name={fieldPath}
          rules={[
            {
              validator: async (_, names) => {
                if (minItems && names.length < minItems) {
                  return Promise.reject(new Error(`至少需要${minItems}个项目`));
                }
                if (maxItems && names.length > maxItems) {
                  return Promise.reject(new Error(`最多只能有${maxItems}个项目`));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Card key={key} size="small" style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      {itemSchema.type === 'object' && itemSchema.properties ? (
                        <Schema2FormItems 
                          schema={itemSchema} 
                          disabled={disabled}
                          prefix={fieldPath.concat(name.toString())}
                        />
                      ) : (
                        <Form.Item
                          {...restField}
                          name={[name]}
                          rules={[
                            { required: true, message: '请输入值' }
                          ]}
                          style={{ margin: 0 }}
                        >
                          {renderInputComponent(itemSchema, fieldPath.concat(name.toString()))}
                        </Form.Item>
                      )}
                    </div>
                    <Button 
                      type="text" 
                      danger 
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(name)}
                      size="small"
                    />
                  </div>
                </Card>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  disabled={disabled || Boolean(maxItems && fields.length >= maxItems)}
                >
                  添加{itemSchema.title || '项目'}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>
    );
  }, [disabled, schema.required, resolveSchema]);

  // 渲染Record类型字段（如API Keys）
  const renderRecordField = useCallback((fieldName: string, fieldSchema: JSONSchema7, fieldPath: string[]) => {
    const { title, description, additionalProperties } = fieldSchema;
    
    // 处理 Record<string, object> 类型
    if (additionalProperties && typeof additionalProperties === 'object') {
      const valueSchema = resolveSchema(additionalProperties);
      
      return (
        <Form.Item
          key={fieldName}
          label={title || fieldName}
          tooltip={description}
          style={{ marginBottom: 16 }}
        >
          <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, padding: 16 }}>
            <Text strong style={{ marginBottom: 12, display: 'block' }}>
              {title || fieldName}
            </Text>
            
            {/* 针对内置提供商的API Keys，使用固定的key列表 */}
            {fieldName === 'builtinApiKeys' ? (
              <div>
                {['openai', 'anthropic', 'openrouter', 'gemini', 'qwen', 'deepseek', 'doubao', 'xai', 'glm', 'ollama', 'unknown'].map(providerKey => (
                  <Card key={providerKey} size="small" style={{ marginBottom: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{providerKey.toUpperCase()}</Text>
                    </div>
                    <Schema2FormItems 
                      schema={valueSchema} 
                      disabled={disabled}
                      prefix={[...fieldPath, providerKey]}
                    />
                  </Card>
                ))}
              </div>
            ) : (
              /* 动态键值对编辑 */
              <Form.List name={fieldPath}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Card key={key} size="small" style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'key']}
                            label="键名"
                            rules={[{ required: true, message: '请输入键名' }]}
                            style={{ minWidth: 150 }}
                          >
                            <Input placeholder="输入键名" />
                          </Form.Item>
                          <div style={{ flex: 1 }}>
                            <Schema2FormItems
                              schema={valueSchema}
                              disabled={disabled}
                              prefix={[...fieldPath, name.toString()]}
                            />
                          </div>
                          <Button 
                            type="text" 
                            danger 
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                            size="small"
                          />
                        </div>
                      </Card>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        disabled={disabled}
                      >
                        添加配置项
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            )}
          </div>
        </Form.Item>
      );
    }
    
    // 简单的 Record<string, string> 处理
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
        <Input.TextArea 
          placeholder="请输入JSON格式的键值对"
          disabled={disabled}
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>
    );
  }, [disabled, schema.required, resolveSchema]);

  // 渲染输入组件
  const renderInputComponent = useCallback((fieldSchema: JSONSchema7, fieldPath: string[]): React.ReactNode => {
    const { type, enum: enumValues, minimum, maximum, maxLength, format } = fieldSchema;
    
    // 获取更好的placeholder文本
    const getPlaceholder = () => {
      const fieldName = fieldPath[fieldPath.length - 1];
      if (fieldName === 'defaultModel') {
        return '请选择默认模型 (例如: openai:gpt-4)';
      }
      if (fieldName === 'apiKey') {
        return '请输入API Key';
      }
      if (fieldName === 'baseURL') {
        return '请输入API基础地址';
      }
      return fieldSchema.description || `请输入${fieldSchema.title || fieldPath.join('.')}`;
    };
    
    const commonProps = {
      disabled,
      placeholder: getPlaceholder(),
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
        } else if (fieldSchema.title?.toLowerCase().includes('password') || 
                   fieldPath.some(p => p.toLowerCase().includes('password'))) {
          return <Input.Password {...commonProps} />;
        } else if (format === 'email') {
          return <Input {...commonProps} type="email" />;
        } else if (format === 'uri' || format === 'url') {
          return <Input {...commonProps} type="url" />;
        } else if (maxLength && maxLength > 100) {
          return <Input.TextArea {...commonProps} maxLength={maxLength} />;
        } else {
          return <Input {...commonProps} maxLength={maxLength} />;
        }
      
      case 'number':
      case 'integer':
        return (
          <InputNumber 
            {...commonProps} 
            style={{ width: '100%' }}
            min={minimum}
            max={maximum}
            step={type === 'integer' ? 1 : 0.1}
          />
        );
      
      case 'boolean':
        return <Switch {...commonProps} />;
      
      default:
        return <Input {...commonProps} />;
    }
  }, [disabled]);

  // 处理oneOf/anyOf条件schema
  const renderConditionalField = useCallback((fieldName: string, fieldSchema: JSONSchema7, fieldPath: string[]) => {
    const { oneOf, anyOf, title, description } = fieldSchema;
    const conditions = oneOf || anyOf || [];
    
    if (conditions.length === 0) return null;
    
    // 简化处理：如果条件中都有title，创建选择器
    const hasSelectableOptions = conditions.every(condition => 
      typeof condition === 'object' && condition.title
    );
    
    if (hasSelectableOptions) {
      return (
        <Form.Item
          key={fieldName}
          name={fieldPath}
          label={title || fieldName}
          tooltip={description}
          rules={[
            { required: schema.required?.includes(fieldName), message: `请选择${title || fieldName}` }
          ]}
        >
          <Select placeholder={`请选择${title || fieldName}`} disabled={disabled}>
            {conditions.map((condition, index) => {
              const conditionSchema = resolveSchema(condition);
              return (
                <Select.Option key={index} value={conditionSchema.const || index}>
                  {conditionSchema.title || `选项 ${index + 1}`}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      );
    }
    
    // 复杂条件的处理，使用第一个条件作为默认
    const defaultCondition = resolveSchema(conditions[0] as JSONSchema7Definition);
    return renderFormItem(fieldName, defaultCondition, fieldPath);
  }, [disabled, schema.required, resolveSchema]);

  const renderFormItem = useCallback((fieldName: string, fieldSchema: JSONSchema7, fieldPath: string[]) => {
    const { type, title, description, oneOf, anyOf, allOf, minimum, maximum, minLength, maxLength, pattern, format, additionalProperties } = fieldSchema;
    
    // 处理条件schema
    if (oneOf || anyOf) {
      return renderConditionalField(fieldName, fieldSchema, fieldPath);
    }
    
    // 处理allOf - 合并所有条件
    if (allOf) {
      const mergedSchema = allOf.reduce((acc: JSONSchema7, condition) => {
        const conditionSchema = resolveSchema(condition as JSONSchema7Definition);
        return { ...acc, ...(conditionSchema || {}) };
      }, {} as JSONSchema7);
      const combinedSchema = Object.assign({}, fieldSchema as JSONSchema7, mergedSchema || {});
      return renderFormItem(fieldName, combinedSchema, fieldPath);
    }

    // 处理Record类型（object with additionalProperties）
    if (type === 'object' && additionalProperties && !fieldSchema.properties) {
      return renderRecordField(fieldName, fieldSchema, fieldPath);
    }

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
      return renderArrayField(fieldName, fieldSchema, fieldPath);
    }

    // 创建增强的验证规则
    const rules: Rule[] = [];
    
    // 必填验证
    if (schema.required?.includes(fieldName)) {
      rules.push({ required: true, message: `请输入${title || fieldName}` });
    }
    
    // 字符串验证
    if (type === 'string') {
      if (minLength) {
        rules.push({ min: minLength, message: `长度不能少于${minLength}个字符` });
      }
      if (maxLength) {
        rules.push({ max: maxLength, message: `长度不能超过${maxLength}个字符` });
      }
      if (pattern) {
        rules.push({ pattern: new RegExp(pattern), message: `格式不正确` });
      }
      if (format === 'email') {
        rules.push({ type: 'email', message: '请输入有效的邮箱地址' });
      }
      if (format === 'url' || format === 'uri') {
        rules.push({ type: 'url', message: '请输入有效的URL地址' });
      }
    }
    
    // 数字验证
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
        initialValue={getDefaultValue(fieldSchema)}
      >
        {renderInputComponent(fieldSchema, fieldPath)}
      </Form.Item>
    );
  }, [disabled, schema.required, renderConditionalField, renderArrayField, renderInputComponent, getDefaultValue]);

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