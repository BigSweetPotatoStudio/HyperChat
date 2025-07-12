import { CONST } from "./const.mjs";
import { Logger } from "./log.mjs";
import { createClient, shellPathSync, zx } from "./es6.mjs";
const { fs, os, path } = zx;
import { isPortUse } from "./common/checkport.mjs";
import { getLocalIP, spawnWithOutput } from "./common/util.mjs";
import {
  ChatHistoryItem,
  MCPServerConfig,
  Task,
  IMCPClient,
} from "@hyperchat/shared/types";
import { AgentConfig, DirectoryItem } from "@hyperchat/shared/types";
import { appDataDir } from "./const.mjs";
import crypto from "crypto";
// MCP管理现在直接通过workspace实例进行
// import { progressList } from "./common/progress.mts.bak";

import { EVENT } from "./common/event.mjs";
// import { callAgent, runTask, startTask, stopTask } from "./mcp/task.mjs";
import * as cron from "node-cron";

import { Config } from "./const.mjs";
import dayjs from "dayjs";
import * as vm from "node:vm";
import { getWorkspaceTerminal, findWorkspaceTerminalByTerminalId } from "./workspace/tools/index.mjs";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { getWorkspaceManager, workspaceManager } from "./workspace/index.mjs";
import { getAppSettingsManager, isAppSettingsManagerInitialized, AppSettingsManager } from "./data/index.mjs";
import { refreshRoutes } from "./mcpGateWay.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * command.mts 是 HyperChat 后端的业务调度核心：
 * - 封装所有与前端交互的命令（如配置、MCP 客户端、任务、文件、剪贴板等）
 * - 通过 CommandFactory 类对外暴露方法，供主进程和 HTTP 服务调用
 * - 支持自动启动、WebDAV、知识库、AI 任务流等多种后端能力
 * - 依赖大量工具模块和数据结构，代码量大，建议分块阅读
 */

export const { createRequire } = await import(
  /* webpackIgnore: true */ "module"
);

// CommandFactory 类封装了 HyperChat 命令行/服务端的主要操作，包括 MCP 客户端管理、文件操作、剪贴板、自动启动等
export class CommandFactory {

  /**
   * 强制重新加载全局MCP配置文件
   * 停止所有全局MCP客户端，重新读取配置文件，然后重新启动
   * 用于在配置文件被外部修改时同步更新
   * @returns 返回重新加载后的客户端列表
   */
  async forceReloadMcpClients() {
    try {
      // 获取全局工作区路径（~/Documents/HyperChat）
      const workspaceManager = getWorkspaceManager();
      const globalWorkspacePath = workspaceManager.getGlobalWorkspacePath();

      // 委托给工作区特定的重新加载方法
      return await this.forceReloadWorkspaceMcpClients();
    } catch (error) {
      console.error("Failed to force reload MCP clients:", error);
      throw error;
    }
  }


  /**
   * 在指定工作区中启动或重启 MCP 客户端
   * 适用于所有工作区（包括全局工作区）
   * @param workspacePath 工作区路径
   * @param clientName MCP客户端名称
   * @param clientConfig MCP服务器配置（可选，用于添加新客户端）
   * @returns 操作结果
   */
  async startWorkspaceMcpClient({
    clientName,
    clientConfig
  }: {
    clientName: string;
    clientConfig?: MCPServerConfig;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      if (clientConfig) {
        // 如果提供了配置，先设置配置再启动
        await workspace.setMcpServer(clientName, clientConfig);
      } else {
        // 如果没有配置，尝试重启现有客户端
        await workspace.manageMcpClient(clientName, 'restart');
      }

      return {
        success: true,
        clientName
      };
    } catch (error) {
      console.error(`Failed to start MCP client ${clientName}:`, error);
      throw error;
    }
  }

  /**
   * 管理全局范围的 MCP 客户端生命周期（兼容性方法）
   * @deprecated 已废弃，请使用 manageWorkspaceMcpClient 方法
   */
  async closeMcpClients({
    clientName,
    isdelete,
    isdisable
  }: {
    clientName: string;
    isdelete?: boolean;
    isdisable?: boolean;
  }) {
    // 委托给新的工作区特定方法
    const workspaceManager = getWorkspaceManager();
    const globalWorkspacePath = workspaceManager.getGlobalWorkspacePath();
    
    let action: 'restart' | 'disable' | 'delete' = 'restart';
    if (isdelete) action = 'delete';
    else if (isdisable) action = 'disable';

    return await this.manageWorkspaceMcpClient({
      clientName,
      action
    });
  }

  /**
   * 管理指定工作区的 MCP 客户端生命周期
   * 这是推荐的统一客户端管理方法，支持所有工作区（包括全局）
   * @param workspacePath 工作区路径
   * @param clientName MCP客户端名称
   * @param action 操作类型：
   *   - 'restart': 重启客户端（先停止再启动）
   *   - 'stop': 停止客户端服务，保留配置
   *   - 'delete': 永久删除客户端配置并停止服务
   * @returns 操作结果
   */
  async manageWorkspaceMcpClient({
    clientName,
    action
  }: {
    clientName: string;
    action: 'restart' | 'disable' | 'delete';
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      await workspace.manageMcpClient(clientName, action);

      return {
        success: true,
        action,
        clientName
      };
    } catch (error) {
      console.error(`Failed to ${action} MCP client ${clientName}:`, error);
      throw error;
    }
  }

