import log from "electron-log";
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
import { $, usePowerShell, fs, cd, fetch, sleep, path } from "zx";
import { electronData } from "./common/data.mjs";
import { appDataDir } from "./const.mjs";

await electronData.init();
// 获取日志文件路径
const logFilePath = log.transports.file.getFile().path;
// 清空日志文件
fs.writeFileSync(logFilePath, "");

// 记录新的启动日志
log.info("Application started. Previous logs cleared.");
log.info("__dirname", __dirname);
log.log("process.cwd()", process.cwd());
log.log("execPath: ", process.execPath);
log.info("NODE_ENV: ", process.env.NODE_ENV);
log.info("myEnv: ", process.env.myEnv);

log.info(
  path.join(__dirname, "../web-build/assets/favicon.png"),
  fs.existsSync(path.join(__dirname, "../web-build/assets/favicon.png"))
);

log.info("appDataDir: ", appDataDir);

electronData.get().appDataDir = appDataDir;
electronData.get().logFilePath = logFilePath;
electronData.save();
