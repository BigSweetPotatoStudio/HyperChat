import React, { useState, useEffect, useRef } from "react";
import { Card, Input, Button, Space, Select, Tag, Typography, message } from "antd";
import { 
  PlayCircleOutlined, 
  ClearOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  SettingOutlined 
} from "@ant-design/icons";
import { t } from "../i18n";
import { call } from "../common/call";

const { TextArea } = Input;
const { Text } = Typography;

// 生成唯一ID的函数
let uniqueIdCounter = 0;
const generateUniqueId = () => {
  uniqueIdCounter++;
  return `${Date.now()}-${uniqueIdCounter}`;
};

interface TerminalOutput {
  id: string;
  type: "input" | "output" | "error";
  content: string;
  timestamp: number;
}

interface TerminalInstance {
  id: number;
  name: string;
  workingDirectory: string;
  createdAt: number;
  isActive: boolean;
}

interface TerminalComponentProps {
  workspacePath: string;
  className?: string;
}

export function TerminalComponent({ 
  workspacePath, 
  className = "" 
}: TerminalComponentProps) {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<number | null>(null);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [terminalOutput, setTerminalOutput] = useState<TerminalOutput[]>([]);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  // 添加输出到终端
  const addOutput = (type: "input" | "output" | "error", content: string) => {
    const newOutput: TerminalOutput = {
      id: generateUniqueId(),
      type,
      content,
      timestamp: Date.now(),
    };
    
    setTerminalOutput(prev => [...prev, newOutput]);
    setTimeout(scrollToBottom, 100);
  };

  // 创建新终端
  const createTerminal = async () => {
    try {
      const terminalId = await call("OpenTerminal", {});
      const newTerminal: TerminalInstance = {
        id: terminalId,
        name: `Terminal ${terminals.length + 1}`,
        workingDirectory: workspacePath,
        createdAt: Date.now(),
        isActive: true,
      };
      
      setTerminals(prev => [...prev, newTerminal]);
      setActiveTerminalId(terminalId);
      setTerminalOutput([]);
      
      addOutput("output", `Terminal ${newTerminal.name} created (ID: ${terminalId})`);
      addOutput("output", `Working directory: ${newTerminal.workingDirectory}`);
      addOutput("output", `Ready to execute commands...`);
    } catch (error) {
      message.error(`Failed to create terminal: ${error}`);
      addOutput("error", `Failed to create terminal: ${error}`);
    }
  };

  // 删除终端
  const deleteTerminal = async (terminalId: number) => {
    try {
      await call("CloseTerminal", { TerminalID: terminalId.toString() });
      setTerminals(prev => prev.filter(t => t.id !== terminalId));
      
      if (activeTerminalId === terminalId) {
        const remainingTerminals = terminals.filter(t => t.id !== terminalId);
        if (remainingTerminals.length > 0) {
          setActiveTerminalId(remainingTerminals[0].id);
        } else {
          setActiveTerminalId(null);
          setTerminalOutput([]);
        }
      }
      addOutput("output", `Terminal ${terminalId} closed`);
    } catch (error) {
      message.error(`Failed to close terminal: ${error}`);
      addOutput("error", `Failed to close terminal: ${error}`);
    }
  };

  // 切换活动终端
  const switchTerminal = async (terminalId: number) => {
    try {
      await call("ActiveAITerminal", { TerminalID: terminalId.toString() });
      setActiveTerminalId(terminalId);
      // 这里可以加载该终端的历史输出
      setTerminalOutput([]);
      addOutput("output", `Switched to terminal ${terminalId}`);
    } catch (error) {
      message.error(`Failed to switch terminal: ${error}`);
      addOutput("error", `Failed to switch terminal: ${error}`);
    }
  };

  // 执行命令 - 目前为模拟实现，实际的命令执行需要通过MCP工具
  const executeCommand = async () => {
    if (!currentInput.trim() || !activeTerminalId) return;
    
    setIsExecuting(true);
    addOutput("input", `$ ${currentInput}`);
    
    try {
      // 模拟命令执行
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟不同类型的输出
      if (currentInput.includes("error")) {
        addOutput("error", "Command failed: simulated error");
      } else if (currentInput.includes("ls")) {
        addOutput("output", "file1.txt\nfile2.js\nfolder1/\nfolder2/");
      } else if (currentInput.includes("pwd")) {
        addOutput("output", workspacePath);
      } else if (currentInput.includes("echo")) {
        const echoText = currentInput.replace("echo", "").trim();
        addOutput("output", echoText);
      } else {
        addOutput("output", `Command executed: ${currentInput}\n[Simulation mode - real terminal execution via MCP not yet implemented]`);
      }
    } catch (error) {
      addOutput("error", `Error: ${error}`);
    } finally {
      setIsExecuting(false);
      setCurrentInput("");
    }
  };

  // 清空终端输出
  const clearTerminal = () => {
    setTerminalOutput([]);
    addOutput("output", "Terminal cleared");
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // 载入现有终端
  const loadExistingTerminals = async () => {
    try {
      const terminalIds = await call("GetTerminals", {});
      if (terminalIds && terminalIds.length > 0) {
        const loadedTerminals = terminalIds.map((id: number, index: number) => ({
          id,
          name: `Terminal ${index + 1}`,
          workingDirectory: workspacePath,
          createdAt: Date.now(),
          isActive: index === 0,
        }));
        setTerminals(loadedTerminals);
        setActiveTerminalId(terminalIds[0]);
        addOutput("output", `Loaded ${terminalIds.length} existing terminals`);
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

  // 初始化时载入现有终端或创建新终端
  useEffect(() => {
    loadExistingTerminals();
  }, []);

  // 渲染输出项
  const renderOutputItem = (output: TerminalOutput) => {
    const color = output.type === "error" ? "#ff4d4f" : 
                 output.type === "input" ? "#52c41a" : 
                 "#ffffff";
    
    return (
      <div key={output.id} className="mb-1">
        <Text 
          style={{ color, fontFamily: "monospace", fontSize: "12px" }}
          className="whitespace-pre-wrap"
        >
          {output.content}
        </Text>
      </div>
    );
  };

  return (
    <div className={`h-full ${className}`}>
      <Card
        title={
          <Space>
            <span>{t`Terminal`}</span>
            <Tag color="blue">{terminals.length}</Tag>
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
            />
            <Button
              type="text"
              icon={<ClearOutlined />}
              size="small"
              onClick={clearTerminal}
              disabled={!activeTerminalId}
              title={t`Clear Terminal`}
            />
          </Space>
        }
      >
      <div className="flex flex-col h-full">
        {/* 终端选择器 */}
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

        {/* 终端输出区域 */}
        <div 
          ref={outputRef}
          className="flex-1 p-2 overflow-y-auto"
          style={{ 
            fontFamily: "monospace", 
            fontSize: "13px",
            minHeight: "200px",
            maxHeight: "400px",
            backgroundColor: "#000000",
            color: "#ffffff"
          }}
        >
          {terminalOutput.map(renderOutputItem)}
          {isExecuting && (
            <div className="mb-1">
              <Text style={{ color: "#faad14", fontFamily: "monospace", fontSize: "12px" }}>
                Executing...
              </Text>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="p-2 border-t">
          <Space.Compact style={{ width: "100%" }}>
            <Input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t`Enter command...`}
              disabled={!activeTerminalId || isExecuting}
              prefix="$"
              style={{ fontFamily: "monospace" }}
            />
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={executeCommand}
              disabled={!currentInput.trim() || !activeTerminalId || isExecuting}
              loading={isExecuting}
            >
              {t`Run`}
            </Button>
          </Space.Compact>
        </div>
      </div>
      </Card>
    </div>
  );
}