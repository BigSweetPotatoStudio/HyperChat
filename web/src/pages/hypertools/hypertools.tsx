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
import { t } from "../../i18n";
import { HeaderContext } from "../../common/context";

export function HpyerTools() {
    const { globalState, updateGlobalState, mcpClients } = useContext(HeaderContext);
  const [url, setUrl] = useState("");
  return (
    <div className="lg:p-4">
      <Form>
        <Form.Item label={t`Fetch`}>
          <Form.Item label={t`openUrl`}>
            <Space.Compact className="w-full">
              <Input
                value={url}
                placeholder={t`Some websites require you to log in to view content. Please log in from here.`}
                onChange={(e) => {
                  setUrl(e.target.value);
                }}
              />
              <Button
                onClick={() => {
                  call("hyperToolOpenBrowser", [url]);
                }}
              >
                {t`Open`}
              </Button>
              <Button
                onClick={() => {
                  call("hyperToolOpenBrowser", ["https://github.com/BigSweetPotatoStudio/HyperChat"]);
                }}
              >
                {t`Test`}
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form.Item>
      </Form>
    </div>
  );
}