  // ========== MCP 客户端管理方法总结 ==========
  // 
  // 新单工作区架构下的推荐方法：
  // - manageWorkspaceMcpClient(): 统一的单客户端管理（推荐）
  // - startWorkspaceMcpClient(): 启动/重启单个客户端
  // - stopWorkspaceMcpClients(): 停止当前工作区所有客户端
  // - startWorkspaceMcpClients(): 启动当前工作区所有客户端
  // - forceReloadWorkspaceMcpClients(): 重新加载工作区MCP配置
  // 
  // 底层使用单例MCP管理器，支持工作区切换时自动清理和重建
  // (packages/core/src/workspace/mcp/index.mts)
  // 
  // 废弃的方法（向后兼容）：
  // - closeMcpClients(): 旧的全局客户端管理（已废弃）
  // - openMcpClient(): 旧的全局客户端启动（已废弃）
  //
  
  /**
   * 调用指定 MCP 客户端的工具函数
   * 用于执行 MCP 服务提供的各种功能（如文件操作、系统调用等）
   * @param name MCP客户端名称（如 hyper_tools、knowledge_base 等）
   * @param functionName 要调用的工具函数名称
   * @param args 传递给工具函数的参数对象
   * @returns 工具函数的执行结果
   * @throws 如果指定的MCP客户端不存在或工具调用失败
   */
  async mcpCallTool({
    name,
    functionName,
    args
  }: {
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const allClients = workspaceManager.getGlobalWorkspace().getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }

    // 执行工具调用并返回结果
    return await client.callTool(functionName, args);
  }
  /**
   * 调用指定工作区的 MCP 客户端工具函数
   * 用于执行指定工作区中 MCP 服务提供的各种功能（如文件操作、系统调用等）
   * @param workspacePath 工作区路径
   * @param name MCP客户端名称（如 hyper_tools、knowledge_base 等）
   * @param functionName 要调用的工具函数名称
   * @param args 传递给工具函数的参数对象
   * @returns 工具函数的执行结果
   * @throws 如果指定的MCP客户端不存在或工具调用失败
   */
  async mcpCallToolWithWorkspace({
    workspacePath,
    name,
    functionName,
    args
  }: {
    workspacePath: string;
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    // 从指定工作区的MCP客户端中查找指定名称的客户端
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      throw new Error(`Workspace "${workspacePath}" not found`);
    }
    const allClients = workspace.getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found in workspace "${workspacePath}"`);
    }

    // 执行工具调用并返回结果
    return await client.callTool(functionName, args);
  }
  /**
   * 获取指定 MCP 客户端的资源内容
   * 用于访问 MCP 服务提供的各种资源（如文件内容、数据等）
   * @param name MCP客户端名称
   * @param uri 资源URI（格式由具体MCP服务定义）
   * @returns 资源的内容数据
   * @throws 如果指定的MCP客户端不存在或资源访问失败
   */
  async mcpCallResource({
    name,
    uri
  }: {
    name: string;
    uri: string;
  }) {
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const allClients = workspaceManager.getGlobalWorkspace().getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }

    // 获取指定URI的资源内容
    return await client.callResource(uri);
  }
  /**
   * 获取指定工作区的 MCP 客户端资源内容
   * 用于访问指定工作区中 MCP 服务提供的各种资源（如文件内容、数据等）
   * @param workspacePath 工作区路径
   * @param name MCP客户端名称
   * @param uri 资源URI（格式由具体MCP服务定义）
   * @returns 资源的内容数据
   * @throws 如果指定的MCP客户端不存在或资源访问失败
   */
  async mcpCallResourceWithWorkspace({
    workspacePath,
    name,
    uri
  }: {
    workspacePath: string;
    name: string;
    uri: string;
  }) {
    // 从指定工作区的MCP客户端中查找指定名称的客户端
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      throw new Error(`Workspace "${workspacePath}" not found`);
    }
    const allClients = workspace.getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found in workspace "${workspacePath}"`);
    }

    // 获取指定URI的资源内容
    return await client.callResource(uri);
  }
  /**
   * 调用指定 MCP 客户端的提示模板
   * 用于获取预定义的提示内容，通常用于AI对话或任务执行
   * @param name MCP客户端名称
   * @param functionName 提示模板函数名称
   * @param args 传递给提示模板的参数
   * @returns 渲染后的提示内容
   * @throws 如果指定的MCP客户端不存在或提示调用失败
   */
  async mcpCallPrompt({
    name,
    functionName,
    args
  }: {
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const allClients = workspaceManager.getGlobalWorkspace().getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
    }

    // 调用提示模板并返回渲染结果
    return await client.callPrompt(functionName, args);
  }
  /**
   * 调用指定工作区的 MCP 客户端提示模板
   * 用于获取指定工作区中预定义的提示内容，通常用于AI对话或任务执行
   * @param workspacePath 工作区路径
   * @param name MCP客户端名称
   * @param functionName 提示模板函数名称
   * @param args 传递给提示模板的参数
   * @returns 渲染后的提示内容
   * @throws 如果指定的MCP客户端不存在或提示调用失败
   */
  async mcpCallPromptWithWorkspace({
    workspacePath,
    name,
    functionName,
    args
  }: {
    workspacePath: string;
    name: string;
    functionName: string;
    args: Record<string, unknown>;
  }) {
    // 从指定工作区的MCP客户端中查找指定名称的客户端
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      throw new Error(`Workspace "${workspacePath}" not found`);
    }
    const allClients = workspace.getMcpClients();
    let client = allClients.find((x) => x.serverName === name);

    if (!client) {
      throw new Error(`MCP client "${name}" not found in workspace "${workspacePath}"`);
    }

    // 调用提示模板并返回渲染结果
    return await client.callPrompt(functionName, args);
  }
  /**
   * 生成处理后的文件路径
   * 在原文件名中添加 ".processed" 后缀，用于标识已处理的文件
   * @param filePath 原始文件路径
   * @returns 处理后的文件路径（例："file.txt" -> "file.processed.txt"）
   */
  async processedFilePath({
    filePath
  }: {
    filePath: string;
  }): Promise<string> {
    // 解析文件路径的各个组成部分
    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath);
    const extName = path.extname(baseName);
    const fileName = path.basename(baseName, extName);

    // 在文件名和扩展名之间添加 ".processed" 标识
    const newFileName = `${fileName}.processed${extName}`;

    // 返回完整的处理后路径
    return path.join(dirName, newFileName);
  }
  /**
   * 获取应用数据存储目录路径
   * @returns 应用数据目录的绝对路径
   */
  async getAppDataDir(): Promise<string> {
    return appDataDir;
  }
  /**
   * 读取指定目录下的所有文件和子目录名称
   * @param path 相对于 root 的目录路径
   * @param root 根目录，默认为应用数据目录
   * @returns 目录中所有项目的名称数组
   */
  async readDir({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string[]> {
    // 拼接完整路径并确保目录存在
    p = path.join(root, p);
    await fs.ensureDir(p);
    return await fs.readdir(p);
  }
  /**
   * 删除指定的文件或目录
   * @param path 相对于 root 的文件或目录路径
   * @param root 根目录，默认为应用数据目录
   */
  async removeFile({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<void> {
    // 拼接完整路径并执行删除操作
    p = path.join(root, p);
    return await fs.remove(p);
  }
  /**
   * 写入文本内容到指定文件
   * 如果目标文件不存在则创建，存在则覆盖
   * @param path 相对于 root 的文件路径
   * @param text 要写入的文本内容
   * @param root 根目录，默认为应用数据目录
   */
  async writeFile({
    path: p,
    text,
    root = appDataDir
  }: {
    path: string;
    text: string;
    root?: string;
  }): Promise<void> {
    // 拼接完整路径并写入文件
    let localPath = path.join(root, p);
    await fs.writeFile(localPath, text);
  }
  /**
   * 读取指定文件的文本内容
   * @param path 相对于 root 的文件路径
   * @param root 根目录，默认为应用数据目录
   * @returns 文件的UTF-8编码文本内容
   * @throws 如果文件不存在或无法读取
   */
  async readFile({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string> {
    // 拼接完整路径并读取文件内容
    p = path.join(root, p);
    try {
      let r = await fs.readFile(p, "utf-8");
      return r;
    } catch (e) {
      throw e;
    }
  }
  /**
   * 读取并解析JSON文件
   * @param path 相对于 root 的JSON文件路径
   * @param root 根目录，默认为应用数据目录
   * @returns 解析后的JavaScript对象
   * @throws 如果文件不存在、无法读取或JSON格式错误
   */
  async readJSON({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<Record<string, unknown>> {
    // 拼接完整路径并读取JSON文件
    p = path.join(root, p);
    try {
      let r = await fs.readJSON(p);
      return r;
    } catch (e) {
      throw e;
    }
  }
  /**
   * 将JavaScript对象序列化为JSON并写入文件
   * @param path 相对于 root 的JSON文件路径
   * @param obj 要序列化的JavaScript对象
   * @param root 根目录，默认为应用数据目录
   */
  async writeJSON({
    path: p,
    obj,
    root = appDataDir
  }: {
    path: string;
    obj: Record<string, unknown>;
    root?: string;
  }): Promise<void> {
    // 拼接完整路径并写入格式化的JSON文件
    p = path.join(root, p);
    try {
      await fs.writeJSON(p, obj, {
        spaces: 2,      // 2个空格缩进以便阅读
        encoding: "utf-8",
      });
    } catch (e) {
      throw e;
    }
  }
  /**
   * 检查指定路径的文件或目录是否存在
   * @param path 相对于 root 的文件或目录路径
   * @param root 根目录，默认为应用数据目录
   * @returns 如果路径存在返回true，否则返回false
   */
  async exists({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<boolean> {
    // 拼接完整路径并检查存在性
    p = path.join(root, p);
    return await fs.existsSync(p);
  }

  /**
   * 拼接路径并确保父目录存在
   * @param path 相对路径
   * @param root 根目录，默认为应用数据目录
   * @returns 拼接后的完整路径
   */
  async pathJoin({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string> {
    // 如果指定了根目录，则拼接路径
    if (root) {
      p = path.join(root, p);
    }
    // 确保父目录存在（递归创建）
    await fs.ensureDir(path.dirname(p));
    return p;
  }
  async getLocalIP(): Promise<string[]> {
    return getLocalIP();
  }
  async isPortUse({
    port
  }: {
    port: number;
  }): Promise<boolean> {
    return isPortUse(port);
  }

  // async vectorStoreAdd({
  //   store: s,
  //   resource: r,
  //   move = false
  // }: {
  //   store: KnowledgeStore;
  //   resource: KnowledgeResource;
  //   move?: boolean;
  // }) {
  //   return await store.addResource(s, r, move);
  // }
  // async vectorStoreDelete({
  //   store: s
  // }: {
  //   store: KnowledgeStore;
  // }) {

  //   return await store.delete(s);
  // }
  // async vectorStoreRemoveResource({
  //   store: s,
  //   resource: r
  // }: {
  //   store: KnowledgeStore;
  //   resource: KnowledgeResource;
  // }) {

  //   return await store.removeResource(s, r);
  // }
  // async vectorStoreSearch({
  //   store: s,
  //   query: q,
  //   k
  // }: {
  //   store: KnowledgeStore;
  //   query: string;
  //   k: number;
  // }) {

  //   return await store.search(s, q, k);
  // // }

  async call_agent_res({
    uid,
    data,
    error
  }: {
    uid: string;
    data: unknown;
    error: unknown;
  }) {
    EVENT.fire("call_agent_res_" + uid, { uid, data, error });
  }
  async checkTask({
    task
  }: {
    task?: Task;
  }) {
    if (task && cron.validate(task.cron)) {
    } else {
      throw new Error("cron Error");
    }
  }
  // async startTask({
  //   taskkey
  // }: {
  //   taskkey?: string;
  // } = {}) {
  //   return startTask(taskkey);
  // }
  // async stopTask({
  //   taskkey
  // }: {
  //   taskkey?: string;
  // } = {}) {
  //   return stopTask(taskkey);
  // }
  // async runTask({
  //   taskkey
  // }: {
  //   taskkey: string;
  // }) {
  //   return runTask(taskkey, { force: true });
  // }
  // async callAgent({
  //   command,
  //   agentName
  // }: {
  //   command: string;
  //   agentName: string;
  // }) {
  //   let AgentsData = await Agents.init();
  //   let agent = AgentsData.data.find((x) => x.name === agentName);
  //   if (!agent) {
  //     throw new Error(`Agent not found: ${agentName}`);
  //   }
  //   return callAgent({
  //     agentKey: agent.key,
  //     message: command,
  //     type: "call",
  //   });
  // }
  async saveTempFile({ txt, ext }: { txt: string; ext: string }): Promise<string> {
    // let filePath = path.join(os.tmpdir(), "temp.txt");
    // md5(txt) + ext;
    const hash = crypto
      .createHash("sha256")
      .update(txt)
      .digest("hex");
    let filename = hash + "." + ext;

    let filePath = path.join(appDataDir, "temp", filename);
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, txt);
    return filename;
  }
  async OpenTerminal() {
    const workspaceManager = getWorkspaceManager();
    const workspacePath = workspaceManager.getCurrentWorkspacePath();
    const terminal = getWorkspaceTerminal(workspacePath);
    const terminalInstance = terminal.createTerminal(workspacePath);
    return terminalInstance.id;
  }
  async GetTerminals() {
    const workspaceManager = getWorkspaceManager();
    const workspacePath = workspaceManager.getCurrentWorkspacePath();
    const terminal = getWorkspaceTerminal(workspacePath);
    const allTerminals = terminal.getAllTerminals();
    // 由于现在每个工作区有独立的终端管理器，直接返回所有终端
    return allTerminals.map(t => t.id);
  }
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
  }
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
  async runCode({ code }: { code: string }) {
    // 1. 构造一个完整的 require（ESM 下使用 import.meta.url）
    const nativeRequire = createRequire(__filename);

    const context = {
      console,
      require: nativeRequire,
      module: { exports: {} },
      exports: {},
      process,
      Buffer,
      fetch,
      resultContainer: { value: undefined, error: undefined, done: false },
      setTimeout,
      setInterval,
    };
    vm.createContext(context); // 将普通对象转换为 vm.Context 对象
    // 在 VM 中使用动态导入
    vm.runInContext(`
  (async () => {
       try {
        ${code}
        resultContainer.value = await get();
        resultContainer.done = true;
      } catch (err) {
        resultContainer.error = err.message;
        resultContainer.done = true;
      }
  })();
`, context,
      { filename: __filename, });
    // 轮询等待结果
    while (!context.resultContainer.done) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 检查是否有错误
    if (context.resultContainer.error) {
      throw new Error(context.resultContainer.error);
    }

    return context.resultContainer.value;
  }

  // ========== 工作区管理 API ==========
  /**
   * 打开已存在的工作区
   * 检查指定目录是否已经是工作区，如果是则直接加载
   * @param workspacePath 工作区根目录的绝对路径
   * @returns 工作区配置信息，如果不是工作区则返回null
   */
  async openWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<Record<string, unknown> | null> {
    const workspaceManager = getWorkspaceManager();

    await workspaceManager.switchWorkspace(workspacePath)
    // 加载现有工作区
    const workspace = workspaceManager.getCurrentWorkspace();
    return workspace ? workspace.getConfig() : null;
  }

  /**
   * 创建或初始化新的工作区
   * 在指定目录中创建 .hyperchat 配置文件夹和必要的配置文件
   * @param workspacePath 工作区根目录的绝对路径
   * @param name 工作区显示名称，默认使用目录名
   * @param description 工作区描述信息
   * @returns 新创建的工作区配置信息
   */
  async createWorkspace({
    workspacePath,
    name,
    description
  }: {
    workspacePath: string;
    name?: string;
    description?: string;
  }): Promise<Record<string, unknown>> {
    const workspaceManager = getWorkspaceManager();

    // 如果没有提供名称，从路径提取文件夹名称作为默认名称
    const workspaceName = name || path.basename(workspacePath) || 'Workspace';

    const workspace = await workspaceManager.createWorkspace(workspacePath, workspaceName, description);
    return workspace.getConfig();
  }
  /**
   * 获取当前工作区（无参数版本，新架构）
   * @returns 当前工作区的配置信息
   */
  async getCurrentWorkspace() {
    const workspaceManager = getWorkspaceManager();
    await workspaceManager.initialize();
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) return null;

    const config = workspace.getConfig();
    const summary = await workspace.getSummary();
    const workspacePath = workspaceManager.getCurrentWorkspacePath();
    const isGlobal = workspaceManager.isGlobalWorkspace(workspacePath);

    return {
      ...config,
      path: workspacePath,
      isGlobal,
      agentsCount: summary.agentsCount,
      mcpServersCount: summary.mcpServersCount
    };
  }

  /**
   * 获取全局工作区路径
   * @returns 全局工作区路径
   */
  async getGlobalWorkspacePath() {
    const workspaceManager = getWorkspaceManager();
    return workspaceManager.getGlobalWorkspacePath();
  }

  /**
   * 获取工作区完整文件树（已废弃，建议使用 getWorkspaceDirectoryList 实现懒加载）
   * 这个方法会一次性加载整个目录树，对于大型项目可能导致性能问题
   * @returns 完整的文件树结构，如果工作区不存在则返回null
   * @deprecated 推荐使用 getWorkspaceDirectoryList 方法实现懒加载
   */
  async getWorkspaceFileTree() {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) return null;

    // 更新文件树，排除常见的构建产物目录
    await workspace.updateFileTree({
      includeHidden: false,
      maxDepth: 5,
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '.hyperchat'],
    });
    return workspace.getFileTree();
  }

  /**
   * 获取工作区指定目录的直接子项列表（懒加载方式）
   * 仅加载指定目录的直接子项，不递归加载所有子目录，适合大型项目
   * @param directoryPath 相对于工作区的目录路径，默认为根目录
   * @returns 目录项目列表，包含文件名、类型、大小、修改时间等信息
   */
  async getWorkspaceDirectoryList({
    directoryPath = ""
  }: {
    directoryPath?: string;
  } = {}) {
    const { fs, path } = zx;

    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) return [];

      // 获取当前工作区路径
      const workspacePath = workspaceManager.getCurrentWorkspacePath();

      // 构建完整路径
      const fullPath = directoryPath
        ? path.join(workspacePath, directoryPath)
        : workspacePath;

      // 检查路径是否存在且是目录
      if (!fs.existsSync(fullPath)) {
        return [];
      }

      const stats = await fs.promises.stat(fullPath);
      if (!stats.isDirectory()) {
        return [];
      }

      // 读取目录内容
      const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });



      const result: DirectoryItem[] = [];

      for (const entry of entries) {
        const isHidden = entry.name.startsWith('.');
        const isExcluded = ['node_modules', '.git', 'dist', 'build'].includes(entry.name);

        // 跳过排除的目录
        if (isExcluded) {
          continue;
        }

        const itemPath = path.join(fullPath, entry.name);
        const relativePath = directoryPath
          ? path.join(directoryPath, entry.name).replace(/\\/g, '/')
          : entry.name;

        try {
          const itemStats = await fs.promises.stat(itemPath);

          result.push({
            name: entry.name,
            path: relativePath,
            type: entry.isDirectory() ? "directory" : "file",
            size: entry.isFile() ? itemStats.size : undefined,
            modified: itemStats.mtime.getTime(),
            extension: entry.isFile() ? path.extname(entry.name).toLowerCase() : undefined,
            isLeaf: !entry.isDirectory(),
            isHidden: isHidden,
          });
        } catch (error) {
          // 忽略无法访问的文件
          continue;
        }
      }

      // 排序：目录在前，文件在后，然后按名称排序
      result.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return result;
    } catch (error) {
      console.error("Failed to list workspace directory:", error);
      return [];
    }
  }

  /**
   * 检查目录是否为工作区
   */
  async isWorkspaceDirectory({
    directoryPath
  }: {
    directoryPath: string;
  }): Promise<boolean> {
    const workspaceManager = getWorkspaceManager();
    return workspaceManager.isWorkspaceDirectory(directoryPath);
  }

  /**
   * 从目录获取工作区
   */
  // getWorkspaceFromDirectory 已删除 - 使用 isWorkspaceDirectory + openWorkspace 替代

  /**
   * 获取工作区代理列表
   */
  async getWorkspaceAgents(): Promise<Record<string, unknown>[]> {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getCurrentWorkspace();
    if (!workspace) {
      return [];
    }
    return await workspace.getAgents();
  }

  /**
   * 获取工作区 MCP 客户端
   */
  async getWorkspaceMcpClients(): Promise<IMCPClient[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        return [];
      }

      // 使用工作区实例方法获取客户端
      const clients = workspace.getMcpClients();
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error("Failed to get workspace MCP clients:", error);
      return [];
    }
  }

  /**
   * 列出服务器上的目录内容
   */
  async listServerDirectory({
    path: dirPath = "~"
  }: {
    path?: string;
  }): Promise<unknown[]> {
    const { fs, os, path } = zx;

    try {
      // 处理特殊路径
      let resolvedPath = dirPath;
      if (dirPath === "~") {
        resolvedPath = os.homedir();
      } else if (dirPath.startsWith("~/")) {
        resolvedPath = path.join(os.homedir(), dirPath.slice(2));
      }

      // 安全检查：确保路径是绝对路径
      resolvedPath = path.resolve(resolvedPath);

      // 检查路径是否存在且是目录
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`路径不存在: ${resolvedPath}`);
      }

      const stats = await fs.promises.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error(`路径不是目录: ${resolvedPath}`);
      }

      // 读取目录内容
      const entries = await fs.promises.readdir(resolvedPath, { withFileTypes: true });

      interface DirectoryItem {
        name: string;
        path: string;
        type: "directory" | "file";
        size?: number;
        modified: number;
      }

      const result: DirectoryItem[] = [];
      for (const entry of entries) {
        // 跳过隐藏文件（以 . 开头的文件）
        if (entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = path.join(resolvedPath, entry.name);
        const itemStats = await fs.promises.stat(fullPath).catch(() => null);

        if (itemStats) {
          result.push({
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? "directory" : "file",
            size: entry.isFile() ? itemStats.size : undefined,
            modified: itemStats.mtime.getTime(),
          });
        }
      }

      // 排序：目录在前，文件在后，然后按名称排序
      result.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return result;
    } catch (error: unknown) {
      console.error("Failed to list directory:", error);
      throw new Error(`无法读取目录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取服务器上的当前工作目录
   */
  async getServerCurrentDirectory(): Promise<string> {
    return process.cwd();
  }

  /**
   * 获取服务器路径的父目录
   */
  async getServerParentDirectory({
    path: targetPath
  }: {
    path: string;
  }): Promise<string> {
    const { fs, os, path } = zx;

    try {
      // 处理特殊路径
      let resolvedPath = targetPath;
      if (targetPath === "~") {
        resolvedPath = os.homedir();
      } else if (targetPath.startsWith("~/")) {
        resolvedPath = path.join(os.homedir(), targetPath.slice(2));
      }

      // 解析为绝对路径
      resolvedPath = path.resolve(resolvedPath);

      // 获取父目录
      const parentPath = path.dirname(resolvedPath);

      // 如果已经是根目录，返回自身
      if (parentPath === resolvedPath) {
        return resolvedPath;
      }

      return parentPath;
    } catch (error: unknown) {
      console.error("Failed to get parent directory:", error);
      throw new Error(`无法获取父目录: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 检查服务器路径是否存在
   */
  async checkServerPath({
    path: targetPath
  }: {
    path: string;
  }): Promise<{ exists: boolean; isDirectory: boolean; readable: boolean }> {
    const { fs, path } = zx;

    try {
      const resolvedPath = path.resolve(targetPath);
      const exists = fs.existsSync(resolvedPath);

      if (!exists) {
        return { exists: false, isDirectory: false, readable: false };
      }

      const stats = await fs.promises.stat(resolvedPath);
      const isDirectory = stats.isDirectory();

      // 检查是否可读
      let readable = true;
      try {
        await fs.promises.access(resolvedPath, fs.constants.R_OK);
      } catch {
        readable = false;
      }

      return { exists, isDirectory, readable };
    } catch (error) {
      return { exists: false, isDirectory: false, readable: false };
    }
  }

  // ========== 新的工作区 MCP 管理 API ==========

  /**
   * 启动工作区 MCP 服务
   */
  async startWorkspaceMcpClients(): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const clients = await workspace.startMcpClients();
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error('Failed to start workspace MCP clients:', error);
      throw error;
    }
  }

  /**
   * 强制重新加载工作区MCP配置
   */
  async forceReloadWorkspaceMcpClients(): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 重新加载MCP客户端（会自动停止现有服务并重新启动）
      const clients = await workspace.reloadMcpClients();
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error('Failed to force reload workspace MCP clients:', error);
      throw error;
    }
  }

  /**
   * 停止工作区所有 MCP 客户端
   * 注意：这会停止工作区中的所有客户端，如需停止单个客户端请使用 manageWorkspaceMcpClient
   */
  async stopWorkspaceMcpClients(): Promise<void> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      await workspace.stopMcpClients();
    } catch (error) {
      console.error('Failed to stop all MCP clients:', error);
      throw error;
    }
  }


  /**
   * 添加或更新工作区 MCP 服务器配置
   */
  async setWorkspaceMcpServerConfig({
    serverName,
    serverConfig
  }: {
    serverName: string;
    serverConfig: MCPServerConfig;
  }): Promise<void> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      await workspace.setMcpServer(serverName, serverConfig);
    } catch (error) {
      console.error('Failed to set MCP server config:', error);
      throw error;
    }
  }

  /**
   * 删除工作区 MCP 服务器配置
   */
  async deleteWorkspaceMcpServerConfig({
    serverName
  }: {
    serverName: string;
  }): Promise<void> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      await workspace.deleteMcpServer(serverName);
    } catch (error) {
      console.error('Failed to delete MCP server config:', error);
      throw error;
    }
  }

  // ========== Agent 管理 API ==========

  /**
   * 创建新的 Agent
   * @param workspacePath 工作区路径
   * @param config Agent 配置
   * @returns 创建的 Agent 配置
   */
  async createAgent({
    workspacePath,
    config
  }: {
    workspacePath: string;
    config: Partial<{
      key: string;
      name: string;
      prompt: string;
      description?: string;
      allowMCPs: string[];
      confirm_call_tool: boolean;
      modelKey?: string;
      temperature?: number;
      tags?: string[];
    }>;
  }): Promise<AgentConfig> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = await workspace.createAgent(config);

      if (!agentInstance) {
        throw new Error('创建 Agent 失败');
      }

      return agentInstance.getConfig();
    } catch (error) {
      console.error(`Failed to create agent for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 获取工作区中的所有 Agent
   * @param workspacePath 工作区路径
   * @returns Agent 配置列表
   */
  async getWorkspaceAgentList({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      return await workspace.getAllAgents();
    } catch (error) {
      console.error(`Failed to get agents for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 获取工作区中所有 Agent 的摘要信息
   * @returns Agent 摘要信息列表
   */
  async getWorkspaceAgentsSummary(): Promise<Record<string, unknown>[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      return await workspace.getAllAgentsSummary();
    } catch (error) {
      console.error('Failed to get agent summaries:', error);
      throw error;
    }
  }

  /**
   * 获取指定 Agent 的配置
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns Agent 配置
   */
  async getAgent({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<Record<string, unknown> | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentConfig = await workspace.getAgent(agentKey);
      return agentConfig;
    } catch (error) {
      console.error(`Failed to get agent ${agentKey} for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 更新 Agent 配置
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @param updates 更新的配置
   * @returns 更新结果
   */
  async updateAgent({
    workspacePath,
    agentKey,
    updates
  }: {
    workspacePath: string;
    agentKey: string;
    updates: Partial<{
      name: string;
      prompt: string;
      description?: string;
      allowMCPs: string[];
      confirm_call_tool: boolean;
      modelKey?: string;
      temperature?: number;
      tags?: string[];
    }>;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      return await agentInstance.updateConfig(updates);
    } catch (error) {
      console.error(`Failed to update agent ${agentKey} for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 删除 Agent
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns 删除结果
   */
  async deleteAgent({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      return await workspace.deleteAgent(agentKey);
    } catch (error) {
      console.error(`Failed to delete agent ${agentKey} for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 获取 Agent 的聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns 聊天记录列表
   */
  async getAgentChatLogs({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<{ chatLogs: ChatHistoryItem[] }> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      const chatLogs = await agentInstance.getChatLogs();
      return { chatLogs };
    } catch (error) {
      console.error(`Failed to get chat logs for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 删除 Agent 的聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @param chatKey 聊天记录键名
   * @returns 删除结果
   */
  async deleteAgentChatLog({
    workspacePath,
    agentKey,
    chatKey
  }: {
    workspacePath: string;
    agentKey: string;
    chatKey: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      return await agentInstance.deleteChatLog(chatKey);
    } catch (error) {
      console.error(`Failed to delete chat log ${chatKey} for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 清空 Agent 的所有聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @returns 清空结果
   */
  async clearAgentChatLogs({
    workspacePath,
    agentKey
  }: {
    workspacePath: string;
    agentKey: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      return await agentInstance.clearChatLogs();
    } catch (error) {
      console.error(`Failed to clear chat logs for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 保存 Agent 聊天记录
   * @param agentKey Agent 键名
   * @param chatLog 聊天记录
   * @returns 保存结果
   */
  async saveAgentChatLog({
    agentKey,
    chatLog
  }: {
    agentKey: string;
    chatLog: ChatHistoryItem;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      // 设置 agentKey 确保关联正确
      chatLog.agentKey = agentKey;
      chatLog.dateTime = Date.now();

      return await agentInstance.setChatLog(chatLog);
    } catch (error) {
      console.error(`Failed to save chat log for agent ${agentKey}:`, error);
      throw error;
    }
  }

  /**
   * 获取单个 Agent 聊天记录
   * @param workspacePath 工作区路径
   * @param agentKey Agent 键名
   * @param chatLogKey 聊天记录键名
   * @returns 聊天记录详情
   */
  async getAgentChatLog({
    workspacePath,
    agentKey,
    chatLogKey
  }: {
    workspacePath: string;
    agentKey: string;
    chatLogKey: string;
  }): Promise<ChatHistoryItem | null> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }
      const agentInstance = workspace.getAgentInstance(agentKey);
      if (!agentInstance) {
        throw new Error(`Agent 不存在: ${agentKey}`);
      }

      // 获取所有聊天记录，然后找到指定的一个
      const chatLogs = await agentInstance.getChatLogs();
      const chatLog = chatLogs.find(log => log.key === chatLogKey);

      return chatLog || null;
    } catch (error) {
      console.error(`Failed to get chat log ${chatLogKey} for agent ${agentKey} in ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 读取工作区内指定文件的内容
   */
  async readWorkspaceFile({ filePath }: { filePath: string }): Promise<string> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 获取当前工作区路径
      const workspacePath = workspaceManager.getCurrentWorkspacePath();

      // 构建完整的文件路径，确保安全性
      const fullPath = path.resolve(workspacePath, filePath);

      // 检查文件路径是否在工作区范围内（防止路径遍历攻击）
      if (!fullPath.startsWith(path.resolve(workspacePath))) {
        throw new Error(`文件路径超出工作区范围: ${filePath}`);
      }

      // 检查文件是否存在
      if (!await fs.existsSync(fullPath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 检查是否为文件（不是目录）
      const stats = await fs.stat(fullPath);
      if (!stats.isFile()) {
        throw new Error(`指定路径不是文件: ${filePath}`);
      }

      // 读取文件内容
      const content = await fs.readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Failed to read workspace file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 写入内容到工作区内指定文件
   */
  async writeWorkspaceFile({ filePath, content }: { filePath: string, content: string }): Promise<void> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();
      if (!workspace) {
        throw new Error('当前没有可用的工作区');
      }

      // 获取当前工作区路径
      const workspacePath = workspaceManager.getCurrentWorkspacePath();

      // 构建完整的文件路径，确保安全性
      const fullPath = path.resolve(workspacePath, filePath);

      // 检查文件路径是否在工作区范围内（防止路径遍历攻击）
      if (!fullPath.startsWith(path.resolve(workspacePath))) {
        throw new Error(`文件路径超出工作区范围: ${filePath}`);
      }

      // 确保目录存在
      const dirPath = path.dirname(fullPath);
      await fs.ensureDir(dirPath);

      // 写入文件内容
      await fs.writeFile(fullPath, content, 'utf8');

      console.log(`Successfully wrote file ${filePath} in current workspace`);
    } catch (error) {
      console.error(`Failed to write workspace file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * 关闭工作区
   * 关闭工作区的MCP客户端和终端实例，但不删除工作区配置
   * @param workspacePath 工作区路径
   * @returns 关闭结果
   */
  // closeWorkspace 已删除 - 新架构下不需要关闭工作区


  // getRunningWorkspaces 已删除 - 新架构下只有一个当前工作区

  /**
   * 切换到指定工作区
   * @param workspacePath 工作区路径
   * @returns 切换结果
   */
  async switchWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<boolean> {
    try {
      const workspaceManager = getWorkspaceManager();
      await workspaceManager.switchWorkspace(workspacePath);
      return true;
    } catch (error) {
      console.error("Failed to switch workspace:", error);
      throw error;
    }
  }

  /**
   * 获取工作区设置
   * @param workspacePath 工作区路径
   * @returns 工作区设置
   */
  async getWorkspaceSettings({
    workspacePath
  }: {
    workspacePath: string;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      return workspace.getSettings();
    } catch (error) {
      console.error(`Failed to get settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 更新工作区设置
   * @param workspacePath 工作区路径
   * @param updates 要更新的设置
   * @returns 更新后的设置
   */
  async updateWorkspaceSettings({
    workspacePath,
    updates
  }: {
    workspacePath: string;
    updates: Parameters<import('./data/workspaceSettingsManager.mjs').WorkspaceSettingsManager['updateSettings']>[0];
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      await workspace.updateSettings(updates);
      return workspace.getSettings();
    } catch (error) {
      console.error(`Failed to update settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 重置工作区设置
   * @param workspacePath 工作区路径
   * @returns 重置后的设置
   */
  async resetWorkspaceSettings({
    workspacePath
  }: {
    workspacePath: string;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const settingsManager = workspace.getSettingsManager();
      await settingsManager.reset();
      return settingsManager.getSettings();
    } catch (error) {
      console.error(`Failed to reset settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 导出工作区设置
   * @param workspacePath 工作区路径
   * @returns 设置的JSON字符串
   */
  async exportWorkspaceSettings({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<string> {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const settingsManager = workspace.getSettingsManager();
      return await settingsManager.export();
    } catch (error) {
      console.error(`Failed to export settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 导入工作区设置
   * @param workspacePath 工作区路径
   * @param settingsJson 设置的JSON字符串
   * @returns 导入后的设置
   */
  async importWorkspaceSettings({
    workspacePath,
    settingsJson
  }: {
    workspacePath: string;
    settingsJson: string;
  }) {
    try {
      const workspaceManager = getWorkspaceManager();
      const workspace = workspaceManager.getCurrentWorkspace();

      if (!workspace) {
        throw new Error(`工作区不存在: ${workspacePath}`);
      }

      const settingsManager = workspace.getSettingsManager();
      await settingsManager.import(settingsJson);
      return settingsManager.getSettings();
    } catch (error) {
      console.error(`Failed to import settings for workspace ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 获取应用设置
   * @returns 应用设置
   */
  async getAppSettings() {
    try {
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

      const appSettingsManager = getAppSettingsManager();
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to get app settings:", error);
      throw error;
    }
  }

  /**
   * 更新应用设置
   * @param updates 要更新的设置
   * @returns 更新后的设置
   */
  async updateAppSettings({ updates }: { updates: Parameters<AppSettingsManager['updateSettings']>[0] }) {
    try {
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

      const appSettingsManager = getAppSettingsManager();
      await appSettingsManager.updateSettings(updates);
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to update app settings:", error);
      throw error;
    }
  }

  /**
   * 重置应用设置
   * @returns 重置后的设置
   */
  async resetAppSettings() {
    try {
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

      const appSettingsManager = getAppSettingsManager();
      await appSettingsManager.reset();
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to reset app settings:", error);
      throw error;
    }
  }

  /**
   * 导出应用设置
   * @returns 设置的JSON字符串
   */
  async exportAppSettings(): Promise<string> {
    try {
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

      const appSettingsManager = getAppSettingsManager();
      return await appSettingsManager.export();
    } catch (error) {
      console.error("Failed to export app settings:", error);
      throw error;
    }
  }

  /**
   * 导入应用设置
   * @param settingsJson 设置的JSON字符串
   * @returns 导入后的设置
   */
  async importAppSettings({ settingsJson }: { settingsJson: string }) {
    try {
      if (!isAppSettingsManagerInitialized()) {
        throw new Error("应用设置管理器未初始化");
      }

      const appSettingsManager = getAppSettingsManager();
      await appSettingsManager.import(settingsJson);
      return appSettingsManager.getSettings();
    } catch (error) {
      console.error("Failed to import app settings:", error);
      throw error;
    }
  }

  /**
   * 刷新 MCP 网关路由
   * 通知 HTTP 服务器重新加载 MCP 网关配置
   */
  async refreshMcpRoutes(): Promise<void> {
    try {
      EVENT.fire('refreshMCPRoutes');
      // 或者通过事件机制通知 HTTP 服务器
      // 由于前端通过 call 调用，这个方法会被自动代理到前端
      Logger.info('MCP routes refresh requested');
    } catch (error) {
      Logger.error('Failed to refresh MCP routes:', error);
      throw error;
    }
  }

}
// export const Command = CommandFactory.prototype;
export const Command = new CommandFactory();
// Define interface with all methods from CommandFactory plus the additional method
