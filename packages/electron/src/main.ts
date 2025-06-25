/**
 * HyperChat Electron 主进程入口文件
 * 
 * 职责：
 * - 初始化 Electron 应用和主窗口
 * - 启动 HTTP 服务器和 WebSocket 连接
 * - 处理 IPC 通信（渲染进程与主进程间通信）
 * - 管理应用生命周期事件
 * - 注册自定义协议处理器
 */

import { Logger } from "@hyperchat/core/polyfills/log.mjs";
import {
  app,
  BrowserWindow,
  ipcMain,
  protocol,
  net,
} from "electron";
import "./polyfills/electron_autoupdate";
import path from "node:path";
import { Command, initHttp } from "./core";
import { createWindow } from "./window/mainWindow";

Logger.info("start main");


// const createWindow = () => {
//   const win = new BrowserWindow({
//     width: 800,
//     height: 600,
//   });

//   win.loadURL("https://www.baidu.com");
// };

/**
 * IPC 命令处理器
 * 
 * 处理来自渲染进程的所有命令请求，统一的错误处理和日志记录
 * 
 * @param event - IPC 事件对象
 * @param name - 命令名称，对应 Command 模块中的方法
 * @param args - 命令参数数组
 * @returns 统一格式的响应对象 {code, success, data/message}
 */
ipcMain.handle("command", async (_event, name: keyof typeof Command, args: any) => {
  try {
    const arr = Array.isArray(args) ? args : [];
    let res = await (Command[name] as any)(...arr);
    if ((name as string) === "getHistory") {
      // getHistory 命令不记录日志，避免日志过多
    } else {
      if ((name as string) === "writeFile") {
        Logger.info(
          name,
          arr[0],
          "writeFile Data length: " + (arr[1]?.length ?? 0)
        );
      } else {
        Logger.info(name, arr);
      }
    }
    return {
      code: 0,
      success: true,
      data: res,
    };
  } catch (e: any) {
    Logger.error(name, args, e);
    return { success: false, code: 1, message: e?.message ?? String(e) };
  }
});

// app.commandLine.appendSwitch("remote-debugging-port", "8315");
// app.commandLine.appendSwitch("enable-usermedia-screen-capturing");
/**
 * 证书错误处理：忽略所有证书错误
 * 主要用于开发环境或自签名证书的场景
 */
app.on(
  "certificate-error",
  (event, _webContents, _url, _error, _certificate, callback) => {
    event.preventDefault();
    callback(true); // 忽略证书错误
  }
);

/**
 * 应用就绪时的初始化流程
 * 
 * 执行顺序：
 * 1. 启动 HTTP 服务器和 WebSocket
 * 2. 创建主窗口
 * 3. 注册自定义协议处理器
 * 4. 监听应用激活事件
 */
app.whenReady().then(async () => {
  // MacOS 下隐藏 dock 图标（可选）
  // if (process.platform == "darwin") {
  //   app.dock.hide();
  // }
  
  // 初始化 HTTP 服务器，处理 Web 请求和 MCP 连接
  await initHttp().catch((e) => {
    Logger.info("initHttp error: ", e);
  });
  
  try {
    createWindow();
  } catch (e) {
    Logger.error(e);
    throw e;
  }

  /**
   * 注册 fs:// 协议处理器
   * 用于访问本地文件系统资源
   */
  protocol.handle("fs", (request) => {
    let p = request.url.replace("fs://", "");
    return net.fetch("file://" + path.join(__dirname, "../", p));
  });

  /**
   * macOS 应用激活事件处理
   * 当点击 dock 图标且没有窗口时重新创建窗口
   */
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});