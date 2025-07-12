import React, { useState, useEffect, useRef } from "react";
import { Tabs, Button, Space, Tag, Typography, message, Dropdown } from "antd";
import {
  ClearOutlined,
  CopyOutlined,
  SnippetsOutlined
} from "@ant-design/icons";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { io, Socket } from "socket.io-client";
import { t } from "../i18n";
import { call, getURL_PRE, getWebSocket } from "../common/call";
import { useForceUpdate } from "../hooks/useForceUpdate";
import "@xterm/xterm/css/xterm.css";
import { set } from "zod";

const { Text } = Typography;

interface TerminalSession {
  type: "terminal";
  id: number;
  context: {
    xterm?: Terminal;
    fitAddon?: FitAddon;
    xtermdata?: string;
  };
}

interface TerminalComponentProps {
  workspacePath: string;
  className?: string;
}

let socket: Socket | null = null;
let lastSizes = {} as { cols: number; rows: number };

export function TerminalComponent({
  workspacePath,
  className = ""
}: TerminalComponentProps) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const refresh = useForceUpdate();

  const data = useRef({
    sessions: [] as TerminalSession[],
    activeKey: "",
  });

  // 初始化Socket连接
  useEffect(() => {
    (async () => {
      socket = await getWebSocket();
      setIsConnected(socket.connected);
    })();

  }, []);

  // 创建终端实例
  async function createTerminalInstance(terminalID: number) {
    console.log("Creating terminal instance:", terminalID);

    const session: TerminalSession = {
      type: "terminal",
      id: terminalID,
      context: {},
    };

    data.current.sessions.push(session);
    data.current.activeKey = terminalID.toString();
    refresh();

    // 等待DOM渲染
    await new Promise(resolve => setTimeout(resolve, 500));

    const terminalRef = document.getElementById(`terminal-${terminalID}`) as HTMLDivElement;
    if (!terminalRef) {
      console.error("Terminal element not found");
      return;
    }

    // 创建xterm实例
    const xterm = new Terminal({
      cols: 80,
      rows: 30,
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#ffffff',
      },
    });

    xterm.attachCustomKeyEventHandler((event) => {
      return true; // Allow other keys to propagate
    });

    // 加载插件
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());
    const clipboardAddon = new ClipboardAddon();
    xterm.loadAddon(clipboardAddon);

    // 绑定到DOM
    xterm.open(terminalRef);

    await new Promise(resolve => setTimeout(resolve, 500));

    // 监听大小变化
    xterm.onResize((size) => {
      // console.log("Terminal resized:", terminalID, size.cols, size.rows);
      lastSizes = size;
      if (socket) {
        socket.emit("terminalReceive", {
          terminalID: terminalID,
          type: "resize",
          data: size,
          workspacePath: workspacePath,
        });
      }
    });

    fitAddon.fit();

    // 创建ResizeObserver来自动调整大小
    const resizeObserver = new ResizeObserver((e) => {
      // console.log("ResizeObserver triggered for terminal:", e);
      if (e.length === 0) { return; }
      if (e[0]!.contentRect.width === 0 || e[0]!.contentRect.height === 0) {
        return; // 忽略无效的尺寸
      }
      // setTimeout(() => {
      fitAddon.fit();
      // }, 1000);
    });
    resizeObserver.observe(terminalRef);

    // 监听用户输入
    xterm.onData((data) => {
      if (socket) {
        socket.emit("terminalReceive", {
          terminalID: terminalID,
          data: data,
          workspacePath: workspacePath,
        });
      }
    });

    // 更新session上下文
    session.context.xterm = xterm;
    session.context.fitAddon = fitAddon;
    session.context.xtermdata = "";

    console.log("Xterm initialized for terminal:", terminalID);
  }

  // 设置事件监听
  useEffect(() => {
    if (!socket) return;

    // 监听新终端打开
    socket.on("open-terminal", (m) => {
      if (m.workspacePath === workspacePath) {
        createTerminalInstance(m.terminalID);
      }
    });

    let sessionObj = {};

    // 监听终端数据
    socket.on("terminal-send", async (m) => {
      if (m.workspacePath !== workspacePath) {
        return;
      }

      if (m.type === "execute-status-change") {
        // 可以在这里处理执行状态变化
        return;
      }

      let session = data.current.sessions.find((x) => x.id == m.terminalID);
      if (!sessionObj[m.terminalID]) {
        sessionObj[m.terminalID] = {
          xtermdata: "",
          timer: 0
        };
      }

      sessionObj[m.terminalID].xtermdata += m.data;
      clearTimeout(sessionObj[m.terminalID].timer);

      if (session && session.context.xterm) {
        session.context.xterm.write(sessionObj[m.terminalID].xtermdata);
        sessionObj[m.terminalID].xtermdata = "";
      } else {
        sessionObj[m.terminalID].timer = setTimeout(() => {
          if (session && session.context.xterm) {
            session.context.xterm.write(sessionObj[m.terminalID].xtermdata);
            sessionObj[m.terminalID].xtermdata = "";
          }
        }, 1000);
      }
    });

    // 监听终端关闭
    socket.on("close-terminal", async (m) => {
      if (m.workspacePath !== workspacePath) {
        return;
      }

      let session = data.current.sessions.find((x) => x.id == m.terminalID);
      if (session) {
        data.current.sessions = data.current.sessions.filter(
          (x) => x.id != m.terminalID,
        );
        refresh();
      }
    });

    // 初始化加载现有终端
    setTimeout(async () => {
      try {
        const terminalIDs = await call("GetTerminals");
        if (terminalIDs && terminalIDs.length > 0) {
          for (const id of terminalIDs) {
            await createTerminalInstance(id);
          }
        } else {
          // 创建新终端
          await call("OpenTerminal");
        }
      } catch (error) {
        console.error("Failed to load terminals:", error);
        message.error(`Failed to load terminals: ${error}`);
      }
    }, 1000);

  }, [workspacePath, socket]);

  // 切换终端
  const handleTabChange = async (key: string) => {
    data.current.activeKey = key;
    refresh();

    try {
      await call("ActiveAITerminal", { TerminalID: key });
      // const session = data.current.sessions.find((x) => x.id.toString() === key);
      // if (session && session.context.fitAddon) {
      //   setTimeout(() => {
      //     session.context.fitAddon?.fit();
      //   }, 100);
      // }
    } catch (error) {
      message.error(`Failed to switch terminal: ${error}`);
    }
  };

  // 处理标签页编辑（添加/删除）
  const handleTabEdit = async (targetKey: string | React.MouseEvent | React.KeyboardEvent, action: "add" | "remove") => {
    if (action === "add") {
      try {
        await call("OpenTerminal");
      } catch (error) {
        message.error(`Failed to create terminal: ${error}`);
      }
    } else {
      try {
        data.current.sessions = data.current.sessions.filter(
          (x) => x.id.toString() !== targetKey,
        );
        refresh();
        await call("CloseTerminal", { TerminalID: targetKey as string });
      } catch (error) {
        message.error(`Failed to close terminal: ${error}`);
      }
    }
  };

  // 获取右键菜单
  const getContextMenu = (terminalId: number) => ({
    items: [
      {
        label: t`Copy`,
        key: 'Copy',
        icon: <CopyOutlined />,
      },
      {
        label: t`Paste`,
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
      if (e.key === "Copy") {
        const session = data.current.sessions.find((x) => x.id === terminalId);
        if (session && session.context.xterm) {
          const selection = session.context.xterm.getSelection();
          if (selection) {
            navigator.clipboard.writeText(selection).then(() => {
              message.success(t`Copied to clipboard`);
            }).catch(err => {
              message.error(`Failed to copy: ${err}`);
            });
          }
        }
      }

      if (e.key === "Parse") {
        navigator.clipboard.readText().then((txt) => {
          if (socket) {
            socket.emit("terminalReceive", {
              terminalID: terminalId,
              data: txt,
              workspacePath: workspacePath,
            });
          }
        }).catch(err => {
          message.error(`Failed to paste: ${err}`);
        });
      }

      if (e.key === "Clear") {
        if (socket) {
          socket.emit("terminalReceive", {
            terminalID: terminalId,
            data: "clear\r",
            workspacePath: workspacePath,
          });
        }
      }
    }
  });

  return (
    <div className={`h-full ${className}`}>
      {/* <div className="flex items-center justify-between p-2 border-b">
        <Space>
          <span>{t`Terminal`}</span>
          <Tag color={isConnected ? "green" : "red"}>
            {data.current.sessions.length}
          </Tag>
          {!isConnected && (
            <Tag color="orange">{t`Disconnected`}</Tag>
          )}
        </Space>
      </div> */}

      <div style={{ height: "calc(100% - 48px)" }}>
        <Tabs
          tabBarExtraContent={{
            right: (
              <Space>
                <span>{t`Terminal`}</span>
                <Tag color={isConnected ? "green" : "red"}>
                  {data.current.sessions.length}
                </Tag>
                {!isConnected && (
                  <Tag color="orange">{t`Disconnected`}</Tag>
                )}
              </Space>
            )
          }}
          type="editable-card"
          activeKey={data.current.activeKey}
          onChange={handleTabChange}
          onEdit={handleTabEdit}
          hideAdd={!isConnected}
          items={data.current.sessions.map((session) => ({
            label: `${t`Terminal`}-${session.id}`,
            key: session.id.toString(),
            closable: data.current.sessions.length > 1,
            children: (
              <Dropdown
                menu={getContextMenu(session.id)}
                trigger={['contextMenu']}
              >
                <div
                  id={`terminal-${session.id}`}
                  style={{
                    height: "calc(100vh - 150px)",
                    minWidth: "400px",
                    width: "100%"
                  }}
                />
              </Dropdown>
            ),
          }))}
          tabBarStyle={{
            margin: '0 8px',
            borderBottom: '1px solid #f0f0f0'
          }}
        />
      </div>
    </div>
  );
}