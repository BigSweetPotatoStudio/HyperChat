import { CONST, Logger } from "ts/polyfills/index.mjs";
import { createClient, shellPathSync, zx } from "./es6.mjs";
const { fs, os, sleep, retry, path, $ } = zx;
import { isPortUse } from "./common/checkport.mjs";
import { getLocalIP, spawnWithOutput } from "./common/util.mjs";
import { autoLauncher } from "ts/polyfills/index.mjs";
import {
  Agents,
  AppSetting,
  ChatHistory,
  ChatHistoryItem,
  electronData,
  MCP_CONFIG_TYPE,
  Task,
  TaskList,
} from "../../common/data";
import { appDataDir } from "ts/polyfills/index.mjs";
import spawn from "cross-spawn";
import crypto from "crypto";
import {
  closeMcpClients,
  getMcpClients,
  initMcpClients,
  MCPClient,
  openMcpClient,
} from "./mcp/config.mjs";
import { checkUpdate } from "ts/polyfills/index.mjs";
import { version } from "os";
import { webdavClient } from "./common/webdav.mjs";
import { progressList } from "./common/progress.mjs";
import {
  KNOWLEDGE_BASE,
  KNOWLEDGE_Resource,
  KNOWLEDGE_Store,
} from "../../common/data";
import { EVENT } from "./common/event";
import { callAgent, runTask, startTask, stopTask } from "./mcp/task.mjs";
import { getMyDefaultEnvironment } from "./mcp/utils.mjs";
import cron from "node-cron";
import { store } from "./rag/vectorStore.mjs";
import { Config } from "./const.mjs";
import { clientPaths } from "./mcp/claude.mjs";


export class CommandFactory {
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
  async initMcpClients() {
    let res = await initMcpClients();
    return res.map((x) => x.toJSON());
  }
  async openMcpClient(
    clientName: string,
    clientConfig?: MCP_CONFIG_TYPE
  ) {
    let res = await openMcpClient(clientName, clientConfig);
    return res.map((x) => x.toJSON());
  }
  async getMcpClients() {
    let res = await getMcpClients();
    return res.map((x) => x.toJSON());
  }

