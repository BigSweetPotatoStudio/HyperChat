import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Divider,
  Dropdown,
  Flex,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Result,
  Segmented,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
const antdMessage = message;
import React, { useCallback, useEffect, useRef, useState } from "react";

export function UserContent({ x, regenerate, submit }) {
  const [isEdit, setIsEdit] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div>
      {isEdit ? (
        <div>
          <Input.TextArea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
          <Space.Compact>
            <Button
              size="small"
              onClick={() => {
                setValue(x.content);
                setIsEdit(false);
              }}
            >
              取消
            </Button>
            <Button
              size="small"
              onClick={() => {
                setIsEdit(false);
                submit(value);
              }}
            >
              提交
            </Button>
          </Space.Compact>
        </div>
      ) : (
        <Tooltip
          title={
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setValue(x.content);
                  setIsEdit(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  regenerate();
                }}
              >
                Regenerate
              </Button>
            </>
          }
        >
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            {x.content as string}
          </pre>
        </Tooltip>
      )}
    </div>
  );
}
