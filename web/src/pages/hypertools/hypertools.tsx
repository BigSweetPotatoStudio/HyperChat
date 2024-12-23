import {
  Button,
  Carousel,
  Form,
  FormInstance,
  FormProps,
  Input,
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
import { call } from "../../common/call";

export function HpyerTools() {
  const [url, setUrl] = useState("");
  return (
    <Form>
      <Form.Item label="fetch">
        <Form.Item label="openUrl">
          <Space.Compact className="w-full">
            <Input
              value={url}
              placeholder="Some websites require you to log in to view content. Please log in from here."
              onChange={(e) => {
                setUrl(e.target.value);
              }}
            />
            <Button
              onClick={() => {
                call("openBrowser", [url]);
              }}
            >
              open
            </Button>
          </Space.Compact>
        </Form.Item>
      </Form.Item>
    </Form>
  );
}
