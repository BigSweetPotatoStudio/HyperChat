import os from "os";
import * as pty from "node-pty";
import { EventEmitter } from "events";
import { Logger } from "../../log.mjs";
import type { TerminalMessage, TerminalMessageExtended } from "../../shared/types.mjs";
import { getMessageService } from "../../message_service.mjs";

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";

export interface TerminalInstance {
  id: number;
  terminal: pty.IPty;
  workingDirectory: string;
  createdAt: number;
  isActive: boolean;
  output: string;
}

export class WorkspaceTerminal extends EventEmitter {
  private terminals: Map<number, TerminalInstance> = new Map();
  private nextTerminalId: number = 1;
  private activeTerminalId: number | null = null;

  constructor() {
    super();
    Logger.info("WorkspaceTerminal initialized");
    this.setupMessageHandling();
  }

  /**
   * 设置消息处理
   */
  private setupMessageHandling(): void {
    const messageService = getMessageService();
    
    // 监听来自前端的终端消息
    const handleTerminalMessage = (msg: TerminalMessage) => {
      if (msg.type === "resize") {
        const resizeData = msg.data as { cols: number; rows: number };
        this.resize(msg.terminalID!, resizeData.cols, resizeData.rows);
      } else if (typeof msg.data === "string") {
        this.sendInput(msg.terminalID!, msg.data);
      }
    };

    messageService.addTerminalMsgListener(handleTerminalMessage);
  }

  /**
   * 创建新的终端实例
   */
  createTerminal(workingDirectory?: string): TerminalInstance {
    const cwd = workingDirectory || process.env.HOME || os.homedir();
    
    const terminal = pty.spawn(shell, [], {
      name: "xterm-color",
      cols: 80,
      rows: 30,
      cwd,
      env: process.env,
      useConpty: os.platform() === "win32",
    });

    const terminalInstance: TerminalInstance = {
      id: this.nextTerminalId,
      terminal,
      workingDirectory: cwd,
      createdAt: Date.now(),
      isActive: true,
      output: "",
    };

    // 监听终端输出
    terminal.onData((data) => {
      terminalInstance.output += data;
      
      // 发送到前端
      getMessageService().terminalMsg.emit("terminal-send", {
        terminalID: terminalInstance.id,
        data,
      });
      
      this.emit("output", {
        terminalID: terminalInstance.id,
        type: "output",
        data,
        timestamp: Date.now(),
      });
    });

    // 监听终端退出
    terminal.onExit((code) => {
      Logger.info(`Terminal ${terminalInstance.id} exited with code: ${code}`);
      this.terminals.delete(terminalInstance.id);
      
      if (this.activeTerminalId === terminalInstance.id) {
        this.activeTerminalId = null;
      }
      
      // 发送关闭消息到前端
      getMessageService().terminalMsg.emit("close-terminal", {
        terminalID: terminalInstance.id,
      });
      
      this.emit("exit", {
        terminalID: terminalInstance.id,
        type: "exit",
        data: code,
        timestamp: Date.now(),
      });
    });

    this.terminals.set(terminalInstance.id, terminalInstance);
    this.activeTerminalId = terminalInstance.id;
    this.nextTerminalId++;

    Logger.info(`Terminal ${terminalInstance.id} created with working directory: ${cwd}`);
    
    // 发送打开消息到前端
    getMessageService().terminalMsg.emit("open-terminal", {
      terminalID: terminalInstance.id,
      terminals: Array.from(this.terminals.keys()),
    });
    
    this.emit("create", {
      terminalID: terminalInstance.id,
      type: "create",
      data: {
        workingDirectory: cwd,
        id: terminalInstance.id,
      },
      timestamp: Date.now(),
    });

    return terminalInstance;
  }

  /**
   * 获取终端实例
   */
  getTerminal(terminalId: number): TerminalInstance | undefined {
    return this.terminals.get(terminalId);
  }

  /**
   * 获取所有终端实例
   */
  getAllTerminals(): TerminalInstance[] {
    return Array.from(this.terminals.values());
  }

  /**
   * 获取活动终端
   */
  getActiveTerminal(): TerminalInstance | undefined {
    return this.activeTerminalId ? this.terminals.get(this.activeTerminalId) : undefined;
  }

  /**
   * 设置活动终端
   */
  setActiveTerminal(terminalId: number): boolean {
    if (this.terminals.has(terminalId)) {
      this.activeTerminalId = terminalId;
      Logger.info(`Active terminal set to ${terminalId}`);
      return true;
    }
    return false;
  }

  /**
   * 向终端发送输入
   */
  sendInput(terminalId: number, input: string): boolean {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.terminal.write(input);
      Logger.info(`Input sent to terminal ${terminalId}: ${input.trim()}`);
      return true;
    }
    return false;
  }

  /**
   * 向活动终端发送输入
   */
  sendInputToActive(input: string): boolean {
    if (this.activeTerminalId) {
      return this.sendInput(this.activeTerminalId, input);
    }
    return false;
  }

  /**
   * 调整终端大小
   */
  resize(terminalId: number, cols: number, rows: number): boolean {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.terminal.resize(cols, rows);
      Logger.info(`Terminal ${terminalId} resized to ${cols}x${rows}`);
      return true;
    }
    return false;
  }

  /**
   * 关闭终端
   */
  closeTerminal(terminalId: number): boolean {
    const terminal = this.terminals.get(terminalId);
    if (terminal) {
      terminal.terminal.kill();
      this.terminals.delete(terminalId);
      
      if (this.activeTerminalId === terminalId) {
        // 如果关闭的是活动终端，选择另一个终端作为活动终端
        const remainingTerminals = Array.from(this.terminals.keys());
        this.activeTerminalId = remainingTerminals.length > 0 ? remainingTerminals[0]! : null;
      }
      
      // 发送关闭消息到前端
      getMessageService().terminalMsg.emit("close-terminal", {
        terminalID: terminalId,
      });
      
      Logger.info(`Terminal ${terminalId} closed`);
      return true;
    }
    return false;
  }

  /**
   * 清理所有终端
   */
  cleanup(): void {
    for (const [terminalId, terminal] of this.terminals) {
      terminal.terminal.kill();
      Logger.info(`Terminal ${terminalId} killed during cleanup`);
    }
    this.terminals.clear();
    this.activeTerminalId = null;
    Logger.info("All terminals cleaned up");
  }

  /**
   * 获取终端状态信息
   */
  getStatus(): {
    totalTerminals: number;
    activeTerminalId: number | null;
    terminals: {
      id: number;
      workingDirectory: string;
      createdAt: number;
      isActive: boolean;
    }[];
  } {
    return {
      totalTerminals: this.terminals.size,
      activeTerminalId: this.activeTerminalId,
      terminals: Array.from(this.terminals.values()).map(terminal => ({
        id: terminal.id,
        workingDirectory: terminal.workingDirectory,
        createdAt: terminal.createdAt,
        isActive: terminal.id === this.activeTerminalId,
      })),
    };
  }
}

// 单例实例
let workspaceTerminal: WorkspaceTerminal | null = null;

export function getWorkspaceTerminal(): WorkspaceTerminal {
  if (!workspaceTerminal) {
    workspaceTerminal = new WorkspaceTerminal();
  }
  return workspaceTerminal;
}