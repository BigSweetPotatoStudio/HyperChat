import { EventEmitter } from "events";
import { Logger } from "../../log.mjs";

/**
 * 禁用的终端实现 - 保持接口兼容但不执行实际操作
 * 
 * 原始文件已重命名为 terminal.mts.disabled
 * 如需启用终端功能，请：
 * 1. 删除此文件
 * 2. 将 terminal.mts.disabled 重命名为 terminal.mts
 * 3. 在 package.json 中添加 node-pty 依赖
 */

export interface TerminalInstance {
  id: number;
  terminal: any; // 空对象
  workingDirectory: string;
  createdAt: number;
  isActive: boolean;
  output: string;
}

export class WorkspaceTerminal extends EventEmitter {
  constructor(workspacePath: string) {
    super();
    Logger.warn(`WorkspaceTerminal DISABLED for workspace: ${workspacePath}`);
  }

  createTerminal(_workingDirectory?: string): TerminalInstance {
    const mockId = Date.now() + Math.floor(Math.random() * 1000);
    Logger.warn(`Terminal creation DISABLED, returning mock terminal ${mockId}`);
    return {
      id: mockId,
      terminal: {},
      workingDirectory: _workingDirectory || process.cwd(),
      createdAt: Date.now(),
      isActive: false,
      output: "",
    };
  }

  getTerminal(_terminalId: number): TerminalInstance | undefined {
    return undefined;
  }

  getAllTerminals(): TerminalInstance[] {
    return [];
  }

  getActiveTerminal(): TerminalInstance | undefined {
    return undefined;
  }

  setActiveTerminal(_terminalId: number): boolean {
    return false;
  }

  sendInput(_terminalId: number, _input: string): boolean {
    return false;
  }

  sendInputToActive(_input: string): boolean {
    return false;
  }

  resize(_terminalId: number, _cols: number, _rows: number): boolean {
    return false;
  }

  closeTerminal(_terminalId: number): boolean {
    return false;
  }

  cleanup(): void {
    // 无操作
  }

  getStatus() {
    return {
      totalTerminals: 0,
      activeTerminalId: null,
      terminals: [],
    };
  }
}

const workspaceTerminals: Map<string, WorkspaceTerminal> = new Map();

export function getWorkspaceTerminal(workspacePath?: string): WorkspaceTerminal {
  const key = workspacePath || "default";
  if (!workspaceTerminals.has(key)) {
    workspaceTerminals.set(key, new WorkspaceTerminal(key));
  }
  return workspaceTerminals.get(key)!;
}

export function getAllWorkspaceTerminals(): WorkspaceTerminal[] {
  return Array.from(workspaceTerminals.values());
}

export function findWorkspaceTerminalByTerminalId(_terminalId: number): WorkspaceTerminal | undefined {
  return undefined;
}