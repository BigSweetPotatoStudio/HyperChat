import { CONST, Logger } from "ts/polyfills/index.mjs";
import { createClient, shellPathSync, zx } from "./es6.mjs";
const { fs, os, path } = zx;
import { isPortUse } from "./common/checkport.mjs";
import { getLocalIP, spawnWithOutput } from "./common/util.mjs";
import { autoLauncher } from "ts/polyfills/index.mjs";
import {
  Agents,
  ChatHistory,
  ChatHistoryItem,
  electronData,
  MCP_CONFIG_TYPE,
  Task,
} from "../../shared/data.mjs";
import { appDataDir } from "ts/polyfills/index.mjs";
import crypto from "crypto";
import {
  closeMcpClients,
  getMcpClients,
  initMcpClients,
  openMcpClient,
} from "./mcp/config.mjs";
import { checkUpdate } from "ts/polyfills/index.mjs";
import { webdavClient } from "./common/webdav.mjs";
import { progressList } from "./common/progress.mjs";
import {
  KNOWLEDGE_Resource,
  KNOWLEDGE_Store,
} from "../../shared/data.mjs";
import { EVENT } from "./common/event.mjs";
import { callAgent, runTask, startTask, stopTask } from "./mcp/task.mjs";
import { getMyDefaultEnvironment } from "./mcp/utils.mjs";
import cron from "node-cron";
import { store } from "./rag/vectorStore.mjs";
import { Config } from "./const.mjs";
import { clientPaths } from "./mcp/claude.mjs";
import { createBrowser } from "./mcp/servers/hyper_tools/web2.mjs";
import { getConfig } from "./mcp/servers/hyper_tools/lib.mjs";
import dayjs from "dayjs";
import vm from "node:vm";
import { ActiveAITerminal, CloseTerminal, GetTerminals, OpenTerminal } from "./mcp/servers/terminal/terminal.mjs";

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
      password: electronData.initSync().password,
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
  async openMcpClient(
    clientName: string,
    clientConfig?: MCP_CONFIG_TYPE,
    options = {
      onlySave: false,
    }
  ) {
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
  async closeMcpClients(
    clientName: string,
    {
      isdelete,
      isdisable
    }: {
      isdelete?: boolean;
      isdisable?: boolean;
    } = {}
  ) {
    await closeMcpClients(clientName, {
      isdelete,
      isdisable
    });
    return {
      success: true,
    };
  }
  // 调用 MCP 工具
  async mcpCallTool(name: string, functionName: string, args: any) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callTool(functionName, args);
  }
  // 调用 MCP 资源
  async mcpCallResource(name: string, uri: string) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callResource(uri);
  }
  // 调用 MCP Prompt
  async mcpCallPrompt(name: string, functionName: string, args: any) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callPrompt(functionName, args);
  }
  // 文件路径处理，返回处理后路径
  async processedFilePath(filePath: string): Promise<string> {
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
  // 文件选择对话框
  async selectFile(
    opts: {
      type: "openFile" | "openDirectory";
      filters?: Array<{ name: string; extensions: string[] }>;
    } = { type: "openFile" }
  ) {
    opts.type = opts.type || "openFile";
    const { dialog } = await import("electron");
    try {
      const dialogOptions: any = {
        properties: [opts.type],
      };
      if (opts.filters) {
        dialogOptions.filters = opts.filters;
      }
      const result = await dialog.showOpenDialog(dialogOptions);

      if (!result.canceled) {
        const filePath = result.filePaths[0];
        Logger.info("Selected file:", filePath);
        return filePath;
      } else {
        console.error("No file selected");
        return "";
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      return "";
    }
  }
  // 设置剪贴板内容
  async setClipboardText(text: string) {
    const { clipboard } = await import("electron");
    clipboard.writeText(text);
  }
  // 获取剪贴板内容
  async getClipboardText(): Promise<string> {
    const { clipboard } = await import("electron");
    return clipboard.readText();
  }
  // 自动启动相关
  async isAutoLauncher(): Promise<boolean> {
    return autoLauncher.isEnabled();
  }
  async enableAutoLauncher(): Promise<void> {
    return autoLauncher.enable();
  }
  async disableAutoLauncher(): Promise<void> {
    return autoLauncher.disable();
  }
  // 获取应用数据目录
  async getAppDataDir(): Promise<string> {
    return appDataDir;
  }
  // 读取目录
  async readDir(p: string, root: string = appDataDir): Promise<string[]> {
    p = path.join(root, p);
    await fs.ensureDir(p);
    return await fs.readdir(p);
  }
  // 删除文件
  async removeFile(p: string, root: string = appDataDir): Promise<void> {
    p = path.join(root, p);
    return await fs.remove(p);
  }
  async writeFile(p: string, text: string, root: string = appDataDir): Promise<void> {
    let localPath = path.join(root, p);
    await fs.writeFile(localPath, text);
  }
  async readFile(p: string, root: string = appDataDir): Promise<string> {
    p = path.join(root, p);
    try {
      let r = await fs.readFile(p, "utf-8");
      return r;
    } catch (e) {
      throw e;
    }
  }
  async readJSON(p: string, root: string = appDataDir): Promise<any> {
    p = path.join(root, p);
    try {
      let r = await fs.readJSON(p);
      return r;
    } catch (e) {
      throw e;
    }
  }
  async writeJSON(p: string, obj: any, root: string = appDataDir): Promise<void> {
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
  async exists(p: string, root: string = appDataDir): Promise<boolean> {
    p = path.join(root, p);
    return await fs.exists(p);
  }

  async pathJoin(p: string, root: string = appDataDir): Promise<string> {
    if (root) {
      p = path.join(root, p);
    }
    await fs.ensureDir(path.dirname(p));
    return p;
  }
  async getLocalIP(): Promise<string[]> {
    return getLocalIP();
  }
  async isPortUse(port: number): Promise<boolean> {
    return isPortUse(port);
  }

  async openExplorer(p: string) {
    const { shell } = await import("electron");
    return shell.showItemInFolder(p);
  }

  async openDevTools() {
    const { BrowserWindow } = await import("electron");
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.openDevTools();
    }
  }
  async hyperToolOpenBrowser(url: string, { userAgent }: { userAgent?: string } = {}): Promise<void> {
    const config = getConfig();
    if (config?.Web_Tools_Platform === "electron") {
      const { BrowserWindow } = await import("electron");
      let win = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
          webSecurity: false,
        },
      });

      await win.loadURL(url, {
        userAgent: userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      });
    } else if (config?.Web_Tools_Platform === "chrome") {
      await createBrowser(true, url)
    } else {
      throw new Error("HyperTool Settings Web_Tools_Platform is none");
    }
  }
  async openBrowser(url: string, userAgent?: string): Promise<void> {
    const { BrowserWindow } = await import("electron");
    let win = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        webSecurity: false,
      },
    });

    await win.loadURL(url, {
      userAgent:
        userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
  }
  async exec(command: string, args?: Array<string>): Promise<string> {
    if (electronData.initSync().PATH) {
      process.env.PATH = electronData.get().PATH;
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
  async checkUpdate() {
    return checkUpdate.checkUpdate();
  }
  async checkUpdateDownload() {
    checkUpdate.download();
  }

  async quitAndInstall() {
    checkUpdate.quitAndInstall();
  }
  async testWebDav(values: { url: string; username: string; password: string }) {
    let client = createClient(values.url, {
      username: values.username,
      password: values.password,
    });
    return await client.getDirectoryContents("/");
  }
  async webDaveInit() {
    return webdavClient.init();
  }
  async webDavSync() {
    return await webdavClient.sync();
  }
  async vectorStoreAdd(
    s: KNOWLEDGE_Store,
    r: KNOWLEDGE_Resource,
    move = false
  ) {
    return await store.addResource(s, r, move);
  }
  async vectorStoreDelete(s: KNOWLEDGE_Store) {

    return await store.delete(s);
  }
  async vectorStoreRemoveResource(s: KNOWLEDGE_Store, r: KNOWLEDGE_Resource) {

    return await store.removeResource(s, r);
  }
  async vectorStoreSearch(s: KNOWLEDGE_Store, q: string, k: number) {

    return await store.search(s, q, k);
  }
  async getProgressList() {
    return progressList.getData();
  }
  async call_agent_res(uid: string, data: any, error: any) {
    EVENT.fire("call_agent_res_" + uid, { uid, data, error });
  }
  async checkTask(task?: Task) {
    if (task && cron.validate(task.cron)) {
    } else {
      throw new Error("cron Error");
    }
  }
  async startTask(taskkey?: string) {
    return startTask(taskkey);
  }
  async stopTask(taskkey?: string) {
    return stopTask(taskkey);
  }
  async runTask(taskkey: string) {
    return runTask(taskkey, { force: true });
  }
  async callAgent(task: { command: string; agentName: string }) {
    let agent = Agents.initSync().data.find((x) => x.label === task.agentName);
    if (!agent) {
      throw new Error(`Agent not found: ${task.agentName}`);
    }
    return callAgent({
      agentKey: agent.key,
      message: task.command,
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

  async addChatHistory(item: ChatHistoryItem) {
    item.version = 2;
    item.dateTime = Date.now();
    if (item.isTask) {
      item.lastMessage = item.lastMessage || (item.messages && item.messages.length > 0 ? item.messages[item.messages.length - 1] : undefined);
    }
    let chatHistory = ChatHistory.initSync().data;
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
  async changeChatHistory(item: ChatHistoryItem) {
    item.version = 2;
    item.dateTime = Date.now();
    if (item.messages && item.messages.length > 0) {
      fs.writeFileSync(path.join(appDataDir, `messages/${item.key}.json`), JSON.stringify(item.messages, null, 2));
    }
    let chatHistory = ChatHistory.initSync().data;
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
  async removeChatHistory(item: { key: string }) {
    let chatHistory = ChatHistory.initSync().data;
    let findIndex = chatHistory.findIndex(x => x.key === item.key);
    if (findIndex !== -1) {
      chatHistory.splice(findIndex, 1);
      if (fs.existsSync(path.join(appDataDir, `messages/${item.key}.json`))) {
        fs.removeSync(path.join(appDataDir, `messages/${item.key}.json`));
      }
    }
    await ChatHistory.saveSync()
    return;
  }
  async OpenTerminal() {
    return await OpenTerminal();
  }
  async GetTerminals() {
    return await GetTerminals();
  }
  async CloseTerminal(TerminalID: string) {
    return await CloseTerminal(TerminalID);
  }
  async ActiveAITerminal(TerminalID: string) {
    return await ActiveAITerminal(TerminalID);
  }
  async clearChatHistory(day: number) {
    let time = dayjs().subtract(day, "day").valueOf();
    ChatHistory.initSync()
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
    await ChatHistory.saveSync();
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
}
// export const Command = CommandFactory.prototype;
export const Command = new CommandFactory();
// Define interface with all methods from CommandFactory plus the additional method
export interface Command extends CommandFactory {
  refreshMcpRoutes: () => Promise<void>;
}