  async closeMcpClients(
    clientName: string = undefined,
    {
      isdelete,
      isdisable
    }
  ) {
    let res = await closeMcpClients(clientName, {
      isdelete,
      isdisable
    });
    return res.map((x) => x.toJSON());
  }
  async mcpCallTool(name: string, functionName: string, args: any) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callTool(functionName, args);
  }
  async mcpCallResource(name: string, uri: string) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callResource(uri);
  }
  async mcpCallPrompt(name: string, functionName: string, args: any) {
    let mcpClients = await getMcpClients();
    let client = mcpClients.find((x) => x.name === name);
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callPrompt(functionName, args);
  }
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
  async selectFile(
    opts: {
      type: "openFile" | "openDirectory";
      filters?: Array<{ name: string; extensions: string[] }>;
    } = { type: "openFile" }
  ) {
    opts.type = opts.type || "openFile";
    const { BrowserWindow, dialog, shell, clipboard } = await import(
      "electron"
    );
    try {
      const result = await dialog.showOpenDialog({
        properties: [opts.type],
        filters: opts.filters,
      });

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
  // 示例：设置剪切板内容
  async setClipboardText(text: string) {
    const { BrowserWindow, dialog, shell, clipboard } = await import(
      "electron"
    );
    clipboard.writeText(text);
  }
  // 示例：获取剪切板内容
  async getClipboardText(): Promise<string> {
    const { BrowserWindow, dialog, shell, clipboard } = await import(
      "electron"
    );
    return clipboard.readText();
  }
  async isAutoLauncher(): Promise<boolean> {
    return autoLauncher.isEnabled();
  }
  async enableAutoLauncher(): Promise<void> {
    return autoLauncher.enable();
  }
  async disableAutoLauncher(): Promise<void> {
    return autoLauncher.disable();
  }
  async getAppDataDir(): Promise<string> {
    return appDataDir;
  }
  async readDir(p, root = appDataDir) {
    p = path.join(root, p);
    fs.ensureDirSync(p);
    return fs.readdirSync(p);
  }
  async removeFile(p, root = appDataDir) {
    p = path.join(root, p);

    return fs.removeSync(p);
  }
  async writeFile(p, text, root = appDataDir) {
    let localPath = path.join(root, p);
    let res = fs.writeFileSync(localPath, text);

    return res;
  }
  async readFile(p, root = appDataDir) {
    p = path.join(root, p);
    try {
      return fs.readFileSync(p, "utf-8");
    } catch (e) {
      throw e;
    }
  }
  async readJSON(p, root = appDataDir) {
    p = path.join(root, p);
    try {
      let str = fs.readFileSync(p, "utf-8");
      return JSON.parse(str);
    } catch (e) {
      throw e;
    }
  }
  async exists(p, root = appDataDir) {
    p = path.join(root, p);
    return fs.exists(p);
  }

  async pathJoin(p, root = appDataDir) {
    if (root) {
      p = path.join(root, p);
    }
    fs.ensureDirSync(path.dirname(p));
    return p;
  }
  async getLocalIP(): Promise<string[]> {
    return getLocalIP();
  }
  async isPortUse(port: number): Promise<boolean> {
    return isPortUse(port);
  }

  async openExplorer(p) {
    const { BrowserWindow, dialog, shell, clipboard } = await import(
      "electron"
    );
    return shell.showItemInFolder(p);
  }

  async openDevTools() {
    const { BrowserWindow, dialog, shell, clipboard } = await import(
      "electron"
    );
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.openDevTools();
    }
  }
  async openBrowser(url: string, userAgent?): Promise<void> {
    const { BrowserWindow, dialog, shell, clipboard } = await import(
      "electron"
    );
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
  async testWebDav(values) {
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
  async call_agent_res(uid, data, error) {
    EVENT.fire("call_agent_res_" + uid, { uid, data, error });
  }
  async checkTask(task?: Task) {
    if (cron.validate(task.cron)) {
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
    return runTask(taskkey,{ force: true });
  }
  async callAgent(task: { command: string; agentName: string }) {
    let agent = Agents.initSync().data.find((x) => x.label === task.agentName);
    return callAgent({
      agentKey: agent.key,
      message: task.command,
      type: "call",
    });
  }
  async saveTempFile({ txt, ext }) {
    // let filePath = path.join(os.tmpdir(), "temp.txt");
    // md5(txt) + ext;
    const hash = crypto
      .createHash("sha256")
      .update(txt as any)
      .digest("hex");
    let filename = hash + "." + ext;

    let filePath = path.join(appDataDir, "temp", filename);
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, txt);
    return filename;
  }

  async addChatHistory(item: ChatHistoryItem) {
    item.version = "2.0";
    let chatHistory = ChatHistory.initSync().data;
    fs.writeFileSync(path.join(appDataDir, `messages/${item.key}.json`), JSON.stringify(item.messages, null, 2));
    let index = chatHistory.findIndex(x => x.key === item.key);
    if (index === -1) {
      chatHistory.unshift(item);
    } else {
      chatHistory.splice(index, 1);
      chatHistory.unshift(item);
    }

    await ChatHistory.save((r) => {
      r.data = r.data.map((x) => {
        if (x.key == item.key) {
          let clone = Object.assign({}, x, { messages: [] });
          return clone;
        } else {
          return x;
        }
      })
      return r;
    })
  }
  async changeChatHistory(item: ChatHistoryItem) {
    item.version = "2.0";
    let chatHistory = ChatHistory.initSync().data;
    let find = chatHistory.find(x => x.key === item.key);
    if (find) {
      Object.assign(find, item);
    }

    fs.writeFileSync(path.join(appDataDir, `messages/${item.key}.json`), JSON.stringify(item.messages, null, 2));
    await ChatHistory.save((r) => {
      r.data = r.data.map((x) => {
        if (x.key == item.key) {
          let clone = Object.assign({}, x, { messages: [] });
          return clone;
        } else if (x.version == "2.0") { 
          let clone = Object.assign({}, x, { messages: [] });
          return clone;
        } else {
          return x;
        }
      })
      return r;
    })
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
    await ChatHistory.save()
    return;
  }
}

export const Command = CommandFactory.prototype;

