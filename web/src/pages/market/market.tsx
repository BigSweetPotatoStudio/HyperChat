import React, { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../../common/call";
import { Button, Form, Input, Modal, Space } from "antd";
import { ENV_CONFIG } from "../../common/data";

export function Market() {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const [npx, setNpxVer] = useState("");
  const [uv, setUvVer] = useState("");
  useEffect(() => {
    (async () => {
      let x = await call("checkNpx", []);
      setNpxVer(x);
    })();
    (async () => {
      let y = await call("checkUV", []);
      setUvVer(y);
    })();
    (async () => {
      await ENV_CONFIG.init();
      refresh();
    })();
  }, []);
  const [form] = Form.useForm();
  const [isPathOpen, setIsPathOpen] = useState(false);

  return (
    <div className="flex">
      <div className="w-4/5">
        <h1 className=" ">💻MCP</h1>

        <div>
          <Space>
            <span className="font-bold">npx: </span>
            {npx || "Not Installed"}
            {!npx && <a href="https://nodejs.org/">goto nodejs</a>}
          </Space>
          <br />
          <Space>
            <span className="font-bold">uvx:</span> {uv || "Not Installed"}
            {!uv && <a href="https://github.com/astral-sh/uv">goto uv</a>}
          </Space>
        </div>

        <Button
          onClick={() => {
            setIsPathOpen(true);
          }}
        >
          Try Repair environment
        </Button>
      </div>
      <div className="w-1/5">
        <h1>More MCP Market</h1>
        <div>
          <a href="https://mcp.so/">mcp.so</a>
        </div>
        <div>
          <a href="https://www.pulsemcp.com/">pulsemcp</a>
        </div>
        <div>
          <a href="https://glama.ai/mcp/servers?attributes=">glama</a>
        </div>
        <div>
          <a href="https://smithery.ai/">smithery</a>
        </div>
      </div>
      <Modal
        width={600}
        title="Configure PATH"
        open={isPathOpen}
        okButtonProps={{ autoFocus: true, htmlType: "submit" }}
        cancelButtonProps={{ style: { display: "none" } }}
        onCancel={() => {
          setIsPathOpen(false);
        }}
        modalRender={(dom) => (
          <Form
            form={form}
            layout="vertical"
            name="ConfigurePATH"
            initialValues={{
              PATH: ENV_CONFIG.get().PATH,
            }}
            clearOnDestroy
            onFinish={async (values) => {
              ENV_CONFIG.get().PATH = values.PATH;
              await ENV_CONFIG.save();
              location.reload();
            }}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item name="PATH" label="PATH" rules={[{ required: true }]}>
          <Input placeholder="Please enter the content of echo $PATH "></Input>
        </Form.Item>
      </Modal>
    </div>
  );
}
