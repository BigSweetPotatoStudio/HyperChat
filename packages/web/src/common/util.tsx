import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { ProFormColumnsType } from "@ant-design/pro-components";
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch } from "antd";
import React from "react";
import { useLocation } from "react-router-dom";
import { Pre } from "../components/pre";
import { call } from "./call";
import { v4 } from "uuid";
import dayjs from "dayjs";

/**
 * Debounces a function, delaying its execution until after a specified `wait` time
 * has passed since the last time it was invoked.
 * @template T - The type of the function to debounce.
 * @param {T} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {T} A new, debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(this: any, ...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  } as T;
}

/**
 * A React Hook that parses the query parameters from the current URL.
 * @returns {URLSearchParams} An instance of URLSearchParams containing the query parameters.
 */
export function useQuery(): URLSearchParams {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export * from "./const";

/**
 * Converts a JSON Schema definition into an array of Ant Design ProFormColumnsType.
 * This function recursively processes the schema to generate form columns suitable for ProForm.
 * @param {any} schema - The JSON Schema object to convert.
 * @returns {ProFormColumnsType[]} An array of ProFormColumnsType representing the form fields.
 */
/**
 * Converts a JSON Schema definition into an array of Ant Design ProFormColumnsType.
 * This function recursively processes the schema to generate form columns suitable for ProForm.
 * @param {any} schema - The JSON Schema object to convert.
 * @returns {ProFormColumnsType[]} An array of ProFormColumnsType representing the form fields.
 */
export function JsonSchema2ProFormColumnsType(
  schema: any,
): ProFormColumnsType[] {
  /**
   * Formats a single property from JSON Schema into a ProFormColumnsType.
   * @param {object} prop - The property object from JSON Schema.
   * @param {string} prop.type - The data type of the property (e.g., "string", "number", "boolean").
   * @param {string} prop.description - The description of the property.
   * @param {boolean} prop.required - Indicates if the property is required.
   * @param {any[]} prop.anyOf - Used for union types (e.g., string | null).
   * @param {string[]} prop.enum - An array of allowed values for string enums.
   * @param {string} key - The key (name) of the property.
   * @returns {ProFormColumnsType} The formatted ProFormColumnsType for the property.
   */
  function formatColumns(
    prop: {
      type: string | string[];
      description: string;
      required?: boolean;
      anyOf?: any[];
      enum?: string[];
    },
    key: string,
  ): ProFormColumnsType {
    let type = Array.isArray(prop.type) ? prop.type[0] : prop.type;
    let required = prop.required || false;
    let description = prop.description;

    if (Array.isArray(prop.anyOf)) {
      const nonNullType = prop.anyOf.find((x) => x.type !== "null");
      if (nonNullType) {
        type = nonNullType.type;
        description = nonNullType.description || description;
      }
      required = !prop.anyOf.some((x) => x.type === "null");
    }

    const formItemProps = {
      required: required,
      rules: [
        {
          required: required,
        },
      ],
      tooltip: description,
    };

    const fieldProps: Record<string, any> = {
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
      column = {
        title: key,
        dataIndex: key,
        valueType: "text",
        fieldProps,
        formItemProps,
      };
    }
    // If key is null (e.g., for array items), remove dataIndex and title.
    if (key == null) {
      delete column.dataIndex;
      delete column.title;
      // The 'name' property for formItemProps is typically used for Form.Item, not ProFormColumnsType directly.
      // This line might be a remnant or intended for a specific use case not fully clear from context.
      delete (column.formItemProps as any).name;
    }
    return column;
  }

  /**
   * Recursively processes the schema properties to generate ProFormColumnsType.
   * @param {any} item - The current schema item (object type).
   * @returns {ProFormColumnsType[]} Generated columns.
   */
  function run(item: any): ProFormColumnsType[] {
    const columns: ProFormColumnsType[] = [];
    for (const key in item.properties) {
      let prop = { ...item.properties[key] }; // Create a shallow copy to avoid modifying original schema

      // Determine if the property is required based on the parent schema's required array.
      prop.required = Array.isArray(item.required) ? item.required.includes(key) : false;

      let description = prop.description;
      let defaultValue = prop.default;

      // Handle union types (e.g., ["string", "null"] or anyOf).
      if (Array.isArray(prop.type)) {
        prop.type = prop.type[0];
        prop.required = !prop.type.includes("null");
      }
      if (Array.isArray(prop.anyOf)) {
        const nonNullType = prop.anyOf.find((x: any) => x.type !== "null");
        if (nonNullType) {
          prop.type = nonNullType.type;
          description = nonNullType.description || description;
          defaultValue = nonNullType.default || defaultValue;
        }
        prop.required = !prop.anyOf.some((x: any) => x.type === "null");
      }

      const formItemProps = {
        required: prop.required,
        rules: [
          {
            required: prop.required,
          },
        ],
        tooltip: description,
      };
      const fieldProps = {
        placeholder: description,
        style: {
          width: "100%",
        },
        allowClear: false,
      };

      // Handle array type properties by creating a formList.
      if (prop.type === "array") {
        const column: ProFormColumnsType = {
          title: key,
          dataIndex: key,
          name: key,
          valueType: "formList",
          fieldProps,
          formItemProps,
          // Recursively generate columns for array items.
          columns: prop.properties
            ? JsonSchema2ProFormColumnsType(prop.properties)
            : [formatColumns(prop.items, "item")], // For simple arrays, format the item schema.
        };
        columns.push(column);
      } else {
        // For other types, format as a regular column.
        columns.push(formatColumns(prop, key));
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

/**
 * Converts a JSON Schema definition into an array of Ant Design Form.Item components.
 * This function recursively processes the schema to generate form items.
 * @param {any} schema - The JSON Schema object to convert.
 * @param {any[]} [keys=[]] - An array of keys representing the current path in the form.
 * @returns {React.ReactNode[]} An array of React nodes representing the form items.
 */
/**
 * Converts a JSON Schema definition into an array of Ant Design Form.Item components.
 * This function recursively processes the schema to generate form items.
 * @param {any} schema - The JSON Schema object to convert.
 * @param {any[]} [keys=[]] - An array of keys representing the current path in the form.
 * @returns {React.ReactNode[]} An array of React nodes representing the form items.
 */
export function JsonSchema2FormItem(schema: any, keys: any[] = []) {
  /**
   * Formats a single property from JSON Schema into an Ant Design Form.Item.
   * @param {object} prop - The property object from JSON Schema.
   * @param {string | string[]} prop.type - The data type of the property.
   * @param {string} prop.description - The description of the property.
   * @param {boolean} prop.required - Indicates if the property is required.
   * @param {any[]} prop.anyOf - Used for union types.
   * @param {string[]} prop.enum - An array of allowed values for string enums.
   * @param {any} prop.properties - Properties for object types.
   * @param {any} prop.items - Items for array types.
   * @param {any[]} currentKeys - The current path keys for the form item.
   * @returns {React.ReactNode} The formatted Form.Item component.
   */
  function formatColumns(
    prop: {
      type: string | string[];
      description: string;
      required?: boolean;
      anyOf?: any[];
      enum?: string[];
      properties?: any;
      items?: any;
    },
    currentKeys: any[],
  ) {
    let type = Array.isArray(prop.type) ? prop.type[0] : prop.type;
    let required = prop.required || false;

    let description = prop.description;

    if (Array.isArray(prop.anyOf)) {
      const nonNullType = prop.anyOf.find((x) => x.type !== "null");
      if (nonNullType) {
        type = nonNullType.type;
        description = nonNullType.description || description;
      }
      required = !prop.anyOf.some((x) => x.type === "null");
    }

    let formItem;
    let label =
      typeof currentKeys[currentKeys.length - 1] === "string" ? currentKeys[currentKeys.length - 1] : "";

    if (type === "array") {
      return (
        <Form.List name={currentKeys} key={currentKeys.toString()}>
          {(fields, { add, remove }) => (
            <>
              <Form.Item
                key={currentKeys.toString()}
                label={label}
                required={required}
              >
                {fields.map((field) => {
                  return (
                    <div key={field.key} className="flex w-full">
                      {prop.items?.type === "object"
                        ? JsonSchema2FormItem(prop.items as any, [field.name])
                        : formatColumns(prop.items as any, [field.name])}
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
    } else if (type === "object") {
      formItem = (
        <Form.Item className="w-full" key={currentKeys.toString()} label={label}>
          {JsonSchema2FormItem(prop, [...currentKeys])}
        </Form.Item>
      );
    } else if (type === "string") {
      if (prop.enum) {
        formItem = (
          <Form.Item
            className="w-full"
            key={currentKeys.toString()}
            name={currentKeys}
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
            key={currentKeys.toString()}
            name={currentKeys}
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
          key={currentKeys.toString()}
          name={currentKeys}
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
          key={currentKeys.toString()}
          name={currentKeys}
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
          <Switch></Switch>
        </Form.Item>
      );
    } else {
      formItem = (
        <Form.Item
          className="w-full"
          key={currentKeys.toString()}
          name={currentKeys}
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
  if (schema && schema.type === "object" && schema.properties) {
    return Object.entries(schema.properties).map(
      ([key, prop]: [string, any]) => {
        if (Array.isArray(schema.required)) {
          if (!Object.getOwnPropertyDescriptor(prop, "required")) {
            Object.defineProperty(prop, "required", {
              get: () => schema.required.includes(key),
            });
          }
        }
        return formatColumns(prop as any, [...keys, key]);
      },
    );
  } else {
    return [];
  }
}

/**
 * Converts a JSON Schema definition into an array of Ant Design Form.Item components.
 * If the conversion results in an empty array, it returns null.
 * @param {any} p - The JSON Schema object to convert.
 * @returns {React.ReactNode[] | null} An array of React nodes representing the form items, or null if no items are generated.
 */
export function JsonSchema2FormItemOrNull(p) {
  let res = JsonSchema2FormItem(p);
  if (res.length == 0) {
    return null;
  } else {
    return res;
  }
}


/**
 * Copies the given text to the clipboard.
 * It attempts to use the modern Clipboard API first, falling back to a textarea-based method if not available or in an insecure context.
 * @param {{ text: string }} params - An object containing the text to copy.
 * @param {string} params.text - The text content to be copied to the clipboard.
 */
export const setClipboardText = async ({ text }: { text: string }) => {
  const copy = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      // Use the modern Clipboard API when available and in secure context
      navigator.clipboard.writeText(text).catch((err) => {
        console.error("Failed to copy text using Clipboard API:", err);
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "absolute";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };
  copy(text);
}


/**
 * Displays the content of a file in an Ant Design Modal.
 * @param {{ path: string }} params - An object containing the path to the file.
 * @param {string} params.path - The absolute path to the file to display.
 */
export const showText = async ({ path }: { path: string }) => {
  let text = await call("readFile", { path });
  Modal.info({
    title: 'File Content',
    width: "80%",
    style: {
      maxWidth: 1024,
    },
    maskClosable: true,
    content: (
      <Pre>
        {text}
      </Pre>
    ),
    onOk() { },
  });
}

export function getMyUuid() {
  // Generate a UUID using the built-in crypto API
  return dayjs().format('YYYYMMDD') + '-' + v4().slice(0, 8);
}


export const calcAttachDialogue = (
  messages,
  attachedDialogueCount,
  overwrite = true,
) => {
  if (attachedDialogueCount == null) {
    attachedDialogueCount = 10;
  }
  let c = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    let m = messages[i];
    if (m.role == "system") {
      m.content_attached = true;
      continue;
    }

    if (overwrite) {
      m.content_attached = c < attachedDialogueCount;
    } else {
      if (m.content_attached == false && c < attachedDialogueCount) {
      } else {
        m.content_attached = c < attachedDialogueCount;
      }
    }

    if (m.role == "user") {
      c++;
    }
  }
};

/**
 * Pre组件的Props类型定义
 */
interface PreProps {
  children: React.ReactNode;
}



/**
 * 将URL转换为Base64编码
 * @param url 图片URL
 * @returns Promise<string> Base64编码的图片数据
 */
export function urlToBase64(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // 创建图片对象
    const img = new Image();

    // 跨域支持
    img.crossOrigin = "Anonymous";

    img.onload = function () {
      // 创建画布
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("无法获取2D上下文"));
        return;
      }

      // 设置画布大小
      canvas.width = (this as HTMLImageElement).width;
      canvas.height = (this as HTMLImageElement).height;

      // 绘制图片
      ctx.drawImage(this as HTMLImageElement, 0, 0);

      // 转换为 Base64
      const base64 = canvas.toDataURL("image/png");
      resolve(base64);
    };

    img.onerror = function () {
      reject(new Error("图片加载失败"));
    };

    // 设置图片源
    img.src = url;
  });
}

/**
 * 将Blob对象转换为Base64编码
 * @param blob Blob对象
 * @returns Promise<string> Base64编码的数据
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string); // reader.result 包含 Base64 字符串
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.onabort = () => {
      reject(new Error("读取中断"));
    };

    reader.readAsDataURL(blob);
  });
}