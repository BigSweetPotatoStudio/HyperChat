import {
  app,
  BrowserWindow,
  nativeImage,
  Tray,
  ipcMain,
  protocol,
  net,
  Menu,
  desktopCapturer,
  session,
  shell,
} from "electron";
import path from "node:path";
import os from "node:os";
log.info("1");
import { Command } from "./command.mjs";
log.info("2");
import { fileURLToPath } from "node:url";
import { $, usePowerShell, fs, cd, fetch, sleep } from "zx";
import { spawn, exec, execFile } from "child_process";
import { isPortUse } from "./common/checkport.mjs";
import { Server } from "socket.io";
import { execFallback } from "./common/execFallback.mjs";
import p from "../package.json";
import "./websocket.mjs";
import { electron } from "node:process";
import log from "electron-log";
import { userDataPath } from "./const.mjs";
import { createWindow } from "./mianWindow.mjs";

$.verbose = true;
if (os.platform() === "win32") {
  usePowerShell();
}
// 获取日志文件路径
const logFilePath = log.transports.file.getFile().path;

// 清空日志文件
fs.writeFileSync(logFilePath, "");

// 记录新的启动日志
log.info("Application started. Previous logs cleared.");
// log.log("execPath: ", process.execPath);
log.log("process.cwd()", process.cwd());

log.info("NODE_ENV: ", process.env.NODE_ENV);
log.info("myEnv: ", process.env.myEnv);

log.info("userDataPath", userDataPath);
log.info("__dirname", __dirname);

ipcMain.handle("command", async (event, name, args) => {
  try {
    let res = await Command[name](...args);
    if (name == "getHistory") {
      // log.info(name, args);
    } else {
      if (name == "writeFile") {
        log.info(
          name,
          args[0],
          "writeFile Data length: " + args[1].length
          // res
        );
      } else {
        log.info(
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
    log.error(name, args, e);
    return { success: false, code: 1, message: e.message };
  }
});
// let title = `${app.name}-${app.getVersion()} by Dadigua`;

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

  if (process.env.NODE_ENV === "production" && process.env.myEnv !== "test") {
    Menu.setApplicationMenu(null);
  }

  createWindow();

  if (process.platform != "darwin") {
    session.defaultSession.setDisplayMediaRequestHandler(
      (request, callback) => {
        desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
          // Grant access to the first screen found.
          callback({ video: sources[0], audio: "loopback" });
        });
      }
    );
  }

  protocol.handle("fs", (request) => {
    let p = request.url.replace("fs://", "");
    return net.fetch("file://" + path.join(__dirname, "../", p));
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
