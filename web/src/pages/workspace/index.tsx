import { Button, List, Tabs } from "antd";
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
import { call } from "../../common/call";
import { GPT_MODELS, Agents } from "../../../../common/data";
import { OpenAiChannel } from "../../common/openai";
import { text } from "stream/consumers";

//   src="https://chat.deepseek.com/"     src="https://claude.ai/new"     src="https://chatgpt.com/"

function Page({
  type = undefined,
  onChange = undefined,
  hyperChatData = {
    uid: "",
    agentKey: "",
    message: "",
    onComplete: (text: string) => undefined,
    onError: (e) => {},
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
    <div className="h-full">
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
          data={hyperChatData}
          onTitleChange={(t) => {
            onChange &&
              onChange({
                title: t == undefined ? "HyperChat" : `HyperChat(${t})`,
              });
          }}
        />
      ) : curr.url ? (
        <webview
          className="h-full w-full"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
          src={curr.url}
        ></webview>
      ) : (
        "not support"
      )}
    </div>
  );
}

export function WorkSpace() {
  const [num, setNum] = useState(0);
  function refresh() {
    setNum((num) => num + 1);
  }

  useEffect(() => {
    window.ext.receive(
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
              <Page
                type="hyperchat"
                onChange={(item) => {
                  n.label = item.title;
                  refresh();
                }}
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

          // let agents = await GPTS.init();
          // let agent = agents.data.find((x) => x.label == agent_name);
          // let models = await GPT_MODELS.init();
          // let model =
          //   models.data.find((x) => x.key == agent.modelKey) || models.data[0];
          // console.log("model", model);
          // let openaiClient = new OpenAiChannel(
          //   { ...model, allowMCPs: agent.allowMCPs },
          //   [
          //     {
          //       role: "system" as const,
          //       content: agent.prompt,
          //     },
          //   ],
          //   false,
          // );

          // openaiClient.addMessage({
          //   role: "user" as const,
          //   content: message,
          // });
          // let res = await openaiClient.completion();

          // console.log(res);
          // await call("call_agent_res", [uid, res]);
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
        <Page
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

  return (
    <div className="myworkspace flex h-full flex-col">
      {/* <webview
        className="w-full"
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
        src="https://tongyi.aliyun.com/qianwen/"   
      ></webview> */}
      {/* <webview
          className="h-full w-full"
          useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36"
          src="https://gemini.google.com/app"
        ></webview> */}
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
                <Page
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
    </div>
  );
}
