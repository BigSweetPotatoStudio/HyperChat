import { Modal } from "antd";
import React from "react";

export async function callToolConfirm(tool) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title: "是否执行工具",
      width: "80%",
      onOk: () => {
        resolve(1);
      },
      onCancel: () => {
        reject(new Error("用户取消"));
      },
      content: (
        <div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            <span>Tool Name: </span>
            <span className="text-red-400">
              {tool.restore_name || tool.function.name}
            </span>
          </pre>
          <div>
            <span>Tool Arguments: </span>
          </div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          >
            {tool.function.arguments}
          </pre>
        </div>
      ),
    });
  });
}
