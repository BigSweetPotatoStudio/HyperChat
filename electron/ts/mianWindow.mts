import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} from "electron";
import { Logger } from "ts/polyfills/index.mjs";
import { get } from "http";
import path from "path";

import { electronData } from "../../common/data";
import p from "../package.json" assert { type: "json" };

let title = `${p.productName}-${app.getVersion()} by Dadigua`;
Logger.info("title   : ", title);

export const createWindow = () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: title,
    autoHideMenuBar: process.env.myEnv == "prod",
    // titleBarOverlay: {
    //   height: 40,
    //   color: "rgba(255,255,255,0.1)",
    //   symbolColor: "#000000",
    // },
    // titleBarStyle: process.platform === 'linux' ? 'default' : 'hidden',
    // fullscreen: true,
    // show: false,
    webPreferences: {
      // nodeIntegration: true,
      // contextIsolation: true,
      webviewTag: true, // 启用 webview 标签
      webSecurity: false,
      preload: path.join(__dirname, "./preload.js"), // 设置预加载的脚本
      sandbox: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, "../web-build/assets/favicon.png"),
  });

  // win.maximize()
  win.show();
  if (process.env.myEnv == "dev") {
    win.loadURL("http://localhost:8080/#/");
  } else {
    win
      .loadURL(
        `http://localhost:${electronData.get().port}/${
          electronData.get().password
        }/#/`
      )
      .catch((e) => {
        let indexFile = path.join(__dirname, "../web-build/index.html");
        win.loadFile(indexFile, {
          hash: "#/",
        });
      });
  }
  // 处理新窗口打开
  win.webContents.setWindowOpenHandler(({ url }) => {
    // console.log("setWindowOpenHandler", url);
    // 根据需要可以添加URL过滤
    if (url.startsWith("mailto")) {
      return { action: "allow" };
    }
    // return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  // 处理页面内链接点击
  win.webContents.on("will-navigate", (event, url) => {
    // console.log("will-navigate", event, url);
    if (url.startsWith("http:") || url.startsWith("https:")) {
      if (url.includes("localhost")) {
        return;
      }
      event.preventDefault();
      shell.openExternal(url);
    } else {
      if (
        url.startsWith("/") ||
        /^[a-zA-Z]:[\\\/]/.test(url) ||
        url.startsWith("file://")
      ) {
        event.preventDefault();
        const localPath = fileUrlToPath(url);
        // console.log("localPath", localPath);
        shell.showItemInFolder(localPath);
      }
    }
  });
  // 触发关闭时触发
  win.on("close", (event) => {
    app.quit();
    // if (process.env.myEnv == "dev") {
    //   app.quit();
    // } else {
    //   // 截获 close 默认行为
    //   event.preventDefault();
    //   // 点击关闭时触发close事件，我们按照之前的思路在关闭时，隐藏窗口，隐藏任务栏窗口
    //   win.hide();

    //   if (process.platform === "darwin") {
    //     app.dock.hide();
    //   } else {
    //     win.setSkipTaskbar(true);
    //   }
    // }
  });
  // 创建原始图标
  // const icon = nativeImage.createFromPath(
  //   path.join(__dirname, "../web-build/assets/favicon.png")
  // );

  // 调整图标大小
  // let trayIcon = icon.resize({
  //   width: 20,
  //   height: 20, // 根据平台调整图标大小,
  // });

  // 新建托盘
  // let tray = new Tray(trayIcon);
  // 托盘名称
  // tray.setToolTip(title);
  // 托盘菜单
  // const contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: "显示",
  //     click: () => {
  //       win.show();
  //     },
  //   },
  //   {
  //     label: "退出",
  //     click: () => {
  //       win.destroy();
  //       app.quit();
  //     },
  //   },
  // ]);
  // // 载入托盘菜单
  // tray.setContextMenu(contextMenu);
  // // 单击触发
  // tray.on("double-click", () => {
  //   // 双击通知区图标实现应用的显示或隐藏
  //   win.isVisible() ? win.hide() : win.show();
  //   if (process.platform === "darwin") {
  //     win.isVisible() ? app.dock.show() : app.dock.hide();
  //   } else {
  //     win.isVisible() ? win.setSkipTaskbar(false) : win.setSkipTaskbar(true);
  //   }
  // });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
};

function fileUrlToPath(fileUrl: string): string {
  // 解码 URL 编码的字符
  const decodedUrl = decodeURIComponent(fileUrl);

  // 移除 file:/// 前缀
  let localPath = decodedUrl.replace(/^file:\/\/\/?/, "");

  // 处理混合斜杠的情况
  localPath = localPath
    // 先统一换成正斜杠
    .replace(/\\/g, "/")
    // 处理重复的斜杠
    .replace(/\/+/g, "/")
    // 最后统一换成反斜杠
    .replace(/\//g, "\\");

  // Windows盘符处理
  if (localPath.match(/^[A-Za-z]:\\?/)) {
    // 确保盘符后有一个反斜杠
    return localPath.replace(/^([A-Za-z]:)\\?/, "$1\\");
  } else if (localPath.startsWith("\\")) {
    // 去掉开头多余的反斜杠
    return localPath.substring(1);
  }

  return localPath;
}
