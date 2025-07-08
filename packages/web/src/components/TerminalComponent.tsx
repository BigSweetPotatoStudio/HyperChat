import React, { useState, useEffect, useRef } from "react";
import { Card, Input, Button, Space, Select, Tag, Typography, message, Dropdown } from "antd";
import { 
  PlayCircleOutlined, 
  ClearOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  SettingOutlined,
  CopyOutlined,
  SnippetsOutlined
} from "@ant-design/icons";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { io, Socket } from "socket.io-client";
import { t } from "../i18n";
import { call, getURL_PRE } from "../common/call";
import "@xterm/xterm/css/xterm.css";

const { Text } = Typography;

// 生成唯一ID的函数
let uniqueIdCounter = 0;
const generateUniqueId = () => {
  uniqueIdCounter++;
  return `${Date.now()}-${uniqueIdCounter}`;
};

interface TerminalInstance {
  id: number;
  name: string;
  workingDirectory: string;
  createdAt: number;
  isActive: boolean;
  xterm?: Terminal;
  fitAddon?: FitAddon;
  element?: HTMLDivElement;
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
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const terminalsRef = useRef<Map<number, TerminalInstance>>(new Map());

  // 初始化Socket连接
  useEffect(() => {
    if (!socket) {
      const URL_PRE = getURL_PRE();
      socket = io(URL_PRE + "/terminal-message");
      
      socket.on("connect", () => {
        console.log("terminal-message-connected");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("terminal-message-disconnected");
        setIsConnected(false);
      });

      // 监听新终端打开
      socket.on("open-terminal", (m) => {
        console.log("Received open-terminal:", m.terminalID);
        createTerminalInstance(m.terminalID);
      });

      // 监听终端数据
      socket.on("terminal-send", (m) => {
        if (m.type === "execute-status-change") {
          // 可以在这里处理执行状态变化
          return;
        }
        
        const terminal = terminalsRef.current.get(m.terminalID);
        if (terminal && terminal.xterm) {
          terminal.xterm.write(m.data);
        }
      });

      // 监听终端关闭
      socket.on("close-terminal", (m) => {
        console.log("Received close-terminal:", m.terminalID);
        handleTerminalClosed(m.terminalID);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // 创建真实的xterm终端实例
  const createTerminalInstance = async (terminalId: number) => {
    const newTerminal: TerminalInstance = {
      id: terminalId,
      name: `Terminal ${terminals.length + 1}`,
      workingDirectory: workspacePath,
      createdAt: Date.now(),
      isActive: true,
    };

    setTerminals(prev => {
      const updated = [...prev, newTerminal];
      return updated;
    });
    setActiveTerminalId(terminalId);
    terminalsRef.current.set(terminalId, newTerminal);

    // 等待DOM元素创建
    setTimeout(() => {
      initializeXterm(terminalId);
    }, 100);
  };

  // 初始化xterm实例
  const initializeXterm = (terminalId: number) => {
    const terminalElement = document.getElementById(`terminal-${terminalId}`) as HTMLDivElement;
    if (!terminalElement) {
      console.error("Terminal element not found for ID:", terminalId);
      return;
    }

    const terminal = terminalsRef.current.get(terminalId);
    if (!terminal) {
      console.error("Terminal instance not found for ID:", terminalId);
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

    // 加载插件
    const fitAddon = new FitAddon();
    xterm.loadAddon(fitAddon);
    xterm.loadAddon(new WebLinksAddon());
    const clipboardAddon = new ClipboardAddon();
    xterm.loadAddon(clipboardAddon);

    // 绑定到DOM
    xterm.open(terminalElement);

    // 设置自动调整大小
    setTimeout(() => {
      fitAddon.fit();
    }, 100);

    // 监听大小变化
    xterm.onResize((size) => {
      console.log("Terminal resized:", terminalId, size.cols, size.rows);
      lastSizes = size;
      if (socket) {
        socket.emit("terminalReceive", {
          terminalID: terminalId,
          type: "resize",
          data: size,
        });
      }
    });

    // 监听用户输入
    xterm.onData((data) => {
      if (socket) {
        socket.emit("terminalReceive", {
          terminalID: terminalId,
          data: data,
        });
      }
    });

    // 创建ResizeObserver来自动调整大小
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
    });
    resizeObserver.observe(terminalElement);

    // 更新终端实例
    terminal.xterm = xterm;
    terminal.fitAddon = fitAddon;
    terminal.element = terminalElement;
    terminalsRef.current.set(terminalId, terminal);

    console.log("Xterm initialized for terminal:", terminalId);
  };

  // 创建新终端
  const createTerminal = async () => {
    try {
      await call("OpenTerminal", { workingDirectory: workspacePath });
      // 终端会通过WebSocket事件自动创建
    } catch (error) {
      message.error(`Failed to create terminal: ${error}`);
    }
  };

  // 删除终端
  const deleteTerminal = async (terminalId: number) => {
    try {
      await call("CloseTerminal", { TerminalID: terminalId.toString() });
      // 终端会通过WebSocket事件自动删除
    } catch (error) {
      message.error(`Failed to close terminal: ${error}`);
    }
  };

  // 处理终端关闭
  const handleTerminalClosed = (terminalId: number) => {
    const terminal = terminalsRef.current.get(terminalId);
    if (terminal && terminal.xterm) {
      terminal.xterm.dispose();
    }
    
    terminalsRef.current.delete(terminalId);
    setTerminals(prev => prev.filter(t => t.id !== terminalId));
    
    if (activeTerminalId === terminalId) {
      const remainingTerminals = Array.from(terminalsRef.current.keys());
      if (remainingTerminals.length > 0) {
        setActiveTerminalId(remainingTerminals[0]!);
      } else {
        setActiveTerminalId(null);
      }
    }
  };

  // 切换活动终端
  const switchTerminal = async (terminalId: number) => {
    try {
      await call("ActiveAITerminal", { TerminalID: terminalId.toString() });
      setActiveTerminalId(terminalId);
      
      // 重新调整大小
      const terminal = terminalsRef.current.get(terminalId);
      if (terminal && terminal.fitAddon) {
        setTimeout(() => {
          terminal.fitAddon?.fit();
        }, 100);
      }
    } catch (error) {
      message.error(`Failed to switch terminal: ${error}`);
    }
  };

  // 清空终端
  const clearTerminal = (terminalId: number) => {
    if (socket) {
      socket.emit("terminalReceive", {
        terminalID: terminalId,
        data: "clear\r",
      });
    }
  };

  // 复制选中内容
  const copySelection = (terminalId: number) => {
    const terminal = terminalsRef.current.get(terminalId);
    if (terminal && terminal.xterm) {
      const selection = terminal.xterm.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection).then(() => {
          message.success(t`Copied to clipboard`);
        }).catch(err => {
          message.error(`Failed to copy: ${err}`);
        });
      }
    }
  };

  // 粘贴剪贴板内容
  const pasteFromClipboard = (terminalId: number) => {
    navigator.clipboard.readText().then((text) => {
      if (socket) {
        socket.emit("terminalReceive", {
          terminalID: terminalId,
          data: text,
        });
      }
    }).catch(err => {
      message.error(`Failed to paste: ${err}`);
    });
  };

  // 载入现有终端
  const loadExistingTerminals = async () => {
    try {
      const terminalIds = await call("GetTerminals", { workingDirectory: workspacePath });
      if (terminalIds && terminalIds.length > 0) {
        for (const id of terminalIds) {
          await createTerminalInstance(id);
        }
      } else {
        // 如果没有现有终端，创建一个新的
        await createTerminal();
      }
    } catch (error) {
      console.error("Failed to load existing terminals:", error);
      // 如果加载失败，创建一个新的终端
      await createTerminal();
    }
  };

  // 初始化
  useEffect(() => {
    // 延迟加载，确保Socket连接建立
    setTimeout(() => {
      loadExistingTerminals();
    }, 1000);
  }, []);

  // 渲染终端右键菜单
  const getContextMenu = (terminalId: number) => ({
    items: [
      {
        label: t`Copy`,
        key: 'copy',
        icon: <CopyOutlined />,
        onClick: () => copySelection(terminalId),
      },
      {
        label: t`Paste`,
        key: 'paste',
        icon: <SnippetsOutlined />,
        onClick: () => pasteFromClipboard(terminalId),
      },
      {
        label: t`Clear`,
        key: 'clear',
        icon: <ClearOutlined />,
        onClick: () => clearTerminal(terminalId),
      },
    ],
  });

  return (
    <div className={`h-full ${className}`}>
      <Card
        title={
          <Space>
            <span>{t`Terminal`}</span>
            <Tag color={isConnected ? "green" : "red"}>
              {terminals.length}
            </Tag>
            {!isConnected && (
              <Tag color="orange">{t`Disconnected`}</Tag>
            )}
          </Space>
        }
        size="small"
        className="h-full"
        bodyStyle={{ padding: 0, height: "calc(100% - 48px)" }}
        extra={
          <Space>
            <Button
              type="text"
              icon={<PlusOutlined />}
              size="small"
              onClick={createTerminal}
              title={t`New Terminal`}
              disabled={!isConnected}
            />
          </Space>
        }
      >
        <div className="flex flex-col h-full">
          {/* 终端选择器 */}
          {terminals.length > 1 && (
            <div className="p-2 border-b">
              <Space>
                <Select
                  value={activeTerminalId}
                  onChange={(value) => switchTerminal(value)}
                  size="small"
                  style={{ minWidth: 120 }}
                  placeholder={t`Select Terminal`}
                >
                  {terminals.map(terminal => (
                    <Select.Option key={terminal.id} value={terminal.id}>
                      {terminal.name}
                    </Select.Option>
                  ))}
                </Select>
                {activeTerminalId && (
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    size="small"
                    onClick={() => deleteTerminal(activeTerminalId)}
                    disabled={terminals.length <= 1}
                    title={t`Delete Terminal`}
                  />
                )}
              </Space>
            </div>
          )}

          {/* 终端显示区域 */}
          <div className="flex-1 relative">
            {terminals.map(terminal => (
              <Dropdown
                key={terminal.id}
                menu={getContextMenu(terminal.id)}
                trigger={['contextMenu']}
              >
                <div
                  id={`terminal-${terminal.id}`}
                  style={{
                    height: "100%",
                    width: "100%",
                    display: terminal.id === activeTerminalId ? "block" : "none",
                  }}
                />
              </Dropdown>
            ))}
            
            {terminals.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <Space direction="vertical" align="center">
                  <span>{t`No terminals available`}</span>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={createTerminal}
                    disabled={!isConnected}
                  >
                    {t`Create Terminal`}
                  </Button>
                </Space>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}