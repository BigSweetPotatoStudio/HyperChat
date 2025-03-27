import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { ProFormColumnsType } from "@ant-design/pro-components";
import { Button, Form, Input, InputNumber, Select, Space, Switch } from "antd";
import React from "react";
import { useLocation } from "react-router-dom";

export function debounce<T>(func: T, wait): T {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      (func as any)(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  } as any;
}

export function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export const isWeb = !window.ext;

export function JsonSchema2ProFormColumnsType(
  schema: any,
): ProFormColumnsType[] {
  function formatColumns(
    prop: {
      type: string;
      description: string;
      required: boolean;
      anyOf: any[];
      enum: string[];
    },
    key,
  ) {
    let type = prop.type;
    let required = prop.required;

    let description = prop.description;

    if (Array.isArray(prop.type)) {
      type = prop.type[0];
      required = !prop.required;
    }
    if (Array.isArray(prop.anyOf)) {
      type = prop.anyOf[0].type;
      description = prop.anyOf[0].description;

      required = !prop.anyOf.find((x) => x.type == "null");
    }
    let formItemProps = {
      required: required,
      rules: [
        {
          required: required,
        },
      ],
      tooltip: description,
    };

    let fieldProps = {
      placeholder: description,
      style: {
        width: "100%",
      },
      allowClear: false,
    };
    let column: ProFormColumnsType;
    if (type === "string") {
      if (prop.enum) {
        fieldProps["options"] = prop.enum.map((x) => ({
          label: x,
          value: x,
        }));
        column = {
          title: key,
          dataIndex: key,
          valueType: "select",
          fieldProps,
          formItemProps,
        };
      } else {
        column = {
          title: key,
          dataIndex: key,
          valueType: "text",

          fieldProps,
          formItemProps,
        };
      }
    } else if (type === "number") {
      column = {
        title: key,
        dataIndex: key,
        valueType: "digit",
        fieldProps,
        formItemProps,
      };
    } else if (type === "boolean") {
      column = {
        title: key,
        dataIndex: key,
        valueType: "switch",
        fieldProps,
        formItemProps,
      };
    } else {
      // console.log("type", prop.type);
      column = {
        title: key,
        dataIndex: key,
        valueType: "text",

        fieldProps,
        formItemProps,
      };
    }
    if (key == null) {
      delete column.dataIndex;
      delete column.title;
      delete (column as any).formItemProps.name;
    }
    return column;
  }

  function run(item) {
    const columns: ProFormColumnsType[] = [];
    for (const key in item.properties) {
      let prop = item.properties[key];

      prop = { ...prop };

      prop.required = true;
      if (Array.isArray(item.required)) {
        prop.required = item.required.includes(key);
      }

      let description = prop.description;
      let defaultValue = prop.default;
      if (Array.isArray(prop.type)) {
        prop.type = prop.type[0];
        prop.required = !prop.type.include("null");
      }
      if (Array.isArray(prop.anyOf)) {
        prop.type = prop.anyOf[0].type;
        description = prop.anyOf[0].description;
        defaultValue = prop.anyOf[0].default;
        prop.required = !prop.anyOf.find((x) => x.type == "null");
      }
      let formItemProps = {
        required: prop.required,
        rules: [
          {
            required: prop.required,
          },
        ],
        tooltip: description,
      };
      let fieldProps = {
        placeholder: description,
        style: {
          width: "100%",
        },
        allowClear: false,
      };

      if (prop.type === "array") {
        const column: ProFormColumnsType = {
          title: key,
          dataIndex: key,
          name: key,
          valueType: "formList",
          fieldProps,
          formItemProps,
          columns: prop.properties
            ? JsonSchema2ProFormColumnsType(prop.properties)
            : [formatColumns(prop.items, undefined)],
        };
        columns.push(column);
        continue;
      } else {
        columns.push(formatColumns(prop, key));
        continue;
      }
    }
    return columns;
  }

  if (schema && schema.type === "object") {
    return run(schema);
  } else {
    return [];
  }
}

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 4 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 20 },
  },
};

// const formItemLayoutWithOutLabel = {
//   wrapperCol: {
//     xs: { span: 24, offset: 0 },
//     sm: { span: 20, offset: 4 },
//   },
// };

