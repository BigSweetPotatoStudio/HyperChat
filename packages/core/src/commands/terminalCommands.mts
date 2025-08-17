import { getWorkspaceManager } from "../workspace/index.mjs";
import { getWorkspaceTerminal, findWorkspaceTerminalByTerminalId } from "../workspace/tools/index.mjs";

/**
 * 终端管理相关命令
 * 包含终端的创建、关闭、操作等功能
 */
export const terminalCommands = {

  /**
   * 打开终端
   * @returns 终端ID
   */
  async OpenTerminal() {
    const workspaceManager = getWorkspaceManager();
    const workspacePath = workspaceManager.getCurrentWorkspace().workspacePath;
    const terminal = getWorkspaceTerminal(workspacePath);
    const terminalInstance = await terminal.createTerminal(workspacePath);
    return terminalInstance.id;
  },

  /**
   * 获取所有终端
   * @returns 终端ID列表
   */
  async GetTerminals() {
    const workspaceManager = getWorkspaceManager();
    const workspacePath = workspaceManager.getCurrentWorkspace().workspacePath;
    const terminal = getWorkspaceTerminal(workspacePath);
    const allTerminals = terminal.getAllTerminals();
    // 由于现在每个工作区有独立的终端管理器，直接返回所有终端
    return allTerminals.map(t => t.id);
  },

  /**
   * 关闭终端
   * @param TerminalID 终端ID
   * @returns 关闭结果
   */
  async CloseTerminal({
    TerminalID
  }: {
    TerminalID: string;
  }) {
    // 在单工作区架构下，直接使用当前工作区的终端管理器
    const terminal = findWorkspaceTerminalByTerminalId(parseInt(TerminalID));
    if (terminal) {
      return terminal.closeTerminal(parseInt(TerminalID));
    }
    return false;
  },

  /**
   * 激活AI终端
   * @param TerminalID 终端ID
   * @returns 激活结果
   */
  async ActiveAITerminal({
    TerminalID
  }: {
    TerminalID: string;
  }) {
    // 在单工作区架构下，直接使用当前工作区的终端管理器
    const terminal = findWorkspaceTerminalByTerminalId(parseInt(TerminalID));
    if (terminal) {
      return terminal.setActiveTerminal(parseInt(TerminalID));
    }
    return false;
  }

};