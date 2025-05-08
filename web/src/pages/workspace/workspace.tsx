import { Avatar, Badge, Button, List, Modal, Segmented, Tabs } from "antd";
import React, {
  useState,
  useEffect,
  version,
  useCallback,
  useContext,
  useRef,
} from "react";
import { Chat } from "../chat";
import { it } from "node:test";
import { v4 } from "uuid";
import { io } from "socket.io-client";
import { call, getURL_PRE, msg_receive } from "../../common/call";
import { GPT_MODELS, Agents } from "../../../../common/data";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import type { DraggableData, DraggableEvent } from "react-draggable";
import Draggable from "react-draggable";
import { Sessions } from "./sessions";
import { LaptopOutlined, MinusOutlined } from "@ant-design/icons";
import { t } from "../../i18n";
function WorkSpacePage({
  sessionID = "",
  type = undefined,
  onChange = undefined,
  hyperChatData = {
    uid: "",
    agentKey: "",
    message: "",
    onComplete: (text: string) => undefined,
    onError: (e) => { },
  },
}) {
  const [curr, setCurr] = useState({
    title: "",
    type: type,
    path: "",
  } as any);
  const data = [
    {
      title: "HyperChat",
      type: "hyperchat",
      url: "",
    },
    
    {
      title: "Gemini",
      type: "gemini",
      url: "https://gemini.google.com/",
    },
    {
      title: "AIStudio-Google",
      type: "aistudio",
      url: "https://aistudio.google.com/prompts/new_chat",
    },

    {
      title: "DeepSeek",
      type: "deepseek",
      url: "https://chat.deepseek.com/",
    },
    {
      title: "Qianwen",
      type: "qianwen",
      url: "https://chat.qwenlm.ai/",
    },
    {
      title: "Qianwen-chinese",
      type: "qianwen-chinese",
      url: "https://tongyi.aliyun.com/qianwen/",
    },
  ];

  return (
    <div className="h-full" key={sessionID}>
      {curr.type == "start" ? (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <List
            size="small"
            header={
              <div>
                <div>{t`Please open the folder`}</div>

                <Button onClick={async () => {
                  let path = await call("selectFile", [{ type: "openDirectory" }]);
                  console.log(path);
                }}>Open</Button>
              </div>
            }
            bordered
            dataSource={data}
            renderItem={(item) => (
              <List.Item>
                <Button
                  type="link"
                  onClick={() => {
                    setCurr(item);
                    onChange && onChange(item);
                  }}
                >
                  {item.title}
                </Button>
              </List.Item>
            )}
          />
        </div>
      ) : curr.type == "workspace" ? (
        <Chat
          sessionID={sessionID}
          data={hyperChatData}
          onTitleChange={(t) => {
            onChange &&
              onChange({
                title: t == undefined ? "HyperChat" : <>{`HyperChat`} <span className="text-sky-400">{t}</span></>,
              });
          }}
        />
      ) : (
        "not support"
      )}
    </div>
  );
}

export function Workspace() {
  const [num, setNum] = useState(0);
  function refresh() {
    setNum((num) => num + 1);
  }

  useEffect(() => {
    msg_receive(
      "message-from-main",
      async (msg: { type: string; data: any }) => {
        if (msg.type == "call_agent") {
          let { agent_name, message, uid } = msg.data;
          let agents = await Agents.init();
          let agent = agents.data.find((x) => x.label == agent_name);
          if (agent == null) {
            throw new Error(`Agent ${agent_name} not found`);
          }

          let n = {
            key: v4(),
            label: "New Tab",
            closeIcon: false,
            children: (
              <WorkSpacePage
                type="hyperchat"
                onChange={(item) => {
                  n.label = item.title;
                  refresh();
                }}
                sessionID={uid}
                hyperChatData={{
                  agentKey: agent.key,
                  message,
                  uid,
                  onComplete: (text) => {
                    setActiveKey(activeKey);
                    call("call_agent_res", [uid, text, undefined]);
                    setItems((items) =>
                      items.filter((item) => item.key !== n.key),
                    );
                  },
                  onError: (e) => {
                    setActiveKey(activeKey);
                    call("call_agent_res", [uid, "", e.message]);
                    setItems((items) =>
                      items.filter((item) => item.key !== n.key),
                    );
                  },
                }}
              />
            ),
          };
          setItems([...items, n]);
          setActiveKey(n.key);
        }
      },
    );
  }, []);


  const first = useRef({
    key: v4(),
    label: "Welcome",
    path: "",
    type: "start",
    closable: false,
    onChange: (item) => {
      first.current.label = item.title;
      refresh();
    },
  },);
  const [items, setItems] = useState([
    {
      ...first.current,
      children: (
        <WorkSpacePage
          {
          ...first.current
          }
        />
      ),
    },
  ] as any[]);
  const [activeKey, setActiveKey] = useState(first.current.key);



  return (
    <div className="myworkspace flex h-full flex-col">
      <Tabs
        className="h-full"
        tabPosition="bottom"
        type="editable-card"
        activeKey={activeKey}
        centered
        items={items}
        onChange={(e) => {
          setActiveKey(e);
        }}
        onEdit={(
          targetKey: React.MouseEvent | React.KeyboardEvent | string,
          action: "add" | "remove",
        ) => {
          if (action === "add") {
            let n = {
              key: v4(),
              label: "Welcome",
              path: "",
              type: "start",
              closable: true,
              onChange: (item) => {
                n.label = item.title;
                refresh();
              },
            };
            setItems([...items, {
              ...n,
              children: (
                <WorkSpacePage
                  {
                  ...n
                  }
                />
              ),
            }]);
            setActiveKey(n.key);
          } else {
            setItems(items.filter((item) => item.key !== targetKey));
            let find = items.findIndex((item) => item.key == targetKey);
            if (find == -1) return;
            setActiveKey(items[find - 1]?.key);
          }
        }}
      />


    </div>
  );
}
