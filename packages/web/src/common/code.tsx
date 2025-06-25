import React, { useCallback, useEffect, useRef, useState } from "react";

import { Button, Form, Input, message, Modal, Space } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { call } from "./call";

export function Code(props) {
  return (
    <code className="bg-slate-300 p-1">
      {props.children}{" "}
      <CopyOutlined
        className="cursor-pointer"
        onClick={async () => {
          await call("setClipboardText", [props.children]);
          message.success("Copied to clipboard");
        }}
      />
    </code>
  );
}
