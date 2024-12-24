import React, { useCallback, useEffect, useRef, useState } from "react";
import { call } from "../../common/call";
import { Button, Form } from "antd";

export function Market() {
  const [npx, setNpxVer] = useState("未安装");
  const [uvVer, setUvVer] = useState("未安装");
  useEffect(() => {
    (async () => {
      let x = await call("checkNpx", []);
      setNpxVer(x);
    })();
    (async () => {
      let y = await call("checkUV", []);
      setUvVer(y);
    })();
  }, []);
  return (
    <div className="flex">
      <div className="w-4/5">
        <h1 className=" ">💻MCP</h1>

        <div>
          <div>
            <span className="font-bold">npx: </span>
            {npx}
          </div>

          <div>
            <span className="font-bold">uvx:</span> {uvVer}
          </div>
        </div>
        <Button danger onClick={() => {}}>
          Repair environment
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
    </div>
  );
}
