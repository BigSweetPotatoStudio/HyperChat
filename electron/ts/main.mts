import { Logger } from "ts/polyfills/index.mjs";
import "./first.mjs";
import {
  app,
  BrowserWindow,
  nativeImage,
  Tray,
  ipcMain,
  protocol,
  net,
  Menu,
  // desktopCapturer,
  session,
  shell,
} from "electron";
import "ts/polyfills/electron_autoupdate.mjs";
import path from "node:path";
import "./common/data.mjs";
import { Command } from "./command.mjs";

import { initHttp } from "./websocket.mjs";

import { createWindow } from "./mianWindow.mjs";

Logger.info("start main");


// const createWindow = () => {
//   const win = new BrowserWindow({
//     width: 800,
//     height: 600,
//   });

//   win.loadURL("https://www.baidu.com");
// };

ipcMain.handle("command", async (event, name, args) => {
  try {
    let res = await Command[name](...args);
    if (name == "getHistory") {
      // log.info(name, args);
    } else {
      if (name == "writeFile") {
        Logger.info(
          name,
          args[0],
          "writeFile Data length: " + args[1].length
          // res
        );
      } else {
        Logger.info(
          name,
          args
          // res
        );
      }
    }

    return {
      code: 0,
      success: true,
      data: res,
    };
  } catch (e) {
    Logger.error(name, args, e);
    return { success: false, code: 1, message: e.message };
  }
});

// app.commandLine.appendSwitch("remote-debugging-port", "8315");
// app.commandLine.appendSwitch("enable-usermedia-screen-capturing");
app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true); // 忽略证书错误
  }
);

app.whenReady().then(async () => {
  // hide menu for Mac
  // if (process.platform == "darwin") {
  //   app.dock.hide();
  // }
  await initHttp().catch((e) => {
    Logger.info("initHttp error: ", e);
  });
  try {
    createWindow();
  } catch (e) {
    Logger.error(e);
    throw e;
  }


  protocol.handle("fs", (request) => {
    let p = request.url.replace("fs://", "");
    return net.fetch("file://" + path.join(__dirname, "../", p));
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
