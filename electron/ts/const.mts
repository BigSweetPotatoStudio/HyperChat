import { app } from "electron";
import path from "path";
import os from "os";
import { fs } from "zx";
import log from "electron-log";
export const userDataPath = app.getPath("userData");

export const dirName = "DadiguaToolbox";
let appDataDir = path.join(os.homedir(), "Documents", dirName);
fs.ensureDirSync(appDataDir);
log.info("appDataDir: ", appDataDir);

export { appDataDir };
