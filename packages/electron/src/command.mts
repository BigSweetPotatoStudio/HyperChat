import { Logger } from "@hyperchat/core/src/polyfills/log.mjs";
import { createBrowser } from "@hyperchat/core/src/mcp/servers/hyper_tools/web2.mjs";
import { getConfig } from "@hyperchat/core/src/mcp/servers/hyper_tools/lib.mjs";
import { checkUpdate } from "./polyfills/electron_autoupdate";
import { autoLauncher } from "./polyfills/electron";

/**
 * ElectronCommandFactory 类封装了 Electron 特有的操作，包括文件选择、剪贴板、浏览器窗口等
 */
export class ElectronCommandFactory {

  async checkUpdate() {
    return checkUpdate.checkUpdate();
  }
  async checkUpdateDownload() {
    checkUpdate.download();
  }

  async quitAndInstall() {
    checkUpdate.quitAndInstall();
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
  // 文件选择对话框
  async selectFile(
    opts: {
      type?: "openFile" | "openDirectory";
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


  // 打开资源管理器
  async openExplorer({
    path: p
  }: {
    path: string;
  }) {
    const { shell } = await import("electron");
    return shell.showItemInFolder(p);
  }

  // 打开开发者工具
  async openDevTools() {
    const { BrowserWindow } = await import("electron");
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.openDevTools();
    }
  }

  // HyperTool 打开浏览器
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

  // 打开浏览器窗口
  async openBrowser({
    url,
    userAgent
  }: {
    url: string;
    userAgent?: string;
  }): Promise<void> {
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
}

// 导出实例
export const ElectronCommand = new ElectronCommandFactory();

// 导出接口类型
export interface ElectronCommand extends ElectronCommandFactory { }