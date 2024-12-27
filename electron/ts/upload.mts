//* 检查更新工具类
import { autoUpdater } from "electron-updater";
import { BrowserWindow } from "electron";

//* 引入工具类

import path from "path";
import { getMessageService } from "./mianWindow.mjs";

class CheckUpdate {
  constructor() {
    //* 设置检查更新的url 可以不设置 忽略
    // autoUpdater.setFeedURL("http://127.0.0.1:5500/");
    //* 修改配置地址 dev使用 开发环境需要注释 根据自己路径来，需要获取app-update.yml
    autoUpdater.updateConfigPath = path.join(
      __dirname,
      "../dist/win-unpacked/resources/app-update.yml"
    );
    this.updaterEvent();
  }
  checkUpdate() {
    //* 开始检查更新
    autoUpdater.checkForUpdates().catch((err) => {
      console.log("网络连接问题", err);
    });
  }
  // 退出并安装
  quitAndInstall() {
    autoUpdater.quitAndInstall();
  }
  updaterEvent() {
    //* 监听updater的事件
    /**
     * -1 检查更新失败 0 正在检查更新 1 检测到新版本，准备下载 2 未检测到新版本 3 下载中 4 下载完成
     **/
    // 当开始检查更新的时候触发
    autoUpdater.on("checking-for-update", () => {
      console.log("开始检查更新");
      sendToRender("UpdateMsg", 0);
    });

    // 发现可更新数据时
    autoUpdater.on("update-available", (info) => {
      console.log("有更新", info);
      sendToRender("UpdateMsg", 1);
    });

    // 没有可更新数据时
    autoUpdater.on("update-not-available", (info) => {
      console.log("没有更新", info);
      sendToRender("UpdateMsg", 2);
    });

    // 下载监听
    autoUpdater.on("download-progress", (progressObj) => {
      console.log(progressObj, "下载监听");
      sendToRender(3, progressObj);
    });

    // 下载完成
    autoUpdater.on("update-downloaded", () => {
      console.log("下载完成");
      sendToRender("UpdateMsg", 4);
    });
    // 当更新发生错误的时候触发。
    autoUpdater.on("error", (err) => {
      console.log("更新出现错误", err.message);
      if (err.message.includes("sha512 checksum mismatch")) {
        sendToRender(-1, "sha512校验失败");
      } else {
        sendToRender(-1, "错误信息请看主进程控制台");
      }
    });
  }
}

export default CheckUpdate;
function sendToRender(arg1, arg2) {
  getMessageService().sendToRenderer({
    arg1,
    arg2,
  });
}
