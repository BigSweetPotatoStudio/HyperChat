import { Avatar, Badge, Button, Dropdown, List, Modal, Segmented, Tabs } from "antd";
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
import { sleep } from "../../common/sleep";
import { ClearOutlined, CopyFilled, CopyOutlined, LaptopOutlined, SnippetsOutlined } from "@ant-design/icons";
import { t } from "../../i18n";
import { EVENT } from "../../common/event";
import { ClipboardAddon, IClipboardProvider, ClipboardSelectionType } from '@xterm/addon-clipboard';

let URL_PRE = getURL_PRE();
let lastSizes = {} as { cols: number; rows: number };
const socket = io(URL_PRE + "terminal-message");
socket.on("connect", () => {
  console.log("terminal-message-connected");
});

type SessionType = {
  type: "terminal" | "other";
  id: string;
  context: any;
};
export function Sessions({ setSessionCount = undefined }) {
  //   const [activeKey, setActiveKey] = useState("1");
  const [num, setNum] = useState(0);
  function refresh() {
    setNum((num) => num + 1);
  }

  useEffect(() => {
    (async () => {
      // await call("OpenTerminal", []);
    })();
  }, [])

  useEffect(() => {
    async function OpenTerminal(terminalID) {

      console.log("Received message:", terminalID);
      let sssion = {
        type: "terminal" as const,
        id: terminalID,
        context: {} as any,
      };
      data.current.sessions.push(sssion);
      data.current.activeKey = terminalID;
      refresh();
      await sleep(500);
      const terminalRef = document.getElementById(
        "terminal-" + terminalID,
      ) as HTMLDivElement;
      if (!terminalRef) {
        console.error("Terminal element not found");
        return;
      }
      const xterm = new Terminal({
        cols: 80,
        rows: 30,
        cursorBlink: true,
        fontSize: 12,
        // fontFamily: ,
      });
      xterm.attachCustomKeyEventHandler((event) => {
        // xterm.
        return true; // Allow other keys to propagate
      });

      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);
      xterm.loadAddon(new WebLinksAddon());
      const clipboardAddon = new ClipboardAddon();


      xterm.loadAddon(clipboardAddon);
      xterm.open(terminalRef);
      await sleep(500);
      xterm.onResize((size) => {
        console.log("Resized to: ", size.cols, size.rows);
        lastSizes = size;
        socket.emit("terminal-receive", {
          terminalID: terminalID,
          type: "resize",
          data: size,
        });
      });

      fitAddon.fit();
      window.onresize = () => {
        setTimeout(() => {
          fitAddon.fit();
        }, 1000);
      };

      EVENT.on("chatspace-resize", () => {
        setTimeout(() => {
          fitAddon.fit();
        }, 1000);
      });

      xterm.onData(function (data) {
        // console.log("xterm onData: ", data);
        socket.emit("terminal-receive", {
          terminalID: terminalID,
          data: data,
        });
      });
      sssion.context.xterm = xterm;
      sssion.context.fitAddon = fitAddon;
      sssion.context.xtermdata = "";
    }
    socket.on("open-terminal", (m) => {
      OpenTerminal(m.terminalID);
    });
    let sessionObj = {};

    socket.on("terminal-send", async (m) => {
      if (m.type == "execute-status-change") {
        if (m.data.status == 1) {
          setSessionCount(1)
        } else {
          setSessionCount(0)
        }
        return;
      }
      // console.log("terminal-send: ", m.data);
      let sssion = data.current.sessions.find((x) => x.id == m.terminalID);
      if (sessionObj[m.terminalID] == undefined) {
        sessionObj[m.terminalID] = {
          xtermdata: "",
          timer: 0
        };
      }
      sessionObj[m.terminalID].xtermdata += m.data;
      clearTimeout(sessionObj[m.terminalID].timer);
      if (sssion && sssion.context.xterm) {

      } else {
        sessionObj[m.terminalID].timer = setTimeout(() => {
          // console.log("terminal-send2: ", sessionObj[m.terminalID].xtermdata);
          if (sssion && sssion.context.xterm) {
            sssion.context.xterm.write(sessionObj[m.terminalID].xtermdata);
            sessionObj[m.terminalID].xtermdata = "";
          }
        }, 1000);
        return;
      }
      // console.log("terminal-send2: ", sessionObj[m.terminalID].xtermdata);

      sssion.context.xterm.write(sessionObj[m.terminalID].xtermdata);
      sessionObj[m.terminalID].xtermdata = "";
    });
    socket.on("close-terminal", async (m) => {
      // console.log("close-terminal:", m);
      let sssion = data.current.sessions.find((x) => x.id == m.terminalID);
      if (sssion) {
        data.current.sessions = data.current.sessions.filter(
          (x) => x.id != m.terminalID,
        );
        refresh();
      }
    });
    setTimeout(async () => {
      let terminalIDs = await call("GetTerminals", []);
      for (let id of terminalIDs) {
        await OpenTerminal(id);
      }
      if (terminalIDs.length == 0) {
        await call("OpenTerminal", []);
      }
    }, 1000);


  }, []);
  const data = useRef({
    sessions: [] as SessionType[],
    activeKey: "",
  });

  return (
    <div className="my-tabs">
      <Tabs
        type="editable-card"
        activeKey={data.current.activeKey}
        onChange={(key) => {
          data.current.activeKey = key;
          refresh();
          call("ActiveAITerminal", [key]);
          let session = data.current.sessions.find((x) => { return x.id == key });
          if (session) {
            // console.log("session", session);

            setTimeout(() => {
              session.context.fitAddon.fit();
            }, 1000);
          }
        }}
        // hideAdd
        onEdit={(targetKey, action: "add" | "remove") => {
          if (action === "add") {
            call("OpenTerminal", []);
          } else {
            data.current.sessions = data.current.sessions.filter(
              (x) => x.id != targetKey,
            );
            refresh();
            call("CloseTerminal", [targetKey],);
          }
        }}
        items={data.current.sessions.map((x) => {
          if (x.type == "terminal") {
            return {
              label: t`Terminal` + "-" + x.id,
              key: x.id,
              closable: true,
              children: (
                <Dropdown menu={{
                  items: [
                    {
                      label: t`Copy`,
                      key: 'Copy',
                      icon: <CopyOutlined />,
                    },
                    {
                      label: t`Parse`,
                      key: 'Parse',
                      icon: <SnippetsOutlined />,
                    },
                    {
                      label: t`Clear`,
                      key: 'Clear',
                      icon: <ClearOutlined />,
                    },
                  ],
                  onClick: (e) => {
                    if (e.key == "Copy") {
                      let sssion = data.current.sessions.find((x) => x.id == x.id);
                      if (sssion && sssion.context.xterm) {
                        let selection = sssion.context.xterm.getSelection();
                        if (selection) {
                          navigator.clipboard.writeText(selection).then(() => {
                            console.log("Copied to clipboard:", selection);
                          }).catch(err => {
                            console.error("Failed to copy:", err);
                          });
                        }
                      }
                    }
                    if (e.key == "Parse") {
                      navigator.clipboard.readText().then((txt) => {
                        socket.emit("terminal-receive", {
                          terminalID: x.id,
                          data: txt,
                        });
                        console.log("Read to clipboard:", txt);
                      }).catch(err => {
                        console.error("Failed to Read:", err);
                      });
                    }
                    if (e.key == "Clear") {
                      socket.emit("terminal-receive", {
                        terminalID: x.id,
                        data: "clear\r",
                      });
                    }
                  }

                }} trigger={['contextMenu']}>

                  <div
                    id={"terminal-" + x.id}
                    style={{ height: "calc(-155px + 100vh)", minWidth: "400px" }}
                  ></div>
                </Dropdown>
              ),
            };
          } else {
            return {
              label: "Other",
              key: x.id,
              children: <div>Other</div>,
            };
          }
        })}
      />
    </div>
  );
}
