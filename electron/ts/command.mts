import { CONST, Logger } from "ts/polyfills/index.mjs";
import { createClient, shellPathSync, zx } from "./es6.mjs";
const { fs, os, sleep, retry, path, $ } = zx;
import { isPortUse } from "./common/checkport.mjs";
import { getLocalIP, spawnWithOutput } from "./common/util.mjs";
import { autoLauncher } from "ts/polyfills/index.mjs";
import {
  Agents,
  AppSetting,
  electronData,
  MCP_CONFIG_TYPE,
  Task,
  TaskList,
} from "../../common/data";
import { appDataDir } from "ts/polyfills/index.mjs";
import spawn from "cross-spawn";

import {
  closeMcpClients,
  getMcpClients,
  initMcpClients,
  loadObj,
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
// function logCommand(
//   target: any,
//   propertyKey: string,
//   descriptor: PropertyDescriptor
// ) {
//   const originalMethod = descriptor.value;
//   descriptor.value = async function (...args: any[]) {
//     try {
//       commandHistory.add(propertyKey, args);
//       commandHistory.save();

//       let res = await originalMethod.apply(this, args);
//       commandHistory.last().status = CommandStatus.SUCCESS;
//       commandHistory.save();
//       return res;
//     } catch (e) {
//       commandHistory.last().status = CommandStatus.ERROR;
//       commandHistory.last().error = e.message;
//       commandHistory.save();
//       throw e;
//     }
//   };
//   return descriptor;
// }

export class CommandFactory {
  async getConfig() {
    return {
      version: CONST.getVersion,
      appDataDir: appDataDir,
      logPath: Logger.path,
      password: electronData.initSync().password,
      ...Config
    };
  }
  async initMcpClients(): Promise<{
    [s: string]: MCPClient;
  }> {
    let res = await initMcpClients();
    let obj = {};
    for (let key in res) {
      obj[key] = res[key].toJSON();
    }
    return obj as any;
  }
  async openMcpClient(
    clientName: string,
    clientConfig?: MCP_CONFIG_TYPE
  ): Promise<{
    [s: string]: MCPClient;
  }> {
    let res = await openMcpClient(clientName, clientConfig);
    let obj = {};
    for (let key in res) {
      obj[key] = res[key].toJSON();
    }
    return obj as any;
  }
  async getMcpClientsLoad() {
    return loadObj;
  }
  async getMcpClients(): Promise<{
    [s: string]: MCPClient;
  }> {
    let res = await getMcpClients();
    let obj = {};
    for (let key in res) {
      obj[key] = res[key].toJSON();
    }
    return obj as any;
  }

  async closeMcpClients(
    clientName: string = undefined,
    isdelete: boolean = false
  ) {
    let res = await closeMcpClients(clientName, isdelete);
    let obj = {};
    for (let key in res) {
      obj[key] = res[key].toJSON();
    }
    return obj;
  }
  async mcpCallTool(clientName: string, functionName: string, args: any) {
    let mcpClients = await getMcpClients();
    let client = mcpClients[clientName];
    if (!client) {
      throw new Error("client not found");
    }
    // console.log("mcpCallTool", client, functionName, args);
    // if (client.status == "disconnected") {
    //   await openMcpClients(clientName);
    //   let mcpClients = await getMcpClients();
    //   client = await mcpClients[clientName];
    // }
    // let tool = client.tools.find((tool) => tool.name == functionName);
    // if (!tool) {
    //   throw new Error("tool not found");
    // }
    return await client.callTool(functionName, args);
  }
  async mcpCallResource(clientName: string, uri: string) {
    let mcpClients = await getMcpClients();
    let client = mcpClients[clientName];
    if (!client) {
      throw new Error("client not found");
    }
    return await client.callResource(uri);
  }
  async mcpCallPrompt(clientName: string, functionName: string, args: any) {
    let mcpClients = await getMcpClients();
    let client = mcpClients[clientName];
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
      return "";
    }
  }
  async readJSON(p, root = appDataDir) {
    p = path.join(root, p);
    try {
      let str = fs.readFileSync(p, "utf-8");
      return JSON.parse(str);
    } catch (e) {
      return null;
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
    let task = TaskList.initSync().data.find((x) => x.key === taskkey);
    return runTask(task);
  }
  async callAgent(task: { command: string; agentName: string }) {
    let agent = Agents.initSync().data.find((x) => x.label === task.agentName);
    return callAgent({
      agentKey: agent.key,
      message: task.command,
      type: "call",
    });
  }
}

export const Command = CommandFactory.prototype;
