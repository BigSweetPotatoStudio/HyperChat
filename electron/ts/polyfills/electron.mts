import ELogger from "electron-log";
import {
  Context,
  LoggerPolyfill,
  AutoLauncher as IAutoLaunch,
  CheckUpdate as ICheckUpdate
} from "./polyfills.mjs";
import { app } from "electron";

class LoggerC extends LoggerPolyfill {
  info(...args: any[]) {
    ELogger.info(...args);
  }
  warn(...args: any[]) {
    ELogger.warn(...args);
  }
  error(...args: any[]) {
    ELogger.error(...args);
  }
  path = ELogger.transports.file.getFile().path;
}

Object.assign(Context.Logger, new LoggerC());
Object.setPrototypeOf(Context.Logger, new LoggerC());

/////////////////////////////
export const userDataPath = app.getPath("userData");

Context.CONST.userDataPath = userDataPath;
Context.CONST.getVersion = app.getVersion();

///////////////////////////

// src/AutoLauncher.ts
import AutoLaunch from "auto-launch";

export class AutoLauncher extends IAutoLaunch {
  declare autoLauncher: AutoLaunch;

  constructor() {
    super();
    // let path = app.getPath("exe");
    // console.log("path: ", path);
    this.autoLauncher = new AutoLaunch({
      name: app.getName(),
      path: app.getPath("exe"),
    });
  }
  async enable() {
    if (!(await this.autoLauncher.isEnabled())) {
      return this.autoLauncher.enable();
    }
  }

  async disable() {
    if (await this.autoLauncher.isEnabled()) {
      await this.autoLauncher.disable();
    }
  }

  async isEnabled() {
    return this.autoLauncher.isEnabled();
  }
}
Object.assign(Context.autoLauncher, new AutoLauncher());
Object.setPrototypeOf(Context.autoLauncher, new AutoLauncher());
///////////////////////////


//* 检查更新工具类
import { autoUpdater } from "electron-updater";

//* 引入工具类

import path from "path";
import { getMessageService } from "../message_service.mjs";


import { Logger } from "ts/polyfills/index.mjs";

// autoUpdater.logger = Logger;

class CheckUpdate extends ICheckUpdate {
  constructor() {
    super();
    //* 设置检查更新的url 可以不设置 忽略
    autoUpdater.autoDownload = false;
    // autoUpdater.forceDevUpdateConfig = true; // 强制使用dev配置
    autoUpdater.setFeedURL({
      provider: "github",
      owner: "BigSweetPotatoStudio",
      repo: "HyperChat",
    });

    //* 修改配置地址 dev使用 开发环境需要注释 根据自己路径来，需要获取app-update.yml
    // log.info(
    //   "check update",
    //   fs.existsSync(path.join(__dirname, "../dist/latest-mac.yml"))
    // );
    // autoUpdater.updateConfigPath = path.join(
    //   __dirname,
    //   "../dist/latest-mac.yml"
    // );
    this.updaterEvent();
  }
  checkUpdate() {
    //* 开始检查更新
    return autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      Logger.info("网络连接问题，检测更新失败", err);
    });
  }
  // 退出并安装
  quitAndInstall() {
    autoUpdater.quitAndInstall();
  }
  download() {
    autoUpdater.downloadUpdate();
  }
  updaterEvent() {
    //* 监听updater的事件
    /**
     * -1 检查更新失败 0 正在检查更新 1 检测到新版本，准备下载 2 未检测到新版本 3 下载中 4 下载完成
     **/
    // 当开始检查更新的时候触发
    autoUpdater.on("checking-for-update", () => {
      Logger.info("开始检查更新");
      sendToRender("UpdateMsg", { status: 0 });
    });

    // 发现可更新数据时
    autoUpdater.on("update-available", (info) => {
      Logger.info("有更新", info);
      sendToRender("UpdateMsg", { status: 1, info: info });
    });

    // 没有可更新数据时
    autoUpdater.on("update-not-available", (info) => {
      Logger.info("没有更新", info);
      sendToRender("UpdateMsg", { status: 2, info: info });
    });

    // 下载监听
    autoUpdater.on("download-progress", (progressObj) => {
      Logger.info("下载监听", progressObj);
      sendToRender("download-progress", progressObj);
    });

    // 下载完成
    autoUpdater.on("update-downloaded", () => {
      Logger.info("下载完成");
      sendToRender("UpdateMsg", { status: 4 });
    });
    // 当更新发生错误的时候触发。
    autoUpdater.on("error", (err) => {
      Logger.info("更新出现错误", err.message);
      if (err.message.includes("sha512 checksum mismatch")) {
        sendToRender(-1, "sha512校验失败");
      } else {
        sendToRender(-1, "错误信息请看主进程控制台");
      }
    });
  }
}

export default CheckUpdate;
function sendToRender(type, data) {
  getMessageService().sendAllToRenderer({
    type: type,
    data: data,
  });
}

Object.assign(Context.checkUpdate, new CheckUpdate());
Object.setPrototypeOf(Context.checkUpdate, new CheckUpdate());