export function JsonSchema2FormItem(schema: any, keys: any[] = []) {
  console.log("schema", schema);
  function formatColumns(
    prop: {
      type: string;
      description: string;
      required: boolean;
      anyOf: any[];
      enum: string[];
      properties: any;
    },
    keys: any[],
  ) {
    let type = prop.type;
    let required = prop.required;

    let description = prop.description;

    if (Array.isArray(prop.type)) {
      type = prop.type[0];
      required = !prop.required;
    }
    if (Array.isArray(prop.anyOf)) {
      type = prop.anyOf[0].type;
      description = prop.anyOf[0].description;

      required = !prop.anyOf.find((x) => x.type == "null");
    }

    let formItem;
    let label =
      typeof keys[keys.length - 1] === "string" ? keys[keys.length - 1] : "";
    if (type == "object") {
      throw new Error("object not error");
    } else if (type === "string") {
      if (prop.enum) {
        formItem = (
          <Form.Item
            className="w-full"
            key={keys.toString()}
            name={keys}
            label={label}
            tooltip={description}
            normalize={(value) => {
              if (value === null) {
                return undefined;
              } else {
                return value;
              }
            }}
            rules={[
              {
                required: required,
              },
            ]}
          >
            <Select
              style={{
                width: "100%",
              }}
              options={prop.enum.map((x) => ({
                label: x,
                value: x,
              }))}
              placeholder={description}
            />
          </Form.Item>
        );
      } else {
        formItem = (
          <Form.Item
            className="w-full"
            key={keys.toString()}
            name={keys}
            label={label}
            tooltip={description}
            normalize={(value) => {
              if (value === null) {
                return undefined;
              } else {
                return value;
              }
            }}
            rules={[
              {
                required: required,
              },
            ]}
          >
            <Input
              style={{
                width: "100%",
              }}
              placeholder={description}
            ></Input>
          </Form.Item>
        );
      }
    } else if (type === "number") {
      formItem = (
        <Form.Item
          className="w-full"
          key={keys.toString()}
          name={keys}
          label={label}
          tooltip={description}
          normalize={(value) => {
            if (value === null) {
              return undefined;
            } else {
              return value;
            }
          }}
          rules={[
            {
              required: required,
            },
          ]}
        >
          <InputNumber
            style={{
              width: "100%",
            }}
            placeholder={description}
          ></InputNumber>
        </Form.Item>
      );
    } else if (type === "boolean") {
      formItem = (
        <Form.Item
          className="w-full"
          key={keys.toString()}
          name={keys}
          label={label}
          tooltip={description}
          normalize={(value) => {
            if (value === null) {
              return undefined;
            } else {
              return value;
            }
          }}
          rules={[
            {
              required: required,
            },
          ]}
        >
          <Switch
          // style={{
          //   width: "100%",
          // }}
          ></Switch>
        </Form.Item>
      );
    } else {
      formItem = (
        <Form.Item
          className="w-full"
          key={keys.toString()}
          name={keys}
          label={label}
          tooltip={description}
          normalize={(value) => {
            if (value === null) {
              return undefined;
            } else {
              return value;
            }
          }}
          rules={[
            {
              required: required,
            },
          ]}
        >
          <Input
            style={{
              width: "100%",
            }}
            placeholder={description}
          ></Input>
        </Form.Item>
      );
    }

    return formItem;
  }
  if (schema && schema.type === "object") {
    return Object.entries(schema.properties).map(
      ([key, prop]: [string, any]) => {
        if (Array.isArray(schema.required)) {
          prop.required = schema.required.includes(key);
        }

        if (prop.type === "array") {
          if (prop.items.type === "object") {
            return (
              <Form.List name={key} key={key}>
                {(fields, { add, remove }) => (
                  <>
                    <Form.Item
                      // formItemLayout={formItemLayout}
                      name={key}
                      label={key}
                      required={prop.required}
                    >
                      {fields.map((field, index) => {
                        return (
                          <div key={field.key} className="flex w-full">
                            {/* <Form.Item
                          // key={field.key}
                          className="w-full"
                          name={[field.name]}
                          rules={[{ required: prop.required }]}
                        >
                          <Input placeholder={prop.description} />
                        </Form.Item> */}
                            {JsonSchema2FormItem(prop.items, [
                              ...keys,
                              field.name,
                            ])}
                            <MinusCircleOutlined
                              className="h-8 flex-shrink-0"
                              onClick={() => remove(field.name)}
                            />
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add field
                        </Button>
                      </Form.Item>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            );
          } else {
            return (
              <Form.List name={key} key={key}>
                {(fields, { add, remove }) => (
                  <>
                    <Form.Item
                      // formItemLayout={formItemLayout}
                      label={key}
                      required={prop.required}
                    >
                      {fields.map((field, index) => {
                        return (
                          <div key={field.key} className="flex w-full">
                            {/* <Form.Item
                          // key={field.key}
                          className="w-full"
                          name={[field.name]}
                          rules={[{ required: prop.required }]}
                        >
                          <Input placeholder={prop.description} />
                        </Form.Item> */}
                            {formatColumns(prop.items as any, [
                              ...keys,
                              field.name,
                            ])}
                            <MinusCircleOutlined
                              className="h-8 flex-shrink-0"
                              onClick={() => remove(field.name)}
                            />
                          </div>
                        );
                      })}
                      <Form.Item>
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                        >
                          Add field
                        </Button>
                      </Form.Item>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            );
          }
        } else {
          return formatColumns(prop as any, [...keys, key]);
        }
      },
    );
  } else {
    return [];
  }
}
