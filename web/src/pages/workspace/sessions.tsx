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
import { sleep } from "../../common/sleep";
import { LaptopOutlined } from "@ant-design/icons";
import { t } from "../../i18n";
import { EVENT } from "../../common/event";

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
    let URL_PRE = getURL_PRE();

    const socket = io(URL_PRE + "terminal-message");
    socket.on("connect", () => {
      console.log("terminal-message-connected");
    });
    socket.on("open-terminal", async (m: any) => {
      console.log("Received message:", m);
      let uid = v4();
      let sssion = {
        type: "terminal" as const,
        id: m.terminalID,
        uid,
        context: {} as any,
      };
      data.current.sessions.push(sssion);
      setSessionCount(data.current.sessions.length);
      data.current.activeKey = uid;
      refresh();
      await sleep(500);
      const terminalRef = document.getElementById(
        "terminal-" + m.terminalID,
      ) as HTMLDivElement;
      if (!terminalRef) {
        console.error("Terminal element not found");
        return;
      }
      const xterm = new Terminal({
        cols: 80,
        rows: 30,
      });
      sssion.context.xterm = xterm;
      const fitAddon = new FitAddon();
      xterm.loadAddon(fitAddon);
      xterm.loadAddon(new WebLinksAddon());
      xterm.open(terminalRef);
      fitAddon.fit();
      window.onresize = () => {
        setTimeout(() => {
          fitAddon.fit();
        }, 500);
      };
      let first = true;
      EVENT.on("chatspace-resize", () => {
        setTimeout(() => {
          fitAddon.fit();
          // if (first) {
          //   first = false;
          //   socket.emit("terminal-receive", {
          //     terminalID: m.terminalID,
          //     data: "clear\r",
          //   });
          // }
        }, 500);
      });
      xterm.onData(function (data) {
        // console.log(data);
        socket.emit("terminal-receive", {
          terminalID: m.terminalID,
          data: data,
        });
      });
    });
    let xtermdata = "";
    socket.on("terminal-send", async (m) => {
      //   console.log("Received terminal-send message:", m);
      let sssion = data.current.sessions.find((x) => x.id == m.terminalID);
      while (!sssion || !sssion.context.xterm) {
        await sleep(1000);
        sssion = data.current.sessions.find((x) => x.id == m.terminalID);
        xtermdata += m.data;
      }
      sssion.context.xterm.write(xtermdata + m.data);
      xtermdata = "";
    });
    socket.on("onClose-terminal", async (m) => {
      //   console.log("Received terminal-send message:", m);
      let sssion = data.current.sessions.find((x) => x.id == m.terminalID);
      if (sssion) {
        data.current.sessions = data.current.sessions.filter(
          (x) => x.id != m.terminalID,
        );
        setSessionCount(data.current.sessions.length);
        refresh();
      }
    });
    setTimeout(() => {
      call("OpenTerminal", []);
    }, 1000);


  }, []);
  const data = useRef({
    sessions: [] as {
      type: "terminal" | "other";
      id: string;
      uid: string;
      context: any;
    }[],
    activeKey: "",
  });

  return (
    <div style={{ height: "500px", minWidth: "500px" }}>
      <Tabs
        type="editable-card"
        activeKey={data.current.activeKey}
        onChange={(key) => {
          data.current.activeKey = key;
          refresh();
        }}
        hideAdd
        // onEdit={(targetKey, action: "add" | "remove") => {
        //   if (action === "add") {
        //     add();
        //   } else {
        //     remove(targetKey);
        //   }
        // }}
        items={data.current.sessions.map((x) => {
          if (x.type == "terminal") {
            return {
              label: t`Terminal` + "-" + x.id,
              key: x.uid,
              closable: false,
              children: (
                <div
                  id={"terminal-" + x.id}
                //   style={{ height: "500px", width: "1000px"  }}
                ></div>
              ),
            };
          } else {
            return {
              label: "Other",
              key: x.uid,
              children: <div>Other</div>,
            };
          }
        })}
      />
    </div>
  );
}
