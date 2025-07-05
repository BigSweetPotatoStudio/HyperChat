import { CONST } from "./const.mjs";
import { Logger } from "./log.mjs";
import { createClient, shellPathSync, zx } from "./es6.mjs";
const { fs, os, path } = zx;
import { isPortUse } from "./common/checkport.mjs";
import { getLocalIP, spawnWithOutput } from "./common/util.mjs";
import {
  Agents,
  ChatHistory,
  ChatHistoryItem,
  LocalSetting,
  MCPServerConfig,
  MyMessage,
  Task,
  KnowledgeResource,
  KnowledgeStore,
} from "./shared/data.mjs";
import { appDataDir } from "./const.mjs";
import crypto from "crypto";
// import {
//   closeMcpClients,
//   getMcpClients,
//   initMcpClients,
//   openMcpClient,
// } from "./mcp/config.mjs";
import { 
  getMCPManager,
  initMCPManager,
  getWorkspaceMCPClients as getWorkspaceMCPClientsFromManager
} from "./workspace/mcp/index.mjs";
import { webdavClient } from "./common/webdav.mjs";
import { progressList } from "./common/progress.mjs";

import { EVENT } from "./common/event.mjs";
// import { callAgent, runTask, startTask, stopTask } from "./mcp/task.mjs";
import { getMyDefaultEnvironment } from "./mcp/utils.mjs";
import * as cron from "node-cron";
import { store } from "./rag/vectorStore.mjs";
import { Config } from "./const.mjs";
import { clientPaths } from "./mcp/claude.mjs";
import dayjs from "dayjs";
import * as vm from "node:vm";
import { ActiveAITerminal, CloseTerminal, GetTerminals, OpenTerminal } from "./mcp/servers/terminal/terminal.mjs";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { getWorkspaceManager } from "./workspace/index.mjs";

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
  // 获取应用配置
  async getConfig() {
    return {
      version: CONST.getVersion,
      appDataDir: appDataDir,
      logPath: Logger.path,
      password: (await LocalSetting.init()).password,
      claudeConfigPath: clientPaths.claude,
      ...Config
    };
  }
  /**
   * 初始化全局范围的 MCP 客户端
   * 启动内置 MCP 服务（hyper_tools、knowledge_base、settings、agent、terminal）
   * 以及全局工作区配置的自定义 MCP 服务
   * @returns 返回所有已启动客户端的JSON格式信息
   */
  async initMcpClients() {
    // 初始化工作区MCP管理器
    const manager = await initMCPManager();
    
    // 获取全局工作区路径并启动MCP客户端
    const workspaceManager = getWorkspaceManager();
    const globalWorkspacePath = workspaceManager.getGlobalWorkspacePath();
    await manager.startClients(globalWorkspacePath);
    
    // 获取所有客户端并转换为前端可用的JSON格式
    const clients = manager.getAllClients();
    return clients.map((client) => client.toJSON());
  }

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
      return await this.forceReloadWorkspaceMcpClients({ workspacePath: globalWorkspacePath });
    } catch (error) {
      console.error("Failed to force reload MCP clients:", error);
      throw error;
    }
  }
  /**
   * 添加或启动全局范围的 MCP 客户端（兼容性方法）
   * 兼容性方法，主要用于支持旧的调用方式
   * 推荐使用 setWorkspaceMcpServerConfig 方法进行工作区特定的配置
   * @param clientName MCP客户端名称
   * @param clientConfig MCP服务器配置（包含连接信息、认证等）
   * @param options 选项，onlySave=true时仅保存配置不启动服务
   * @returns 操作结果
   * @deprecated 推荐使用 setWorkspaceMcpServerConfig 方法
   */
  async openMcpClient({
    clientName,
    clientConfig,
    options = {
      onlySave: false,
    }
  }: {
    clientName: string;
    clientConfig?: MCPServerConfig;
    options?: {
      onlySave: boolean;
    };
  }) {
    if (clientConfig && !options.onlySave) {
      // 将配置添加到全局工作区并启动客户端
      const manager = getMCPManager();
      const workspaceManager = getWorkspaceManager();
      const globalWorkspacePath = workspaceManager.getGlobalWorkspacePath();
      await manager.setServerConfig(clientName, clientConfig, globalWorkspacePath);
    }
    return {
      success: true,
    };
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
    workspacePath,
    clientName,
    clientConfig
  }: {
    workspacePath: string;
    clientName: string;
    clientConfig?: MCPServerConfig;
  }) {
    const manager = getMCPManager();
    
    if (clientConfig) {
      // 如果提供了配置，先设置配置再启动
      await manager.setServerConfig(clientName, clientConfig, workspacePath);
    } else {
      // 如果没有配置，尝试重启现有客户端
      await manager.restartClient(clientName, workspacePath);
    }
    
    return {
      success: true,
      clientName,
      workspacePath
    };
  }
  /**
   * 获取所有活跃的 MCP 客户端信息
   * 包括全局、各工作区的内置和自定义 MCP 服务
   * @returns 所有客户端的详细信息数组（包含状态、工具、资源等）
   */
  async getMcpClients() {
    // 从工作区MCP管理器获取所有客户端实例
    const manager = getMCPManager();
    const clients = manager.getAllClients();
    // 转换为前端可用的JSON格式，包含客户端状态和功能信息
    return clients.map((client) => client.toJSON());
  }
  /**
   * 管理全局范围的 MCP 客户端生命周期（兼容性方法）
   * 支持删除、禁用或重启操作
   * @param clientName MCP客户端名称
   * @param isdelete 是否删除：true=从配置文件中删除并停止服务
   * @param isdisable 是否禁用：true=停止服务但保留配置
   * @returns 操作结果
   * @note 如果两个参数都为false或未设置，则执行重启操作
   * @deprecated 推荐使用 manageWorkspaceMcpClient 方法进行工作区特定的操作
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
    const manager = getMCPManager();
    const workspaceManager = getWorkspaceManager();
    const globalWorkspacePath = workspaceManager.getGlobalWorkspacePath();
    
    if (isdelete) {
      // 从全局配置中永久删除客户端配置并停止服务
      await manager.deleteServerConfig(clientName, globalWorkspacePath);
    } else if (isdisable) {
      // 仅停止客户端服务，保留配置以便后续重启
      await manager.stopClient(clientName, globalWorkspacePath);
    } else {
      // 重启客户端（先停止再启动）
      await manager.restartClient(clientName, globalWorkspacePath);
    }
    
    return {
      success: true,
    };
  }

  /**
   * 管理指定工作区的 MCP 客户端生命周期
   * 支持删除、禁用、重启操作，适用于所有工作区（包括全局）
   * @param workspacePath 工作区路径
   * @param clientName MCP客户端名称
   * @param action 操作类型：'restart'|重启, 'disable'|禁用, 'delete'|删除
   * @returns 操作结果
   */
  async manageWorkspaceMcpClient({
    workspacePath,
    clientName,
    action
  }: {
    workspacePath: string;
    clientName: string;
    action: 'restart' | 'disable' | 'delete';
  }) {
    const manager = getMCPManager();
    
    switch (action) {
      case 'delete':
        // 从工作区配置中永久删除客户端配置并停止服务
        await manager.deleteServerConfig(clientName, workspacePath);
        break;
      case 'disable':
        // 仅停止客户端服务，保留配置以便后续重启
        await manager.stopClient(clientName, workspacePath);
        break;
      case 'restart':
      default:
        // 重启客户端（先停止再启动）
        await manager.restartClient(clientName, workspacePath);
        break;
    }
    
    return {
      success: true,
      action,
      clientName,
      workspacePath
    };
  }
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
    args: any;
  }) {
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const manager = getMCPManager();
    const allClients = manager.getAllClients();
    let client = allClients.find((x) => x.name === name);
    
    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
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
    const manager = getMCPManager();
    const allClients = manager.getAllClients();
    let client = allClients.find((x) => x.name === name);
    
    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
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
    args: any;
  }) {
    // 从所有活跃的MCP客户端中查找指定名称的客户端
    const manager = getMCPManager();
    const allClients = manager.getAllClients();
    let client = allClients.find((x) => x.name === name);
    
    if (!client) {
      throw new Error(`MCP client "${name}" not found`);
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
  }): Promise<any> {
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
    obj: any;
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
    return await fs.exists(p);
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

  async exec({
    command,
    args
  }: {
    command: string;
    args?: Array<string>;
  }): Promise<string> {
    if ((await LocalSetting.init()).PATH) {
      process.env.PATH = LocalSetting.get().PATH;
    } else {
      if (os.platform() != "win32") {
        process.env.PATH = shellPathSync();
      }
    }
    let p = await spawnWithOutput(command, args, {
      env: Object.assign(getMyDefaultEnvironment(), process.env as any),
    });
    return p.stdout;
  }
  async testWebDav({
    url,
    username,
    password
  }: {
    url: string;
    username: string;
    password: string;
  }) {
    let client = createClient(url, {
      username: username,
      password: password,
    });
    return await client.getDirectoryContents("/");
  }
  async webDaveInit() {
    return webdavClient.init();
  }
  async webDavSync() {
    return await webdavClient.sync();
  }
  async vectorStoreAdd({
    store: s,
    resource: r,
    move = false
  }: {
    store: KnowledgeStore;
    resource: KnowledgeResource;
    move?: boolean;
  }) {
    return await store.addResource(s, r, move);
  }
  async vectorStoreDelete({
    store: s
  }: {
    store: KnowledgeStore;
  }) {

    return await store.delete(s);
  }
  async vectorStoreRemoveResource({
    store: s,
    resource: r
  }: {
    store: KnowledgeStore;
    resource: KnowledgeResource;
  }) {

    return await store.removeResource(s, r);
  }
  async vectorStoreSearch({
    store: s,
    query: q,
    k
  }: {
    store: KnowledgeStore;
    query: string;
    k: number;
  }) {

    return await store.search(s, q, k);
  }
  async getProgressList() {
    return progressList.getData();
  }
  async call_agent_res({
    uid,
    data,
    error
  }: {
    uid: string;
    data: any;
    error: any;
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

  async addChatHistory({
    item
  }: {
    item: ChatHistoryItem;
  }) {
    item.version = 2;
    item.dateTime = Date.now();
    if (item.isTask) {
      item.lastMessage = (item.lastMessage || (item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1] : undefined)) as any;
    }

    let chatHistory = (await ChatHistory.init()).data;
    if (item.messages && item.messages.length > 0) {
      fs.writeFileSync(path.join(appDataDir, `messages/${item.key}.json`), JSON.stringify(item.messages, null, 2));
    }
    let index = chatHistory.findIndex(x => x.key === item.key);
    if (index === -1) {
      chatHistory.unshift(item);
    } else {
      chatHistory.splice(index, 1);
      chatHistory.unshift(item);
    }
    ChatHistory.options.formatSave = (r) => {
      r.data = r.data.map((x) => {
        if (x.key == item.key) {
          let clone = Object.assign({}, x, { messages: [] });
          return clone;
        } else {
          return x;
        }
      })
      return r;
    }
    await ChatHistory.save();
  }
  async changeChatHistory({
    item
  }: {
    item: ChatHistoryItem;
  }) {
    item.version = 2;
    item.dateTime = Date.now();
    if (item.messages && item.messages.length > 0) {
      fs.writeFileSync(path.join(appDataDir, `messages/${item.key}.json`), JSON.stringify(item.messages, null, 2));
    }
    let chatHistory = (await ChatHistory.init()).data;
    let find = chatHistory.find(x => x.key === item.key);
    if (find) {
      Object.assign(find, item);
    }
    ChatHistory.options.formatSave = (r) => {
      r.data = r.data.map((x) => {
        if (x.key == item.key) {
          let clone = Object.assign({}, x, { messages: [] });
          return clone;
        } else {
          return x;
        }
      })
      return r;
    }
    await ChatHistory.save()
  }
  async removeChatHistory({
    key
  }: {
    key: string;
  }) {
    let chatHistory = (await ChatHistory.init()).data;
    let findIndex = chatHistory.findIndex(x => x.key === key);
    if (findIndex !== -1) {
      chatHistory.splice(findIndex, 1);
      if (fs.existsSync(path.join(appDataDir, `messages/${key}.json`))) {
        fs.removeSync(path.join(appDataDir, `messages/${key}.json`));
      }
    }
    await ChatHistory.save()
    return;
  }
  async OpenTerminal() {
    return await OpenTerminal();
  }
  async GetTerminals() {
    return await GetTerminals();
  }
  async CloseTerminal({
    TerminalID
  }: {
    TerminalID: string;
  }) {
    return await CloseTerminal(TerminalID);
  }
  async ActiveAITerminal({
    TerminalID
  }: {
    TerminalID: string;
  }) {
    return await ActiveAITerminal(TerminalID);
  }
  async clearChatHistory({
    day
  }: {
    day: number;
  }) {
    let time = dayjs().subtract(day, "day").valueOf();
    await ChatHistory.init()
    let oldLen = ChatHistory.get().data.length;
    let f = ChatHistory.get().data.filter((x) => !x.icon);
    for (let x of f) {
      if (x.dateTime == null || x.dateTime < time) {
        x.deleted = true;
        if (fs.existsSync(path.join(appDataDir, `messages/${x.key}.json`))) {
          fs.removeSync(path.join(appDataDir, `messages/${x.key}.json`));
        }
      }
    }
    ChatHistory.get().data = ChatHistory.get().data.filter(
      (x) => !x.deleted,
    );
    let newLen = ChatHistory.get().data.length;
    await ChatHistory.save();
    return oldLen - newLen;
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
   * 获取所有已知的工作区列表
   * 包括全局工作区和所有已创建的普通工作区
   * @returns 工作区信息数组，包含路径、名称、描述等
   */
  async getWorkspaceList(): Promise<any[]> {
    const workspaceManager = getWorkspaceManager();
    return workspaceManager.getWorkspaceList();
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
  }): Promise<any> {
    const workspaceManager = getWorkspaceManager();
    
    // 如果没有提供名称，从路径提取文件夹名称作为默认名称
    const workspaceName = name || path.basename(workspacePath) || 'Workspace';
    
    const workspace = await workspaceManager.createWorkspace(workspacePath, workspaceName, description);
    return workspace.getConfig();
  }

  /**
   * 删除指定的工作区
   * 删除 .hyperchat 配置文件夹及其内容，但不删除工作区目录本身
   * @param workspacePath 要删除的工作区路径
   * @returns 删除成功返回true，失败返回false
   */
  async deleteWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<boolean> {
    const workspaceManager = getWorkspaceManager();
    return await workspaceManager.deleteWorkspace(workspacePath);
  }

  /**
   * 加载已存在的工作区配置
   * 从指定目录的 .hyperchat 文件夹中读取工作区配置
   * @param workspacePath 工作区根目录路径
   * @returns 工作区配置信息，如果不存在则返回null
   */
  async loadWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any | null> {
    const workspaceManager = getWorkspaceManager();
    const workspace = await workspaceManager.loadExistingWorkspace(workspacePath);
    return workspace ? workspace.getConfig() : null;
  }

  /**
   * 获取已加载的工作区信息
   * 从内存缓存中获取工作区配置，不会重新读取文件
   * @param workspacePath 工作区路径
   * @returns 工作区配置信息，如果未加载则返回null
   */
  async getCurrentWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any | null> {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getWorkspace(workspacePath);
    return workspace ? workspace.getConfig() : null;
  }

  /**
   * 获取全局工作区信息
   * 全局工作区位于 ~/Documents/HyperChat，用于存储全局配置和数据
   * @returns 全局工作区的配置信息和路径
   */
  async getGlobalWorkspace() {
    const workspaceManager = getWorkspaceManager();
    const globalWorkspace = workspaceManager.getGlobalWorkspace();
    const globalPath = workspaceManager.getGlobalWorkspacePath();
    return {
      ...globalWorkspace.getConfig(),
      path: globalPath
    };
  }

  /**
   * 获取工作区完整文件树（已废弃，建议使用 getWorkspaceDirectoryList 实现懒加载）
   * 这个方法会一次性加载整个目录树，对于大型项目可能导致性能问题
   * @param workspacePath 工作区路径
   * @returns 完整的文件树结构，如果工作区不存在则返回null
   * @deprecated 推荐使用 getWorkspaceDirectoryList 方法实现懒加载
   */
  async getWorkspaceFileTree({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any | null> {
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getWorkspace(workspacePath);
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
   * @param workspacePath 工作区根目录路径
   * @param directoryPath 相对于工作区的目录路径，默认为根目录
   * @returns 目录项目列表，包含文件名、类型、大小、修改时间等信息
   */
  async getWorkspaceDirectoryList({
    workspacePath,
    directoryPath = ""
  }: {
    workspacePath: string;
    directoryPath?: string;
  }): Promise<any[]> {
    const { fs, path } = zx;
    
    try {
      const workspaceManager = getWorkspaceManager();
      // 检查是否为全局工作区
      const workspace = workspaceManager.isGlobalWorkspace(workspacePath) 
        ? workspaceManager.getGlobalWorkspace()
        : workspaceManager.getWorkspace(workspacePath);
      if (!workspace) return [];

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
      
      interface DirectoryItem {
        name: string;
        path: string;
        type: "directory" | "file";
        size?: number;
        modified: number;
        extension?: string;
        isLeaf: boolean;
        isHidden: boolean;
      }
      
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
  async getWorkspaceFromDirectory({
    directoryPath
  }: {
    directoryPath: string;
  }): Promise<any | null> {
    const workspaceManager = getWorkspaceManager();
    const workspace = await workspaceManager.getWorkspaceFromDirectory(directoryPath);
    return workspace ? workspace.getConfig() : null;
  }

  /**
   * 获取工作区代理列表
   */
  async getWorkspaceAgents({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any[]> {
    const workspaceManager = getWorkspaceManager();
    return await workspaceManager.getWorkspaceAgents(workspacePath);
  }

  /**
   * 获取工作区 MCP 客户端
   */
  async getWorkspaceMcpClients({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any[]> {
    try {
      const workspaceManager = getWorkspaceManager();
      
      // 检查是否为全局工作区
      if (workspaceManager.isGlobalWorkspace(workspacePath)) {
        // 使用工作区路径获取客户端
        const clients = getWorkspaceMCPClientsFromManager(workspacePath);
        return clients.map(client => client.toJSON());
      } else {
        // 普通工作区返回工作区特定的客户端
        const clients = getWorkspaceMCPClientsFromManager(workspacePath);
        return clients.map(client => client.toJSON());
      }
    } catch (error) {
      console.error("Failed to get workspace MCP clients from new system:", error);
      // 如果新系统失败，回退到旧的工作区系统
      try {
        const workspaceManager = getWorkspaceManager();
        const workspace = workspaceManager.isGlobalWorkspace(workspacePath) 
          ? workspaceManager.getGlobalWorkspace()
          : workspaceManager.getWorkspace(workspacePath);
        if (!workspace) return [];
        return workspace.getMcpClients().map(client => client.toJSON());
      } catch (fallbackError) {
        console.error("Fallback to old workspace MCP system also failed:", fallbackError);
        return [];
      }
    }
  }

  /**
   * 列出服务器上的目录内容
   */
  async listServerDirectory({
    path: dirPath = "~"
  }: {
    path?: string;
  }): Promise<any[]> {
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
    } catch (error: any) {
      console.error("Failed to list directory:", error);
      throw new Error(`无法读取目录: ${error.message}`);
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
    } catch (error: any) {
      console.error("Failed to get parent directory:", error);
      throw new Error(`无法获取父目录: ${error.message}`);
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
  async startWorkspaceMcpClients({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any[]> {
    try {
      const manager = getMCPManager();
      
      // 启动工作区MCP客户端
      const clients = await manager.startClients(workspacePath);
      
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error(`Failed to start workspace MCP clients for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 强制重新加载工作区MCP配置
   */
  async forceReloadWorkspaceMcpClients({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any[]> {
    try {
      const manager = getMCPManager();
      
      // 管理器不需要显式初始化
      
      // 强制重新加载工作区配置
      await manager.forceReloadWorkspaceConfig(workspacePath);
      
      // 获取重新加载后的客户端
      const clients = manager.getClientsByWorkspace(workspacePath);
      return clients.map(client => client.toJSON());
    } catch (error) {
      console.error(`Failed to force reload workspace MCP clients for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 停止工作区 MCP 服务
   */
  async stopWorkspaceMcpClients({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<void> {
    try {
      const manager = getMCPManager();
      await manager.stopClients(workspacePath);
    } catch (error) {
      console.error(`Failed to stop workspace MCP clients for ${workspacePath}:`, error);
      throw error;
    }
  }


  /**
   * 添加或更新工作区 MCP 服务器配置
   */
  async setWorkspaceMcpServerConfig({
    workspacePath,
    serverName,
    serverConfig
  }: {
    workspacePath: string;
    serverName: string;
    serverConfig: MCPServerConfig;
  }): Promise<void> {
    try {
      const manager = getMCPManager();      
      await manager.setServerConfig(serverName, serverConfig, workspacePath);
    } catch (error) {
      console.error(`Failed to set MCP server config for ${workspacePath}:`, error);
      throw error;
    }
  }

  /**
   * 删除工作区 MCP 服务器配置
   */
  async deleteWorkspaceMcpServerConfig({
    workspacePath,
    serverName
  }: {
    workspacePath: string;
    serverName: string;
  }): Promise<void> {
    try {
      const manager = getMCPManager();
      await manager.deleteServerConfig(serverName, workspacePath);
    } catch (error) {
      console.error(`Failed to delete MCP server config for ${workspacePath}:`, error);
      throw error;
    }
  }

}
// export const Command = CommandFactory.prototype;
export const Command = new CommandFactory();
// Define interface with all methods from CommandFactory plus the additional method
export interface Command extends CommandFactory {
  refreshMcpRoutes: () => Promise<void>;
}


