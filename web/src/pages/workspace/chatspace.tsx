import { Avatar, Badge, Button, List, Modal, Segmented, Splitter, Tabs } from "antd";
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
import { ClockCircleOutlined, LaptopOutlined, MinusOutlined } from "@ant-design/icons";
import { t } from "../../i18n";
import { EVENT } from "../../common/event";
function ChatPage({
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
    url: "",
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
      {curr.type == undefined ? (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <List
            header={
              <div>
                Please select Chat.
                <div>
                  If you want to log in to Google, You need to click here to log
                  in.
                  <Button
                    type="link"
                    onClick={() => {
                      call("openBrowser", [
                        "https://www.google.com/",
                        "Chrome",
                      ]);
                    }}
                  >
                    login Google
                  </Button>
                  <div>
                    (Because the browser that comes with Electron is Chromium,
                    it may be considered not secure enough. )
                  </div>
                </div>
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
      ) : curr.type == "hyperchat" ? (
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
      ) : curr.url ? (
        <webview
          className="webview h-full w-full"
          // useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
          src={curr.url}
          allowpopups={"true" as any}
          partition="persist:webview"
        ></webview>
      ) : (
        "not support"
      )}
    </div>
  );
}

export function ChatSpace() {
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
              <ChatPage
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
  const [items, setItems] = useState([
    {
      key: "1",
      label: "HyperChat",
      closable: false,
      children: (
        <ChatPage
          sessionID={v4()}
          type="hyperchat"
          onChange={(item) => {
            items[0].label = item.title;
            refresh();
          }}
        />
      ),
    },
  ] as any[]);
  const [activeKey, setActiveKey] = useState("1");

  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const draggleRef = useRef<HTMLDivElement>(null!);

  const showModal = () => {
    setOpen(true);
  };

  const handleOk = (e: React.MouseEvent<HTMLElement>) => {
    console.log(e);
    setOpen(false);
  };

  const handleCancel = (e: React.MouseEvent<HTMLElement>) => {
    console.log(e);
    setOpen(false);
  };

  const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };
  const [sessionCount, setSessionCount] = useState(0);
  useEffect(() => {
    if (sessionCount == 0) {
      setOpen(false);
    }
  }, [sessionCount]);
  const [sizes, setSizes] = useState(["100%", 0] as any);


  return (
    <div className="myworkspace flex h-full flex-col">
      <Splitter onResize={(sizes) => {
        setSizes(sizes)
        EVENT.fire("chatspace-resize", sizes)
      }} >
        <Splitter.Panel size={sizes[0]} style={{ overflow: "hidden" }}>
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
                  label: "New Tab",
                  children: (
                    <ChatPage
                      onChange={(item) => {
                        n.label = item.title;
                        refresh();
                      }}
                    />
                  ),
                };
                setItems([...items, n]);
                setActiveKey(n.key);
              } else {
                setItems(items.filter((item) => item.key !== targetKey));
                let find = items.findIndex((item) => item.key == targetKey);
                if (find == -1) return;
                setActiveKey(items[find - 1]?.key);
              }
            }}
          />
        </Splitter.Panel>
        <Splitter.Panel size={sizes[1]} min="20%" max="70%">
          <Sessions setSessionCount={setSessionCount} />
        </Splitter.Panel>
      </Splitter>
      <div style={{ position: "fixed", bottom: 0, right: 0, margin: 15 }}>
        <Badge
          count={sessionCount ? <ClockCircleOutlined style={{ color: '#f5222d' }} /> : 0}
          className="cursor-pointer"
          onClick={() => {
            if (sizes[1] == 0) {
              setSizes(["60%", "40%"]);
              EVENT.fire("chatspace-resize", sizes)
            } else {
              setSizes(["100%", 0]);
            }
          }}
        >
          <LaptopOutlined />
        </Badge>
      </div>
      {/* <div
        className="my-modal"

      >
        <Modal
          open={true}
          width={"70%"}
          style={{
            visibility: open ? "visible" : "hidden",
            maxWidth: 1024,
          }}
          title={
            <div
              className="flex items-center justify-between"
              style={{ width: "100%", cursor: "move" }}
              onMouseOver={() => {
                if (disabled) {
                  setDisabled(false);
                }
              }}
              onMouseOut={() => {
                setDisabled(true);
              }}
              // fix eslintjsx-a11y/mouse-events-have-key-events
              // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
              onFocus={() => { }}
              onBlur={() => { }}
            // end
            >
              <div>{t`Session Management`}</div>
              <div>
                <Button
                  onClick={() => {
                    setOpen(false);
                  }}
                ><MinusOutlined /></Button>
              </div>
            </div>
          }
          closable={false}
          getContainer={false}
          forceRender
          mask={false}
          modalRender={(modal) => (
            <Draggable
              disabled={disabled}
              bounds={bounds}
              nodeRef={draggleRef}
              onStart={(event, uiData) => onStart(event, uiData)}
            >
              <div ref={draggleRef}>{modal}</div>
            </Draggable>
          )}
          footer={<></>}
        >
          <div className="p-0">
            <Sessions setSessionCount={setSessionCount} />
          </div>
        </Modal>
      </div> */}
    </div>
  );
}
