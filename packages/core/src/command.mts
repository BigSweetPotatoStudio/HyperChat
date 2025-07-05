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
import {
  closeMcpClients,
  getMcpClients,
  initMcpClients,
  openMcpClient,
} from "./mcp/config.mjs";
import { webdavClient } from "./common/webdav.mjs";
import { progressList } from "./common/progress.mjs";

import { EVENT } from "./common/event.mjs";
import { callAgent, runTask, startTask, stopTask } from "./mcp/task.mjs";
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
  // 初始化 MCP 客户端
  async initMcpClients() {
    let res = await initMcpClients();
    return res.map((x) => x.toJSON());
  }
  // 打开 MCP 客户端
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
    await openMcpClient(clientName, clientConfig, options);
    return {
      success: true,
    };
  }
  // 获取所有 MCP 客户端
  async getMcpClients() {
    const clients = await getMcpClients();
    return clients.map((x) => x.toJSON());
  }
  // 关闭 MCP 客户端
  async closeMcpClients({
    clientName,
    isdelete,
    isdisable
  }: {
    clientName: string;
    isdelete?: boolean;
    isdisable?: boolean;
  }) {
    await closeMcpClients(clientName, {
      ...(isdelete !== undefined && { isdelete }),
      ...(isdisable !== undefined && { isdisable })
    });
    return {
      success: true,
    };
  }
  // 调用 MCP 工具
  async mcpCallTool({
    name,
    functionName,
    args
  }: {
    name: string;
    functionName: string;
    args: any;
  }) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callTool(functionName, args);
  }
  // 调用 MCP 资源
  async mcpCallResource({
    name,
    uri
  }: {
    name: string;
    uri: string;
  }) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callResource(uri);
  }
  // 调用 MCP Prompt
  async mcpCallPrompt({
    name,
    functionName,
    args
  }: {
    name: string;
    functionName: string;
    args: any;
  }) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callPrompt(functionName, args);
  }
  // 文件路径处理，返回处理后路径
  async processedFilePath({
    filePath
  }: {
    filePath: string;
  }): Promise<string> {
    // 获取文件目录和文件名
    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath);
    // 获取文件名和扩展名
    const extName = path.extname(baseName);
    const fileName = path.basename(baseName, extName);
    // 构造新的文件名
    const newFileName = `${fileName}.processed${extName}`;
    // 返回新的文件路径
    return path.join(dirName, newFileName);
  }
  // 获取应用数据目录
  async getAppDataDir(): Promise<string> {
    return appDataDir;
  }
  // 读取目录
  async readDir({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string[]> {
    p = path.join(root, p);
    await fs.ensureDir(p);
    return await fs.readdir(p);
  }
  // 删除文件
  async removeFile({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<void> {
    p = path.join(root, p);
    return await fs.remove(p);
  }
  async writeFile({
    path: p,
    text,
    root = appDataDir
  }: {
    path: string;
    text: string;
    root?: string;
  }): Promise<void> {
    let localPath = path.join(root, p);
    await fs.writeFile(localPath, text);
  }
  async readFile({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string> {
    p = path.join(root, p);
    try {
      let r = await fs.readFile(p, "utf-8");
      return r;
    } catch (e) {
      throw e;
    }
  }
  async readJSON({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<any> {
    p = path.join(root, p);
    try {
      let r = await fs.readJSON(p);
      return r;
    } catch (e) {
      throw e;
    }
  }
  async writeJSON({
    path: p,
    obj,
    root = appDataDir
  }: {
    path: string;
    obj: any;
    root?: string;
  }): Promise<void> {
    p = path.join(root, p);
    try {
      await fs.writeJSON(p, obj, {
        spaces: 2,
        encoding: "utf-8",
      });
    } catch (e) {
      throw e;
    }
  }
  async exists({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<boolean> {
    p = path.join(root, p);
    return await fs.exists(p);
  }

  async pathJoin({
    path: p,
    root = appDataDir
  }: {
    path: string;
    root?: string;
  }): Promise<string> {
    if (root) {
      p = path.join(root, p);
    }
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
  async startTask({
    taskkey
  }: {
    taskkey?: string;
  } = {}) {
    return startTask(taskkey);
  }
  async stopTask({
    taskkey
  }: {
    taskkey?: string;
  } = {}) {
    return stopTask(taskkey);
  }
  async runTask({
    taskkey
  }: {
    taskkey: string;
  }) {
    return runTask(taskkey, { force: true });
  }
  async callAgent({
    command,
    agentName
  }: {
    command: string;
    agentName: string;
  }) {
    let AgentsData = await Agents.init();
    let agent = AgentsData.data.find((x) => x.name === agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }
    return callAgent({
      agentKey: agent.key,
      message: command,
      type: "call",
    });
  }
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
   * 获取所有工作区列表
   */
  async getWorkspaceList(): Promise<any[]> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    return workspaceManager.getWorkspaceList();
  }

  /**
   * 创建新工作区
   */
  async createWorkspace({
    workspacePath,
    name,
    description
  }: {
    workspacePath: string;
    name: string;
    description?: string;
  }): Promise<any> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    const workspace = await workspaceManager.createWorkspace(workspacePath, name, description);
    return workspace.getConfig();
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<boolean> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    return await workspaceManager.deleteWorkspace(workspacePath);
  }

  /**
   * 加载现有工作区
   */
  async loadWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any | null> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    const workspace = await workspaceManager.loadExistingWorkspace(workspacePath);
    return workspace ? workspace.getConfig() : null;
  }

  /**
   * 获取当前工作区信息
   */
  async getCurrentWorkspace({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any | null> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getWorkspace(workspacePath);
    return workspace ? workspace.getConfig() : null;
  }

  /**
   * 获取全局工作区信息
   */
  async getGlobalWorkspace(): Promise<any> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    const globalWorkspace = workspaceManager.getGlobalWorkspace();
    return globalWorkspace.getConfig();
  }

  /**
   * 获取工作区文件树
   */
  async getWorkspaceFileTree({
    workspacePath
  }: {
    workspacePath: string;
  }): Promise<any | null> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getWorkspace(workspacePath);
    if (!workspace) return null;
    
    await workspace.updateFileTree({
      includeHidden: false,
      maxDepth: 5,
      excludePatterns: ['node_modules', '.git', 'dist', 'build', '.hyperchat'],
    });
    return workspace.getFileTree();
  }

  /**
   * 检查目录是否为工作区
   */
  async isWorkspaceDirectory({
    directoryPath
  }: {
    directoryPath: string;
  }): Promise<boolean> {
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
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
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
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
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
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
    const { getWorkspaceManager } = await import("./workspace/index.mjs");
    const workspaceManager = getWorkspaceManager();
    const workspace = workspaceManager.getWorkspace(workspacePath);
    if (!workspace) return [];
    return workspace.getMcpClients().map(client => client.toJSON());
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

}
// export const Command = CommandFactory.prototype;
export const Command = new CommandFactory();
// Define interface with all methods from CommandFactory plus the additional method
export interface Command extends CommandFactory {
  refreshMcpRoutes: () => Promise<void>;
}


