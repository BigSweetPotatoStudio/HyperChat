import React, { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../../common/call";
import { Button, Form, Input, Modal, Space, Tooltip } from "antd";
import { electronData } from "../../common/data";
import { EVENT } from "../../common/event";
import { Code } from "../../common/code";

export function Market() {
  const [num, setNum] = React.useState(0);
  const refresh = () => {
    setNum((n) => n + 1);
  };
  const [npx, setNpxVer] = useState("");
  const [uv, setUvVer] = useState("");
  let init = async () => {
    // (async () => {
    //   let x = await call("checkNpx", []);
    //   setNpxVer(x);
    // })();
    // (async () => {
    //   let y = await call("checkUV", []);
    //   setUvVer(y);
    // })();
  };
  useEffect(() => {
    init();
    (async () => {
      await electronData.init();
      // console.log(electronData.get());
      refresh();
    })();
  }, []);
  const [form] = Form.useForm();
  const [isPathOpen, setIsPathOpen] = useState(false);

  return (
    <div className="flex">
      <div className="w-3/5">
        <h1 className=" ">💻MCP</h1>

        <div>
          <div>
            <Space>
              <span className="font-bold">npx & nodejs: </span>
              {npx || "Not Installed"}
            </Space>
          </div>
          {!npx && (
            <Space>
              <span>Please run the command.</span>
              {electronData.get().platform == "win32" ? (
                <Code>winget install OpenJS.NodeJS.LTS</Code>
              ) : (
                <Code>brew install node</Code>
              )}
              <a href="https://nodejs.org/">goto nodejs</a>
            </Space>
          )}
        </div>
        <div>
          <div>
            <Space>
              <span className="font-bold">uvx & python:</span>{" "}
              {uv || "Not Installed"}
            </Space>
          </div>
          <Space>
            {!uv && (
              <Space>
                <span>Please run the command.</span>
                {electronData.get().platform == "win32" ? (
                  <Code>winget install --id=astral-sh.uv -e</Code>
                ) : (
                  <Code>brew install uv</Code>
                )}
                <a href="https://github.com/astral-sh/uv">goto uv</a>
              </Space>
            )}
          </Space>
        </div>
        <Space>
          <Tooltip title="If you are using NVM, you might need to customize the PATH environment var.">
            <Button
              onClick={() => {
                setIsPathOpen(true);
              }}
              danger
            >
              Try Repair environment
            </Button>
          </Tooltip>

          <Button
            onClick={() => {
              EVENT.fire("setIsToolsShowTrue");
            }}
          >
            MCP Service List{" "}
          </Button>
        </Space>

        <div className="mt-4 bg-white p-4">coming soon</div>
      </div>
      <div className="w-2/5">
        <h1>More MCP Market</h1>
        <div>
          <a href="https://modelcontextprotocol.io/examples">
            modelcontextprotocol.io/examples
          </a>
        </div>
        <div>
          <a href="https://mcp.so/">mcp.so</a>
        </div>
        <div>
          <a href="https://www.pulsemcp.com/">pulsemcp.com</a>
        </div>
        <div>
          <a href="https://glama.ai/mcp/servers?attributes=">glama.ai</a>
        </div>
        <div>
          <a href="https://smithery.ai/">smithery.ai</a>
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
              PATH: electronData.get().PATH,
            }}
            clearOnDestroy
            onFinish={async (values) => {
              electronData.get().PATH = values.PATH;
              await electronData.save();
              init();
              setIsPathOpen(false);
            }}
          >
            {dom}
          </Form>
        )}
      >
        <Form.Item name="PATH" label="PATH">
          <Input placeholder="Here, you would input the result of the command echo $PATH."></Input>
        </Form.Item>
      </Modal>
    </div>
  );
}
