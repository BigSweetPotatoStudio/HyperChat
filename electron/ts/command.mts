import log from "electron-log";
import {
  app,
  BrowserWindow,
  nativeImage,
  dialog,
  Tray,
  ipcMain,
  protocol,
  net,
  Menu,
  shell,
  clipboard,
  globalShortcut,
  desktopCapturer,
  systemPreferences,
} from "electron";
import pack from "../package.json";
import { fs, os, sleep, retry, path, $ } from "zx";
import { request } from "./common/request.mjs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { exec, execFile } from "child_process";
import { Server as SocketIO } from "socket.io";
import { createServer } from "http";
import { isPortUse } from "./common/checkport.mjs";
import { closePort } from "./common/closeport.mjs";
import { execFallback } from "./common/execFallback.mjs";
import AdmZip from "adm-zip";
import { pipeline } from "stream";
import { promisify } from "util";
import puppeteer from "puppeteer-core";
import { v4 as uuidV4 } from "uuid";
import Screenshots from "electron-screenshots";
import { getLocalIP, spawnWithOutput } from "./common/util.mjs";
import { autoLauncher } from "./common/autoLauncher.mjs";
import { AppSetting, electronData } from "./common/data.mjs";
import { commandHistory, CommandStatus } from "./command_history.mjs";
import { appDataDir } from "./const.mjs";
import spawn from "cross-spawn";

const { createClient } = await import(/* webpackIgnore: true */ "webdav");

import {
  closeMcpClients,
  getMcpClients,
  getMyDefaultEnvironment,
  initMcpClients,
  openMcpClient,
} from "./mcp/config.mjs";
import { checkUpdate } from "./upload.mjs";
import { version } from "os";
import { webdavClient } from "./common/webdav.mjs";

const userDataPath = app.getPath("userData");
let videoDownloadWin: BrowserWindow;

function logCommand(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    try {
      commandHistory.add(propertyKey, args);
      commandHistory.save();

      let res = await originalMethod.apply(this, args);
      commandHistory.last().status = CommandStatus.SUCCESS;
      commandHistory.save();
      return res;
    } catch (e) {
      commandHistory.last().status = CommandStatus.ERROR;
      commandHistory.last().error = e.message;
      commandHistory.save();
      throw e;
    }
  };
  return descriptor;
}

export class CommandFactory {
  async getConfig() {
    return {
      version: app.getVersion(),
      appDataDir: appDataDir,
      logPath: log.transports.file.getFile().path,
    };
  }
  async getHistory() {
    return commandHistory.get();
  }
  async initMcpClients() {
    let res = await initMcpClients();
    let obj = {};
    for (let key in res) {
      obj[key] = res[key].toJSON();
    }
    return obj;
  }
  async openMcpClient(clientName: string, clientConfig?: any) {
    let res = await openMcpClient(clientName, clientConfig);
    let obj = {};
    for (let key in res) {
      obj[key] = res[key].toJSON();
    }
    return obj;
  }
  async getMcpClients() {
    let res = await getMcpClients();
    let obj = {};
    for (let key in res) {
      obj[key] = res[key].toJSON();
    }
    return obj;
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
    try {
      const result = await dialog.showOpenDialog({
        properties: [opts.type],
        filters: opts.filters,
      });

      if (!result.canceled) {
        const filePath = result.filePaths[0];
        log.info("Selected file:", filePath);
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
    clipboard.writeText(text);
  }
  // 示例：获取剪切板内容
  async getClipboardText(): Promise<string> {
    return clipboard.readText();
  }
  async getData(): Promise<any> {
    let { electronData: electron_data } = await import("./common/data.mjs");
    return electron_data.get();
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
    console.log(p);
    if (AppSetting.initSync().webdav.autoSync) {
      webdavClient.sync();
    }

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
    fs.ensureDirSync(dirname(p));
    return p;
  }
  async getLocalIP(): Promise<string[]> {
    return getLocalIP();
  }
  async isPortUse(port: number): Promise<boolean> {
    return isPortUse(port);
  }

  async openExplorer(p) {
    return shell.showItemInFolder(p);
  }

  async openDevTools() {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.openDevTools();
    }
  }
  async openBrowser(url: string): Promise<void> {
    let win = new BrowserWindow({
      width: 1280,
      height: 720,
      webPreferences: {
        webSecurity: false,
      },
    });

    await win.loadURL(url, {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    });
  }
  async checkNpx(): Promise<string> {
    let env = getMyDefaultEnvironment();
    let p = await spawnWithOutput("npx", ["--version"], {
      env,
    });
    return p.stdout;
  }
  async checkUV(): Promise<string> {
    let env = getMyDefaultEnvironment();
    let p = await spawnWithOutput("uvx", ["--version"], {
      env,
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
}

export const Command = CommandFactory.prototype;
