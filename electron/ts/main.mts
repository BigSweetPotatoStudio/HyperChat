import "ts/polyfills/index.mjs";
import "./first.mjs";
import { Logger } from "ts/polyfills/index.mjs";
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
import "ts/polyfills/electron_autoupdate.mjs"
import { Command } from "./command.mjs";
import { fileURLToPath } from "node:url";

import { spawn, exec, execFile } from "child_process";
import { isPortUse } from "./common/checkport.mjs";
import { Server } from "socket.io";
import { execFallback } from "./common/execFallback.mjs";
import p from "../package.json";
import "./websocket.mjs";

import { createWindow } from "./mianWindow.mjs";
import { zx } from "./es6.mjs";
const { $, usePowerShell, fs, cd, fetch, sleep } = zx;

import ELogger from "electron-log";
ELogger.info("starting");

$.verbose = true;
if (os.platform() === "win32") {
  usePowerShell();
}

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
  try {
    createWindow();
  } catch (e) {
    ELogger.error(e);
    throw e;
  }

  if (process.env.myEnv == "prod") {
    Menu.setApplicationMenu(null);
  }

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
